const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

class ErrorConfiguracionJWT extends Error {
  constructor() {
    super("Configuracion JWT invalida");
    this.name = "ErrorConfiguracionJWT";
  }
}

function obtenerSecretoJWT() {
  // config/db.js ya carga el .env del backend; no se vuelve a cargar aqui.
  const secret = process.env.JWT_SECRET;
  if (typeof secret !== "string" || !secret.trim() ||
      Buffer.byteLength(secret, "utf8") < 32 || /^<.*>$/.test(secret)) {
    throw new ErrorConfiguracionJWT();
  }
  return secret;
}

function validarConfiguracionJWT() {
  const secret = obtenerSecretoJWT();
  const expiresIn = process.env.JWT_EXPIRES_IN;
  if (typeof expiresIn !== "string" || !expiresIn.trim()) throw new ErrorConfiguracionJWT();

  try {
    // Usar el mismo firmador detecta opciones invalidas antes de crear usuarios.
    const prueba = jwt.sign({}, secret, { algorithm: "HS256", expiresIn });
    const payload = jwt.decode(prueba);
    if (!Number.isSafeInteger(payload.exp) || payload.exp <= payload.iat) throw new ErrorConfiguracionJWT();
  } catch {
    throw new ErrorConfiguracionJWT();
  }

  return { secret, expiresIn };
}

function generarToken(userId, configuracion = validarConfiguracionJWT()) {
  return jwt.sign({}, configuracion.secret, {
    algorithm: "HS256",
    subject: String(userId),
    expiresIn: configuracion.expiresIn
  });
}

function verificarToken(token) {
  const secret = obtenerSecretoJWT();
  const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
  if (!payload || typeof payload !== "object" || !Number.isSafeInteger(payload.exp) ||
      typeof payload.sub !== "string" || !mongoose.isObjectIdOrHexString(payload.sub)) {
    throw new jwt.JsonWebTokenError("Token invalido");
  }
  return payload;
}

module.exports = { validarConfiguracionJWT, generarToken, verificarToken, ErrorConfiguracionJWT };
