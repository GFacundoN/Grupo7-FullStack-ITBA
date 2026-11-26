const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const productosRoutes = require("./routes/productos.routes");
const productosWriteRoutes = require("./routes/productos.write.routes");
const authRoutes = require("./routes/auth.routes");
const asegurarIndiceUsuarios = require("./utils/asegurarIndiceUsuarios");
const { validarConfiguracionJWT } = require("./utils/jwt");

// Importación de middlewares (Máximo)
const logger = require("./middlewares/logger");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: solo el/los frontends permitidos (CORS_ORIGIN, separados por coma).
const origenesPermitidos = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);

// Middlewares globales de entrada 
app.use(cors({ origin: origenesPermitidos }));
app.use("/api/auth", authRoutes);
app.use(express.json()); // Permite procesar peticiones con cuerpo JSON
app.use(logger);         // Muestra en consola el método HTTP y la URL solicitada

// Rutas principales de la API 
app.use("/api/productos", productosRoutes);       // GET (Franco)
app.use("/api/productos", productosWriteRoutes);  // POST, PUT, DELETE

// Ruta base de prueba 
app.get("/", (req, res) => {
  res.json({ mensaje: "Servidor de Hermanos Jota funcionando correctamente" });
});

// Middlewares de salida y manejo de errores 
app.use(notFound);      
app.use(errorHandler);  

// Inicio del servidor
async function startServer(port = PORT) {
  validarConfiguracionJWT();
  await connectDB();
  await asegurarIndiceUsuarios();
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
    console.error("No se pudo iniciar el servidor: revise la configuracion JWT, MongoDB y los indices requeridos.");
    process.exit(1);
  });
}

module.exports = { app, startServer };
