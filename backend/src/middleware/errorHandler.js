// src/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('💥 Error en el servidor:', err);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: err.message,
  });
};

module.exports = errorHandler;
