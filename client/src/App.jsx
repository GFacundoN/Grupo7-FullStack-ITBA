import { Route, Routes } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import Contacto from './pages/Contacto.jsx'
import CrearProducto from './pages/CrearProducto.jsx'
import EditarProducto from './pages/EditarProducto.jsx'
import Inicio from './pages/Inicio.jsx'
import NoEncontrado from './pages/NoEncontrado.jsx'
import ProductoDetalle from './pages/ProductoDetalle.jsx'
import Productos from './pages/Productos.jsx'

function App() {
  return (
    <>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/productos/:id" element={<ProductoDetalle />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/admin/crear-producto" element={<CrearProducto />} />
          <Route path="/admin/editar-producto/:id" element={<EditarProducto />} />
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </main>

      <Footer />
    </>
  )
}

export default App
