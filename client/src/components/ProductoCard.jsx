import { Link } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext.jsx'
import { rutaImagen } from '../utils/rutaImagen.js'

function ProductoCard({ producto }) {
  const { agregarAlCarrito } = useCarrito()

  return (
    <article className="producto-card">
      <img
        className="producto-card__imagen"
        src={rutaImagen(producto.imagenUrl)}
        alt={producto.nombre}
      />

      <div className="producto-card__contenido">
        {producto.categoria && (
          <span className="producto-card__categoria">{producto.categoria}</span>
        )}

        <h3 className="producto-card__nombre">{producto.nombre}</h3>

        {producto.descripcionCorta && (
          <p className="producto-card__descripcion">{producto.descripcionCorta}</p>
        )}

        <p className="producto-card__precio">
          $ {Number(producto.precio).toLocaleString('es-AR')}
        </p>

        <Link to={`/productos/${producto._id}`} className="producto-card__detalle">
          Ver producto
        </Link>

        <button
          type="button"
          className="producto-card__carrito"
          onClick={() => agregarAlCarrito(producto)}
        >
          Añadir al carrito
        </button>
      </div>
    </article>
  )
}

export default ProductoCard
