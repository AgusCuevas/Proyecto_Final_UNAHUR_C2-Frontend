import { useState } from 'react';
import {
  Alert, Box, Button, Chip, List, ListItemButton, ListItemText, Pagination, Stack, TextField, Typography,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { usePagina, usePaginado } from '../../context/usePaginado.js';
import { jornadasApi } from '../../services/api.js';
import AvisoCarga from './AvisoCarga.jsx';
import FichaDetalle from './FichaDetalle.jsx';
import GaleriaImagenes from './GaleriaImagenes.jsx';
import MapaRecorrido from './MapaRecorrido.jsx';

const JORNADAS_POR_PAGINA = 5;

const formatearDia = (fecha) => new Date(fecha).toLocaleDateString('es-AR');
const formatearHora = (fecha) => new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
const formatearFechaHora = (fecha) => `${formatearDia(fecha)} ${formatearHora(fecha)}`;
const formatearKm = (valor) => (valor == null ? '' : `${Number(valor).toLocaleString('es-AR')} km`);

function formatearDuracion(inicio, fin) {
  const minutos = Math.max(0, Math.floor((new Date(fin) - new Date(inicio)) / 60000));
  return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`;
}

// El kilometraje de cada control (las jornadas viejas lo guardaban con otro nombre).
const kmInicial = (jornada) => jornada.controlInicial?.kilometraje ?? jornada.controlInicial?.kilometrajeInicial
  ?? jornada.kilometrajeInicial ?? null;
const kmFinal = (jornada) => jornada.controlFinal?.kilometraje ?? jornada.controlFinal?.kilometrajeFinal
  ?? jornada.kilometrajeFinal ?? null;
const kmRecorridos = (jornada) => (kmInicial(jornada) != null && kmFinal(jornada) != null
  ? Math.max(0, kmFinal(jornada) - kmInicial(jornada))
  : null);

// Los días elegidos ("AAAA-MM-DD") pasan a inicio y fin del día en la hora del navegador.
function filtroDeFechas(desde, hasta) {
  if (desde && hasta && desde > hasta) return { error: '"Desde" tiene que ser anterior o igual a "hasta".', desde: '', hasta: '' };
  return {
    desde: desde ? new Date(`${desde}T00:00:00`).toISOString() : '',
    hasta: hasta ? new Date(`${hasta}T23:59:59.999`).toISOString() : '',
  };
}

// Renglón del listado: horario, duración, kilómetros y servicios.
function resumenDe(jornada) {
  if (!jornada.fin) return `Desde las ${formatearHora(jornada.inicio)}`;
  const servicios = jornada.servicios?.length || 0;
  return [
    `${formatearHora(jornada.inicio)} a ${formatearHora(jornada.fin)}`,
    formatearDuracion(jornada.inicio, jornada.fin),
    kmRecorridos(jornada) != null && `${kmRecorridos(jornada).toLocaleString('es-AR')} km`,
    `${servicios} ${servicios === 1 ? 'servicio' : 'servicios'}`,
  ].filter(Boolean).join(' · ');
}

// Sección de un control del vehículo: sus datos y, debajo, sus fotos. Solo muestra lo cargado.
function seccionControl(titulo, control, kilometraje, descripcionFotos) {
  const imagenes = control?.imagenes || [];
  return {
    titulo,
    icono: <FactCheckOutlinedIcon fontSize="small" />,
    campos: [
      ['Kilometraje', formatearKm(kilometraje)],
      ['Combustible', control?.nivelCombustible ?? control?.litros],
      ['Estado del vehículo', control?.estado],
      ['Observaciones', control?.observaciones, { anchoCompleto: true }],
    ].filter(([, valor]) => valor != null && valor !== ''),
    contenido: imagenes.length > 0 && (
      <GaleriaImagenes key={imagenes.join()} ids={imagenes} descripcion={descripcionFotos} />
    ),
  };
}

function seccionesDe(jornada, tecnicoId) {
  const { vehiculo } = jornada;
  const sinVehiculo = !vehiculo && kmInicial(jornada) == null && kmFinal(jornada) == null;
  const servicios = jornada.servicios || [];
  return [
    {
      titulo: 'Horario',
      icono: <AccessTimeIcon fontSize="small" />,
      campos: [
        ['Inicio', formatearFechaHora(jornada.inicio)],
        ['Fin', jornada.fin ? formatearFechaHora(jornada.fin) : 'En curso'],
        ['Duración', jornada.fin ? formatearDuracion(jornada.inicio, jornada.fin) : 'En curso'],
      ],
    },
    {
      titulo: 'Vehículo',
      icono: <DirectionsCarOutlinedIcon fontSize="small" />,
      campos: sinVehiculo
        ? [['Vehículo', 'Sin vehículo asignado', { anchoCompleto: true }]]
        : [
          ['Vehículo', [vehiculo?.marca, vehiculo?.modelo].filter(Boolean).join(' ')],
          ['Patente', vehiculo?.patente],
          ['Kilómetros recorridos', formatearKm(kmRecorridos(jornada))],
        ].filter(([, valor]) => valor),
    },
    {
      // El recorrido de esta jornada: desde que la inició hasta que la cerró (o hasta ahora), con los
      // reclamos finalizados marcados donde estaba el técnico al finalizarlos.
      titulo: 'Recorrido',
      icono: <RouteOutlinedIcon fontSize="small" />,
      campos: [],
      contenido: <MapaRecorrido key={jornada.id} tecnicoId={tecnicoId} inicio={jornada.inicio} fin={jornada.fin} servicios={servicios} />,
    },
    seccionControl('Control inicial', jornada.controlInicial, kmInicial(jornada), 'Foto del control inicial'),
    seccionControl('Control final', jornada.controlFinal, kmFinal(jornada), 'Foto del control final'),
    {
      titulo: 'Servicios finalizados',
      icono: <TaskAltOutlinedIcon fontSize="small" />,
      campos: [[
        'Reclamos',
        servicios.length ? servicios.map((servicio) => `#${servicio.id} · ${servicio.tipo}`).join(', ') : 'Ninguno',
        { anchoCompleto: true },
      ]],
    },
  ];
}

