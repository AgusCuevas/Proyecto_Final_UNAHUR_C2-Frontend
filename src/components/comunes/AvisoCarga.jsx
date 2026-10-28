import { Alert, Box, LinearProgress } from '@mui/material';

// Barra de progreso mientras llega una página (sin tapar la lista anterior) y aviso si falla.
// Ocupa siempre el mismo alto para que la tabla no salte al cargar.
export default function AvisoCarga({ cargando, error }) {
  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 1 }}>{error} Verificá la conexión e intentá nuevamente.</Alert>}
      <Box sx={{ height: 4, mb: 1 }}>
        {cargando && <LinearProgress aria-label="Cargando página" />}
      </Box>
    </>
  );
}
