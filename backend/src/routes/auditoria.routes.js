const express = require('express');
const router = express.Router();
const {
  registrarLog,
  getLogs,
  getResumen,
  limpiarLogs,
} = require('../controllers/auditoria.controller');

// POST /api/auditoria        → registrar nuevo log
router.post('/', registrarLog);

// GET  /api/auditoria        → obtener todos los logs (acepta ?nivel= &modulo= &usuario=)
router.get('/', getLogs);

// GET  /api/auditoria/resumen → métricas del día (total, exitosos, warns, errores)
router.get('/resumen', getResumen);

// DELETE /api/auditoria/limpiar → eliminar logs viejos (acepta ?dias=30)
router.delete('/limpiar', limpiarLogs);

module.exports = router;