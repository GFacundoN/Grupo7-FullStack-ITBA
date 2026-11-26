const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const http = require("node:http");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { proteger } = require("../middlewares/auth");
const { crearAuthRouter } = require("../routes/auth.routes");
const { generarToken, verificarToken, ErrorConfiguracionJWT } = require("../utils/jwt");

// Datos exclusivos de pruebas; este archivo no carga .env ni conecta a MongoDB.
const TEST_SECRET = "solo-para-tests-del-middleware-sin-uso-en-produccion-".repeat(2);
const OTHER_SECRET = "otro-secreto-exclusivo-de-pruebas-".repeat(2);
const INTERNAL_DETAIL = "detalle-interno-del-middleware-no-publico";
const ID = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
const OTHER_ID = new mongoose.Types.ObjectId("507f191e810c19729de860ea");
const PASSWORD = "Password123";
const hashPromise = bcrypt.hash(PASSWORD, 12);
let usuarios;

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

  usuarios = new Map([[String(ID), {
    _id: ID, nombre: "Juan Perez", email: "juan@example.com",
    password: await hashPromise, interno: INTERNAL_DETAIL
  }]]);
  // Solo se sustituyen las operaciones de coleccion, con Mongoose y JWT reales.
  t.mock.method(User.collection, "findOne", async (filtro) => {
    const user = filtro._id ? usuarios.get(String(filtro._id)) :
      [...usuarios.values()].find(item => item.email === filtro.email);
    return user ? { ...user } : null;
  });
  t.mock.method(User.collection, "insertOne", async (documento) => {
    usuarios.set(String(documento._id), { ...documento });
    return { acknowledged: true, insertedId: documento._id };
  });
  const errores = t.mock.method(console, "error", () => {});
  const logs = t.mock.method(console, "log", () => {});
  t.after(() => {
    assert.equal(errores.mock.callCount(), 0);
    assert.equal(logs.mock.callCount(), 0);
  });
});

function tokenValido() {
  return jwt.sign({}, TEST_SECRET, { algorithm: "HS256", subject: String(ID), expiresIn: "24h" });
}

async function servidorPrueba(t) {
  const app = express();
  app.use("/api/auth", crearAuthRouter());
  const siguiente = t.mock.fn((req, res) => res.json({ user: req.user }));
  // Ruta exclusiva del test para inspeccionar el contrato reutilizable del middleware.
  app.post("/protegida", express.json(), proteger, siguiente);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const solicitar = async (ruta = "/api/auth/me", opciones = {}) => {
    const response = await fetch(base + ruta, opciones);
    const text = await response.text();
    return { response, text, body: JSON.parse(text) };
  };
  return { base, solicitar, siguiente };
}

function verificarError(resultado, status, token) {
  assert.equal(resultado.response.status, status);
  assert.deepEqual(Object.keys(resultado.body).sort(), ["error", "message", "status"]);
  assert.equal(resultado.body.status, status);
  assert.equal(typeof resultado.body.message, "string");
  assert.ok(resultado.body.message.length > 0);
  if (status === 401) assert.equal(resultado.response.headers.get("www-authenticate"), "Bearer");
  assert.equal(resultado.response.headers.get("cache-control"), "no-store");
  for (const prohibido of [TEST_SECRET, INTERNAL_DETAIL, PASSWORD, "$2b$", "stack", token].filter(Boolean)) {
    assert.equal(resultado.text.includes(prohibido), false);
  }
}

test("verificarToken verifica HS256 sin firmar tokens ni decodificar como autenticacion", (t) => {
  const token = generarToken(ID);
  const verify = t.mock.method(jwt, "verify");
  const sign = t.mock.method(jwt, "sign", () => { throw new Error("No firmar al verificar"); });
  const decode = t.mock.method(jwt, "decode", () => { throw new Error("No autenticar con decode"); });
  // La expiracion de un token emitido proviene de su exp firmado, no del entorno.
  delete process.env.JWT_EXPIRES_IN;
  const payload = verificarToken(token);
  assert.equal(payload.sub, String(ID));
  assert.deepEqual(verify.mock.calls[0].arguments[2], { algorithms: ["HS256"] });
  assert.equal(sign.mock.callCount(), 0);
  assert.equal(decode.mock.callCount(), 0);
});

test("verificarToken diferencia configuracion incorrecta de un JWT invalido", () => {
  delete process.env.JWT_SECRET;
  assert.throws(() => verificarToken("invalido"), ErrorConfiguracionJWT);
  process.env.JWT_SECRET = TEST_SECRET;
  assert.throws(() => verificarToken("invalido"), jwt.JsonWebTokenError);
});

