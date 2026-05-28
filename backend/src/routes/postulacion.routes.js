const express = require('express');
const router = express.Router();

const {
  create,
  getAll,
  getById,
  update,
  remove,
  getCvUrl,
  aprobar,
} = require('../controllers/postulacion.controller');

const upload = require('../middleware/upload');

router.get('/', getAll);

router.post('/', upload.single('documento'), create);

router.get('/:rut/cv', getCvUrl);

router.patch('/:rut/aprobar', aprobar);

router.get('/:rut', getById);

router.put('/:rut', upload.single('documento'), update);

router.delete('/:rut', remove);

module.exports = router;