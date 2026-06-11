import axios from './axios';

const construirParams = ({ nivel, modulo, usuario, fechaDesde, fechaHasta } = {}) => {
  const params = {};

  if (nivel) params.nivel = nivel;
  if (modulo) params.modulo = modulo;
  if (usuario) params.usuario = usuario;
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;

  return params;
};

// Obtener todos los logs con filtros opcionales
export const getLogs = async (filtros = {}) => {
  try {
    const params = construirParams(filtros);

    const response = await axios.get('/auditoria', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener los logs:', error);
    throw error;
  }
};

// Obtener métricas según filtros
export const getResumen = async (filtros = {}) => {
  try {
    const params = construirParams(filtros);

    const response = await axios.get('/auditoria/resumen', { params });
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