const {
  WebpayPlus,
  Options,
  Environment,
  IntegrationApiKeys,
  IntegrationCommerceCodes,
} = require('transbank-sdk');

const Pago = require('../models/Pago');
const Membresia = require('../models/Membresia');
const Usuario = require('../models/Usuario');

const {
  enviarCorreoPago,
} = require('../utils/correo.service');

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

const ESTADOS_MEMBRESIA_BLOQUEANTES = [
  'PENDIENTE',
  'ACTIVA',
  'POR_PAGAR',
  'MOROSA',
  'SUSPENDIDA',
];
const DIAS_ANTES_RENOVACION = 2;
const PORCENTAJE_MORA = 10;

const subtractDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const calcularMontoRenovacion = (membresia, plan) => {
  const montoBase = plan.monto;

  const recargoMora = membresia.recargoPendiente
    ? Math.round(montoBase * (PORCENTAJE_MORA / 100))
    : 0;

  return {
    montoBase,
    recargoMora,
    porcentajeRecargo: membresia.recargoPendiente ? PORCENTAJE_MORA : 0,
    montoFinal: montoBase + recargoMora,
    esPagoConMora: membresia.recargoPendiente,
  };
};

const calcularFechasRenovacion = (membresia, plan) => {
  const ahora = new Date();

  const fechaTerminoActual = membresia.fechaTermino
    ? new Date(membresia.fechaTermino)
    : ahora;

  const periodoDesde = fechaTerminoActual > ahora ? fechaTerminoActual : ahora;
  const periodoHasta = addMonths(periodoDesde, plan.duracionMeses);
  const fechaProximoPago = subtractDays(periodoHasta, DIAS_ANTES_RENOVACION);

  return {
    periodoDesde,
    periodoHasta,
    fechaProximoPago,
  };
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const limpiarRut = (rut) => {
  return String(rut || '')
    .replace(/[^0-9kK]/g, '')
    .toUpperCase()
    .slice(0, 10);
};

const generarOrdenCompra = (rutSocio) => {
  const cleanRut = limpiarRut(rutSocio) || 'SOCIO';
  const random = Math.floor(Math.random() * 9999);
  return `COD${cleanRut}${Date.now()}${random}`.slice(0, 26);
};

const generarSessionId = (rutSocio) => {
  const cleanRut = limpiarRut(rutSocio) || 'SOCIO';
  return `SES-${cleanRut}-${Date.now()}`.slice(0, 61);
};

const generarCodigoMembresia = (rutSocio) => {
  const cleanRut = limpiarRut(rutSocio) || 'SOCIO';
  return `MEM-${cleanRut}-${Date.now()}`;
};

const tieneMembresiaVigente = async (rutSocio) => {
  return Membresia.findOne({
    rutSocio,
    estado: { $in: ESTADOS_MEMBRESIA_BLOQUEANTES },
  });
};

const calcularDatosRenovacion = (membresia, plan) => {
  const ahora = new Date();

  const base =
    membresia.fechaProximoPago && new Date(membresia.fechaProximoPago) > ahora
      ? new Date(membresia.fechaProximoPago)
      : ahora;

  const periodoDesde = base;
  const periodoHasta = addMonths(base, plan.duracionMeses);

  return {
    periodoDesde,
    periodoHasta,
  };
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

    const membresiaExistente = await tieneMembresiaVigente(rutSocio);

    if (membresiaExistente) {
      return res.status(409).json({
        error: 'El socio ya tiene una membresia vigente. No puede crear otra.',
        membresia: membresiaExistente,
      });
    }

    const ordenCompra = generarOrdenCompra(rutSocio);
    const sessionId = generarSessionId(rutSocio);
    const urlRetorno = 'http://localhost:5173/pago/resultado';

    const response = await tx.create(ordenCompra, sessionId, plan.monto, urlRetorno);

    await Pago.create({
      ordenCompra,
      sessionId,
      monto: plan.monto,
      plan: plan.planNombre,
      planId: plan.planId,
      modalidad: 'contado',
      tipo: 'ALTA',
      rutSocio,
      estado: 'PENDING',
    });

    console.log(`[PAGOS] Alta iniciada | ${plan.planNombre} | Monto: ${plan.monto}`);

    res.json({
      url: response.url,
      token: response.token,
      ordenCompra,
    });
  } catch (error) {
    console.error('[PAGOS ERROR] iniciarPago:', error.message);
    res.status(500).json({
      error: 'Error al iniciar el pago',
      detalle: error.message,
    });
  }
};

