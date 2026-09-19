import { apiClient } from './apiClient.js';

export const usuariosApi = {
  listar: async () => (await apiClient.get('/usuarios')).data,
  buscarPorUsuario: async (usuario) => (await apiClient.get('/usuarios', { params: { usuario } })).data[0],
};

export const clientesApi = {
  listar: async () => (await apiClient.get('/clientes')).data,
};

export const vehiculosApi = {
  listar: async () => (await apiClient.get('/vehiculos')).data,
};

export const ubicacionesApi = {
  listar: async () => (await apiClient.get('/ubicaciones-tecnicos')).data,
};

export const reclamosApi = {
  listar: async () => (await apiClient.get('/reclamos')).data,
  crear: async (reclamo) => (await apiClient.post('/reclamos', reclamo)).data,
  actualizarAsignacion: async (reclamoId, tecnicoId) => (
    await apiClient.patch(`/reclamos/${reclamoId}/asignacion`, { tecnicoId })
  ).data,
};
