import axios from './axios';

export const getEstadisticasAPI = async (filtros = {}) => {
  try {
    const response = await axios.get('/estadisticas', { params: filtros });
    return response.data;
  } catch (error) {
    console.error('Error al conectar con la API de estadísticas:', error);
    throw error;
  }
};