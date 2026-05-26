const mongoose = require('mongoose');

const PostulacionSchema = new mongoose.Schema({
  nombreCompleto: { type: String, required: true }, // Cambiado para hacer match con la vista
  rut: { type: String, required: true, unique: true }, // Añadido unique para evitar RUTs duplicados
  email: { type: String, required: true },
  telefono: { type: String, required: true },       // ¡Nuevo!
  profesion: { type: String, required: true },      // ¡Nuevo!
  experiencia: { type: String, required: true },    // ¡Nuevo! (Ej: "5 años")
  documentoPath: { type: String, required: false }, // Cambiado a false porque se sube en pasos posteriores
  estado: { type: String, default: 'Por hacer' }
}, { timestamps: true });

module.exports = mongoose.model('Postulacion', PostulacionSchema, 'postulaciones');