const express = require('express');
const router = express.Router();
const { iniciarPago, confirmarPago, listarPagos } = require('../controllers/pago.controller');

router.post('/iniciar', iniciarPago);
router.post('/confirmar', confirmarPago);
router.get('/historial', listarPagos);

module.exports = router;
