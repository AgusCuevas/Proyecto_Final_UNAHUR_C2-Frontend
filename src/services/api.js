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
  actualizarKilometraje: async (vehiculoId, kilometraje) => (
    await apiClient.patch(`/vehiculos/${vehiculoId}/kilometraje`, { kilometraje })
  ).data,
  registrarControl: async (vehiculoId, control) => (
    await apiClient.patch(`/vehiculos/${vehiculoId}/control`, control)
  ).data,
};

export const jornadasApi = {
  crear: async (jornada) => (await apiClient.post('/jornadas', jornada)).data,
  finalizar: async (jornadaId, controlFinal) => (
    await apiClient.patch(`/jornadas/${jornadaId}/finalizar`, controlFinal)
  ).data,
};

export const ubicacionesApi = {
  listar: async () => (await apiClient.get('/ubicaciones-tecnicos')).data,
  actualizar: async (tecnicoId, ubicacion) => (
    await apiClient.patch(`/ubicaciones-tecnicos/${tecnicoId}`, ubicacion)
  ).data,
};

export const reclamosApi = {
  listar: async () => (await apiClient.get('/reclamos')).data,
  crear: async (reclamo) => (await apiClient.post('/reclamos', reclamo)).data,
  actualizarAsignacion: async (reclamoId, tecnicoId) => (
    await apiClient.patch(`/reclamos/${reclamoId}/asignacion`, { tecnicoId })
  ).data,
  actualizarEstado: async (reclamoId, cambios) => (
    await apiClient.patch(`/reclamos/${reclamoId}/estado`, cambios)
  ).data,
};
