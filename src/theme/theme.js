import { createTheme } from '@mui/material/styles';

export const appTheme = {
  brand: {
    name: 'GALACTIC APP',
    primary: '#57A2BC',
    primaryDark: '#536875',
    secondary: '#8299C8',
    light: '#D8E0E9',
    soft: '#B0CAD5',
    pageGradientLight: 'radial-gradient(circle at top right, #D8E0E9 0, #F3F6F8 48%, #B0CAD5 140%)',
    pageGradientDark: 'radial-gradient(circle at top right, #536875 0, #243642 42%, #18242D 100%)',
  },
  layout: {
    loginCardWidth: 460,
    homeCardWidth: 720,
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: { xs: 2, sm: 3 },
    },
    card: {
      width: '100%',
      padding: { xs: '28px 22px', sm: '42px' },
    },
  },
};

export const createAppTheme = (modo = 'light') => {
  const esOscuro = modo === 'dark';
  const colores = esOscuro
    ? {
      background: '#18242D',
      paper: '#243642',
      text: '#D8E0E9',
      muted: '#B0CAD5',
      border: '#536875',
      gradient: 'radial-gradient(circle at top right, #536875 0, #243642 42%, #18242D 100%)',
      shadow: '0 24px 70px rgba(5, 15, 22, 0.42)',
    }
    : {
      background: '#F3F6F8',
      paper: '#FFFFFF',
      text: '#536875',
      muted: '#536875',
      border: '#B0CAD5',
      gradient: 'radial-gradient(circle at top right, #D8E0E9 0, #F3F6F8 48%, #B0CAD5 140%)',
      shadow: '0 24px 70px rgba(83, 104, 117, 0.16)',
    };

  return createTheme({
  palette: {
    mode: modo,
    primary: { main: appTheme.brand.primary, dark: appTheme.brand.primaryDark },
    secondary: { main: appTheme.brand.secondary },
    background: { default: colores.background, paper: colores.paper },
    text: { primary: colores.text, secondary: colores.muted },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: 'Inter, Roboto, sans-serif',
    h4: { fontWeight: 800 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: `1px solid ${colores.border}`,
          boxShadow: colores.shadow,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 700 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
  },
  });
};

export const theme = createAppTheme();
