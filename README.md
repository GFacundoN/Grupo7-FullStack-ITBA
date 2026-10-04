# Hermanos Jota — E-commerce de muebles artesanales

Proyecto del curso Full Stack Developer (ITBA), Grupo 7. E-commerce de la mueblería "Hermanos Jota", con catálogo de productos, detalle de producto, carrito y formulario de contacto.

**Sitio estático de Sprint 1 y 2 (GitHub Pages):** https://gfacundon.github.io/Grupo7-FullStack-ITBA/index.html
Esa versión es HTML, CSS y JavaScript puro, y se sirve desde la raíz del repo. La versión cliente-servidor de Sprint 3 y 4 está en `/client` y `/backend`.

## Integrantes

| Nombre | GitHub |
|---|---|
| Niderhaus Franco | @franNider |
| Ferreira German | @GermanFerreiraa |
| Maximo Manicchio | @maxi919 |
| Cingolani Lucio | @cingolanilucio29 |
| Gandolfo Facundo Nicolas | @GFacundoN |

## Tecnologías

- **Frontend:** React (creado con Create React App), CSS3 con Flexbox y media queries, fuentes Fraunces e Inter.
- **Backend:** Node.js y Express 5.
- **Datos:** array de objetos en `backend/data/productos.js`.

## Arquitectura

```
Hermanos Jota
├── backend/                 API REST con Express
│   ├── server.js            arranque, middlewares globales y manejo de errores
│   ├── routes/              rutas con express.Router
│   ├── middlewares/         logger, 404 y manejador centralizado de errores
│   └── data/productos.js    catálogo de productos (array de objetos)
└── client/                  aplicación React
    ├── public/              index.html, logo y fotos de productos
    └── src/
        ├── App.js           estado global: vista actual, producto seleccionado y carrito
        ├── index.css        estilos del sitio
        └── components/
            ├── Navbar.jsx         menú y contador del carrito (por props)
            ├── Footer.jsx
            ├── ProductList.jsx    pide /api/productos y renderiza las tarjetas
            ├── ProductCard.jsx    una tarjeta de producto
            ├── ProductDetail.jsx  pide /api/productos/:id y muestra el detalle
            └── ContactForm.jsx    formulario controlado con useState y validación
```

### Flujo de datos

1. `ProductList` pide `GET /api/productos` al montarse. Mientras espera muestra "Cargando productos...", y si falla muestra un mensaje de error.
2. Cada `ProductCard` recibe su producto por props. "Ver producto" llama a `onVerDetalle(id)` y "Añadir al carrito" llama a `onAgregar(producto)`. Ambas funciones viven en `App.js`.
3. `App.js` cambia entre las vistas *productos*, *detalle* y *contacto* con renderizado condicional. Al elegir un producto guarda su `id`, y `ProductDetail` pide `GET /api/productos/:id` por su cuenta.
4. El carrito es un array en el estado de `App.js`. El contador del `Navbar` recibe `carrito.length` por props.

## Cómo instalar y ejecutar

Se necesitan dos terminales, una para cada servidor. Levantá primero el backend.

### 1. Backend (puerto 5000)

```bash
cd backend
npm install
npm start
```

Queda en `http://localhost:5000`. Probá `http://localhost:5000/api/productos`.

### 2. Frontend (puerto 3000)

```bash
cd client
npm install
npm start
```

Abrí `http://localhost:3000`. El cliente tiene `"proxy": "http://localhost:5000"` en `package.json`, así que las peticiones a `/api/...` se reenvían al backend sin problemas de CORS.

## Endpoints de la API

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/productos` | Lista completa de productos (JSON) |
| GET | `/api/productos/:id` | Un producto. Si el `id` no existe responde `404` con `{ "error": "Producto no encontrado" }` |
| GET | `/` | Mensaje de prueba de que el servidor funciona |
| cualquiera | ruta inexistente | `404` con `{ "status": 404, "error": "Not Found", "message": ... }` |

Los errores del servidor pasan por un único manejador en `middlewares/errorHandler.js`, que responde en JSON.

Cada petición se registra en la consola del backend con su método y URL (`middlewares/logger.js`).

## Decisiones tomadas

- **Puerto 5000 para el backend.** Create React App usa el 3000 por defecto, así que el backend se movió al 5000 para que no choquen.
- **Proxy en lugar de CORS.** Con `"proxy"` en el cliente, el código usa rutas relativas (`/api/productos`) y no hace falta habilitar CORS en Express.
- **Vistas con estado en lugar de React Router.** La consigna pide renderizado condicional, y para tres vistas (productos, detalle y contacto) un router sería complejidad extra. Si el sitio crece, conviene migrar a React Router.
- **Carrito simple.** Cada "Añadir al carrito" agrega una unidad y el contador muestra la cantidad de unidades agregadas. No hay vista del carrito ni total, porque no estaban en la consigna.
- **Datos en el backend.** El catálogo vive en `backend/data/productos.js`, así que el frontend no lee datos locales y todo pasa por la API.
- **Nombres de propiedades acordados.** Todos los componentes usan `nombre`, `precio`, `categoria`, `imagen`, `descripcion`, `descripcionCorta` y `detalles`.

## Estado de la entrega

Sprint 3 y 4 cubren la versión cliente-servidor en `/client` y `/backend`. Backend y frontend corren en local con los pasos de arriba. **El backend no está desplegado**: GitHub Pages solo sirve sitios estáticos, así que la versión pública sigue siendo la del Sprint 1 y 2.

## Flujo de trabajo en Git

- `main` es la rama de entrega. `sprint-N` es la rama de integración del sprint.
- Las ramas personales se llaman `feature/nombre-tarea` (por ejemplo `feature/detail-cart`) y salen de `sprint-N`.
- Nadie pushea directo a `main` ni a `sprint-N`: todo entra por Pull Request.
