// Las imagenes del catalogo original se guardaron sin "/" inicial
// ("img/productos/mesa.png"). Con React Router, una ruta relativa se resolveria
// contra la URL actual (/productos/123/img/...) y la imagen no cargaria.
export function rutaImagen(url = '') {
  const ruta = url.trim()
  if (ruta === '' || ruta.startsWith('/') || /^https?:\/\//.test(ruta)) return ruta
  return `/${ruta}`
}
