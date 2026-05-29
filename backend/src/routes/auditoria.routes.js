const express = require('express');
const router = express.Router();
const {
  registrarLog,
  getLogs,
  getResumen,
  limpiarLogs,
} = require('../controllers/auditoria.controller');

router.post('/', registrarLog);

router.get('/', getLogs);

router.get('/resumen', getResumen);

router.delete('/limpiar', limpiarLogs);

module.exports = router;