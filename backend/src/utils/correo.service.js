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

const enviarCorreoPostulacionCreada = async (postulacion) => {
  return enviarEmailJS(process.env.EMAILJS_TEMPLATE_POSTULACION, {
    name: `${postulacion.nombre} ${postulacion.apellido}`,
    email: postulacion.email,
    correo: process.env.CODICH_LINK || 'https://www.codich.cl'
  });
};

const enviarCorreoPostulacionAprobada = async (postulacion, passwordProvisoria) => {
  return enviarEmailJS(process.env.EMAILJS_TEMPLATE_APROBACION, {
    name: `${postulacion.nombre} ${postulacion.apellido}`,
    email: postulacion.email,
    estado: 'Aprobada',
    mensaje: `Hola ${postulacion.nombre},\nTe informamos que tu postulacion en CODICH ha sido aprobada.\nPodras iniciar sesion en codich.cl con tu croreo y una contraseña temporal que podras cambiar una vez iniciado.\nTu contraseña temporal es: ${passwordProvisoria} \n Ademas, te dejaremos un boton de pago de tu membresia en tu perfil de socio dentro de la pagina de CODICH para que puedas elegir el plan que mas te acomode y pagar inmediatamente.\nTendras 5 dias habiles para pagar, en caso de no hacerlo, el sistema dara de baja tu membresia.`,
  });
};

const enviarCorreoPostulacionRechazada = async (postulacion) => {
  return enviarEmailJS(process.env.EMAILJS_TEMPLATE_APROBACION, {
    name: `${postulacion.nombre} ${postulacion.apellido}`,
    email: postulacion.email,
    estado: 'Rechazada',
    mensaje: `Hola ${postulacion.nombre},\nTe informamos que tu postulacion en CODICH ha sido rechazada.\nSi tienes alguna pregunta, no dudes en contactarnos.`,
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

module.exports = {
  enviarCorreoPostulacionCreada,
  enviarCorreoPostulacionAprobada,
  enviarCorreoPostulacionRechazada,
  enviarCorreoContacto,
};
