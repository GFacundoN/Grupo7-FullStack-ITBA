const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { app } = require("../server");
const { crearAuthRouter } = require("../routes/auth.routes");
const { generarToken } = require("../utils/jwt");

// Exclusivo de pruebas: no se lee ni se imprime el secreto local.
const TEST_SECRET = "solo-para-tests-de-registro-sin-uso-en-produccion-".repeat(2);
const INTERNAL_DETAIL = "detalle-interno-que-no-debe-exponerse";
const DATOS = { nombre: "Juan Perez", email: "juan@example.com", password: "Password123" };

beforeEach((t) => {
  const anteriores = { JWT_SECRET: process.env.JWT_SECRET, JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN };
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.JWT_EXPIRES_IN = "24h";
  t.after(() => {
    for (const [clave, valor] of Object.entries(anteriores)) {
      if (valor === undefined) delete process.env[clave];
      else process.env[clave] = valor;
    }
  });

  // El modelo y Mongoose son reales; solo la coleccion se reemplaza por dobles.
  t.mock.method(User.collection, "findOne", async () => null);
  t.mock.method(User.collection, "insertOne", async (documento) => ({
    acknowledged: true,
    insertedId: documento._id
  }));
  const errores = t.mock.method(console, "error", () => {});
  t.after(() => assert.equal(errores.mock.callCount(), 0, "El registro no debe loguear errores internos"));
});

async function servidorPrueba(t, aplicacion) {
  if (!aplicacion) {
    aplicacion = express();
    // Cada prueba tiene un store del limitador independiente.
    aplicacion.use("/api/auth", crearAuthRouter());
    aplicacion.get("/fuera", (req, res) => res.sendStatus(204));
  }
  const server = aplicacion.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    registrar: async (datos, raw) => {
      const response = await fetch(base + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: raw === undefined ? JSON.stringify(datos) : raw
      });
      const text = await response.text();
      return { response, text, body: JSON.parse(text) };
    }
  };
}

function verificarError(resultado, status) {
  assert.equal(resultado.response.status, status);
  assert.deepEqual(Object.keys(resultado.body).sort(), ["error", "message", "status"]);
  assert.equal(resultado.body.status, status);
  assert.equal(typeof resultado.body.message, "string");
  assert.ok(resultado.body.message.length > 0);
  for (const prohibido of [INTERNAL_DETAIL, TEST_SECRET, DATOS.password, "$2b$", "stack", "keyValue"]) {
    assert.equal(resultado.text.includes(prohibido), false);
  }
}

function sinEscrituras() {
  assert.equal(User.collection.insertOne.mock.callCount(), 0);
}

test("Registro integrado: 201, normalizacion, hash de costo 12 y JWT publico con sub y expiracion", async (t) => {
  const { registrar } = await servidorPrueba(t, app);
  const password = "  Password123  ";
  const resultado = await registrar({ ...DATOS, nombre: "  Juan Perez  ", email: "  JUAN@Example.COM  ", password });
  assert.equal(resultado.response.status, 201);
  assert.deepEqual(Object.keys(resultado.body).sort(), ["token", "user"]);
  const enviado = User.collection.insertOne.mock.calls[0].arguments[0];
  assert.equal(User.collection.insertOne.mock.callCount(), 1);
  assert.equal(enviado.nombre, "Juan Perez");
  assert.equal(enviado.email, "juan@example.com");
  assert.deepEqual(User.collection.findOne.mock.calls[0].arguments[0], { email: "juan@example.com" });
  assert.match(enviado.password, /^\$2b\$12\$[./A-Za-z0-9]{53}$/);
  assert.equal(await bcrypt.compare(password, enviado.password), true);
  assert.equal(await bcrypt.compare(password.trim(), enviado.password), false);
  assert.deepEqual(resultado.body.user, { _id: String(enviado._id), nombre: "Juan Perez", email: "juan@example.com" });
  assert.equal(resultado.text.includes(password), false);
  assert.equal(resultado.text.includes(enviado.password), false);

  const verificado = jwt.verify(resultado.body.token, TEST_SECRET, { algorithms: ["HS256"], complete: true });
  assert.equal(verificado.header.alg, "HS256");
  assert.equal(verificado.payload.sub, String(enviado._id));
  assert.equal(verificado.payload.exp - verificado.payload.iat, 86400);
  assert.deepEqual(Object.keys(verificado.payload).sort(), ["exp", "iat", "sub"]);

  // Tambien comprobar el orden de montaje real frente al parser JSON global.
  verificarError(await registrar(null, '{"password":"' + INTERNAL_DETAIL + '"'), 400);
  assert.equal(User.collection.insertOne.mock.callCount(), 1);
});

