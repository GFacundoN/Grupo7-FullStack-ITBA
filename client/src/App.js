import { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductList from "./components/ProductList";
import ContactForm from "./components/ContactForm";

function App() {
  const [vista, setVista] = useState("productos");

  return (
    <div>
      <Navbar cantidadCarrito={0} vistaActual={vista} cambiarVista={setVista} />

      <main>
        {vista === "productos" && <ProductList />}
        {vista === "contacto" && <ContactForm />}
      </main>

      <Footer cambiarVista={setVista} />
    </div>
  );
}

export default App;
