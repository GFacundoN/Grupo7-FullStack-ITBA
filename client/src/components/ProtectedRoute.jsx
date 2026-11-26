import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, errorSesion, reintentarSesion } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <p className="main-container">Verificando tu sesión...</p>
  }

  if (isAuthenticated) {
    return children
  }

  if (errorSesion) {
    return (
      <div className="main-container">
        <p className="error-general" role="alert">
          {errorSesion}
        </p>
        <button type="button" className="boton-primario" onClick={reintentarSesion}>
          Reintentar
        </button>
      </div>
    )
  }

  return <Navigate to="/login" replace state={{ from: location.pathname }} />
}

export default ProtectedRoute
