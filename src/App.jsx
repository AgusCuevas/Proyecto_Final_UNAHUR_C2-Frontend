import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { authApi } from './services/api.js';
import {
  actualizarToken,
  AVISO_VENCIDA,
  cerrarSesionEnTodas,
  descartarSesionVencida,
  EVENTO_SESION_CERRADA,
  EVENTO_SESION_COMPARTIDA,
  guardarUsuario,
  olvidarToken,
  sesionGuardada,
  sesionVencida,
  tokenGuardado,
} from './services/apiClient.js';
import Login from './components/Login.jsx';
import AdminHome from './components/admin/adminHome.jsx';
import CoordinadorHome from './components/coordinador/coordinadorHome.jsx';
import TecnicoHome from './components/tecnico/tecnicoHome.jsx';
import ServicioEnCurso from './components/tecnico/ServicioEnCurso.jsx';
import { createAppTheme } from './theme/theme.js';
import { DataProvider } from './context/DataContext.jsx';
import { useAppData } from './context/useAppData.js';
import BadRequest400 from './components/errors/BadRequest400.jsx';
import Forbidden403 from './components/errors/Forbidden403.jsx';
import NotFound404 from './components/errors/NotFound404.jsx';
import ServerError500 from './components/errors/ServerError500.jsx';
import ServiceUnavailable503 from './components/errors/ServiceUnavailable503.jsx';

const rutaPorRol = {
  Administrador: '/adminHome',
  Coordinador: '/coordinadorHome',
  Tecnico: '/tecnicoHome',
};

