import { Box, Paper, Stack, Typography } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { datosIniciales } from '../../data/datosIniciales.js';

function Vehiculo({ usuario }) {
  const tecnico = datosIniciales.usuarios.find((usuarioRegistrado) => usuarioRegistrado.usuario === usuario);
  const vehiculo = datosIniciales.vehiculos.find((vehiculoRegistrado) => vehiculoRegistrado.tecnicoAsignado === tecnico?.id);

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <DirectionsCarIcon color="secondary" fontSize="large" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Vehiculo asignado</Typography>
          <Typography color="text.secondary">{vehiculo?.modelo} · {vehiculo?.patente}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>Kilometraje inicial: {vehiculo?.kilometraje.inicial} km</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default Vehiculo;
