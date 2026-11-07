import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, Paper, Stack, TextField } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppData } from '../../context/useAppData.js';
import { recorridosApi } from '../../services/api.js';

const centroMapa = [-34.655, -58.63];

// Fecha de hoy en hora local (toISOString usaría UTC y después de las 21 h daría mañana).
const hoyLocal = () => {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
};

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

// Cuando llega un recorrido, acomoda el mapa para que se vea completo.
function AjustarVistaRecorrido({ recorrido }) {
  const mapa = useMap();

  useEffect(() => {
    if (recorrido?.puntos.length > 1) {
      mapa.fitBounds(recorrido.puntos.map((punto) => [punto.latitud, punto.longitud]), { padding: [30, 30], maxZoom: 16 });
    }
  }, [mapa, recorrido]);

  return null;
}

const textoAyuda = { color: 'text.secondary', fontSize: '0.875rem' };

// tecnicos: los de GET /tecnicos; cada uno ya trae estado, reclamos, cliente y ubicación.
// Los puntos muestran la última posición de cada técnico. Al tocar uno se hace foco en él
// y se dibuja solo su recorrido del día elegido.
// El mapa no pide los técnicos: se los pasa la pantalla que lo muestra.
// tecnicoId: técnico a enfocar desde afuera. pedidoDeEnfoque: cambiarlo vuelve a enfocarlo.
function MapaTecnicos({ tecnicos = [], tecnicoId = null, pedidoDeEnfoque = 0 }) {
  const [filtro, establecerFiltro] = useState('Todos');
  const [dia, establecerDia] = useState(hoyLocal);
  const [enfocadoId, establecerEnfocadoId] = useState(tecnicoId);
  const [pedidoDeCentrado, establecerPedidoDeCentrado] = useState(0);
  const [enfoqueExterno, establecerEnfoqueExterno] = useState({ tecnicoId, pedidoDeEnfoque });
  // recorrido: { tecnicoId, dia, puntos } del técnico enfocado.
  const [recorrido, establecerRecorrido] = useState(null);
  const [errorRecorrido, establecerErrorRecorrido] = useState('');
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
  const activos = tecnicosConUbicacion.filter((tecnico) => tecnico.estado === 'Activo').length;
  const libres = tecnicosConUbicacion.filter((tecnico) => tecnico.estado === 'Libre').length;
  const asignados = tecnicosConUbicacion.filter((tecnico) => tecnico.estado === 'Asignado').length;

  const idRecorrido = tecnicoDestacado?.id ?? null;
  // Solo se muestra el recorrido si corresponde al técnico y al día que se están viendo.
  const recorridoVisible = recorrido?.tecnicoId === idRecorrido && recorrido?.dia === dia ? recorrido : null;

  // Pide el recorrido solo del técnico enfocado (un pedido, no uno por técnico).
  useEffect(() => {
    if (!dia || idRecorrido === null) return undefined;
    let cancelado = false;
    const cargarRecorrido = async () => {
      try {
        // Del inicio al fin del día en hora local, enviado con zona horaria.
        const [anio, mes, numeroDia] = dia.split('-').map(Number);
        const inicio = new Date(anio, mes - 1, numeroDia).toISOString();
        const fin = new Date(anio, mes - 1, numeroDia, 23, 59, 59, 999).toISOString();
        const resultado = await recorridosApi.obtener(idRecorrido, inicio, fin);
        if (!cancelado) {
          establecerRecorrido({ tecnicoId: idRecorrido, dia, puntos: resultado.puntos });
          establecerErrorRecorrido('');
        }
      } catch {
        if (!cancelado) establecerErrorRecorrido('No se pudo cargar el recorrido del técnico.');
      }
    };
    cargarRecorrido();
    return () => { cancelado = true; };
  }, [dia, idRecorrido]);

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
        {tecnicoDestacado ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
            <Chip
              label={`Recorrido de ${tecnicoDestacado.nombre}`}
              onDelete={() => establecerEnfocadoId(null)}
              color="primary"
              sx={{ height: 32, alignSelf: { xs: 'flex-start', sm: 'center' } }}
            />
            <TextField
              type="date"
              label="Día"
              value={dia}
              onChange={(event) => establecerDia(event.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: hoyLocal() } }}
              size="small"
              sx={{ maxWidth: { sm: 200 } }}
            />
            {recorridoVisible && recorridoVisible.puntos.length < 2 && (
              <Box component="span" sx={textoAyuda}>No hay recorrido registrado ese día.</Box>
            )}
          </Stack>
        ) : (
          tecnicosConUbicacion.length > 0 && (
            <Box component="span" sx={textoAyuda}>Tocá un técnico en el mapa para ver su recorrido.</Box>
          )
        )}
        {tecnicoDestacado && errorRecorrido && <Alert severity="error">{errorRecorrido}</Alert>}
      </Stack>

      {tecnicosConUbicacion.length === 0 && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          No hay ubicaciones compartidas todavía. El técnico debe iniciar su jornada y permitir el acceso a la ubicación desde su dispositivo.
        </Alert>
      )}

      <Box sx={{ mt: 1, height: { xs: 280, sm: 320, md: 380 }, borderRadius: 2, overflow: 'hidden' }}>
        <MapContainer center={centroMapa} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <AjustarVistaMapa tecnico={tecnicoDestacado} pedido={`${pedidoDeEnfoque}-${pedidoDeCentrado}`} />
          <AjustarVistaRecorrido recorrido={recorridoVisible} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            // OpenStreetMap bloquea (403) los mosaicos pedidos sin cabecera Referer.
            referrerPolicy="strict-origin-when-cross-origin"
          />
          {recorridoVisible?.puntos.length > 1 && (
            <Polyline
              positions={recorridoVisible.puntos.map((punto) => [punto.latitud, punto.longitud])}
              pathOptions={{ color: '#f97316', weight: 4, opacity: 0.8 }}
            />
          )}
          {tecnicosVisibles.map((tecnico) => (
            <CircleMarker
              key={tecnico.id}
              center={[tecnico.ubicacion.latitud, tecnico.ubicacion.longitud]}
              radius={tecnico.id === enfocadoId ? 14 : 10}
              pathOptions={{
                color: tecnico.id === enfocadoId ? '#155e75' : tecnico.estado === 'Activo' ? '#16803c' : tecnico.estado === 'Asignado' ? '#a66b00' : '#687586',
                fillColor: tecnico.estado === 'Activo' ? '#2eaf5d' : tecnico.estado === 'Asignado' ? '#f2b233' : '#a5afbc',
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
