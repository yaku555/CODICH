const { Schema, model } = require('mongoose');

const membresiaSchema = new Schema(
  {
    rutSocio: {
      type: String,
      required: true,
      index: true,
    },

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

    planNombre: {
      type: String,
      required: true,
    },

    duracionMeses: {
      type: Number,
      required: true,
    },

    montoPlan: {
      type: Number,
      required: true,
    },

    estado: {
      type: String,
      enum: [
        'ACTIVA',
        'POR_PAGAR',
        'MOROSA',
        'SUSPENDIDA',
        'CANCELADA',
        'FINALIZADA',
      ],
      default: 'ACTIVA',
    },

    fechaInicio: {
      type: Date,
      required: true,
    },

    fechaTermino: {
      type: Date,
      required: true,
    },

    fechaUltimoPago: {
      type: Date,
    },

    fechaProximoPago: {
      type: Date,
    },

    recargoPendiente: {
      type: Boolean,
      default: false,
    },

    porcentajeRecargo: {
      type: Number,
      default: 0,
    },

    politicaCancelacion: {
      type: String,
      default: 'La cancelación evita futuras renovaciones. No contempla devolución parcial.',
    },

    fechaCancelacion: {
      type: Date,
    },

    motivoCancelacion: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

membresiaSchema.virtual('pagos', {
  ref: 'Pago',
  localField: '_id',
  foreignField: 'membresiaId',
});

module.exports = model('Membresia', membresiaSchema);