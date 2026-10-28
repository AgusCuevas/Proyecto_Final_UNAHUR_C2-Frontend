import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Divider,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { useAppData } from '../../context/useAppData.js';
import { usePaginado } from '../../context/usePaginado.js';
import { jornadasApi } from '../../services/api.js';
import PaginacionLista from '../comunes/PaginacionLista.jsx';
import AvisoCarga from '../comunes/AvisoCarga.jsx';

// Contadores del período elegido: { totalServicios, serviciosEnPeriodo } (GET /jornadas/resumen).
const pedirResumen = ({ desde }) => jornadasApi.resumen(desde);
import ControlVehiculoDialog from './ControlVehiculoDialog.jsx';

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
    registrarControlVehiculo,
    registrarUbicacionTecnico,
  } = useAppData();
  const [ahora, establecerAhora] = useState(null);
  const [periodo, establecerPeriodo] = useState('semanal');
  const [error, establecerError] = useState('');
  const [controlFinalAbierto, establecerControlFinalAbierto] = useState(false);
  const [pagina, establecerPagina] = useState(1);
  const [resultadosPorPagina, establecerResultadosPorPagina] = useState(10);
  const tecnico = sesion.usuario;
  const { vehiculo, jornadaActiva } = sesion;
  // Paginación en el servidor: sus jornadas (las más nuevas primero), cada una con sus servicios.
  const {
    datos: jornadas, paginacion, cargando, error: errorCarga,
  } = usePaginado(jornadasApi.pagina, { pagina, limite: resultadosPorPagina });
  const marcaActual = ahora || jornadaActiva?.inicio;
  const fechaInicioPeriodo = periodo === 'todos' ? null : new Date();

  if (fechaInicioPeriodo) {
    fechaInicioPeriodo.setHours(0, 0, 0, 0);
    if (periodo === 'semanal') {
      const dia = fechaInicioPeriodo.getDay();
      fechaInicioPeriodo.setDate(fechaInicioPeriodo.getDate() - (dia === 0 ? 6 : dia - 1));
    }
    if (periodo === 'mensual') fechaInicioPeriodo.setDate(1);
    if (periodo === 'anual') fechaInicioPeriodo.setMonth(0, 1);
  }

  // Los contadores los calcula el backend: el navegador manda el inicio del período en su hora local.
  const { respuesta: resumen } = usePaginado(pedirResumen, { desde: fechaInicioPeriodo?.toISOString() || '' });
  const serviciosEnPeriodo = resumen?.serviciosEnPeriodo ?? 0;
  const totalServicios = resumen?.totalServicios ?? 0;

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

  const comenzarJornada = async () => {
    establecerError('');
    try {
      await iniciarJornada(tecnico.id);
    } catch (causa) {
      establecerError(causa?.response?.data?.mensaje || 'No se pudo iniciar la jornada.');
    }
  };

  const cerrarJornada = async (control) => {
    if (!vehiculo) return;
    try {
      await registrarControlVehiculo(vehiculo.id, control);
      await finalizarJornada(jornadaActiva.id, control);
      establecerError('');
    } catch (causa) {
      establecerError(causa?.response?.data?.mensaje || 'No se pudo finalizar la jornada.');
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

      <ControlVehiculoDialog
        abierto={controlFinalAbierto}
        titulo="Control final de jornada"
        kilometrajeMinimo={vehiculo?.kilometraje?.actual || 0}
        cerrar={() => establecerControlFinalAbierto(false)}
        confirmar={cerrarJornada}
      />

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
            <Stack spacing={0.5}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Desempeño</Typography>
              <Typography variant="body2" color="text.secondary">Resoluciones realizadas por período.</Typography>
            </Stack>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <Select value={periodo} onChange={(event) => establecerPeriodo(event.target.value)} aria-label="Período del desempeño">
                <MenuItem value="semanal">Esta semana</MenuItem>
                <MenuItem value="mensual">Este mes</MenuItem>
                <MenuItem value="anual">Este año</MenuItem>
                <MenuItem value="todos">Todo el histórico</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Indicador icon={<CheckCircleIcon />} etiqueta="Resueltas en el período" valor={serviciosEnPeriodo} color="success.main" />
            <Indicador icon={<PendingActionsIcon />} etiqueta="Total resueltas" valor={totalServicios} color="primary.main" />
            <Indicador icon={<DoneAllIcon />} etiqueta="Total de servicios realizados" valor={totalServicios} color="secondary.main" />
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Resumen de servicios por jornada</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Solo se muestran los números de servicio finalizados.
        </Typography>
        <AvisoCarga cargando={cargando} error={errorCarga} />
        {jornadas.length === 0 ? (
          !cargando && <Typography color="text.secondary">Todavía no registraste jornadas.</Typography>
        ) : jornadas.map((jornada, indice) => {
          const servicios = (jornada.servicios || []).map((servicio) => servicio.id);
          return (
            <Stack key={jornada.id} spacing={1} sx={{ py: 1.5 }}>
              {indice > 0 && <Divider />}
              <Typography sx={{ fontWeight: 700 }}>Jornada del {new Date(jornada.inicio).toLocaleDateString('es-AR')}</Typography>
              <Typography variant="body2" color="text.secondary">
                Duración: {formatearDuracion(jornada.inicio, jornada.fin || marcaActual)} · Kilometraje final: {kilometrajeFinal(jornada) ?? 'Pendiente'}{kilometrajeFinal(jornada) != null ? ' km' : ''}
              </Typography>
              {jornada.controlFinal && (
                <Typography variant="body2" color="text.secondary">
                  Control final: {jornada.controlFinal.litros} litros · Estado: {jornada.controlFinal.estado} · {jornada.controlFinal.imagenes?.length || 0} imágenes
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
