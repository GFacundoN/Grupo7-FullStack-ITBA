const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { crearAuthRouter } = require("../routes/auth.routes");
const { validarLogin } = require("../middlewares/validarAuth");

// Este archivo no carga .env ni utiliza una conexion a MongoDB.
const TEST_SECRET = "solo-para-tests-de-login-sin-uso-en-produccion-".repeat(2);
const INTERNAL_DETAIL = "detalle-interno-login-que-no-debe-exponerse";
const PASSWORD = "  Password123  ";
const DATOS = { email: "juan@example.com", password: PASSWORD };
const ID = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
const hashPromise = bcrypt.hash(PASSWORD, 12);

async function cuenta() {
  return { _id: ID, nombre: "Juan Perez", email: DATOS.email, password: await hashPromise };
}

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

  const usuario = await cuenta();
  t.mock.method(User.collection, "findOne", async (filtro) => filtro.email === DATOS.email ? { ...usuario } : null);
  const insertOne = t.mock.method(User.collection, "insertOne", async () => {
    throw new Error("Login nunca debe escribir usuarios");
  });
  t.mock.method(bcrypt, "compare"); // Spy que conserva la comparacion real.
  const errores = t.mock.method(console, "error", () => {});
  const logs = t.mock.method(console, "log", () => {});
  t.after(() => {
    assert.equal(insertOne.mock.callCount(), 0);
    assert.equal(errores.mock.callCount(), 0);
    assert.equal(logs.mock.callCount(), 0);
  });
});

async function servidorPrueba(t) {
  const app = express();
  app.use("/api/auth", crearAuthRouter());
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  const base = `http://127.0.0.1:${server.address().port}/api/auth`;
  return async (datos, ruta = "/login", raw) => {
    const response = await fetch(base + ruta, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw === undefined ? JSON.stringify(datos) : raw
    });
    const text = await response.text();
    return { response, text, body: JSON.parse(text) };
  };
}

function verificarError(resultado, status) {
  assert.equal(resultado.response.status, status);
  assert.deepEqual(Object.keys(resultado.body).sort(), ["error", "message", "status"]);
  assert.equal(resultado.body.status, status);
  assert.equal(typeof resultado.body.message, "string");
  assert.ok(resultado.body.message.length > 0);
  for (const prohibido of [INTERNAL_DETAIL, TEST_SECRET, PASSWORD, "$2b$", "stack", "keyValue"]) {
    assert.equal(resultado.text.includes(prohibido), false);
  }
  if (status === 401) {
    assert.deepEqual(resultado.body, { status: 401, error: "Unauthorized", message: "Credenciales invalidas" });
  }
}

function sinConsultaNiComparacion() {
  assert.equal(User.collection.findOne.mock.callCount(), 0);
  assert.equal(bcrypt.compare.mock.callCount(), 0);
}

test("Login 200: normaliza email, selecciona password, compara bcrypt y entrega JWT publico", async (t) => {
  const select = t.mock.method(User.Query.prototype, "select");
  const login = await servidorPrueba(t);
  const resultado = await login({ ...DATOS, email: "  JUAN@Example.COM  " });
  assert.equal(resultado.response.status, 200);
  assert.deepEqual(User.collection.findOne.mock.calls[0].arguments[0], { email: DATOS.email });
  assert.ok(select.mock.calls.some(call => call.arguments[0] === "+password"));
  assert.notEqual(User.collection.findOne.mock.calls[0].arguments[1].projection?.password, 0);
  assert.deepEqual(bcrypt.compare.mock.calls[0].arguments, [PASSWORD, await hashPromise]);
  assert.equal(await bcrypt.compare.mock.calls[0].result, true);
  assert.deepEqual(Object.keys(resultado.body).sort(), ["token", "user"]);
  assert.deepEqual(resultado.body.user, { _id: String(ID), nombre: "Juan Perez", email: DATOS.email });
  assert.equal(resultado.text.includes(PASSWORD), false);
  assert.equal(resultado.text.includes(await hashPromise), false);
  assert.equal(resultado.text.includes(TEST_SECRET), false);
  const verificado = jwt.verify(resultado.body.token, TEST_SECRET, { algorithms: ["HS256"], complete: true });
  assert.equal(verificado.header.alg, "HS256");
  assert.equal(verificado.payload.sub, String(ID));
  assert.equal(verificado.payload.exp - verificado.payload.iat, 86400);
  assert.deepEqual(Object.keys(verificado.payload).sort(), ["exp", "iat", "sub"]);
});

test("Login preserva espacios de la clave y rechaza su version recortada", async (t) => {
  const login = await servidorPrueba(t);
  assert.equal((await login(DATOS)).response.status, 200);
  verificarError(await login({ ...DATOS, password: PASSWORD.trim() }), 401);
  assert.equal(bcrypt.compare.mock.calls[0].arguments[0], PASSWORD);
  assert.equal(bcrypt.compare.mock.calls[1].arguments[0], PASSWORD.trim());
});

