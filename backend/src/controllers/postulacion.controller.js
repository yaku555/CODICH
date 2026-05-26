const Postulacion = require('../models/Postulacion');
const createCrudController = require('./baseCrud.controller');
const fs = require('fs').promises;
const path = require('path');

// FUNCIÓN ACTUALIZADA: Ahora mapea todos los campos del Paso 1 test
const getPostulacionData = (body) => {
  return {
    nombreCompleto: body.nombreCompleto,
    rut: body.rut,
    email: body.email,
    telefono: body.telefono,
    profesion: body.profesion,
    experiencia: body.experiencia,
    documentoPath: body.documentoPath,
    estado: body.estado || 'Pendiente' // Por defecto, el estado es "Pendiente"
  };
};

// Generar CRUD base
const baseController = createCrudController(Postulacion, getPostulacionData, 'rut', 'rut');

// Personalizar CREATE
// NOTA: Si en el "Paso 1" NO se sube el archivo aún, quita la validación "if (!req.file)" 
// de esta función para que no te rechace la petición en el primer formulario.
// En tu controllers/postulacion.controller.js
// Personalizar CREATE para manejar archivo y evitar RUTs duplicados
const create = async (req, res, next) => {
  try {
    const data = getPostulacionData(req.body);
    
    // 1. Buscamos manualmente si el RUT ya existe antes de intentar guardar
    const existePostulacion = await Postulacion.findOne({ rut: data.rut });
    
    if (existePostulacion) {
      // Si ya existe, cortamos la ejecución y enviamos una respuesta clara
      return res.status(400).json({ 
        message: `El RUT ${data.rut} ya se encuentra registrado en el sistema.` 
      });
    }

    // Si viene un archivo, agregamos la ruta
    if (req.file) {
      data.documentoPath = req.file.path;
    }
    
    // 2. Si no existe, procedemos con la creación normal
    const doc = new Postulacion(data);
    const saved = await doc.save();
    return res.status(201).json(saved);

  } catch (error) {
    // 3. Atrapamos el error por si acaso (por ejemplo, si dos peticiones entran al mismo milisegundo)
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "El RUT ingresado ya está registrado." 
      });
    }
    next(error);
  }
};

// Personalizar REMOVE para borrar archivo también (Se mantiene igual)
const remove = async (req, res, next) => {
  try {
    const value = req.params.rut;

    const doc = await Postulacion.findOneAndDelete({ rut: value });

    if (!doc) return res.status(404).json({ message: 'Registro no encontrado' });

    // Borrar archivo si existe
    if (doc.documentoPath) {
      try {
        await fs.unlink(path.resolve(doc.documentoPath));
      } catch (err) {
        console.error('Error al borrar archivo:', err);
      }
    }

    return res.json({ message: 'Registro eliminado' });
  } catch (error) {
    next(error);
  }
};

module.exports = { ...baseController, create, remove };