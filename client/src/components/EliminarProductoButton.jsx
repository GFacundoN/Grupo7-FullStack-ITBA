import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eliminarProducto } from '../services/productosApi.js'

// Pide confirmación, llama DELETE /api/productos/:id y vuelve al catálogo.
// El catálogo se re-consulta al montarse, así que no hace falta actualizar
// ninguna lista en memoria: al volver ya no va a traer este producto.
function EliminarProductoButton({ id, nombre }) {
  const navigate = useNavigate()
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  async function eliminar() {
    const confirmado = window.confirm(
      `¿Eliminar "${nombre}" del catálogo? Esta acción no se puede deshacer.`,
    )
    if (!confirmado) return

    setError('')
    setEliminando(true)
    try {
      await eliminarProducto(id)
      navigate('/productos')
    } catch (error) {
      setError(error.message)
      setEliminando(false)
    }
  }

  return (
    <div className="eliminar-producto">
      <button
        type="button"
        className="boton-peligro"
        onClick={eliminar}
        disabled={eliminando}
      >
        {eliminando ? 'Eliminando...' : 'Eliminar'}
      </button>
      {error && (
        <p className="error-general" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default EliminarProductoButton
