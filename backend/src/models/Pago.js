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

    monto: {
      type: Number,
      required: true,
    },
    montoBase: { type: Number, default: 0 },
    recargoMora: { type: Number, default: 0 },
    porcentajeRecargo: { type: Number, default: 0 },
    esPagoConMora: { type: Boolean, default: false },

    plan: {
      type: String,
      default: 'Sin especificar',
    },

    planId: {
      type: String,
      enum: ['mensual', 'trimestral', 'anual'],
      required: true,
    },

    modalidad: {
      type: String,
      enum: ['contado'],
      default: 'contado',
    },

    tipo: {
      type: String,
      enum: ['ALTA', 'RENOVACION'],
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
    },

    estado: {
      type: String,
      enum: ['AUTHORIZED', 'FAILED', 'CANCELLED', 'PENDING'],
      required: true,
      default: 'PENDING',
    },

    periodoDesde: { type: Date },
    periodoHasta: { type: Date },

    detalle: {
      type: Object,
      default: {},
    },

    fecha: {
      type: Date,
      default: Date.now,
    },

    fechaConfirmacion: { type: Date },

  },
  { versionKey: false }
);

pagoSchema.virtual('usuario', {
  ref: 'Usuario',
  localField: 'rutSocio',
  foreignField: 'rut',
  justOne: true,
});

module.exports = model('Pago', pagoSchema);