import { useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import AdminHome from './components/admin/adminHome.jsx';
import CoordinadorHome from './components/coordinador/coordinadorHome.jsx';
import TecnicoHome from './components/tecnico/tecnicoHome.jsx';
import { createAppTheme } from './theme/theme.js';

const rutaPorRol = {
  Administrador: '/adminHome',
  Coordinador: '/coordinadorHome',
  Tecnico: '/tecnicoHome',
};

// Componente principal de la aplicación.
function App() {
  const [usuarioActual, establecerUsuarioActual] = useState('');
  const [modo, establecerModo] = useState(() => localStorage.getItem('modoTema') || 'light');
  const navegar = useNavigate();
  const theme = useMemo(() => createAppTheme(modo), [modo]);

  const cambiarModo = () => {
    establecerModo((actual) => {
      const nuevoModo = actual === 'light' ? 'dark' : 'light';
      localStorage.setItem('modoTema', nuevoModo);
      return nuevoModo;
    });
  };

  // Función para manejar el inicio de sesión exitoso.
  const ingresar = (usuario, datosUsuario) => {
    establecerUsuarioActual(usuario);
    navegar(rutaPorRol[datosUsuario.rol] || '/');
  };

  // Función para manejar el cierre de sesión.
  const volverAlLogin = () => {
    establecerUsuarioActual('');
    navegar('/');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Login alIniciarSesion={ingresar} />} />
        <Route
          path="/adminHome"
          element={usuarioActual 
            ? <AdminHome usuario={usuarioActual} alCerrarSesion={volverAlLogin} alCambiarTema={cambiarModo} modo={modo} /> 
            : <Navigate to="/" replace />}
        />
        <Route
          path="/coordinadorHome"
          element={usuarioActual 
            ? <CoordinadorHome usuario={usuarioActual} alCerrarSesion={volverAlLogin} alCambiarTema={cambiarModo} modo={modo} /> 
            : <Navigate to="/" replace />}
        />
        <Route
          path="/tecnicoHome"
          element={usuarioActual 
            ? <TecnicoHome usuario={usuarioActual} alCerrarSesion={volverAlLogin} alCambiarTema={cambiarModo} modo={modo} /> 
            : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;