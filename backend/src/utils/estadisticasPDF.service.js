const { jsPDF } = require('jspdf');

const formatMonto = (monto) => {
  return Number(monto || 0).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
  });
};

const formatFecha = (fecha) => {
  if (!fecha) return 'No disponible';

  return new Date(fecha).toLocaleString('es-CL');
};

const textoTipoReporte = (tipoReporte) => {
  const tipos = {
    todos: 'Todos los reportes',
    ingresos: 'Ingresos',
    inscritos: 'Nuevos inscritos',
    morosidad: 'Tasa de morosidad',
  };

  return tipos[tipoReporte] || 'Todos los reportes';
};

const escribirDato = (doc, label, value, y) => {
  doc.setFont('helvetica', 'bold');
  doc.text(label, 20, y);

  doc.setFont('helvetica', 'normal');
  doc.text(String(value ?? 'No disponible'), 75, y);

  return y + 10;
};

const escribirSeccion = (doc, titulo, y) => {
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(titulo, 20, y);

  return y + 12;
};

const escribirFilaTabla = (doc, columnas, posicionesX, y, esHeader = false) => {
  doc.setFont('helvetica', esHeader ? 'bold' : 'normal');
  doc.setFontSize(10);

  columnas.forEach((columna, index) => {
    doc.text(String(columna ?? 'No disponible'), posicionesX[index], y);
  });

  return y + 8;
};