test("Login responde exactamente el mismo 401 para usuario inexistente y clave incorrecta", async (t) => {
  const login = await servidorPrueba(t);
  const inexistente = await login({ ...DATOS, email: "nadie@example.com" });
  const incorrecta = await login({ ...DATOS, password: "clave-incorrecta" });
  verificarError(inexistente, 401);
  verificarError(incorrecta, 401);
  assert.equal(inexistente.text, incorrecta.text);
});

test("Login compara realmente con un hash ficticio valido de costo 12 sin generarlo por solicitud", async (t) => {
  t.mock.method(bcrypt, "hash", () => { throw new Error("No generar hashes durante login"); });
  const login = await servidorPrueba(t);
  for (let intento = 0; intento < 2; intento++) {
    verificarError(await login({ ...DATOS, email: "nadie@example.com" }), 401);
  }
  assert.equal(bcrypt.compare.mock.callCount(), 2);
  const primerHash = bcrypt.compare.mock.calls[0].arguments[1];
  assert.equal(bcrypt.getRounds(primerHash), 12);
  assert.match(primerHash, /^\$2b\$12\$[./A-Za-z0-9]{53}$/);
  assert.equal(await bcrypt.compare.mock.calls[0].result, false);
  assert.equal(bcrypt.compare.mock.calls[1].arguments[1], primerHash);
  assert.equal(bcrypt.hash.mock.callCount(), 0);
});

test("Login nunca autentica usuario inexistente aunque la comparacion ficticia devuelva true", async (t) => {
  t.mock.method(bcrypt, "compare", async () => true);
  const login = await servidorPrueba(t);
  verificarError(await login({ ...DATOS, email: "nadie@example.com" }), 401);
  assert.equal(bcrypt.compare.mock.callCount(), 1);
});

test("Login rechaza bodies que no sean objetos y JSON malformado sin filtrar contenido", async (t) => {
  const login = await servidorPrueba(t);
  for (const body of [undefined, null, [], "texto", true, 42]) {
    verificarError(await login(body), 400);
  }
  verificarError(await login(null, "/login", '{"password":"' + INTERNAL_DETAIL + '"'), 400);
  sinConsultaNiComparacion();
});

test("Login rechaza campos obligatorios faltantes", async (t) => {
  const login = await servidorPrueba(t);
  for (const campo of ["email", "password"]) {
    const datos = { ...DATOS };
    delete datos[campo];
    verificarError(await login(datos), 400);
  }
  sinConsultaNiComparacion();
});

test("Login rechaza email invalido, vacio o mayor a 254 caracteres", async (t) => {
  const login = await servidorPrueba(t);
  for (const email of ["", " ", "sin-arroba", "a@", "@example.com", "a@example", "a b@example.com", "a@@example.com", "x".repeat(243) + "@example.com"]) {
    verificarError(await login({ ...DATOS, email }), 400);
  }
  sinConsultaNiComparacion();
});

test("Login rechaza clave vacia o mayor a 72 bytes UTF-8", async (t) => {
  const login = await servidorPrueba(t);
  for (const password of ["", "a".repeat(73), "é".repeat(37), "🙂".repeat(19)]) {
    verificarError(await login({ ...DATOS, password }), 400);
  }
  sinConsultaNiComparacion();
});

test("Login no impone el minimo de registro ni aplica trim a claves de espacios", async (t) => {
  const login = await servidorPrueba(t);
  for (const password of ["x", "   "]) {
    verificarError(await login({ ...DATOS, password }), 401);
  }
  assert.deepEqual(bcrypt.compare.mock.calls.map(call => call.arguments[0]), ["x", "   "]);
});

test("Login admite una clave de exactamente 72 bytes UTF-8", async (t) => {
  const password = "é".repeat(36);
  const usuario = { ...await cuenta(), password: await bcrypt.hash(password, 12) };
  t.mock.method(User.collection, "findOne", async () => usuario);
  const login = await servidorPrueba(t);
  assert.equal((await login({ ...DATOS, password })).response.status, 200);
});

for (const campo of ["email", "password"]) {
  test(`Login rechaza objetos, arrays, operadores MongoDB y null en ${campo}`, async (t) => {
    const login = await servidorPrueba(t);
    for (const valor of [{ $ne: null }, { $regex: ".*" }, ["texto"], null, 123, true]) {
      verificarError(await login({ ...DATOS, [campo]: valor }), 400);
    }
    sinConsultaNiComparacion();
  });
}

