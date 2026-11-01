import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProductForm from '../components/ProductForm.jsx'
import { actualizarProducto, obtenerProducto } from '../services/productosApi.js'

function EditarProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [producto, setProducto] = useState(null)
  const [estado, setEstado] = useState('cargando') // cargando | ok | noEncontrado | error
  const [guardado, setGuardado] = useState(false)

  useEffect(() => {
    let activo = true
    setEstado('cargando')

    obtenerProducto(id)
      .then((datos) => {
        if (!activo) return
        setProducto(datos)
        setEstado('ok')
      })
      .catch((error) => {
        if (activo) setEstado(error.status === 404 ? 'noEncontrado' : 'error')
      })

    // Cleanup: si se desmonta antes de que llegue la respuesta, se ignora.
    return () => {
      activo = false
    }
  }, [id])

  // Tras guardar, se muestra la confirmación un instante y se vuelve al detalle.
  useEffect(() => {
    if (!guardado) return
    const temporizador = setTimeout(() => navigate(`/productos/${id}`), 1200)
    return () => clearTimeout(temporizador)
  }, [guardado, id, navigate])

  async function guardar(datos) {
    await actualizarProducto(id, datos)
    setGuardado(true)
  }

  if (estado === 'cargando') {
    return <p className="main-container">Cargando producto...</p>
  }

  if (estado === 'noEncontrado' || estado === 'error') {
    return (
      <div className="main-container">
        <h1>{estado === 'noEncontrado' ? 'Producto no encontrado' : 'Ocurrió un error'}</h1>
        <p>
          {estado === 'noEncontrado'
            ? 'No existe el producto que querés editar.'
            : 'No fue posible cargar el producto.'}
        </p>
        <Link to="/productos" className="boton-enlace">Volver al catálogo</Link>
      </div>
    )
  }

  return (
    <div className="main-container">
      <h1>Editar producto</h1>
      <p className="pagina-intro">Modificá los datos de "{producto.nombre}".</p>

      {guardado ? (
        <div className="success-message" role="status">
          ✓ Cambios guardados correctamente. Redirigiendo...
        </div>
      ) : (
        <ProductForm
          valoresIniciales={{
            nombre: producto.nombre ?? '',
            descripcion: producto.descripcion ?? '',
            precio: producto.precio ?? '',
            stock: producto.stock ?? '',
            imagenUrl: producto.imagenUrl ?? '',
          }}
          textoBoton="Guardar cambios"
          onSubmit={guardar}
        />
      )}
    </div>
  )
}

export default EditarProducto