const renovarMembresia = async (req, res) => {
  try {
    const { id } = req.params;
    const { forzar = false } = req.body;

    const membresia = await Membresia.findById(id);

    if (!membresia) {
      return res.status(404).json({ error: 'Membresia no encontrada' });
    }

    if (['CANCELADA', 'FINALIZADA'].includes(membresia.estado)) {
      return res.status(400).json({
        error: 'No se puede renovar una membresia cancelada o finalizada.',
      });
    }

    const plan = PLANES[membresia.planId];

    if (!plan) {
      return res.status(400).json({
        error: 'El plan de la membresia no es valido',
      });
    }

    const ahora = new Date();

    const fechaProximoPago = membresia.fechaProximoPago
      ? new Date(membresia.fechaProximoPago)
      : ahora;

    const puedeRenovar =
      fechaProximoPago <= ahora ||
      membresia.estado === 'MOROSA' ||
      membresia.estado === 'POR_PAGAR';

    if (!puedeRenovar && !forzar) {
      return res.status(400).json({
        error: 'La membresia aun no esta en fecha de renovacion',
        fechaProximoPago: membresia.fechaProximoPago,
      });
    }

    const {
      montoBase,
      recargoMora,
      porcentajeRecargo,
      montoFinal,
      esPagoConMora,
    } = calcularMontoRenovacion(membresia, plan);

    const ordenCompra = generarOrdenCompra(membresia.rutSocio);
    const sessionId = generarSessionId(membresia.rutSocio);
    const urlRetorno = 'http://localhost:5173/pago/resultado';

    const response = await tx.create(ordenCompra, sessionId, montoFinal, urlRetorno);

    await Pago.create({
      ordenCompra,
      sessionId,
      monto: montoFinal,
      montoBase,
      recargoMora,
      porcentajeRecargo,
      esPagoConMora,
      plan: plan.planNombre,
      planId: plan.planId,
      modalidad: 'contado',
      tipo: 'RENOVACION',
      rutSocio: membresia.rutSocio,
      membresiaId: membresia._id,
      estado: 'PENDING',
    });

    console.log(
      `[PAGOS] Renovacion iniciada | Membresia: ${membresia._id} | Monto: ${montoFinal}`
    );

    res.json({
      url: response.url,
      token: response.token,
      ordenCompra,
      membresiaId: membresia._id,
      montoBase,
      recargoMora,
      porcentajeRecargo,
      montoFinal,
      esPagoConMora,
    });
  } catch (error) {
    console.error('[PAGOS ERROR] renovarMembresia:', error.message);
    res.status(500).json({
      error: 'Error al iniciar renovacion',
      detalle: error.message,
    });
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

    let pago = await Pago.findOneAndUpdate(
      { ordenCompra: response.buy_order },
      {
        estado: estadoFinal,
        detalle: response,
        fechaConfirmacion: new Date(),
      },
      { new: true }
    );

    if (!pago) {
      return res.status(404).json({
        error: 'No se encontro el pago asociado a la orden de compra',
        ordenCompra: response.buy_order,
      });
    }

    if (estadoFinal === 'AUTHORIZED') {
      const plan = PLANES[pago.planId];

      if (!plan) {
        return res.status(400).json({
          error: 'Plan del pago no valido',
        });
      }

      const ahora = new Date();

      if (pago.tipo === 'ALTA') {
        let membresiaExistente = await tieneMembresiaVigente(pago.rutSocio);

        if (!membresiaExistente) {
          const fechaInicio = ahora;
          const fechaTermino = addMonths(fechaInicio, plan.duracionMeses);

          const membresia = await Membresia.create({
            rutSocio: pago.rutSocio,
            codigoMembresia: generarCodigoMembresia(pago.rutSocio),
            planId: plan.planId,
            planNombre: plan.planNombre,
            modalidad: 'contado',
            duracionMeses: plan.duracionMeses,
            totalCompromiso: plan.totalCompromiso,
            montoCuota: plan.monto,
            cantidadCuotas: 1,
            estado: 'ACTIVA',
            fechaInicio,
            fechaTermino,
            fechaUltimoPago: ahora,
            fechaProximoPago: subtractDays(fechaTermino, DIAS_ANTES_RENOVACION),
            recargoPendiente: false,
            porcentajeRecargo: 0,
            pagos: [pago._id],
          });

          pago = await Pago.findByIdAndUpdate(
            pago._id,
            {
              membresiaId: membresia._id,
              periodoDesde: fechaInicio,
              periodoHasta: fechaTermino,
            },
            { new: true }
          );
        } else {
          const { periodoDesde, periodoHasta } = calcularDatosRenovacion(membresiaExistente, plan);

          membresiaExistente.pagos.push(pago._id);
          membresiaExistente.fechaUltimoPago = ahora;
          membresiaExistente.fechaProximoPago = periodoHasta;
          membresiaExistente.fechaTermino = periodoHasta;
          membresiaExistente.estado = 'ACTIVA';

          await membresiaExistente.save();

          pago = await Pago.findByIdAndUpdate(
            pago._id,
            {
              tipo: 'RENOVACION',
              membresiaId: membresiaExistente._id,
              periodoDesde,
              periodoHasta,
            },
            { new: true }
          );
        }
      }

      if (pago.tipo === 'RENOVACION') {
        const membresia = await Membresia.findById(pago.membresiaId);

        if (!membresia) {
          return res.status(404).json({
            error: 'No se encontro la membresia asociada a la renovacion',
          });
        }

        const { periodoDesde, periodoHasta, fechaProximoPago } =
          calcularFechasRenovacion(membresia, plan);

        if (!membresia.pagos.includes(pago._id)) {
          membresia.pagos.push(pago._id);
        }

        membresia.estado = 'ACTIVA';
        membresia.fechaUltimoPago = ahora;
        membresia.fechaTermino = periodoHasta;
        membresia.fechaProximoPago = fechaProximoPago;

        // Importante: la mora se cobra solo una vez
        membresia.recargoPendiente = false;
        membresia.porcentajeRecargo = 0;

        await membresia.save();

        pago = await Pago.findByIdAndUpdate(
          pago._id,
          {
            periodoDesde,
            periodoHasta,
          },
          { new: true }
        );
      }
    }

    console.log(`[PAGOS] Confirmado | Status: ${estadoFinal} | Orden: ${response.buy_order}`);

    const pagoCompleto = await Pago.findById(pago._id).populate('membresiaId');

    if (estadoFinal === 'AUTHORIZED') {
      try {
        const usuario = await Usuario.findOne({ rut: pagoCompleto.rutSocio });

        await enviarCorreoPago({
          pago: pagoCompleto,
          membresia: pagoCompleto.membresiaId,
          usuario,
          detalle: response,
        });

        console.log(`[CORREO] Comprobante de pago enviado | Orden: ${pagoCompleto.ordenCompra}`);
      } catch (errorCorreo) {
        console.error(
          'El pago fue confirmado, pero falló el correo de comprobante:',
          errorCorreo.message
        );
      }
    }

    res.json({
      exito: estadoFinal === 'AUTHORIZED',
      detalle: response,
      pago: pagoCompleto,
    });
  } catch (error) {
    console.error('[PAGOS ERROR] confirmarPago:', error.message);
    res.status(500).json({
      error: 'Error al confirmar el pago',
      detalle: error.message,
    });
  }
};

