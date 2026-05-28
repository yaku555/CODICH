const mongoose = require('mongoose');

const auditoriaSchema = new mongoose.Schema({
  nivel: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR'],
    required: true,
  },
  modulo: {
    type: String,
    enum: ['Auth', 'Socios', 'Pagos', 'Postulaciones', 'Admin'],
    required: true,
  },
  usuario: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    default: 'desconocida',
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Auditoria', auditoriaSchema);