const { Schema, model } = require('mongoose');

const membresiaSchema = new Schema(
  {
    rutSocio: { type: String, required: true, index: true },

    codigoMembresia: {
      type: String,
      required: true,
      unique: true,
    },

    planId: {
      type: String,
      required: true,
      enum: ['mensual', 'trimestral', 'anual'],
    },

    planNombre: { type: String, required: true },

    modalidad: {
      type: String,
      enum: ['contado'],
      default: 'contado',
    },

    duracionMeses: { type: Number, required: true },

    totalCompromiso: { type: Number, required: true },

    montoCuota: { type: Number, required: true },

    cantidadCuotas: {
      type: Number,
      default: 1,
    },

    estado: {
      type: String,
      enum: [
        'PENDIENTE',
        'ACTIVA',
        'POR_PAGAR',
        'MOROSA',
        'SUSPENDIDA',
        'CANCELADA',
        'FINALIZADA',
      ],
      default: 'PENDIENTE',
    },
    fechaInicio: { type: Date },
    fechaTermino: { type: Date },

    fechaUltimoPago: { type: Date },
    fechaProximoPago: { type: Date },

    pagos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Pago',
      },
    ],

    diasGracia: { type: Number, default: 5 },
    diasSuspension: { type: Number, default: 30 },
    diasCancelacionAdministrativa: { type: Number, default: 60 },

    politicaCancelacion: {
      type: String,
      default: 'La cancelación evita futuras renovaciones. No contempla devolución parcial.',
    },

    fechaCancelacion: { type: Date },
    motivoCancelacion: { type: String, default: '' },
    recargoPendiente: { type: Boolean, default: false },
    porcentajeRecargo: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

module.exports = model('Membresia', membresiaSchema);