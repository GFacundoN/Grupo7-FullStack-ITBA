# Autenticacion: contrato y requisitos antes de produccion

POST /api/auth/register devuelve 201 con token y user (_id, nombre, email).
POST /api/auth/login devuelve 200 con la misma estructura token y user.
GET /api/auth/me requiere Authorization: Bearer TOKEN y devuelve 200 con
`{ user: { _id, nombre, email } }`, sin emitir un token nuevo ni consultar dos veces.
Registro recibe `{ nombre, email, password }`; login recibe `{ email, password }`.
Los tres endpoints construyen sus respuestas publicas explicitamente.
Las respuestas exitosas incluyen Cache-Control: no-store; el middleware tambien
lo establece para los errores de las rutas protegidas.
Los errores usan status, error y message.
JWT_SECRET debe tener al menos 32 bytes y no ser el marcador de la plantilla;
JWT_EXPIRES_IN debe definir una duracion positiva (por ejemplo, 24h).
startServer valida la configuracion JWT antes de conectar a MongoDB, crear indices
o abrir HTTP. Si falta el secreto, es insuficiente o la expiracion es invalida,
rechaza el arranque con un error generico sin mostrar valores sensibles.
La configuracion tambien se valida antes de consultar o crear usuarios. No hay claves
por defecto, y el .env se carga mediante el mecanismo existente de config/db.js.

## Dependencias y regresiones del parser

Se actualizaron exclusivamente las transitivas body-parser 2.3.0 -> 2.4.0 y
qs 6.16.0 -> 6.17.1 mediante npm update body-parser qs. package.json y las
versiones directas, incluido Express 5.2.1, permanecieron intactos. Ambas
versiones satisfacen los rangos de Express y son compatibles con Node.js 24.

body-parser 2.4.0 corrige el cierre del proceso por bytes residuales en cuerpos
comprimidos (GHSA-27r3-jxmh-p828). qs 6.17.1 incluye la correccion disponible desde
6.16.1 para stringify con arrayFormat comma (GHSA-6pq8-jhm2-2vcw).
auth.parser.test.js cubre JSON y gzip validos, JSON malformado y gzip corrupto,
truncado o con bytes residuales. Auth devuelve 400 generico para los errores de
lectura/descompresion del parser, sin propagar mensajes internos de zlib ni
registrar cuerpos sensibles. No se modifica el manejador global de productos.

Referencias:

- https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828
- https://github.com/ljharb/qs/security/advisories/GHSA-6pq8-jhm2-2vcw

## Middleware proteger y verificacion

Se exporta `{ proteger }` desde middlewares/auth.js. Solo acepta un unico header
Authorization con esquema Bearer (sin distinguir mayusculas) y un unico token.
Se rechazan headers duplicados, multiples tokens y formatos ambiguos. No se
aceptan tokens de query/body ni identificadores de headers personalizados.

verificarToken usa jwt.verify con algorithms: ["HS256"], valida firma, expiracion
y sub como string ObjectId de 24 caracteres hexadecimales. exp es obligatorio
y debe ser un entero seguro; nbf tambien se respeta si esta presente.
La autenticacion no usa jwt.decode. Solo valida JWT_SECRET: JWT_EXPIRES_IN se
valida al emitir tokens y no reemplaza el exp firmado de un token ya emitido.
La verificacion no genera un JWT de prueba por cada solicitud.

El middleware consulta una sola vez al usuario, con proyeccion _id, nombre y
email, y construye exactamente:

```js
req.user = { id: String(user._id), _id: String(user._id), nombre: user.nombre, email: user.email };
```

id es el contrato para las futuras rutas de pedidos; _id conserva compatibilidad
con MongoDB. No se incluyen password, token, roles ni datos enviados por el cliente.
Perfil.jsx puede usar nombre/email. MisPedidos.jsx conserva el token para su
servicio de pedidos; esa API y la integracion AuthContext/pedidos siguen a cargo
de sus integrantes. No se modifico el frontend.

Ejemplo de integracion futura (documentacion; no se implementa pedidos):

```js
const { proteger } = require("../middlewares/auth");

router.post("/", proteger, async (req, res) => {
  const usuarioId = req.user.id;
  // Asociar el pedido al usuario autenticado; nunca tomar ese ID del body.
});
```

