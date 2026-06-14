const Pago = require('../models/Pago');
const Membresia = require('../models/Membresia');
const generarReporteEstadisticoPDF = require('../utils/estadisticasPDF.service');

const TIPOS_VALIDOS = ['todos', 'ingresos', 'inscritos', 'morosidad'];

const normalizarTipo = (tipoReporte) => {
  if (!tipoReporte) return 'todos';

  const tipo = tipoReporte.toString().toLowerCase().trim();

  return TIPOS_VALIDOS.includes(tipo) ? tipo : 'todos';
};

const crearFiltroFecha = (desde, hasta, campo = 'fecha') => {
  const filtroFecha = {};

  if (desde) {
    filtroFecha.$gte = new Date(`${desde}T00:00:00.000`);
  }

  if (hasta) {
    filtroFecha.$lte = new Date(`${hasta}T23:59:59.999`);
  }

  return Object.keys(filtroFecha).length > 0
    ? { [campo]: filtroFecha }
    : {};
};

const calcularReporteIngresos = async ({ desde, hasta }) => {
  const filtroFecha = crearFiltroFecha(desde, hasta, 'fecha');

  const filtro = {
    estado: 'AUTHORIZED',
    ...filtroFecha,
  };

  const pagos = await Pago.find(filtro).sort({ fecha: -1 }).lean();

  const totalIngresos = pagos.reduce(
    (acc, pago) => acc + Number(pago.monto || 0),
    0
  );

  const ingresosPorPlan = await Pago.aggregate([
    { $match: filtro },
    {
      $group: {
        _id: '$planNombre',
        cantidadPagos: { $sum: 1 },
        total: { $sum: '$monto' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const ingresosPorTipo = await Pago.aggregate([
    { $match: filtro },
    {
      $group: {
        _id: '$tipo',
        cantidadPagos: { $sum: 1 },
        total: { $sum: '$monto' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  return {
    totalIngresos,
    cantidadPagos: pagos.length,
    ingresosPorPlan,
    ingresosPorTipo,
    pagos: pagos.map((pago) => ({
      ordenCompra: pago.ordenCompra,
      rutSocio: pago.rutSocio,
      planNombre: pago.planNombre,
      tipo: pago.tipo,
      monto: pago.monto,
      fecha: pago.fechaConfirmacion || pago.fecha,
    })),
  };
};

const calcularReporteInscritos = async ({ desde, hasta }) => {
  const filtroFecha = crearFiltroFecha(desde, hasta, 'fecha');

  const filtro = {
    estado: 'AUTHORIZED',
    tipo: 'ALTA',
    ...filtroFecha,
  };

  const pagosAlta = await Pago.find(filtro).sort({ fecha: -1 }).lean();

  const rutsUnicos = new Set(pagosAlta.map((pago) => pago.rutSocio));

  const inscritosPorPlan = await Pago.aggregate([
    { $match: filtro },
    {
      $group: {
        _id: '$planNombre',
        cantidad: { $sum: 1 },
      },
    },
    { $sort: { cantidad: -1 } },
  ]);

  return {
    totalNuevosInscritos: rutsUnicos.size,
    totalAltasPagadas: pagosAlta.length,
    inscritosPorPlan,
    inscritos: pagosAlta.map((pago) => ({
      rutSocio: pago.rutSocio,
      planNombre: pago.planNombre,
      ordenCompra: pago.ordenCompra,
      fecha: pago.fechaConfirmacion || pago.fecha,
    })),
  };
};

const calcularReporteMorosidad = async ({ desde, hasta }) => {
  const filtroFecha = crearFiltroFecha(desde, hasta, 'createdAt');

  const filtroBase = {
    ...filtroFecha,
  };

  const totalMembresias = await Membresia.countDocuments(filtroBase);

  const totalMorosas = await Membresia.countDocuments({
    ...filtroBase,
    estado: { $in: ['MOROSA', 'SUSPENDIDA'] },
  });

  const totalActivas = await Membresia.countDocuments({
    ...filtroBase,
    estado: 'ACTIVA',
  });

  const tasaMorosidad =
    totalMembresias > 0
      ? Number(((totalMorosas / totalMembresias) * 100).toFixed(2))
      : 0;

  const morosidadPorEstado = await Membresia.aggregate([
    { $match: filtroBase },
    {
      $group: {
        _id: '$estado',
        cantidad: { $sum: 1 },
      },
    },
    { $sort: { cantidad: -1 } },
  ]);

  const membresiasMorosas = await Membresia.find({
    ...filtroBase,
    estado: { $in: ['MOROSA', 'SUSPENDIDA'] },
  })
    .sort({ fechaProximoPago: 1 })
    .lean();

  return {
    totalMembresias,
    totalMorosas,
    totalActivas,
    tasaMorosidad,
    morosidadPorEstado,
    membresiasMorosas: membresiasMorosas.map((membresia) => ({
      rutSocio: membresia.rutSocio,
      codigoMembresia: membresia.codigoMembresia,
      planNombre: membresia.planNombre,
      estado: membresia.estado,
      fechaProximoPago: membresia.fechaProximoPago,
      fechaTermino: membresia.fechaTermino,
    })),
  };
};

const construirReportes = async ({ desde, hasta, tipoReporte }) => {
  const tipo = normalizarTipo(tipoReporte);

  const resultado = {
    filtros: {
      desde: desde || null,
      hasta: hasta || null,
      tipoReporte: tipo,
    },
    ingresos: null,
    nuevosInscritos: null,
    morosidad: null,
  };

  if (tipo === 'todos' || tipo === 'ingresos') {
    resultado.ingresos = await calcularReporteIngresos({ desde, hasta });
  }

  if (tipo === 'todos' || tipo === 'inscritos') {
    resultado.nuevosInscritos = await calcularReporteInscritos({
      desde,
      hasta,
    });
  }

  if (tipo === 'todos' || tipo === 'morosidad') {
    resultado.morosidad = await calcularReporteMorosidad({ desde, hasta });
  }

  resultado.hayRegistros =
    Boolean(resultado.ingresos?.cantidadPagos) ||
    Boolean(resultado.nuevosInscritos?.totalAltasPagadas) ||
    Boolean(resultado.morosidad?.totalMembresias);

  return resultado;
};

const getReportesEstadisticos = async (req, res) => {
  try {
    const { desde, hasta, tipoReporte = 'todos' } = req.query;

    const reportes = await construirReportes({
      desde,
      hasta,
      tipoReporte,
    });

    return res.status(200).json(reportes);
  } catch (error) {
    console.error('Error al obtener reportes estadísticos:', error);

    return res.status(500).json({
      error: 'Hubo un problema al obtener los reportes estadísticos',
      detalle: error.message,
    });
  }
};

const exportarReportesPDF = async (req, res) => {
  try {
    const { desde, hasta, tipoReporte = 'todos' } = req.query;

    const tipoNormalizado = normalizarTipo(tipoReporte);

    const reportes = await construirReportes({
      desde,
      hasta,
      tipoReporte: tipoNormalizado,
    });

    const pdfBuffer = generarReporteEstadisticoPDF({
      reportes,
      filtros: {
        desde,
        hasta,
        tipoReporte: tipoNormalizado,
      },
    });

    const nombreArchivo = `reporte-estadistico-CODICH-${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${nombreArchivo}"`
    );

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al exportar reportes PDF:', error);

    return res.status(500).json({
      error: 'Error al exportar los reportes en PDF',
      detalle: error.message,
    });
  }
};

module.exports = {
  getReportesEstadisticos,
  exportarReportesPDF,
};