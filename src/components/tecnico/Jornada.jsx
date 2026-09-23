import { useEffect, useState } from 'react';
import { Alert, Box, FormControl, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { useAppData } from '../../context/useAppData.js';

function formatearDuracion(inicio, fin = new Date()) {
  const minutos = Math.max(0, Math.floor((new Date(fin) - new Date(inicio)) / 60000));
  const horas = Math.floor(minutos / 60);
  return `${horas} h ${String(minutos % 60).padStart(2, '0')} min`;
}

function Jornada({ usuario }) {
  const { data } = useAppData();
  const [ahora, establecerAhora] = useState(null);
  const [periodo, establecerPeriodo] = useState('semanal');
  const tecnico = data.usuarios.find((usuarioRegistrado) => usuarioRegistrado.usuario === usuario);
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
  useEffect(() => {
    if (!jornadaActiva) return undefined;
    const intervalo = setInterval(() => establecerAhora(Date.now()), 60000);
    return () => clearInterval(intervalo);
  }, [jornadaActiva]);

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <AccessTimeIcon color="primary" fontSize="large" />
            <Stack spacing={0.5}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Resumen de servicios</Typography>
              <Typography color="text.secondary">
                Consultá tus resoluciones y el resumen de tus jornadas registradas.
              </Typography>
            </Stack>
          </Stack>
          {jornadaActiva && (
            <Alert severity="info">
              Jornada actual iniciada a las {new Date(jornadaActiva.inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · Tiempo transcurrido: {formatearDuracion(jornadaActiva.inicio, marcaActual)}
            </Alert>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>Desempeño</Typography>
              <Typography variant="body2" color="text.secondary">Resoluciones realizadas por período.</Typography>
            </Box>
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
        </Stack>
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
