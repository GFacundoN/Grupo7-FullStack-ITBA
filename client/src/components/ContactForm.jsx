import { useState } from "react";

function ContactForm() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [errores, setErrores] = useState({});
  const [enviado, setEnviado] = useState(false);

  function emailValido(texto) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto);
  }

  function validar() {
    const nuevosErrores = {};

    if (nombre.trim() === "") {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    }

    if (email.trim() === "") {
      nuevosErrores.email = "El correo electrónico es obligatorio.";
    } else if (!emailValido(email.trim())) {
      nuevosErrores.email = "Ingresá un correo electrónico válido.";
    }

    if (mensaje.trim() === "") {
      nuevosErrores.mensaje = "El mensaje no puede estar vacío.";
    } else if (mensaje.trim().length < 10) {
      nuevosErrores.mensaje = "El mensaje debe tener al menos 10 caracteres.";
    }

    return nuevosErrores;
  }

  function enviarFormulario(evento) {
    evento.preventDefault();
    const nuevosErrores = validar();
    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length === 0) {
      setNombre("");
      setEmail("");
      setMensaje("");
      setEnviado(true);
    } else {
      setEnviado(false);
    }
  }

  return (
    <div className="main-container">
      <section className="contact-section">
        <h2>Ponete en contacto con nosotros</h2>
        <p>Dejanos tu consulta y te responderemos a la brevedad.</p>

        <form className="contact-form" onSubmit={enviarFormulario} noValidate>
          <div className="form-group">
            <label htmlFor="nombre">Nombre completo</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              placeholder="Ej: Juan Pérez"
              className={errores.nombre ? "invalid" : ""}
              onChange={(evento) => setNombre(evento.target.value)}
            />
            <small className="error-msg">{errores.nombre}</small>
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              placeholder="Ej: juan@email.com"
              className={errores.email ? "invalid" : ""}
              onChange={(evento) => setEmail(evento.target.value)}
            />
            <small className="error-msg">{errores.email}</small>
          </div>

          <div className="form-group">
            <label htmlFor="mensaje">Mensaje</label>
            <textarea
              id="mensaje"
              rows="5"
              value={mensaje}
              placeholder="Escribí tu mensaje aquí..."
              className={errores.mensaje ? "invalid" : ""}
              onChange={(evento) => setMensaje(evento.target.value)}
            />
            <small className="error-msg">{errores.mensaje}</small>
          </div>

          <button type="submit" id="btn-submit">
            Enviar mensaje
          </button>
        </form>

        {enviado && (
          <div className="success-message">
            ✓ ¡Gracias por tu mensaje! Nos pondremos en contacto pronto.
          </div>
        )}
      </section>
    </div>
  );
}

export default ContactForm;
