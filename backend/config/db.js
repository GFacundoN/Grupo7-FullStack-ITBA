const path = require("node:path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    throw new Error("Es necesario configurar MONGODB_URI para conectar con MongoDB.");
  }

  // El llamador debe manejar el rechazo sin exponer la URI ni las credenciales.
  return mongoose.connect(uri, {
    dbName: "hermanos_jota",
    serverSelectionTimeoutMS: 5000
  });
}

module.exports = connectDB;
