function emailValido(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarRegistro(req, res, next) {
  const body = req.body;
  const falla = (message) => res.status(400).json({ status: 400, error: "Bad Request", message });

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return falla("El cuerpo de la peticion debe ser un objeto JSON");
  }

  if (typeof body.nombre !== "string") return falla("nombre es obligatorio y debe ser un texto");
  const nombre = body.nombre.trim();
  if (nombre.length < 2 || nombre.length > 100) {
    return falla("nombre debe tener entre 2 y 100 caracteres");
  }

  if (typeof body.email !== "string") return falla("email es obligatorio y debe ser un texto");
  const email = body.email.trim().toLowerCase();
  if (!emailValido(email)) {
    return falla("email debe tener un formato valido y hasta 254 caracteres");
  }

  if (typeof body.password !== "string") return falla("password es obligatorio y debe ser un texto");
  const password = body.password;
  if (Array.from(password).length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return falla("password debe tener al menos 8 caracteres y hasta 72 bytes UTF-8");
  }

  req.datos = { nombre, email, password };
  next();
}

function validarLogin(req, res, next) {
  const body = req.body;
  const falla = (message) => res.status(400).json({ status: 400, error: "Bad Request", message });

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return falla("El cuerpo de la peticion debe ser un objeto JSON");
  }

  if (typeof body.email !== "string") return falla("email es obligatorio y debe ser un texto");
  const email = body.email.trim().toLowerCase();
  if (!emailValido(email)) {
    return falla("email debe tener un formato valido y hasta 254 caracteres");
  }

  if (typeof body.password !== "string") return falla("password es obligatorio y debe ser un texto");
  const password = body.password;
  if (password.length === 0 || Buffer.byteLength(password, "utf8") > 72) {
    return falla("password no debe estar vacio y debe tener hasta 72 bytes UTF-8");
  }

  req.datos = { email, password };
  next();
}

module.exports = { validarRegistro, validarLogin };
