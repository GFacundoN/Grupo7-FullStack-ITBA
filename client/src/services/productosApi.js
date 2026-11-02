// Cliente de la API de productos (dueño: Facundo). Firmas acordadas con el
// equipo: obtenerProductos, obtenerProducto, crearProducto, actualizarProducto,
// eliminarProducto. Revisado para el catálogo, el detalle y el borrado.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

// Devuelve el JSON de la respuesta o tira un Error con el mensaje de la API
// ({ "error": "..." }) y el status HTTP en error.status.
async function pedir(ruta, opciones) {
  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, opciones)
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }

  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    const error = new Error(datos?.error ?? `Error ${respuesta.status}`)
    error.status = respuesta.status
    throw error
  }
  return datos
}

function conBody(metodo, datos) {
  return {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  }
}

export const obtenerProductos = () => pedir('/productos')
export const obtenerProducto = (id) => pedir(`/productos/${id}`)
export const crearProducto = (datos) => pedir('/productos', conBody('POST', datos))
export const actualizarProducto = (id, datos) => pedir(`/productos/${id}`, conBody('PUT', datos))
export const eliminarProducto = (id) => pedir(`/productos/${id}`, { method: 'DELETE' })
