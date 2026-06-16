const EMAILJS_URL = 'https://api.emailjs.com/api/v1.0/email/send';

const enviarEmailJS = async (templateId, templateParams) => {
  if (!process.env.EMAILJS_SERVICE_ID) {
    throw new Error('Falta EMAILJS_SERVICE_ID en el .env');
  }

  if (!process.env.EMAILJS_PUBLIC_KEY) {
    throw new Error('Falta EMAILJS_PUBLIC_KEY en el .env');
  }

  if (!process.env.EMAILJS_PRIVATE_KEY) {
    throw new Error('Falta EMAILJS_PRIVATE_KEY en el .env');
  }

  if (!templateId) {
    throw new Error('Falta el templateId de EmailJS');
  }

  const response = await fetch(EMAILJS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: templateId,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: templateParams
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error EmailJS: ${errorText}`);
  }

  return true;
};

const formatMonto = (monto) => {
  return Number(monto || 0).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
  });
};

const formatFecha = (fecha) => {
  if (!fecha) return 'No disponible';

  return new Date(fecha).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const enviarCorreoPostulacionCreada = async (postulacion) => {
  return enviarEmailJS(process.env.EMAILJS_TEMPLATE_POSTULACION, {
    name: `${postulacion.nombre} ${postulacion.apellido}`,
    email: postulacion.email,
    correo: process.env.CODICH_LINK || 'https://www.codich.cl'
  });
};

const enviarCorreoPostulacionAprobada = async (postulacion, passwordProvisoria) => {
  return enviarEmailJS(process.env.EMAILJS_TEMPLATE, {
    name: `${postulacion.nombre} ${postulacion.apellido}`,
    email: postulacion.email,
    subject: 'Hemos recibido tu solicitud de membresía en CODICH',
    titulo: '¡Tu solicitud ha sido aprobada!',
    estado: 'Aprobada',
    mensaje: `Hola ${postulacion.nombre},
Te informamos que tu postulación en CODICH ha sido aprobada.
Podrás iniciar sesión en codich.cl con tu correo y una contraseña temporal que podrás cambiar una vez iniciado.
Tu contraseña temporal es: ${passwordProvisoria}

Además, tendrás un botón de pago de tu membresía en tu perfil de socio dentro de la página de CODICH para que puedas elegir el plan que más te acomode y pagar inmediatamente.

Tendrás 5 días hábiles para pagar. En caso de no hacerlo, el sistema dará de baja tu membresía.`,
  });
};

const enviarCorreoPostulacionRechazada = async (postulacion) => {
  return enviarEmailJS(process.env.EMAILJS_TEMPLATE, {
    name: `${postulacion.nombre} ${postulacion.apellido}`,
    email: postulacion.email,
    subject: 'Hemos recibido tu solicitud de membresía en CODICH',
    titulo: 'Lamentablemente tu solicitud ha sido rechazada',
    estado: 'Rechazada',
    mensaje: `Hola ${postulacion.nombre},
Te informamos que tu postulación en CODICH ha sido rechazada.
Si tienes alguna pregunta, no dudes en contactarnos.`,
  });
};

const enviarCorreoPago = async ({ usuario, pago, membresia, detalle }) => {
  if (!usuario?.email) {
    throw new Error('No se encontró el correo del usuario para enviar comprobante de pago.');
  }

  const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Socio CODICH';

  const montoPagado = formatMonto(pago?.monto);
  const montoBase = pago?.montoBase ? formatMonto(pago.montoBase) : null;
  const recargoMora = pago?.recargoMora ? formatMonto(pago.recargoMora) : null;

  const fechaPago = formatFecha(pago?.fechaConfirmacion || new Date());
  const fechaTermino = formatFecha(membresia?.fechaTermino);
  const fechaProximoPago = formatFecha(membresia?.fechaProximoPago);

  const codigoAutorizacion =
    detalle?.authorization_code ||
    detalle?.authorizationCode ||
    'No disponible';

  const mensajeMora = pago?.esPagoConMora
    ? `\nEste pago incluye un recargo por mora de ${recargoMora}, correspondiente al ${pago.porcentajeRecargo}% sobre el valor base de la membresía. Este recargo aplica solo a esta renovación.`
    : '';

  return enviarEmailJS(process.env.EMAILJS_TEMPLATE_PAGO || process.env.EMAILJS_TEMPLATE, {
    name: nombreCompleto,
    email: usuario.email,
    subject: 'Comprobante de pago de membresía CODICH',
    titulo: 'Pago de membresía confirmado',
    mensaje: `Hola ${usuario.nombre || 'socio'},

Hemos recibido correctamente tu pago de membresía en CODICH.

Resumen del pago:
• Plan: ${pago?.plan || membresia?.planNombre || 'No disponible'}
• Tipo de pago: ${pago?.tipo === 'RENOVACION' ? 'Renovación de membresía' : 'Activación de membresía'}
• Orden de compra: ${pago?.ordenCompra || 'No disponible'}
• Monto pagado: ${montoPagado}${montoBase ? `\n• Monto base: ${montoBase}` : ''}${mensajeMora}
• Fecha de pago: ${fechaPago}
• Código de autorización: ${codigoAutorizacion}

Estado de tu membresía:
• Estado actual: ${membresia?.estado || 'ACTIVA'}
• Vigente hasta: ${fechaTermino}
• Próximo pago desde: ${fechaProximoPago}

Tu membresía ya se encuentra activa y puedes acceder a los beneficios correspondientes.

Saludos,
Equipo CODICH`,
  });
};

const enviarCorreoContacto = async ({ nombre, email, asunto, mensaje }) => {
  return enviarEmailJS(process.env.EMAILJS_TEMPLATE_CONTACTO, {
    name: nombre,
    email,
    asunto,
    mensaje,
    admin_email: process.env.ADMIN_EMAIL || 'admin@codich.cl',
  });
};

const enviarCorreoMoroso = async ({ usuario, membresia }) => {
  if (!usuario?.email) {
    throw new Error('No se encontró el correo del usuario moroso.');
  }

  return enviarEmailJS(process.env.EMAILJS_TEMPLATE, {
    name: `${usuario.nombre} ${usuario.apellido}`,
    email: usuario.email,
    subject: 'Recordatorio de pago pendiente en CODICH',
    titulo: 'Tu membresía está en riesgo de suspensión por falta de pago',
    estado: 'Pago pendiente',
    mensaje: `Hola ${usuario.nombre},
Te recordamos que tu membresía en CODICH se encuentra con un pago pendiente desde el ${formatFecha(membresia?.fechaProximoPago)}.
Si no realizas el pago dentro de los próximos 5 días hábiles, tu membresía será suspendida y perderás acceso a los beneficios.
Si ya realizaste el pago, por favor ignora este mensaje. Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.`,
  });
};

const enviarCorreoSoporte = async ({ asunto, mensaje }) => {
  const correoSoporte =
    process.env.SOPORTE_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'soporte@codich.cl';

  return enviarEmailJS(
    process.env.EMAILJS_TEMPLATE_SOPORTE || process.env.EMAILJS_TEMPLATE,
    {
      name: 'Soporte Técnico CODICH',
      email: correoSoporte,
      subject: asunto,
      titulo: asunto,
      estado: 'Notificación de respaldo',
      mensaje,
    }
  );
};

module.exports = {
  enviarCorreoPostulacionCreada,
  enviarCorreoPostulacionAprobada,
  enviarCorreoPostulacionRechazada,
  enviarCorreoPago,
  enviarCorreoContacto,
  enviarCorreoMoroso,
  enviarCorreoSoporte,
};