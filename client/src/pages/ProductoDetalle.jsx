import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EliminarProductoButton from '../components/EliminarProductoButton.jsx'
import { useCarrito } from '../context/CarritoContext.jsx'
import { obtenerProducto } from '../services/productosApi.js'
import { rutaImagen } from '../utils/rutaImagen.js'

function ProductoDetalle() {
  const { id } = useParams()
  const { agregarAlCarrito } = useCarrito()
  const [producto, setProducto] = useState(null)
  const [estado, setEstado] = useState('cargando') // cargando | ok | noEncontrado | error
  const [agregado, setAgregado] = useState(false)

  useEffect(() => {
    let activo = true
    setEstado('cargando')
    setAgregado(false)

    obtenerProducto(id)
      .then((datos) => {
        if (!activo) return
        setProducto(datos)
        setEstado('ok')
      })
      .catch((error) => {
        if (activo) setEstado(error.status === 404 ? 'noEncontrado' : 'error')
      })

    // Cleanup: si cambia el id o se desmonta antes de la respuesta, se ignora.
    return () => {
      activo = false
    }
  }, [id])

  if (estado === 'cargando') {
    return <p className="main-container">Cargando producto...</p>
  }

  if (estado === 'noEncontrado' || estado === 'error') {
    return (
      <div className="main-container">
        <h1>{estado === 'noEncontrado' ? 'Producto no encontrado' : 'Ocurrió un error'}</h1>
        <p>
          {estado === 'noEncontrado'
            ? 'No existe el producto que buscás.'
            : 'No fue posible cargar el producto.'}
        </p>
        <Link to="/productos" className="boton-enlace">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  function agregar() {
    agregarAlCarrito(producto)
    setAgregado(true)
  }

  const tieneDetalles = producto.detalles && Object.keys(producto.detalles).length > 0

  return (
    <section id="producto-detalle">
      <div className="producto-imagen">
        <img src={rutaImagen(producto.imagenUrl)} alt={producto.nombre} />
      </div>

      <div className="producto-informacion">
        <Link to="/productos" className="boton-enlace">
          ← Volver al catálogo
        </Link>

        {producto.categoria && (
          <span className="producto-card__categoria">{producto.categoria}</span>
        )}

        <h1>{producto.nombre}</h1>

        {producto.descripcion && <p id="producto-descripcion">{producto.descripcion}</p>}

        <p id="producto-precio">$ {Number(producto.precio).toLocaleString('es-AR')}</p>

        {tieneDetalles && (
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
        )}

        <div className="producto-detalle__acciones">
          <button
            type="button"
            className={`producto-detalle__carrito${agregado ? ' boton--agregado' : ''}`}
            onClick={agregar}
          >
            {agregado ? '✓ Agregado' : 'Añadir al carrito'}
          </button>

          <Link to={`/admin/editar-producto/${producto._id}`} className="boton-enlace">
            Editar
          </Link>

          <EliminarProductoButton id={producto._id} nombre={producto.nombre} />
        </div>
      </div>
    </section>
  )
}

export default ProductoDetalle
