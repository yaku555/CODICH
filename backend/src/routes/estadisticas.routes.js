const express = require('express');
const router  = express.Router();
const { getEstadisticas } = require('../controllers/estadisticas.controller');

// GET /api/estadisticas?desde=&hasta=&metrica=
router.get('/', getEstadisticas);

module.exports = router;