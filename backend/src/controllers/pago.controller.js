const { WebpayPlus, Options, Environment, IntegrationApiKeys, IntegrationCommerceCodes } = require('transbank-sdk');
const Pago = require('../models/Pago');

const tx = new WebpayPlus.Transaction(
  new Options(
    IntegrationCommerceCodes.WEBPAY_PLUS,
    IntegrationApiKeys.WEBPAY,
    Environment.Integration
  )
);

const iniciarPago = async (req, res) => {
  try {
    const { monto, rutSocio, plan } = req.body;

    if (!monto || !rutSocio) {
      return res.status(400).json({ error: 'Monto y rutSocio son requeridos' });
    }

    const ordenCompra = `CODICH-${rutSocio}-${Date.now()}`.substring(0, 26);
    const sessionId   = `SES-${rutSocio}-${Date.now()}`.substring(0, 61);
    const urlRetorno  = 'http://localhost:5173/pago/resultado';

    const response = await tx.create(ordenCompra, sessionId, monto, urlRetorno);

    await Pago.create({
      ordenCompra,
      sessionId,
      monto,
      plan: plan || 'Sin especificar',
      rutSocio,
      estado: 'PENDING',
    });

    console.log(`[PAGOS] Iniciada | Plan: ${plan} | Monto: ${monto} | Orden: ${ordenCompra}`);

    res.json({ url: response.url, token: response.token });
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

    await Pago.findOneAndUpdate(
      { ordenCompra: response.buy_order },
      { estado: estadoFinal, detalle: response },
    );

    console.log(`[PAGOS] Confirmado | Status: ${estadoFinal} | Orden: ${response.buy_order}`);

    if (estadoFinal === 'AUTHORIZED') {
      res.json({ exito: true, detalle: response });
    } else {
      res.json({ exito: false, detalle: response });
    }
  } catch (error) {
    console.error('[PAGOS ERROR] confirmarPago:', error.message);
    res.status(500).json({ error: 'Error al confirmar el pago', detalle: error.message });
  }
};

const listarPagos = async (req, res) => {
  try {
    const pagos = await Pago.find().sort({ fecha: -1 });
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pagos', detalle: error.message });
  }
};

module.exports = { iniciarPago, confirmarPago, listarPagos };
