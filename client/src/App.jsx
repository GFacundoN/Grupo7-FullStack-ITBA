import { Route, Routes } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Contacto from './pages/Contacto.jsx'
import CrearProducto from './pages/CrearProducto.jsx'
import EditarProducto from './pages/EditarProducto.jsx'
import Inicio from './pages/Inicio.jsx'
import Login from './pages/Login.jsx'
import MisPedidos from './pages/MisPedidos.jsx'
import NoEncontrado from './pages/NoEncontrado.jsx'
import Perfil from './pages/Perfil.jsx'
import ProductoDetalle from './pages/ProductoDetalle.jsx'
import Productos from './pages/Productos.jsx'
import Registro from './pages/Registro.jsx'

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
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-pedidos"
            element={
              <ProtectedRoute>
                <MisPedidos />
              </ProtectedRoute>
            }
          />
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
