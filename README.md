# Hermanos Jota — E-commerce de muebles artesanales

Proyecto del curso Full Stack Developer (ITBA), Grupo 7. Aplicación **React + Express + MongoDB** para la mueblería "Hermanos Jota": catálogo con datos persistentes y CRUD completo de productos (crear, consultar, editar y eliminar).

## Enlaces

| | URL |
|---|---|
| **Frontend (Vercel/Netlify)** | https://client-neon-ten-45.vercel.app |
| **Backend (Render)** | https://backend-grupo7-hstl.onrender.com |
| Sitio estático Sprint 1 y 2 | https://gfacundon.github.io/Grupo7-FullStack-ITBA/index.html |

> El backend está en el plan free de Render: si nadie lo usó en un rato "se duerme" y la primera petición puede tardar 30-50 segundos en responder mientras arranca de nuevo.

## Integrantes

| Nombre | GitHub |
|---|---|
| Niderhaus Franco | @franNider |
| Ferreira German | @GermanFerreiraa |
| Maximo Manicchio | @maxi919 |
| Cingolani Lucio | @cingolanilucio29 |
| Gandolfo Facundo Nicolas | @GFacundoN |

## Tecnologías

- **Frontend:** React 19 con Vite, React Router DOM, CSS3 (Flexbox y media queries), fuentes Fraunces e Inter.
- **Backend:** Node.js, Express 5, Mongoose y CORS.
- **Base de datos:** MongoDB Atlas (base `hermanos_jota`, colección `products`).

## Arquitectura

```
React (client)  ──fetch──▶  Express API (backend)  ──Mongoose──▶  MongoDB Atlas
```

```
├── backend/
│   ├── server.js                       Express, CORS, JSON y registro de routers
│   ├── config/db.js                    conexión a MongoDB (MONGODB_URI)
│   ├── models/Product.js               modelo Product
│   ├── routes/productos.routes.js      GET (todos y por id)
│   ├── routes/productos.write.routes.js  POST, PUT, DELETE
│   ├── middlewares/                    logger, notFound, errorHandler, validarId, validarProducto
│   ├── scripts/seedProducts.js         carga inicial del catálogo (sin duplicar)
│   ├── data/productos.js               catálogo original usado por el seed
│   └── tests/                          pruebas con node:test
├── client/
│   └── src/
│       ├── main.jsx, App.jsx           BrowserRouter y rutas
│       ├── components/                 Navbar, Footer, ProductForm, ...
│       ├── pages/                      Inicio, Productos, ProductoDetalle, Contacto,
│       │                               CrearProducto, EditarProducto, NoEncontrado
│       ├── services/productosApi.js    llamadas a la API
│       ├── context/CarritoContext.jsx  carrito con cantidades
│       └── styles/                     layout.css y productos.css
└── legacy-sprint-1-2/                  sitio HTML/CSS/JS de los sprints 1 y 2
```

## Rutas del frontend

| Ruta | Pantalla |
|---|---|
| `/` | Inicio |
| `/productos` | Catálogo |
| `/productos/:id` | Detalle (`useParams`) |
| `/contacto` | Formulario de contacto |
| `/admin/crear-producto` | Alta de producto (formulario controlado) |
| `/admin/editar-producto/:id` | Edición de producto (formulario controlado) |

Después de crear o editar, la app redirige con `useNavigate` al detalle del producto.

## Cómo ejecutarlo en local

Requisitos: Node.js 20.19 o superior y una base MongoDB (Atlas o local).

### 1. Backend (puerto 5000)

```bash
cd backend
npm install
cp .env.example .env     # y completar MONGODB_URI
npm run seed             # carga el catálogo inicial (se puede repetir sin duplicar)
npm start
```

Probá `http://localhost:5000/api/productos`.

### 2. Frontend (puerto 5173)

```bash
cd client
npm install
npm run dev
```

Abrí `http://localhost:5173`.

### Pruebas del backend

```bash
cd backend
npm test
```

## Variables de entorno

El archivo `.env` real **nunca se sube a GitHub** (está en `.gitignore`). En producción las variables se cargan en el panel de cada servicio.

**Backend** (`backend/.env`, o variables de entorno en Render):

| Variable | Descripción |
|---|---|
| `MONGODB_URI` | URI de conexión de MongoDB Atlas (con usuario y clave) |
| `PORT` | Puerto HTTP. Opcional, por defecto `5000` (Render lo define solo) |
| `CORS_ORIGIN` | URL del frontend permitida por CORS. Varias se separan con coma. Por defecto `http://localhost:5173`. En Render debe ser la URL del frontend publicado |

**Frontend** (`client/.env`, o variables de entorno en Vercel/Netlify):

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API, por ejemplo `https://tu-backend.onrender.com/api`. Por defecto `http://localhost:5000/api`. Nunca poner credenciales acá |

## API

Modelo `Product`: `nombre` (String, obligatorio), `descripcion` (String), `precio` (Number, obligatorio), `stock` (Number) e `imagenUrl` (String). También se conservan, como opcionales, `categoria`, `descripcionCorta`, `detalles` y `destacado` del catálogo original. MongoDB genera `_id`, que es el identificador a usar.

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/productos` | Array de productos |
| GET | `/api/productos/:id` | Un producto (`404` si no existe, `400` si el id es inválido) |
| POST | `/api/productos` | Producto creado, estado `201` |
| PUT | `/api/productos/:id` | Producto actualizado |
| DELETE | `/api/productos/:id` | `{ "mensaje": "...", "_id": "..." }` |

Errores: datos inválidos `400`, producto inexistente `404` y fallo del servidor `500`, con el formato `{ "error": "Producto no encontrado" }`. El POST no acepta `_id` ni `id` del cliente: el `id` numérico del catálogo se asigna solo.

```bash
curl -X POST http://localhost:5000/api/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Mesa de centro","precio":120000,"stock":5}'
```

## Cómo probar el CRUD completo

1. Abrir `/admin/crear-producto`, completar el formulario y guardar.
2. Verlo en `/productos` y abrir su detalle.
3. Editarlo desde `/admin/editar-producto/:id` y volver a ver el detalle.
4. Eliminarlo y confirmar que ya no aparece.

## Flujo de trabajo en Git

- `main` es la rama de entrega. `sprint-5-6` es la rama de integración de este sprint.
- Las ramas personales se llaman `feature/nombre-tarea` y salen de `sprint-5-6`.
- Nadie pushea directo a `main` ni a `sprint-5-6`: todo entra por Pull Request.
