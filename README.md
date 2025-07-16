Para instalar las dependencias de este proyecto se utilizo:
1. npm install express
2. npm install firebase-functions

Puede iniciar el servidor utilizando "npm start"

Las rutas disponibles son:
1. GET /productos
    a. Que le permitira consultar todos los productos

2. GET /productos/:id
    a. Que le permitira consultar un producto provetendo el id

3.  POST /productos
    a. Le permitira crear un nuevo producto, el id se agregara solo y la fecha de igual manera

    b. Contiene validaciones para que el nombre sea obligatorio, para que el precion sea un numero mayor que cero y que la descripcion tenga mas de 10 caracteres

4. PUT /productos/:id
    a. Permite actualizar un producto, el id y la fecha no pueden ser modificados

5. DELETE /productos/:id
    a. Permite borrar un producto proveyendo el id

6. GET /productos/disponibles
    a. Permite obtener todos los productos que esten disponibles, es decir que su valor disponible sea true