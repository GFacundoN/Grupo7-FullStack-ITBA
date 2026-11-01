const express = require("express");
const connectDB = require("./config/db");
const productosRoutes = require("./routes/productos.routes");

// Importación de middlewares (Máximo)
const logger = require("./middlewares/logger");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales de entrada 
app.use(express.json()); // Permite procesar peticiones con cuerpo JSON
app.use(logger);         // Muestra en consola el método HTTP y la URL solicitada

// Rutas principales de la API 
app.use("/api/productos", productosRoutes);

// Ruta base de prueba 
app.get("/", (req, res) => {
  res.json({ mensaje: "Servidor de Hermanos Jota funcionando correctamente" });
});

// Middlewares de salida y manejo de errores 
app.use(notFound);      
app.use(errorHandler);  

// Inicio del servidor
async function startServer(port = PORT) {
  await connectDB();
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Servidor funcionando en http://localhost:${server.address().port}`);
      resolve(server);
    });
    server.once("error", reject);
  });
}

if (require.main === module) {
  startServer().catch(() => {
    console.error("No se pudo iniciar el servidor: revise la conexion y configuracion de MongoDB.");
    process.exit(1);
  });
}

module.exports = { app, startServer };
