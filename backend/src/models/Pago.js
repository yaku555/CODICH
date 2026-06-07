const { Schema, model } = require('mongoose');

const pagoSchema = new Schema(
  {
    ordenCompra: { type: String, required: true, unique: true },
    sessionId: { type: String, required: true },
    monto: { type: Number, required: true },
    plan: { type: String, default: 'Sin especificar' },
    planId: { type: String, default: '' },
    modalidad: { type: String, enum: ['contado', 'cuotas'], default: 'contado' },
    rutSocio: { type: String, required: true },
    membresiaId: { type: Schema.Types.ObjectId, ref: 'Membresia' },
    cuotaId: { type: Schema.Types.ObjectId, ref: 'Cuota' },
    numeroCuota: { type: Number, default: 1 },
    totalCuotas: { type: Number, default: 1 },
    estado: {
      type: String,
      enum: ['AUTHORIZED', 'FAILED', 'CANCELLED', 'PENDING'],
      required: true,
    },
    detalle: { type: Object, default: {} },
    fecha: { type: Date, default: Date.now },
    fechaConfirmacion: { type: Date },
  },
  { versionKey: false }
);

module.exports = model('Pago', pagoSchema);
