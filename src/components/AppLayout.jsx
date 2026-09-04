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
import { useState } from 'react';
import { appTheme } from '../theme/theme.js';

const anchoMenu = 248;

function AppLayout({ titulo, subtitulo, rol, usuario, opciones = [], alCerrarSesion, alSeleccionarOpcion, children }) {
  const [menuAbierto, establecerMenuAbierto] = useState(false);

  const seleccionarOpcion = (opcion) => {
    alSeleccionarOpcion?.(opcion);
    establecerMenuAbierto(false);
  };

  const contenidoMenu = (
    <>
      <Box sx={{ px: 2, pb: 2 }}>
        <Avatar sx={{ bgcolor: 'secondary.main', mb: 1 }}>{usuario.charAt(0).toUpperCase()}</Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{usuario}</Typography>
        <Typography variant="body2" color="text.secondary">{rol}</Typography>
      </Box>
      <Divider />
      <List>
        {opciones.map((opcion) => (
          <ListItem key={opcion} disablePadding>
            <ListItemButton selected={opcion === titulo} onClick={() => seleccionarOpcion(opcion)}>
              <ListItemText primary={opcion} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: appTheme.brand.pageGradient }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => establecerMenuAbierto(true)} sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 1 }} aria-label="Abrir menú">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800, flexGrow: 1 }}>
            {appTheme.brand.name}
          </Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={alCerrarSesion}>
            Salir
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
            pt: 8,
            display: { xs: 'none', md: 'block' },
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
        PaperProps={{ sx: { width: anchoMenu, pt: 2 } }}
      >
        {contenidoMenu}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 4 }, pt: { xs: 10, md: 12 } }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
          <Typography variant="h4" color="text.primary" sx={{ fontWeight: 800 }}>
            {titulo}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
            {subtitulo}
          </Typography>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default AppLayout;