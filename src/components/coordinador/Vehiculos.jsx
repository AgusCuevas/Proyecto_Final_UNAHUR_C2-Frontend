import {
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import BuildIcon from '@mui/icons-material/Build';
import SearchIcon from '@mui/icons-material/Search';
import SpeedIcon from '@mui/icons-material/Speed';
import { useState } from 'react';
import { useAppData } from '../../context/useAppData.js';

const formatearFecha = (fecha) => new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR');

function Vehiculos() {
  const { data } = useAppData();
  const [busqueda, establecerBusqueda] = useState('');
  const tecnicos = data.usuarios.filter((usuario) => usuario.rol === 'Tecnico');
  const nombreTecnico = (tecnicoId) => tecnicos.find(
    (tecnico) => tecnico.id === tecnicoId,
  )?.nombre || 'Sin técnico asignado';
  const textoBusqueda = busqueda.trim().toLowerCase();
  const vehiculosFiltrados = data.vehiculos.filter((vehiculo) => (
    !textoBusqueda
      || [
        vehiculo.patente,
        vehiculo.marca,
        vehiculo.modelo,
        nombreTecnico(vehiculo.tecnicoAsignado),
      ].some((campo) => campo?.toLowerCase().includes(textoBusqueda))
  ));

  return (
    <Stack spacing={3}>
      <TextField
        value={busqueda}
        onChange={(event) => establecerBusqueda(event.target.value)}
        label="Buscar vehículo"
        placeholder="Patente, marca, modelo o técnico"
        fullWidth
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />
      <Typography variant="body2" color="text.secondary">
        Mostrando {vehiculosFiltrados.length} de {data.vehiculos.length} vehículos.
      </Typography>
      <Grid container spacing={2}>
        {vehiculosFiltrados.map((vehiculo) => (
          <Grid key={vehiculo.id} size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction="row" gap={2} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
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
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
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
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <BuildIcon fontSize="small" color="secondary" />
                      <Typography variant="caption" color="text.secondary">Último service</Typography>
                    </Stack>
                    <Typography sx={{ fontWeight: 700 }}>{formatearFecha(vehiculo.ultimoService)}</Typography>
                  </Grid>
                </Grid>

                <Stack spacing={1.25} mt={2}>
                  <Typography variant="body2"><strong>Seguro:</strong> {vehiculo.seguro.compania} · Póliza {vehiculo.seguro.poliza}</Typography>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
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
      {vehiculosFiltrados.length === 0 && (
        <Typography color="text.secondary">No hay vehículos que coincidan con la búsqueda.</Typography>
      )}
    </Stack>
  );
}

export default Vehiculos;