import axios from './axios';

const obtenerRolUsuario = () => {
  const usuarioGuardado = localStorage.getItem('usuario');

  if (!usuarioGuardado) {
    return '';
  }

  try {
    const usuario = JSON.parse(usuarioGuardado);
    return usuario?.rol || '';
  } catch {
    return '';
  }
};

const crearConfigAdmin = (filtros = {}) => ({
  params: filtros,
  headers: {
    'x-user-role': obtenerRolUsuario(),
  },
});

export const getEstadisticasAPI = async (filtros = {}) => {
  try {
    const response = await axios.get('/estadisticas', crearConfigAdmin(filtros));
    return response.data;
  } catch (error) {
    console.error('Error al conectar con la API de estadísticas:', error);
    throw error;
  }
};

export const exportarEstadisticasPDFAPI = async (filtros = {}) => {
  try {
    const response = await axios.get('/estadisticas/pdf', {
      ...crearConfigAdmin(filtros),
      responseType: 'blob',
    });

    return response.data;
  } catch (error) {
    console.error('Error al exportar estadísticas en PDF:', error);
    throw error;
  }
};

// Alias para mantener compatibilidad con el componente
export const getEstadisticas = getEstadisticasAPI;