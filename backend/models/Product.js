const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Se conserva el identificador numerico del catalogo original. Los productos
    // nuevos lo reciben automaticamente en POST (siguiente numero libre).
    id: {
      type: Number,
      unique: true,
      min: 1,
      validate: Number.isSafeInteger
    },
    nombre: { type: String, required: true, trim: true },
    categoria: { type: String, trim: true },
    precio: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isFinite
    },
    // Se almacena una sola imagen; "imagen" mantiene el contrato del frontend.
    imagenUrl: { type: String, trim: true, alias: "imagen" },
    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: Number.isSafeInteger
    },
    descripcionCorta: { type: String, trim: true },
    descripcion: { type: String, trim: true },
    // Las especificaciones varian segun el mueble; todos sus valores son textos.
    // Segun la consigna, solo nombre y precio son obligatorios.
    detalles: {
      type: Map,
      of: { type: String, trim: true }
    },
    destacado: { type: Boolean, default: false }
  },
  { id: false, collection: "products", bufferCommands: false, toJSON: { virtuals: true } }
);

module.exports = mongoose.model("Product", productSchema);
