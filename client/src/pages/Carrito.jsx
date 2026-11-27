import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCarrito } from '../context/CarritoContext.jsx'
import { crearPedido } from '../services/pedidosApi.js'
import { rutaImagen } from '../utils/rutaImagen.js'

function Carrito() {
  const navigate = useNavigate()
  const { isAuthenticated, token } = useAuth()
  const {
    items,
    total,
    cantidadTotal,
    actualizarCantidad,
    quitarProducto,
    vaciarCarrito,
  } = useCarrito()

  const [enviando, setEnviando] = useState(false)
  const [errorCompra, setErrorCompra] = useState('')
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null)

  async function manejarFinalizarCompra() {
    if (enviando || items.length === 0) return

    // Si no hay sesión activa, redirigir al login
    if (!isAuthenticated || !token) {
      navigate('/login', { state: { from: '/carrito' } })
      return
    }

    setEnviando(true)
    setErrorCompra('')

    try {
      const payloadProductos = items.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
      }))

      const pedidoCreado = await crearPedido(payloadProductos, token)
      setPedidoConfirmado(pedidoCreado)
      vaciarCarrito()
    } catch (error) {
      setErrorCompra(
        error.message || 'No se pudo procesar tu pedido. Intentá nuevamente.',
      )
    } finally {
      setEnviando(false)
    }
  }

  // Pantalla de confirmación tras compra exitosa
  if (pedidoConfirmado) {
    return (
      <section className="main-container carrito-page">
        <div className="carrito-confirmacion" role="status">
          <h1>¡Pedido confirmado!</h1>
          <p>
            Tu compra fue registrada correctamente bajo el número{' '}
            <strong>#{pedidoConfirmado._id || pedidoConfirmado.id}</strong>.
          </p>
          <p className="carrito-confirmacion__total">
            Total abonado: $ {Number(pedidoConfirmado.total).toLocaleString('es-AR')}
          </p>

          <div className="carrito-confirmacion__acciones">
            <Link to="/mis-pedidos" className="boton-principal">
              Ver mis pedidos
            </Link>
            <Link to="/productos" className="boton-enlace">
              Seguir explorando el catálogo
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // Pantalla cuando el carrito está vacío
  if (items.length === 0) {
    return (
      <section className="main-container carrito-page">
        <h1>Tu carrito</h1>
        <p>Todavía no agregaste productos al carrito.</p>
        <Link to="/productos" className="boton-enlace">
          Ir al catálogo
        </Link>
      </section>
    )
  }

  return (
    <section className="main-container carrito-page">
      <div className="carrito-page__header">
        <h1>Tu carrito ({cantidadTotal})</h1>
        <button
          type="button"
          className="carrito-btn-secundario"
          onClick={vaciarCarrito}
          disabled={enviando}
        >
          Vaciar carrito
        </button>
      </div>

      <div className="carrito-layout">
        <ul className="carrito-lista">
          {items.map((item) => (
            <li key={item.productoId} className="carrito-item">
              <img
                src={rutaImagen(item.imagenUrl)}
                alt={item.nombre}
                className="carrito-item__imagen"
              />

              <div className="carrito-item__info">
                <Link
                  to={`/productos/${item.productoId}`}
                  className="carrito-item__nombre"
                >
                  {item.nombre}
                </Link>
                <p className="carrito-item__precio">
                  $ {Number(item.precio).toLocaleString('es-AR')} c/u
                </p>
              </div>

              <div className="carrito-item__controles">
                <button
                  type="button"
                  aria-label={`Disminuir cantidad de ${item.nombre}`}
                  onClick={() =>
                    actualizarCantidad(item.productoId, item.cantidad - 1)
                  }
                  disabled={enviando}
                >
                  −
                </button>
                <span>{item.cantidad}</span>
                <button
                  type="button"
                  aria-label={`Aumentar cantidad de ${item.nombre}`}
                  onClick={() =>
                    actualizarCantidad(item.productoId, item.cantidad + 1)
                  }
                  disabled={enviando}
                >
                  +
                </button>
              </div>

              <p className="carrito-item__subtotal">
                $ {(item.precio * item.cantidad).toLocaleString('es-AR')}
              </p>

              <button
                type="button"
                className="carrito-item__quitar"
                aria-label={`Quitar ${item.nombre} del carrito`}
                onClick={() => quitarProducto(item.productoId)}
                disabled={enviando}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>

        <aside className="carrito-resumen">
          <h2>Resumen de compra</h2>

          <div className="carrito-resumen__fila">
            <span>Productos ({cantidadTotal})</span>
            <span>$ {Number(total).toLocaleString('es-AR')}</span>
          </div>

          <div className="carrito-resumen__total">
            <span>Total</span>
            <span>$ {Number(total).toLocaleString('es-AR')}</span>
          </div>

          {errorCompra && (
            <p className="carrito-error" role="alert">
              {errorCompra}
            </p>
          )}

          {!isAuthenticated && (
            <p className="carrito-aviso-sesion">
              Necesitás iniciar sesión para confirmar tu compra.
            </p>
          )}

          <button
            type="button"
            className="carrito-btn-finalizar"
            onClick={manejarFinalizarCompra}
            disabled={enviando || items.length === 0}
          >
            {enviando
              ? 'Procesando compra...'
              : isAuthenticated
                ? 'Finalizar compra'
                : 'Iniciar sesión para comprar'}
          </button>
        </aside>
      </div>
    </section>
  )
}

export default Carrito