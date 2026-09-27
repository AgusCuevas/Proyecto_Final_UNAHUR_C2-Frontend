import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useState } from 'react';
import { appTheme } from '../theme/theme.js';
import { useAppData } from '../context/useAppData.js';

const anchoMenu = 264;

function MarcaGalacticApp({ compact = false }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 1 : 1.25 }}>
      <Box
        sx={{
          width: compact ? 38 : 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Box component="img" src="/logo GalacticApp.png" alt="Logo de GalacticApp" sx={{ width: '100%', height: 'auto', display: 'block' }} />
      </Box>
      <Typography variant={compact ? 'h6' : 'subtitle1'} sx={{ fontWeight: 800, letterSpacing: '0.01em' }}>
        {appTheme.brand.name}
      </Typography>
    </Box>
  );
}

function AppLayout({ titulo, subtitulo, rol, usuario, nombre, opciones = [], alCerrarSesion, alSeleccionarOpcion, alCambiarTema, modo = 'light', accionTitulo, children }) {
  const [menuAbierto, establecerMenuAbierto] = useState(false);
  const { data } = useAppData();

  const tecnico = rol === 'Técnico'
    ? data?.usuarios?.find((u) => u.usuario === usuario)
    : null;
  const jornadaActiva = tecnico
    ? data?.jornadas?.find((j) => j.tecnicoId === tecnico.id && j.activa)
    : null;
  const horaInicioJornada = jornadaActiva?.inicio
    ? new Date(jornadaActiva.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const seleccionarOpcion = (opcion) => {
    alSeleccionarOpcion?.(opcion);
    establecerMenuAbierto(false);
  };

  const contenidoMenu = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2.5, pb: 2.5, pt: { xs: 1, md: 0 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ flexShrink: 0, bgcolor: 'secondary.main', width: 50, height: 50, border: 3, borderColor: 'background.paper', boxShadow: 2 }}>
            {(nombre || usuario).charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              {rol}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, mt: 0.35, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nombre || usuario}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 2 }}>
        {opciones.map((opcion) => (
          <ListItem key={opcion} disablePadding>
            <ListItemButton
              selected={opcion === titulo}
              onClick={() => seleccionarOpcion(opcion)}
              sx={{
                borderRadius: 1,
                mb: 0.75,
                minHeight: 44,
                px: 1.5,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 9,
                  bottom: 9,
                  width: 3,
                  borderRadius: 3,
                  backgroundColor: 'transparent',
                },
                '&.Mui-selected': {
                  color: modo === 'dark' ? 'text.primary' : 'primary.dark',
                  backgroundColor: modo === 'dark'
                    ? 'rgba(87, 162, 188, 0.28)'
                    : 'rgba(87, 162, 188, 0.14)',
                  '&::before': { backgroundColor: 'primary.main' },
                  '&:hover': {
                    backgroundColor: modo === 'dark'
                      ? 'rgba(87, 162, 188, 0.36)'
                      : 'rgba(87, 162, 188, 0.2)',
                  },
                },
              }}
            >
              <ListItemText primary={opcion} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Indicador de Jornada para Técnico abajo a la izquierda en el menú lateral */}
      {rol === 'Técnico' && (
        <Box sx={{ mt: 'auto', p: 2, pb: 2.5 }}>
          <Box
            onClick={() => seleccionarOpcion('Resumen de servicios')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.75,
              py: 1.25,
              borderRadius: 2,
              cursor: 'pointer',
              border: 1,
              borderColor: jornadaActiva ? 'success.main' : 'divider',
              backgroundColor: jornadaActiva
                ? (modo === 'dark' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(46, 125, 50, 0.08)')
                : 'action.hover',
              transition: 'all 200ms ease',
              '&:hover': {
                backgroundColor: jornadaActiva
                  ? (modo === 'dark' ? 'rgba(46, 125, 50, 0.3)' : 'rgba(46, 125, 50, 0.15)')
                  : 'action.selected',
                transform: 'translateY(-1px)',
              },
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: jornadaActiva ? 'success.main' : 'text.disabled',
                flexShrink: 0,
                boxShadow: jornadaActiva ? '0 0 0 3px rgba(46, 125, 50, 0.25)' : 'none',
                ...(jornadaActiva && {
                  animation: 'pulsoJornada 2s infinite',
                  '@keyframes pulsoJornada': {
                    '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(46, 125, 50, 0.7)' },
                    '70%': { transform: 'scale(1)', boxShadow: '0 0 0 6px rgba(46, 125, 50, 0)' },
                    '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(46, 125, 50, 0)' },
                  },
                }),
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: jornadaActiva ? 'success.main' : 'text.secondary',
                  lineHeight: 1.2,
                }}
              >
                {jornadaActiva ? 'Jornada activa' : 'Sin jornada activa'}
              </Typography>
              {jornadaActiva && horaInicioJornada && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', display: 'block' }}>
                  Desde las {horaInicioJornada}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: modo === 'dark' ? appTheme.brand.pageGradientDark : appTheme.brand.pageGradientLight }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, borderBottom: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 2, sm: 3, md: 4 }, gap: { xs: 0.5, sm: 1 } }}>
          <IconButton color="inherit" edge="start" onClick={() => establecerMenuAbierto(true)} sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 1 }} aria-label="Abrir menú">
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}><MarcaGalacticApp compact /></Box>
          <IconButton color="inherit" onClick={alCambiarTema} aria-label="Cambiar modo de color" sx={{ mr: 1 }}>
            {modo === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <Button color="inherit" size="small" startIcon={<LogoutIcon />} onClick={alCerrarSesion} sx={{ minWidth: { xs: 0, sm: 'auto' }, px: { xs: 1, sm: 1.5 } }}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Salir
            </Box>
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: { xs: 0, md: anchoMenu },
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: anchoMenu,
            boxSizing: 'border-box',
            pt: 11,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            borderRight: 1,
            borderColor: 'divider',
            backgroundColor: modo === 'dark' ? 'background.paper' : 'rgba(255, 255, 255, 0.72)',
            backdropFilter: modo === 'dark' ? 'none' : 'blur(14px)',
          },
        }}
      >
        {contenidoMenu}
      </Drawer>

      <Drawer
        variant="temporary"
        open={menuAbierto}
        onClose={() => establecerMenuAbierto(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' } }}
        slotProps={{ paper: { sx: { width: anchoMenu, pt: 3, display: 'flex', flexDirection: 'column' } } }}
      >
        {contenidoMenu}
      </Drawer>

      {/* Indicador flotante en mobile para Técnico (abajo a la izquierda) */}
      {rol === 'Técnico' && (
        <Box
          onClick={() => seleccionarOpcion('Resumen de servicios')}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1100,
            alignItems: 'center',
            gap: 1,
            px: 1.75,
            py: 0.85,
            borderRadius: 9999,
            cursor: 'pointer',
            bgcolor: modo === 'dark' ? 'background.paper' : '#ffffff',
            border: 1.5,
            borderColor: jornadaActiva ? 'success.main' : 'divider',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          }}
        >
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              bgcolor: jornadaActiva ? 'success.main' : 'text.disabled',
              boxShadow: jornadaActiva ? '0 0 0 2px rgba(46, 125, 50, 0.25)' : 'none',
              ...(jornadaActiva && {
                animation: 'pulsoJornada 2s infinite',
              }),
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 800,
              color: jornadaActiva ? 'success.main' : 'text.secondary',
              fontSize: '0.85rem',
            }}
          >
            {jornadaActiva ? 'Jornada activa' : 'Sin jornada activa'}
          </Typography>
        </Box>
      )}

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 5 }, pt: { xs: 10, md: 13 } }}>
        <Box sx={{ maxWidth: 1320, mx: 'auto', width: '100%' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}>
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', sm: '2.125rem' } }}>
              {titulo}
            </Typography>
            {accionTitulo}
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 0.75, mb: { xs: 3, md: 4.5 }, maxWidth: 720 }}>
            {subtitulo}
          </Typography>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default AppLayout;