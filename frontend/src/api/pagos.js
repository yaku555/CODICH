import api from './axios';

export const obtenerMembresiasPorRut = async (rut) => {
  const { data } = await api.get(`/pagos/membresias?rut=${encodeURIComponent(rut)}`);
  return data;
};

export const iniciarPagoMembresia = async ({ rutSocio, planId }) => {
  const { data } = await api.post('/pagos/iniciar', {
    rutSocio,
    planId,
  });

  return data;
};

export const renovarMembresia = async (membresiaId, forzar = false) => {
  const { data } = await api.post(`/pagos/membresias/${membresiaId}/renovar`, {
    forzar,
  });

  return data;
};

export const cancelarMembresia = async (membresiaId) => {
  const { data } = await api.patch(`/pagos/membresias/${membresiaId}/cancelar`);
  return data;
};

export const simularVencimientoMembresia = async (membresiaId) => {
  const { data } = await api.patch(`/pagos/membresias/${membresiaId}/simular-vencimiento`);
  return data;
};

export const simularRenovacionMembresia = async (membresiaId) => {
  const { data } = await api.patch(`/pagos/membresias/${membresiaId}/simular-renovacion`);
  return data;
};