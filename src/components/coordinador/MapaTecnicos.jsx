import { useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppData } from '../../context/useAppData.js';

const centroMapa = [-34.655, -58.63];

// Colores de cada estado: los mismos en los puntos del mapa y en la leyenda.
const COLORES_ESTADO = {
  Activo: { relleno: '#2eaf5d', borde: '#16803c' },
  Asignado: { relleno: '#f2b233', borde: '#a66b00' },
  Libre: { relleno: '#a5afbc', borde: '#687586' },
};
const coloresDe = (estado) => COLORES_ESTADO[estado] || COLORES_ESTADO.Libre;
const LEYENDA = [
  { estado: 'Activo', singular: 'activo', plural: 'activos' },
  { estado: 'Asignado', singular: 'asignado', plural: 'asignados' },
  { estado: 'Libre', singular: 'libre', plural: 'libres' },
];

// Centra el mapa en el técnico destacado. "pedido" cambia cada vez que se pide ubicarlo,
// así vuelve a centrar aunque se toque el mismo técnico dos veces.
function AjustarVistaMapa({ tecnico, pedido }) {
  const mapa = useMap();
  const latitud = tecnico?.ubicacion.latitud;
  const longitud = tecnico?.ubicacion.longitud;

  useEffect(() => {
    if (latitud != null && longitud != null) mapa.setView([latitud, longitud], 15);
  }, [mapa, latitud, longitud, pedido]);

  return null;
}

// Leyenda del mapa: cuántos técnicos hay en cada estado, con el color de su punto.
function Leyenda({ cantidades }) {
  return (
    <Stack
      direction="row"
      aria-label="Técnicos en el mapa por estado"
      divider={<Box sx={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'divider' }} />}
      sx={{
        alignSelf: { xs: 'stretch', sm: 'center' },
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        backgroundColor: 'action.hover',
        overflow: 'hidden',
      }}
    >
      {LEYENDA.map(({ estado, singular, plural }) => (
        <Stack
          key={estado}
          direction="row"
          spacing={{ xs: 0.6, sm: 1 }}
          data-testid={`leyenda-${estado}`}
          sx={{ flex: { xs: 1, sm: 'initial' }, minWidth: 0, alignItems: 'center', justifyContent: 'center', px: { xs: 0.5, sm: 1.75 }, py: 0.9 }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              flexShrink: 0,
              borderRadius: '50%',
              backgroundColor: COLORES_ESTADO[estado].relleno,
              border: 2,
              borderColor: COLORES_ESTADO[estado].borde,
            }}
          />
          <Typography sx={{ fontWeight: 800, lineHeight: 1 }}>{cantidades[estado]}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1, whiteSpace: 'nowrap' }}>
            {cantidades[estado] === 1 ? singular : plural}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

// tecnicos: los de GET /tecnicos; cada uno ya trae estado, reclamos, cliente y ubicación.
// Los puntos muestran la última posición de cada técnico (el recorrido de cada jornada se ve en
// la ficha del técnico). Al tocar uno se hace foco en él y se ve su información.
// El mapa no pide los técnicos: se los pasa la pantalla que lo muestra.
// tecnicoId: técnico a enfocar desde afuera. pedidoDeEnfoque: cambiarlo vuelve a enfocarlo.
function MapaTecnicos({ tecnicos = [], tecnicoId = null, pedidoDeEnfoque = 0 }) {
  const [filtro, establecerFiltro] = useState('Todos');
  const [enfocadoId, establecerEnfocadoId] = useState(tecnicoId);
  const [pedidoDeCentrado, establecerPedidoDeCentrado] = useState(0);
  const [enfoqueExterno, establecerEnfoqueExterno] = useState({ tecnicoId, pedidoDeEnfoque });
  const { actualizarTecnicos } = useAppData();

  // Si la pantalla pide enfocar otro técnico (o el mismo de nuevo), ese pedido manda.
  if (enfoqueExterno.tecnicoId !== tecnicoId || enfoqueExterno.pedidoDeEnfoque !== pedidoDeEnfoque) {
    establecerEnfoqueExterno({ tecnicoId, pedidoDeEnfoque });
    establecerEnfocadoId(tecnicoId);
  }

  const enfocar = (id) => {
    establecerEnfocadoId(id);
    establecerPedidoDeCentrado((pedido) => pedido + 1);
  };

  // Cada 5 minutos vuelve a pedir los técnicos para refrescar las ubicaciones.
  useEffect(() => {
    const intervalo = setInterval(() => actualizarTecnicos().catch(() => undefined), 300000);
    return () => clearInterval(intervalo);
  }, [actualizarTecnicos]);

  const tecnicosConUbicacion = tecnicos.filter((tecnico) => tecnico.activo && tecnico.ubicacion);
  const tecnicosVisibles = tecnicosConUbicacion.filter(
    (tecnico) => filtro === 'Todos' || tecnico.estado === filtro || tecnico.id === enfocadoId,
  );
  const tecnicoDestacado = tecnicosConUbicacion.find((tecnico) => tecnico.id === enfocadoId);
  const cantidades = Object.fromEntries(LEYENDA.map(({ estado }) => [
    estado, tecnicosConUbicacion.filter((tecnico) => tecnico.estado === estado).length,
  ]));

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
          <Leyenda cantidades={cantidades} />
        </Stack>
      </Stack>

      {tecnicosConUbicacion.length === 0 && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          No hay ubicaciones compartidas todavía. El técnico debe iniciar su jornada y permitir el acceso a la ubicación desde su dispositivo.
        </Alert>
      )}

      <Box sx={{ mt: 1, height: { xs: 280, sm: 320, md: 380 }, borderRadius: 2, overflow: 'hidden' }}>
        <MapContainer center={centroMapa} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <AjustarVistaMapa tecnico={tecnicoDestacado} pedido={`${pedidoDeEnfoque}-${pedidoDeCentrado}`} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            // OpenStreetMap bloquea (403) los mosaicos pedidos sin cabecera Referer.
            referrerPolicy="strict-origin-when-cross-origin"
          />
          {tecnicosVisibles.map((tecnico) => (
            <CircleMarker
              key={tecnico.id}
              center={[tecnico.ubicacion.latitud, tecnico.ubicacion.longitud]}
              radius={tecnico.id === enfocadoId ? 14 : 10}
              pathOptions={{
                color: tecnico.id === enfocadoId ? '#155e75' : coloresDe(tecnico.estado).borde,
                fillColor: coloresDe(tecnico.estado).relleno,
                fillOpacity: 0.9,
              }}
              eventHandlers={{ click: () => enfocar(tecnico.id) }}
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
