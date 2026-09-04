import { createTheme } from '@mui/material/styles';

export const appTheme = {
  // Valores reutilizables de marca y layout para todas las pantallas.
  brand: {
    name: 'GALACTIC APP',
    primary: '#1259c3',
    primaryDark: '#0b3d91',
    secondary: '#13b8a6',
    text: '#12305b',
    pageBackground: '#eef5ff',
    cardBorder: '#d6e5fa',
    cardShadow: '0 24px 70px rgba(24, 65, 124, 0.16)',
    pageGradient: 'radial-gradient(circle at top right, #d7e7ff 0, #eef5ff 42%, #e5f8f5 100%)',
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

export const theme = createTheme({
  // Material UI toma estos valores como configuración visual global.
  palette: {
    mode: 'light',
    primary: { main: appTheme.brand.primary, dark: appTheme.brand.primaryDark },
    secondary: { main: appTheme.brand.secondary },
    background: { default: appTheme.brand.pageBackground, paper: '#ffffff' },
    text: { primary: appTheme.brand.text },
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
          border: `1px solid ${appTheme.brand.cardBorder}`,
          boxShadow: appTheme.brand.cardShadow,
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
