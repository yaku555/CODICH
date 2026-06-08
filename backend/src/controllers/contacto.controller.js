const { enviarCorreoContacto } = require('../utils/correo.service');

const enviarConsulta = async (req, res) => {
  try {
    const { nombre, email, asunto, mensaje } = req.body;

    if (!nombre || !email || !asunto || !mensaje) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    await enviarCorreoContacto({ nombre, email, asunto, mensaje });
    res.json({ mensaje: 'Consulta enviada correctamente' });
  } catch (error) {
    console.error('[CONTACTO ERROR]', error.message);
    res.status(500).json({ error: 'No se pudo enviar la consulta', detalle: error.message });
  }
};

module.exports = { enviarConsulta };
