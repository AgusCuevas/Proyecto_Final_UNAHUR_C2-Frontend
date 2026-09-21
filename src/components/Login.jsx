import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import PasswordIcon from '@mui/icons-material/Password';
import { appTheme } from '../theme/theme.js';
import { useAppData } from '../context/useAppData.js';

function Login({ alIniciarSesion }) {
  const { data } = useAppData();
  // Estado para gestionar las credenciales del usuario y los errores de inicio de sesión.
  const [credenciales, setCredenciales] = useState({ usuario: '', contrasena: '' });
  const [mensajeError, setMensajeError] = useState('');

  // Envia el formulario de inicio de sesión.
  const enviarFormulario = (event) => {
    event.preventDefault();
    const usuario = credenciales.usuario.toLowerCase();
    const usuarioEncontrado = data.usuarios.find(
      (usuarioRegistrado) => usuarioRegistrado.usuario === usuario && usuarioRegistrado.activo,
    );

    if (!usuarioEncontrado || usuarioEncontrado.contrasena !== credenciales.contrasena) {
      setMensajeError('Usuario o contraseña incorrectos.');
      return;
    }

    setMensajeError('');
    alIniciarSesion(usuario, usuarioEncontrado);
  };

  return (
    <Box sx={{ ...appTheme.layout.page, background: appTheme.brand.pageGradient }}>
      <Paper elevation={0} sx={{ ...appTheme.layout.card, maxWidth: appTheme.layout.loginCardWidth }}>
          <Stack component="form" onSubmit={enviarFormulario} spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 62, height: 62 }}>
              <LockOutlinedIcon fontSize="large" />
            </Avatar>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  width: 42,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box component="img" src="/logo GalacticApp.png" alt="Logo de GalacticApp" sx={{ width: '100%', height: 'auto', display: 'block' }} />
              </Box>
              <Typography variant="h6" color="primary.main" sx={{ fontWeight: 800, letterSpacing: '0.01em' }}>
                {appTheme.brand.name}
              </Typography>
            </Box>
            <Typography variant="h4" color="text.primary">
              Iniciar sesión
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Elegí tu cuenta para ingresar al sistema
            </Typography>
          </Box>

          {mensajeError && <Alert severity="error">{mensajeError}</Alert>}

          <Stack spacing={2}>
            <TextField
              label="Usuario"
              value={credenciales.usuario}
              onChange={(event) => setCredenciales({ ...credenciales, usuario: event.target.value })}
              required
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><AccountCircleIcon color="action" /></InputAdornment> }}
            />
            <TextField
              label="Contraseña"
              type="password"
              value={credenciales.contrasena}
              onChange={(event) => setCredenciales({ ...credenciales, contrasena: event.target.value })}
              required
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><PasswordIcon color="action" /></InputAdornment> }}
            />
          </Stack>

          <Button type="submit" variant="contained" size="large" fullWidth sx={{ py: 1.5, fontWeight: 700 }}>
            Ingresar
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export default Login;
