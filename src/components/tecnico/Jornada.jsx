import { useEffect, useState } from 'react';
import { Alert, Button, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAppData } from '../../context/useAppData.js';

function formatearDuracion(inicio, fin = new Date()) {
  const minutos = Math.max(0, Math.floor((new Date(fin) - new Date(inicio)) / 60000));
  const horas = Math.floor(minutos / 60);
  return `${horas} h ${String(minutos % 60).padStart(2, '0')} min`;
}

function Jornada({ usuario }) {
  const { data, iniciarJornada, finalizarJornada } = useAppData();
  const [ahora, establecerAhora] = useState(null);
  const [kilometrajeFinal, establecerKilometrajeFinal] = useState('');
  const [error, establecerError] = useState('');
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

  const cerrarJornada = (event) => {
    event.preventDefault();
    const kilometros = Number(kilometrajeFinal);
    if (!kilometrajeFinal || kilometros < vehiculo.kilometraje.actual) {
      establecerError(`Ingresá un kilometraje igual o mayor a ${vehiculo.kilometraje.actual} km.`);
      return;
    }
    finalizarJornada(jornadaActiva.id, kilometros);
    establecerKilometrajeFinal('');
    establecerError('');
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
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
              <Stack component="form" onSubmit={cerrarJornada} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
                <TextField
                  label="Kilometraje final"
                  type="number"
                  value={kilometrajeFinal}
                  onChange={(event) => establecerKilometrajeFinal(event.target.value)}
                  inputProps={{ min: vehiculo?.kilometraje.actual || 0 }}
                  helperText={`Actual: ${vehiculo?.kilometraje.actual || 0} km`}
                  size="small"
                  required
                />
                <Button type="submit" variant="contained" color="primary" startIcon={<LogoutIcon />} sx={{ minHeight: 40 }}>
                  Finalizar jornada
                </Button>
              </Stack>
              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          ) : (
            <Button variant="contained" startIcon={<LoginIcon />} onClick={comenzarJornada} sx={{ alignSelf: 'flex-start' }}>
              Iniciar jornada
            </Button>
          )}
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
              <Typography sx={{ fontWeight: 700 }}>
                Jornada del {new Date(jornada.inicio).toLocaleDateString('es-AR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Duración: {formatearDuracion(jornada.inicio, jornada.fin || marcaActual)} · Kilometraje final: {jornada.kilometrajeFinal || 'Pendiente'} km
              </Typography>
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
