import { conBody, pedir } from './productosApi.js'

export async function registrarUsuario(datos) {
  const { user } = await pedir('/auth/register', conBody('POST', datos))
  return user
}

export const iniciarSesion = (email, password) =>
  pedir('/auth/login', conBody('POST', { email, password }))

export async function obtenerUsuarioActual(token) {
  const { user } = await pedir('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return user
}
