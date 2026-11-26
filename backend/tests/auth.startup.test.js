const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { spawn } = require("node:child_process");
const path = require("node:path");
const User = require("../models/User");
const { app, startServer } = require("../server");
const { ErrorConfiguracionJWT } = require("../utils/jwt");

const TEST_SECRET = "solo-para-tests-de-arranque-sin-uso-en-produccion-".repeat(2);

beforeEach((t) => {
  const anteriores = {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN
  };
  // Nunca se usa: mongoose.connect se sustituye antes de iniciar el servidor.
  process.env.MONGODB_URI = "mongodb://test.invalid/no-conexion";
  process.env.JWT_SECRET = TEST_SECRET;
  process.env.JWT_EXPIRES_IN = "24h";
  t.after(() => {
    for (const [clave, valor] of Object.entries(anteriores)) {
      if (valor === undefined) delete process.env[clave];
      else process.env[clave] = valor;
    }
  });
  t.mock.method(mongoose, "connect", async () => mongoose);
  t.mock.method(User, "createIndexes", async () => {});
  t.mock.method(User, "listIndexes", async () => [{ key: { email: 1 }, unique: true }]);
});

const configuracionesInvalidas = [
  ["JWT_SECRET", undefined, "ausente"],
  ["JWT_SECRET", "", "vacio"],
  ["JWT_SECRET", " ".repeat(40), "solo espacios"],
  ["JWT_SECRET", "a".repeat(31), "menor a 32 bytes"],
  ["JWT_SECRET", "<generar-clave-aleatoria-de-al-menos-32-bytes>", "marcador de plantilla"],
  ["JWT_EXPIRES_IN", undefined, "ausente"],
  ["JWT_EXPIRES_IN", "", "vacio"],
  ["JWT_EXPIRES_IN", "sin-expiracion", "formato invalido"],
  ["JWT_EXPIRES_IN", "0s", "cero"],
  ["JWT_EXPIRES_IN", "-1h", "negativo"],
  ["JWT_EXPIRES_IN", "1ms", "sin duracion efectiva"],
  ["JWT_EXPIRES_IN", "999999999999999999999999999999999999d", "fuera del rango seguro"]
];

for (const [variable, valor, caso] of configuracionesInvalidas) {
  test(`Arranque bloquea ${variable} ${caso} antes de conectar o escuchar HTTP`, async (t) => {
    if (valor === undefined) delete process.env[variable];
    else process.env[variable] = valor;
    const listen = t.mock.method(app, "listen", () => { throw new Error("No debe escuchar"); });
    const log = t.mock.method(console, "log", () => {});
    const errorLog = t.mock.method(console, "error", () => {});
    await assert.rejects(startServer(0), error => error instanceof ErrorConfiguracionJWT &&
      error.message === "Configuracion JWT invalida");
    assert.equal(mongoose.connect.mock.callCount(), 0);
    assert.equal(User.createIndexes.mock.callCount(), 0);
    assert.equal(User.listIndexes.mock.callCount(), 0);
    assert.equal(listen.mock.callCount(), 0);
    assert.equal(log.mock.callCount(), 0);
    assert.equal(errorLog.mock.callCount(), 0);
  });
}

test("Arranque espera conexion, creacion y verificacion del indice antes de escuchar HTTP", async (t) => {
  let permitirIndice;
  const pendiente = new Promise(resolve => { permitirIndice = resolve; });
  t.mock.method(User, "createIndexes", () => pendiente);
  const listen = t.mock.method(app, "listen");
  const log = t.mock.method(console, "log", () => {});
  const inicio = startServer(0);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(mongoose.connect.mock.callCount(), 1);
  assert.equal(User.createIndexes.mock.callCount(), 1);
  assert.equal(User.listIndexes.mock.callCount(), 0);
  assert.equal(listen.mock.callCount(), 0);
  permitirIndice();
  const server = await inicio;
  t.after(() => new Promise(resolve => server.close(resolve)));
  assert.equal(User.listIndexes.mock.callCount(), 1);
  assert.equal(listen.mock.callCount(), 1);
  assert.equal(log.mock.callCount(), 1);
});

for (const operacion of ["createIndexes", "listIndexes"]) {
  test(`Arranque no abre HTTP si falla ${operacion}`, async (t) => {
    t.mock.method(User, operacion, async () => { throw new Error("Fallo de prueba"); });
    const listen = t.mock.method(app, "listen", () => { throw new Error("No debe escuchar"); });
    await assert.rejects(startServer(0), /Fallo de prueba/);
    assert.equal(listen.mock.callCount(), 0);
  });
}

for (const [nombre, indices] of [
  ["ausente", []],
  ["sin unique", [{ key: { email: 1 } }]],
  ["compuesto", [{ key: { email: 1, nombre: 1 }, unique: true }]],
  ["parcial", [{ key: { email: 1 }, unique: true, partialFilterExpression: { activo: true } }]],
  ["sparse", [{ key: { email: 1 }, unique: true, sparse: true }]]
]) {
  test(`Arranque rechaza indice ${nombre} sin abrir HTTP`, async (t) => {
    t.mock.method(User, "listIndexes", async () => indices);
    const listen = t.mock.method(app, "listen", () => { throw new Error("No debe escuchar"); });
    await assert.rejects(startServer(0), /indice unico/);
    assert.equal(listen.mock.callCount(), 0);
  });
}

test("Arranque no intenta crear indices ni abre HTTP si falla la conexion", async (t) => {
  t.mock.method(mongoose, "connect", async () => { throw new Error("Conexion de prueba fallida"); });
  const listen = t.mock.method(app, "listen", () => { throw new Error("No debe escuchar"); });
  await assert.rejects(startServer(0), /Conexion de prueba fallida/);
  assert.equal(User.createIndexes.mock.callCount(), 0);
  assert.equal(listen.mock.callCount(), 0);
});

test("Verificador de integracion rechaza URI vacia sin informar pruebas reales aprobadas", async () => {
  const resultado = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, "../scripts/verifyAuthMongo.js")], {
      env: { ...process.env, MONGODB_URI: "" }, stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { output += chunk; });
    child.once("error", reject);
    child.once("close", code => resolve({ code, output }));
  });
  assert.equal(resultado.code, 2);
  assert.match(resultado.output, /MONGODB_URI no esta configurada/);
  assert.match(resultado.output, /BLOQUEADA: Conexion real/);
  assert.match(resultado.output, /Limpieza: NO NECESARIA/);
  assert.equal(resultado.output.includes("OK:"), false);
});
