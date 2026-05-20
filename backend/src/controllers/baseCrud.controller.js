// Model  = modelo de Mongoose (Usuario, Vehiculo, etc.)
// getData = función que extrae los campos válidos del body (getUsuarioData, getVehiculoData)
// idParam  = nombre del parámetro en la URL (por ejemplo: 'rut' o 'poliza')
// idField  = nombre del campo en la base de datos (por ejemplo: 'rut' o 'poliza')
const createCrudController = (Model, getDataFn, idParam, idField) => {
  // GET / (todos)
  const getAll = async (req, res, next) => {
    try {
      const docs = await Model.find();
      return res.json(docs);
    } catch (error) {
      next(error);
    }
  };

  // POST / (crear)
  const create = async (req, res, next) => {
    try {
      const data = getDataFn(req.body);
      const doc = new Model(data);
      const saved = await doc.save();
      return res.status(201).json(saved);
    } catch (error) {
      next(error);
    }
  };

  // GET /:idParam (obtener uno)
  const getById = async (req, res, next) => {
    try {
      const value = req.params[idParam];

      const doc = await Model.findOne({ [idField]: value });

      if (!doc) return res.status(404).json({ message: 'Registro no encontrado' });

      return res.json(doc);
    } catch (error) {
      next(error);
    }
  };

  // PUT /:idParam (actualizar)
  const update = async (req, res, next) => {
    try {
      const value = req.params[idParam];
      const data = getDataFn(req.body);

      const doc = await Model.findOneAndUpdate({ [idField]: value }, data, {
        new: true,
      });

      if (!doc) return res.status(404).json({ message: 'Registro no encontrado' });

      return res.json(doc);
    } catch (error) {
      next(error);
    }
  };

  // DELETE /:idParam (borrar)
  const remove = async (req, res, next) => {
    try {
      const value = req.params[idParam];

      const doc = await Model.findOneAndDelete({ [idField]: value });

      if (!doc) return res.status(404).json({ message: 'Registro no encontrado' });

      return res.json({ message: 'Registro eliminado' });
    } catch (error) {
      next(error);
    }
  };

  return { getAll, create, getById, update, remove };
};

module.exports = createCrudController;
