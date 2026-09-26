import { useEffect, useState } from 'react';
import { Alert, Button, Divider, Paper, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAppData } from '../../context/useAppData.js';
import ControlVehiculoDialog from './ControlVehiculoDialog.jsx';

function formatearDuracion(inicio, fin = new Date()) {
  const minutos = Math.max(0, Math.floor((new Date(fin) - new Date(inicio)) / 60000));
  const horas = Math.floor(minutos / 60);
  return `${horas} h ${String(minutos % 60).padStart(2, '0')} min`;
}

function Jornada({ usuario }) {
  const { data, iniciarJornada, finalizarJornada, registrarControlVehiculo } = useAppData();
  const [ahora, establecerAhora] = useState(null);
  const [error, establecerError] = useState('');
  const [controlFinalAbierto, establecerControlFinalAbierto] = useState(false);
  const tecnico = data.usuarios.find((usuarioRegistrado) => usuarioRegistrado.usuario === usuario);
  const vehiculo = data.vehiculos.find((vehiculoRegistrado) => vehiculoRegistrado.tecnicoAsignado === tecnico?.id);
  const jornadas = data.jornadas
    .filter((jornada) => jornada.tecnicoId === tecnico?.id)
    .sort((primera, segunda) => new Date(segunda.inicio) - new Date(primera.inicio));
  const jornadaActiva = jornadas.find((jornada) => jornada.activa);
  const marcaActual = ahora || jornadaActiva?.inicio;
  const serviciosDeJornada = (jornada) => data.reclamos
    .filter((reclamo) => reclamo.jornadaId === jornada.id && reclamo.estado === 'Finalizado')
    .map((reclamo) => reclamo.id);

  useEffect(() => {
    if (!jornadaActiva) return undefined;
    const intervalo = setInterval(() => establecerAhora(Date.now()), 60000);
    return () => clearInterval(intervalo);
  }, [jornadaActiva]);

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
              <Typography sx={{ fontWeight: 700 }}>
                Jornada del {new Date(jornada.inicio).toLocaleDateString('es-AR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Duración: {formatearDuracion(jornada.inicio, jornada.fin || marcaActual)} · Kilometraje final: {jornada.kilometrajeFinal || 'Pendiente'} km
              </Typography>
              {jornada.controlFinal && (
                <Typography variant="body2" color="text.secondary">
                  Control final: {jornada.controlFinal.litros} litros · Estado: {jornada.controlFinal.estado} · Foto registrada
                </Typography>
              )}
              <Typography variant="body2">
                Servicios: {servicios.length ? servicios.map((servicio) => `#${servicio}`).join(', ') : 'Ninguno'}
              </Typography>
            </Stack>
          );
        })}
      </Paper>
    </Stack>
  );
}

export default Jornada;
