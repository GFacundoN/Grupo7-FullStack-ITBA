const express = require('express');
const router = express.Router();
const productos = require('../data/productos');


router.get('/', (req, res) => {
  res.json(productos);
});


router.get('/:id', (req, res) => {
  const { id } = req.params;
  const producto = productos.find(p => p.id === parseInt(id, 10));

  if (!producto) {
    return res.status(404).json({ error: 404, mensaje: `Producto con ID ${id} no encontrado` });
  }

  res.json(producto);
});


router.post('/', (req, res) => {
  const { nombre, precio, categoria } = req.body;

  
  if (!nombre || !precio || !categoria) {
    return res.status(400).json({ 
      error: 400, 
      mensaje: 'Faltan campos obligatorios: nombre, precio y categoria son requeridos.' 
    });
  }

  
  const nuevoId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
  const nuevoProducto = { id: nuevoId, nombre, precio: Number(precio), categoria };

  productos.push(nuevoProducto);
  res.status(201).json({ mensaje: 'Producto creado exitosamente', producto: nuevoProducto });
});


router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria } = req.body;

  const indice = productos.findIndex(p => p.id === parseInt(id, 10));

  if (indice === -1) {
    return res.status(404).json({ error: 404, mensaje: `Producto con ID ${id} no encontrado` });
  }

  
  if (!nombre && !precio && !categoria) {
    return res.status(400).json({ 
      error: 400, 
      mensaje: 'Debes enviar al menos un campo para actualizar (nombre, precio o categoria).' 
    });
  }

  
  if (nombre) productos[indice].nombre = nombre;
  if (precio) productos[indice].precio = Number(precio);
  if (categoria) productos[indice].categoria = categoria;

  res.json({ mensaje: 'Producto actualizado exitosamente', producto: productos[indice] });
});


router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const indice = productos.findIndex(p => p.id === parseInt(id, 10));

  if (indice === -1) {
    return res.status(404).json({ error: 404, mensaje: `Producto con ID ${id} no encontrado` });
  }

  const productoEliminado = productos.splice(indice, 1)[0];
  res.json({ mensaje: 'Producto eliminado exitosamente', producto: productoEliminado });
});

module.exports = router;