test("GET /me acepta Bearer sin distinguir mayusculas, proyecta solo datos publicos y consulta una vez", async (t) => {
  const { solicitar } = await servidorPrueba(t);
  const token = tokenValido();
  for (const esquema of ["Bearer", "bearer", "BEARER", "bEaReR"]) {
    const antes = User.collection.findOne.mock.callCount();
    const resultado = await solicitar(undefined, { headers: { Authorization: `${esquema} ${token}` } });
    assert.equal(resultado.response.status, 200);
    assert.equal(resultado.response.headers.get("cache-control"), "no-store");
    assert.deepEqual(resultado.body, { user: { _id: String(ID), nombre: "Juan Perez", email: "juan@example.com" } });
    assert.equal(User.collection.findOne.mock.callCount(), antes + 1);
    const llamada = User.collection.findOne.mock.calls[antes];
    assert.equal(String(llamada.arguments[0]._id), String(ID));
    assert.deepEqual(llamada.arguments[1].projection, { _id: 1, nombre: 1, email: 1 });
    assert.equal(resultado.text.includes(token), false);
    assert.equal(resultado.text.includes(await hashPromise), false);
  }
});

const tokensInvalidos = [
  ["otro secreto", () => jwt.sign({}, OTHER_SECRET, { subject: String(ID), expiresIn: "24h" })],
  ["HS384", () => jwt.sign({}, TEST_SECRET, { algorithm: "HS384", subject: String(ID), expiresIn: "24h" })],
  ["HS512", () => jwt.sign({}, TEST_SECRET, { algorithm: "HS512", subject: String(ID), expiresIn: "24h" })],
  ["algoritmo none", () => jwt.sign({}, null, { algorithm: "none", subject: String(ID), expiresIn: "24h" })],
  ["manipulado", () => {
    const partes = tokenValido().split(".");
    const payload = JSON.parse(Buffer.from(partes[1], "base64url"));
    partes[1] = Buffer.from(JSON.stringify({ ...payload, sub: String(OTHER_ID) })).toString("base64url");
    return partes.join(".");
  }],
  ["expirado", () => jwt.sign({}, TEST_SECRET, { subject: String(ID), expiresIn: -60 })],
  ["sin exp", () => jwt.sign({ sub: String(ID) }, TEST_SECRET)],
  ["exp fraccionario", () => jwt.sign({ sub: String(ID), exp: Math.floor(Date.now() / 1000) + 3600.5 }, TEST_SECRET)],
  ["sin sub", () => jwt.sign({}, TEST_SECRET, { expiresIn: "24h" })],
  ["sub invalido", () => jwt.sign({ sub: "invalido" }, TEST_SECRET, { expiresIn: "24h" })],
  ["sub de 12 caracteres", () => jwt.sign({ sub: "abcdefghijkl" }, TEST_SECRET, { expiresIn: "24h" })],
  ["sub no hexadecimal", () => jwt.sign({ sub: "z".repeat(24) }, TEST_SECRET, { expiresIn: "24h" })],
  ["sub numerico", () => jwt.sign({ sub: 123 }, TEST_SECRET, { expiresIn: "24h" })],
  ["sub objeto", () => jwt.sign({ sub: { $ne: null } }, TEST_SECRET, { expiresIn: "24h" })],
  ["nbf futuro", () => jwt.sign({}, TEST_SECRET, { subject: String(ID), expiresIn: "24h", notBefore: "1h" })],
  ["malformado", () => "no.es.un.jwt"],
  ["payload string", () => jwt.sign("texto", TEST_SECRET)]
];
for (const [nombre, crearToken] of tokensInvalidos) {
  test(`proteger rechaza token ${nombre} con 401 sin continuar ni consultar MongoDB`, async (t) => {
    const { solicitar, siguiente } = await servidorPrueba(t);
    const token = crearToken();
    const resultado = await solicitar("/protegida", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    verificarError(resultado, 401, token);
    assert.equal(User.collection.findOne.mock.callCount(), 0);
    assert.equal(siguiente.mock.callCount(), 0);
  });
}

test("GET /me rechaza ausencia de Authorization y headers incompletos o ambiguos", async (t) => {
  const { solicitar } = await servidorPrueba(t);
  for (const header of [undefined, "", "Bearer", "Bearer ", "Basic abc", "Bearer a b", "Bearer  abc", "Bearer\tabc", "Bearer abc,def"]) {
    const headers = header === undefined ? {} : { Authorization: header };
    verificarError(await solicitar(undefined, { headers }), 401);
  }
  assert.equal(User.collection.findOne.mock.callCount(), 0);
});

test("proteger rechaza Authorization duplicado aunque Node descarte uno en headers", async (t) => {
  const { base } = await servidorPrueba(t);
  const token = tokenValido();
  const resultado = await new Promise((resolve, reject) => {
    const request = http.request(base + "/api/auth/me", {
      headers: { Authorization: [`Bearer ${token}`, `Bearer ${token}`] }
    }, response => {
      let text = "";
      response.setEncoding("utf8");
      response.on("data", chunk => { text += chunk; });
      response.on("end", () => resolve({
        response: { status: response.statusCode, headers: new Headers(response.headers) },
        text, body: JSON.parse(text)
      }));
    });
    request.on("error", reject);
    request.end();
  });
  verificarError(resultado, 401, token);
  assert.equal(User.collection.findOne.mock.callCount(), 0);
});

test("proteger no acepta tokens de query/body ni identidades de headers personalizados", async (t) => {
  const { solicitar, siguiente } = await servidorPrueba(t);
  const token = tokenValido();
  verificarError(await solicitar("/api/auth/me?token=" + encodeURIComponent(token)), 401, token);
  verificarError(await solicitar("/protegida", {
    method: "POST", headers: { "Content-Type": "application/json", "X-User-Id": String(ID) },
    body: JSON.stringify({ token, userId: String(ID) })
  }), 401, token);
  assert.equal(User.collection.findOne.mock.callCount(), 0);
  assert.equal(siguiente.mock.callCount(), 0);
});

test("proteger construye req.user y descarta intentos de suplantacion de body/query/headers", async (t) => {
  const { solicitar, siguiente } = await servidorPrueba(t);
  const token = tokenValido();
  const resultado = await solicitar(`/protegida?userId=${OTHER_ID}&token=ajeno`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "X-User-Id": String(OTHER_ID) },
    body: JSON.stringify({ userId: String(OTHER_ID), _id: String(OTHER_ID), user: { id: String(OTHER_ID) }, token: "ajeno" })
  });
  assert.equal(resultado.response.status, 200);
  assert.deepEqual(resultado.body.user, { id: String(ID), _id: String(ID), nombre: "Juan Perez", email: "juan@example.com" });
  assert.equal(siguiente.mock.callCount(), 1);
  const req = siguiente.mock.calls[0].arguments[0];
  assert.deepEqual(req.user, resultado.body.user);
  assert.deepEqual(Object.keys(req.user).sort(), ["_id", "email", "id", "nombre"]);
  for (const prohibido of [token, await hashPromise, TEST_SECRET, INTERNAL_DETAIL]) {
    assert.equal(JSON.stringify(req.user).includes(prohibido), false);
  }
  assert.equal(User.collection.findOne.mock.callCount(), 1);
});

