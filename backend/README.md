# Backend de Hermanos Jota — MongoDB y consultas GET

El servidor Express utiliza Mongoose y MongoDB Atlas. Se conecta antes de abrir
HTTP; si falla la conexión termina con código 1 y un mensaje sin credenciales.
No existe una carga automática de productos al iniciar.

## Configuración y ejecución

Usar Node.js 20.19 o posterior (probado con Node 26.13.0 y npm 11.20.0).
Desde `backend`:

```sh
npm ci
```

Copiar `.env.example` a `.env` y completar `MONGODB_URI` con la URI suministrada
por Atlas. Codificar los caracteres especiales del usuario/contraseña en la URI.
No compartir ni versionar `.env`: Git ignora `.env` y sus variantes, y permite
`.env.example`. `PORT` es opcional y vale 5000 por defecto.

En Atlas, habilitar el acceso de red para la IP utilizada y dar al usuario de
aplicación permisos de lectura/escritura sobre `hermanos_jota`. `config/db.js`
carga el `.env` del backend independientemente del directorio de ejecución y
selecciona explícitamente `hermanos_jota`. El modelo usa la colección `products`.

```sh
npm run seed
npm start
```

El seed lee los 11 productos de `data/productos.js`, valida los documentos,
inicializa el índice único de `id` y utiliza `$setOnInsert` con upsert por `id`.
Informa insertados, existentes y errores; cierra la conexión y devuelve código
distinto de cero ante errores. Puede ejecutarse nuevamente sin duplicar ni
actualizar documentos existentes. No borra productos. Si ya hay IDs duplicados,
la creación del índice falla: deben revisarse manualmente, sin eliminar datos
automáticamente. Una carga parcial puede reintentarse.

Como el catálogo no incluye inventario, el seed usa **stock 0**: no afirma una
disponibilidad desconocida. La ruta de imagen original pasa a `imagenUrl`.

## Modelo Product

| Campo | Definición |
| --- | --- |
| `_id` | ObjectId generado por MongoDB |
| `id` | Número entero positivo seguro, índice único. Lo asigna POST (siguiente número libre) |
| `nombre` | Texto obligatorio con trim |
| `precio` | Número obligatorio, finito, no negativo |
| `descripcion`, `descripcionCorta`, `categoria` | Textos opcionales con trim |
| `stock` | Número entero seguro no negativo, por defecto 0 |
| `imagenUrl` | Texto opcional con trim; permite las rutas relativas actuales |
| `imagen` | Alias de `imagenUrl`, incluido al serializar JSON; no se duplica en MongoDB |
| `detalles` | Mapa opcional de textos, con trim |
| `destacado` | Booleano, por defecto false |

Según la consigna, solo `nombre` y `precio` son obligatorios.

`_id` e `id` son identificadores distintos. El virtual `id` de Mongoose está
deshabilitado para respetar el número del catálogo. La unicidad se aplica mediante
un índice de MongoDB, no como validación de Mongoose. `detalles` se serializa como
objeto, compatible con `Object.entries` del frontend.

## Endpoints

```sh
curl http://localhost:5000/api/productos
curl http://localhost:5000/api/productos/1
curl http://localhost:5000/api/productos/OBJECT_ID_REAL
```

- `GET /api/productos`: array JSON ordenado por `id`; `[]` si no hay documentos.
- `GET /api/productos/:id`: admite ObjectId hexadecimal de 24 caracteres o el
  identificador numérico positivo anterior. Devuelve un objeto JSON.
- Identificador mal formado: 400. Producto inexistente: 404.
- Fallo de consulta a MongoDB: 503 con mensaje genérico, mediante el middleware
  existente; no se propaga el error original ni la URI.

Las respuestas mantienen los campos del catálogo y agregan `_id`, `stock` e
`imagenUrl`. `__v` no se incluye. El listado conserva el formato de array, y el
detalle el de objeto; no se modificó el frontend.

## Pruebas

```sh
npm test
npm run test:atlas
```

`npm test` no requiere una conexión: valida el catálogo y datos inválidos, y
prueba por HTTP catálogo vacío, fallos controlados, IDs inválidos y middlewares.
Usa dobles explícitos para los escenarios vacío/error, sin escribir en Atlas.

`npm run test:atlas` requiere el `.env` real. Ejecuta el seed seguro dos veces,
comprueba que los documentos previos no cambien, consulta todos los productos
por ambas clases de identificador mediante HTTP real y verifica persistencia
tras cerrar HTTP y reconectar. Además verifica fallos reales al cerrar la
conexión y un proceso que intenta arrancar contra una conexión local inválida.
Solo puede insertar los productos faltantes del catálogo; nunca elimina ni
actualiza datos existentes. Si hay productos con los mismos IDs pero datos
diferentes del catálogo, la comprobación falla sin sobrescribirlos.

Para ver la aplicación en el navegador se debe iniciar también el frontend según
su documentación. Las pruebas del backend no sustituyen una revisión visual.

## Escritura (POST, PUT, DELETE)

Están en `routes/productos.write.routes.js`, con `middlewares/validarId.js` y
`middlewares/validarProducto.js`. POST responde 201 con el producto; PUT y DELETE
aceptan `_id` o el `id` numérico. Datos inválidos: 400. Inexistente: 404. Fallo de
la base de datos: 500 genérico, sin exponer el error original. Los errores usan
el formato `{ "error": "mensaje" }`. El body nunca puede fijar `_id` ni `id`.

## Resultado verificado y dependencias

El 30/10/2026 se verificó la conexión real a Atlas y la carga de 11 productos;
repetir el seed dejó 0 insertados y 11 existentes. Las pruebas comprueban también
los valores originales y el formato que consume el frontend.
Además se iniciaron y finalizaron dos procesos completos de `server.js`: ambos
respondieron HTTP 200 con los mismos 11 documentos, sin perder ni duplicar datos.
El arranque con MongoDB inaccesible terminó con código 1 sin anunciar un servidor
HTTP disponible. No se realizó una revisión visual en navegador.

Las dependencias agregadas para esta implementación son Mongoose y dotenv.
La auditoría npm detectó problemas transitivos de Express en `body-parser`
(alto) y `qs` (moderado). No se aplicaron actualizaciones ajenas a esta tarea.
