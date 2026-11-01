const mongoose = require("mongoose");

// Acepta el _id de MongoDB (24 hex) o el identificador numerico del catalogo
// original, igual que GET /api/productos/:id. Deja el filtro en req.filtro.
function validarId(req, res, next) {
  const { id } = req.params;

  if (mongoose.isObjectIdOrHexString(id)) {
    req.filtro = { _id: id };
  } else if (/^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))) {
    req.filtro = { id: Number(id) };
  } else {
    return res.status(400).json({ error: "Identificador de producto invalido" });
  }

  next();
}

module.exports = validarId;
