import { Link } from 'react-router-dom'

function NoEncontrado() {
  return (
    <div className="main-container">
      <h1>Página no encontrada</h1>
      <p>La dirección que buscás no existe.</p>
      <Link to="/" className="boton-enlace">Volver al inicio</Link>
    </div>
  )
}

export default NoEncontrado
