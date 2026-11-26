import { useAuth } from '../context/AuthContext.jsx'
import '../styles/cuenta.css'

// Pantalla protegida (ver ProtectedRoute, de Germán). Para cuando llegue acá
// ya hay sesión validada, pero se guarda con `?.` por las dudas.
function Perfil() {
  const { user } = useAuth()

  return (
    <div className="main-container">
      <h1>Mi perfil</h1>
      <p className="pagina-intro">Estos son los datos de tu cuenta.</p>

      <dl className="perfil-datos">
        <div>
          <dt>Nombre</dt>
          <dd>{user?.nombre}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.email}</dd>
        </div>
      </dl>
    </div>
  )
}

export default Perfil
