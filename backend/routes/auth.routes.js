const express = require("express");
const { STATUS_CODES } = require("node:http");
const bcrypt = require("bcrypt");
const { rateLimit } = require("express-rate-limit");
const User = require("../models/User");
const { validarRegistro, validarLogin } = require("../middlewares/validarAuth");
const { proteger } = require("../middlewares/auth");
const { validarConfiguracionJWT, generarToken } = require("../utils/jwt");

// Generado una sola vez con datos aleatorios; no pertenece a ninguna cuenta.
const HASH_FICTICIO = "$2b$12$jNKkb0CF/trwaGrK0I9SZeewDofFPQR8KLj8fvds9JIOeZJUJsYJ6";

function responderError(res, status, message) {
  return res.status(status).json({ status, error: STATUS_CODES[status], message });
}

function esErrorDeConexion(error) {
  return ["MongoServerSelectionError", "MongooseServerSelectionError", "MongoNetworkError",
    "MongoNetworkTimeoutError", "MongoNotConnectedError", "MongoTopologyClosedError"].includes(error.name);
}

function crearAuthRouter() {
  const router = express.Router();
  // Store en memoria por instancia. Ver docs/auth-register.md antes de usar Render.
  const limitarRegistro = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      status: 429,
      error: "Too Many Requests",
      message: "Demasiadas solicitudes de registro. Intente nuevamente mas tarde."
    }
  });

  const limitarLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      status: 429,
      error: "Too Many Requests",
      message: "Demasiados intentos de login. Intente nuevamente mas tarde."
    }
  });

  router.post("/register", limitarRegistro, express.json(), validarRegistro, async (req, res) => {
    try {
      const configuracion = validarConfiguracionJWT();
      const { nombre, email, password } = req.datos;
      if (await User.findOne({ email })) {
        return responderError(res, 409, "El email ya esta registrado");
      }

      const hash = await bcrypt.hash(password, 12);
      const user = await User.create({ nombre, email, password: hash });
      // Conservar la configuracion validada antes de los awaits y la persistencia.
      const token = generarToken(user._id, configuracion);
      return res.set("Cache-Control", "no-store").status(201).json({
        token,
        user: { _id: String(user._id), nombre: user.nombre, email: user.email }
      });
    } catch (error) {
      if (error.code === 11000) return responderError(res, 409, "El email ya esta registrado");
      if (error.name === "ValidationError") {
        return responderError(res, 400, "Datos de registro invalidos");
      }
      if (esErrorDeConexion(error)) {
        return responderError(res, 503, "La base de datos no esta disponible. Intente nuevamente mas tarde.");
      }
      return responderError(res, 500, "No se pudo registrar el usuario. Intente nuevamente mas tarde.");
    }
  });

  router.post("/login", limitarLogin, express.json(), validarLogin, async (req, res) => {
    try {
      const configuracion = validarConfiguracionJWT();
      const { email, password } = req.datos;
      const user = await User.findOne({ email }).select("+password");
      const coincide = await bcrypt.compare(password, user ? user.password : HASH_FICTICIO);
      if (!user || !coincide) return responderError(res, 401, "Credenciales invalidas");

      const token = generarToken(user._id, configuracion);
      return res.set("Cache-Control", "no-store").status(200).json({
        token,
        user: { _id: String(user._id), nombre: user.nombre, email: user.email }
      });
    } catch (error) {
      if (esErrorDeConexion(error)) {
        return responderError(res, 503, "La base de datos no esta disponible. Intente nuevamente mas tarde.");
      }
      return responderError(res, 500, "No se pudo iniciar sesion. Intente nuevamente mas tarde.");
    }
  });

  router.get("/me", proteger, (req, res) => {
    const { _id, nombre, email } = req.user;
    return res.status(200).json({ user: { _id, nombre, email } });
  });

  // No propagar el mensaje del parser ni errores internos de descompresion.
  router.use(["/register", "/login"], (error, req, res, next) => {
    if (error.type === "entity.parse.failed" || error.status === 400 || error.statusCode === 400) {
      return responderError(res, 400, "El cuerpo de la peticion debe ser un objeto JSON valido");
    }
    next(error);
  });

  return router;
}

module.exports = crearAuthRouter();
module.exports.crearAuthRouter = crearAuthRouter;
