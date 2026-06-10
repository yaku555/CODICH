const { crearLog } = require('../controllers/auditoria.controller');

const auditoriaMiddleware = async (req, res, next) => {
  const url = req.originalUrl.toLowerCase();

  // Evita que la auditoría registre sus propias peticiones
  // Así no aparece el log basura:
  // "Operación EXITOSA [POST] en el endpoint: /api/auditoria"
  if (url.startsWith('/api/auditoria')) {
    return next();
  }

  const originalJson = res.json;

  res.json = function (data) {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      // 1. Determinar nivel automáticamente según status HTTP
      let nivel = 'INFO';

      if (res.statusCode >= 400 && res.statusCode < 500) {
        nivel = 'WARN';
      } else if (res.statusCode >= 500) {
        nivel = 'ERROR';
      }

      // Si la respuesta trae error y es 500, forzamos ERROR
      if (
        data &&
        (data.error || data.message?.toLowerCase().includes('error')) &&
        res.statusCode >= 500
      ) {
        nivel = 'ERROR';
      }

      // 2. Detectar módulo según URL
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

      // 3. Capturar operador
      let usuarioOperador = 'Sistema Admin';

      if (req.body && req.body.email) {
        usuarioOperador = req.body.email;
      } else if (req.body && req.body.rut) {
        usuarioOperador = `RUT: ${req.body.rut}`;
      }

      // 4. Crear descripción
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
      }).catch((err) =>
        console.error('⚠️ Error en auditoría automática:', err.message)
      );
    }

    return originalJson.call(this, data);
  };

  next();
};

module.exports = auditoriaMiddleware;