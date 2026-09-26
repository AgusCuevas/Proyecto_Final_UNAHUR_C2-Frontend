import { createTheme } from '@mui/material/styles';

export const appTheme = {
  brand: {
    name: 'GalacticApp',
    primary: '#57A2BC',
    primaryDark: '#536875',
    secondary: '#8299C8',
    light: '#D8E0E9',
    soft: '#B0CAD5',
    pageGradientLight: 'radial-gradient(circle at top right, #E8F1F2 0, #F6F8F7 48%, #DCE9E7 140%)',
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
      gradient: 'radial-gradient(circle at top right, #E8F1F2 0, #F6F8F7 48%, #DCE9E7 140%)',
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
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: 0, lineHeight: 1.15 },
    h5: { fontWeight: 700, letterSpacing: 0, lineHeight: 1.2 },
    h6: { fontWeight: 700, letterSpacing: 0, lineHeight: 1.25 },
    button: { fontWeight: 700, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundImage: colores.gradient, backgroundAttachment: 'fixed' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: `1px solid ${colores.border}`,
          boxShadow: colores.shadow,
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          minHeight: 42,
          borderRadius: 8,
          paddingInline: 18,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: { color: '#FFFFFF' },
        sizeSmall: { minHeight: 36, paddingInline: 14 },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiInputLabel: {
      defaultProps: { shrink: true },
    },
    MuiFormControl: {
      defaultProps: { size: 'small' },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 8, overflow: 'hidden' },
      },
    },
  },
  });
};

export const theme = createAppTheme();
