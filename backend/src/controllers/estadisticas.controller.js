const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;

const Pago = require('../models/Pago');
const Membresia = require('../models/Membresia');

const TIPOS_VALIDOS = ['todos', 'ingresos', 'inscritos', 'morosidad'];

const COLOR_PRINCIPAL = [30, 95, 168];
const COLOR_TEXTO = [31, 41, 55];
const COLOR_GRIS = [100, 116, 139];
const COLOR_BORDE = [226, 232, 240];
const COLOR_FONDO_SUAVE = [241, 245, 249];

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

const formatearMoneda = (monto) =>
  Number(monto || 0).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
  });

const formatearFecha = (fecha) => {
  if (!fecha) return 'No registrada';

  const fechaValida = new Date(fecha);

  if (Number.isNaN(fechaValida.getTime())) {
    return 'No registrada';
  }

  return fechaValida.toLocaleDateString('es-CL');
};

const formatearFechaHora = (fecha) => {
  if (!fecha) return 'No registrada';

  const fechaValida = new Date(fecha);

  if (Number.isNaN(fechaValida.getTime())) {
    return 'No registrada';
  }

  return fechaValida.toLocaleString('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
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
    resultado.nuevosInscritos = await calcularReporteInscritos({ desde, hasta });
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

const agregarLineaSeparadora = (doc, y) => {
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 190, y);
};

const escribirTituloDocumento = (doc, { desde, hasta, tipoReporte }) => {
  doc.setTextColor(20, 20, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Reporte Estadístico Digital', 105, 24, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    'Colegio de Diseñadores Instruccionales Chile - CODICH',
    105,
    32,
    {
      align: 'center',
    }
  );

  agregarLineaSeparadora(doc, 40);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Datos del reporte', 20, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(`Fecha de generación: ${formatearFechaHora(new Date())}`, 20, 62);
  doc.text(`Rango desde: ${desde || 'Sin filtro'}`, 20, 70);
  doc.text(`Rango hasta: ${hasta || 'Sin filtro'}`, 20, 78);
  doc.text(`Tipo de reporte: ${normalizarTipo(tipoReporte)}`, 20, 86);

  agregarLineaSeparadora(doc, 94);

  return 106;
};

const escribirCampo = (doc, etiqueta, valor, x, y) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`${etiqueta}:`, x, y);

  doc.setFont('helvetica', 'normal');
  doc.text(String(valor), x + 45, y);
};

const escribirSeccion = (doc, titulo, y) => {
  if (y > 260) {
    doc.addPage();
    y = 24;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(titulo, 20, y);

  return y + 10;
};

const escribirResumenGeneral = (doc, reportes, y) => {
  y = escribirSeccion(doc, 'Resumen general', y);

  const totalIngresos = reportes.ingresos
    ? formatearMoneda(reportes.ingresos.totalIngresos)
    : 'No generado';

  const nuevosInscritos = reportes.nuevosInscritos
    ? reportes.nuevosInscritos.totalNuevosInscritos
    : 'No generado';

  const tasaMorosidad = reportes.morosidad
    ? `${reportes.morosidad.tasaMorosidad}%`
    : 'No generado';

  escribirCampo(doc, 'Total ingresos', totalIngresos, 20, y);
  y += 8;

  escribirCampo(doc, 'Nuevos inscritos', nuevosInscritos, 20, y);
  y += 8;

  escribirCampo(doc, 'Tasa de morosidad', tasaMorosidad, 20, y);
  y += 8;

  agregarLineaSeparadora(doc, y + 4);

  return y + 16;
};

const crearTablaSimple = (doc, { startY, head, body }) => {
  autoTable(doc, {
    startY,
    head,
    body,
    theme: 'plain',
    margin: {
      left: 20,
      right: 20,
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 2,
      textColor: [20, 20, 20],
    },
    headStyles: {
      fontStyle: 'bold',
      textColor: [20, 20, 20],
      fillColor: [255, 255, 255],
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255],
    },
  });

  return doc.lastAutoTable.finalY + 8;
};

