const Auditoria = require('../models/Auditoria');

const registrarLog = async (req, res) => {
  try {
    const { nivel, modulo, usuario, descripcion, ip } = req.body;

    const nuevoLog = new Auditoria({
      nivel,
      modulo,
      usuario,
      descripcion,
      ip,
    });

    const logGuardado = await nuevoLog.save();
    res.status(201).json(logGuardado);
  } catch (error) {
    console.error('Error al registrar log de auditoría:', error);
    res.status(500).json({ error: 'Hubo un problema al registrar el log' });
  }
};

const getLogs = async (req, res) => {
  try {
    const { nivel, modulo, usuario } = req.query;

    const filtros = {};
    if (nivel)   filtros.nivel   = nivel;
    if (modulo)  filtros.modulo  = modulo;
    if (usuario) filtros.usuario = { $regex: usuario, $options: 'i' };

    const logs = await Auditoria.find(filtros)
      .sort({ fecha: -1 })
      .lean();

    res.status(200).json(logs);
  } catch (error) {
    console.error('Error al obtener los logs:', error);
    res.status(500).json({ error: 'Hubo un problema al obtener los logs' });
  }
};

const getResumen = async (req, res) => {
  try {
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const [total, exitosos, advertencias, errores] = await Promise.all([
      Auditoria.countDocuments({ fecha: { $gte: inicioDia } }),
      Auditoria.countDocuments({ fecha: { $gte: inicioDia }, nivel: 'INFO' }),
      Auditoria.countDocuments({ fecha: { $gte: inicioDia }, nivel: 'WARN' }),
      Auditoria.countDocuments({ fecha: { $gte: inicioDia }, nivel: 'ERROR' }),
    ]);

    res.status(200).json({ total, exitosos, advertencias, errores });
  } catch (error) {
    console.error('Error al obtener resumen de auditoría:', error);
    res.status(500).json({ error: 'Hubo un problema al obtener el resumen' });
  }
};

const limpiarLogs = async (req, res) => {
  try {
    const { dias = 30 } = req.query;

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - Number(dias));

    const resultado = await Auditoria.deleteMany({ fecha: { $lt: fechaLimite } });

    res.status(200).json({
      message: `Se eliminaron ${resultado.deletedCount} logs anteriores a ${dias} días`,
    });
  } catch (error) {
    console.error('Error al limpiar logs:', error);
    res.status(500).json({ error: 'Hubo un problema al limpiar los logs' });
  }
};

module.exports = {
  registrarLog,
  getLogs,
  getResumen,
  limpiarLogs,
};