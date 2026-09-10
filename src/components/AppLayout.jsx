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
  Toolbar,
  Typography,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useState } from 'react';
import { appTheme } from '../theme/theme.js';

const anchoMenu = 248;

function AppLayout({ titulo, subtitulo, rol, usuario, opciones = [], alCerrarSesion, alSeleccionarOpcion, alCambiarTema, modo = 'light', children }) {
  const [menuAbierto, establecerMenuAbierto] = useState(false);

  const seleccionarOpcion = (opcion) => {
    alSeleccionarOpcion?.(opcion);
    establecerMenuAbierto(false);
  };

  const contenidoMenu = (
    <>
      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ flexShrink: 0, bgcolor: 'secondary.main', width: 50, height: 50, border: 3, borderColor: 'background.paper', boxShadow: 2 }}>
            {usuario.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {usuario}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>{rol}</Typography>
          </Box>
        </Box>
      </Box>
      <Divider />
      <List sx={{ px: 1.25, py: 1.5 }}>
        {opciones.map((opcion) => (
          <ListItem key={opcion} disablePadding>
            <ListItemButton
              selected={opcion === titulo}
              onClick={() => seleccionarOpcion(opcion)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  color: modo === 'dark' ? 'text.primary' : 'primary.dark',
                  backgroundColor: modo === 'dark'
                    ? 'rgba(87, 162, 188, 0.28)'
                    : 'rgba(87, 162, 188, 0.14)',
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
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: modo === 'dark' ? appTheme.brand.pageGradientDark : appTheme.brand.pageGradientLight }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, borderBottom: 1, borderColor: 'rgba(255,255,255,0.16)' }}>
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 2, sm: 3, md: 4 }, gap: { xs: 0.5, sm: 1 } }}>
          <IconButton color="inherit" edge="start" onClick={() => establecerMenuAbierto(true)} sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 1 }} aria-label="Abrir menú">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.04em', flexGrow: 1 }}>
            {appTheme.brand.name}
          </Typography>
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
            display: { xs: 'none', md: 'block' },
            borderRight: 1,
            borderColor: 'divider',
            backgroundColor: 'background.paper',
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
        PaperProps={{ sx: { width: anchoMenu, pt: 3 } }}
      >
        {contenidoMenu}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, sm: 3, md: 5 }, pt: { xs: 10, md: 13 } }}>
        <Box sx={{ maxWidth: 1480, mx: 'auto', width: '100%' }}>
          <Typography variant="h4" color="text.primary" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', sm: '2.125rem' } }}>
            {titulo}
          </Typography>
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