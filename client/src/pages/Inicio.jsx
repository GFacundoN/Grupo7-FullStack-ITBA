import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerProductos } from '../services/productosApi.js'
import { rutaImagen } from '../utils/rutaImagen.js'

const CANTIDAD_DESTACADOS = 3

function Inicio() {
  const [destacados, setDestacados] = useState([])

  useEffect(() => {
    let activo = true

    obtenerProductos()
      .then((productos) => {
        if (activo) setDestacados(productos.slice(0, CANTIDAD_DESTACADOS))
      })
      .catch(() => {
        // si la API falla, el inicio se muestra igual, sin la sección de destacados
      })

    // Cleanup: si el componente se desmonta antes de la respuesta, no se actualiza el estado.
    return () => {
      activo = false
    }
  }, [])

  return (
    <>
      <section className="hero">
        <div className="hero__contenido">
          <p className="hero__subtitulo">Muebles con historia</p>

          <h1>Diseño que perdura, piezas que cuentan historias</h1>

          <p>
            Muebles artesanales creados con materiales nobles, diseño atemporal y una mirada
            consciente hacia el futuro.
          </p>

          <Link to="/productos" className="hero__boton">
            Ver colección
          </Link>
        </div>

        <img
          className="hero__imagen"
          src="/img/productos/sillon-copacabana.png"
          alt="Sillón Copacabana"
        />
      </section>

      {destacados.length > 0 && (
        <section className="destacados" aria-labelledby="titulo-destacados">
          <div className="destacados__encabezado">
            <p className="destacados__subtitulo">Nuestra selección</p>
            <h2 id="titulo-destacados">Productos destacados</h2>
            <p>Piezas pensadas para acompañarte durante años y convertirse en parte de tu historia.</p>
          </div>

          <div className="destacados__productos">
            {destacados.map((producto) => (
              <article className="tarjeta-producto" key={producto._id}>
                <Link to={`/productos/${producto._id}`}>
                  <img src={rutaImagen(producto.imagenUrl)} alt={producto.nombre} />
                  <div className="tarjeta-producto__info">
                    <h3 className="tarjeta-producto__nombre">{producto.nombre}</h3>
                    <p className="tarjeta-producto__precio">
                      $ {Number(producto.precio).toLocaleString('es-AR')}
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          <div className="destacados__acciones">
            <Link to="/productos" className="destacados__ver-todos">
              Ver todos los productos
            </Link>
          </div>
        </section>
      )}

      <section className="historia" aria-labelledby="titulo-historia">
        <div className="historia__contenido">
          <p className="historia__subtitulo">Hermanos Jota</p>

          <h2 id="titulo-historia">Artesanía que honra el pasado y abraza el futuro</h2>

          <p>
            Cada pieza nace del encuentro entre manos expertas, materiales nobles y una forma de
            entender el diseño que valora tanto la tradición como la innovación.
          </p>

          <p>
            Creamos muebles pensados para durar, envejecer con carácter y formar parte de los
            espacios que habitamos.
          </p>
        </div>
      </section>
    </>
  )
}

export default Inicio
