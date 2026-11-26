import { createContext, useContext, useEffect, useState } from 'react'
import { iniciarSesion, obtenerUsuarioActual, registrarUsuario } from '../services/authApi.js'

const CLAVE_TOKEN = 'authToken'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(CLAVE_TOKEN))
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(() => localStorage.getItem(CLAVE_TOKEN) !== null)
  const [errorSesion, setErrorSesion] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const guardado = localStorage.getItem(CLAVE_TOKEN)
    if (!guardado) return

    let activo = true
    const vigente = () => activo && localStorage.getItem(CLAVE_TOKEN) === guardado

    setIsLoading(true)
    setErrorSesion('')

    obtenerUsuarioActual(guardado)
      .then((usuario) => {
        if (!vigente()) return
        setUser(usuario)
        setIsLoading(false)
      })
      .catch((error) => {
        if (!vigente()) return
        if (error.status === 401 || error.status === 403) {
          localStorage.removeItem(CLAVE_TOKEN)
          setToken(null)
        } else {
          setErrorSesion('No pudimos verificar tu sesión. Revisá tu conexión e intentá de nuevo.')
        }
        setIsLoading(false)
      })

    return () => {
      activo = false
    }
  }, [intento])

  async function login(email, password) {
    const datos = await iniciarSesion(email, password)
    localStorage.setItem(CLAVE_TOKEN, datos.token)
    setToken(datos.token)
    setUser(datos.user)
    setErrorSesion('')
    setIsLoading(false)
  }

  function register(datos) {
    return registrarUsuario(datos)
  }

  function logout() {
    localStorage.removeItem(CLAVE_TOKEN)
    setToken(null)
    setUser(null)
    setErrorSesion('')
    setIsLoading(false)
  }

  function reintentarSesion() {
    setIntento((actual) => actual + 1)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: user !== null,
        isLoading,
        errorSesion,
        login,
        register,
        logout,
        reintentarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return contexto
}