401: header/token invalido, expirado, ausente o usuario inexistente; el middleware
agrega WWW-Authenticate: Bearer. 500: configuracion JWT incorrecta o fallo interno.
503: base de datos no disponible. No se propagan errores internos ni se registran
tokens, cuerpos de autenticacion o secretos. Registro conserva 400/409/429 y login
400/401/429 segun sus contratos.

Cerrar sesion en el frontend no revoca un JWT emitido. Sigue siendo valido hasta
su expiracion mientras el secreto sea aceptado y el usuario exista. No hay lista
de revocacion ni refresh tokens en esta etapa. Una rotacion de JWT_SECRET invalida
los tokens anteriores y requiere coordinar el despliegue.

## Login

El email se normaliza con trim y lowercase. La clave no se transforma y admite
hasta 72 bytes UTF-8; login no impone el minimo de 8 caracteres del registro.
El hash se recupera explicitamente con select("+password"). bcrypt.compare
verifica la clave; usuario inexistente y clave incorrecta devuelven el mismo
401: `{ status: 401, error: "Unauthorized", message: "Credenciales invalidas" }`.

Si el usuario no existe, se compara contra un hash ficticio valido de costo 12,
precalculado una sola vez con datos aleatorios y sin relacion con cuentas reales.
El resultado de esa comparacion nunca autentica a un usuario inexistente.
Esto mitiga diferencias de tiempo de bcrypt; no garantiza tiempos identicos de
extremo a extremo, porque tambien intervienen la base de datos y la red.

## Indice unico de email

unique: true declara el indice; consultar el email primero no evita carreras.
Se captura 11000 al crear para responder 409. Antes de habilitar registros,
startServer conecta a la base configurada y espera asegurarIndiceUsuarios()
antes de abrir HTTP. Esa funcion ejecuta `await User.createIndexes()` y verifica
en `await User.listIndexes()` un indice exclusivamente `{ email: 1 }`, con
`unique: true`, sin partialFilterExpression ni sparse. Si falla la creacion o
verificacion, el arranque se rechaza sin abrir HTTP. Si hay duplicados
anteriores, deben revisarse manualmente, sin borrar datos automaticamente.

No se usa syncIndexes(), porque podria eliminar indices existentes.
No depender del autoIndex asincrono ni de User.init() si autoIndex esta desactivado.
La creacion puede requerir permisos de indices y afectar la duracion del arranque.
No se borra ningun indice existente si hay un conflicto: se debe revisar manualmente.

Referencia: https://mongoosejs.com/docs/api/model.html#Model.createIndexes()

## Render y limitacion por IP

Facundo debe configurar estas variables en el servicio del backend:

| Variable | Requisito |
| --- | --- |
| MONGODB_URI | Credenciales del entorno, con acceso a hermanos_jota y permisos para crear/verificar indices. El dbName esta fijado en config/db.js. |
| JWT_SECRET | Secreto exclusivo del entorno, generado criptograficamente con al menos 32 bytes. No reutilizar el marcador de la plantilla. |
| JWT_EXPIRES_IN | Duracion positiva explicita, por ejemplo 24h. |
| CORS_ORIGIN | Origen HTTPS exacto del frontend, sin barra final; varios separados por comas. |
| PORT | Usar el puerto inyectado por Render. |
| NODE_VERSION | Fijar una version mantenida de Node.js 24 y validar el build Linux de bcrypt. |

Directorio del servicio: backend. Build: npm ci. Inicio: npm start.
No subir .env ni node_modules. No se cambia la configuracion remota en esta etapa.

Registro y login tienen limitadores independientes de 10 solicitudes por IP
en 15 minutos, aplicados solo a POST /register y POST /login respectivamente.
El router se monta despues de CORS y antes del parser JSON global. Su parser
propio se ejecuta despues del limitador y sus errores se sanitizan dentro del
router, sin cambiar el procesamiento existente de los endpoints de productos.
Registro cuenta todos los intentos. Login usa skipSuccessfulRequests: true:
las respuestas exitosas se descuentan al finalizar; los errores cuentan.
Solicitudes concurrentes en curso pueden ocupar temporalmente el limite.
Cada limitador usa su propio store en memoria de express-rate-limit.
Los contadores se reinician con el proceso y no se comparten entre replicas.

