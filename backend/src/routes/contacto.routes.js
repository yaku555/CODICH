const express = require('express');
const router = express.Router();
const { enviarConsulta } = require('../controllers/contacto.controller');

router.post('/', enviarConsulta);

module.exports = router;
