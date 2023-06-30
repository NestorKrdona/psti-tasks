# PSTI Tasks
Aplicación para crear tareas desplegada en Heroku usando NodeJS, Express, MongoDB y Vue

## Verificando requerimientos

### Online
- Cuenta en Github (opcional): https://github.com
- Cuenta en MongoDB Cloud https://cloud.mongodb.com
- Cuenta en Heroku https://heroku.com

### Instalados
Opcionalmente instalar Postman para realizar las peticiones.

```sh
$ git --version
$ heroku --version
$ npm --version
$ node --version
```

## Inicializar nuevo proyecto
Crear una carpeta donde estarán todos los archivos necesarios e inicializar el proyecto de la siguiente forma:

```sh
$ mkdir todo-tasks
$ cd todo-tasks
$ npm init
```

Ingresar los valores que considere conveniente y cambiar el "entry point" de *index.js* a *server.js*

Se generará un archivo *package.json* parecido a este:


```json
{
  "name": "todo-tasks",
  "version": "1.0.0",
  "description": "Aplicación para crear tareas desplegada en Heroku usando NodeJS, Express, MongoDB y Vue",
  "main": "server.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "Nombre Autor",
  "license": "ISC"
}
```

## Creando la estructura de archivos
En el proyecto vamos a necesitar estos archivos, crearlos dentro de la carpeta *todo-tasks*:
- .env.dist -> Ejemplo de un archivo .env para manejo de variables de entorno.
- .gitignore -> Permite ignorar archivos o carpetas en el versionamiento.
- api.js -> Definición de la API de la lista de tareas por hacer.
- index.html -> Interfaz para administrar la lista de tareas por hacer.
- package.json -> 
- server.js -> Servidor web
- task_schema.js -> Esquema de una tarea

## Hola Mundo en Express
En el archivo *server.js* poner el siguiente codigo:

```js
const express = require('express');
const port = process.env.PORT || 3000;
const app = express();

app.listen(port, function () {
    console.log("Server is listening at port: " + port);
});

app.get('/', function (req, res) {
    res.send("hello world");
});

```

Para poder ejecutarlo, necesitamos instalar express.

```sh
$ cd todo-tasks
$ npm install express
```

Notemos que al ejecutar lo anterior, veremos que el archivo *package.json* se modificó, creando una sección de dependencias.

Ahora podemos ejecutar el servidor de la siguiente manera:

```sh
$ npm start
```

Si navegamos aqui http://localhost:3000, veremos un *hello world* como respuesta en el navegador.

## Creando la API de tareas

### En MongoDB
Debemos crear un cluster en el cloud de MongoDB y obtener una cadena de conexión como esta:

mongodb+srv://<-username->:<-password->@<-cluster_url->/<-dbname->?retryWrites=true&w=majority

Tambien debemos buscar la forma de crear un usuario, una contraseña y una nueva base de datos.

En la url de conexión reemplazar:
- <-username->: Por tu usuario
- <-password->: Por tu contraseña
- <-dbname->: Por el nombre de tu base de datos
- <-cluster-url->: Por la url del cluster

Nota: Cuando se cree la base de datos, poner *Tasks* como nombre de colección.

### Conexión base de datos en NodeJS
Primero necesitamos instalar *mongoose* con el siguiente comando:

```sh
npm install mongoose@6.10.0
```

Luego en el archivo *api.js* poner el siguiente codigo:

```js
var mongoose = require("mongoose");
var express = require("express");
var router = express.Router();
var query = "mongodb+srv://<user>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority"
const db = (query);

mongoose.Promise = global.Promise;

mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}, function (error) {
    if (error) {
        console.log("Error!" + error);
    } else {
        console.log("Se ha conectado con la base de datos exitosamente");
    }
});

module.exports = router;
```

Adicionalmente, debemos importar api.js, en server.js agregar al inicio

```js
const api = require('./api');
```

Y despues de definir app, agregar:

```js
app.use('/api', api);
```

Ejecutar *npm start* y validar que el mensaje "Se ha conectado con la base de datos exitosamente" se muestre en la consola.

### Parseando los mensajes con body-parser

En el archivo *server.js* necesitamos usar bodyParser para poder manipular los mensajes que lleguen en el body

```js
const bodyParser = require('body-parser');
app.use(bodyParser.json());
```

### Definiendo la estructura de una Tarea
Necesitamos definir el esquema de cómo se va a estructurar una *Tarea*, crearemos un archivo llamado *task_schema.js* y ahi lo definiremos
usando un esquema de mongoose.

```js
var mongoose = require('mongoose');

var TaskSchema = new mongoose.Schema({
    TaskId: Number,
    Name: String,
    Deadline: Date,
});

module.exports = mongoose.model(
    'task', TaskSchema, 'Tasks');
```

Adicionalmente en *api.js* importar el esquema de una tarea de la siguiente manera:

```js
var TaskModel = require('./task_schema');
```

### Crear una tarea
En el archivo *api.js* usar el siguiente codigo que nos servirá para insertar una nueva tarea en la base de datos cuando hagamos un llamado POST a la url */api/create-task*

```js
router.post('/create-task', function (req, res) {
    let task_id = req.body.TaskId;
    let name = req.body.Name;
    let deadline = req.body.Deadline;

    let task = {
        TaskId: task_id,
        Name: name,
        Deadline: deadline
    }
    var newTask = new TaskModel(task);

    newTask.save(function (err, data) {
        if (err) {
            console.log(err);
            res.status(500).send("Internal error\n");
        }
        else {
            res.status(200).send("OK\n");
        }
    });
});
```

