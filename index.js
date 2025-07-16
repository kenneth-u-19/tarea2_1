import express from 'express'
import productos from './local_db/productos.json' with {type: 'json'}
import {Message} from 'firebase-functions/pubsub'
import fs from 'node:fs/promises';
import path from 'node:path';
import { writeFile } from 'fs/promises';

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

//rutas

app.get('/', (req, res)=>{
    res.send('<h1>Prueba</h1>')
})


app.get('/productos', (req, res)=>{
    res.json(productos)
})

app.get('/productos/disponibles', (req, res)=>{

    const productosFiltrados = productos.filter((producto)=>{
        return producto.disponible === true
    })

    res.json(productosFiltrados)
})


app.get('/productos/:id', (req, res)=>{
    const {id} = req.params

    const parsedId = Number(id)

    if(isNaN(parsedId)){
        res.status(400).json({
            message: 'Entrada no valida: El id debe ser un numero'
        })
    }

    const producto = productos.find((producto) =>{
        return producto.id === parsedId
    })

    if(!producto){
        res.status(404).json({
            message: 'No encontrado: El producto no existe.'
        })
    }

    res.json(producto)

})

app.post('/productos', async (req, res)=>{
    const {nombre, precio, descripcion, disponible} = req.body

    // Validación básica
  if (!nombre) {
    return res.status(400).json({ 
        message: 'El nombre es obligatorio.' 
    });
  } else if(precio <= 0){
    return res.status(400).json({
        message: 'El precio debe ser un numero positivo mayor a cero'
    })
  }else if(descripcion.length < 10){
    return res.status(400).json({
        message: 'La descripcion debe tener minimo 10 caracteres'
    })
  }

  const nuevoId = productos.length ? productos[productos.length - 1].id + 1 : 1
  
  const nuevoProducto = {
    id: nuevoId,
    nombre,
    precio,
    descripcion,
    disponible,
    fecha_ingreso: new Date().toISOString().split('T')[0] //yyyy-mm-dd
  }

  productos.push(nuevoProducto)

  const rutaJson = path.resolve('./local_db/productos.json')

  try{
    await writeFile(rutaJson, JSON.stringify(productos,null, 2))

    res.status(201).json({
        message: 'Producto agregado correctamente',
        producto: nuevoProducto
    })

  }catch(error){
    console.error('Error al guardar el archivo', error)
    res.status(500).json({
        message: 'Error interno al guardar el producto'
    })
  }

})

app.put('/productos/:id', async (req, res)=>{
    const {id} = req.params
    const productoActualizado = req.body

    // Validación básica. se quitaron porque sino obliga a colocar todo para actualizar solo un campo
//   if (!productoActualizado.nombre) {
//     return res.status(400).json({ 
//         message: 'El nombre es obligatorio.' 
//     });
//   } else if(productoActualizado.precio <= 0){
//     return res.status(400).json({
//         message: 'El precio debe ser un numero positivo mayor a cero'
//     })
//   }else if(productoActualizado.descripcion.length < 10){
//     return res.status(400).json({
//         message: 'La descripcion debe tener minimo 10 caracteres'
//     })
//   }

    //se busca el indice del producto a actualizar
    const index = productos.findIndex(producto => producto.id === Number(id))

    if(index === -1){
        return res.status(404).json({
            message: 'No encontrado: El producto no existe'
        })
    }

    //la fecha y el id no los modificaremos
    const productoExistente = productos[index]

    const productoFinal = {
        ...productoExistente,
        ...productoActualizado,
        id: productoExistente.id,
        fecha_ingreso: productoExistente.fecha_ingreso
    }

    //realizamos el reemplazo con nuestro objeto local
    productos[index] = productoFinal

    //se guardan los cambios
    try{

    }catch (error){
        console.error('Error al guardar los cambios',error)
        res.status(500).json({
            message: 'Error al guardar los cambios'
        })
    }
})

app.delete('/productos/:id', async (req, res)=>{
    const { id } = req.params

    const productoId = Number(id)

    const index = productos.findIndex(producto => producto.id === productoId)

    if (index === -1) {
    return res.status(404).json({
      message: 'No encontrado: Producto no existe'
    });
  }

  productos.splice(index, 1)

  try {
    await fs.writeFile('./local_db/productos.json', JSON.stringify(productos, null, 2));
    res.json({
      message: 'Película eliminada correctamente'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al guardar los cambios',
      error: error.message
    });
  }
})

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
}) 