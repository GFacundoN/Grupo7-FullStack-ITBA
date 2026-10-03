import { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductList from "./components/ProductList";
import ProductDetail from "./components/ProductDetail";
import ContactForm from "./components/ContactForm";

function App() {
  const [vista, setVista] = useState("productos");
  const [productoId, setProductoId] = useState(null);
  const [carrito, setCarrito] = useState([]);

  function verDetalle(id) {
    setProductoId(id);
    setVista("detalle");
  }

  function agregarAlCarrito(producto) {
    setCarrito((carritoActual) => [...carritoActual, producto]);
  }

  return (
    <div>
      <Navbar cantidadCarrito={carrito.length} vistaActual={vista} cambiarVista={setVista} />

      <main>
        {vista === "productos" && (
          <ProductList onVerDetalle={verDetalle} onAgregar={agregarAlCarrito} />
        )}
        {vista === "detalle" && (
          <ProductDetail
            id={productoId}
            onAgregar={agregarAlCarrito}
            onVolver={() => setVista("productos")}
          />
        )}
        {vista === "contacto" && <ContactForm />}
      </main>

      <Footer cambiarVista={setVista} />
    </div>
  );
}

export default App;
