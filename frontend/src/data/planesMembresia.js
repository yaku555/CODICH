export const OPCIONES_MEMBRESIA = [
  {
    id: 'mensual-contado',
    planId: 'mensual',
    modalidad: 'contado',
    nombre: 'Mensual',
    subtitulo: 'Sin permanencia',
    monto: 15000,
    total: 15000,
    descripcion: 'Ideal para socios que prefieren pagar mes a mes.',
    beneficios: ['Renovacion mensual', 'Sin compromiso largo', 'Pago inmediato por WebPay'],
  },
  {
    id: 'trimestral-contado',
    planId: 'trimestral',
    modalidad: 'contado',
    nombre: 'Trimestral',
    subtitulo: 'Ahorro de $5.000',
    monto: 40000,
    total: 40000,
    ahorro: 5000,
    descripcion: 'Paga 3 meses por adelantado con descuento frente al pago mensual.',
    beneficios: ['3 meses activos', 'Ahorro de $5.000', 'Un solo pago'],
  },
  {
    id: 'anual-contado',
    planId: 'anual',
    modalidad: 'contado',
    nombre: 'Anual',
    subtitulo: 'Mayor ahorro',
    monto: 120000,
    total: 120000,
    ahorro: 60000,
    destacado: true,
    descripcion: 'Activa 12 meses pagando una sola vez con el mejor precio.',
    beneficios: ['12 meses activos', 'Ahorro de $60.000', 'Un solo pago'],
  },
];

export const PLANES_PRINCIPALES = [
  {
    id: 'mensual',
    nombre: 'Mensual',
    precioDesde: 15000,
    descripcion: 'Pago mes a mes, sin permanencia.',
    resumen: '$15.000 por mes',
  },
  {
    id: 'trimestral',
    nombre: 'Trimestral',
    precioDesde: 40000,
    descripcion: 'Tres meses de membresia con descuento.',
    resumen: '$40.000 pago unico',
  },
  {
    id: 'anual',
    nombre: 'Anual',
    precioDesde: 120000,
    descripcion: 'Doce meses de membresia al mejor precio.',
    resumen: '$120.000 pago unico',
  },
];

export function formatMonto(monto) {
  return Number(monto || 0).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
  });
}
