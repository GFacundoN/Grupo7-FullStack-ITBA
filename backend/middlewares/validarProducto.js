const CAMPOS_TEXTO = ["nombre", "descripcion", "descripcionCorta", "categoria", "imagenUrl"];

// Solo acepta numeros o textos numericos no vacios: Number([]) y Number("   ")
// dan 0 y no deben pasar como valores validos.
function aNumero(valor) {
  if (typeof valor === "number") return valor;
  if (typeof valor === "string" && valor.trim() !== "") return Number(valor);
  return NaN;
}

// Valida el body de POST/PUT y deja en req.datos solo los campos permitidos
// (nunca _id ni id). En POST nombre y precio son obligatorios; en PUT alcanza
// con enviar los campos que cambian.
function validarProducto({ parcial = false } = {}) {
  return (req, res, next) => {
    const body = req.body;

    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ error: "El cuerpo de la peticion debe ser un objeto JSON" });
    }

    const datos = {};
    const falla = (mensaje) => res.status(400).json({ error: mensaje });

    for (const campo of CAMPOS_TEXTO) {
      if (body[campo] === undefined) continue;
      if (typeof body[campo] !== "string") return falla(`${campo} debe ser un texto`);
      datos[campo] = body[campo].trim();
    }

    if (datos.nombre === "" || (!parcial && datos.nombre === undefined)) {
      return falla("nombre es obligatorio");
    }

    if (body.precio === undefined || body.precio === null || body.precio === "") {
      if (!parcial) return falla("precio es obligatorio");
    } else {
      const precio = aNumero(body.precio);
      if (!Number.isFinite(precio) || precio < 0) {
        return falla("precio debe ser un numero mayor o igual a 0");
      }
      datos.precio = precio;
    }

    if (body.stock !== undefined && body.stock !== null && body.stock !== "") {
      const stock = aNumero(body.stock);
      if (!Number.isSafeInteger(stock) || stock < 0) {
        return falla("stock debe ser un numero entero mayor o igual a 0");
      }
      datos.stock = stock;
    }

    if (body.destacado !== undefined) {
      if (typeof body.destacado !== "boolean") return falla("destacado debe ser verdadero o falso");
      datos.destacado = body.destacado;
    }

    if (body.detalles !== undefined) {
      const { detalles } = body;
      const valido =
        detalles !== null &&
        typeof detalles === "object" &&
        !Array.isArray(detalles) &&
        Object.values(detalles).every((valor) => typeof valor === "string");
      if (!valido) return falla("detalles debe ser un objeto con valores de texto");
      datos.detalles = detalles;
    }

    if (parcial && Object.keys(datos).length === 0) {
      return falla("Envie al menos un campo para actualizar");
    }

    req.datos = datos;
    next();
  };
}

module.exports = validarProducto;
