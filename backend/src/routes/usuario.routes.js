const { Router } = require('express');

const {
  getUsuarios,
  crearUsuario,
  getUsuarioPorRut,
  actualizarUsuario,
  borrarUsuario,
  loginUsuario,
} = require('../controllers/usuario.controller');

const router = Router();

// Obtener todos los usuarios
router.get('/', getUsuarios);

// Crear un nuevo usuario
router.post('/', crearUsuario);

// Iniciar sesión
router.post('/login', loginUsuario);

// Obtener un usuario por RUT
router.get('/:rut', getUsuarioPorRut);

// Actualizar un usuario por RUT
router.put('/:rut', actualizarUsuario);

// Eliminar un usuario por RUT
router.delete('/:rut', borrarUsuario);

module.exports = router;