const {
  WebpayPlus,
  Options,
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} = require('transbank-sdk');
const Pago = require('../models/Pago');
const Membresia = require('../models/Membresia');

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
    totalCompromiso: 15000,
    monto: 15000,
  },
  trimestral: {
    planId: 'trimestral',
    planNombre: 'Membresia Trimestral',
    duracionMeses: 3,
    totalCompromiso: 40000,
    monto: 40000,
  },
  anual: {
    planId: 'anual',
    planNombre: 'Membresia Anual',
    duracionMeses: 12,
    totalCompromiso: 120000,
    monto: 120000,
  },
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const iniciarPago = async (req, res) => {
  try {
    const { rutSocio, planId = 'mensual' } = req.body;

    if (!rutSocio) {
      return res.status(400).json({ error: 'rutSocio es requerido' });
    }

    const plan = PLANES[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Plan no valido' });
    }

    const ahora = new Date();
    const membresia = await Membresia.create({
      rutSocio,
      planId: plan.planId,
      planNombre: plan.planNombre,
      modalidad: 'contado',
      duracionMeses: plan.duracionMeses,
      totalCompromiso: plan.totalCompromiso,
      montoCuota: plan.monto,
      cantidadCuotas: 1,
      estado: 'PENDIENTE',
      fechaInicio: ahora,
      fechaTermino: addMonths(ahora, plan.duracionMeses),
      politicaCancelacion: 'Pago unico al contado. No contempla devolucion parcial.',
    });

    const cleanRut = rutSocio.replace(/[^0-9kK]/g, '').slice(0, 10) || 'SOCIO';
    const ordenCompra = `CODICH-${cleanRut}-${Date.now()}`.substring(0, 26);
    const sessionId = `SES-${cleanRut}-${Date.now()}`.substring(0, 61);
    const urlRetorno = 'http://localhost:5173/pago/resultado';

    const response = await tx.create(ordenCompra, sessionId, plan.monto, urlRetorno);

    await Pago.create({
      ordenCompra,
      sessionId,
      monto: plan.monto,
      plan: plan.planNombre,
      planId: plan.planId,
      modalidad: 'contado',
      rutSocio,
      membresiaId: membresia._id,
      estado: 'PENDING',
    });

    console.log(`[PAGOS] Iniciada | ${plan.planNombre} | Monto: ${plan.monto}`);

    res.json({
      url: response.url,
      token: response.token,
      ordenCompra,
      membresiaId: membresia._id,
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
      await Membresia.findByIdAndUpdate(pago.membresiaId, { estado: 'ACTIVA' });
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

const cancelarMembresia = async (req, res) => {
  try {
    const { id } = req.params;
    const membresia = await Membresia.findById(id);

    if (!membresia) {
      return res.status(404).json({ error: 'Membresia no encontrada' });
    }
    if (membresia.estado === 'CANCELADA') {
      return res.status(400).json({ error: 'La membresia ya esta cancelada' });
    }

    await Membresia.findByIdAndUpdate(id, { estado: 'CANCELADA' });
    console.log(`[PAGOS] Membresia cancelada | ID: ${id} | Socio: ${membresia.rutSocio}`);

    res.json({ mensaje: 'Membresia cancelada correctamente' });
  } catch (error) {
    console.error('[PAGOS ERROR] cancelarMembresia:', error.message);
    res.status(500).json({ error: 'Error al cancelar la membresia', detalle: error.message });
  }
};

module.exports = {
  iniciarPago,
  confirmarPago,
  listarPagos,
  listarMembresias,
  cancelarMembresia,
};
