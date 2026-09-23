import { Box, Paper, Stack, Typography } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { useAppData } from '../../context/useAppData.js';
import RegistroKilometraje from './RegistroKilometraje.jsx';

function Vehiculo({ usuario }) {
  const { data } = useAppData();
  const tecnico = data.usuarios.find((usuarioRegistrado) => usuarioRegistrado.usuario === usuario);
  const vehiculo = data.vehiculos.find((vehiculoRegistrado) => vehiculoRegistrado.tecnicoAsignado === tecnico?.id);

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <DirectionsCarIcon color="secondary" fontSize="large" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Vehiculo asignado</Typography>
          <Typography color="text.secondary">{vehiculo?.modelo} · {vehiculo?.patente}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>Kilometraje inicial: {vehiculo?.kilometraje.inicial} km</Typography>
          <Typography variant="body2">Kilometraje actual: {vehiculo?.kilometraje.actual} km</Typography>
        </Box>
        </Stack>
        {vehiculo ? (
          <>
            <Stack spacing={0.5}>
              <Typography variant="body2"><strong>Seguro:</strong> {vehiculo.seguro.compania} · Póliza {vehiculo.seguro.poliza}</Typography>
              <Typography variant="body2"><strong>Vencimiento:</strong> {vehiculo.seguro.vence}</Typography>
              <Typography variant="body2"><strong>Último service:</strong> {vehiculo.ultimoService}</Typography>
              <Typography variant="body2" color="text.secondary">{vehiculo.detalle}</Typography>
            </Stack>
            <RegistroKilometraje vehiculo={vehiculo} compacto />
          </>
        ) : (
          <Typography color="text.secondary">No tenés un vehículo asignado.</Typography>
        )}
      </Stack>
    </Paper>
  );
}

export default Vehiculo;
