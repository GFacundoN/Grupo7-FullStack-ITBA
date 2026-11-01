const express = require("express");
const Product = require("../models/Product");
const validarId = require("../middlewares/validarId");
const validarProducto = require("../middlewares/validarProducto");

const router = express.Router();

const INTENTOS_ID = 5;

// Errores de validacion/formato de Mongoose -> 400; el resto -> 500 con un
// mensaje generico (no se expone el error original de la base de datos).
function responderError(res, error) {
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ error: "Datos de producto invalidos" });
  }
  console.error("Error en la escritura de productos:", error.name);
  return res.status(500).json({ error: "Error del servidor. Intente nuevamente mas tarde." });
}

// Siguiente numero libre del catalogo. Si dos altas simultaneas eligen el mismo
// numero, el indice unico rechaza la segunda (11000) y se reintenta.
async function crearConId(datos) {
  for (let intento = 0; intento < INTENTOS_ID; intento++) {
    const ultimo = await Product.findOne({ id: { $exists: true } }).sort({ id: -1 }).select("id");
    try {
      return await Product.create({ ...datos, id: (ultimo?.id ?? 0) + 1 });
    } catch (error) {
      if (error.code !== 11000 || intento === INTENTOS_ID - 1) throw error;
    }
  }
}

router.post("/", validarProducto(), async (req, res) => {
  try {
    const producto = await crearConId(req.datos);
    res.status(201).json(await Product.findById(producto._id).select("-__v"));
  } catch (error) {
    responderError(res, error);
  }
});

router.put("/:id", validarId, validarProducto({ parcial: true }), async (req, res) => {
  try {
    const producto = await Product.findOneAndUpdate(req.filtro, req.datos, {
      returnDocument: "after",
      runValidators: true
    }).select("-__v");

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(producto);
  } catch (error) {
    responderError(res, error);
  }
});

router.delete("/:id", validarId, async (req, res) => {
  try {
    const producto = await Product.findOneAndDelete(req.filtro);

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json({ mensaje: "Producto eliminado correctamente", _id: producto._id });
  } catch (error) {
    responderError(res, error);
  }
});

module.exports = router;
