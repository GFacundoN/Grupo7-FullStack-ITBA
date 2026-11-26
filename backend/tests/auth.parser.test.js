const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { gzipSync } = require("node:zlib");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { crearAuthRouter } = require("../routes/auth.routes");
const errorHandler = require("../middlewares/errorHandler");

const TEST_SECRET = "solo-para-tests-del-parser-sin-uso-en-produccion-".repeat(2);
const PASSWORD = "Password-exclusivo-de-prueba";
const EMAIL = "parser@example.com";
const hashPromise = bcrypt.hash(PASSWORD, 12);

beforeEach(async (t) => {
  const anteriores = { JWT_SECRET: process.env.JWT_SECRET, JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN };
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.JWT_EXPIRES_IN = "24h";
  t.after(() => {
    for (const [clave, valor] of Object.entries(anteriores)) {
      if (valor === undefined) delete process.env[clave];
      else process.env[clave] = valor;
    }
  });
  const usuario = { _id: new User()._id, nombre: "Usuario parser", email: EMAIL, password: await hashPromise };
  t.mock.method(User.collection, "findOne", async filtro => filtro.email === EMAIL ? usuario : null);
  t.mock.method(User.collection, "insertOne", async documento => ({ acknowledged: true, insertedId: documento._id }));
  t.mock.method(console, "error", () => {});
});

async function servidorPrueba(t) {
  const app = express();
  app.use("/api/auth", crearAuthRouter());
  // El mismo manejador global del backend, sin sustituir el manejo de errores.
  app.use(errorHandler);
  app.get("/parser-health", (req, res) => res.sendStatus(204));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    enviar: async (ruta, contenido, comprimido) => {
      const response = await fetch(base + "/api/auth/" + ruta, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(comprimido ? { "Content-Encoding": "gzip" } : {}) },
        body: contenido
      });
      const text = await response.text();
      return { response, text, body: JSON.parse(text) };
    },
    sigueActivo: async () => {
      await new Promise(resolve => setImmediate(resolve));
      assert.equal((await fetch(base + "/parser-health")).status, 204);
    }
  };
}

for (const comprimido of [false, true]) {
  test(`Parser acepta JSON ${comprimido ? "gzip" : "sin comprimir"} en registro y login`, async (t) => {
    const { enviar, sigueActivo } = await servidorPrueba(t);
    const codificar = datos => comprimido ? gzipSync(JSON.stringify(datos)) : JSON.stringify(datos);
    const registro = await enviar("register", codificar({ nombre: "Usuario parser", email: "nuevo-parser@example.com", password: PASSWORD }), comprimido);
    assert.equal(registro.response.status, 201);
    assert.deepEqual(Object.keys(registro.body).sort(), ["token", "user"]);
    assert.equal(registro.body.user.email, "nuevo-parser@example.com");
    const login = await enviar("login", codificar({ email: EMAIL, password: PASSWORD }), comprimido);
    assert.equal(login.response.status, 200);
    assert.equal(jwt.verify(login.body.token, TEST_SECRET, { algorithms: ["HS256"] }).sub, login.body.user._id);
    for (const resultado of [registro, login]) {
      assert.equal(resultado.text.includes(PASSWORD), false);
      assert.equal(resultado.text.includes(await hashPromise), false);
      assert.equal(resultado.response.headers.get("cache-control"), "no-store");
    }
    assert.equal(console.error.mock.callCount(), 0);
    await sigueActivo();
  });

  test(`Parser rechaza JSON malformado ${comprimido ? "gzip" : "sin comprimir"} sin consultar MongoDB`, async (t) => {
    const { enviar, sigueActivo } = await servidorPrueba(t);
    const contenido = '{"password":';
    const resultado = await enviar("login", comprimido ? gzipSync(contenido) : contenido, comprimido);
    assert.equal(resultado.response.status, 400);
    assert.deepEqual(resultado.body, { status: 400, error: "Bad Request", message: "El cuerpo de la peticion debe ser un objeto JSON valido" });
    assert.equal(User.collection.findOne.mock.callCount(), 0);
    assert.equal(User.collection.insertOne.mock.callCount(), 0);
    assert.equal(console.error.mock.callCount(), 0);
    await sigueActivo();
  });
}

const contenidoValido = gzipSync(JSON.stringify({ email: EMAIL, password: PASSWORD }));
for (const [nombre, contenido] of [
  ["formato invalido", Buffer.from("esto-no-es-gzip")],
  ["truncado", contenidoValido.subarray(0, contenidoValido.length - 8)],
  ["bytes residuales", Buffer.concat([contenidoValido, Buffer.from("bytes-residuales-invalidos")])]
]) {
  test(`Parser rechaza gzip ${nombre} con 400 seguro y mantiene el servidor activo`, async (t) => {
    const { enviar, sigueActivo } = await servidorPrueba(t);
    const resultado = await enviar("login", contenido, true);
    assert.equal(resultado.response.status, 400);
    assert.deepEqual(resultado.body, { status: 400, error: "Bad Request", message: "El cuerpo de la peticion debe ser un objeto JSON valido" });
    assert.equal(User.collection.findOne.mock.callCount(), 0);
    assert.equal(User.collection.insertOne.mock.callCount(), 0);
    assert.equal(console.error.mock.callCount(), 0);
    await sigueActivo();
  });
}
