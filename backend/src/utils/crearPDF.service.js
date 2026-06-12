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

const generarComprobantePDF = ({ usuario, membresia, pago }) => {
  const comprobante = {
    numeroTransaccion: pago.ordenCompra,
    fecha: formatFecha(pago.fechaConfirmacion || pago.fecha),
    monto: formatMonto(pago.monto),
    metodoPago: 'Webpay Plus',
    estadoPago: pago.estado === 'AUTHORIZED' ? 'Pago exitoso' : pago.estado,
    estadoSolvencia:
      membresia.estado === 'ACTIVA'
        ? 'Solvente - Membresía vigente'
        : `Membresía en estado ${membresia.estado}`,
    plan: pago.planNombre || membresia.planNombre,
    tipoPago: pago.tipo === 'RENOVACION' ? 'Renovación' : 'Alta de membresía',
    nombreSocio: usuario.nombre || '',
    apellidoSocio: usuario.apellido || '',
    rutSocio: usuario.rut || pago.rutSocio,
    emailSocio: usuario.email || 'No disponible',
  };

  const doc = new jsPDF();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Comprobante Digital de Pago', 20, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Colegio de Diseñadores Instruccionales Chile - CODICH', 20, 30);

  doc.line(20, 36, 190, 36);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Datos del comprobante', 20, 48);

  const datos = [
    ['Número de transacción:', comprobante.numeroTransaccion],
    ['Fecha:', comprobante.fecha],
    ['Monto pagado:', comprobante.monto],
    ['Método de pago:', comprobante.metodoPago],
    ['Estado del pago:', comprobante.estadoPago],
    ['Estado de solvencia:', comprobante.estadoSolvencia],
    ['Plan:', comprobante.plan],
    ['Tipo de pago:', comprobante.tipoPago],
  ];

  let y = 60;

  datos.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y);

    doc.setFont('helvetica', 'normal');
    doc.text(String(value || 'No disponible'), 75, y);

    y += 10;
  });

  if (pago.esPagoConMora) {
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.text('Recargo por mora:', 20, y);

    doc.setFont('helvetica', 'normal');
    doc.text(
      `${formatMonto(pago.recargoMora)} (${pago.porcentajeRecargo}%)`,
      75,
      y
    );

    y += 10;
  }

  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Datos del socio', 20, y);

  y += 12;

  const datosSocio = [
    ['Nombre:', `${comprobante.nombreSocio} ${comprobante.apellidoSocio}`],
    ['RUT:', comprobante.rutSocio],
    ['Correo:', comprobante.emailSocio],
  ];

  datosSocio.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y);

    doc.setFont('helvetica', 'normal');
    doc.text(String(value || 'No disponible'), 75, y);

    y += 10;
  });

  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Datos de membresía', 20, y);

  y += 12;

  const datosMembresia = [
    ['Código:', membresia.codigoMembresia],
    ['Estado:', membresia.estado],
    ['Fecha inicio:', formatFecha(membresia.fechaInicio)],
    ['Fecha término:', formatFecha(membresia.fechaTermino)],
    ['Próximo pago:', formatFecha(membresia.fechaProximoPago)],
  ];

  datosMembresia.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, y);

    doc.setFont('helvetica', 'normal');
    doc.text(String(value || 'No disponible'), 75, y);

    y += 10;
  });

  y += 10;

  doc.line(20, y, 190, y);

  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    'Este comprobante fue generado automáticamente como respaldo digital del pago realizado por el socio dentro del sistema CODICH.',
    20,
    y,
    { maxWidth: 170 }
  );

  const arrayBuffer = doc.output('arraybuffer');

  return Buffer.from(arrayBuffer);
};

module.exports = generarComprobantePDF; 