const express = require('express');
const router = express.Router();
const {
  iniciarPago,
  confirmarPago,
  listarPagos,
  listarMembresias,
  listarCuotas,
  actualizarMorosidad,
} = require('../controllers/pago.controller');

router.post('/iniciar', iniciarPago);
router.post('/confirmar', confirmarPago);
router.get('/historial', listarPagos);
router.get('/membresias', listarMembresias);
router.get('/cuotas', listarCuotas);
router.post('/morosidad/revisar', actualizarMorosidad);

module.exports = router;
