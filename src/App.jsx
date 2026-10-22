import { useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
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
  const navegar = useNavigate();
  const { limpiarDatos, iniciarSesion } = useAppData();

  // Función para manejar el inicio de sesión exitoso.
  const ingresar = (usuario, datosUsuario, respuestaLogin) => {
    iniciarSesion(respuestaLogin);
    establecerUsuarioActual(usuario);
    establecerNombreUsuarioActual(datosUsuario.nombre);
    navegar(rutaPorRol[datosUsuario.rol] || '/');
  };

  // Función para manejar el cierre de sesión.
  const volverAlLogin = () => {
    sessionStorage.removeItem('galacticappToken');
    limpiarDatos();
    establecerUsuarioActual('');
    establecerNombreUsuarioActual('');
    navegar('/');
  };

  return (
      <Routes>
        <Route path="/" element={<Login alIniciarSesion={ingresar} />} />
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