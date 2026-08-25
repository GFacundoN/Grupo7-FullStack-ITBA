const contenedorDestacados = document.getElementById("productos-destacados");
const contadorCarrito = document.getElementById("contador-carrito");

let cantidadCarrito = 0;

function obtenerProductosDestacados() {
    return new Promise((resolve) => {
        setTimeout(() => {
            const destacados = productos
                .filter((producto) => producto.destacado)
                .slice(0, 4);

            resolve(destacados);
        }, 800);
    });
}

function crearTarjetaProducto(producto) {
    const articulo = document.createElement("article");
    articulo.classList.add("producto-card");

    const imagen = document.createElement("img");
    imagen.src = producto.imagen;
    imagen.alt = producto.nombre;
    imagen.classList.add("producto-card__imagen");

    const contenido = document.createElement("div");
    contenido.classList.add("producto-card__contenido");

    const titulo = document.createElement("h3");
    titulo.textContent = producto.nombre;

    const descripcion = document.createElement("p");
    descripcion.textContent = producto.descripcion;

    const precio = document.createElement("p");
    precio.classList.add("producto-card__precio");
    precio.textContent = `$${producto.precio.toLocaleString("es-AR")}`;

    const enlaceDetalle = document.createElement("a");
    enlaceDetalle.href = `producto.html?id=${producto.id}`;
    enlaceDetalle.textContent = "Ver producto";
    enlaceDetalle.classList.add("producto-card__detalle");

    const botonCarrito = document.createElement("button");
    botonCarrito.type = "button";
    botonCarrito.textContent = "Añadir al carrito";
    botonCarrito.classList.add("producto-card__carrito");

    botonCarrito.addEventListener("click", () => {
        cantidadCarrito++;
        actualizarContadorCarrito();
    });

    contenido.appendChild(titulo);
    contenido.appendChild(descripcion);
    contenido.appendChild(precio);
    contenido.appendChild(enlaceDetalle);
    contenido.appendChild(botonCarrito);

    articulo.appendChild(imagen);
    articulo.appendChild(contenido);

    return articulo;
}

function renderizarProductos(productosDestacados) {
    contenedorDestacados.innerHTML = "";

    productosDestacados.forEach((producto) => {
        const tarjeta = crearTarjetaProducto(producto);
        contenedorDestacados.appendChild(tarjeta);
    });
}

function actualizarContadorCarrito() {
    contadorCarrito.textContent = cantidadCarrito;
}

async function cargarProductosDestacados() {
    try {
        contenedorDestacados.textContent = "Cargando productos...";

        const productosDestacados = await obtenerProductosDestacados();

        renderizarProductos(productosDestacados);
    } catch (error) {
        contenedorDestacados.textContent =
            "No fue posible cargar los productos.";

        console.error("Error al cargar productos:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarProductosDestacados();
    actualizarContadorCarrito();
});