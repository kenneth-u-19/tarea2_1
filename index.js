import express from 'express'
// import productos from './local_db/productos.json' with {type: 'json'}
import {Message} from 'firebase-functions/pubsub'
// import fs from 'node:fs/promises';
import path from 'node:path';
// import { writeFile } from 'fs/promises';
import pool from '../tarea2_1/config/db.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

//rutas

app.get('/', (req, res)=>{
    res.send('<h1>Prueba</h1>')
})


app.get('/productos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los productos' });
  }
});


app.get('/productos/disponibles', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM productos WHERE disponible = 1');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos disponibles' });
  }
});



app.get('/productos/:id', async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json({ message: 'Entrada no válida: id debe ser un número' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No encontrado: El producto no existe' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar el producto' });
  }
});


app.post('/productos', async (req, res) => {
  const { nombre, precio, descripcion, disponible, categoria_id } = req.body;

  if (!nombre || precio <= 0 || descripcion.length < 10) {
    return res.status(400).json({ message: 'Datos inválidos' });
  }

  const fecha_ingreso = new Date().toISOString().split('T')[0];

  try {

    const [categoria] = await pool.query('SELECT * FROM categorias WHERE id = ?', [categoria_id]);

    if (categoria.length === 0) {
      return res.status(400).json({ message: 'La categoría no existe' });
    }

    const [result] = await pool.query(
      'INSERT INTO productos (nombre, precio, descripcion, disponible, fecha_ingreso, categoria_id) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, precio, descripcion, disponible, fecha_ingreso, categoria_id]
    );

    const nuevoProducto = {
      id: result.insertId,
      nombre,
      precio,
      descripcion,
      disponible,
      fecha_ingreso,
      categoria_id
    };

    res.status(201).json({
      message: 'Producto agregado correctamente',
      producto: nuevoProducto
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar el producto' });
  }
});


app.put('/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, descripcion, disponible } = req.body;

  try {
    const [exist] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);

    if (exist.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const producto = exist[0];

    const updated = {
      nombre: nombre || producto.nombre,
      precio: precio || producto.precio,
      descripcion: descripcion || producto.descripcion,
      disponible: disponible !== undefined ? disponible : producto.disponible
    };

    await pool.query(
      'UPDATE productos SET nombre = ?, precio = ?, descripcion = ?, disponible = ? WHERE id = ?',
      [updated.nombre, updated.precio, updated.descripcion, updated.disponible, id]
    );

    res.json({
      message: 'Producto actualizado correctamente',
      producto: { id: Number(id), ...updated, fecha_ingreso: producto.fecha_ingreso }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el producto' });
  }
});


app.delete('/productos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No encontrado: Producto no existe' });
    }

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el producto' });
  }
});



//rutas para las categorias

app.get('/categorias', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categorias');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
});



app.get('/categorias/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar la categoría' });
  }
});



app.post('/categorias', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ message: 'El nombre es obligatorio' });
  }

  try {
    const [result] = await pool.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
    console.log("paso por aqui")
    res.status(201).json({
      message: 'Categoría creada correctamente',
      categoria: { id: result.insertId, nombre }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El nombre de la categoría ya existe' });
    }

    res.status(500).json({ message: 'Error al crear la categoría' });
  }
});




app.put('/categorias/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ message: 'El nombre es obligatorio' });
  }

  try {
    const [exist] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
    if (exist.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    console.log("paso por aqui")
    await pool.query('UPDATE categorias SET nombre = ? WHERE id = ?', [nombre, id]);
    console.log("paso por aqui")
    res.json({ message: 'Categoría actualizada correctamente' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'El nombre de la categoría ya existe' });
    }

    res.status(500).json({ message: 'Error al actualizar la categoría' });
  }
});




app.delete('/categorias/:id', async (req, res) => {
  const { id } = req.params;

  try {
    
    // Verificar si hay productos asociados
    const [productos] = await pool.query('SELECT COUNT(*) as total FROM productos WHERE categoria_id = ?', [id]);

    if (productos[0].total > 0) {
      return res.status(400).json({ message: 'No se puede eliminar: Hay productos asociados a esta categoría' });
    }

    const [result] = await pool.query('DELETE FROM categorias WHERE id = ?', [id]);
   console.log("paso por aqui")
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la categoría' });
  }
});



app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
}) 