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

    actualizarContadorCarrito();
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


function actualizarContadorCarrito() {
    const contadores = document.querySelectorAll(
        "[data-carrito-contador]"
    );

    const cantidad = obtenerCantidadCarrito();


    contadores.forEach((contador) => {
        contador.textContent = cantidad;
    });
}


document.addEventListener("DOMContentLoaded", () => {
    actualizarContadorCarrito();
});