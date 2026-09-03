const CLAVE_CARRITO = "carritoHermanosJota";


function obtenerCarrito() {
    const carritoGuardado = localStorage.getItem(CLAVE_CARRITO);

    if (carritoGuardado === null) {
        return [];
    }

    return JSON.parse(carritoGuardado);
}


function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));

    actualizarContadorCarrito(true);
}


function agregarAlCarrito(idProducto) {
    const carrito = obtenerCarrito();

    const productoExistente = carrito.find(
        (item) => item.id === idProducto
    );


    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push({
            id: idProducto,
            cantidad: 1
        });
    }


    guardarCarrito(carrito);
}


function obtenerCantidadCarrito() {
    const carrito = obtenerCarrito();

    return carrito.reduce(
        (total, item) => total + item.cantidad,
        0
    );
}


function actualizarContadorCarrito(animar = false) {
    const contadores = document.querySelectorAll(
        "[data-carrito-contador]"
    );

    const cantidad = obtenerCantidadCarrito();


    contadores.forEach((contador) => {
        contador.textContent = cantidad;

        if (animar) {
            contador.classList.remove("carrito-bump");
            void contador.offsetWidth; // fuerza reinicio de la animacion
            contador.classList.add("carrito-bump");
        }
    });
}


// Feedback visual al agregar un producto: el boton confirma con un tilde
function confirmarAgregado(boton) {
    if (!boton) {
        return;
    }

    clearTimeout(boton._timeoutAgregado);

    boton.classList.add("boton--agregado");
    boton.classList.remove("boton--pop");
    void boton.offsetWidth;
    boton.classList.add("boton--pop");
    boton.textContent = "✓ Agregado";

    boton._timeoutAgregado = setTimeout(() => {
        boton.classList.remove("boton--agregado");
        boton.classList.remove("boton--pop");
        boton.textContent = "Añadir al carrito";
    }, 1500);
}


document.addEventListener("DOMContentLoaded", () => {
    actualizarContadorCarrito();
});