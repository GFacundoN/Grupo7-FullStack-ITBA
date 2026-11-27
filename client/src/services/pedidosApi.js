const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

async function pedirConAuth(ruta, token, opciones = {}) {
  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opciones.headers || {}),
      },
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }

  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    const error = new Error(
      datos?.message ?? datos?.error ?? `Error ${respuesta.status}`,
    )
    error.status = respuesta.status
    throw error
  }

  return datos
}

export async function crearPedido(productos, token) {
  const datos = await pedirConAuth('/pedidos', token, {
    method: 'POST',
    body: JSON.stringify({ productos }),
  })
  return datos.pedido
}

export async function obtenerMisPedidos(token) {
  const datos = await pedirConAuth('/pedidos/mis-pedidos', token, {
    method: 'GET',
  })
  return datos?.pedidos ?? []
}