test("Registro rechaza bodies que no sean objetos y JSON malformado sin filtrar contenido", async (t) => {
  const { registrar } = await servidorPrueba(t);
  for (const body of [undefined, null, [], "texto", true, 42]) {
    verificarError(await registrar(body), 400);
  }
  verificarError(await registrar(null, '{"password":"' + INTERNAL_DETAIL + '"'), 400);
  assert.equal(User.collection.findOne.mock.callCount(), 0);
  sinEscrituras();
});

test("Registro rechaza cada campo obligatorio faltante", async (t) => {
  const { registrar } = await servidorPrueba(t);
  for (const campo of ["nombre", "email", "password"]) {
    const datos = { ...DATOS };
    delete datos[campo];
    verificarError(await registrar(datos), 400);
  }
  sinEscrituras();
});

test("Registro rechaza nombres fuera del rango permitido despues de trim", async (t) => {
  const { registrar } = await servidorPrueba(t);
  for (const nombre of ["", "  ", " a ", "x".repeat(101)]) {
    verificarError(await registrar({ ...DATOS, nombre }), 400);
  }
  sinEscrituras();
});

test("Registro rechaza emails invalidos y mayores a 254 caracteres", async (t) => {
  const { registrar } = await servidorPrueba(t);
  for (const email of ["", "sin-arroba", "a@", "@example.com", "a@example", "a b@example.com", "a@@example.com", "x".repeat(243) + "@example.com"]) {
    verificarError(await registrar({ ...DATOS, email }), 400);
  }
  sinEscrituras();
});

test("Registro rechaza claves cortas o mayores a 72 bytes UTF-8", async (t) => {
  const { registrar } = await servidorPrueba(t);
  for (const password of ["", "1234567", "🙂".repeat(4), "a".repeat(73), "é".repeat(37), "🙂".repeat(19)]) {
    verificarError(await registrar({ ...DATOS, password }), 400);
  }
  sinEscrituras();
});

test("Registro admite exactamente 72 bytes UTF-8 sin truncar la clave", async (t) => {
  const { registrar } = await servidorPrueba(t);
  const password = "é".repeat(36);
  assert.equal(Buffer.byteLength(password, "utf8"), 72);
  const resultado = await registrar({ ...DATOS, password });
  assert.equal(resultado.response.status, 201);
  const enviado = User.collection.insertOne.mock.calls[0].arguments[0];
  assert.equal(await bcrypt.compare(password, enviado.password), true);
});

for (const campo of ["nombre", "email", "password"]) {
  test(`Registro rechaza objetos, arrays y null en ${campo}`, async (t) => {
    const { registrar } = await servidorPrueba(t);
    for (const valor of [{ $ne: null }, ["texto"], null, 123, true]) {
      verificarError(await registrar({ ...DATOS, [campo]: valor }), 400);
    }
    sinEscrituras();
  });
}

test("Registro descarta role, _id, permisos y operadores antes de crear el usuario", async (t) => {
  const crear = t.mock.method(User, "create", async (datos) => new User(datos));
  const { registrar } = await servidorPrueba(t);
  const resultado = await registrar({ ...DATOS, role: "admin", _id: "no-autorizado", permisos: ["todo"], isAdmin: true, $set: { role: "admin" } });
  assert.equal(resultado.response.status, 201);
  const datos = crear.mock.calls[0].arguments[0];
  assert.deepEqual(Object.keys(datos).sort(), ["email", "nombre", "password"]);
  assert.deepEqual(Object.keys(resultado.body.user).sort(), ["_id", "email", "nombre"]);
  assert.notEqual(resultado.body.user._id, "no-autorizado");
});

test("Registro devuelve 409 si el email normalizado ya existe, sin escribir", async (t) => {
  t.mock.method(User.collection, "findOne", async () => ({ nombre: DATOS.nombre, email: DATOS.email }));
  const { registrar } = await servidorPrueba(t);
  verificarError(await registrar({ ...DATOS, email: " JUAN@EXAMPLE.COM " }), 409);
  assert.deepEqual(User.collection.findOne.mock.calls[0].arguments[0], { email: DATOS.email });
  sinEscrituras();
});

