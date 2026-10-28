import { apiClient } from './apiClient.js';

// Los listados de la API son paginados: { datos, paginacion }.
// - pagina(filtros): pide UNA página con sus filtros (lo que usan las pantallas con tabla).
// - listar(): trae todas las páginas; solo para lo que necesita todos los datos
//   (mapa, panel, Reportes, datos del técnico).
const PAGINA_FRONTEND = 100;

// Saca los filtros vacíos o "Todos" para no mandarlos en la URL.
const filtrosParaUrl = (filtros = {}) => Object.fromEntries(
  Object.entries(filtros).filter(([, valor]) => valor !== '' && valor != null && valor !== 'Todos'),
);
const pedirPagina = async (ruta, filtros) => (await apiClient.get(ruta, { params: filtrosParaUrl(filtros) })).data;

async function listarTodasLasPaginas(ruta, params = {}) {
  const datos = [];
  let paginaActual = 1;
  while (true) {
    const respuesta = (await apiClient.get(ruta, {
      params: { ...params, pagina: paginaActual, limite: PAGINA_FRONTEND },
    })).data;
    if (Array.isArray(respuesta)) return respuesta;
    datos.push(...(respuesta.datos || []));
    if (paginaActual >= (respuesta.paginacion?.paginas || 1)) break;
    paginaActual += 1;
  }
  return datos;
}

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
  listar: async () => (await listarTodasLasPaginas('/usuarios')).map(normalizarUsuario),
  // filtros: { pagina, limite, buscar, rol, estado }
  pagina: async (filtros) => {
    const respuesta = await pedirPagina('/usuarios', filtros);
    return { ...respuesta, datos: respuesta.datos.map(normalizarUsuario) };
  },
  obtener: async (usuarioId) => normalizarUsuario(
    (await apiClient.get(`/usuarios/${usuarioId}`)).data,
  ),
  // Totales para el panel del administrador: { registrados }.
  resumen: async () => (await apiClient.get('/usuarios/resumen')).data,
  buscarPorUsuario: async (usuario) => {
    const encontrado = (await listarTodasLasPaginas('/usuarios', { usuario }))[0];
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

// Admin y coordinador reciben cada técnico con estado, reclamos, vehículo, ubicación,
// recorrido y rendimiento (mapa, pantalla Técnicos y panel).
export const tecnicosApi = {
  listar: async () => (await listarTodasLasPaginas('/tecnicos')).map(normalizarUsuario),
  // filtros: { pagina, limite, buscar, estado, activo }
  pagina: async (filtros) => {
    const respuesta = await pedirPagina('/tecnicos', filtros);
    return { ...respuesta, datos: respuesta.datos.map(normalizarUsuario) };
  },
};

export const clientesApi = {
  listar: async () => listarTodasLasPaginas('/clientes'),
  // filtros: { pagina, limite, buscar, estado }
  pagina: (filtros) => pedirPagina('/clientes', filtros),
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
  listar: async () => listarTodasLasPaginas('/vehiculos'),
  // filtros: { pagina, limite, buscar, asignacion }
  pagina: (filtros) => pedirPagina('/vehiculos', filtros),
  // Lista del diálogo "Asignar técnico": { tecnicos: [{ id, nombre, vehiculo: { id, patente } | null }] }.
  opciones: async () => (await apiClient.get('/vehiculos/opciones')).data,
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
  listar: async () => listarTodasLasPaginas('/jornadas'),
  // filtros: { pagina, limite }. Cada jornada trae sus servicios finalizados.
  pagina: (filtros) => pedirPagina('/jornadas', filtros),
  // Contadores del Resumen de servicios: { totalServicios, serviciosEnPeriodo } desde la fecha indicada.
  resumen: async (desde) => (await apiClient.get('/jornadas/resumen', { params: filtrosParaUrl({ desde }) })).data,
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

// Cada reclamo trae su cliente y su técnico.
export const reclamosApi = {
  listar: async () => listarTodasLasPaginas('/reclamos'),
  // filtros: { pagina, limite, estado, tecnicoId, desde, hasta }. Del más nuevo al más viejo.
  // Para el técnico, la respuesta trae también totalesPorEstado: { 'Asignado': 2, ... }.
  pagina: (filtros) => pedirPagina('/reclamos', filtros),
  // Totales para el panel: { pendientes, serviciosGestionados }.
  resumen: async () => (await apiClient.get('/reclamos/resumen')).data,
  // Listas de los formularios: { clientes: [{ id, nombre, zona }], tecnicos: [{ id, nombre, email }] }.
  opciones: async () => (await apiClient.get('/reclamos/opciones')).data,
  crear: async (reclamo) => (await apiClient.post('/reclamos', reclamo)).data,
  eliminar: async (reclamoId) => (await apiClient.delete(`/reclamos/${reclamoId}`)).data,
  actualizarAsignacion: async (reclamoId, tecnicoId) => (
    await apiClient.patch(`/reclamos/${reclamoId}/asignacion`, { tecnicoId })
  ).data,
  actualizarEstado: async (reclamoId, cambios) => (
    await apiClient.patch(`/reclamos/${reclamoId}/estado`, cambios)
  ).data,
};

// Imágenes: se suben con subir() y los reclamos, jornadas y vehículos guardan solo sus ids
// en un campo "imagenes". Para mostrarlas se piden por id con obtener().
export const imagenesApi = {
  // Recibe data URLs (base64) y devuelve [{ id }].
  subir: async (imagenes) => (await apiClient.post('/imagenes', { imagenes })).data,
  // Devuelve [{ id, url, creadoEn }]: la url se usa directo en un <img>.
  obtener: async (ids) => (await apiClient.get('/imagenes', { params: { ids: ids.join(',') } })).data,
};
