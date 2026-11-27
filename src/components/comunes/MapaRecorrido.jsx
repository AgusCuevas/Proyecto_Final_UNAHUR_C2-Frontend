import { useEffect, useMemo, useState } from 'react';
import {
  Box, IconButton, Slider, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Replay10Icon from '@mui/icons-material/Replay10';
import Forward10Icon from '@mui/icons-material/Forward10';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { recorridosApi } from '../../services/api.js';
import AvisoCarga from './AvisoCarga.jsx';

const COLOR_RECORRIDO = '#f97316';
const COLOR_RECORRIDO_ACTUAL = '#2563eb';
const COLOR_INICIO = '#16a34a';
const COLOR_FIN = '#dc2626';
const COLOR_RECLAMO = '#2563eb';
// Un reclamo se ubica en el punto del recorrido más cercano a la hora en que se finalizó, si hay
// uno a menos de 15 minutos (con el técnico quieto el celular guarda pocos puntos).
const DISTANCIA_MAXIMA_MS = 15 * 60 * 1000;
const COLOR_POSICION_ACTUAL = '#7c3aed';
const formatearHora = (fecha, segundos = false) => new Date(fecha).toLocaleTimeString('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  ...(segundos ? { second: '2-digit' } : {}),
});

// Leaflet calcula el tamaño del mapa al crearlo. Dentro de un popup el mapa nace mientras el
// popup se abre (y cambia de tamaño al agrandarlo), así que se le avisa cada vez que su
// contenedor cambia de tamaño. Además encuadra el recorrido completo.
function AjustarMapa({ puntos }) {
  const mapa = useMap();

  useEffect(() => {
    const encuadrar = () => {
      mapa.invalidateSize();
      if (puntos.length > 1) mapa.fitBounds(puntos, { padding: [24, 24], maxZoom: 16 });
      else mapa.setView(puntos[0], 16);
    };
    encuadrar();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observador = new ResizeObserver(encuadrar);
    observador.observe(mapa.getContainer());
    return () => observador.disconnect();
  }, [mapa, puntos]);

  return null;
}

// Ubica cada reclamo finalizado en el punto del recorrido más cercano a su hora de finalización.
// Devuelve { ubicados: [{ posicion, reclamos }], sinUbicar }: los reclamos que caen en el mismo
// punto se agrupan en un solo marcador.
function ubicarReclamos(puntos, servicios) {
  const porPunto = new Map();
  let sinUbicar = 0;
  servicios.forEach((servicio) => {
    const hora = new Date(servicio.finalizadoEn).getTime();
    let cercano = -1;
    let distancia = Infinity;
    puntos.forEach((punto, indice) => {
      const diferencia = Math.abs(new Date(punto.registradoEn).getTime() - hora);
      if (diferencia < distancia) {
        cercano = indice;
        distancia = diferencia;
      }
    });
    if (!servicio.finalizadoEn || cercano < 0 || distancia > DISTANCIA_MAXIMA_MS) {
      sinUbicar += 1;
      return;
    }
    porPunto.set(cercano, [...(porPunto.get(cercano) || []), servicio]);
  });
  const ubicados = [...porPunto.entries()].map(([indice, reclamos]) => ({
    posicion: [puntos[indice].latitud, puntos[indice].longitud],
    reclamos,
  }));
  return { ubicados, sinUbicar };
}

