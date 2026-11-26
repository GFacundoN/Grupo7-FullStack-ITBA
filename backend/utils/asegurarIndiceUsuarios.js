const User = require("../models/User");

async function asegurarIndiceUsuarios() {
  await User.createIndexes();
  const indices = await User.listIndexes();
  const existe = indices.some(indice => indice.key?.email === 1 &&
    Object.keys(indice.key).length === 1 && indice.unique === true &&
    indice.sparse !== true && !indice.partialFilterExpression);
  if (!existe) throw new Error("No se pudo verificar el indice unico de usuarios.email");
}

module.exports = asegurarIndiceUsuarios;
