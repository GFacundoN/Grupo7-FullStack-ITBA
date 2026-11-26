import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { obtenerMisPedidos } from '../services/pedidosApi.js'
import '../styles/cuenta.css'

function MisPedidos() {
  const { token } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [estado, setEstado] = useState('cargando') // cargando | ok | error

  useEffect(() => {
    let activo = true
    setEstado('cargando')

    obtenerMisPedidos(token)
      .then((datos) => {
        if (!activo) return
        setPedidos(datos)
        setEstado('ok')
      })
      .catch(() => {
        if (activo) setEstado('error')
      })

    // Cleanup: si se desmonta antes de la respuesta, se ignora.
    return () => {
      activo = false
    }
  }, [token])

  if (estado === 'cargando') {
    return <p className="main-container">Cargando tus pedidos...</p>
  }

  if (estado === 'error') {
    return <p className="main-container">No fue posible cargar tus pedidos.</p>
  }

  return (
    <div className="main-container">
      <h1>Mis pedidos</h1>
      <p className="pagina-intro">Historial de tus compras en Hermanos Jota.</p>

      {pedidos.length === 0 ? (
        <p>Todavía no hiciste ningún pedido.</p>
      ) : (
        <ul className="pedidos-lista">
          {pedidos.map((pedido) => {
            // El contrato dice "id", pero el resto del proyecto devuelve "_id".
            const id = pedido.id ?? pedido._id

            return (
              <li key={id} className="pedido-card">
                <div className="pedido-card__encabezado">
                  <span className="pedido-card__fecha">
                    {new Date(pedido.fecha).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  {/* El total siempre es el que calculó el servidor, nunca se recalcula acá. */}
                  <span className="pedido-card__total">
                    $ {Number(pedido.total).toLocaleString('es-AR')}
                  </span>
                </div>

                <ul className="pedido-card__items">
                  {pedido.productos.map((item) => (
                    <li key={item.productoId}>
                      {item.cantidad} × {item.nombre} — $
                      {' '}
                      {Number(item.precioUnitario * item.cantidad).toLocaleString('es-AR')}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default MisPedidos
