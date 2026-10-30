import { useState } from 'react'

const VACIO = { nombre: '', descripcion: '', precio: '', stock: '', imagenUrl: '' }

// Formulario controlado, reutilizable para alta y edición. No sabe nada de la
// API: valida, arma el objeto y se lo pasa a onSubmit(datos). Si onSubmit
// rechaza (error de la API), muestra el mensaje debajo del formulario.
function ProductForm({ valoresIniciales, textoBoton, onSubmit }) {
  const [form, setForm] = useState(() => ({ ...VACIO, ...valoresIniciales }))
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)

  function cambiar(evento) {
    const { name, value } = evento.target
    setForm((actual) => ({ ...actual, [name]: value }))
  }

  function validar() {
    const nuevos = {}
    const precio = Number(form.precio)
    const stock = Number(form.stock)
    const imagen = form.imagenUrl.trim()

    if (form.nombre.trim() === '') {
      nuevos.nombre = 'El nombre es obligatorio.'
    }

    if (String(form.precio).trim() === '') {
      nuevos.precio = 'El precio es obligatorio.'
    } else if (Number.isNaN(precio) || precio < 0) {
      nuevos.precio = 'El precio debe ser un número mayor o igual a 0.'
    }

    if (String(form.stock).trim() !== '' && (!Number.isInteger(stock) || stock < 0)) {
      nuevos.stock = 'El stock debe ser un número entero mayor o igual a 0.'
    }

    if (imagen !== '' && !/^(\/|https?:\/\/)/.test(imagen)) {
      nuevos.imagenUrl = 'Ingresá una ruta que empiece con / o una URL http(s).'
    }

    return nuevos
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErrorServidor('')

    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const datos = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: Number(form.precio),
      imagenUrl: form.imagenUrl.trim(),
    }
    if (String(form.stock).trim() !== '') datos.stock = Number(form.stock)

    setEnviando(true)
    try {
      await onSubmit(datos)
    } catch (error) {
      setErrorServidor(error.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="contact-form" onSubmit={enviar} noValidate>
      <div className="form-group">
        <label htmlFor="nombre">Nombre *</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={form.nombre}
          placeholder="Ej: Mesa de centro"
          className={errores.nombre ? 'invalid' : ''}
          onChange={cambiar}
        />
        <small className="error-msg">{errores.nombre}</small>
      </div>

      <div className="form-group">
        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows="4"
          value={form.descripcion}
          placeholder="Ej: Mesa artesanal de madera"
          onChange={cambiar}
        />
      </div>

      <div className="form-group">
        <label htmlFor="precio">Precio (ARS) *</label>
        <input
          type="number"
          id="precio"
          name="precio"
          min="0"
          step="any"
          value={form.precio}
          placeholder="Ej: 120000"
          className={errores.precio ? 'invalid' : ''}
          onChange={cambiar}
        />
        <small className="error-msg">{errores.precio}</small>
      </div>

      <div className="form-group">
        <label htmlFor="stock">Stock</label>
        <input
          type="number"
          id="stock"
          name="stock"
          min="0"
          step="1"
          value={form.stock}
          placeholder="Ej: 5"
          className={errores.stock ? 'invalid' : ''}
          onChange={cambiar}
        />
        <small className="error-msg">{errores.stock}</small>
      </div>

      <div className="form-group">
        <label htmlFor="imagenUrl">Imagen (ruta o URL)</label>
        <input
          type="text"
          id="imagenUrl"
          name="imagenUrl"
          value={form.imagenUrl}
          placeholder="Ej: /img/productos/mesa-centro-araucaria.png"
          className={errores.imagenUrl ? 'invalid' : ''}
          onChange={cambiar}
        />
        <small className="error-msg">{errores.imagenUrl}</small>
        {form.imagenUrl.trim() !== '' && !errores.imagenUrl && (
          <img className="form-vista-previa" src={form.imagenUrl.trim()} alt="Vista previa" />
        )}
      </div>

      {errorServidor && (
        <p className="error-general" role="alert">
          {errorServidor}
        </p>
      )}

      <button type="submit" className="boton-primario" disabled={enviando}>
        {enviando ? 'Guardando...' : textoBoton}
      </button>
    </form>
  )
}

export default ProductForm
