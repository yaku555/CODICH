const Usuario     = require('../models/Usuario');
const Postulacion = require('../models/Postulacion');

const getEstadisticas = async (req, res) => {
  try {
    const { desde, hasta, metrica = 'todos' } = req.query;

    // Rango de fechas
    const filtroFecha = {};
    if (desde) filtroFecha.$gte = new Date(desde);
    if (hasta) {
      const fechaHasta = new Date(hasta);
      fechaHasta.setHours(23, 59, 59, 999);
      filtroFecha.$lte = fechaHasta;
    }
    const tieneFecha = Object.keys(filtroFecha).length > 0;

    const resultado = {
      totalSocios: 0,
      sociosPorProfesion: [],
      membresiasVigentes: 0,
      membresiasVencidas: 0,
      postulacionesPendientes: 0,
      postulacionesAprobadas: 0,
      postulacionesPorEstado: []
    };

    // ── Socios ───────────────────────────────────────────────────────
    if (metrica === 'todos' || metrica === 'socios') {
      const filtroSocios = tieneFecha ? { createdAt: filtroFecha } : {};

      resultado.totalSocios = await Usuario.countDocuments({
        ...filtroSocios,
        rol: { $in: ['usuario', 'socio'] },
      });

      resultado.sociosPorProfesion = await Usuario.aggregate([
        { $match: { rol: { $in: ['usuario', 'socio'] }, ...filtroSocios } },
        { $group: { _id: '$profesion', cantidad: { $sum: 1 } } },
        { $sort: { cantidad: -1 } },
      ]);
    }

    // ── Membresías ───────────────────────────────────────────────────
    if (metrica === 'todos' || metrica === 'membresias') {
      const hoy = new Date();

      resultado.membresiasVigentes = await Usuario.countDocuments({
        rol: { $in: ['usuario', 'socio'] },
        fechaVencimientoMembresia: { $gte: hoy },
      });

      resultado.membresiasVencidas = await Usuario.countDocuments({
        rol: { $in: ['usuario', 'socio'] },
        fechaVencimientoMembresia: { $lt: hoy },
      });
    }

    // ── Postulaciones ─────────────────────────────────────────────────
    if (metrica === 'todos' || metrica === 'postulaciones') {
      const filtroPost = tieneFecha ? { createdAt: filtroFecha } : {};

      resultado.postulacionesPendientes = await Postulacion.countDocuments({
        ...filtroPost,
        estado: 'pendiente',
      });

      resultado.postulacionesAprobadas = await Postulacion.countDocuments({
        ...filtroPost,
        estado: 'aprobada',
      });

      resultado.postulacionesPorEstado = await Postulacion.aggregate([
        { $match: filtroPost },
        { $group: { _id: '$estado', cantidad: { $sum: 1 } } },
        { $sort: { cantidad: -1 } },
      ]);
    }

  
    const totalRegistrosEncontrados = 
      resultado.totalSocios + 
      resultado.membresiasVigentes + 
      resultado.membresiasVencidas + 
      resultado.postulacionesPorEstado.length + 
      resultado.sociosPorProfesion.length;

    resultado.hayRegistros = totalRegistrosEncontrados > 0;

    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Hubo un problema al obtener las estadísticas' });
  }
};

module.exports = { getEstadisticas };