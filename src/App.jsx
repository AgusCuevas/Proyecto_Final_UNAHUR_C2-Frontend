import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { authApi } from './services/api.js';
import {
  actualizarToken,
  cerrarSesionEnTodas,
  EVENTO_SESION_CERRADA,
  EVENTO_SESION_COMPARTIDA,
  olvidarToken,
  pedirSesionAOtrasPestanas,
  tokenGuardado,
  usarToken,
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
  const [usuarioActual, establecerUsuarioActual] = useState('');
  const [nombreUsuarioActual, establecerNombreUsuarioActual] = useState('');
  // Al abrir la página primero se busca una sesión abierta (en esta pestaña o en otra).
  const [recuperandoSesion, establecerRecuperandoSesion] = useState(true);
  const [avisoLogin, establecerAvisoLogin] = useState('');
  const navegar = useNavigate();
  const { limpiarDatos, iniciarSesion } = useAppData();

  // Función para manejar el inicio de sesión exitoso.
  const ingresar = (usuario, datosUsuario, respuestaLogin) => {
    iniciarSesion(respuestaLogin);
    establecerUsuarioActual(usuario);
    establecerNombreUsuarioActual(datosUsuario.nombre);
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
  // renovado). Se usa al recargar (F5), al abrir una pestaña nueva y cuando otra pestaña ingresa.
  const recuperarSesion = useCallback(async () => {
    establecerRecuperandoSesion(true);
    try {
      const respuesta = await authApi.sesion();
      actualizarToken(respuesta.token);
      iniciarSesion(respuesta);
      establecerUsuarioActual(respuesta.usuario.usuario);
      establecerNombreUsuarioActual(respuesta.usuario.nombre);
      establecerAvisoLogin('');
      if (window.location.pathname === '/') navegar(rutaPorRol[respuesta.usuario.rol] || '/');
    } catch (error) {
      // Con 401 el interceptor ya cerró la sesión en todas las pestañas y avisó el motivo.
      if (error.response?.status !== 401) olvidarToken();
    } finally {
      establecerRecuperandoSesion(false);
    }
  }, [iniciarSesion, navegar]);

  // Al abrir la página: usa el token de esta pestaña (F5) o se lo pide a otra pestaña abierta.
  const inicioHecho = useRef(false);
  useEffect(() => {
    if (inicioHecho.current) return;
    inicioHecho.current = true;
    (async () => {
      if (!tokenGuardado()) {
        const token = await pedirSesionAOtrasPestanas();
        if (!token) {
          establecerRecuperandoSesion(false);
          return;
        }
        usarToken(token);
      }
      await recuperarSesion();
    })();
  }, [recuperarSesion]);

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

  if (recuperandoSesion) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Recuperando la sesión" />
      </Box>
    );
  }

  return (
      <Routes>
        <Route path="/" element={<Login alIniciarSesion={ingresar} aviso={avisoLogin} />} />
        <Route path="/error/400" element={<BadRequest400 />} />
        <Route path="/error/403" element={<Forbidden403 />} />
        <Route path="/error/404" element={<NotFound404 />} />
        <Route path="/error/500" element={<ServerError500 />} />
        <Route path="/error/503" element={<ServiceUnavailable503 />} />
        <Route
          path="/adminHome"
          element={usuarioActual 
            ? <AdminHome usuario={usuarioActual} nombre={nombreUsuarioActual} alCerrarSesion={volverAlLogin} alCambiarTema={cambiarModo} modo={modo} /> 
            : <Navigate to="/" replace />}
        />
        <Route
          path="/coordinadorHome"
          element={usuarioActual 
            ? <CoordinadorHome usuario={usuarioActual} nombre={nombreUsuarioActual} alCerrarSesion={volverAlLogin} alCambiarTema={cambiarModo} modo={modo} /> 
            : <Navigate to="/" replace />}
        />
        <Route
          path="/tecnicoHome"
          element={usuarioActual 
            ? <TecnicoHome usuario={usuarioActual} nombre={nombreUsuarioActual} alCerrarSesion={volverAlLogin} alCambiarTema={cambiarModo} modo={modo} /> 
            : <Navigate to="/" replace />}
        />
        <Route
          path="/tecnicoHome/servicio-en-curso"
          element={usuarioActual
            ? <ServicioEnCurso usuario={usuarioActual} nombre={nombreUsuarioActual} alCerrarSesion={volverAlLogin} alCambiarTema={cambiarModo} modo={modo} />
            : <Navigate to="/" replace />}
        />
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