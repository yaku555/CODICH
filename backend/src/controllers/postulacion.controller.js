// imports de lirberias, modelos y servicios

const crypto = require('crypto');
const Postulacion = require('../models/Postulacion');
const Usuario = require('../models/Usuario');
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const generarPasswordProvisoria = require('../utils/generarPassword');
const evaluarPostulacion = require('../utils/evaluarPostulacion');
const {
  enviarCorreoPostulacionCreada,
  enviarCorreoPostulacionAprobada,
  enviarCorreoPostulacionRechazada,
} = require('../utils/correo.service');

// sube el cv a supabase y devuelve la ruta donde quedo guardado
const subirCVSupabase = async (archivo, rut) => {
  if (!archivo) return null;

  if (!archivo.buffer) {
    throw new Error('El archivo no está en memoria. Revisa que multer use memoryStorage().');
  }

  const bucket = process.env.SUPABASE_BUCKET_CVS;

  if (!bucket) {
    throw new Error('Falta SUPABASE_BUCKET_CVS en el archivo .env');
  }

  const nombreArchivo = `${Date.now()}-${crypto.randomUUID()}.pdf`;
  const rutaArchivo = `postulantes/${rut}/${nombreArchivo}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(rutaArchivo, archivo.buffer, {
      contentType: archivo.mimetype,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return rutaArchivo;
};

// crea una postulacion nueva, la evalua automaticamente y envia correo de confirmacion
const create = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      rut,
      fechaNacimiento,
      email,
      telefono,
      residencia,
      profesion,
      areaFormacion,
      experiencia,
      aniosExperiencia,
    } = req.body;

    if (
      !nombre ||
      !apellido ||
      !rut ||
      !email ||
      !fechaNacimiento ||
      !telefono ||
      !residencia ||
      !profesion ||
      !areaFormacion ||
      !experiencia ||
      aniosExperiencia === undefined ||
      aniosExperiencia === null ||
      aniosExperiencia === ''
    ) {
      return res.status(400).json({
        error: 'Debes completar todos los campos obligatorios.',
      });
    }

    const fechaNacimientoValida = new Date(fechaNacimiento);

    if (Number.isNaN(fechaNacimientoValida.getTime())) {
      return res.status(400).json({
        error: 'La fecha de nacimiento no es válida.',
      });
    }

    const postulacionExistente = await Postulacion.findOne({ rut });

    // importante por que se evalua si hay un postulante con el mismo rut
    if (postulacionExistente) {
      return res.status(400).json({
        error: 'Ya existe una postulación con ese RUT.',
      });
    }

    let documentoPath = '';

    if (req.file) {
      documentoPath = await subirCVSupabase(req.file, rut);
    }

    const resultadoEvaluacion = evaluarPostulacion({
      nombre,
      apellido,
      rut,
      fechaNacimiento: fechaNacimientoValida,
      email,
      telefono,
      residencia,
      profesion,
      areaFormacion,
      experiencia,
      aniosExperiencia,
      documentoPath,
    });

    const nuevaPostulacion = new Postulacion({
      nombre,
      apellido,
      rut,
      fechaNacimiento: fechaNacimientoValida,
      email,
      telefono,
      residencia,
      profesion,
      areaFormacion,
      experiencia,
      aniosExperiencia: Number(aniosExperiencia),
      documentoPath,
      estado: resultadoEvaluacion.estado,
      motivoRechazo: resultadoEvaluacion.motivoRechazo,
    });

    const postulacionGuardada = await nuevaPostulacion.save();

    try {
      await enviarCorreoPostulacionCreada(postulacionGuardada);
    } catch (errorCorreo) {
      console.error(
        'La postulación fue creada, pero falló el correo de confirmación:',
        errorCorreo.message
      );
    }

    return res.status(201).json(postulacionGuardada);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Error al crear la postulación.',
      detalle: error.message,
    });
  }
};

// get de las postulaciones
const getAll = async (req, res) => {
  try {
    const postulaciones = await Postulacion.find().sort({ createdAt: -1 });

    return res.json(postulaciones);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Error al obtener las postulaciones.',
      detalle: error.message,
    });
  }
};

// get una postulacion con el rut
const getById = async (req, res) => {
  try {
    const { rut } = req.params;

    const postulacion = await Postulacion.findOne({ rut });

    if (!postulacion) {
      return res.status(404).json({
        error: 'Postulación no encontrada.',
      });
    }

    return res.json(postulacion);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Error al obtener la postulación.',
      detalle: error.message,
    });
  }
};

// actualiza los datos de una postulacion y tambien permite cambiar el cv si viene archivo nuevo
const update = async (req, res) => {
  try {
    const { rut } = req.params;

    const datosActualizados = {
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      rut: req.body.rut,
      fechaNacimiento: req.body.fechaNacimiento,
      email: req.body.email,
      telefono: req.body.telefono,
      residencia: req.body.residencia,
      profesion: req.body.profesion,
      areaFormacion: req.body.areaFormacion,
      experiencia: req.body.experiencia,
      aniosExperiencia: req.body.aniosExperiencia,
      estado: req.body.estado,
      motivoRechazo: req.body.motivoRechazo,
      comentarioAdmin: req.body.comentarioAdmin,
    };

    Object.keys(datosActualizados).forEach((key) => {
      if (datosActualizados[key] === undefined) {
        delete datosActualizados[key];
      }
    });

    if (datosActualizados.aniosExperiencia !== undefined) {
      datosActualizados.aniosExperiencia = Number(
        datosActualizados.aniosExperiencia
      );
    }

    if (req.file) {
      datosActualizados.documentoPath = await subirCVSupabase(req.file, rut);
    }

    if (datosActualizados.fechaNacimiento !== undefined) {
      const fechaNacimientoValida = new Date(datosActualizados.fechaNacimiento);

      if (Number.isNaN(fechaNacimientoValida.getTime())) {
        return res.status(400).json({
          error: 'La fecha de nacimiento no es válida.',
        });
      }

      datosActualizados.fechaNacimiento = fechaNacimientoValida;
    }

    const postulacionActualizada = await Postulacion.findOneAndUpdate(
      { rut },
      datosActualizados,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    if (!postulacionActualizada) {
      return res.status(404).json({
        error: 'Postulación no encontrada.',
      });
    }

    return res.json(postulacionActualizada);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Error al actualizar la postulación.',
      detalle: error.message,
    });
  }
};

// elimina una postulacion segun su rut
const remove = async (req, res) => {
  try {
    const { rut } = req.params;

    const postulacionEliminada = await Postulacion.findOneAndDelete({ rut });

    if (!postulacionEliminada) {
      return res.status(404).json({
        error: 'Postulación no encontrada.',
      });
    }

    return res.json({
      message: 'Postulación eliminada correctamente.',
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Error al eliminar la postulación.',
      detalle: error.message,
    });
  }
};

// genera una url temporal para poder ver el cv guardado en supabase
const getCvUrl = async (req, res) => {
  try {
    const { rut } = req.params;

    const postulacion = await Postulacion.findOne({ rut });

    if (!postulacion) {
      return res.status(404).json({
        error: 'Postulación no encontrada.',
      });
    }

    if (!postulacion.documentoPath) {
      return res.status(404).json({
        error: 'La postulación no tiene CV asociado.',
      });
    }

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET_CVS)
      .createSignedUrl(postulacion.documentoPath, 60 * 5);

    if (error) {
      return res.status(500).json({
        error: 'No se pudo generar la URL del CV.',
        detalle: error.message,
      });
    }

    return res.json({
      url: data.signedUrl,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Error al obtener el CV.',
      detalle: error.message,
    });
  }
};

// aprueba una postulacion, crea el usuario y le envia su clave provisoria por correo
const aprobar = async (req, res) => {
  try {
    const { rut } = req.params;

    const postulacion = await Postulacion.findOne({ rut });

    if (!postulacion) {
      return res.status(404).json({
        error: 'Postulación no encontrada.',
      });
    }

    if (postulacion.estado === 'Aprobada') {
      return res.status(400).json({
        error: 'Esta postulación ya fue aprobada.',
      });
    }

    if (postulacion.estado === 'Rechazada') {
      return res.status(400).json({
        error: 'No se puede aprobar una postulación ya rechazada.',
      });
    }

    if (
      postulacion.estado !== 'Pre-Aprobada' &&
      postulacion.estado !== 'Pre-Rechazada'
    ) {
      return res.status(400).json({
        error: 'Solo se pueden aprobar postulaciones en estado Pre-Aprobada o Pre-Rechazada.',
      });
    }

    const usuarioExistente = await Usuario.findOne({
      $or: [
        { rut: postulacion.rut },
        { email: postulacion.email },
      ],
    });

    if (usuarioExistente) {
      return res.status(400).json({
        error: 'Ya existe un usuario registrado con este RUT o correo.',
      });
    }

    const passwordProvisoria = generarPasswordProvisoria();

    const salt = await bcrypt.genSalt(10);
    const passwordHasheada = await bcrypt.hash(passwordProvisoria, salt);

    const nuevoUsuario = new Usuario({
      nombre: postulacion.nombre,
      apellido: postulacion.apellido,
      rut: postulacion.rut,
      fechaNacimiento: postulacion.fechaNacimiento,
      email: postulacion.email,
      telefono: postulacion.telefono,
      profesion: postulacion.profesion,
      residencia: postulacion.residencia,
      areaFormacion: postulacion.areaFormacion,
      rol: 'usuario',
      password: passwordHasheada,
    });

    await nuevoUsuario.save();

    const estadoAnterior = postulacion.estado;

    postulacion.estado = 'Aprobada';
    postulacion.fechaRevisionAdmin = new Date();

    postulacion.comentarioAdmin =
      estadoAnterior === 'Pre-Rechazada'
        ? 'Postulación aprobada manualmente pese a observaciones de la evaluación automática.'
        : 'Postulación aprobada por el administrador.';

    await postulacion.save();

    try {
      await enviarCorreoPostulacionAprobada(postulacion, passwordProvisoria);

      return res.json({
        message: 'Postulación aprobada, usuario creado y correo enviado correctamente.',
      });
    } catch (errorCorreo) {
      console.error(
        'La postulación fue aprobada, pero falló el correo:',
        errorCorreo.message
      );

      return res.json({
        message: 'Postulación aprobada y usuario creado, pero no se pudo enviar el correo.',
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Error al aprobar la postulación.',
      detalle: error.message,
    });
  }
};

// rechaza una postulacion, guarda el comentario del admin y avisa por correo
const rechazar = async (req, res) => {
  try {
    const { rut } = req.params;
    const { comentarioAdmin } = req.body;

    const postulacion = await Postulacion.findOne({ rut });

    if (!postulacion) {
      return res.status(404).json({
        error: 'Postulación no encontrada.',
      });
    }

    if (postulacion.estado === 'Rechazada') {
      return res.status(400).json({
        error: 'Esta postulación ya fue rechazada.',
      });
    }

    if (postulacion.estado === 'Aprobada') {
      return res.status(400).json({
        error: 'No se puede rechazar una postulación ya aprobada.',
      });
    }

    postulacion.estado = 'Rechazada';
    postulacion.comentarioAdmin =
      comentarioAdmin || 'Postulación rechazada por el administrador.';
    postulacion.fechaRevisionAdmin = new Date();

    if (!postulacion.motivoRechazo || postulacion.motivoRechazo.length === 0) {
      postulacion.motivoRechazo = [
        'Postulación rechazada manualmente por el administrador',
      ];
    }

    await postulacion.save();

    try {
      await enviarCorreoPostulacionRechazada(postulacion);

      return res.json({
        message: 'Postulación rechazada y correo enviado correctamente.',
      });
    } catch (errorCorreo) {
      console.error(
        'La postulación fue rechazada, pero falló el correo:',
        errorCorreo.message
      );

      return res.json({
        message: 'Postulación rechazada, pero no se pudo enviar el correo.',
      });
    }
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Error al rechazar la postulación.',
      detalle: error.message,
    });
  }
};

// exporta las funciones para usarlas en las rutas
module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  getCvUrl,
  aprobar,
  rechazar,
};