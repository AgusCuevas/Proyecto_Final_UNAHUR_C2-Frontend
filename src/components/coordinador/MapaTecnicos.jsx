import { useMemo, useState } from 'react';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppData } from '../../context/useAppData.js';

const centroMapa = [-34.655, -58.63];

function MapaTecnicos() {
  const [filtro, establecerFiltro] = useState('Todos');
  const { data } = useAppData();

  const tecnicos = useMemo(() => data.usuarios
    .filter((usuario) => usuario.rol === 'Tecnico' && usuario.activo)
    .map((tecnico) => {
      const ubicacion = data.ubicacionesTecnicos.find(
        (item) => item.tecnicoId === tecnico.id,
      );
      const reclamoEnCurso = data.reclamos.find(
        (reclamo) => reclamo.tecnicoId === tecnico.id && reclamo.estado === 'En progreso',
      );
      const reclamoAsignado = data.reclamos.find(
        (reclamo) => reclamo.tecnicoId === tecnico.id
          && reclamo.estado !== 'Finalizado'
          && reclamo.estado !== 'En progreso',
      );
      const estado = reclamoEnCurso ? 'Activo' : reclamoAsignado ? 'Asignado' : 'Libre';
      const cliente = data.clientes.find(
        (item) => item.id === (reclamoEnCurso || reclamoAsignado)?.clienteId,
      );

      return ubicacion
        ? { ...tecnico, ubicacion, estado, reclamoEnCurso, reclamoAsignado, cliente }
        : null;
    }), [data]);

  const tecnicosConUbicacion = tecnicos.filter(Boolean);
  const tecnicosVisibles = tecnicosConUbicacion.filter(
    (tecnico) => filtro === 'Todos' || tecnico.estado === filtro,
  );
  const activos = tecnicosConUbicacion.filter((tecnico) => tecnico.estado === 'Activo').length;
  const libres = tecnicosConUbicacion.filter((tecnico) => tecnico.estado === 'Libre').length;
  const asignados = tecnicosConUbicacion.filter((tecnico) => tecnico.estado === 'Asignado').length;

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5} mb={4}>
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Ubicación de técnicos</Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
            Seguimiento del equipo en la zona de trabajo.
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          aria-label="Filtrar técnicos por estado"
          sx={{
            alignSelf: 'center',
            justifyContent: 'center',
            width: { xs: '100%', sm: 'fit-content' },
            flexWrap: 'wrap',
            p: 1,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            backgroundColor: 'action.hover',
            '& .MuiButton-root': { flex: { xs: 1, sm: 'initial' }, minWidth: { sm: 82 } },
          }}
        >
          {['Todos', 'Activo', 'Asignado', 'Libre'].map((opcion) => (
            <Button
              key={opcion}
              variant={filtro === opcion ? 'contained' : 'outlined'}
              onClick={() => establecerFiltro(opcion)}
            >
              {opcion}
            </Button>
          ))}
        </Stack>
      </Stack>

      <Stack
        direction="row"
        gap={1}
        mt={3}
        pt={2.5}
        pb={2.5}
        mb={3.5}
        flexWrap="wrap"
        sx={{ borderTop: 1, borderColor: 'divider' }}
      >
        <Chip icon={<LocationOnIcon />} label={`${activos} activos`} color="success" size="small" />
        <Chip label={`${asignados} asignados`} color="warning" size="small" />
        <Chip label={`${libres} libres`} color="default" size="small" />
      </Stack>

      <Box sx={{ mt: 1, height: { xs: 360, md: 520 }, borderRadius: 2, overflow: 'hidden' }}>
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
                color: tecnico.estado === 'Activo' ? '#16803c' : tecnico.estado === 'Asignado' ? '#a66b00' : '#687586',
                fillColor: tecnico.estado === 'Activo' ? '#2eaf5d' : tecnico.estado === 'Asignado' ? '#f2b233' : '#a5afbc',
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <strong>{tecnico.nombre}</strong><br />
                Estado: {tecnico.estado}<br />
                {tecnico.reclamoEnCurso ? (
                  <>
                    Reclamo en curso: #{tecnico.reclamoEnCurso.id} - {tecnico.reclamoEnCurso.tipo}<br />
                    Cliente: {tecnico.cliente?.nombre || 'Sin cliente'}
                  </>
                ) : tecnico.reclamoAsignado ? (
                  <>
                    Reclamo asignado: #{tecnico.reclamoAsignado.id} - {tecnico.reclamoAsignado.tipo}<br />
                    Pendiente de iniciar
                  </>
                ) : 'Disponible para asignar'}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </Box>
    </Paper>
  );
}

export default MapaTecnicos;