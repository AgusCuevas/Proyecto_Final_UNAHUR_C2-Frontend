import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useState } from 'react';
import { useAppData } from '../../context/useAppData.js';
import { useRecursos } from '../../context/useRecursos.js';
import { useCargaDiferida } from '../../context/useCargaDiferida.js';
import { usuariosApi } from '../../services/api.js';

// Lista del selector "Asignar técnico": se pide recién al abrir el diálogo.
const cargarTecnicosActivos = async () => (await usuariosApi.listar())
  .filter((usuario) => usuario.rol === 'Tecnico' && usuario.activo);
import FichaDetalle from '../comunes/FichaDetalle.jsx';
import GaleriaImagenes from '../comunes/GaleriaImagenes.jsx';

// Las fechas llegan como 'AAAA-MM-DD' o como ISO completo desde MongoDB.
const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const fechaLocal = new Date(`${String(fecha).slice(0, 10)}T12:00:00`);
  return Number.isNaN(fechaLocal.getTime()) ? String(fecha) : fechaLocal.toLocaleDateString('es-AR');
};

const formatearKm = (km) => (km != null && km !== '' ? `${Number(km).toLocaleString('es-AR')} km` : '');

const estadoVehiculo = (vehiculo) => {
  if (vehiculo.enServicio === false) return { label: 'Fuera de servicio', color: 'error' };
  return vehiculo.disponible === false
    ? { label: 'No disponible', color: 'default' }
    : { label: 'Disponible', color: 'success' };
};

const seguroVencido = (vehiculo) => Boolean(vehiculo.seguro?.vence)
  && String(vehiculo.seguro.vence).slice(0, 10) < new Date().toISOString().slice(0, 10);

const controlesUltimos30Dias = (vehiculo) => (vehiculo.controles || [])
  .map((control) => ({ ...control, fecha: control.fechaControl || control.fecha, imagenes: control.imagenes || [] }))
  .filter((control) => control.imagenes.length > 0
    && control.fecha
    && Date.now() - new Date(control.fecha).getTime() <= 30 * 24 * 60 * 60 * 1000)
  .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

