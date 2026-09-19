import {
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import BuildIcon from '@mui/icons-material/Build';
import SpeedIcon from '@mui/icons-material/Speed';
import { useAppData } from '../../context/useAppData.js';

const formatearFecha = (fecha) => new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR');

function Vehiculos() {
  const { data } = useAppData();
  const tecnicos = data.usuarios.filter((usuario) => usuario.rol === 'Tecnico');
  const nombreTecnico = (tecnicoId) => tecnicos.find(
    (tecnico) => tecnico.id === tecnicoId,
  )?.nombre || 'Sin técnico asignado';

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Vehículos</Typography>
        <Typography color="text.secondary">Estado general de la flota y asignaciones actuales.</Typography>
      </div>

      <Grid container spacing={2}>
        {data.vehiculos.map((vehiculo) => (
          <Grid key={vehiculo.id} size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <DirectionsCarIcon color="primary" fontSize="large" />
                    <div>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {vehiculo.marca} {vehiculo.modelo}
                      </Typography>
                      <Typography color="text.secondary">Patente {vehiculo.patente}</Typography>
                    </div>
                  </Stack>
                  <Chip label={vehiculo.disponible ? 'Disponible' : 'No disponible'} color={vehiculo.disponible ? 'success' : 'default'} size="small" />
                </Stack>

                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <SpeedIcon fontSize="small" color="secondary" />
                      <Typography variant="caption" color="text.secondary">Kilómetros</Typography>
                    </Stack>
                    <Typography sx={{ fontWeight: 700 }}>{vehiculo.kilometraje.actual.toLocaleString('es-AR')} km</Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">Técnico asignado</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{nombreTecnico(vehiculo.tecnicoAsignado)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <BuildIcon fontSize="small" color="secondary" />
                      <Typography variant="caption" color="text.secondary">Último service</Typography>
                    </Stack>
                    <Typography sx={{ fontWeight: 700 }}>{formatearFecha(vehiculo.ultimoService)}</Typography>
                  </Grid>
                </Grid>

                <Stack spacing={1.25} mt={2}>
                  <Typography variant="body2"><strong>Seguro:</strong> {vehiculo.seguro.compania} · Póliza {vehiculo.seguro.poliza}</Typography>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <EventAvailableIcon fontSize="small" color="secondary" />
                    <Typography variant="body2"><strong>Vencimiento:</strong> {formatearFecha(vehiculo.seguro.vence)}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{vehiculo.detalle}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export default Vehiculos;