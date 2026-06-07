const {
  WebpayPlus,
  Options,
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} = require('transbank-sdk');
const Pago = require('../models/Pago');
const Membresia = require('../models/Membresia');
const Cuota = require('../models/Cuota');

const tx = new WebpayPlus.Transaction(
  new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  )
);

const PLANES = {
  mensual: {
    planId: 'mensual',
    planNombre: 'Membresia Mensual',
    duracionMeses: 1,
    modalidades: {
      contado: { totalCompromiso: 15000, montoCuota: 15000, cantidadCuotas: 1 },
    },
  },
  trimestral: {
    planId: 'trimestral',
    planNombre: 'Membresia Trimestral',
    duracionMeses: 3,
    modalidades: {
      contado: { totalCompromiso: 40000, montoCuota: 40000, cantidadCuotas: 1 },
      cuotas: { totalCompromiso: 42000, montoCuota: 14000, cantidadCuotas: 3 },
    },
  },
  anual: {
    planId: 'anual',
    planNombre: 'Membresia Anual',
    duracionMeses: 12,
    modalidades: {
      contado: { totalCompromiso: 120000, montoCuota: 120000, cantidadCuotas: 1 },
      cuotas: { totalCompromiso: 144000, montoCuota: 12000, cantidadCuotas: 12 },
    },
  },
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const getPlanConfig = (planId, modalidad) => {
  const plan = PLANES[planId];
  if (!plan || !plan.modalidades[modalidad]) return null;

  return {
    ...plan,
    modalidad,
    ...plan.modalidades[modalidad],
  };
};

const buildPoliticaCancelacion = (config) => {
  if (config.planId === 'mensual') {
    return 'Sin permanencia. Puede cancelar antes del proximo vencimiento.';
  }

  if (config.modalidad === 'contado') {
    return 'Pago anticipado del periodo completo. No contempla devolucion parcial despues de iniciado el periodo.';
  }

  return 'Compromiso del periodo completo financiado en cuotas. Si cancela antes del termino, se regularizan los meses usados al valor mensual estandar de $15.000.';
};

const crearMembresiaConCuotas = async ({ rutSocio, config }) => {
  const ahora = new Date();
  const membresia = await Membresia.create({
    rutSocio,
    planId: config.planId,
    planNombre: config.planNombre,
    modalidad: config.modalidad,
    duracionMeses: config.duracionMeses,
    totalCompromiso: config.totalCompromiso,
    montoCuota: config.montoCuota,
    cantidadCuotas: config.cantidadCuotas,
    estado: 'PENDIENTE',
    fechaInicio: ahora,
    fechaTermino: addMonths(ahora, config.duracionMeses),
    politicaCancelacion: buildPoliticaCancelacion(config),
  });

  const cuotas = [];
  for (let i = 0; i < config.cantidadCuotas; i += 1) {
    cuotas.push({
      membresiaId: membresia._id,
      rutSocio,
      numero: i + 1,
      totalCuotas: config.cantidadCuotas,
      monto: config.montoCuota,
      fechaVencimiento: addMonths(ahora, i),
      estado: 'PENDIENTE',
    });
  }

  const cuotasCreadas = await Cuota.insertMany(cuotas);
  return { membresia, cuotaInicial: cuotasCreadas[0] };
};

const iniciarPago = async (req, res) => {
  try {
    const { rutSocio, planId = 'mensual', modalidad = 'contado', cuotaId } = req.body;

    if (!rutSocio) {
      return res.status(400).json({ error: 'rutSocio es requerido' });
    }

    let membresia;
    let cuota;
    let plan;
    let monto;

    if (cuotaId) {
      cuota = await Cuota.findById(cuotaId).populate('membresiaId');
      if (!cuota) return res.status(404).json({ error: 'Cuota no encontrada' });
      if (cuota.estado === 'PAGADA') return res.status(400).json({ error: 'La cuota ya esta pagada' });

      membresia = cuota.membresiaId;
      plan = membresia.planNombre;
      monto = cuota.monto;
    } else {
      const config = getPlanConfig(planId, modalidad);
      if (!config) {
        return res.status(400).json({ error: 'Plan o modalidad no valida' });
      }

      const creada = await crearMembresiaConCuotas({ rutSocio, config });
      membresia = creada.membresia;
      cuota = creada.cuotaInicial;
      plan = config.planNombre;
      monto = config.montoCuota;
    }

    const cleanRut = rutSocio.replace(/[^0-9kK]/g, '').slice(0, 10) || 'SOCIO';
    const ordenCompra = `CODICH-${cleanRut}-${Date.now()}`.substring(0, 26);
    const sessionId = `SES-${cleanRut}-${Date.now()}`.substring(0, 61);
    const urlRetorno = 'http://localhost:5173/pago/resultado';

    const response = await tx.create(ordenCompra, sessionId, monto, urlRetorno);

    const pago = await Pago.create({
      ordenCompra,
      sessionId,
      monto,
      plan,
      planId: membresia.planId,
      modalidad: membresia.modalidad,
      rutSocio,
      membresiaId: membresia._id,
      cuotaId: cuota._id,
      numeroCuota: cuota.numero,
      totalCuotas: cuota.totalCuotas,
      estado: 'PENDING',
    });

    await Cuota.findByIdAndUpdate(cuota._id, {
      pagoId: pago._id,
      ordenCompra,
    });

    console.log(`[PAGOS] Iniciada | ${plan} ${membresia.modalidad} | Cuota ${cuota.numero}/${cuota.totalCuotas} | Monto: ${monto}`);

    res.json({
      url: response.url,
      token: response.token,
      ordenCompra,
      membresiaId: membresia._id,
      cuotaId: cuota._id,
    });
  } catch (error) {
    console.error('[PAGOS ERROR] iniciarPago:', error.message);
    res.status(500).json({ error: 'Error al iniciar el pago', detalle: error.message });
  }
};

const confirmarPago = async (req, res) => {
  try {
    const { token_ws } = req.body;

    if (!token_ws) {
      return res.status(400).json({ error: 'token_ws es requerido' });
    }

    const response = await tx.commit(token_ws);
    const estadoFinal = response.status === 'AUTHORIZED' ? 'AUTHORIZED' : 'FAILED';

    const pago = await Pago.findOneAndUpdate(
      { ordenCompra: response.buy_order },
      { estado: estadoFinal, detalle: response, fechaConfirmacion: new Date() },
      { new: true }
    );

    if (pago && estadoFinal === 'AUTHORIZED') {
      await Cuota.findByIdAndUpdate(pago.cuotaId, {
        estado: 'PAGADA',
        fechaPago: new Date(),
        pagoId: pago._id,
        ordenCompra: pago.ordenCompra,
      });

      await Membresia.findByIdAndUpdate(pago.membresiaId, {
        estado: 'ACTIVA',
      });
    }

    console.log(`[PAGOS] Confirmado | Status: ${estadoFinal} | Orden: ${response.buy_order}`);

    res.json({
      exito: estadoFinal === 'AUTHORIZED',
      detalle: response,
      pago,
    });
  } catch (error) {
    console.error('[PAGOS ERROR] confirmarPago:', error.message);
    res.status(500).json({ error: 'Error al confirmar el pago', detalle: error.message });
  }
};

const listarPagos = async (req, res) => {
  try {
    const pagos = await Pago.find()
      .populate('membresiaId')
      .populate('cuotaId')
      .sort({ fecha: -1 });
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pagos', detalle: error.message });
  }
};

const listarMembresias = async (req, res) => {
  try {
    const filtro = req.query.rut ? { rutSocio: req.query.rut } : {};
    const membresias = await Membresia.find(filtro).sort({ createdAt: -1 });
    res.json(membresias);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener membresias', detalle: error.message });
  }
};

const listarCuotas = async (req, res) => {
  try {
    const filtro = {};
    if (req.query.rut) filtro.rutSocio = req.query.rut;
    if (req.query.membresiaId) filtro.membresiaId = req.query.membresiaId;
    if (req.query.estado) filtro.estado = req.query.estado;

    const cuotas = await Cuota.find(filtro)
      .populate('membresiaId')
      .sort({ fechaVencimiento: 1 });

    res.json(cuotas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cuotas', detalle: error.message });
  }
};

const actualizarMorosidad = async (req, res) => {
  try {
    const hoy = new Date();
    const cuotasPendientes = await Cuota.find({ estado: 'PENDIENTE' }).populate('membresiaId');
    const cuotasVencidas = [];
    const membresiasMorosas = new Set();

    for (const cuota of cuotasPendientes) {
      const membresia = cuota.membresiaId;
      if (!membresia) continue;

      const fechaMorosidad = new Date(cuota.fechaVencimiento);
      fechaMorosidad.setDate(fechaMorosidad.getDate() + (membresia.diasGracia || 5));

      if (fechaMorosidad < hoy) {
        cuota.estado = 'VENCIDA';
        await cuota.save();
        cuotasVencidas.push(cuota);
        membresiasMorosas.add(String(membresia._id));
      }
    }

    await Membresia.updateMany(
      { _id: { $in: Array.from(membresiasMorosas) } },
      { estado: 'MOROSA' }
    );

    res.json({
      mensaje: 'Revision de morosidad ejecutada',
      cuotasVencidas: cuotasVencidas.length,
      membresiasMorosas: membresiasMorosas.size,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar morosidad', detalle: error.message });
  }
};

module.exports = {
  iniciarPago,
  confirmarPago,
  listarPagos,
  listarMembresias,
  listarCuotas,
  actualizarMorosidad,
};
