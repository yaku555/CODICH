const express = require('express');
const router = express.Router();

const {
  iniciarPago,
  renovarMembresia,
  confirmarPago,
  listarPagos,
  listarMembresias,
  cancelarMembresia,
  simularVencimientoMembresia,
  simularRenovacionMembresia,
} = require('../controllers/pago.controller');

router.post('/iniciar', iniciarPago);
router.post('/confirmar', confirmarPago);

router.get('/historial', listarPagos);

router.get('/membresias', listarMembresias);
router.post('/membresias/:id/renovar', renovarMembresia);
router.patch('/membresias/:id/cancelar', cancelarMembresia);
router.patch('/membresias/:id/simular-vencimiento', simularVencimientoMembresia);
router.patch('/membresias/:id/simular-renovacion', simularRenovacionMembresia);

module.exports = router;