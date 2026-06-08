const express = require('express');
const router = express.Router();
const { getEstadisticas } = require('../controllers/estadisticas.controller');

// GET /api/estadisticas
router.get('/', getEstadisticas);

module.exports = router;