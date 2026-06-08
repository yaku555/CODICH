const { Schema, model } = require('mongoose');

const membresiaSchema = new Schema(
  {
    rutSocio: { type: String, required: true, index: true },
    planId: { type: String, required: true },
    planNombre: { type: String, required: true },
    modalidad: { type: String, enum: ['contado', 'cuotas'], required: true },
    duracionMeses: { type: Number, required: true },
    totalCompromiso: { type: Number, required: true },
    montoCuota: { type: Number, required: true },
    cantidadCuotas: { type: Number, required: true },
    estado: {
      type: String,
      enum: ['PENDIENTE', 'ACTIVA', 'MOROSA', 'SUSPENDIDA', 'CANCELADA', 'FINALIZADA'],
      default: 'PENDIENTE',
    },
    fechaInicio: { type: Date },
    fechaTermino: { type: Date },
    diasGracia: { type: Number, default: 5 },
    diasSuspension: { type: Number, default: 30 },
    diasCancelacionAdministrativa: { type: Number, default: 60 },
    politicaCancelacion: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false }
);

module.exports = model('Membresia', membresiaSchema);