// Jornadas de un técnico para admin y coordinador: listado paginado (las más nuevas primero) y,
// al elegir una, su detalle: horario, vehículo, recorrido en el mapa, controles con sus fotos y
// servicios.
function JornadasTecnico({ tecnicoId, nombre }) {
  const [desde, establecerDesde] = useState('');
  const [hasta, establecerHasta] = useState('');
  const [jornadaAbierta, establecerJornadaAbierta] = useState(null);
  const filtro = filtroDeFechas(desde, hasta);
  const [pagina, establecerPagina] = usePagina(tecnicoId, filtro.desde, filtro.hasta);
  const {
    datos: jornadas, paginacion, cargando, error,
  } = usePaginado(jornadasApi.pagina, {
    pagina, limite: JORNADAS_POR_PAGINA, tecnicoId, desde: filtro.desde, hasta: filtro.hasta,
  });
  const total = paginacion?.total ?? 0;

  return (
    <Box sx={{ pt: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1, alignItems: { sm: 'center' } }}>
        <TextField type="date" size="small" label="Desde" value={desde} onChange={(evento) => establecerDesde(evento.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField type="date" size="small" label="Hasta" value={hasta} onChange={(evento) => establecerHasta(evento.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        {(desde || hasta) && <Button onClick={() => { establecerDesde(''); establecerHasta(''); }}>Quitar filtro</Button>}
      </Stack>
      {filtro.error && <Alert severity="warning" sx={{ mb: 1 }}>{filtro.error}</Alert>}
      <AvisoCarga cargando={cargando} error={error} />

      {jornadas.length === 0 ? (
        !cargando && !error && (
          <Typography variant="body2" color="text.secondary">
            {desde || hasta ? 'No hay jornadas entre esas fechas.' : 'Todavía no registró jornadas.'}
          </Typography>
        )
      ) : (
        <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          {jornadas.map((jornada, indice) => (
            <ListItemButton
              key={jornada.id}
              divider={indice < jornadas.length - 1}
              onClick={() => establecerJornadaAbierta(jornada)}
              aria-label={`Ver el detalle de la jornada del ${formatearDia(jornada.inicio)}`}
            >
              <ListItemText
                primary={`Jornada del ${formatearDia(jornada.inicio)}`}
                secondary={resumenDe(jornada)}
                slotProps={{ primary: { sx: { fontWeight: 700 } } }}
              />
              {jornada.activa && <Chip size="small" color="success" label="En curso" sx={{ mr: 1 }} />}
              <ChevronRightIcon color="action" />
            </ListItemButton>
          ))}
        </List>
      )}

      {total > JORNADAS_POR_PAGINA && (
        <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'center', mt: 1.5 }}>
          <Pagination
            count={Math.ceil(total / JORNADAS_POR_PAGINA)}
            page={pagina}
            onChange={(_, nuevaPagina) => establecerPagina(nuevaPagina)}
            color="primary"
            size="small"
            siblingCount={0}
          />
          <Typography variant="body2" color="text.secondary">{total} jornadas</Typography>
        </Stack>
      )}

      <FichaDetalle
        abierto={Boolean(jornadaAbierta)}
        alCerrar={() => establecerJornadaAbierta(null)}
        titulo={jornadaAbierta ? `Jornada del ${formatearDia(jornadaAbierta.inicio)}` : ''}
        subtitulo={nombre}
        icono={<AccessTimeIcon />}
        chips={jornadaAbierta ? [
          { label: 'Jornada', color: 'primary', variant: 'outlined' },
          jornadaAbierta.activa ? { label: 'En curso', color: 'success' } : { label: 'Finalizada' },
          ...(jornadaAbierta.cerradaAutomaticamente ? [{ label: 'Cerrada automáticamente', color: 'warning', variant: 'outlined' }] : []),
        ] : []}
        secciones={jornadaAbierta ? seccionesDe(jornadaAbierta, tecnicoId) : []}
        acciones={<Button onClick={() => establecerJornadaAbierta(null)}>Cerrar</Button>}
      />
    </Box>
  );
}

export default JornadasTecnico;
