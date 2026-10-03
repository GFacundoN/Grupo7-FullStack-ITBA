function Footer({ cambiarVista }) {
  function irA(evento, vista) {
    evento.preventDefault();
    cambiarVista(vista);
  }

  return (
    <footer className="footer">
      <div className="footer__container">
        <section className="footer__marca">
          <h2>Hermanos Jota</h2>
          <p>Muebles artesanales con historia, diseñados para perdurar.</p>
        </section>

        <section className="footer__navegacion">
          <h2>Navegación</h2>
          <nav aria-label="Navegación del pie de página">
            <ul>
              <li>
                <a href="#productos" onClick={(evento) => irA(evento, "productos")}>
                  Productos
                </a>
              </li>
              <li>
                <a href="#contacto" onClick={(evento) => irA(evento, "contacto")}>
                  Contacto
                </a>
              </li>
            </ul>
          </nav>
        </section>

        <section className="footer__contacto">
          <h2>Casa Taller</h2>
          <address>
            <p>
              Av. San Juan 2847
              <br />
              San Cristóbal, CABA
            </p>
            <p>
              <a href="mailto:info@hermanosjota.com.ar">info@hermanosjota.com.ar</a>
            </p>
            <p>
              <a href="tel:+541145678900">+54 11 4567-8900</a>
            </p>
          </address>
        </section>

        <section className="footer__redes">
          <h2>Seguinos</h2>
          <a
            href="https://www.instagram.com/hermanosjota_ba"
            target="_blank"
            rel="noopener noreferrer"
          >
            @hermanosjota_ba
          </a>
        </section>
      </div>

      <div className="footer__legal">
        <p>© 2026 Hermanos Jota. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default Footer;