Podemos probar creando una tarea de la siguiente forma (tambien se puede utilizar Postman):
```sh
curl -i -X POST -H "Content-Type: application/json" -d '{"TaskId": 123, "Name":"Estudiar para el quiz", "Deadline": "2020-12-01"}' http://localhost:3000/api/create-task
```

### Consultar todas las tareas
```js
router.get('/all-tasks', function (req, res) {
    TaskModel.find(function (err, data) {
        if (err) {
            res.status(500).send("Internal error\n");
        }
        else {
            res.status(200).send(data);
        }
    });
});
```

Podemos probar consultando todas las tarea de la siguiente forma (tambien se puede utilizar Postman):
```sh
curl -i -X GET -H "Content-Type: application/json" http://localhost:3000/api/all-tasks
```

### Actualizar una tarea
```js
router.post('/update-task', function (req, res) {
    TaskModel.updateOne({ TaskId: req.body.TaskId }, {
        Name: req.body.Name,
        Deadline: req.body.Deadline
    }, function (err, data) {
        if (err) {
            res.status(500).send("Internal error\n");
        } else {
            res.status(200).send("OK\n");
        }
    });
});
```

Podemos probar actualizando una tarea de la siguiente forma (tambien se puede utilizar Postman):
```sh
curl -i -X POST -H "Content-Type: application/json" -d '{"TaskId": 123, "Name":"Estudiar para el quiz MODIFICADO", "Deadline": "2020-12-02"}' http://localhost:3000/api/update-task
```

### Eliminar una tarea

```js
router.delete('/delete-task', function (req, res) {
    TaskModel.deleteOne({ TaskId: req.body.TaskId }, function (err, data) {
        if (err) {
            res.status(500).send("Internal error\n");
        } else {
            res.status(200).send("OK\n");
        }
    });
});
```

Podemos probar eliminando una tarea de la siguiente forma (tambien se puede utilizar Postman):
```sh
curl -i -X DELETE -H "Content-Type: application/json" -d '{"TaskId": 123}' http://localhost:3000/api/delete-task
```

### Variables de entorno
Las variables de entorno nos permiten ocultar nuestras credenciales y de esta forma volver mas seguro el versionamiento de codigo.

Debemos instalar node-env-file para poder cargar variables de entorno desde un archivo

```sh
cd todo-tasks
npm install node-env-file
```

Pensando a futuro en el despliegue, cargaremos las variables de entorno desde un achivo cuando estemos trabajando de forma local y cuando estemos en Heroku asumiremos que éstas variables de entorno ya se encuentran asignadas.

```js
let environment = null;

if (!process.env.ON_HEROKU) {
    console.log("Cargando variables de entorno desde archivo");
    const env = require('node-env-file');
    env(__dirname + '/.env');
}

environment = {
    DBMONGOUSER: process.env.DBMONGOUSER,
    DBMONGOPASS: process.env.DBMONGOPASS,
    DBMONGOSERV: process.env.DBMONGOSERV,
    DBMONGO: process.env.DBMONGO,
};

var query = 'mongodb+srv://' + environment.DBMONGOUSER + ':' + environment.DBMONGOPASS + '@' + environment.DBMONGOSERV + '/' + environment.DBMONGO + '?retryWrites=true&w=majority';

```

Vamos a necesitar crear un archivo *.env* para poder poner ahi toda la información de conexion con nuestra base de datos en MongoDB, el archivo debe tener la siguiente estructura:

```txt
DBMONGO=YOUR_DB_NAME
DBMONGOPASS=YOUR_USER_PASSWORD
DBMONGOSERV=YOUR_CLUSTER_SERVER
DBMONGOUSER=YOUR_USER
```

Nota: Cambiar cada uno de los datos por los datos de conexion y probar que al ejecutar el servidor se vea el mensaje "Se ha conectado con la base de datos exitosamente". Tambien es buena practica crear un archivo *.env.dist* que contenga la estructura mas NO LOS DATOS de conexion.

## Desplegue

### Preparación antes del desplegue
Crear un archivo .gitignore para excluir algunos archivos y carpetas en el versionamiento, con lo siguiente:

```txt
node_modules
.env
package-lock.json
```

### Inicializar repositorio
Inicializar un repositorio en la carpeta todo-tasks
```sh
cd todo-tasks
git init
```

### Creando nueva app en Heroku

Instalar y Loguearnos en heroku
```sh
npm install heroku

heroku login -i
```

Ejecutar el siguiente comando para crear una nueva aplicación. Nota: cambiar *psti-tasks* por el nombre de tu nueva aplicación

```sh
heroku create psti-tasks --buildpack heroku/nodejs
```

Verificar que se muestre un mensaje similar a este:
```txt
Creating ⬢ psti-tasks... done
Setting buildpack to heroku/nodejs... done
https://psti-tasks.herokuapp.com/ | https://git.heroku.com/psti-tasks.git
``` 

### Variables de entorno en Heroku
En la configuración de nuestra aplicación en el sitio web de Heroku, debemos asignar cada una de las variables de entorno en el archivo *.env* con su respectivo valor. Aparte de estos, necesitamos una variable de entorno adicional que va a permitir identificar si estamos en Heroku, esta es *ON_HEROKU* y su valor lo podemos poner en 1.

### Desplegando en Heroku

Vincular repositorio local con repositorio en Heroku
```sh
heroku git:remote -a psti-tasks
```

Agregamos todos los archivos que vamos a incluir en nuestro siguiente commit. Luego hacemos el commit de nuestra primera version y posteriormente hacemos push a Heroku.

```sh
git add .
git commit -m "primera version"
git push heroku master
```

https://dashboard.render.com/

## Referencias
https://www.geeksforgeeks.org/nodejs-crud-operations-using-mongoose-and-mongodb-atlas/
