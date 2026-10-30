const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Product = require("../models/Product");
const productos = require("../data/productos");

async function seedProducts() {
  // Sin datos de inventario: stock 0 evita afirmar disponibilidad no verificada.
  const documents = productos.map(({ imagen, ...producto }) =>
    new Product({ ...producto, imagenUrl: imagen, stock: 0 })
  );
  await Promise.all(documents.map((document) => document.validate()));
  await Product.init();
  let inserted = 0;
  let existing = 0;
  let errors = 0;
  for (const document of documents) {
    const data = document.toObject();
    try {
      const result = await Product.updateOne(
        { id: data.id },
        { $setOnInsert: data },
        { upsert: true }
      );
      if (result.upsertedCount) inserted++;
      else existing++;
    } catch {
      errors++;
    }
  }
  return { inserted, existing, errors };
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      const result = await seedProducts();
      console.log("Carga de productos:", result);
      if (result.errors) process.exitCode = 1;
    } catch {
      console.error("La carga no se completo. Revise conexion, permisos e identificadores duplicados. Los datos existentes no se modificaron; puede reintentar.");
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  })();
}

module.exports = seedProducts;
