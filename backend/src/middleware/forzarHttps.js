const forzarHttps = (req, res, next) => {
  const debeForzarHttps = process.env.FORZAR_HTTPS === 'true';

  if (!debeForzarHttps) {
    return next();
  }

  const protocoloProxy = req.headers['x-forwarded-proto'];
  const esHttps = req.secure || protocoloProxy === 'https';

  if (!esHttps) {
    return res.status(426).json({
      error: 'Conexión insegura bloqueada.',
      mensaje: 'Por seguridad, el sistema solo permite conexiones mediante HTTPS.',
      redireccion: `https://${req.headers.host}${req.originalUrl}`,
    });
  }

  next();
};

module.exports = forzarHttps;