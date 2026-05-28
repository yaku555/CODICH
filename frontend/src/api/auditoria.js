import axios from './axios';

// Obtener todos los logs (acepta filtros opcionales)
export const getLogs = async ({ nivel, modulo, usuario } = {}) => {
  try {
    const params = {};
    if (nivel)   params.nivel   = nivel;
    if (modulo)  params.modulo  = modulo;
    if (usuario) params.usuario = usuario;

    const response = await axios.get('/auditoria', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener los logs:', error);
    throw error;
  }
};

// Obtener métricas del día (total, exitosos, advertencias, errores)
export const getResumen = async () => {
  try {
    const response = await axios.get('/auditoria/resumen');
    return response.data;
  } catch (error) {
    console.error('Error al obtener el resumen de auditoría:', error);
    throw error;
  }
};

// Registrar un nuevo log
export const registrarLog = async (log) => {
  try {
    const response = await axios.post('/auditoria', log);
    return response.data;
  } catch (error) {
    console.error('Error al registrar log:', error);
    throw error;
  }
};