test("Registro devuelve 409 ante 11000 concurrente durante la creacion", async (t) => {
  t.mock.method(User.collection, "insertOne", async () => {
    throw Object.assign(new Error(INTERNAL_DETAIL), { code: 11000, keyValue: { email: DATOS.email } });
  });
  const { registrar } = await servidorPrueba(t);
  verificarError(await registrar(DATOS), 409);
  assert.equal(User.collection.insertOne.mock.callCount(), 1);
});

for (const operacion of ["findOne", "insertOne"]) {
  test(`Registro oculta errores inesperados de ${operacion} con 500`, async (t) => {
    t.mock.method(User.collection, operacion, async () => { throw new Error(INTERNAL_DETAIL); });
    const { registrar } = await servidorPrueba(t);
    verificarError(await registrar(DATOS), 500);
    if (operacion === "findOne") sinEscrituras();
  });
}

test("Registro devuelve 503 generico ante base no disponible", async (t) => {
  t.mock.method(User.collection, "findOne", async () => {
    throw Object.assign(new Error(INTERNAL_DETAIL), { name: "MongoServerSelectionError" });
  });
  const { registrar } = await servidorPrueba(t);
  verificarError(await registrar(DATOS), 503);
  sinEscrituras();
});

const configuracionesInvalidas = [
  { variable: "JWT_SECRET", valor: undefined },
  { variable: "JWT_SECRET", valor: "" },
  { variable: "JWT_SECRET", valor: " ".repeat(40) },
  { variable: "JWT_SECRET", valor: "corta" },
  { variable: "JWT_SECRET", valor: "<generar-clave-aleatoria-de-al-menos-32-bytes>" },
  { variable: "JWT_EXPIRES_IN", valor: undefined },
  { variable: "JWT_EXPIRES_IN", valor: "" },
  { variable: "JWT_EXPIRES_IN", valor: "sin-expiracion" },
  { variable: "JWT_EXPIRES_IN", valor: "0s" },
  { variable: "JWT_EXPIRES_IN", valor: "-1h" },
  { variable: "JWT_EXPIRES_IN", valor: "1ms" },
  { variable: "JWT_EXPIRES_IN", valor: "999999999999999999999999999999999999d" }
];
configuracionesInvalidas.forEach(({ variable, valor }, indice) => {
  test(`Registro rechaza configuracion JWT invalida ${indice + 1} antes de consultar o persistir`, async (t) => {
    if (valor === undefined) delete process.env[variable];
    else process.env[variable] = valor;
    const { registrar } = await servidorPrueba(t);
    verificarError(await registrar(DATOS), 500);
    assert.equal(User.collection.findOne.mock.callCount(), 0);
    sinEscrituras();
  });
});

test("Registro conserva la configuracion JWT validada aunque cambie durante un await", async (t) => {
  t.mock.method(User.collection, "findOne", async () => {
    delete process.env.JWT_SECRET;
    process.env.JWT_EXPIRES_IN = "invalida";
    return null;
  });
  const { registrar } = await servidorPrueba(t);
  const resultado = await registrar(DATOS);
  assert.equal(resultado.response.status, 201);
  assert.equal(jwt.verify(resultado.body.token, TEST_SECRET, { algorithms: ["HS256"] }).sub, resultado.body.user._id);
});

test("Generador JWT reutilizable firma solo sub, iat y exp con la configuracion del entorno", () => {
  const token = generarToken(123);
  const payload = jwt.verify(token, TEST_SECRET, { algorithms: ["HS256"] });
  assert.equal(payload.sub, "123");
  assert.equal(payload.exp - payload.iat, 86400);
  assert.deepEqual(Object.keys(payload).sort(), ["exp", "iat", "sub"]);
});

test("Registro limita la solicitud 11 con 429 y no limita otras rutas", async (t) => {
  const { registrar, base } = await servidorPrueba(t);
  for (let intento = 0; intento < 10; intento++) {
    verificarError(await registrar({}), 400);
  }
  const limitado = await registrar({});
  verificarError(limitado, 429);
  assert.ok(limitado.response.headers.get("retry-after"));
  assert.ok(limitado.response.headers.get("ratelimit"));
  assert.equal((await fetch(base + "/fuera")).status, 204);
  assert.equal((await fetch(base + "/api/auth/register")).status, 404);
  sinEscrituras();
});
