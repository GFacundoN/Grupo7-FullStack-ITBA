const assert = require("node:assert/strict");
const { randomBytes, randomUUID } = require("node:crypto");
const { once } = require("node:events");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Este proceso controla explicitamente las unicas escrituras de prueba.
mongoose.set("autoCreate", false);
mongoose.set("autoIndex", false);
const User = require("../models/User");
const Product = require("../models/Product");
const { app } = require("../server"); // Carga .env; no ejecuta connectDB/startServer.
const { crearAuthRouter } = require("../routes/auth.routes");
const { validarConfiguracionJWT } = require("../utils/jwt");
const asegurarIndiceUsuarios = require("../utils/asegurarIndiceUsuarios");

const BASE_TEST = "hermanos_jota_auth_test";
const BASE_PRODUCTOS = "hermanos_jota";
const CASOS = [
  "Conexion real, ping y aislamiento",
  "Indice unico real users.email",
  "Registro 201, persistencia y normalizacion",
  "Hash bcrypt de costo 12 y respuesta sin secretos",
  "Registro duplicado devuelve 409",
  "MongoDB rechaza duplicado con 11000",
  "Registro concurrente devuelve 201/409 y persiste un solo usuario",
  "Registro invalido devuelve 400",
  "Login correcto devuelve 200 y JWT valido",
  "Login incorrecto e inexistente devuelven el mismo 401",
  "GET /me valido devuelve 200 y datos publicos",
  "GET /me sin token devuelve 401",
  "GET /me rechaza token invalido, expirado y manipulado",
  "GET /me ignora identificadores ajenos enviados por el cliente",
  "Token de usuario eliminado devuelve 401",
  "Login devuelve 429 sin consumir el contador de registro",
  "Registro devuelve 429 sin bloquear login",
  "GET /api/productos devuelve 200 sin escrituras",
  "GET /api/productos/:id existente devuelve 200 sin escrituras",
  "GET /api/productos/:id inexistente devuelve 404"
];

class RequisitoPendiente extends Error {}
class PruebaOmitida extends Error {}

function comprobarAislamiento() {
  if (BASE_TEST === BASE_PRODUCTOS || mongoose.connection.readyState !== 1 ||
      mongoose.connection.name !== BASE_TEST || User.db !== mongoose.connection ||
      User.collection.name !== "users") {
    throw new Error("No se pudo garantizar el aislamiento de usuarios");
  }
}

