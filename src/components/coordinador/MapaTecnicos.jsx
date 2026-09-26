import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Paper, Stack } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppData } from '../../context/useAppData.js';
import { calcularRecorridoKm, obtenerParadasTecnico } from '../../services/recorrido.js';

const centroMapa = [-34.655, -58.63];

function AjustarVistaMapa({ tecnico }) {
  const mapa = useMap();

  useEffect(() => {
    if (tecnico) mapa.setView([tecnico.ubicacion.latitud, tecnico.ubicacion.longitud], 15);
  }, [mapa, tecnico]);

  return null;
}

function MapaTecnicos({ tecnicoId = null }) {
  const [filtro, establecerFiltro] = useState('Todos');
  const { data, actualizarUbicaciones } = useAppData();

  useEffect(() => {
    const intervalo = setInterval(() => actualizarUbicaciones().catch(() => undefined), 300000);
    return () => clearInterval(intervalo);
  }, [actualizarUbicaciones]);

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
    (tecnico) => filtro === 'Todos' || tecnico.estado === filtro || tecnico.id === tecnicoId,
  );
  const tecnicoDestacado = tecnicosConUbicacion.find((tecnico) => tecnico.id === tecnicoId);
  const recorridos = tecnicosVisibles.map((tecnico) => {
    const paradas = obtenerParadasTecnico(tecnico.id, data, tecnico.ubicacion);
    return { tecnico, paradas, kilometros: calcularRecorridoKm(paradas) };
  });
  const activos = tecnicosConUbicacion.filter((tecnico) => tecnico.estado === 'Activo').length;
  const libres = tecnicosConUbicacion.filter((tecnico) => tecnico.estado === 'Libre').length;
  const asignados = tecnicosConUbicacion.filter((tecnico) => tecnico.estado === 'Asignado').length;

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={1} mb={1.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack
            direction="row"
            spacing={0.5}
            aria-label="Filtrar técnicos por estado"
            sx={{
              alignSelf: { xs: 'stretch', sm: 'flex-start' },
              justifyContent: 'flex-start',
              width: { xs: '100%', sm: 'fit-content' },
              flexWrap: 'wrap',
              p: 0.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1.5,
              backgroundColor: 'action.hover',
              '& .MuiButton-root': { flex: { xs: 1, sm: 'initial' }, minWidth: { sm: 64 }, minHeight: 32, px: 1.25 },
            }}
          >
            {['Todos', 'Activo', 'Asignado', 'Libre'].map((opcion) => (
              <Button
                key={opcion}
                size="small"
                variant={filtro === opcion ? 'contained' : 'outlined'}
                onClick={() => establecerFiltro(opcion)}
              >
                {opcion}
              </Button>
            ))}
          </Stack>
          <Stack direction="row" gap={0.75} sx={{ justifyContent: { xs: 'flex-start', sm: 'flex-end' }, flexWrap: 'wrap' }}>
            <Chip icon={<LocationOnIcon />} label={`${activos} activos`} color="success" sx={{ height: 32, fontSize: '0.9rem' }} />
            <Chip label={`${asignados} asignados`} color="warning" sx={{ height: 32, fontSize: '0.9rem' }} />
            <Chip label={`${libres} libres`} color="default" sx={{ height: 32, fontSize: '0.9rem' }} />
          </Stack>
        </Stack>
      </Stack>

      <Box sx={{ mt: 1, height: { xs: 280, sm: 320, md: 380 }, borderRadius: 2, overflow: 'hidden' }}>
        <MapContainer center={centroMapa} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <AjustarVistaMapa tecnico={tecnicoDestacado} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {tecnicosVisibles.map((tecnico) => (
            <CircleMarker
              key={tecnico.id}
              center={[tecnico.ubicacion.latitud, tecnico.ubicacion.longitud]}
              radius={tecnico.id === tecnicoId ? 14 : 10}
              pathOptions={{
                color: tecnico.id === tecnicoId ? '#155e75' : tecnico.estado === 'Activo' ? '#16803c' : tecnico.estado === 'Asignado' ? '#a66b00' : '#687586',
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
                <br />
                Recorrido sugerido: {Math.round(recorridos.find((item) => item.tecnico.id === tecnico.id)?.kilometros || 0)} km
              </Popup>
            </CircleMarker>
          ))}
          {recorridos.map((recorrido) => recorrido.paradas.length > 1 && (
            <Polyline
              key={`ruta-${recorrido.tecnico.id}`}
              positions={recorrido.paradas.map((parada) => [parada.latitud, parada.longitud])}
              pathOptions={{
                color: recorrido.tecnico.id === tecnicoId ? '#155e75' : '#8299C8',
                weight: recorrido.tecnico.id === tecnicoId ? 5 : 3,
                opacity: recorrido.tecnico.id === tecnicoId ? 0.9 : 0.55,
                dashArray: recorrido.tecnico.id === tecnicoId ? undefined : '8 8',
              }}
            />
          ))}
        </MapContainer>
      </Box>
    </Paper>
  );
}

export default MapaTecnicos;