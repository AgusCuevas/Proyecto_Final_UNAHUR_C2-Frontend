import { useState } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import Login from './components/Login.jsx';
import AdminHome from './components/admin/adminHome.jsx';
import CoordinadorHome from './components/coordinador/coordinadorHome.jsx';
import TecnicoHome from './components/tecnico/tecnicoHome.jsx';
import { theme } from './theme/theme.js';

const inicioPorRuta = {
  '/adminHome': AdminHome,
  '/coordinadorHome': CoordinadorHome,
  '/tecnicoHome': TecnicoHome,
};

// Componente principal de la aplicación.
function App() {
  const [Inicio, establecerInicio] = useState(() => inicioPorRuta[window.location.pathname]);
  const [usuarioActual, establecerUsuarioActual] = useState('');

  // Función para manejar el inicio de sesión exitoso.
  const ingresar = (usuario, datosUsuario) => {
    establecerUsuarioActual(usuario);
    establecerInicio(() => inicioPorRuta[datosUsuario.inicio]);
    window.history.pushState({}, '', datosUsuario.inicio);
  };

  // Función para manejar el cierre de sesión.
  const volverAlLogin = () => {
    establecerUsuarioActual('');
    establecerInicio(null);
    window.history.pushState({}, '', '/');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {Inicio && usuarioActual 
      ? <Inicio usuario={usuarioActual} alCerrarSesion={volverAlLogin} /> 
      : <Login alIniciarSesion={ingresar} />}
    </ThemeProvider>
  );
}

export default App;