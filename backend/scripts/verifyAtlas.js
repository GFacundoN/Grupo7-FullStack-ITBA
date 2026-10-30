const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Product");
const productos = require("../data/productos");
const seedProducts = require("./seedProducts");
const { startServer } = require("../server");

async function close(server) {
  await new Promise(resolve => server.close(resolve));
}

async function serve() {
  const server = await startServer(0);
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

async function verify() {
  let server;
  try {
    await connectDB();
    assert.equal(mongoose.connection.name, "hermanos_jota");
    assert.equal(Product.collection.name, "products");
    await mongoose.connection.db.admin().ping();
    console.log("OK: conexion y ping reales a hermanos_jota.products.");

    const before = await Product.collection.find().sort({ _id: 1 }).toArray();
    const first = await seedProducts();
    assert.equal(first.errors, 0);
    const afterFirst = await Product.collection.find().sort({ _id: 1 }).toArray();
    for (const existing of before) {
      assert.deepEqual(afterFirst.find(doc => doc._id.equals(existing._id)), existing);
    }
    const second = await seedProducts();
    assert.deepEqual(second, { inserted: 0, existing: 11, errors: 0 });
    assert.deepEqual(await Product.collection.find().sort({ _id: 1 }).toArray(), afterFirst);
    console.log("Seed primera ejecucion:", first);
    console.log("Seed segunda ejecucion:", second);
    console.log("OK: documentos anteriores intactos e idempotencia comprobada.");

    const active = await serve();
    server = active.server;
    const response = await fetch(active.base + "/api/productos");
    assert.equal(response.status, 200);
    const list = await response.json();
    assert.equal(list.length, await Product.countDocuments());
    for (const producto of productos) {
      const stored = list.find(doc => doc.id === producto.id);
      assert.ok(stored);
      for (const [key, value] of Object.entries(producto)) assert.deepEqual(stored[key], value);
      assert.equal(stored.imagenUrl, producto.imagen);
      assert.ok(Number.isSafeInteger(stored.stock) && stored.stock >= 0);
      for (const id of [stored.id, stored._id]) {
        const detail = await fetch(active.base + "/api/productos/" + id);
        assert.equal(detail.status, 200);
        assert.deepEqual(await detail.json(), stored);
      }
    }
    for (const id of ["9007199254740991", new mongoose.Types.ObjectId().toString()]) {
      assert.equal((await fetch(active.base + "/api/productos/" + id)).status, 404);
    }
    assert.equal((await fetch(active.base + "/api/productos/invalido")).status, 400);
    assert.equal((await fetch(active.base + "/")).status, 200);
    assert.equal((await fetch(active.base + "/ruta-inexistente")).status, 404);
    console.log(`OK: ${list.length} productos, 22 GET de detalle por id y _id, 400 y 404 reales.`);

    await close(server);
    server = null;
    await mongoose.disconnect();
    await connectDB();
    const restarted = await serve();
    server = restarted.server;
    assert.deepEqual(await (await fetch(restarted.base + "/api/productos")).json(), list);
    assert.deepEqual(await Product.collection.find().sort({ _id: 1 }).toArray(), afterFirst);
    console.log("OK: reinicio HTTP y reconexion mantienen los datos sin cambios.");

    await mongoose.disconnect();
    for (const route of ["/api/productos", "/api/productos/1"]) {
      const unavailable = await fetch(restarted.base + route);
      assert.equal(unavailable.status, 503);
      const body = await unavailable.text();
      assert.ok(!body.includes(process.env.MONGODB_URI));
      assert.equal(JSON.parse(body).status, 503);
    }
    console.log("OK: conexion real cerrada produce respuestas 503 controladas.");

    const child = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
      env: { ...process.env, MONGODB_URI: "mongodb://127.0.0.1:1/invalid", PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { output += chunk; });
    const timer = setTimeout(() => child.kill(), 15000);
    const code = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", resolve);
    });
    clearTimeout(timer);
    assert.equal(code, 1);
    assert.ok(!output.includes("Servidor funcionando"));
    assert.ok(!output.includes("mongodb://"));
    console.log("OK: arranque sin MongoDB termina con codigo 1 y sin abrir HTTP ni revelar URI.");
    console.log("Ejemplo parcial real:", JSON.stringify({ _id: list[0]._id, id: list[0].id, nombre: list[0].nombre, precio: list[0].precio }));
  } catch {
    console.error("Fallo la verificacion de Atlas. No se imprimen detalles para proteger la configuracion. Revise los pasos OK anteriores.");
    process.exitCode = 1;
  } finally {
    if (server) await close(server);
    await mongoose.disconnect();
  }
}

verify();
