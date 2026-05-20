const { Router } = require('express');
const {
  getUsuarios,
  crearUsuario,
  getUsuarioPorRut,
  actualizarUsuario,
  borrarUsuario
} = require('../controllers/usuario.controller');

const router = Router();

// Definir las rutas para manejar los usuarios

// Ruta para obtener todos los usuarios
router.get('/', getUsuarios);        

// Ruta para crear un nuevo usuario
router.post('/', crearUsuario);      

// Ruta para obtener un usuario por RUT
router.get('/:rut', getUsuarioPorRut);   

// Ruta para actualizar un usuario por RUT
router.put('/:rut', actualizarUsuario);     

// Ruta para eliminar un usuario por RUT
router.delete('/:rut', borrarUsuario); 

module.exports = router;
