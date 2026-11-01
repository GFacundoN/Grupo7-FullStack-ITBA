import { useParams } from 'react-router-dom'

// PLACEHOLDER (Germán): la página real es de Facundo (detalle con GET /api/productos/:id).
function ProductoDetalle() {
  const { id } = useParams()

  return (
    <div className="main-container">
      <h1>Detalle del producto</h1>
      <p>Detalle en construcción (id: {id}).</p>
    </div>
  )
}

export default ProductoDetalle
