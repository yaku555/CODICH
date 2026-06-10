const { Schema, model } = require('mongoose');

const soporteTecnicoSchema = new Schema(
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
      unique: true,
      lowercase: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: true,
      trim: true,
    },
    rol: {
      type: String,
      enum: ['soporte_tecnico'],
      default: 'soporte_tecnico',
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'soportes_tecnicos',
  },
);

module.exports = model('SoporteTecnico', soporteTecnicoSchema);