test("proteger devuelve 401 si el usuario ya no existe y no ejecuta next", async (t) => {
  usuarios.delete(String(ID));
  const { solicitar, siguiente } = await servidorPrueba(t);
  verificarError(await solicitar("/protegida", { method: "POST", headers: { Authorization: `Bearer ${tokenValido()}` } }), 401);
  assert.equal(User.collection.findOne.mock.callCount(), 1);
  assert.equal(siguiente.mock.callCount(), 0);
});

for (const valor of [undefined, "", "corta", " ".repeat(40), "<generar-clave-aleatoria-de-al-menos-32-bytes>"]) {
  test(`proteger devuelve 500 con secreto ${valor === undefined ? "ausente" : "invalido-" + String(valor).length}`, async (t) => {
    const token = tokenValido();
    if (valor === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = valor;
    const { solicitar, siguiente } = await servidorPrueba(t);
    verificarError(await solicitar("/protegida", { method: "POST", headers: { Authorization: `Bearer ${token}` } }), 500, token);
    assert.equal(User.collection.findOne.mock.callCount(), 0);
    assert.equal(siguiente.mock.callCount(), 0);
  });
}

for (const [name, status] of [["Error", 500], ["MongoServerSelectionError", 503], ["MongoNetworkError", 503]]) {
  test(`proteger sanitiza ${name} como ${status} sin continuar`, async (t) => {
    t.mock.method(User.collection, "findOne", async () => { throw Object.assign(new Error(INTERNAL_DETAIL), { name }); });
    const { solicitar, siguiente } = await servidorPrueba(t);
    verificarError(await solicitar("/protegida", { method: "POST", headers: { Authorization: `Bearer ${tokenValido()}` } }), status);
    assert.equal(siguiente.mock.callCount(), 0);
  });
}

test("Registro y login entregan no-store y tokens compatibles con GET /me", async (t) => {
  const { solicitar } = await servidorPrueba(t);
  const datos = { nombre: "Ana Perez", email: "ana@example.com", password: PASSWORD };
  for (const [ruta, status] of [["register", 201], ["login", 200]]) {
    const resultado = await solicitar("/api/auth/" + ruta, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos)
    });
    assert.equal(resultado.response.status, status);
    assert.equal(resultado.response.headers.get("cache-control"), "no-store");
    const antes = User.collection.findOne.mock.callCount();
    const me = await solicitar(undefined, { headers: { Authorization: `Bearer ${resultado.body.token}` } });
    assert.equal(me.response.status, 200);
    assert.equal(me.response.headers.get("cache-control"), "no-store");
    assert.deepEqual(me.body, { user: resultado.body.user });
    assert.equal(User.collection.findOne.mock.callCount(), antes + 1);
  }
});
