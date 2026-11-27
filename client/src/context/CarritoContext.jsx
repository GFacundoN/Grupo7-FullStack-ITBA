import { createContext, useContext, useEffect, useState } from 'react'

const CLAVE = 'carritoHermanosJota'

const CarritoContext = createContext(null)

function leerGuardado() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE))
    return Array.isArray(guardado) ? guardado : []
  } catch {
    return []
  }
}

// El carrito guarda { ...producto, cantidad }: si el producto ya estaba, se
// suma la cantidad en lugar de repetirlo. El producto se identifica por _id.
export function CarritoProvider({ children }) {
  const [items, setItems] = useState(leerGuardado)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(items))
    } catch {
      // sin localStorage el carrito sigue funcionando en memoria
    }
  }, [items])

  function agregarAlCarrito(producto, cantidad = 1) {
    setItems((actuales) => {
      const existe = actuales.some((item) => item._id === producto._id)
      if (existe) {
        return actuales.map((item) =>
          item._id === producto._id
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item,
        )
      }
      return [...actuales, { ...producto, productoId: producto._id, cantidad }]
    })
  }

  function quitarProducto(productoId) {
    setItems((actuales) =>
      actuales.filter((item) => (item.productoId || item._id) !== productoId),
    )
  }

  function actualizarCantidad(productoId, cantidad) {
    if (cantidad <= 0) {
      quitarProducto(productoId)
      return
    }
    setItems((actuales) =>
      actuales.map((item) =>
        (item.productoId || item._id) === productoId ? { ...item, cantidad } : item,
      ),
    )
  }

  function vaciarCarrito() {
    setItems([])
  }

  const cantidadTotal = items.reduce((total, item) => total + item.cantidad, 0)
  const total = items.reduce(
    (acc, item) => acc + Number(item.precio) * item.cantidad,
    0,
  )

  return (
    <CarritoContext.Provider
      value={{
        items,
        total,
        cantidadTotal,
        agregarAlCarrito,
        agregarProducto: agregarAlCarrito,
        quitarProducto,
        actualizarCantidad,
        vaciarCarrito,
      }}
    >
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  const contexto = useContext(CarritoContext)
  if (!contexto) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>')
  return contexto
}

export const CartProvider = CarritoProvider
export const useCart = useCarrito