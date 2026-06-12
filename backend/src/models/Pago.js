const { Schema, model } = require('mongoose');

const pagoSchema = new Schema(
  {
    ordenCompra: {
      type: String,
      required: true,
      unique: true,
    },

    sessionId: {
      type: String,
      required: true,
    },

    rutSocio: {
      type: String,
      required: true,
      index: true,
    },

    membresiaId: {
      type: Schema.Types.ObjectId,
      ref: 'Membresia',
      default: null,
      index: true,
    },

    planId: {
      type: String,
      enum: ['mensual', 'trimestral', 'anual'],
      required: true,
    },

    planNombre: {
      type: String,
      required: true,
    },

    tipo: {
      type: String,
      enum: ['ALTA', 'RENOVACION'],
      required: true,
    },

    monto: {
      type: Number,
      required: true,
    },

    montoBase: {
      type: Number,
      default: 0,
    },

    recargoMora: {
      type: Number,
      default: 0,
    },

    porcentajeRecargo: {
      type: Number,
      default: 0,
    },

    esPagoConMora: {
      type: Boolean,
      default: false,
    },

    estado: {
      type: String,
      enum: ['AUTHORIZED', 'FAILED', 'CANCELLED', 'PENDING'],
      default: 'PENDING',
      required: true,
    },

    periodoDesde: {
      type: Date,
    },

    periodoHasta: {
      type: Date,
    },

    detalle: {
      type: Object,
      default: {},
    },

    fecha: {
      type: Date,
      default: Date.now,
    },

    fechaConfirmacion: {
      type: Date,
    },
  },
  {
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

pagoSchema.virtual('usuario', {
  ref: 'Usuario',
  localField: 'rutSocio',
  foreignField: 'rut',
  justOne: true,
});

module.exports = model('Pago', pagoSchema);