const listarPagos = async (req, res) => {
  try {
    const pagos = await Pago.find()
      .populate('membresiaId')
      .sort({ fecha: -1 });

    res.json(pagos);
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener pagos',
      detalle: error.message,
    });
  }
};

const listarMembresias = async (req, res) => {
  try {
    const filtro = req.query.rut ? { rutSocio: req.query.rut } : {};

    const membresias = await Membresia.find(filtro)
      .populate('pagos')
      .sort({ createdAt: -1 });

    const ahora = new Date();

    const membresiasConEstado = membresias.map((m) => {
      const obj = m.toObject();

      const plan = PLANES[obj.planId];

      const fechaProximoPago = obj.fechaProximoPago
        ? new Date(obj.fechaProximoPago)
        : null;

      obj.puedeRenovar =
        obj.estado !== 'CANCELADA' &&
        obj.estado !== 'FINALIZADA' &&
        (
          obj.estado === 'MOROSA' ||
          obj.estado === 'POR_PAGAR' ||
          (fechaProximoPago && fechaProximoPago <= ahora)
        );

      obj.diasParaRenovar = fechaProximoPago
        ? Math.ceil((fechaProximoPago - ahora) / (1000 * 60 * 60 * 24))
        : null;

      if (plan) {
        const {
          montoBase,
          recargoMora,
          porcentajeRecargo,
          montoFinal,
          esPagoConMora,
        } = calcularMontoRenovacion(obj, plan);

        obj.montoBaseRenovacion = montoBase;
        obj.recargoMora = recargoMora;
        obj.porcentajeRecargo = porcentajeRecargo;
        obj.montoRenovacion = montoFinal;
        obj.esPagoConMora = esPagoConMora;
      }

      return obj;
    });

    res.json(membresiasConEstado);
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener membresias',
      detalle: error.message,
    });
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

    membresia.estado = 'CANCELADA';
    membresia.fechaCancelacion = new Date();
    membresia.motivoCancelacion = req.body?.motivo || 'Cancelada por el socio';

    await membresia.save();

    console.log(`[PAGOS] Membresia cancelada | ID: ${id} | Socio: ${membresia.rutSocio}`);

    res.json({
      mensaje: 'Membresia cancelada correctamente',
      membresia,
    });
  } catch (error) {
    console.error('[PAGOS ERROR] cancelarMembresia:', error.message);
    res.status(500).json({
      error: 'Error al cancelar la membresia',
      detalle: error.message,
    });
  }
};

