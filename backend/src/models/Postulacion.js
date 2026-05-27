const mongoose = require('mongoose');

const PostulacionSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    apellido: {
      type: String,
      required: true,
      trim: true,
    },

    rut: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    telefono: {
      type: String,
      required: true,
      trim: true,
    },

    profesion: {
      type: String,
      required: true,
      trim: true,
    },

    experiencia: {
      type: String,
      required: true,
      trim: true,
    },

    documentoPath: {
      type: String,
      required: false,
    },

    estado: {
      type: String,
      enum: ['Pendiente', 'Aprobada', 'Rechazada'],
      default: 'Pendiente',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Postulacion', PostulacionSchema, 'postulaciones');