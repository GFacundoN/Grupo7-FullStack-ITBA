const { STATUS_CODES } = require("node:http");
const { JsonWebTokenError } = require("jsonwebtoken");
const User = require("../models/User");
const { verificarToken } = require("../utils/jwt");

function responderError(res, status, message) {
  if (status === 401) res.set("WWW-Authenticate", "Bearer");
  return res.status(status).json({ status, error: STATUS_CODES[status], message });
}

async function proteger(req, res, next) {
  res.set("Cache-Control", "no-store");
  const noAutorizado = () => responderError(res, 401, "Autenticacion requerida o token invalido");
  const authorization = req.headers.authorization;
  // Node puede descartar duplicados en headers; rawHeaders conserva cada entrada.
  let cantidad = 0;
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    if (req.rawHeaders[i].toLowerCase() === "authorization") cantidad++;
  }
  if (cantidad !== 1 || typeof authorization !== "string") return noAutorizado();
  const bearer = /^Bearer ([^\s,]+)$/i.exec(authorization);
  if (!bearer) return noAutorizado();

  try {
    const payload = verificarToken(bearer[1]);
    const user = await User.findById(payload.sub).select("_id nombre email");
    if (!user) return noAutorizado();

    req.user = {
      id: String(user._id),
      _id: String(user._id),
      nombre: user.nombre,
      email: user.email
    };
    return next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) return noAutorizado();
    if (["MongoServerSelectionError", "MongooseServerSelectionError", "MongoNetworkError",
      "MongoNetworkTimeoutError", "MongoNotConnectedError", "MongoTopologyClosedError"].includes(error.name)) {
      return responderError(res, 503, "La base de datos no esta disponible. Intente nuevamente mas tarde.");
    }
    return responderError(res, 500, "No se pudo autenticar la solicitud. Intente nuevamente mas tarde.");
  }
}

module.exports = { proteger };
