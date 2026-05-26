const express = require('express');
const router = express.Router();
const { create, getAll, getById, update, remove } = require('../controllers/postulacion.controller');
const upload = require('../middleware/upload');

// GET todos
router.get('/', getAll);

// POST crear (con validación de archivo)
router.post('/', upload.single('documento'), create);

// GET uno por RUT
router.get('/:rut', getById);

// PUT actualizar por RUT
router.put('/:rut', upload.single('documento'), update);

// DELETE eliminar por RUT
router.delete('/:rut', remove);

module.exports = router;