const { Router } = require('express');

const {
  crearSoporteTecnico,
  getSoportesTecnicos,
  getSoporteTecnicoPorRut,
  actualizarSoporteTecnico,
  borrarSoporteTecnico,
  loginSoporteTecnico,
} = require('../controllers/soporteTecnico.controller');

const router = Router();

// Obtener todos los soportes técnicos
router.get('/', getSoportesTecnicos);

// Crear soporte técnico
router.post('/', crearSoporteTecnico);

// Login soporte técnico
router.post('/login', loginSoporteTecnico);

// Obtener soporte técnico por RUT
router.get('/:rut', getSoporteTecnicoPorRut);

// Actualizar soporte técnico por RUT
router.put('/:rut', actualizarSoporteTecnico);

// Eliminar soporte técnico por RUT
router.delete('/:rut', borrarSoporteTecnico);

module.exports = router;