const simularVencimientoMembresia = async (req, res) => {
  try {
    const { id } = req.params;

    const membresia = await Membresia.findById(id);

    if (!membresia) {
      return res.status(404).json({ error: 'Membresia no encontrada' });
    }

    if (membresia.estado === 'CANCELADA') {
      return res.status(400).json({
        error: 'No se puede simular vencimiento de una membresia cancelada',
      });
    }

    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);

    membresia.fechaProximoPago = ayer;
    membresia.fechaTermino = ayer;
    membresia.estado = 'MOROSA';

    // Mora para el próximo pago solamente
    membresia.recargoPendiente = true;
    membresia.porcentajeRecargo = PORCENTAJE_MORA;

    await membresia.save();

    res.json({
      mensaje: 'Membresia marcada como vencida con recargo por mora',
      membresia,
    });
  } catch (error) {
    console.error('[PAGOS ERROR] simularVencimientoMembresia:', error.message);
    res.status(500).json({
      error: 'Error al simular vencimiento',
      detalle: error.message,
    });
  }
};

const simularRenovacionMembresia = async (req, res) => {
  try {
    const { id } = req.params;

    const membresia = await Membresia.findById(id);

    if (!membresia) {
      return res.status(404).json({ error: 'Membresia no encontrada' });
    }

    if (['CANCELADA', 'FINALIZADA'].includes(membresia.estado)) {
      return res.status(400).json({
        error: 'No se puede simular renovacion de una membresia cancelada o finalizada',
      });
    }

    const hoy = new Date();
    const enDosDias = addDays(hoy, DIAS_ANTES_RENOVACION);

    membresia.fechaTermino = enDosDias;
    membresia.fechaProximoPago = hoy;
    membresia.estado = 'POR_PAGAR';

    // Sin mora
    membresia.recargoPendiente = false;
    membresia.porcentajeRecargo = 0;

    await membresia.save();

    res.json({
      mensaje: 'Membresia marcada como por pagar, sin recargo por mora',
      membresia,
    });
  } catch (error) {
    console.error('[PAGOS ERROR] simularRenovacionMembresia:', error.message);
    res.status(500).json({
      error: 'Error al simular renovacion',
      detalle: error.message,
    });
  }
};

module.exports = {
  iniciarPago,
  renovarMembresia,
  confirmarPago,
  listarPagos,
  listarMembresias,
  cancelarMembresia,
  simularVencimientoMembresia,
  simularRenovacionMembresia,
};