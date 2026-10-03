const express = require("express");
const productosRoutes = require("./routes/productos.routes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use("/api/productos", productosRoutes);

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