// Recorrido de un técnico entre dos momentos (por ejemplo, el inicio y el fin de una jornada).
// - fin vacío: la jornada sigue en curso y se muestra el recorrido hasta ahora.
// - servicios: reclamos finalizados en la jornada ({ id, tipo, finalizadoEn }); se marcan en azul
//   donde estaba el técnico al finalizarlos (posición aproximada, ver ubicarReclamos).
// Se marca el punto de inicio (verde) y el último registrado (rojo). Al agrandar el popup que lo
// contiene (clase "maximizado"), el mapa crece.
function MapaRecorrido({ tecnicoId, inicio, fin = null, servicios = [] }) {
  // Un único estado con el resultado y a qué pedido corresponde (clave): así, si cambia la
  // jornada, no se muestra el recorrido de la anterior mientras llega el nuevo.
  const [estado, establecerEstado] = useState({ clave: null, puntos: [], error: '' });
  const [indiceActual, establecerIndiceActual] = useState(0);
  const [reproduciendo, establecerReproduciendo] = useState(false);
  const [velocidad, establecerVelocidad] = useState(1);
  const clave = `${tecnicoId}|${inicio}|${fin}`;

  useEffect(() => {
    let cancelado = false;
    const clavePedido = `${tecnicoId}|${inicio}|${fin}`;
    const hasta = fin || new Date().toISOString();
    recorridosApi.obtener(tecnicoId, inicio, hasta)
      .then(({ puntos }) => {
        if (!cancelado) establecerEstado({ clave: clavePedido, puntos: puntos || [], error: '' });
      })
      .catch(() => {
        if (!cancelado) establecerEstado({ clave: clavePedido, puntos: [], error: 'No se pudo cargar el recorrido.' });
      });
    return () => { cancelado = true; };
  }, [tecnicoId, inicio, fin]);

  // Mismo arreglo mientras no cambie el recorrido: así el mapa no se vuelve a encuadrar en cada
  // dibujo (por ejemplo, si el usuario lo movió).
  const puntos = useMemo(() => estado.puntos.map((punto) => [punto.latitud, punto.longitud]), [estado.puntos]);
  const reclamos = useMemo(() => ubicarReclamos(estado.puntos, servicios), [estado.puntos, servicios]);
  const listo = estado.clave === clave;

  useEffect(() => {
    if (!reproduciendo || estado.puntos.length <= 1) return undefined;
    const intervalo = window.setInterval(() => {
      establecerIndiceActual((indice) => {
        if (indice >= estado.puntos.length - 1) {
          establecerReproduciendo(false);
          return indice;
        }
        return indice + 1;
      });
    }, 900 / velocidad);
    return () => window.clearInterval(intervalo);
  }, [reproduciendo, velocidad, estado.puntos.length]);

  useEffect(() => {
    const manejarTecla = (evento) => {
      if (evento.target instanceof HTMLInputElement) return;
      if (evento.code === 'Space') {
        evento.preventDefault();
        establecerReproduciendo((activo) => estado.puntos.length > 1 ? !activo : false);
      }
      if (evento.code === 'ArrowLeft') {
        establecerIndiceActual((indice) => Math.max(0, indice - 10));
      }
      if (evento.code === 'ArrowRight') {
        establecerIndiceActual((indice) => Math.min(estado.puntos.length - 1, indice + 10));
      }
    };
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [estado.puntos.length]);

  if (!listo || estado.error) return <AvisoCarga cargando={!listo} error={listo ? estado.error : ''} />;

  if (puntos.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" data-testid="recorrido-vacio">
        No hay recorrido registrado en esta jornada. El técnico no compartió su ubicación.
      </Typography>
    );
  }

  const primero = estado.puntos[0];
  const ultimo = estado.puntos[estado.puntos.length - 1];
  const actual = estado.puntos[indiceActual] || primero;
  const recorridoActual = puntos.slice(0, indiceActual + 1);
  return (
    <Stack spacing={1}>
      <Box
        data-testid="mapa-recorrido"
        sx={{
          height: { xs: 240, sm: 300 },
          borderRadius: 2,
          overflow: 'hidden',
          border: 1,
          borderColor: 'divider',
          '.maximizado &': { height: '55vh' },
        }}
      >
        <MapContainer center={puntos[0]} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <AjustarMapa puntos={puntos} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            // OpenStreetMap bloquea (403) los mosaicos pedidos sin cabecera Referer.
            referrerPolicy="strict-origin-when-cross-origin"
          />
          {puntos.length > 1 && <Polyline positions={puntos} pathOptions={{ color: COLOR_RECORRIDO, weight: 4, opacity: 0.35 }} />}
          {recorridoActual.length > 1 && (
            <Polyline
              positions={recorridoActual}
              pathOptions={{ color: COLOR_RECORRIDO_ACTUAL, weight: 5, opacity: 1 }}
            />
          )}
          <CircleMarker center={puntos[0]} radius={8} pathOptions={{ color: '#ffffff', weight: 2, fillColor: COLOR_INICIO, fillOpacity: 1 }}>
            <Popup>Inicio · {formatearHora(primero.registradoEn)}</Popup>
          </CircleMarker>
          {puntos.length > 1 && (
            <CircleMarker center={puntos[puntos.length - 1]} radius={8} pathOptions={{ color: '#ffffff', weight: 2, fillColor: COLOR_FIN, fillOpacity: 1 }}>
              <Popup>{fin ? 'Fin' : 'Última posición'} · {formatearHora(ultimo.registradoEn)}</Popup>
            </CircleMarker>
          )}
          {/* Después del inicio y el fin, para que queden por encima si coinciden. */}
          {reclamos.ubicados.map(({ posicion, reclamos: delPunto }) => (
            <CircleMarker
              key={delPunto.map((reclamo) => reclamo.id).join('-')}
              center={posicion}
              radius={7}
              pathOptions={{ color: '#ffffff', weight: 2, fillColor: COLOR_RECLAMO, fillOpacity: 1 }}
            >
              <Popup>
                {delPunto.map((reclamo) => (
                  <div key={reclamo.id}>
                    Reclamo #{reclamo.id}{reclamo.tipo ? ` · ${reclamo.tipo}` : ''} · finalizado {formatearHora(reclamo.finalizadoEn)}
                  </div>
                ))}
              </Popup>
            </CircleMarker>
          ))}
          {puntos.length > 1 && (
            <CircleMarker
              center={[actual.latitud, actual.longitud]}
              radius={7}
              pathOptions={{ color: '#ffffff', weight: 3, fillColor: COLOR_POSICION_ACTUAL, fillOpacity: 1 }}
            >
              <Popup>Posición · {formatearHora(actual.registradoEn, true)}</Popup>
            </CircleMarker>
          )}
        </MapContainer>
      </Box>

      {puntos.length > 1 && (
        <Box
          data-testid="controles-recorrido"
          sx={{ px: 0.5, py: 0.25 }}
          aria-label="Controles de reproducción del recorrido"
        >
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="Retroceder 10 posiciones">
              <span>
                <IconButton
                  size="small"
                  aria-label="Retroceder 10 posiciones"
                  onClick={() => {
                    establecerReproduciendo(false);
                    establecerIndiceActual((indice) => Math.max(0, indice - 10));
                  }}
                >
                  <Replay10Icon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={reproduciendo ? 'Pausar recorrido' : 'Reproducir recorrido'}>
              <span>
                <IconButton
                  size="small"
                  color="primary"
                  aria-label={reproduciendo ? 'Pausar recorrido' : 'Reproducir recorrido'}
                  onClick={() => {
                    if (indiceActual >= puntos.length - 1) establecerIndiceActual(0);
                    establecerReproduciendo((activo) => !activo);
                  }}
                >
                  {reproduciendo ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Avanzar 10 posiciones">
              <span>
                <IconButton
                  size="small"
                  aria-label="Avanzar 10 posiciones"
                  onClick={() => {
                    establecerReproduciendo(false);
                    establecerIndiceActual((indice) => Math.min(puntos.length - 1, indice + 10));
                  }}
                >
                  <Forward10Icon />
                </IconButton>
              </span>
            </Tooltip>
            <Slider
              size="small"
              value={indiceActual}
              min={0}
              max={puntos.length - 1}
              onChange={(_, nuevoIndice) => {
                establecerReproduciendo(false);
                establecerIndiceActual(nuevoIndice);
              }}
              aria-label="Posición del recorrido"
              sx={{ mx: 1.5, minWidth: 80 }}
            />
            <ToggleButtonGroup
              size="small"
              exclusive
              value={velocidad}
              onChange={(_, nuevaVelocidad) => nuevaVelocidad && establecerVelocidad(nuevaVelocidad)}
              aria-label="Velocidad del recorrido"
            >
              {[1, 2, 4, 8].map((opcion) => (
                <ToggleButton key={opcion} value={opcion} sx={{ px: 0.75, py: 0.25, fontSize: '0.75rem' }}>
                  {opcion}×
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            Posición {indiceActual + 1}/{puntos.length} · {formatearHora(actual.registradoEn, true)}
          </Typography>
        </Box>
      )}

      <Typography variant="caption" color="text.secondary" data-testid="recorrido-resumen">
        {puntos.length} {puntos.length === 1 ? 'posición registrada' : 'posiciones registradas'}
        {` · de ${formatearHora(primero.registradoEn)} a ${formatearHora(ultimo.registradoEn)}`}
        {' · '}
        <Box component="span" sx={{ color: COLOR_INICIO, fontWeight: 700, whiteSpace: 'nowrap' }}>● inicio</Box>
        {puntos.length > 1 && (
          <>
            {'  '}
            <Box component="span" sx={{ color: COLOR_FIN, fontWeight: 700, whiteSpace: 'nowrap' }}>● {fin ? 'fin' : 'última posición'}</Box>
          </>
        )}
        {reclamos.ubicados.length > 0 && (
          <>
            {'  '}
            <Box component="span" sx={{ color: COLOR_RECLAMO, fontWeight: 700, whiteSpace: 'nowrap' }}>● reclamo finalizado</Box>
          </>
        )}
        {reclamos.sinUbicar > 0 && (
          ` · ${reclamos.sinUbicar === 1 ? '1 reclamo sin ubicación' : `${reclamos.sinUbicar} reclamos sin ubicación`} (no hay posiciones cerca de la hora en que se finalizó)`
        )}
      </Typography>
    </Stack>
  );
}

export default MapaRecorrido;
