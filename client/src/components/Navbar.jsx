function Navbar({ cantidadCarrito, vistaActual, cambiarVista }) {
  function irA(evento, vista) {
    evento.preventDefault();
    cambiarVista(vista);
  }

  return (
    <header className="header">
      <div className="header__container">
        <a
          href="#productos"
          className="header__logo"
          aria-label="Hermanos Jota - Inicio"
          onClick={(evento) => irA(evento, "productos")}
        >
          <img src="/img/logo.svg" alt="Hermanos Jota" />
        </a>

        <nav className="header__nav" aria-label="Navegación principal">
          <ul className="header__menu">
            <li>
              <a
                href="#productos"
                aria-current={vistaActual === "productos" ? "page" : undefined}
                onClick={(evento) => irA(evento, "productos")}
              >
                Productos
              </a>
            </li>
            <li>
              <a
                href="#contacto"
                aria-current={vistaActual === "contacto" ? "page" : undefined}
                onClick={(evento) => irA(evento, "contacto")}
              >
                Contacto
              </a>
            </li>
          </ul>
        </nav>

        <a href="#carrito" className="header__carrito" aria-label="Carrito de compras">
          <span>Carrito</span>
          <span>{cantidadCarrito}</span>
        </a>
      </div>
    </header>
  );
}

export default Navbar;