function Vehiculos({ gestionable = false, accionNuevo }) {
  const { actualizarAsignacionVehiculo } = useAppData();
  // GET /vehiculos: cada vehículo ya trae su técnico.
  const data = useRecursos('vehiculos');
  const [busqueda, establecerBusqueda] = useState('');
  const [filtroAsignacion, establecerFiltroAsignacion] = useState('Todos');
  const [vehiculoSeleccionado, establecerVehiculoSeleccionado] = useState(null);
  const [asignacionPendiente, establecerAsignacionPendiente] = useState(null);
  const [guardando, establecerGuardando] = useState(false);
  const [error, establecerError] = useState('');

  const tecnicos = useCargaDiferida(cargarTecnicosActivos, Boolean(asignacionPendiente)) || [];
  const nombreTecnico = (tecnicoId) => (
    data.vehiculos.find((vehiculo) => vehiculo.tecnico?.id === tecnicoId)?.tecnico
    || tecnicos.find((tecnico) => tecnico.id === tecnicoId)
  )?.nombre || '';

  const termino = busqueda.trim().toLocaleLowerCase('es');
  const vehiculosFiltrados = data.vehiculos
    .filter((vehiculo) => {
      const coincideAsignacion = filtroAsignacion === 'Todos'
        || (filtroAsignacion === 'Con técnico' ? vehiculo.tecnicoAsignado != null : vehiculo.tecnicoAsignado == null);
      const texto = [vehiculo.patente, vehiculo.marca, vehiculo.modelo, vehiculo.tecnico?.nombre]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es');
      return coincideAsignacion && texto.includes(termino);
    })
    .sort((a, b) => String(a.patente).localeCompare(String(b.patente), 'es'));

  const vehiculoDetalle = vehiculoSeleccionado
    ? data.vehiculos.find((vehiculo) => vehiculo.id === vehiculoSeleccionado.id) || vehiculoSeleccionado
    : null;

  const vehiculoAnteriorDelTecnico = asignacionPendiente?.tecnicoId
    ? data.vehiculos.find((item) => (
      item.tecnicoAsignado === asignacionPendiente.tecnicoId && item.id !== asignacionPendiente.vehiculo.id
    ))
    : null;

  const abrirAsignacion = (vehiculo) => {
    establecerError('');
    establecerAsignacionPendiente({ vehiculo, tecnicoId: vehiculo.tecnicoAsignado ?? null });
  };

  const confirmarAsignacion = async () => {
    if (!asignacionPendiente) return;
    establecerGuardando(true);
    try {
      await actualizarAsignacionVehiculo(asignacionPendiente.vehiculo.id, asignacionPendiente.tecnicoId);
      establecerAsignacionPendiente(null);
    } catch (causa) {
      establecerError(causa?.response?.data?.mensaje || 'No se pudo cambiar la asignación del vehículo.');
    } finally {
      establecerGuardando(false);
    }
  };

  const seccionesDetalle = vehiculoDetalle ? [
    {
      titulo: 'Asignación',
      icono: <EngineeringOutlinedIcon fontSize="small" />,
      campos: [
        ['Técnico asignado', vehiculoDetalle.tecnico?.nombre || 'Sin técnico asignado'],
        ['Estado', estadoVehiculo(vehiculoDetalle).label],
      ],
    },
    {
      titulo: 'Kilometraje y mantenimiento',
      icono: <SpeedOutlinedIcon fontSize="small" />,
      campos: [
        ['Kilometraje inicial', formatearKm(vehiculoDetalle.kilometraje?.inicial)],
        ['Kilometraje actual', formatearKm(vehiculoDetalle.kilometraje?.actual)],
        ['Último registro de km', formatearFecha(vehiculoDetalle.kilometraje?.actualizadoEn)],
        ['Último service', formatearFecha(vehiculoDetalle.ultimoService)],
      ],
    },
    {
      titulo: 'Seguro',
      icono: <VerifiedUserOutlinedIcon fontSize="small" />,
      campos: [
        ['Compañía', vehiculoDetalle.seguro?.compania],
        ['Póliza', vehiculoDetalle.seguro?.poliza],
        ['Vencimiento', `${formatearFecha(vehiculoDetalle.seguro?.vence)}${seguroVencido(vehiculoDetalle) ? ' (vencido)' : ''}`],
      ],
    },
    {
      titulo: 'Detalle',
      icono: <DirectionsCarOutlinedIcon fontSize="small" />,
      campos: [['Observaciones', vehiculoDetalle.detalle, { anchoCompleto: true }]],
    },
  ] : [];
  const historialImagenes = vehiculoDetalle ? controlesUltimos30Dias(vehiculoDetalle) : [];

  return (
    <Stack spacing={2.5}>
      {error && !asignacionPendiente && (
        <Alert severity="error" onClose={() => establecerError('')}>{error}</Alert>
      )}

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
          >
            <TextField
              fullWidth
              label="Buscar vehículos"
              placeholder="Patente, marca, modelo o técnico"
              value={busqueda}
              onChange={(evento) => establecerBusqueda(evento.target.value)}
              sx={{ maxWidth: { md: 520 } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start"><SearchIcon /></InputAdornment>
                  ),
                },
              }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                select
                label="Asignación"
                value={filtroAsignacion}
                onChange={(evento) => establecerFiltroAsignacion(evento.target.value)}
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="Con técnico">Con técnico</MenuItem>
                <MenuItem value="Sin técnico">Sin técnico</MenuItem>
              </TextField>
              {accionNuevo}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Vehículos</Typography>
            <Typography variant="body2" color="text.secondary">
              {vehiculosFiltrados.length} {vehiculosFiltrados.length === 1 ? 'resultado' : 'resultados'}
            </Typography>
          </Stack>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 820 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Vehículo</TableCell>
                  <TableCell>Patente</TableCell>
                  <TableCell>Técnico asignado</TableCell>
                  <TableCell align="right">Kilometraje</TableCell>
                  <TableCell>Vence seguro</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehiculosFiltrados.map((vehiculo) => {
                  const estado = estadoVehiculo(vehiculo);
                  const descripcion = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ');
                  return (
                    <TableRow key={vehiculo.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{descripcion || '—'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{vehiculo.patente}</TableCell>
                      <TableCell>
                        {vehiculo.tecnico?.nombre || (
                          <Typography variant="body2" color="text.disabled">Sin asignar</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {formatearKm(vehiculo.kilometraje?.actual) || '—'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" color={seguroVencido(vehiculo) ? 'error' : 'text.primary'}>
                          {formatearFecha(vehiculo.seguro?.vence) || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={estado.label} color={estado.color} />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Ver información">
                          <IconButton
                            aria-label={`Ver información del vehículo ${vehiculo.patente}`}
                            onClick={() => establecerVehiculoSeleccionado(vehiculo)}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {gestionable && (
                          <Tooltip title="Asignar técnico">
                            <IconButton
                              aria-label={`Asignar técnico al vehículo ${vehiculo.patente}`}
                              onClick={() => abrirAsignacion(vehiculo)}
                            >
                              <AssignmentIndOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {vehiculosFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay vehículos que coincidan con la búsqueda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <FichaDetalle
        abierto={Boolean(vehiculoDetalle)}
        alCerrar={() => establecerVehiculoSeleccionado(null)}
        titulo={vehiculoDetalle && ([vehiculoDetalle.marca, vehiculoDetalle.modelo].filter(Boolean).join(' ') || vehiculoDetalle.patente)}
        subtitulo={vehiculoDetalle && `Patente ${vehiculoDetalle.patente}`}
        icono={<DirectionsCarIcon />}
        chips={vehiculoDetalle ? [
          { label: 'Vehículo', color: 'primary', variant: 'outlined' },
          estadoVehiculo(vehiculoDetalle),
          ...(seguroVencido(vehiculoDetalle) ? [{ label: 'Seguro vencido', color: 'error', variant: 'outlined' }] : []),
        ] : []}
        secciones={seccionesDetalle}
        aviso={(
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Imágenes de jornadas</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Historial de los últimos 30 días. Las imágenes más antiguas se eliminan automáticamente.
            </Typography>
            {historialImagenes.length === 0 ? (
              <Typography variant="body2" color="text.disabled">
                No hay imágenes de jornadas registradas en los últimos 30 días.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {historialImagenes.map((control, indice) => (
                  <Box key={`${control.fecha || 'sin-fecha'}-${indice}`}>
                    <Typography variant="subtitle2" sx={{ mb: 0.75 }}>
                      Jornada del {control.fecha
                        ? new Date(control.fecha).toLocaleDateString('es-AR')
                        : 'fecha no informada'}
                    </Typography>
                    <GaleriaImagenes
                      key={control.imagenes.join()}
                      ids={control.imagenes}
                      descripcion="Imagen de la jornada"
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
        acciones={(
          <>
            <Button onClick={() => establecerVehiculoSeleccionado(null)}>Cerrar</Button>
            {gestionable && (
              <Button
                variant="contained"
                startIcon={<AssignmentIndOutlinedIcon />}
                onClick={() => {
                  abrirAsignacion(vehiculoDetalle);
                  establecerVehiculoSeleccionado(null);
                }}
              >
                Asignar técnico
              </Button>
            )}
          </>
        )}
      />

      <Dialog
        open={Boolean(asignacionPendiente)}
        onClose={() => !guardando && establecerAsignacionPendiente(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Asignar técnico</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary">
              Vehículo {asignacionPendiente?.vehiculo.patente} · Técnico actual:{' '}
              {nombreTecnico(asignacionPendiente?.vehiculo.tecnicoAsignado) || 'sin asignar'}
            </Typography>
            <TextField
              select
              label="Técnico"
              value={asignacionPendiente?.tecnicoId ?? ''}
              onChange={(evento) => establecerAsignacionPendiente((actual) => ({
                ...actual,
                tecnicoId: Number(evento.target.value) || null,
              }))}
            >
              <MenuItem value="">Sin asignar</MenuItem>
              {tecnicos.map((tecnico) => (
                <MenuItem key={tecnico.id} value={tecnico.id}>{tecnico.nombre}</MenuItem>
              ))}
            </TextField>
            {vehiculoAnteriorDelTecnico && (
              <Alert severity="warning">
                {nombreTecnico(asignacionPendiente.tecnicoId)} ya tiene asignado el vehículo {vehiculoAnteriorDelTecnico.patente}, que quedará sin técnico.
              </Alert>
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => establecerAsignacionPendiente(null)} disabled={guardando}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={confirmarAsignacion}
            disabled={guardando || asignacionPendiente?.tecnicoId === (asignacionPendiente?.vehiculo.tecnicoAsignado ?? null)}
          >
            {guardando ? 'Guardando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default Vehiculos;
