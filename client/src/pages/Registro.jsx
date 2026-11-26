import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { emailValido } from '../utils/emailValido.js'

const MINIMO_PASSWORD = 6

function Registro() {
  const { register, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [registrado, setRegistrado] = useState(false)

  useEffect(() => {
    if (!registrado) return
    const temporizador = setTimeout(() => navigate('/login'), 1200)
    return () => clearTimeout(temporizador)
  }, [registrado, navigate])

  function cambiar(evento) {
    const { name, value } = evento.target
    setForm((actual) => ({ ...actual, [name]: value }))
  }

  function validar() {
    const nuevos = {}

    if (form.nombre.trim() === '') {
      nuevos.nombre = 'El nombre es obligatorio.'
    }

    if (form.email.trim() === '') {
      nuevos.email = 'El correo electrónico es obligatorio.'
    } else if (!emailValido(form.email.trim())) {
      nuevos.email = 'Ingresá un correo electrónico válido.'
    }

    if (form.password.length < MINIMO_PASSWORD) {
      nuevos.password = `La contraseña debe tener al menos ${MINIMO_PASSWORD} caracteres.`
    }

    return nuevos
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErrorServidor('')

    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    try {
      await register({
        nombre: form.nombre.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      setRegistrado(true)
    } catch (error) {
      setErrorServidor(error.message)
    } finally {
      setEnviando(false)
    }
  }

  if (isLoading) {
    return <p className="main-container">Verificando tu sesión...</p>
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="main-container">
      <h1>Crear cuenta</h1>
      <p className="pagina-intro">Registrate para comprar en Hermanos Jota.</p>

      {registrado ? (
        <div className="success-message" role="status">
          ✓ Cuenta creada correctamente. Redirigiendo al inicio de sesión...
        </div>
      ) : (
        <>
          <form className="contact-form" onSubmit={enviar} noValidate>
            <div className="form-group">
              <label htmlFor="nombre">Nombre completo</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                autoComplete="name"
                value={form.nombre}
                className={errores.nombre ? 'invalid' : ''}
                onChange={cambiar}
              />
              <small className="error-msg">{errores.nombre}</small>
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                value={form.email}
                className={errores.email ? 'invalid' : ''}
                onChange={cambiar}
              />
              <small className="error-msg">{errores.email}</small>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                value={form.password}
                className={errores.password ? 'invalid' : ''}
                onChange={cambiar}
              />
              <small className="error-msg">{errores.password}</small>
            </div>

            {errorServidor && (
              <p className="error-general" role="alert">
                {errorServidor}
              </p>
            )}

            <button type="submit" className="boton-primario" disabled={enviando}>
              {enviando ? 'Creando cuenta...' : 'Registrarme'}
            </button>
          </form>

          <p className="pagina-enlace">
            ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
          </p>
        </>
      )}
    </div>
  )
}

export default Registro
