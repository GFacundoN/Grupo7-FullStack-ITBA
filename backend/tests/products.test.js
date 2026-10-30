const { test } = require("node:test");
const assert = require("node:assert/strict");
const Product = require("../models/Product");
const productos = require("../data/productos");
const { app } = require("../server");
const connectDB = require("../config/db");

test("La conexion rechaza una URI ausente o vacia sin revelar configuracion", async () => {
  const original = process.env.MONGODB_URI;
  try {
    delete process.env.MONGODB_URI;
    await assert.rejects(connectDB(), /Es necesario configurar MONGODB_URI/);
    process.env.MONGODB_URI = "   ";
    await assert.rejects(connectDB(), /Es necesario configurar MONGODB_URI/);
  } finally {
    if (original === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = original;
  }
});

test("El modelo conserva el catalogo y valida precios, stock y campos obligatorios", async () => {
  for (const producto of productos) {
    const document = new Product(producto);
    await document.validate();
    const json = document.toJSON();
    for (const [key, value] of Object.entries(producto)) assert.deepEqual(json[key], value);
    assert.equal(json.imagenUrl, producto.imagen);
    assert.equal(json.stock, 0);
  }
  for (const patch of [
    { id: 0 }, { id: 1.5 }, { precio: -1 }, { precio: Infinity },
    { stock: -1 }, { stock: 1.5 }, { stock: Infinity }, { nombre: " " },
    { imagen: "" }, { categoria: "" }, { descripcion: "" },
    { descripcionCorta: "" }, { detalles: {} }, { detalles: { peso: "" } }
  ]) {
    await assert.rejects(new Product({ ...productos[0], ...patch }).validate());
  }
  await assert.rejects(new Product({}).validate());
});

test("HTTP: catalogo vacio, errores controlados y middlewares (sin escribir en Atlas)", async () => {
  // Dobles solo para escenarios de fallo/vacio; test:atlas prueba los datos reales.
  const originalFind = Product.find;
  const originalFindOne = Product.findOne;
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    Product.find = () => ({ select: () => ({ sort: async () => [] }) });
    const empty = await fetch(base + "/api/productos");
    assert.equal(empty.status, 200);
    assert.deepEqual(await empty.json(), []);
    const secretError = new Error("mongodb+srv://usuario:secreto@servidor/");
    Product.find = () => { throw secretError; };
    Product.findOne = () => { throw secretError; };
    for (const route of ["/api/productos", "/api/productos/1"]) {
      const response = await fetch(base + route);
      assert.equal(response.status, 503);
      const body = await response.text();
      assert.ok(!body.includes("secreto") && !body.includes("mongodb"));
      assert.equal(JSON.parse(body).status, 503);
    }
    for (const id of ["abc", "-1", "0", "1.5", "9007199254740992"]) {
      assert.equal((await fetch(base + "/api/productos/" + id)).status, 400);
    }
    assert.equal((await fetch(base + "/")).status, 200);
    const missing = await fetch(base + "/inexistente");
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).error, "Not Found");
  } finally {
    Product.find = originalFind;
    Product.findOne = originalFindOne;
    await new Promise(resolve => server.close(resolve));
  }
});