async function verificarAuthMongo() {
  const resultados = CASOS.map(nombre => ({ nombre, estado: "NO EJECUTADA" }));
  const ejecucion = randomUUID().replaceAll("-", "");
  const emails = Object.fromEntries(["principal", "concurrente", "eliminado", "limite", "bloqueado"]
    .map(tipo => [tipo, `auth-${ejecucion}-${tipo}@example.com`]));
  const filtroPropio = { email: { $in: Object.values(emails) } };
  const password = randomBytes(24).toString("hex");
  const servidores = new Set();
  let fuenteProductos;
  let limpiezaPermitida = false;
  let limpieza = "NO NECESARIA: no se habilitaron escrituras";
  let configuracion;
  let base;
  let principal;
  let almacenado;
  const uri = process.env.MONGODB_URI;

  async function paso(indice, verificar) {
    try {
      await verificar();
      resultados[indice].estado = "OK";
    } catch (error) {
      if (error instanceof PruebaOmitida) resultados[indice].estado = "OMITIDA: catalogo vacio";
      else {
        resultados[indice].estado = error instanceof RequisitoPendiente ? "BLOQUEADA" : "FALLO";
        throw error;
      }
    }
  }

  async function servir(aplicacion) {
    const server = aplicacion.listen(0, "127.0.0.1");
    servidores.add(server);
    await once(server, "listening");
    return `http://127.0.0.1:${server.address().port}`;
  }

  async function cerrarServidor(server) {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
    servidores.delete(server);
  }

  async function solicitar(ruta, opciones = {}, origen = base) {
    comprobarAislamiento();
    const response = await fetch(origen + ruta, opciones);
    const text = await response.text();
    for (const secreto of [password, configuracion?.secret, uri].filter(Boolean)) {
      assert.equal(text.includes(secreto), false);
    }
    assert.equal(text.includes("$2b$"), false);
    return { status: response.status, headers: response.headers, body: JSON.parse(text) };
  }

  function registrar(email, datos = {}, origen = base) {
    return solicitar("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Usuario de prueba", email, password, ...datos })
    }, origen);
  }

  function login(email, clave = password, origen = base) {
    return solicitar("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: clave })
    }, origen);
  }

  function me(token, query = "") {
    return solicitar("/api/auth/me" + query, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  }

  function usuarioPublico(user) {
    assert.deepEqual(Object.keys(user).sort(), ["_id", "email", "nombre"]);
    assert.ok(mongoose.isObjectIdOrHexString(user._id));
  }

  try {
    await paso(0, async () => {
      if (!uri?.trim()) throw new RequisitoPendiente("MONGODB_URI no esta configurada; no se intento conectar ni escribir.");
      configuracion = validarConfiguracionJWT();
      assert.equal(mongoose.connection.readyState, 0);
      // No usar connectDB(): fija hermanos_jota. El nombre de testing es obligatorio.
      await mongoose.connect(uri, {
        dbName: BASE_TEST, autoCreate: false, autoIndex: false,
        serverSelectionTimeoutMS: 5000, socketTimeoutMS: 15000
      });
      comprobarAislamiento();
      await mongoose.connection.db.command({ ping: 1 });
      console.log("OK: conexion y ping reales en la base de testing; aun sin escrituras.");
      try {
        assert.equal(await User.countDocuments(filtroPropio), 0);
      } catch (error) {
        if (error.code === 13 || (error.code === 8000 &&
            /not authorized|unauthorized|not allowed|not permitted|permission|privilege/i.test(error.message))) {
          throw new RequisitoPendiente("Faltan permisos sobre hermanos_jota_auth_test. Configurar readWrite para esa base; no se habilitaron escrituras.");
        }
        throw error;
      }
      limpiezaPermitida = true;
    });

    await paso(1, async () => {
      comprobarAislamiento();
      await asegurarIndiceUsuarios();
      const indices = await User.listIndexes();
      assert.ok(indices.some(indice => indice.key.email === 1 && indice.unique === true));
      base = await servir(app);
    });

    await paso(2, async () => {
      const resultado = await registrar(`  ${emails.principal.toUpperCase()}  `, { nombre: "  Usuario de prueba  " });
      assert.equal(resultado.status, 201);
      assert.equal(resultado.headers.get("cache-control"), "no-store");
      assert.deepEqual(Object.keys(resultado.body).sort(), ["token", "user"]);
      principal = resultado.body;
      usuarioPublico(principal.user);
      assert.equal(principal.user.email, emails.principal);
      assert.equal(principal.user.nombre, "Usuario de prueba");
      almacenado = await User.findOne({ email: emails.principal }).select("+password");
      assert.ok(almacenado);
      assert.equal(String(almacenado._id), principal.user._id);
      assert.equal(almacenado.email, emails.principal);
      assert.equal(almacenado.nombre, "Usuario de prueba");
    });

    await paso(3, async () => {
      assert.notEqual(almacenado.password, password);
      assert.equal(bcrypt.getRounds(almacenado.password), 12);
      assert.equal(await bcrypt.compare(password, almacenado.password), true);
      assert.equal(JSON.stringify(principal).includes(almacenado.password), false);
    });

    await paso(4, async () => {
      assert.equal((await registrar(emails.principal)).status, 409);
      assert.equal(await User.countDocuments({ email: emails.principal }), 1);
    });

    await paso(5, async () => {
      comprobarAislamiento();
      await assert.rejects(User.create({ nombre: "Duplicado de prueba", email: emails.principal, password: almacenado.password }),
        error => error.code === 11000);
      assert.equal(await User.countDocuments({ email: emails.principal }), 1);
    });

    await paso(6, async () => {
      // Esperar ambos resultados, incluso si una peticion falla, antes de limpiar.
      const intentos = await Promise.allSettled([registrar(emails.concurrente), registrar(emails.concurrente)]);
      assert.ok(intentos.every(intento => intento.status === "fulfilled"));
      assert.deepEqual(intentos.map(intento => intento.value.status).sort(), [201, 409]);
      assert.equal(await User.countDocuments({ email: emails.concurrente }), 1);
    });

    await paso(7, async () => {
      assert.equal((await registrar(emails.bloqueado, { nombre: "x", password: "corta" })).status, 400);
      assert.equal(await User.countDocuments({ email: emails.bloqueado }), 0);
    });

    await paso(8, async () => {
      const resultado = await login(emails.principal);
      assert.equal(resultado.status, 200);
      assert.equal(resultado.headers.get("cache-control"), "no-store");
      assert.deepEqual(Object.keys(resultado.body).sort(), ["token", "user"]);
      assert.deepEqual(resultado.body.user, principal.user);
      const payload = jwt.verify(resultado.body.token, configuracion.secret, { algorithms: ["HS256"] });
      assert.equal(payload.sub, principal.user._id);
      assert.ok(Number.isSafeInteger(payload.exp) && payload.exp > payload.iat);
    });

    await paso(9, async () => {
      const incorrecto = await login(emails.principal, "clave-incorrecta-de-prueba");
      const inexistente = await login(`auth-${ejecucion}-inexistente@example.com`);
      assert.equal(incorrecto.status, 401);
      assert.equal(inexistente.status, 401);
      assert.deepEqual(incorrecto.body, inexistente.body);
    });

    await paso(10, async () => {
      const resultado = await me(principal.token);
      assert.equal(resultado.status, 200);
      assert.equal(resultado.headers.get("cache-control"), "no-store");
      assert.deepEqual(resultado.body, { user: principal.user });
    });

    await paso(11, async () => {
      const resultado = await me();
      assert.equal(resultado.status, 401);
      assert.equal(resultado.headers.get("www-authenticate"), "Bearer");
    });

    await paso(12, async () => {
      const expirado = jwt.sign({}, configuracion.secret, { algorithm: "HS256", subject: principal.user._id, expiresIn: -60 });
      const partes = principal.token.split(".");
      const payload = JSON.parse(Buffer.from(partes[1], "base64url"));
      partes[1] = Buffer.from(JSON.stringify({ ...payload, sub: new mongoose.Types.ObjectId().toString() })).toString("base64url");
      for (const token of ["token-invalido", expirado, partes.join(".")]) {
        assert.equal((await me(token)).status, 401);
      }
    });

    await paso(13, async () => {
      const otroId = new mongoose.Types.ObjectId().toString();
      const resultado = await solicitar(`/api/auth/me?userId=${otroId}&_id=${otroId}`, {
        headers: { Authorization: `Bearer ${principal.token}`, "X-User-Id": otroId }
      });
      assert.equal(resultado.status, 200);
      assert.deepEqual(resultado.body, { user: principal.user });
    });

    await paso(14, async () => {
      const resultado = await registrar(emails.eliminado);
      assert.equal(resultado.status, 201);
      comprobarAislamiento();
      const eliminado = await User.deleteOne({ _id: resultado.body.user._id, email: emails.eliminado });
      assert.equal(eliminado.deletedCount, 1);
      assert.equal((await me(resultado.body.token)).status, 401);
    });

    await paso(15, async () => {
      const aislada = express();
      aislada.use("/api/auth", crearAuthRouter());
      const origen = await servir(aislada);
      for (let i = 0; i < 10; i++) assert.equal((await login(emails.principal, "incorrecta", origen)).status, 401);
      assert.equal((await login(emails.principal, password, origen)).status, 429);
      assert.equal((await registrar(emails.limite, {}, origen)).status, 201);
    });

    await paso(16, async () => {
      const aislada = express();
      aislada.use("/api/auth", crearAuthRouter());
      const origen = await servir(aislada);
      for (let i = 0; i < 10; i++) {
        assert.equal((await registrar(emails.bloqueado, { nombre: "x" }, origen)).status, 400);
      }
      assert.equal((await registrar(emails.bloqueado, {}, origen)).status, 429);
      assert.equal((await login(emails.principal, password, origen)).status, 200);
      assert.equal(await User.countDocuments({ email: emails.bloqueado }), 0);
    });

    let productos;
    await paso(17, async () => {
      // Cerrar toda API previa antes de vincular Product a la base real.
      for (const server of [...servidores]) await cerrarServidor(server);
      // Conexion separada, usada solo para GET/consultas. No crea indices/colecciones.
      fuenteProductos = mongoose.createConnection(uri, {
        dbName: BASE_PRODUCTOS, autoCreate: false, autoIndex: false,
        serverSelectionTimeoutMS: 5000, socketTimeoutMS: 15000
      });
      await fuenteProductos.asPromise();
      assert.equal(fuenteProductos.name, BASE_PRODUCTOS);
      Product.useConnection(fuenteProductos);
      comprobarAislamiento();
      const soloLectura = express();
      soloLectura.use((req, res, next) => req.method === "GET" ? next() : res.sendStatus(405));
      soloLectura.use(app);
      base = await servir(soloLectura);
      const resultado = await solicitar("/api/productos");
      assert.equal(resultado.status, 200);
      assert.ok(Array.isArray(resultado.body));
      productos = resultado.body;
      assert.equal(productos.length, await Product.countDocuments());
    });

    await paso(18, async () => {
      if (productos.length === 0) throw new PruebaOmitida();
      const producto = productos[0];
      const resultado = await solicitar("/api/productos/" + producto._id);
      assert.equal(resultado.status, 200);
      assert.deepEqual(resultado.body, producto);
    });

    await paso(19, async () => {
      let id;
      do { id = new mongoose.Types.ObjectId(); } while (await Product.exists({ _id: id }));
      assert.equal((await solicitar("/api/productos/" + id)).status, 404);
    });
  } catch (error) {
    process.exitCode = error instanceof RequisitoPendiente ? 2 : 1;
    console.error(error instanceof RequisitoPendiente ? error.message :
      "Fallo la integracion. Revisar el caso marcado FALLO, conectividad y permisos. No se imprimen errores internos.");
  } finally {
    for (const server of servidores) {
      try {
        await cerrarServidor(server);
      } catch {
        process.exitCode = 1;
        console.error("No se pudo confirmar el cierre de un servidor de prueba.");
      }
    }
    if (limpiezaPermitida) {
      try {
        comprobarAislamiento();
        // Emails exactos, aleatorios y comprobados como inexistentes antes de escribir.
        await User.deleteMany(filtroPropio);
        assert.equal(await User.countDocuments(filtroPropio), 0);
        limpieza = "VERIFICADA: no quedan usuarios de esta ejecucion";
      } catch {
        limpieza = "NO CONFIRMADA: revisar exclusivamente los emails de esta ejecucion";
        process.exitCode = 1;
      }
    }
    if (Product.db !== mongoose.connection) Product.useConnection(mongoose.connection);
    try {
      if (fuenteProductos) await fuenteProductos.close();
    } catch {
      process.exitCode = 1;
      console.error("No se pudo confirmar el cierre de la conexion de lectura de productos.");
    }
    try { await mongoose.disconnect(); } catch {
      process.exitCode = 1;
      console.error("No se pudo confirmar el cierre de MongoDB.");
    }
    console.log(`Ejecucion: ${ejecucion}. Base de escrituras: ${BASE_TEST}.`);
    for (const resultado of resultados) console.log(`${resultado.estado}: ${resultado.nombre}`);
    console.log("Limpieza: " + limpieza);
  }
}

if (require.main === module) {
  verificarAuthMongo().catch(() => {
    console.error("Fallo inesperado del verificador; no se muestran detalles sensibles.");
    process.exitCode = 1;
  });
}
