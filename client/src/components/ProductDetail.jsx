import { useEffect, useState } from "react";

function ProductDetail({ id, onAgregar, onVolver }) {
  const [producto, setProducto] = useState(null);
  const [estado, setEstado] = useState("cargando"); // cargando | ok | noEncontrado | error
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    setEstado("cargando");
    setAgregado(false);

    fetch(`/api/productos/${id}`)
      .then((respuesta) => {
        if (respuesta.status === 404) {
          setEstado("noEncontrado");
          return null;
        }
        if (!respuesta.ok) {
          throw new Error(`Error ${respuesta.status}`);
        }
        return respuesta.json();
      })
      .then((datos) => {
        if (datos) {
          setProducto(datos);
          setEstado("ok");
        }
      })
      .catch(() => setEstado("error"));
  }, [id]);

  if (estado === "cargando") {
    return <p className="main-container">Cargando producto...</p>;
  }

  if (estado === "error") {
    return (
      <div className="main-container">
        <p>No fue posible cargar el producto.</p>
        <button type="button" onClick={onVolver}>Volver al catálogo</button>
      </div>
    );
  }

  if (estado === "noEncontrado") {
    return (
      <div className="main-container">
        <h1>Producto no encontrado</h1>
        <p>No se encontró el producto solicitado.</p>
        <button type="button" onClick={onVolver}>Volver al catálogo</button>
      </div>
    );
  }

  function agregar() {
    onAgregar(producto);
    setAgregado(true);
  }

  return (
    <section id="producto-detalle">
      <div className="producto-imagen">
        <img src={producto.imagen} alt={producto.nombre} />
      </div>

      <div className="producto-informacion">
        <button type="button" onClick={onVolver}>← Volver al catálogo</button>
        <span className="tarjeta-producto__categoria">{producto.categoria}</span>
        <h1>{producto.nombre}</h1>
        <p id="producto-descripcion">{producto.descripcion}</p>
        <p id="producto-precio">$ {producto.precio.toLocaleString("es-AR")}</p>

        <section className="producto-especificaciones">
          <h2>Especificaciones</h2>
          <table id="producto-detalles">
            <tbody>
              {Object.entries(producto.detalles).map(([clave, valor]) => (
                <tr key={clave}>
                  <th>{clave.toUpperCase()}</th>
                  <td>{valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <button
          type="button"
          className={`producto-detalle__carrito${agregado ? " boton--agregado" : ""}`}
          onClick={agregar}
        >
          {agregado ? "✓ Agregado" : "Añadir al carrito"}
        </button>
      </div>
    </section>
  );
}

export default ProductDetail;
