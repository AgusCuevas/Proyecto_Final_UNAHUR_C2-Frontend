import { useEffect, useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Paper, Stack, TextField, Typography,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import { useAppData } from '../../context/useAppData.js';
import { usePagina, usePaginado } from '../../context/usePaginado.js';
import { jornadasApi, reclamosApi } from '../../services/api.js';
import PaginacionLista from '../comunes/PaginacionLista.jsx';
import AvisoCarga from '../comunes/AvisoCarga.jsx';

import ControlVehiculoDialog from './ControlVehiculoDialog.jsx';
import SelectorBuscable from '../comunes/SelectorBuscable.jsx';

// Desempeño del período elegido: { horasTrabajadas, serviciosEnPeriodo } (GET /jornadas/resumen).
const pedirResumen = ({ desde }) => jornadasApi.resumen(desde);
const sinFiltros = {};

// Períodos del Desempeño (igual que el mobile).
const PERIODOS = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: 'semana', etiqueta: 'Esta semana' },
  { valor: 'mes', etiqueta: 'Este mes' },
  { valor: 'anio', etiqueta: 'Este año' },
];

// Inicio del período en la hora del navegador: hoy a las 00:00, el lunes, el día 1 o el 1 de enero.
function inicioDelPeriodo(periodo) {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  if (periodo === 'semana') fecha.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7));
  if (periodo === 'mes') fecha.setDate(1);
  if (periodo === 'anio') fecha.setMonth(0, 1);
  return fecha.toISOString();
}

// Filtro de "Jornadas trabajadas": los días elegidos ("AAAA-MM-DD") pasan a inicio y fin del día
// en la hora del navegador, así el backend no depende de su propia zona horaria.
function filtroDeJornadas(desde, hasta) {
  if (desde && hasta && desde > hasta) return { error: '"Desde" tiene que ser anterior o igual a "hasta".', desde: '', hasta: '' };
  return {
    desde: desde ? new Date(`${desde}T00:00:00`).toISOString() : '',
    hasta: hasta ? new Date(`${hasta}T23:59:59.999`).toISOString() : '',
  };
}

const formatearHoras = (horas) => `${Number(horas || 0).toLocaleString('es-AR', { maximumFractionDigits: 1 })} h`;

function formatearDuracion(inicio, fin = new Date()) {
  const minutos = Math.max(0, Math.floor((new Date(fin) - new Date(inicio)) / 60000));
  const horas = Math.floor(minutos / 60);
  return `${horas} h ${String(minutos % 60).padStart(2, '0')} min`;
}

