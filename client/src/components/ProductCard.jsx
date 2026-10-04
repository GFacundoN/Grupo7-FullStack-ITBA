function ProductCard({ producto, onVerDetalle, onAgregar }) {
  function verDetalle(evento) {
    evento.preventDefault();
    onVerDetalle(producto.id);
  }

  return (
    <article className="producto-card">
      <img className="producto-card__imagen" src={producto.imagen} alt={producto.nombre} />

      <div className="producto-card__contenido">
        <span className="producto-card__categoria">{producto.categoria}</span>
        <h3 className="producto-card__nombre">{producto.nombre}</h3>
        <p className="producto-card__descripcion">{producto.descripcionCorta}</p>
        <p className="producto-card__precio">$ {producto.precio.toLocaleString("es-AR")}</p>

        <a href="#producto" className="producto-card__detalle" onClick={verDetalle}>
          Ver producto
        </a>

        <button
          type="button"
          className="producto-card__carrito"
          onClick={() => onAgregar(producto)}
        >
          Añadir al carrito
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
