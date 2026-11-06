import {
  Alert, Box, Chip, Paper, Stack, Typography,
} from '@mui/material';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { useRecursos } from '../../context/useRecursos.js';
import AvisoCarga from '../comunes/AvisoCarga.jsx';
import GaleriaImagenes from '../comunes/GaleriaImagenes.jsx';

// "2026-11-05" → "05/11/2026" (sin pasar por Date, para que no se corra un día por la zona horaria).
function formatearDia(valor) {
  if (!valor) return 'Sin dato';
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-');
  return dia ? `${dia}/${mes}/${anio}` : 'Sin dato';
}
const formatearKm = (valor) => (valor != null && valor !== '' && Number.isFinite(Number(valor))
  ? `${Number(valor).toLocaleString('es-AR')} km`
  : 'Sin dato');
const formatearFechaHora = (valor) => (valor
  ? new Date(valor).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : 'Sin dato');

function Dato({ etiqueta, children }) {
  return (
    <Box sx={{ flex: 1, minWidth: 140 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{etiqueta}</Typography>
      <Typography>{children}</Typography>
    </Box>
  );
}

function Seccion({ icono, titulo, subtitulo, children }) {
  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {icono}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{titulo}</Typography>
            {subtitulo && <Typography color="text.secondary">{subtitulo}</Typography>}
          </Box>
        </Stack>
        {children}
      </Stack>
    </Paper>
  );
}

// Vehículo asignado (lo mismo que muestra el mobile): datos, estado, seguro, service y el último
// control registrado. GET /vehiculos ya devuelve solo el vehículo asignado al técnico.
function Vehiculo() {
  const { vehiculos, cargando, error } = useRecursos('vehiculos');
  const vehiculo = vehiculos[0];

  if (cargando || error) return <AvisoCarga cargando={cargando} error={error} />;
  if (!vehiculo) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No tenés un vehículo asignado. Consultá con tu coordinador.</Typography>
      </Paper>
    );
  }

  const enServicio = vehiculo.enServicio !== false;
  const seguro = vehiculo.seguro || {};
  const seguroVencido = Boolean(seguro.vence) && new Date(`${String(seguro.vence).slice(0, 10)}T23:59:59`) < new Date();
  const control = vehiculo.ultimoControl || vehiculo.controles?.at(-1);

  return (
    <Stack spacing={3}>
      <Seccion
        icono={<DirectionsCarIcon color="primary" fontSize="large" />}
        titulo={vehiculo.modelo || vehiculo.marca || 'Vehículo asignado'}
        subtitulo={vehiculo.patente}
      >
        <Chip
          label={enServicio ? 'En servicio' : 'Fuera de servicio'}
          color={enServicio ? 'success' : 'error'}
          variant="outlined"
          sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Dato etiqueta="Kilometraje actual">{formatearKm(vehiculo.kilometraje?.actual)}</Dato>
          <Dato etiqueta="Último service">{formatearDia(vehiculo.ultimoService)}</Dato>
        </Stack>
        {vehiculo.detalle && <Dato etiqueta="Detalle">{vehiculo.detalle}</Dato>}
      </Seccion>

      <Seccion icono={<VerifiedUserOutlinedIcon color="primary" fontSize="large" />} titulo="Seguro">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Dato etiqueta="Compañía">{seguro.compania || 'Sin dato'}</Dato>
          <Dato etiqueta="Póliza">{seguro.poliza || 'Sin dato'}</Dato>
          <Box sx={{ flex: 1, minWidth: 140 }}>
            <Dato etiqueta="Vencimiento">{formatearDia(seguro.vence)}</Dato>
            {seguroVencido && <Chip size="small" color="error" label="Vencido" sx={{ mt: 0.5 }} />}
          </Box>
        </Stack>
      </Seccion>

      <Seccion icono={<AssignmentTurnedInOutlinedIcon color="primary" fontSize="large" />} titulo="Último control">
        {control ? (
          <>
            <Typography color="text.secondary">{formatearFechaHora(control.fechaControl)}</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Dato etiqueta="Kilometraje">{formatearKm(control.kilometraje)}</Dato>
              <Dato etiqueta="Litros">{control.litros ?? 'Sin dato'}</Dato>
              {control.estado && <Dato etiqueta="Estado informado">{control.estado}</Dato>}
            </Stack>
            {control.observaciones && <Dato etiqueta="Observaciones">{control.observaciones}</Dato>}
            {control.imagenes?.length > 0 && <GaleriaImagenes ids={control.imagenes} descripcion="Foto del control" />}
          </>
        ) : (
          <Alert severity="info">Todavía no hay controles registrados.</Alert>
        )}
      </Seccion>
    </Stack>
  );
}

export default Vehiculo;