function Jornada() {
  // El técnico, su vehículo y su jornada activa llegan en el login.
  const {
    sesion,
    iniciarJornada,
    finalizarJornada,
    registrarUbicacionTecnico,
  } = useAppData();
  const [ahora, establecerAhora] = useState(null);
  const [periodo, establecerPeriodo] = useState('hoy');
  const [desde, establecerDesde] = useState('');
  const [hasta, establecerHasta] = useState('');
  const [error, establecerError] = useState('');
  const [controlFinalAbierto, establecerControlFinalAbierto] = useState(false);
  const [controlInicialAbierto, establecerControlInicialAbierto] = useState(false);
  const [resultadosPorPagina, establecerResultadosPorPagina] = useState(10);
  const tecnico = sesion.usuario;
  const { vehiculo, jornadaActiva } = sesion;
  // Jornadas trabajadas: paginación en el servidor (las más nuevas primero), cada una con sus
  // servicios, filtradas por fecha. Al cambiar el filtro vuelve a la página 1.
  const filtro = filtroDeJornadas(desde, hasta);
  const [pagina, establecerPagina] = usePagina(filtro.desde, filtro.hasta, resultadosPorPagina);
  const {
    datos: jornadas, paginacion, cargando, error: errorCarga,
  } = usePaginado(jornadasApi.pagina, {
    pagina, limite: resultadosPorPagina, desde: filtro.desde, hasta: filtro.hasta,
  });
  const marcaActual = ahora || jornadaActiva?.inicio;

  // Desempeño: lo calcula el backend desde el inicio del período (en la hora del navegador).
  const { respuesta: resumen } = usePaginado(pedirResumen, { desde: inicioDelPeriodo(periodo) });
  // Para avisar que un reclamo en curso queda pendiente hasta la próxima jornada.
  const { respuesta: resumenReclamos } = usePaginado(reclamosApi.resumen, sinFiltros);

  useEffect(() => {
    if (!jornadaActiva) return undefined;
    const intervalo = setInterval(() => establecerAhora(Date.now()), 60000);
    return () => clearInterval(intervalo);
  }, [jornadaActiva]);

  useEffect(() => {
    if (!jornadaActiva || !tecnico) return undefined;
    if (!navigator.geolocation) return undefined;
    const registrarPosicion = () => {
      if (navigator.onLine === false) return;
      navigator.geolocation.getCurrentPosition(
        async (posicion) => {
          try {
            await registrarUbicacionTecnico(
              tecnico.id,
              posicion.coords.latitude,
              posicion.coords.longitude,
            );
            establecerError('');
          } catch (causa) {
            establecerError(
              causa?.response?.data?.mensaje
                || 'No se pudo guardar tu ubicación. Verificá la conexión e intentá nuevamente.',
            );
          }
        },
        (causa) => {
          establecerError(causa.code === 1
            ? 'Habilitá el permiso de ubicación del navegador para aparecer en el mapa.'
            : 'No se pudo obtener tu ubicación. Verificá el GPS y volvé a intentar.');
        },
        { enableHighAccuracy: false, maximumAge: 240000, timeout: 10000 },
      );
    };
    registrarPosicion();
    const intervalo = setInterval(registrarPosicion, 300000);
    return () => clearInterval(intervalo);
  }, [jornadaActiva, registrarUbicacionTecnico, tecnico]);

  // Con vehículo, la jornada empieza con el control del vehículo (kilometraje, nivel de combustible, estado y
  // 4 fotos); los reclamos después se comienzan sin control. Sin vehículo, se inicia directamente.
  const comenzarJornada = async () => {
    establecerError('');
    if (vehiculo) {
      establecerControlInicialAbierto(true);
      return;
    }
    try {
      await iniciarJornada(tecnico.id);
    } catch (causa) {
      establecerError(causa?.response?.data?.mensaje || 'No se pudo iniciar la jornada.');
    }
  };

  // Con vehículo, la jornada se cierra con el control final (el backend lo registra también en el
  // vehículo). Sin vehículo asignado no hay control: la jornada se cierra directamente.
  const cerrarJornada = async (control = {}) => {
    try {
      await finalizarJornada(jornadaActiva.id, vehiculo ? control : {});
      establecerControlFinalAbierto(false);
      establecerError('');
    } catch (causa) {
      establecerError(causa?.response?.data?.mensaje || 'No se pudo finalizar la jornada.');
      establecerControlFinalAbierto(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <AccessTimeIcon color="primary" fontSize="large" />
            <Stack spacing={0.5}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Jornada de trabajo</Typography>
              <Typography color="text.secondary">
                {jornadaActiva ? 'Tu jornada está activa.' : 'Iniciá tu jornada para registrar tus horas y servicios.'}
              </Typography>
            </Stack>
          </Stack>
          {jornadaActiva ? (
            <Stack spacing={2}>
              <Alert severity="success">Jornada activa desde {new Date(jornadaActiva.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</Alert>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>{formatearDuracion(jornadaActiva.inicio, marcaActual)}</Typography>
              <Typography variant="body2" color="text.secondary">Tiempo transcurrido</Typography>
              {resumenReclamos?.enProgreso > 0 && (
                <Alert severity="info">
                  Tenés un reclamo en curso. Si finalizás la jornada, lo vas a poder continuar en la próxima.
                </Alert>
              )}
              <Button variant="contained" color="primary" startIcon={<LogoutIcon />} onClick={() => establecerControlFinalAbierto(true)} sx={{ alignSelf: 'flex-start' }}>
                Finalizar jornada
              </Button>
              {(error || (!navigator.geolocation
                && 'Este navegador no permite compartir la ubicación del técnico.'))
                && <Alert severity="error">{error || 'Este navegador no permite compartir la ubicación del técnico.'}</Alert>}
            </Stack>
          ) : (
            <Button variant="contained" startIcon={<LoginIcon />} onClick={comenzarJornada} sx={{ alignSelf: 'flex-start' }}>
              Iniciar jornada
            </Button>
          )}
        </Stack>
      </Paper>

      {vehiculo && (
        <ControlVehiculoDialog
          abierto={controlInicialAbierto}
          titulo="Control inicial de jornada"
          kilometrajeMinimo={vehiculo?.kilometraje?.actual || 0}
          cerrar={() => establecerControlInicialAbierto(false)}
          confirmar={(control) => iniciarJornada(tecnico.id, control)}
        />
      )}
      {vehiculo ? (
        <ControlVehiculoDialog
          abierto={controlFinalAbierto}
          titulo="Control final de jornada"
          kilometrajeMinimo={vehiculo?.kilometraje?.actual || 0}
          cerrar={() => establecerControlFinalAbierto(false)}
          confirmar={cerrarJornada}
        />
      ) : (
        <Dialog open={controlFinalAbierto} onClose={() => establecerControlFinalAbierto(false)} fullWidth maxWidth="xs">
          <DialogTitle>Finalizar jornada</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary">
              No tenés un vehículo asignado, así que no hace falta el control del vehículo. ¿Finalizás la jornada?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => establecerControlFinalAbierto(false)}>Cancelar</Button>
            <Button variant="contained" startIcon={<LogoutIcon />} onClick={() => cerrarJornada()}>Finalizar jornada</Button>
          </DialogActions>
        </Dialog>
      )}

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
            <Stack spacing={0.5}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Desempeño</Typography>
              <Typography variant="body2" color="text.secondary">Horas trabajadas y reclamos que finalizaste en el período.</Typography>
            </Stack>
            <SelectorBuscable
              label="Período"
              size="small"
              sinBorrar
              ariaLabel="Período del desempeño"
              sx={{ width: { xs: '100%', sm: 200 } }}
              opciones={PERIODOS.map((opcion) => ({ id: opcion.valor, nombre: opcion.etiqueta }))}
              valor={periodo}
              alCambiar={establecerPeriodo}
              etiqueta={(opcion) => opcion.nombre}
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Indicador icon={<TimerOutlinedIcon />} etiqueta="Horas trabajadas" valor={resumen ? formatearHoras(resumen.horasTrabajadas) : '–'} color="success.main" />
            <Indicador icon={<CheckCircleIcon />} etiqueta="Reclamos finalizados" valor={resumen?.serviciosEnPeriodo ?? '–'} color="primary.main" />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Jornadas trabajadas</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Filtrá por fecha para ver jornadas anteriores. De cada jornada se muestran los servicios finalizados.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1, alignItems: { sm: 'center' } }}>
          <TextField type="date" size="small" label="Desde" value={desde} onChange={(event) => establecerDesde(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" size="small" label="Hasta" value={hasta} onChange={(event) => establecerHasta(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          {(desde || hasta) && <Button onClick={() => { establecerDesde(''); establecerHasta(''); }}>Quitar filtro</Button>}
        </Stack>
        {filtro.error && <Alert severity="warning" sx={{ mb: 1 }}>{filtro.error}</Alert>}
        <AvisoCarga cargando={cargando} error={errorCarga} />
        {jornadas.length === 0 ? (
          !cargando && <Typography color="text.secondary">{desde || hasta ? 'No hay jornadas entre esas fechas.' : 'Todavía no registraste jornadas.'}</Typography>
        ) : jornadas.map((jornada, indice) => {
          const servicios = (jornada.servicios || []).map((servicio) => servicio.id);
          return (
            <Stack key={jornada.id} spacing={1} sx={{ py: 1.5 }}>
              {indice > 0 && <Divider />}
              <Typography sx={{ fontWeight: 700 }}>Jornada del {new Date(jornada.inicio).toLocaleDateString('es-AR')}</Typography>
              <Typography variant="body2" color="text.secondary">
                Duración: {formatearDuracion(jornada.inicio, jornada.fin || marcaActual)} · Kilometraje final: {jornada.controlFinal?.sinVehiculo ? 'Sin vehículo' : `${kilometrajeFinal(jornada) ?? 'Pendiente'}${kilometrajeFinal(jornada) != null ? ' km' : ''}`}
              </Typography>
              {jornada.controlFinal && !jornada.controlFinal.sinVehiculo && (
                <Typography variant="body2" color="text.secondary">
                  Control final: Combustible {jornada.controlFinal.nivelCombustible || jornada.controlFinal.litros || 'Sin dato'} · Estado: {jornada.controlFinal.estado} · {jornada.controlFinal.imagenes?.length || 0} imágenes
                </Typography>
              )}
              <Typography variant="body2">Servicios: {servicios.length ? servicios.map((servicio) => `#${servicio}`).join(', ') : 'Ninguno'}</Typography>
            </Stack>
          );
        })}
        {(paginacion?.total ?? 0) > 0 && (
          <PaginacionLista
            pagina={pagina}
            total={paginacion.total}
            resultadosPorPagina={resultadosPorPagina}
            establecerPagina={establecerPagina}
            establecerResultadosPorPagina={establecerResultadosPorPagina}
          />
        )}
      </Paper>
    </Stack>
  );
}

// El backend guarda el kilometraje del cierre dentro del control final.
function kilometrajeFinal(jornada) {
  return jornada.controlFinal?.kilometraje ?? jornada.controlFinal?.kilometrajeFinal ?? jornada.kilometrajeFinal ?? null;
}

function Indicador({ icon, etiqueta, valor, color }) {
  return (
    <Paper variant="outlined" sx={{ flex: 1, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Stack sx={{ color }}>{icon}</Stack>
      <Stack spacing={0.25}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>{valor}</Typography>
        <Typography variant="body2" color="text.secondary">{etiqueta}</Typography>
      </Stack>
    </Paper>
  );
}

export default Jornada;