const generarReporteEstadisticoPDF = ({ reportes, filtros }) => {
  const doc = new jsPDF();

  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Reporte Estadístico Digital', 20, y);

  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Colegio de Diseñadores Instruccionales Chile - CODICH', 20, y);

  y += 6;

  doc.line(20, y, 190, y);

  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Datos del reporte', 20, y);

  y += 12;

  y = escribirDato(doc, 'Fecha generación:', formatFecha(new Date()), y);
  y = escribirDato(doc, 'Rango desde:', filtros.desde || 'Sin filtro', y);
  y = escribirDato(doc, 'Rango hasta:', filtros.hasta || 'Sin filtro', y);
  y = escribirDato(
    doc,
    'Tipo de reporte:',
    textoTipoReporte(filtros.tipoReporte),
    y
  );

  y += 4;

  doc.line(20, y, 190, y);

  y += 12;

  if (!reportes.hayRegistros) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('No existen registros para los filtros seleccionados.', 20, y);

    y += 20;
  } else {
    y = escribirSeccion(doc, 'Resumen general', y);

    if (reportes.ingresos) {
      y = escribirDato(
        doc,
        'Total ingresos:',
        formatMonto(reportes.ingresos.totalIngresos),
        y
      );
    }

    if (reportes.nuevosInscritos) {
      y = escribirDato(
        doc,
        'Nuevos inscritos:',
        reportes.nuevosInscritos.totalNuevosInscritos,
        y
      );
    }

    if (reportes.morosidad) {
      y = escribirDato(
        doc,
        'Tasa morosidad:',
        `${reportes.morosidad.tasaMorosidad}%`,
        y
      );
    }

    y += 4;

    doc.line(20, y, 190, y);

    y += 12;

    if (reportes.ingresos) {
      y = escribirSeccion(doc, 'Reporte de ingresos', y);

      y = escribirDato(
        doc,
        'Total ingresos:',
        formatMonto(reportes.ingresos.totalIngresos),
        y
      );

      y = escribirDato(
        doc,
        'Pagos autorizados:',
        reportes.ingresos.cantidadPagos,
        y
      );

      y += 4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Ingresos por tipo de pago', 20, y);

      y += 10;

      y = escribirFilaTabla(
        doc,
        ['Tipo', 'Cantidad de pagos', 'Total'],
        [20, 75, 135],
        y,
        true
      );

      reportes.ingresos.ingresosPorTipo.forEach((item) => {
        y = escribirFilaTabla(
          doc,
          [
            item._id || 'Sin tipo',
            item.cantidadPagos,
            formatMonto(item.total),
          ],
          [20, 75, 135],
          y
        );
      });

      y += 4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Ingresos por plan', 20, y);

      y += 10;

      y = escribirFilaTabla(
        doc,
        ['Plan', 'Cantidad de pagos', 'Total'],
        [20, 90, 145],
        y,
        true
      );

      reportes.ingresos.ingresosPorPlan.forEach((item) => {
        y = escribirFilaTabla(
          doc,
          [
            item._id || 'Sin plan',
            item.cantidadPagos,
            formatMonto(item.total),
          ],
          [20, 90, 145],
          y
        );
      });

      y += 4;

      doc.line(20, y, 190, y);

      y += 12;
    }

    if (reportes.nuevosInscritos) {
      y = escribirSeccion(doc, 'Reporte de nuevos inscritos', y);

      y = escribirDato(
        doc,
        'Inscritos únicos:',
        reportes.nuevosInscritos.totalNuevosInscritos,
        y
      );

      y = escribirDato(
        doc,
        'Altas pagadas:',
        reportes.nuevosInscritos.totalAltasPagadas,
        y
      );

      y += 4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Inscritos por plan', 20, y);

      y += 10;

      y = escribirFilaTabla(
        doc,
        ['Plan', 'Cantidad'],
        [20, 130],
        y,
        true
      );

      reportes.nuevosInscritos.inscritosPorPlan.forEach((item) => {
        y = escribirFilaTabla(
          doc,
          [item._id || 'Sin plan', item.cantidad],
          [20, 130],
          y
        );
      });

      y += 4;

      doc.line(20, y, 190, y);

      y += 12;
    }

    if (reportes.morosidad) {
      y = escribirSeccion(doc, 'Reporte de tasa de morosidad', y);

      y = escribirDato(
        doc,
        'Total membresías:',
        reportes.morosidad.totalMembresias,
        y
      );

      y = escribirDato(
        doc,
        'Morosas:',
        reportes.morosidad.totalMorosas,
        y
      );

      y = escribirDato(
        doc,
        'Activas:',
        reportes.morosidad.totalActivas,
        y
      );

      y = escribirDato(
        doc,
        'Tasa morosidad:',
        `${reportes.morosidad.tasaMorosidad}%`,
        y
      );

      y += 4;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Distribución por estado', 20, y);

      y += 10;

      y = escribirFilaTabla(
        doc,
        ['Estado', 'Cantidad'],
        [20, 130],
        y,
        true
      );

      reportes.morosidad.morosidadPorEstado.forEach((item) => {
        y = escribirFilaTabla(
          doc,
          [item._id || 'Sin estado', item.cantidad],
          [20, 130],
          y
        );
      });

      y += 4;

      if (reportes.morosidad.membresiasMorosas?.length > 0) {
        if (y > 230) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Detalle de membresías morosas o suspendidas', 20, y);

        y += 10;

        y = escribirFilaTabla(
          doc,
          ['RUT', 'Código', 'Estado', 'Próximo pago'],
          [20, 55, 115, 145],
          y,
          true
        );

        reportes.morosidad.membresiasMorosas.forEach((item) => {
          if (y > 260) {
            doc.addPage();
            y = 20;
          }

          y = escribirFilaTabla(
            doc,
            [
              item.rutSocio || 'No registrado',
              item.codigoMembresia || 'No registrado',
              item.estado || 'Sin estado',
              item.fechaProximoPago
                ? new Date(item.fechaProximoPago).toLocaleDateString('es-CL')
                : 'No disponible',
            ],
            [20, 55, 115, 145],
            y
          );
        });
      }

      y += 4;

      doc.line(20, y, 190, y);

      y += 12;
    }
  }

  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    'Este reporte fue generado automáticamente como respaldo digital de los indicadores estadísticos registrados dentro del sistema CODICH.',
    20,
    y,
    { maxWidth: 170 }
  );

  const arrayBuffer = doc.output('arraybuffer');

  return Buffer.from(arrayBuffer);
};

module.exports = generarReporteEstadisticoPDF;