const Pago = require('../models/Pago');
const Membresia = require('../models/Membresia');
const Postulacion = require('../models/Postulacion');
const generarReporteEstadisticoPDF = require('../utils/estadisticasPDF.service');

const TIPOS_VALIDOS = ['todos', 'ingresos', 'inscritos', 'morosidad'];

const normalizarTipo = (tipoReporte) => {
  if (!tipoReporte) return 'todos';

  const tipo = tipoReporte.toString().toLowerCase().trim();

  return TIPOS_VALIDOS.includes(tipo) ? tipo : 'todos';
};

const normalizarFechaInput = (fecha) => {
  if (!fecha) return null;

  const valor = fecha.toString().trim();

  // Formato normal de input date: 2026-06-15
  if (/^\d{4}-\d{2}-\d{2}/.test(valor)) {
    return valor.slice(0, 10);
  }

  // Por si llega como 15/06/2026
  const formatoChile = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (formatoChile) {
    const [, dia, mes, anio] = formatoChile;
    return `${anio}-${mes}-${dia}`;
  }

  return valor;
};

const crearRangoFecha = (desde, hasta) => {
  const rangoDate = {};
  const rangoString = {};

  if (desde) {
    const desdeNormalizado = normalizarFechaInput(desde);
    const fechaDesde = new Date(`${desdeNormalizado}T00:00:00.000Z`);

    if (!Number.isNaN(fechaDesde.getTime())) {
      rangoDate.$gte = fechaDesde;
      rangoString.$gte = fechaDesde.toISOString();
    }
  }

  if (hasta) {
    const hastaNormalizado = normalizarFechaInput(hasta);
    const fechaHasta = new Date(`${hastaNormalizado}T23:59:59.999Z`);

    if (!Number.isNaN(fechaHasta.getTime())) {
      rangoDate.$lte = fechaHasta;
      rangoString.$lte = fechaHasta.toISOString();
    }
  }

  return {
    rangoDate,
    rangoString,
  };
};

const crearFiltroFechaFlexible = (desde, hasta, campos = []) => {
  const { rangoDate, rangoString } = crearRangoFecha(desde, hasta);

  const tieneFiltroFecha = Object.keys(rangoDate).length > 0;

  if (!tieneFiltroFecha || campos.length === 0) {
    return {};
  }

  const condiciones = [];

  campos.forEach((campo) => {
    condiciones.push({
      [campo]: { ...rangoDate },
    });

    condiciones.push({
      [campo]: { ...rangoString },
    });
  });

  return {
    $or: condiciones,
  };
};

const contarConAggregate = async (Modelo, filtro) => {
  const resultado = await Modelo.aggregate([
    { $match: filtro },
    { $count: 'total' },
  ]);

  return resultado[0]?.total || 0;
};

const calcularReporteIngresos = async ({ desde, hasta }) => {
  const filtroFecha = crearFiltroFechaFlexible(desde, hasta, [
    'fechaConfirmacion',
    'fecha',
    'createdAt',
    'updatedAt',
  ]);

  const filtro = {
    estado: 'AUTHORIZED',
    ...filtroFecha,
  };

  const pagos = await Pago.aggregate([
    { $match: filtro },
    {
      $sort: {
        fechaConfirmacion: -1,
        fecha: -1,
        createdAt: -1,
        updatedAt: -1,
      },
    },
  ]);

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
      fecha:
        pago.fechaConfirmacion ||
        pago.fecha ||
        pago.createdAt ||
        pago.updatedAt,
    })),
  };
};

const calcularReporteInscritos = async ({ desde, hasta }) => {
  const filtroFecha = crearFiltroFechaFlexible(desde, hasta, [
    'fechaRevisionAdmin',
    'updatedAt',
    'createdAt',
  ]);

  const filtro = {
    estado: 'Aprobada',
    ...filtroFecha,
  };

  const postulantesAprobados = await Postulacion.aggregate([
    { $match: filtro },
    {
      $sort: {
        fechaRevisionAdmin: -1,
        updatedAt: -1,
        createdAt: -1,
      },
    },
  ]);

  const aprobadosPorArea = await Postulacion.aggregate([
    { $match: filtro },
    {
      $group: {
        _id: '$areaFormacion',
        cantidad: { $sum: 1 },
      },
    },
    { $sort: { cantidad: -1 } },
  ]);

  const aprobadosPorProfesion = await Postulacion.aggregate([
    { $match: filtro },
    {
      $group: {
        _id: '$profesion',
        cantidad: { $sum: 1 },
      },
    },
    { $sort: { cantidad: -1 } },
  ]);

  return {
    totalNuevosInscritos: postulantesAprobados.length,

    // Se mantiene para no romper frontend o PDF si todavía usa este campo.
    totalAltasPagadas: postulantesAprobados.length,

    // Se mantiene para no romper frontend anterior.
    inscritosPorPlan: aprobadosPorArea,

    aprobadosPorArea,
    aprobadosPorProfesion,

    inscritos: postulantesAprobados.map((postulacion) => ({
      rutSocio: postulacion.rut,
      nombre: `${postulacion.nombre || ''} ${postulacion.apellido || ''}`.trim(),
      email: postulacion.email,
      profesion: postulacion.profesion,
      areaFormacion: postulacion.areaFormacion,
      estado: postulacion.estado,
      fecha:
        postulacion.fechaRevisionAdmin ||
        postulacion.updatedAt ||
        postulacion.createdAt,
    })),
  };
};

const calcularReporteMorosidad = async ({ desde, hasta }) => {
  const filtroFecha = crearFiltroFechaFlexible(desde, hasta, [
    'fechaProximoPago',
    'fechaTermino',
    'fechaInicio',
    'fechaUltimoPago',
    'updatedAt',
    'createdAt',
  ]);

  const filtroBase = {
    ...filtroFecha,
  };

  const totalMembresias = await contarConAggregate(Membresia, filtroBase);

  const totalMorosas = await contarConAggregate(Membresia, {
    ...filtroBase,
    estado: { $in: ['MOROSA', 'SUSPENDIDA'] },
  });

  const totalActivas = await contarConAggregate(Membresia, {
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

  const membresiasMorosas = await Membresia.aggregate([
    {
      $match: {
        ...filtroBase,
        estado: { $in: ['MOROSA', 'SUSPENDIDA'] },
      },
    },
    {
      $sort: {
        fechaProximoPago: 1,
        fechaTermino: 1,
        createdAt: 1,
      },
    },
  ]);

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
    Boolean(resultado.nuevosInscritos?.totalNuevosInscritos) ||
    Boolean(resultado.morosidad?.totalMembresias);

  return resultado;
};

const getReportesEstadisticos = async (req, res) => {
  try {
    const { desde, hasta, tipoReporte = 'todos' } = req.query;

    console.log('[ESTADISTICAS] Reporte solicitado:', {
      desde,
      hasta,
      tipoReporte,
      db: Pago.db.name,
    });

    const reportes = await construirReportes({
      desde,
      hasta,
      tipoReporte,
    });

    console.log('[ESTADISTICAS] Reporte generado:', {
      hayRegistros: reportes.hayRegistros,
      ingresos: reportes.ingresos?.cantidadPagos || 0,
      inscritos: reportes.nuevosInscritos?.totalNuevosInscritos || 0,
      membresias: reportes.morosidad?.totalMembresias || 0,
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