const agregarSeccionIngresos = (doc, reporte, yInicial) => {
  let y = escribirSeccion(doc, 'Reporte de ingresos', yInicial);

  escribirCampo(doc, 'Total ingresos', formatearMoneda(reporte.totalIngresos), 20, y);
  y += 8;

  escribirCampo(doc, 'Pagos autorizados', reporte.cantidadPagos, 20, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Ingresos por plan', 20, y);
  y += 4;

  if (!reporte.ingresosPorPlan.length) {
    doc.setFont('helvetica', 'normal');
    doc.text('Sin ingresos registrados.', 20, y + 6);
    return y + 18;
  }

  y = crearTablaSimple(doc, {
    startY: y,
    head: [['Plan', 'Cantidad de pagos', 'Total']],
    body: reporte.ingresosPorPlan.map((item) => [
      item._id || 'Sin plan',
      item.cantidadPagos,
      formatearMoneda(item.total),
    ]),
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Ingresos por tipo de pago', 20, y);
  y += 4;

  y = crearTablaSimple(doc, {
    startY: y,
    head: [['Tipo', 'Cantidad de pagos', 'Total']],
    body: reporte.ingresosPorTipo.map((item) => [
      item._id || 'Sin tipo',
      item.cantidadPagos,
      formatearMoneda(item.total),
    ]),
  });

  agregarLineaSeparadora(doc, y);

  return y + 10;
};

const agregarSeccionInscritos = (doc, reporte, yInicial) => {
  let y = yInicial;

  if (y > 240) {
    doc.addPage();
    y = 24;
  }

  y = escribirSeccion(doc, 'Reporte de nuevos inscritos', y);

  escribirCampo(doc, 'Nuevos inscritos únicos', reporte.totalNuevosInscritos, 20, y);
  y += 8;

  escribirCampo(doc, 'Altas pagadas', reporte.totalAltasPagadas, 20, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Inscritos por plan', 20, y);
  y += 4;

  if (!reporte.inscritosPorPlan.length) {
    doc.setFont('helvetica', 'normal');
    doc.text('Sin nuevos inscritos registrados.', 20, y + 6);
    return y + 18;
  }

  y = crearTablaSimple(doc, {
    startY: y,
    head: [['Plan', 'Cantidad']],
    body: reporte.inscritosPorPlan.map((item) => [
      item._id || 'Sin plan',
      item.cantidad,
    ]),
  });

  agregarLineaSeparadora(doc, y);

  return y + 10;
};

const agregarSeccionMorosidad = (doc, reporte, yInicial) => {
  let y = yInicial;

  if (y > 235) {
    doc.addPage();
    y = 24;
  }

  y = escribirSeccion(doc, 'Reporte de tasa de morosidad', y);

  escribirCampo(doc, 'Total membresías', reporte.totalMembresias, 20, y);
  y += 8;

  escribirCampo(doc, 'Membresías morosas', reporte.totalMorosas, 20, y);
  y += 8;

  escribirCampo(doc, 'Membresías activas', reporte.totalActivas, 20, y);
  y += 8;

  escribirCampo(doc, 'Tasa de morosidad', `${reporte.tasaMorosidad}%`, 20, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Distribución por estado', 20, y);
  y += 4;

  if (!reporte.morosidadPorEstado.length) {
    doc.setFont('helvetica', 'normal');
    doc.text('Sin membresías registradas.', 20, y + 6);
    return y + 18;
  }

  y = crearTablaSimple(doc, {
    startY: y,
    head: [['Estado', 'Cantidad']],
    body: reporte.morosidadPorEstado.map((item) => [
      item._id || 'Sin estado',
      item.cantidad,
    ]),
  });

  if (reporte.membresiasMorosas.length) {
    if (y > 230) {
      doc.addPage();
      y = 24;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Detalle de membresías morosas o suspendidas', 20, y);
    y += 4;

    y = crearTablaSimple(doc, {
      startY: y,
      head: [['RUT socio', 'Código', 'Plan', 'Estado', 'Próximo pago']],
      body: reporte.membresiasMorosas.map((item) => [
        item.rutSocio || 'No registrado',
        item.codigoMembresia || 'No registrado',
        item.planNombre || 'Sin plan',
        item.estado || 'Sin estado',
        formatearFecha(item.fechaProximoPago),
      ]),
    });
  }

  agregarLineaSeparadora(doc, y);

  return y + 10;
};

const agregarTextoFinal = (doc) => {
  const totalPaginas = doc.internal.getNumberOfPages();

  for (let i = 1; i <= totalPaginas; i += 1) {
    doc.setPage(i);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);

    const texto =
      'Este reporte fue generado automáticamente como respaldo digital de los indicadores estadísticos registrados dentro del sistema CODICH.';

    const lineas = doc.splitTextToSize(texto, 170);

    doc.text(lineas, 20, 276);

    doc.setFontSize(8);
    doc.text(`Página ${i} de ${totalPaginas}`, 190, 292, {
      align: 'right',
    });
  }
};

const exportarReportesPDF = async (req, res) => {
  try {
    const { desde, hasta, tipoReporte = 'todos' } = req.query;

    const reportes = await construirReportes({
      desde,
      hasta,
      tipoReporte,
    });

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    let y = escribirTituloDocumento(doc, {
      desde,
      hasta,
      tipoReporte,
    });

    if (!reportes.hayRegistros) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text('No existen registros para los filtros seleccionados.', 20, y);
    } else {
      y = escribirResumenGeneral(doc, reportes, y);

      if (reportes.ingresos) {
        y = agregarSeccionIngresos(doc, reportes.ingresos, y);
      }

      if (reportes.nuevosInscritos) {
        y = agregarSeccionInscritos(doc, reportes.nuevosInscritos, y);
      }

      if (reportes.morosidad) {
        y = agregarSeccionMorosidad(doc, reportes.morosidad, y);
      }
    }

    agregarTextoFinal(doc);

    const arrayBuffer = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(arrayBuffer);

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