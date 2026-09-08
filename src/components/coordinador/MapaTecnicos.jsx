import { useMemo, useState } from 'react';
import { Box, Button, ButtonGroup, Chip, Paper, Stack, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { datosIniciales } from '../../data/datosIniciales.js';

const centroMapa = [-34.655, -58.63];

function MapaTecnicos() {
  const [filtro, establecerFiltro] = useState('Todos');

  const tecnicos = useMemo(() => datosIniciales.usuarios
    .filter((usuario) => usuario.rol === 'Tecnico' && usuario.activo)
    .map((tecnico) => {
      const ubicacion = datosIniciales.ubicacionesTecnicos.find(
        (item) => item.tecnicoId === tecnico.id,
      );
      const estado = ubicacion?.estado || 'Libre';

      return ubicacion ? { ...tecnico, ubicacion, estado } : null;
    }), []);

  const tecnicosConUbicacion = tecnicos.filter(Boolean);
  const tecnicosVisibles = tecnicosConUbicacion.filter(
    (tecnico) => filtro === 'Todos' || tecnico.estado === filtro,
  );
  const activos = tecnicosConUbicacion.filter((tecnico) => tecnico.estado === 'Activo').length;
  const libres = tecnicosConUbicacion.filter((tecnico) => tecnico.estado === 'Libre').length;

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={2}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Ubicación de técnicos</Typography>
          <Typography color="text.secondary">Seguimiento del equipo en la zona de trabajo.</Typography>
        </Box>
        <ButtonGroup size="small" variant="outlined" aria-label="Filtrar técnicos por estado">
          {['Todos', 'Activo', 'Libre'].map((opcion) => (
            <Button
              key={opcion}
              variant={filtro === opcion ? 'contained' : 'outlined'}
              onClick={() => establecerFiltro(opcion)}
            >
              {opcion}
            </Button>
          ))}
        </ButtonGroup>
      </Stack>

      <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
        <Chip icon={<LocationOnIcon />} label={`${activos} activos`} color="success" size="small" />
        <Chip label={`${libres} libres`} color="default" size="small" />
      </Stack>

      <Box sx={{ height: { xs: 360, md: 520 }, borderRadius: 2, overflow: 'hidden' }}>
        <MapContainer center={centroMapa} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {tecnicosVisibles.map((tecnico) => (
            <CircleMarker
              key={tecnico.id}
              center={[tecnico.ubicacion.latitud, tecnico.ubicacion.longitud]}
              radius={10}
              pathOptions={{
                color: tecnico.estado === 'Activo' ? '#16803c' : '#687586',
                fillColor: tecnico.estado === 'Activo' ? '#2eaf5d' : '#a5afbc',
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <strong>{tecnico.nombre}</strong><br />
                Estado: {tecnico.estado}<br />
                {tecnico.estado === 'Activo' ? 'Ubicación actual' : 'Disponible para asignar'}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </Box>
    </Paper>
  );
}

export default MapaTecnicos;