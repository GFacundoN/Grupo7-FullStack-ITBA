import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { emailValido } from '../utils/emailValido.js'

function Login() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiar(evento) {
    const { name, value } = evento.target
    setForm((actual) => ({ ...actual, [name]: value }))
  }

  function validar() {
    const nuevos = {}

    if (form.email.trim() === '') {
      nuevos.email = 'El correo electrónico es obligatorio.'
    } else if (!emailValido(form.email.trim())) {
      nuevos.email = 'Ingresá un correo electrónico válido.'
    }

    if (form.password === '') {
      nuevos.password = 'La contraseña es obligatoria.'
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
      await login(form.email.trim(), form.password)
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
    return <Navigate to={location.state?.from ?? '/'} replace />
  }

  return (
    <div className="main-container">
      <h1>Iniciar sesión</h1>
      <p className="pagina-intro">Ingresá con tu cuenta de Hermanos Jota.</p>

      <form className="contact-form" onSubmit={enviar} noValidate>
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
            autoComplete="current-password"
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
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p className="pagina-enlace">
        ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
      </p>
    </div>
  )
}

export default Login
