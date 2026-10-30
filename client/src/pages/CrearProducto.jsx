import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProductForm from '../components/ProductForm.jsx'
import { crearProducto } from '../services/productosApi.js'

function CrearProducto() {
  const navigate = useNavigate()
  const [creado, setCreado] = useState(null)

  // Tras crear, se muestra la confirmación un instante y se redirige al detalle.
  useEffect(() => {
    if (!creado) return
    const temporizador = setTimeout(() => navigate(`/productos/${creado._id}`), 1200)
    return () => clearTimeout(temporizador)
  }, [creado, navigate])

  async function guardar(datos) {
    setCreado(await crearProducto(datos))
  }

  return (
    <div className="main-container">
      <h1>Nuevo producto</h1>
      <p className="pagina-intro">Completá los datos para agregar un producto al catálogo.</p>

      {creado ? (
        <div className="success-message" role="status">
          ✓ Producto "{creado.nombre}" creado correctamente. Redirigiendo...
        </div>
      ) : (
        <ProductForm textoBoton="Crear producto" onSubmit={guardar} />
      )}
    </div>
  )
}

export default CrearProducto
