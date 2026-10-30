const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

function databaseError(next) {
  const error = new Error("No se pudo consultar el catalogo. Intente nuevamente mas tarde.");
  error.status = 503;
  next(error);
}

router.get("/", async (req, res, next) => {
  try {
    const productos = await Product.find().select("-__v").sort({ id: 1 });
    res.json(productos);
  } catch {
    databaseError(next);
  }
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  let filter;
  if (mongoose.isObjectIdOrHexString(id)) {
    filter = { _id: id };
  } else if (/^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))) {
    filter = { id: Number(id) };
  } else {
    return res.status(400).json({ error: "Identificador de producto invalido" });
  }

  try {
    const producto = await Product.findOne(filter).select("-__v");
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(producto);
  } catch {
    databaseError(next);
  }
});

module.exports = router;
