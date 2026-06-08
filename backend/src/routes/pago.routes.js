const express = require('express');
const router = express.Router();
const {
  iniciarPago,
  confirmarPago,
  listarPagos,
  listarMembresias,
  cancelarMembresia,
} = require('../controllers/pago.controller');

router.post('/iniciar', iniciarPago);
router.post('/confirmar', confirmarPago);
router.get('/historial', listarPagos);
router.get('/membresias', listarMembresias);
router.patch('/membresias/:id/cancelar', cancelarMembresia);

module.exports = router;
