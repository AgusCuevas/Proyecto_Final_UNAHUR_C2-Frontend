import { Box, Paper, Stack, Typography } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { useRecursos } from '../../context/useRecursos.js';

// GET /vehiculos ya devuelve solo el vehículo asignado al técnico.
function Vehiculo() {
  const data = useRecursos('vehiculos');
  const vehiculo = data.vehiculos[0];

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <DirectionsCarIcon color="secondary" fontSize="large" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Vehículo asignado</Typography>
            <Typography color="text.secondary">{vehiculo?.modelo} · {vehiculo?.patente}</Typography>
          </Box>
        </Stack>
        <Stack spacing={0.5}>
          <Typography variant="body2"><strong>Seguro:</strong> {vehiculo?.seguro?.compania} · Póliza {vehiculo?.seguro?.poliza}</Typography>
          <Typography variant="body2"><strong>Vencimiento:</strong> {vehiculo?.seguro?.vence}</Typography>
          <Typography variant="body2"><strong>Último service:</strong> {vehiculo?.ultimoService}</Typography>
          <Typography variant="body2" color="text.secondary">{vehiculo?.detalle}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default Vehiculo;
