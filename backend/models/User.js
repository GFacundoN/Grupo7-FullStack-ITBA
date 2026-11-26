const mongoose = require("mongoose");

function ocultarPassword(doc, ret) {
  delete ret.password;
  return ret;
}

const userSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
      type: String,
      required: true,
      select: false,
      // El registro generara el hash; el modelo solo valida su formato.
      validate: {
        validator: (valor) => valor.length === 60 &&
          /^\$2[ab]\$(?:0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/.test(valor),
        message: "password debe ser un hash bcrypt valido"
      }
    }
  },
  {
    id: false,
    collection: "users",
    bufferCommands: false,
    timestamps: true,
    toJSON: { transform: ocultarPassword },
    toObject: { transform: ocultarPassword }
  }
);

module.exports = mongoose.model("User", userSchema);
