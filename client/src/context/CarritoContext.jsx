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

  function agregarAlCarrito(producto) {
    setItems((actuales) => {
      const existe = actuales.some((item) => item._id === producto._id)
      if (existe) {
        return actuales.map((item) =>
          item._id === producto._id ? { ...item, cantidad: item.cantidad + 1 } : item,
        )
      }
      return [...actuales, { ...producto, cantidad: 1 }]
    })
  }

  const cantidadTotal = items.reduce((total, item) => total + item.cantidad, 0)

  return (
    <CarritoContext.Provider value={{ items, cantidadTotal, agregarAlCarrito }}>
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  const contexto = useContext(CarritoContext)
  if (!contexto) throw new Error('useCarrito debe usarse dentro de <CarritoProvider>')
  return contexto
}
