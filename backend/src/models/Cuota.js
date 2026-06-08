const { Schema, model } = require('mongoose');

const cuotaSchema = new Schema(
  {
    membresiaId: { type: Schema.Types.ObjectId, ref: 'Membresia', required: true, index: true },
    rutSocio: { type: String, required: true, index: true },
    numero: { type: Number, required: true },
    totalCuotas: { type: Number, required: true },
    monto: { type: Number, required: true },
    fechaVencimiento: { type: Date, required: true, index: true },
    fechaPago: { type: Date },
    estado: {
      type: String,
      enum: ['PENDIENTE', 'PAGADA', 'VENCIDA', 'CANCELADA'],
      default: 'PENDIENTE',
      index: true,
    },
    pagoId: { type: Schema.Types.ObjectId, ref: 'Pago' },
    ordenCompra: { type: String, default: '' },
    avisoPrevioEnviado: { type: Boolean, default: false },
    avisoVencimientoEnviado: { type: Boolean, default: false },
    avisoMorosidadEnviado: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

module.exports = model('Cuota', cuotaSchema);
