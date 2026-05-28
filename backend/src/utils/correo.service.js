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
    link_pago: process.env.LINK_PAGO || 'https://www.transbank.cl',
    password: passwordProvisoria,
    rut: postulacion.rut,
    profesion: postulacion.profesion
  });
};

module.exports = {
  enviarCorreoPostulacionCreada,
  enviarCorreoPostulacionAprobada
};