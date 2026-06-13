const { crearLog } = require('../controllers/auditoria.controller');

const auditoriaMiddleware = (req, res, next) => {
  const url = req.originalUrl.toLowerCase();

  // Evita que la auditoría registre sus propias peticiones
  if (url.startsWith('/api/auditoria')) {
    return next();
  }

  const originalJson = res.json;

  res.json = function (data) {
    // Enviar la respuesta inmediatamente
    const responseResult = originalJson.call(this, data);

    // Registrar en auditoría de forma asincrónica sin bloquear la respuesta
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      setImmediate(() => {
        try {
          let nivel = 'INFO';

          if (res.statusCode >= 400 && res.statusCode < 500) {
            nivel = 'WARN';
          } else if (res.statusCode >= 500) {
            nivel = 'ERROR';
          }

          if (
            data &&
            (data.error || data.message?.toLowerCase().includes('error')) &&
            res.statusCode >= 500
          ) {
            nivel = 'ERROR';
          }

          let moduloDetectado = 'Admin';

          if (url.includes('auth') || url.includes('login') || url.includes('usuario')) {
            moduloDetectado = 'Auth';
          }
          if (url.includes('postulacion')) {
            moduloDetectado = 'Postulaciones';
          }
          if (url.includes('pago')) {
            moduloDetectado = 'Pagos';
          }
          if (url.includes('socio')) {
            moduloDetectado = 'Socios';
          }
          if (url.includes('soporte')) {
            moduloDetectado = 'Soporte';
          }

          let usuarioOperador = 'Sistema Admin';

          if (req.body && req.body.email) {
            usuarioOperador = req.body.email;
          } else if (req.body && req.body.rut) {
            usuarioOperador = `RUT: ${req.body.rut}`;
          }

          const estatusTexto =
            nivel === 'INFO'
              ? 'EXITOSA'
              : nivel === 'WARN'
                ? 'RECHAZADA'
                : 'FALLIDA (CRÍTICA)';

          const descripcion = `Operación ${estatusTexto} [${req.method}] en el endpoint: ${req.originalUrl}`;

          const ip =
            req.headers['x-forwarded-for'] ||
            req.socket.remoteAddress ||
            '127.0.0.1';

          crearLog({
            nivel,
            modulo: moduloDetectado,
            usuario: usuarioOperador,
            descripcion,
            ip,
          }).catch((err) => {
            console.error('⚠️ Error en auditoría automática:', err.message);
          });
        } catch (err) {
          console.error('⚠️ Error al procesar auditoría:', err.message);
        }
      });
    }

    return responseResult;
  };

  next();
};

module.exports = auditoriaMiddleware;