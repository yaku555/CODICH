const { Schema, model } = require('mongoose');

const pagoSchema = new Schema(
  {
    ordenCompra: { type: String, required: true, unique: true },
    sessionId:   { type: String, required: true },
    monto:       { type: Number, required: true },
    plan:        { type: String, default: 'Sin especificar' },
    rutSocio:    { type: String, required: true },
    estado:      { type: String, enum: ['AUTHORIZED', 'FAILED', 'CANCELLED', 'PENDING'], required: true },
    detalle:     { type: Object, default: {} },
    fecha:       { type: Date, default: Date.now },
  },
  { versionKey: false }
);

module.exports = model('Pago', pagoSchema);
