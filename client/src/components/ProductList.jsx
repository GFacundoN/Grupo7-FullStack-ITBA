import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";

function ProductList({ onVerDetalle, onAgregar }) {
  const [productos, setProductos] = useState([]);
  const [estado, setEstado] = useState("cargando"); // cargando | ok | error

  useEffect(() => {
    fetch("/api/productos")
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error(`Error ${respuesta.status}`);
        }
        return respuesta.json();
      })
      .then((datos) => {
        setProductos(datos);
        setEstado("ok");
      })
      .catch(() => setEstado("error"));
  }, []);

  if (estado === "cargando") {
    return <p className="main-container">Cargando productos...</p>;
  }

  if (estado === "error") {
    return <p className="main-container">No fue posible cargar los productos.</p>;
  }

  return (
    <section className="destacados">
      <div className="grilla-productos">
        {productos.map((producto) => (
          <ProductCard
            key={producto.id}
            producto={producto}
            onVerDetalle={onVerDetalle}
            onAgregar={onAgregar}
          />
        ))}
      </div>
    </section>
  );
}

export default ProductList;
