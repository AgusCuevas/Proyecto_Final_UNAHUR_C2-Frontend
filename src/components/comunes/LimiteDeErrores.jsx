import { Component } from 'react';
import { Alert, Button, Stack } from '@mui/material';

// Si una pantalla falla al dibujarse, muestra un aviso en su lugar en vez de dejar toda
// la aplicación en blanco. El menú y el resto de la app siguen funcionando.
// (React solo permite capturar estos errores con un componente de clase.)
class LimiteDeErrores extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error al mostrar la pantalla:', error, info.componentStack);
  }

  componentDidUpdate(propsAnteriores) {
    // Al cambiar de sección se vuelve a intentar.
    if (this.state.error && propsAnteriores.claveReinicio !== this.props.claveReinicio) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={() => this.setState({ error: null })}>Reintentar</Button>}
      >
        <Stack spacing={0.5}>
          <strong>No se pudo mostrar esta sección.</strong>
          <span>Probá de nuevo o elegí otra opción del menú. Si el problema sigue, avisá al administrador.</span>
        </Stack>
      </Alert>
    );
  }
}

export default LimiteDeErrores;
