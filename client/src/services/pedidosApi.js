import { pedir } from './productosApi.js'

export async function obtenerMisPedidos(token) {
  const { pedidos } = await pedir('/pedidos/mis-pedidos', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return pedidos
}
