import { useEffect, useState } from 'react'
import ProductoCard from '../components/ProductoCard.jsx'
import { obtenerProductos } from '../services/productosApi.js'

function Productos() {
  const [productos, setProductos] = useState([])
  const [estado, setEstado] = useState('cargando') // cargando | ok | error

  useEffect(() => {
    let activo = true
    setEstado('cargando')

    obtenerProductos()
      .then((datos) => {
        if (!activo) return
        setProductos(datos)
        setEstado('ok')
      })
      .catch(() => {
        if (activo) setEstado('error')
      })

    // Cleanup: si se desmonta antes de que llegue la respuesta, se ignora.
    return () => {
      activo = false
    }
  }, [])

  return (
    <div className="catalogo">
      <section>
        <h1>Catálogo</h1>
        <p>Piezas atemporales, pensadas para acompañar generaciones.</p>

        {estado === 'cargando' && <p>Cargando productos...</p>}

        {estado === 'error' && <p>No fue posible cargar los productos.</p>}

        {estado === 'ok' && productos.length === 0 && (
          <p>Todavía no hay productos cargados en el catálogo.</p>
        )}

        {estado === 'ok' && productos.length > 0 && (
          <div className="grilla-productos">
            {productos.map((producto) => (
              <ProductoCard key={producto._id} producto={producto} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Productos
