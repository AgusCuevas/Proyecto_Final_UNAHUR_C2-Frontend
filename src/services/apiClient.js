import axios from 'axios';

const URL_API = import.meta.env.VITE_API_URL || '/api';

// ---------- Sesión compartida entre pestañas
// El token se guarda en localStorage: todas las pestañas del navegador lo ven al instante y
// sigue ahí aunque se cierre el navegador (vence solo, a la hora sin uso). Junto al token se
// guardan el usuario, el nombre y el rol: con eso, administrador y coordinador arman su panel al
// recargar o abrir otra pestaña sin preguntarle al backend (el técnico sí pregunta: ver App.jsx).
// Las demás pestañas se enteran de los cambios con el evento "storage" del navegador:
// - otra pestaña ingresó (o ingresó otro usuario): esta entra con esa sesión;
// - otra pestaña salió o la sesión se cerró: esta vuelve al login con el motivo.
const CLAVE_TOKEN = 'galacticappToken';
const CLAVE_USUARIO = 'galacticappUsuario';
// Motivo del último cierre, para mostrarlo en el login de todas las pestañas.
const CLAVE_AVISO = 'galacticappAvisoCierre';
// Eventos que escucha App.jsx.
export const EVENTO_SESION_CERRADA = 'galacticapp:sesion-cerrada'; // detail: { aviso }
export const EVENTO_SESION_COMPARTIDA = 'galacticapp:sesion-compartida'; // otra pestaña ingresó
export const AVISO_VENCIDA = 'Tu sesión venció. Ingresá de nuevo.';

const avisarEnEstaPestana = (evento, detalle) => window.dispatchEvent(new CustomEvent(evento, { detail: detalle }));

// Contenido del token (vencimiento "exp" y sesión "sid"), sin validarlo: lo valida el backend.
function contenidoDe(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}
// Momento en que vence el token (milisegundos).
const vencimientoDe = (token) => (contenidoDe(token).exp || 0) * 1000;

export const tokenGuardado = () => localStorage.getItem(CLAVE_TOKEN);

// Datos del usuario guardados con la sesión ({ usuario, nombre, rol }), o null si no hay sesión
// o el token ya venció.
export function sesionGuardada() {
  const token = tokenGuardado();
  if (!token || vencimientoDe(token) <= Date.now()) return null;
  try {
    return JSON.parse(localStorage.getItem(CLAVE_USUARIO)) || null;
  } catch {
    return null;
  }
}

// true si hay un token guardado que ya venció (no hace falta preguntarle al backend).
export function sesionVencida() {
  const token = tokenGuardado();
  return Boolean(token) && vencimientoDe(token) <= Date.now();
}

// Login en esta pestaña: guarda el usuario y el token (las demás pestañas entran con la misma
// sesión). El usuario va primero: las otras pestañas se enteran por el token y leen el usuario.
export function guardarSesion(token, usuario) {
  localStorage.removeItem(CLAVE_AVISO);
  guardarUsuario(usuario);
  localStorage.setItem(CLAVE_TOKEN, token);
}

// Guarda el usuario, el nombre y el rol de la sesión (después del login o de validarla).
export function guardarUsuario({ usuario, nombre, rol }) {
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify({ usuario, nombre, rol }));
}

// Token renovado (misma sesión). Las demás pestañas lo leen en su próximo pedido.
export const actualizarToken = (token) => localStorage.setItem(CLAVE_TOKEN, token);

// Borra la sesión guardada (por ejemplo, si no se pudo recuperar).
export function olvidarToken() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

// Borra una sesión vencida, avisando el motivo a las demás pestañas (esta lo muestra por su cuenta).
export function descartarSesionVencida() {
  localStorage.setItem(CLAVE_AVISO, AVISO_VENCIDA);
  olvidarToken();
}

// Cierra la sesión en esta pestaña y en todas las demás. aviso: mensaje para el login (opcional).
export function cerrarSesionEnTodas(aviso = '') {
  // El motivo se guarda antes de borrar el token: las otras pestañas lo leen al enterarse.
  localStorage.setItem(CLAVE_AVISO, aviso);
  olvidarToken();
  avisarEnEstaPestana(EVENTO_SESION_CERRADA, { aviso });
}

// Cambios hechos por otra pestaña (el navegador no avisa a la pestaña que hizo el cambio).
window.addEventListener('storage', ({ key, oldValue, newValue }) => {
  if (key !== CLAVE_TOKEN && key !== null) return;
  if (!newValue) {
    avisarEnEstaPestana(EVENTO_SESION_CERRADA, { aviso: localStorage.getItem(CLAVE_AVISO) || '' });
    return;
  }
  // Un token de otra sesión (otra pestaña ingresó, quizás con otro usuario). Si es la misma
  // sesión, es una renovación y no hay que hacer nada.
  if (!oldValue || contenidoDe(oldValue).sid !== contenidoDe(newValue).sid) {
    avisarEnEstaPestana(EVENTO_SESION_COMPARTIDA, {});
  }
});

// ---------- Cliente HTTP
export const apiClient = axios.create({
  baseURL: URL_API,
  headers: { 'Content-Type': 'application/json' },
});

// Si al token le quedan menos de 15 minutos, se renueva con el próximo pedido.
// Así la sesión no se corta mientras el usuario trabaja, y vence tras 1 hora sin actividad.
const RENOVAR_ANTES_DE_MS = 15 * 60 * 1000;

// Si hay varios pedidos a la vez, se renueva una sola vez.
let renovacionEnCurso = null;
function renovarSiHaceFalta(token) {
  if (vencimientoDe(token) - Date.now() > RENOVAR_ANTES_DE_MS) return token;
  if (!renovacionEnCurso) {
    // Se usa axios directo (no apiClient) para no volver a pasar por este interceptor.
    renovacionEnCurso = axios.get(`${URL_API}/auth/sesion`, { headers: { Authorization: `Bearer ${token}` } })
      .then((respuesta) => {
        actualizarToken(respuesta.data.token);
        return respuesta.data.token;
      })
      .catch(() => token)
      .finally(() => { renovacionEnCurso = null; });
  }
  return renovacionEnCurso;
}

apiClient.interceptors.request.use(async (config) => {
  let token = tokenGuardado();
  if (token && !config.url?.startsWith('/auth/')) token = await renovarSiHaceFalta(token);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Si el backend responde 401 con una sesión abierta, el token venció o la sesión se cerró
// (por ejemplo, porque se ingresó con el mismo usuario desde otro lugar): se cierra en todas
// las pestañas y se vuelve al login con el motivo.
apiClient.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const url = error.config?.url || '';
    const esLoginOLogout = url.startsWith('/auth/login') || url.startsWith('/auth/logout');
    if (error.response?.status === 401 && !esLoginOLogout && tokenGuardado()) {
      const datos = error.response.data || {};
      cerrarSesionEnTodas(datos.codigo === 'SESION_REEMPLAZADA' ? datos.mensaje : AVISO_VENCIDA);
    }
    return Promise.reject(error);
  },
);
