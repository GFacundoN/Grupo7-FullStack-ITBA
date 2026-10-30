const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Se conserva el identificador numerico que utiliza el frontend.
    id: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      validate: Number.isSafeInteger
    },
    nombre: { type: String, required: true, trim: true },
    categoria: { type: String, required: true, trim: true },
    precio: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isFinite
    },
    // Se almacena una sola imagen; "imagen" mantiene el contrato del frontend.
    imagenUrl: { type: String, required: true, trim: true, alias: "imagen" },
    stock: {
      type: Number,
      default: 0,
      min: 0,
      validate: Number.isSafeInteger
    },
    descripcionCorta: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    // Las especificaciones varian segun el mueble; todos sus valores son textos.
    detalles: {
      type: Map,
      of: { type: String, required: true, trim: true },
      required: true,
      validate: {
        validator: (value) => value != null && value.size > 0,
        message: "El producto debe incluir al menos un detalle."
      }
    },
    destacado: { type: Boolean, default: false }
  },
  { id: false, collection: "products", bufferCommands: false, toJSON: { virtuals: true } }
);

module.exports = mongoose.model("Product", productSchema);
