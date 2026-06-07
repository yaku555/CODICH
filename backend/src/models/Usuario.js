const { Schema, model } = require('mongoose');

const userSchema = new Schema(
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
      unique: true,
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

    residencia: {
      type: String,
      required: false,
      trim: true,
    },
    areaFormacion: {
      type: String,
      required: false,
      trim: true,
    },

    rol: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

module.exports = model('Usuario', userSchema);