import { apiClient } from './apiClient.js';

const camposPerfilPorRol = {
  1: ['departamento', 'nivelAcceso'],
  2: ['zonaAsignada', 'maxTecnicosACargo'],
  3: ['documento', 'fechaNacimiento', 'vencimientoRegistro', 'telefono', 'email', 'direccion'],
};
const rolIdPorNombre = {
  Administrador: 1,
  Coordinador: 2,
  Tecnico: 3,
};
const todosLosCamposPerfil = Object.values(camposPerfilPorRol).flat();

const normalizarPayloadUsuario = (usuario) => {
  const rolId = usuario.rolId ?? rolIdPorNombre[usuario.rol];
  const camposPerfil = camposPerfilPorRol[rolId] || [];
  const perfil = Object.fromEntries(
    camposPerfil
      .filter((campo) => Object.hasOwn(usuario.perfil || {}, campo))
      .map((campo) => [campo, usuario.perfil[campo]]),
  );
  const datos = { ...usuario, perfil };

  todosLosCamposPerfil.forEach((campo) => delete datos[campo]);
  delete datos.createdAt;
  delete datos.updatedAt;
  delete datos.__v;
  delete datos._id;

  return datos;
};

const normalizarUsuario = (usuario) => {
  const camposPerfil = camposPerfilPorRol[usuario.rolId] || [];
  const perfil = Object.fromEntries(
    camposPerfil
      .filter((campo) => Object.hasOwn(usuario.perfil || {}, campo))
      .map((campo) => [campo, usuario.perfil[campo]]),
  );

  return {
    ...usuario,
    perfil,
    ...perfil,
  };
};

export const authApi = {
  iniciarSesion: async (credenciales) => (await apiClient.post('/auth/login', credenciales)).data,
};

export const usuariosApi = {
  listar: async () => (await apiClient.get('/usuarios')).data.map(normalizarUsuario),
  obtener: async (usuarioId) => normalizarUsuario(
    (await apiClient.get(`/usuarios/${usuarioId}`)).data,
  ),
  buscarPorUsuario: async (usuario) => {
    const encontrado = (await apiClient.get('/usuarios', { params: { usuario } })).data[0];
    return encontrado ? normalizarUsuario(encontrado) : undefined;
  },
  crear: async (usuario) => {
    const creado = (await apiClient.post('/usuarios', normalizarPayloadUsuario(usuario))).data;
    return usuariosApi.obtener(creado.id);
  },
  actualizar: async (usuarioId, cambios) => {
    await apiClient.patch(`/usuarios/${usuarioId}`, normalizarPayloadUsuario(cambios));
    return usuariosApi.obtener(usuarioId);
  },
  eliminar: async (usuarioId) => (await apiClient.delete(`/usuarios/${usuarioId}`)).data,
};

export const clientesApi = {
  listar: async () => (await apiClient.get('/clientes')).data,
  obtener: async (clienteId) => (await apiClient.get(`/clientes/${clienteId}`)).data,
  crear: async (cliente) => {
    const creado = (await apiClient.post('/clientes', cliente)).data;
    return clientesApi.obtener(creado.id);
  },
  actualizar: async (clienteId, cambios) => {
    await apiClient.patch(`/clientes/${clienteId}`, cambios);
    return clientesApi.obtener(clienteId);
  },
  eliminar: async (clienteId) => (await apiClient.delete(`/clientes/${clienteId}`)).data,
};

export const vehiculosApi = {
  listar: async () => (await apiClient.get('/vehiculos')).data,
  crear: async (vehiculo) => (await apiClient.post('/vehiculos', vehiculo)).data,
  actualizar: async (vehiculoId, cambios) => (
    await apiClient.patch(`/vehiculos/${vehiculoId}`, cambios)
  ).data,
  eliminar: async (vehiculoId) => (await apiClient.delete(`/vehiculos/${vehiculoId}`)).data,
  actualizarAsignacion: async (vehiculoId, tecnicoId) => (
    await apiClient.patch(`/vehiculos/${vehiculoId}/asignacion`, { tecnicoId })
  ).data,
  actualizarKilometraje: async (vehiculoId, kilometraje) => (
    await apiClient.patch(`/vehiculos/${vehiculoId}/kilometraje`, { kilometraje })
  ).data,
  registrarControl: async (vehiculoId, control) => (
    await apiClient.patch(`/vehiculos/${vehiculoId}/control`, control)
  ).data,
};

export const jornadasApi = {
  listar: async () => (await apiClient.get('/jornadas')).data,
  crear: async (jornada) => (await apiClient.post('/jornadas', jornada)).data,
  finalizar: async (jornadaId, controlFinal) => (
    await apiClient.patch(`/jornadas/${jornadaId}/finalizar`, controlFinal)
  ).data,
  eliminar: async (jornadaId) => (await apiClient.delete(`/jornadas/${jornadaId}`)).data,
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
  eliminar: async (reclamoId) => (await apiClient.delete(`/reclamos/${reclamoId}`)).data,
  actualizarAsignacion: async (reclamoId, tecnicoId) => (
    await apiClient.patch(`/reclamos/${reclamoId}/asignacion`, { tecnicoId })
  ).data,
  actualizarEstado: async (reclamoId, cambios) => (
    await apiClient.patch(`/reclamos/${reclamoId}/estado`, cambios)
  ).data,
  // Devuelve [{ id, url }]: la url se usa directo en un <img>, sea base64 o una dirección.
  evidencias: async (reclamoId) => (await apiClient.get(`/reclamos/${reclamoId}/evidencias`)).data,
};