No se cambia trust proxy. Antes de habilitar esta ruta en Render hay que
comprobar la cadena real de proxies y X-Forwarded-For para que req.ip represente
al cliente y no al proxy. Solo si se confirma un salto confiable corresponde
`app.set("trust proxy", 1)`; no usar true indiscriminadamente ni confiar en un
header aportado directamente por el cliente. Verificar con dos clientes y con
headers falsificados. No se agrega un endpoint publico de diagnostico.
Sin este ajuste, varios clientes pueden compartir el limite del proxy.
Con varias replicas se necesitara un store compartido, fuera de esta etapa.

Referencia: https://express-rate-limit.mintlify.app/guides/troubleshooting-proxy-issues

## Pendientes de coordinacion y riesgos residuales

Las escrituras de productos siguen publicas y necesitan una politica de
autorizacion administrativa acordada con sus responsables. Autenticar con
proteger no basta para determinar quien puede crear, editar o borrar productos.
Esta rama no agrega roles ni modifica esas rutas.

El registro responde 409 si el email existe, lo que permite enumeracion de
cuentas. Es parte del contrato vigente; el limitador reduce intentos por IP,
pero cambiar esa respuesta requiere coordinar el contrato con el equipo.
Login conserva el mismo 401 para usuario inexistente y clave incorrecta.

Logout en el frontend no revoca inmediatamente un JWT: sigue vigente hasta
expirar mientras el secreto se acepte y el usuario exista. No se agrega una
lista de revocacion en esta etapa. Los logs/404 generales y su tratamiento de
parametros sensibles siguen a cargo de los responsables de esos middlewares.

## Integracion real con MongoDB, separada de npm test

Desde backend, con MONGODB_URI, JWT_SECRET y JWT_EXPIRES_IN configurados localmente:

```sh
npm test
npm run test:auth:integration
```

No usar test:atlas para esta tarea: ese script existente ejecuta un seed de productos.
verifyAuthMongo.js no ejecuta seeds ni llama a connectDB/startServer, porque
config/db.js fija dbName: hermanos_jota. Importa app sin iniciarla y conecta
directamente con dbName fijo hermanos_jota_auth_test, autoIndex: false y
autoCreate: false. Verifica conexion, nombre de base y vinculacion de User antes
de cualquier peticion o limpieza. Solo entonces crea/verifica el indice de users.
No hay opcion para reemplazar el nombre de la base de escrituras por produccion.

Cada ejecucion reserva emails exactos con un UUID aleatorio y verifica que no
existan antes de habilitar escrituras. Prueba registro, persistencia, bcrypt,
indice y error 11000 reales, concurrencia, login, JWT, /me y limitadores separados.
Las instancias HTTP de los limitadores se renuevan dentro del proceso de prueba.

Para regresiones de productos abre otra conexion a hermanos_jota con autoCreate
y autoIndex desactivados. Vincula temporalmente Product a esa conexion, y realiza
exclusivamente lecturas y GET HTTP. Primero cierra todos los servidores previos;
el nuevo servidor envuelve la app real y rechaza cualquier metodo distinto de
GET con 405 mientras Product esta vinculado a hermanos_jota. No crea productos
ni indices de productos.
Si el catalogo esta vacio, informa OMITIDA para el detalle 200; comprueba igualmente
el listado y el detalle inexistente 404. No inventa ni carga datos de catalogo.

El finally detiene los servidores HTTP, elimina solo los emails de ese UUID
comprobados como inexistentes al inicio, comprueba que quedan cero, restaura la
vinculacion de Product y cierra ambas conexiones. No elimina bases ni colecciones.
Si no puede garantizar el aislamiento, no habilita escrituras. Si falla una
verificacion, limpia igualmente y no imprime tokens, claves ni errores internos.

Codigos de salida: 0 para verificaciones completadas, 1 para fallo (incluida una
limpieza no confirmada), 2 para requisitos ausentes. Cada caso informa OK, FALLO,
OMITIDA o NO EJECUTADA. La ausencia de URI no cuenta como integracion aprobada.

La URI necesita permisos de lectura/escritura y creacion de indices en la base
de testing, y lectura en hermanos_jota para las regresiones. No se cambian permisos
ni la configuracion de Atlas desde el script. Una caida de red durante la limpieza
o una terminacion abrupta del proceso puede impedir confirmarla: conservar el UUID
informado y revisar solo los emails auth-UUID-TIPO@example.com de esa ejecucion
(principal, concurrente, eliminado, limite, bloqueado), sin limpieza global.
