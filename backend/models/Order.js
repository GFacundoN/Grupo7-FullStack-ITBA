const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger
    },
    precioUnitario: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isFinite
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    productos: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "El pedido debe incluir al menos un producto."
      }
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isFinite
    },
    fecha: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: "orders",
    bufferCommands: false,
    toJSON: { virtuals: true }
  }
);

module.exports = mongoose.model("Order", orderSchema);