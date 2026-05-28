const crypto = require('crypto');
const Postulacion = require('../models/Postulacion');
const supabase = require('../config/supabase');

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

const create = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      rut,
      email,
      telefono,
      profesion,
      experiencia,
    } = req.body;

    if (
      !nombre ||
      !apellido ||
      !rut ||
      !email ||
      !telefono ||
      !profesion ||
      !experiencia
    ) {
      return res.status(400).json({
        error: 'Debes completar todos los campos.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'El documento CV es obligatorio.',
      });
    }

    const postulacionExistente = await Postulacion.findOne({ rut });

    if (postulacionExistente) {
      return res.status(400).json({
        error: 'Ya existe una postulación con ese RUT.',
      });
    }

    const documentoPath = await subirCVSupabase(req.file, rut);

    const nuevaPostulacion = new Postulacion({
      nombre,
      apellido,
      rut,
      email,
      telefono,
      profesion,
      experiencia,
      documentoPath,
      estado: 'Pendiente',
    });

    const postulacionGuardada = await nuevaPostulacion.save();

    return res.status(201).json(postulacionGuardada);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Error al crear la postulación.',
      detalle: error.message,
    });
  }
};

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

const update = async (req, res) => {
  try {
    const { rut } = req.params;

    const datosActualizados = {
      nombre: req.body.nombre,
      apellido: req.body.apellido,
      rut: req.body.rut,
      email: req.body.email,
      telefono: req.body.telefono,
      profesion: req.body.profesion,
      experiencia: req.body.experiencia,
      estado: req.body.estado,
    };

    Object.keys(datosActualizados).forEach((key) => {
      if (datosActualizados[key] === undefined) {
        delete datosActualizados[key];
      }
    });

    if (req.file) {
      datosActualizados.documentoPath = await subirCVSupabase(req.file, rut);
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

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  getCvUrl,
};