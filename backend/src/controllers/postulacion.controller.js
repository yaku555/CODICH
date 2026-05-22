const Postulacion = require('../models/Postulacion');
const createCrudController = require('./baseCrud.controller');
const fs = require('fs').promises;
const path = require('path');


// Función para extraer datos válidos
const getPostulacionData = (body) => {
  return {
    nombre: body.nombre,
    rut: body.rut,
    email: body.email,
    documentoPath: body.documentoPath
  };
};

// Generar CRUD base
const baseController = createCrudController(Postulacion, getPostulacionData, 'rut', 'rut');
// Personalizar CREATE para manejar archivo
const create = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Falta adjuntar el documento obligatorio" });
    }
    
    const data = getPostulacionData(req.body);
    data.documentoPath = req.file.path;
    
    const doc = new Postulacion(data);
    const saved = await doc.save();
    return res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

// Personalizar REMOVE para borrar archivo también
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
        // No es crítico si falla el borrado del archivo
      }
    }

    return res.json({ message: 'Registro eliminado' });
  } catch (error) {
    next(error);
  }
};

module.exports = { ...baseController, create, remove };