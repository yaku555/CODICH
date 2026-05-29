import axios from './axios';

// Obtener estadísticas generales filtradas por rango de fechas y tipo de métrica
export const getEstadisticas = async ({ desde, hasta, metrica } = {}) => {
  try {
    const params = {};
    if (desde)   params.desde   = desde;
    if (hasta)   params.hasta   = hasta;
    if (metrica) params.metrica = metrica;

    const response = await axios.get('/estadisticas', { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadisticas:', error);
    throw error;
  }
};