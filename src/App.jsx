import { useMemo, useState } from 'react';
import { Box, CircularProgress, CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import AdminHome from './components/admin/adminHome.jsx';
import CoordinadorHome from './components/coordinador/coordinadorHome.jsx';
import TecnicoHome from './components/tecnico/tecnicoHome.jsx';
import ServicioEnCurso from './components/tecnico/ServicioEnCurso.jsx';
import { createAppTheme } from './theme/theme.js';
import { DataProvider } from './context/DataContext.jsx';
import { useAppData } from './context/useAppData.js';

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
  const { data, error } = useAppData();

  // Función para manejar el inicio de sesión exitoso.
  const ingresar = (usuario, datosUsuario) => {
    establecerUsuarioActual(usuario);
    establecerNombreUsuarioActual(datosUsuario.nombre);
    navegar(rutaPorRol[datosUsuario.rol] || '/');
  };

  // Función para manejar el cierre de sesión.
  const volverAlLogin = () => {
    establecerUsuarioActual('');
    establecerNombreUsuarioActual('');
    navegar('/');
  };

  if (error) return <Box sx={{ p: 4 }}>{error}</Box>;
  if (!data) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;

  return (
      <Routes>
        <Route path="/" element={<Login alIniciarSesion={ingresar} />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
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