test("validarLogin construye req.datos solo con email y password", () => {
  const req = { body: { ...DATOS, email: " JUAN@EXAMPLE.COM ", _id: "ajeno", role: "admin", permisos: ["todo"], $where: "operador" } };
  let next = false;
  validarLogin(req, { status: () => { throw new Error("Datos validos rechazados"); } }, () => { next = true; });
  assert.equal(next, true);
  assert.deepEqual(req.datos, DATOS);
});

test("Login devuelve solo datos publicos aunque el documento tenga atributos adicionales", async (t) => {
  const usuario = { ...await cuenta(), role: "admin", permisos: ["todo"], interno: INTERNAL_DETAIL };
  t.mock.method(User.collection, "findOne", async () => usuario);
  const login = await servidorPrueba(t);
  const resultado = await login({ ...DATOS, _id: "ajeno", role: "admin" });
  assert.equal(resultado.response.status, 200);
  assert.deepEqual(Object.keys(resultado.body.user).sort(), ["_id", "email", "nombre"]);
  assert.equal(resultado.text.includes(INTERNAL_DETAIL), false);
  assert.equal(resultado.text.includes(usuario.password), false);
});

for (const [variable, valor] of [["JWT_SECRET", undefined], ["JWT_SECRET", "corta"], ["JWT_EXPIRES_IN", "invalida"]]) {
  test(`Login rechaza configuracion JWT invalida ${variable}/${valor === undefined ? "ausente" : "invalida"} antes de consultar`, async (t) => {
    if (valor === undefined) delete process.env[variable];
    else process.env[variable] = valor;
    const login = await servidorPrueba(t);
    verificarError(await login(DATOS), 500);
    sinConsultaNiComparacion();
  });
}

test("Login conserva la configuracion JWT validada antes de consultar", async (t) => {
  const usuario = await cuenta();
  t.mock.method(User.collection, "findOne", async () => {
    delete process.env.JWT_SECRET;
    process.env.JWT_EXPIRES_IN = "invalida";
    return usuario;
  });
  const login = await servidorPrueba(t);
  const resultado = await login(DATOS);
  assert.equal(resultado.response.status, 200);
  assert.equal(jwt.verify(resultado.body.token, TEST_SECRET, { algorithms: ["HS256"] }).sub, String(ID));
});

for (const [name, status] of [["Error", 500], ["MongoServerSelectionError", 503], ["MongoNetworkError", 503]]) {
  test(`Login sanitiza ${name} como HTTP ${status}`, async (t) => {
    t.mock.method(User.collection, "findOne", async () => {
      throw Object.assign(new Error(INTERNAL_DETAIL), { name });
    });
    const login = await servidorPrueba(t);
    verificarError(await login(DATOS), status);
    assert.equal(bcrypt.compare.mock.callCount(), 0);
  });
}

test("Login sanitiza un error inesperado de bcrypt", async (t) => {
  t.mock.method(bcrypt, "compare", async () => { throw new Error(INTERNAL_DETAIL); });
  const login = await servidorPrueba(t);
  verificarError(await login(DATOS), 500);
});

test("Login limita con 429 el intento 11 de credenciales incorrectas", async (t) => {
  const login = await servidorPrueba(t);
  for (let intento = 0; intento < 10; intento++) {
    verificarError(await login({ ...DATOS, password: "incorrecta" }), 401);
  }
  const bloqueado = await login(DATOS);
  verificarError(bloqueado, 429);
  assert.equal(bcrypt.compare.mock.callCount(), 10);
  assert.ok(bloqueado.response.headers.get("retry-after"));
  assert.ok(bloqueado.response.headers.get("ratelimit"));
});

test("Limitar login no consume el contador de registro", async (t) => {
  const solicitar = await servidorPrueba(t);
  for (let intento = 0; intento < 10; intento++) verificarError(await solicitar({}), 400);
  verificarError(await solicitar({}), 429);
  for (let intento = 0; intento < 10; intento++) verificarError(await solicitar({}, "/register"), 400);
  verificarError(await solicitar({}, "/register"), 429);
  sinConsultaNiComparacion();
});

test("Limitar registro no bloquea un login valido", async (t) => {
  const solicitar = await servidorPrueba(t);
  for (let intento = 0; intento < 10; intento++) verificarError(await solicitar({}, "/register"), 400);
  verificarError(await solicitar({}, "/register"), 429);
  assert.equal((await solicitar(DATOS)).response.status, 200);
});

test("Login exitoso no consume permanentemente el limite y los fallos siguen contando", async (t) => {
  const login = await servidorPrueba(t);
  for (let intento = 0; intento < 12; intento++) {
    assert.equal((await login(DATOS)).response.status, 200);
  }
  for (let intento = 0; intento < 10; intento++) verificarError(await login({}), 400);
  verificarError(await login({}), 429);
});