// Componente principal de la aplicación.
function AppContent({ modo, cambiarModo }) {
  // Admin y coordinador con una sesión guardada ven su panel enseguida, y la sesión se valida por
  // detrás (si ya no vale, se vuelve al login). El técnico espera la validación: sus pantallas
  // dependen de la jornada activa, que pudo cambiar desde otro dispositivo.
  const [sesionInicial] = useState(() => {
    const guardada = sesionGuardada();
    return guardada && rutaPorRol[guardada.rol] && guardada.rol !== 'Tecnico' ? guardada : null;
  });
  const [usuarioActual, establecerUsuarioActual] = useState(sesionInicial?.usuario || '');
  const [nombreUsuarioActual, establecerNombreUsuarioActual] = useState(sesionInicial?.nombre || '');
  const [rolActual, establecerRolActual] = useState(sesionInicial?.rol || '');
  // Con un token guardado (y vigente) se muestra la carga mientras se valida, salvo con la sesión inicial.
  const [recuperandoSesion, establecerRecuperandoSesion] = useState(() => !sesionInicial && Boolean(tokenGuardado()) && !sesionVencida());
  // Si el token guardado ya venció, se va directo al login con el aviso, sin preguntarle al backend.
  const [avisoLogin, establecerAvisoLogin] = useState(() => (sesionVencida() ? AVISO_VENCIDA : ''));
  const navegar = useNavigate();
  const { limpiarDatos, iniciarSesion } = useAppData();

  // Función para manejar el inicio de sesión exitoso.
  const ingresar = (usuario, datosUsuario, respuestaLogin) => {
    iniciarSesion(respuestaLogin);
    guardarUsuario({ usuario, nombre: datosUsuario.nombre, rol: datosUsuario.rol });
    establecerUsuarioActual(usuario);
    establecerNombreUsuarioActual(datosUsuario.nombre);
    establecerRolActual(datosUsuario.rol);
    establecerAvisoLogin('');
    navegar(rutaPorRol[datosUsuario.rol] || '/');
  };

  // Salir: cierra la sesión en el backend (deja de servir en todos lados) y en todas las pestañas.
  // La vuelta al login la hace el efecto que escucha EVENTO_SESION_CERRADA.
  const volverAlLogin = async () => {
    try {
      await authApi.cerrarSesion();
    } catch {
      // Aunque el backend no responda, la sesión se cierra en el navegador.
    }
    cerrarSesionEnTodas();
  };

  // Recupera la sesión con el token guardado (GET /auth/sesion devuelve los datos y un token
  // renovado). Se usa al abrir la página (también con F5 u otra pestaña) y cuando otra pestaña ingresa.
  // enSegundoPlano: el panel ya se está viendo; no se muestra la carga y, si el backend no
  // responde, la sesión sigue (los pedidos del panel lo van a reintentar).
  const recuperarSesion = useCallback(async ({ enSegundoPlano = false } = {}) => {
    if (!enSegundoPlano) establecerRecuperandoSesion(true);
    try {
      const respuesta = await authApi.sesion();
      actualizarToken(respuesta.token);
      guardarUsuario(respuesta.usuario);
      iniciarSesion(respuesta);
      establecerUsuarioActual(respuesta.usuario.usuario);
      establecerNombreUsuarioActual(respuesta.usuario.nombre);
      establecerRolActual(respuesta.usuario.rol);
      establecerAvisoLogin('');
      if (window.location.pathname === '/') navegar(rutaPorRol[respuesta.usuario.rol] || '/');
    } catch (error) {
      // Con 401 el interceptor ya cerró la sesión en todas las pestañas y avisó el motivo.
      if (error.response?.status !== 401 && !enSegundoPlano) olvidarToken();
    } finally {
      establecerRecuperandoSesion(false);
    }
  }, [iniciarSesion, navegar]);

  // Al abrir la página: si hay un token guardado, se valida la sesión; si no, se muestra el login.
  const inicioHecho = useRef(false);
  useEffect(() => {
    if (inicioHecho.current || !tokenGuardado()) return;
    inicioHecho.current = true;
    if (sesionVencida()) {
      descartarSesionVencida();
      return;
    }
    (async () => {
      await recuperarSesion({ enSegundoPlano: Boolean(sesionInicial) });
    })();
  }, [recuperarSesion, sesionInicial]);

  // Sesión compartida entre pestañas:
  // - Si otra pestaña ingresa, esta entra con la misma sesión.
  // - Si se cierra la sesión (Salir en cualquier pestaña, vencimiento o ingreso desde otro
  //   lugar), esta pestaña vuelve al login mostrando el motivo.
  useEffect(() => {
    const alCompartir = () => {
      limpiarDatos();
      recuperarSesion();
    };
    const alCerrar = (evento) => {
      limpiarDatos();
      establecerUsuarioActual('');
      establecerNombreUsuarioActual('');
      establecerRolActual('');
      establecerAvisoLogin(evento.detail?.aviso || '');
      navegar('/');
    };
    window.addEventListener(EVENTO_SESION_COMPARTIDA, alCompartir);
    window.addEventListener(EVENTO_SESION_CERRADA, alCerrar);
    return () => {
      window.removeEventListener(EVENTO_SESION_COMPARTIDA, alCompartir);
      window.removeEventListener(EVENTO_SESION_CERRADA, alCerrar);
    };
  }, [limpiarDatos, navegar, recuperarSesion]);

  const cargandoSesion = (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress aria-label="Recuperando la sesión" />
    </Box>
  );
  if (recuperandoSesion) return cargandoSesion;

  // Cada panel es de un solo rol. Sin sesión se vuelve al login; con sesión de otro rol, al panel
  // propio (un técnico que escribe /adminHome termina en /tecnicoHome).
  const panel = (rol, Pantalla) => {
    if (!usuarioActual) return <Navigate to="/" replace />;
    if (rolActual !== rol) return <Navigate to={rutaPorRol[rolActual] || '/'} replace />;
    return <Pantalla usuario={usuarioActual} nombre={nombreUsuarioActual} alCerrarSesion={volverAlLogin} alCambiarTema={cambiarModo} modo={modo} />;
  };

  return (
      <Routes>
        {/* Con la sesión iniciada, "/" lleva al panel. Mientras el cambio de pantalla se completa
            se sigue viendo la carga (si no, al abrir otra pestaña aparecía el login un instante). */}
        <Route
          path="/"
          element={usuarioActual && rutaPorRol[rolActual]
            ? <><Navigate to={rutaPorRol[rolActual]} replace />{cargandoSesion}</>
            : <Login alIniciarSesion={ingresar} aviso={avisoLogin} />}
        />
        <Route path="/error/400" element={<BadRequest400 />} />
        <Route path="/error/403" element={<Forbidden403 />} />
        <Route path="/error/404" element={<NotFound404 />} />
        <Route path="/error/500" element={<ServerError500 />} />
        <Route path="/error/503" element={<ServiceUnavailable503 />} />
        <Route path="/adminHome" element={panel('Administrador', AdminHome)} />
        <Route path="/coordinadorHome" element={panel('Coordinador', CoordinadorHome)} />
        <Route path="/tecnicoHome" element={panel('Tecnico', TecnicoHome)} />
        <Route path="/tecnicoHome/servicio-en-curso" element={panel('Tecnico', ServicioEnCurso)} />
        <Route path="*" element={<NotFound404 />} />
      </Routes>
  );
}

function App() {
  const [modo, establecerModo] = useState(() => localStorage.getItem('modoTema') || 'light');
  const theme = useMemo(() => createAppTheme(modo), [modo]);
  const cambiarModo = () => {
    establecerModo((actual) => {
      const nuevoModo = actual === 'light' ? 'dark' : 'light';
      localStorage.setItem('modoTema', nuevoModo);
      return nuevoModo;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DataProvider>
        <AppContent modo={modo} cambiarModo={cambiarModo} />
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;