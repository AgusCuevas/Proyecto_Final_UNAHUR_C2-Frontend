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
import ControlVehiculoDialog from './ControlVehiculoDialog.jsx';
import { calcularRecorridoKm, obtenerParadasTecnico } from '../../services/recorrido.js';

function formatearDuracion(inicio, fin = new Date()) {
  const minutos = Math.max(0, Math.floor((new Date(fin) - new Date(inicio)) / 60000));
  const horas = Math.floor(minutos / 60);
  return `${horas} h ${String(minutos % 60).padStart(2, '0')} min`;
}

function Jornada({ usuario }) {
  const {
    data,
    iniciarJornada,
    finalizarJornada,
    registrarControlVehiculo,
    registrarUbicacionTecnico,
  } = useAppData();
  const [ahora, establecerAhora] = useState(null);
  const [periodo, establecerPeriodo] = useState('semanal');
  const [error, establecerError] = useState('');
  const [controlFinalAbierto, establecerControlFinalAbierto] = useState(false);
  const tecnico = data.usuarios.find((usuarioRegistrado) => usuarioRegistrado.usuario === usuario);
  const vehiculo = data.vehiculos.find((vehiculoRegistrado) => vehiculoRegistrado.tecnicoAsignado === tecnico?.id);
  const jornadas = data.jornadas
    .filter((jornada) => jornada.tecnicoId === tecnico?.id)
    .sort((primera, segunda) => new Date(segunda.inicio) - new Date(primera.inicio));
  const jornadaActiva = jornadas.find((jornada) => jornada.activa);
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

  const serviciosFinalizados = data.reclamos.filter((reclamo) => {
    if (reclamo.tecnicoId !== tecnico?.id || reclamo.estado !== 'Finalizado') return false;
    return !fechaInicioPeriodo
      || new Date(reclamo.finalizadoEn || reclamo.fechaProgramada || reclamo.creadoEn) >= fechaInicioPeriodo;
  });
  const totalServicios = data.reclamos.filter(
    (reclamo) => reclamo.tecnicoId === tecnico?.id && reclamo.estado === 'Finalizado',
  ).length;
  const paradasTecnico = obtenerParadasTecnico(
    tecnico?.id,
    data,
    data.ubicacionesTecnicos.find((item) => item.tecnicoId === tecnico?.id),
  );
  const recorridoSugerido = calcularRecorridoKm(paradasTecnico);
  const kilometrosJornada = jornadaActiva?.kilometrajeInicial != null && vehiculo
    ? Math.max(0, vehiculo.kilometraje.actual - jornadaActiva.kilometrajeInicial)
    : null;

  useEffect(() => {
    if (!jornadaActiva) return undefined;
    const intervalo = setInterval(() => establecerAhora(Date.now()), 60000);
    return () => clearInterval(intervalo);
  }, [jornadaActiva]);

  useEffect(() => {
    if (!jornadaActiva || !tecnico || !navigator.geolocation) return undefined;
    const registrarPosicion = () => {
      if (navigator.onLine === false) return;
      navigator.geolocation.getCurrentPosition(
      (posicion) => registrarUbicacionTecnico(
        tecnico.id,
        posicion.coords.latitude,
        posicion.coords.longitude,
      ),
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 240000, timeout: 10000 },
      );
    };
    registrarPosicion();
    const intervalo = setInterval(registrarPosicion, 300000);
    return () => clearInterval(intervalo);
  }, [jornadaActiva, registrarUbicacionTecnico, tecnico]);

  const serviciosDeJornada = (jornada) => data.reclamos
    .filter((reclamo) => reclamo.jornadaId === jornada.id && reclamo.estado === 'Finalizado')
    .map((reclamo) => reclamo.id);

  const comenzarJornada = () => {
    establecerError('');
    iniciarJornada(tecnico.id);
  };

  const cerrarJornada = (control) => {
    if (!vehiculo) return;
    registrarControlVehiculo(vehiculo.id, control);
    finalizarJornada(jornadaActiva.id, control);
    establecerError('');
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
              {error && <Alert severity="error">{error}</Alert>}
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
        kilometrajeMinimo={vehiculo?.kilometraje.actual || 0}
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
            <Indicador icon={<CheckCircleIcon />} etiqueta="Resueltas en el período" valor={serviciosFinalizados.length} color="success.main" />
            <Indicador icon={<PendingActionsIcon />} etiqueta="Total resueltas" valor={totalServicios} color="primary.main" />
            <Indicador icon={<DoneAllIcon />} etiqueta="Total de servicios realizados" valor={totalServicios} color="secondary.main" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Recorrido sugerido entre los servicios asignados: {recorridoSugerido.toFixed(1)} km
            {kilometrosJornada != null && ` · Recorrido de la jornada: ${kilometrosJornada.toFixed(1)} km`}
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Resumen de servicios por jornada</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
          Solo se muestran los números de servicio finalizados.
        </Typography>
        {jornadas.length === 0 ? (
          <Typography color="text.secondary">Todavía no registraste jornadas.</Typography>
        ) : jornadas.map((jornada, indice) => {
          const servicios = serviciosDeJornada(jornada);
          return (
            <Stack key={jornada.id} spacing={1} sx={{ py: 1.5 }}>
              {indice > 0 && <Divider />}
              <Typography sx={{ fontWeight: 700 }}>Jornada del {new Date(jornada.inicio).toLocaleDateString('es-AR')}</Typography>
              <Typography variant="body2" color="text.secondary">
                Duración: {formatearDuracion(jornada.inicio, jornada.fin || marcaActual)} · Kilometraje final: {jornada.kilometrajeFinal || 'Pendiente'} km
              </Typography>
              {jornada.controlFinal && (
                <Typography variant="body2" color="text.secondary">
                  Control final: {jornada.controlFinal.litros} litros · Estado: {jornada.controlFinal.estado} · Foto registrada
                </Typography>
              )}
              <Typography variant="body2">Servicios: {servicios.length ? servicios.map((servicio) => `#${servicio}`).join(', ') : 'Ninguno'}</Typography>
            </Stack>
          );
        })}
      </Paper>
    </Stack>
  );
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
