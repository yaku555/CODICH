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
    fechaNacimiento: {
      type: Date,
      required: true,
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

    residencia: {
      type: String,
      required: true,
      trim: true,
    },

    profesion: {
      type: String,
      required: true,
      trim: true,
    },

    areaFormacion: {
      type: String,
      enum: ['educacion_pedagogia', 'otra_area'],
      required: true,
    },

    experiencia: {
      type: String,
      required: true,
      trim: true,
    },

    aniosExperiencia: {
      type: Number,
      required: true,
      min: 0,
    },

    documentoPath: {
      type: String,
      required: false,
      trim: true,
      default: '',
    },

    estado: {
      type: String,
      enum: [
        'Pre-Aprobada',
        'Pre-Rechazada',
        'Aprobada',
        'Rechazada',
      ],
      default: 'Pre-Rechazada',
    },

    motivoRechazo: {
      type: [String],
      default: [],
    },

    comentarioAdmin: {
      type: String,
      default: '',
      trim: true,
    },

    fechaRevisionAdmin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  'Postulacion',
  PostulacionSchema,
  'postulaciones'
);