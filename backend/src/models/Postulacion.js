const mongoose = require('mongoose');

const PostulacionSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  rut: { type: String, required: true },
  email: { type: String, required: true },
  documentoPath: { type: String, required: true },
  estado: { type: String, default: 'Por hacer' }
}, { timestamps: true });

module.exports = mongoose.model('Postulacion', PostulacionSchema, 'postulaciones');