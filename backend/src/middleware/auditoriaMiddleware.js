const { crearLog } = require('../controllers/auditoria.controller');

const auditoriaMiddleware = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      
      // 1. DETERMINAR EL NIVEL AUTOMÁTICAMENTE SEGÚN EL STATUS HTTP
      let nivel = 'INFO'; 
      
      if (res.statusCode >= 400 && res.statusCode < 500) {
        nivel = 'WARN';  // Advertencias de negocio (RUT duplicado, mal logueo)
      } else if (res.statusCode >= 500) {
        nivel = 'ERROR'; // Errores críticos reales del servidor (Rojo)
      }

      // Si por alguna razón el objeto de respuesta trae explícitamente un error, forzamos ERROR
      if (data && (data.error || data.message?.toLowerCase().includes('error')) && res.statusCode >= 500) {
        nivel = 'ERROR';
      }

      // 2. Calibrar Módulo según los ENUMS permitidos
      let moduloDetectado = 'Admin';
      const url = req.originalUrl.toLowerCase();
      if (url.includes('auth') || url.includes('login') || url.includes('usuario')) moduloDetectado = 'Auth';
      if (url.includes('postulacion')) moduloDetectado = 'Postulaciones';
      if (url.includes('pago')) moduloDetectado = 'Pagos';
      if (url.includes('socio')) moduloDetectado = 'Socios';
      if (url.includes('soporte')) moduloDetectado = 'Soporte';

      // 3. Capturar el Operador
      let usuarioOperador = 'Sistema Admin';
      if (req.body && req.body.email) {
        usuarioOperador = req.body.email;
      } else if (req.body && req.body.rut) {
        usuarioOperador = `RUT: ${req.body.rut}`;
      }

      // 4. Descripción dinámica basándose en el resultado
      const estatusTexto = nivel === 'INFO' ? 'EXITOSA' : (nivel === 'WARN' ? 'RECHAZADA' : 'FALLIDA (CRÍTICA)');
      const descripcion = `Operación ${estatusTexto} [${req.method}] en el endpoint: ${req.originalUrl}`;

      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

      // Guardar en la base de datos
      crearLog({
        nivel,
        modulo: moduloDetectado,
        usuario: usuarioOperador,
        descripcion,
        ip
      }).catch(err => console.error("⚠️ Error en auditoría automática:", err.message));
    }

    return originalJson.call(this, data);
  };

  next();
};

module.exports = auditoriaMiddleware;