const { test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");
const User = require("../models/User");

// Costo bajo solo para estas pruebas; nunca se utiliza una clave del entorno.
const hashPromise = bcrypt.hash("clave-exclusiva-de-prueba", 4);

async function datosValidos() {
  return {
    nombre: "Franco",
    email: "franco@example.com",
    password: await hashPromise
  };
}

function errorDeCampo(campo) {
  return (error) => error.name === "ValidationError" && Boolean(error.errors[campo]);
}

test("Usuario valido: normaliza nombre/email y conserva el hash sin modificarlo", async () => {
  const datos = await datosValidos();
  const user = new User({ ...datos, nombre: "  Franco  ", email: "  FRANCO@Example.COM  " });
  await user.validate();
  assert.equal(user.nombre, "Franco");
  assert.equal(user.email, "franco@example.com");
  assert.equal(user.password, datos.password);
  assert.ok(user._id);
  assert.equal(User.collection.name, "users");
});

test("Usuario rechaza nombre, email y password ausentes, nulos o vacios", async () => {
  const datos = await datosValidos();
  for (const campo of ["nombre", "email", "password"]) {
    for (const valor of [undefined, null, ""]) {
      await assert.rejects(new User({ ...datos, [campo]: valor }).validate(), errorDeCampo(campo));
    }
  }
  for (const campo of ["nombre", "email"]) {
    await assert.rejects(new User({ ...datos, [campo]: "   " }).validate(), errorDeCampo(campo));
  }
});

test("Usuario rechaza emails con formato invalido", async () => {
  const datos = await datosValidos();
  for (const email of ["franco", "franco@", "@example.com", "franco@example", "a@@example.com", "a b@example.com", "a@example. com"]) {
    await assert.rejects(new User({ ...datos, email }).validate(), errorDeCampo("email"));
  }
});

test("Usuario valida los limites de nombre despues de quitar espacios externos", async () => {
  const datos = await datosValidos();
  for (const nombre of ["a", "  a  ", "a".repeat(101)]) {
    await assert.rejects(new User({ ...datos, nombre }).validate(), errorDeCampo("nombre"));
  }
  for (const nombre of ["ab", "a".repeat(100)]) {
    await new User({ ...datos, nombre }).validate();
  }
});

test("Usuario declara el indice unico de email en el esquema, sin verificar MongoDB", () => {
  const indices = User.schema.indexes();
  assert.ok(indices.some(([campos, opciones]) => campos.email === 1 && opciones.unique === true));
});

test("Usuario rechaza texto plano y hashes bcrypt con formato invalido sin transformarlos", async () => {
  const datos = await datosValidos();
  const hash = datos.password;
  for (const password of [
    "clave-en-texto-plano", " ".repeat(60), "x".repeat(60),
    " " + hash, hash + " ", hash + "\n", hash.slice(0, -1),
    hash.replace("$2b$", "$2x$"), hash.replace("$04$", "$03$"),
    hash.replace("$04$", "$32$"), hash.slice(0, -1) + "!"
  ]) {
    const user = new User({ ...datos, password });
    await assert.rejects(user.validate(), errorDeCampo("password"));
    assert.equal(user.password, password);
  }
});

test("Usuario acepta hashes generados con bcrypt y conserva su valor exacto", async () => {
  const datos = await datosValidos();
  for (const password of [datos.password, await bcrypt.hash("otra-clave-de-prueba", 5)]) {
    const user = new User({ ...datos, password });
    await user.validate();
    assert.equal(user.password, password);
  }
  // bcrypt soporta los prefijos 2a y 2b.
  await new User({ ...datos, password: datos.password.replace("$2b$", "$2a$") }).validate();
});

test("Usuario impide guardar texto plano antes de llegar a la coleccion", async (t) => {
  const insertOne = t.mock.method(User.collection, "insertOne", async () => {
    throw new Error("No debe intentar persistir un usuario invalido");
  });
  const user = new User({ ...await datosValidos(), password: "clave-en-texto-plano" });
  await assert.rejects(user.save(), errorDeCampo("password"));
  assert.equal(insertOne.mock.callCount(), 0);
});

test("Usuario excluye password de las consultas por defecto y permite seleccionarlo explicitamente", async (t) => {
  // Solo se inspecciona la proyeccion que Mongoose envia al doble de la coleccion.
  const findOne = t.mock.method(User.collection, "findOne", async () => null);
  assert.equal(User.schema.path("password").options.select, false);
  await User.findOne({ email: "franco@example.com" });
  const opciones = findOne.mock.calls[0].arguments[1];
  assert.equal(opciones.projection.password, 0);

  await User.findOne({ email: "franco@example.com" }).select("+password");
  const opcionesExplicitas = findOne.mock.calls[1].arguments[1];
  assert.notEqual(opcionesExplicitas.projection?.password, 0);
});

test("Usuario excluye password en toJSON/toObject y conserva _id y el hash del documento", async () => {
  const datos = await datosValidos();
  const user = new User(datos);
  for (const serializado of [user.toJSON(), user.toObject(), JSON.parse(JSON.stringify(user))]) {
    assert.equal(Object.hasOwn(serializado, "password"), false);
    assert.equal(String(serializado._id), String(user._id));
    assert.equal(serializado.nombre, datos.nombre);
    assert.equal(serializado.email, datos.email);
    assert.equal(JSON.stringify(serializado).includes(datos.password), false);
  }
  assert.equal(user.password, datos.password);
});

test("Usuario configura timestamps y los genera al guardar con una coleccion simulada", async (t) => {
  assert.equal(User.schema.options.timestamps, true);
  assert.equal(User.schema.path("createdAt").instance, "Date");
  assert.equal(User.schema.path("updatedAt").instance, "Date");
  const insertOne = t.mock.method(User.collection, "insertOne", async (documento) => ({
    acknowledged: true,
    insertedId: documento._id
  }));
  const user = new User(await datosValidos());
  await user.save();
  assert.equal(insertOne.mock.callCount(), 1);
  const enviado = insertOne.mock.calls[0].arguments[0];
  assert.ok(enviado.createdAt instanceof Date);
  assert.ok(enviado.updatedAt instanceof Date);
  assert.equal(enviado.createdAt.getTime(), enviado.updatedAt.getTime());
  assert.equal(enviado.password, await hashPromise);
});
