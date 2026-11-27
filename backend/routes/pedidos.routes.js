const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const auth = require("../middlewares/auth");

// Soporta tanto `module.exports = authMiddleware` como `module.exports = { authMiddleware }`
const authMiddleware = auth.authMiddleware || auth;

const router = express.Router();

// POST /api/pedidos — Crear un nuevo pedido para el usuario autenticado
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    if (!req.user?.id || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: "Usuario no autenticado." });
    }

    const { productos } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ message: "El carrito no puede estar vacío." });
    }

    // Validar estructura y agrupar cantidades si se repite un mismo productoId
    const cantidadesPorId = new Map();

    for (const item of productos) {
      const { productoId, cantidad } = item || {};

      if (!productoId || !mongoose.isValidObjectId(productoId)) {
        return res.status(400).json({ message: "Identificador de producto inválido." });
      }

      if (!Number.isSafeInteger(cantidad) || cantidad < 1) {
        return res.status(400).json({
          message: "La cantidad de cada producto debe ser un entero mayor o igual a 1."
        });
      }

      const idNormalizado = String(productoId);
      cantidadesPorId.set(idNormalizado, (cantidadesPorId.get(idNormalizado) || 0) + cantidad);
    }

    // Buscar los productos reales en MongoDB
    const idsUnicos = Array.from(cantidadesPorId.keys());
    const productosDB = await Product.find({ _id: { $in: idsUnicos } });

    if (productosDB.length !== idsUnicos.length) {
      return res.status(404).json({
        message: "Uno o más productos del carrito no existen en el catálogo."
      });
    }

    const mapaProductos = new Map(
      productosDB.map((prod) => [prod._id.toString(), prod])
    );

    let total = 0;
    const itemsPedido = [];

    for (const [productoId, cantidad] of cantidadesPorId.entries()) {
      const productoDB = mapaProductos.get(productoId);
      const precioUnitario = productoDB.precio;
      total += precioUnitario * cantidad;

      itemsPedido.push({
        productoId: productoDB._id,
        nombre: productoDB.nombre,
        cantidad,
        precioUnitario
      });
    }

    const nuevoPedido = await Order.create({
      usuario: req.user.id,
      productos: itemsPedido,
      total
    });

    return res.status(201).json({ pedido: nuevoPedido });
  } catch (err) {
    return next(err);
  }
});

// GET /api/pedidos/mis-pedidos — Listar pedidos del usuario autenticado
router.get("/mis-pedidos", authMiddleware, async (req, res, next) => {
  try {
    if (!req.user?.id || !mongoose.isValidObjectId(req.user.id)) {
      return res.status(401).json({ message: "Usuario no autenticado." });
    }

    const pedidos = await Order.find({ usuario: req.user.id }).sort({ fecha: -1 });
    return res.json({ pedidos });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;