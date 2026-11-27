import { Link, NavLink } from 'react-router-dom'
import { useCarrito } from '../context/CarritoContext.jsx'

function Navbar() {
  const { cantidadTotal } = useCarrito()

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
          <Link
            to="/carrito"
            className="header__carrito"
            aria-label={`Carrito de compras, ${cantidadTotal} productos`}
          >
            <span>Carrito</span>
            <span data-carrito-contador>{cantidadTotal}</span>
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Navbar