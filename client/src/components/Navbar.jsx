import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext.jsx'

function Navbar() {
  const { cantidadTotal } = useCarrito()
  const [avisoVisible, setAvisoVisible] = useState(false)

  // El aviso "Próximamente" se oculta solo a los 2 segundos.
  useEffect(() => {
    if (!avisoVisible) return
    const temporizador = setTimeout(() => setAvisoVisible(false), 2000)
    return () => clearTimeout(temporizador)
  }, [avisoVisible])

  return (
    <header className="header">
      <div className="header__container">
        <Link to="/" className="header__logo" aria-label="Hermanos Jota - Inicio">
          <img src="/img/logo.svg" alt="Hermanos Jota" />
        </Link>

        <nav className="header__nav" aria-label="Navegación principal">
          <ul className="header__menu">
            <li>
              <NavLink to="/" end>Inicio</NavLink>
            </li>
            <li>
              <NavLink to="/productos">Productos</NavLink>
            </li>
            <li>
              <NavLink to="/contacto">Contacto</NavLink>
            </li>
            <li>
              <NavLink to="/admin/crear-producto">Nuevo producto</NavLink>
            </li>
          </ul>
        </nav>

        <div className="header__carrito-wrapper">
          <button
            type="button"
            className="header__carrito"
            aria-label={`Carrito de compras, ${cantidadTotal} productos`}
            onClick={() => setAvisoVisible(true)}
          >
            <span>Carrito</span>
            <span data-carrito-contador>{cantidadTotal}</span>
          </button>
          <p className="header__aviso" role="status">
            {avisoVisible ? 'El carrito estará disponible próximamente.' : ''}
          </p>
        </div>
      </div>
    </header>
  )
}

export default Navbar
