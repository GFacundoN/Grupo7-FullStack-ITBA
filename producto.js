const parametros = new URLSearchParams(window.location.search);

const id = Number(parametros.get("id"));

const producto = productos.find(producto => producto.id === id);

if (producto) {

    document.getElementById("producto-nombre").textContent =
        producto.nombre;

    document.getElementById("producto-descripcion").textContent =
        producto.descripcion;

    document.getElementById("producto-precio").textContent =
        `$${producto.precio.toLocaleString("es-AR")}`;

    const imagen = document.getElementById("producto-imagen");

    imagen.src = producto.imagen;
    imagen.alt = producto.nombre;

    const detalles = document.querySelector("#producto-detalles tbody");

    detalles.innerHTML = "";

    for (const [nombre, valor] of Object.entries(producto.detalles)) {

        const fila = document.createElement("tr");

        const nombreCelda = document.createElement("th");
        const valorCelda = document.createElement("td");

        nombreCelda.textContent = nombre.toUpperCase();
        valorCelda.textContent = valor;

        fila.appendChild(nombreCelda);
        fila.appendChild(valorCelda);

        detalles.appendChild(fila);
    }

    const botonCarrito = document.getElementById("boton-carrito");

    botonCarrito.addEventListener("click", () => {
        agregarAlCarrito(producto.id);
        confirmarAgregado(botonCarrito);
    });

} else {

    document.getElementById("detalle-producto").innerHTML = `
        <h1>Producto no encontrado</h1>
        <p>No se encontró el producto solicitado.</p>
    `;
}