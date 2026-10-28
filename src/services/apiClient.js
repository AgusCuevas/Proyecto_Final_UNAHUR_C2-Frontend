import axios from 'axios';

const URL_API = import.meta.env.VITE_API_URL || '/api';

// ---------- Sesión compartida entre pestañas
// Cada pestaña guarda el token en sessionStorage, y las pestañas del mismo navegador se hablan
// por un BroadcastChannel para compartir una única sesión:
// - Una pestaña nueva le pide el token a las que ya están abiertas.
// - Si una pestaña ingresa, renueva el token o cierra la sesión, avisa a las demás.
// Al cerrar la última pestaña no queda ningún token guardado y hay que volver a ingresar.
const CLAVE_TOKEN = 'galacticappToken';
// Eventos que escucha App.jsx.
export const EVENTO_SESION_CERRADA = 'galacticapp:sesion-cerrada'; // detail: { aviso }
export const EVENTO_SESION_COMPARTIDA = 'galacticapp:sesion-compartida'; // otra pestaña ingresó
const AVISO_VENCIDA = 'Tu sesión venció. Ingresá de nuevo.';

const canal = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('galacticapp-sesion');
const avisarEnEstaPestana = (evento, detalle) => window.dispatchEvent(new CustomEvent(evento, { detail: detalle }));

export const tokenGuardado = () => sessionStorage.getItem(CLAVE_TOKEN);

// Login en esta pestaña: guarda el token y las demás pestañas entran con la misma sesión.
export function guardarSesion(token) {
  sessionStorage.setItem(CLAVE_TOKEN, token);
  canal?.postMessage({ tipo: 'ingreso', token });
}

// Token renovado (misma sesión): se comparte para que todas usen el más nuevo.
export function actualizarToken(token) {
  sessionStorage.setItem(CLAVE_TOKEN, token);
  canal?.postMessage({ tipo: 'renovado', token });
}

// Toma el token que recibió de otra pestaña, sin volver a avisar.
export const usarToken = (token) => sessionStorage.setItem(CLAVE_TOKEN, token);
// Borra el token solo de esta pestaña (por ejemplo, si no se pudo recuperar la sesión).
export const olvidarToken = () => sessionStorage.removeItem(CLAVE_TOKEN);

// Cierra la sesión en esta pestaña y en todas las demás. aviso: mensaje para el login (opcional).
export function cerrarSesionEnTodas(aviso = '') {
  sessionStorage.removeItem(CLAVE_TOKEN);
  canal?.postMessage({ tipo: 'cierre', aviso });
  avisarEnEstaPestana(EVENTO_SESION_CERRADA, { aviso });
}

// Pestaña nueva: pregunta si otra pestaña tiene la sesión abierta. Devuelve el token o null.
export function pedirSesionAOtrasPestanas(espera = 250) {
  if (!canal) return Promise.resolve(null);
  return new Promise((resolver) => {
    const terminar = (token) => {
      canal.removeEventListener('message', escuchar);
      clearTimeout(limite);
      resolver(token);
    };
    const escuchar = ({ data }) => {
      if (data?.tipo === 'respuesta' && data.token) terminar(data.token);
    };
    const limite = setTimeout(() => terminar(null), espera);
    canal.addEventListener('message', escuchar);
    canal.postMessage({ tipo: 'pedido' });
  });
}

canal?.addEventListener('message', ({ data }) => {
  const token = tokenGuardado();
  if (data?.tipo === 'pedido' && token) canal.postMessage({ tipo: 'respuesta', token });
  if (data?.tipo === 'renovado' && token) sessionStorage.setItem(CLAVE_TOKEN, data.token);
  if (data?.tipo === 'ingreso') {
    sessionStorage.setItem(CLAVE_TOKEN, data.token);
    avisarEnEstaPestana(EVENTO_SESION_COMPARTIDA, {});
  }
  if (data?.tipo === 'cierre') {
    sessionStorage.removeItem(CLAVE_TOKEN);
    avisarEnEstaPestana(EVENTO_SESION_CERRADA, { aviso: data.aviso || '' });
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

// Momento en que vence el token (milisegundos), leído de su contenido.
function vencimientoDe(token) {
  try {
    const contenido = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(contenido)).exp * 1000;
  } catch {
    return 0;
  }
}

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
