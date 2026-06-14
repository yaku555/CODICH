const express = require('express');
const router = express.Router();
const {
  getReportesEstadisticos,
  exportarReportesPDF,
} = require('../controllers/estadisticas.controller');

const validarAdmin = (req, res, next) => {
  const rol = req.headers['x-user-role']?.toString().toLowerCase().trim();

  if (rol !== 'admin' && rol !== 'administrador') {
    return res.status(403).json({
      error: 'Acceso denegado',
    });
  }

  next();
};

router.get('/', validarAdmin, getReportesEstadisticos);
router.get('/pdf', validarAdmin, exportarReportesPDF);

module.exports = router;