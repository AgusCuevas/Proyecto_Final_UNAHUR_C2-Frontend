import { useState } from 'react';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import { useAppData } from '../../context/useAppData.js';
import { useRecursos } from '../../context/useRecursos.js';
import FichaDetalle from '../comunes/FichaDetalle.jsx';
import GaleriaImagenes from '../comunes/GaleriaImagenes.jsx';

const esOrdenDeServicio = (reclamo) => Boolean(reclamo)
  && (reclamo.esOrden || reclamo.tipo === 'Instalación' || reclamo.tipo === 'Baja de servicio');

const formatearFecha = (fecha, { conHora = false } = {}) => {
  if (!fecha) return '';
  const texto = String(fecha);
  const valor = new Date(texto.length === 10 ? `${texto}T12:00:00` : texto);
  if (Number.isNaN(valor.getTime())) return texto;
  return conHora && texto.length > 10
    ? valor.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
    : valor.toLocaleDateString('es-AR');
};

const colorPrioridad = { Urgente: 'error', Alta: 'warning', Normal: 'default' };

function Reclamos({ formularioAbierto, establecerFormularioAbierto }) {
  const formularioNuevoInicial = {
    clienteId: '',
    tipo: '',
    prioridad: 'Normal',
    descripcion: '',
    fechaProgramada: '',
    tecnicoId: '',
  };
  const [formularioNuevo, establecerFormularioNuevo] = useState(formularioNuevoInicial);
  const [errorAlta, establecerErrorAlta] = useState('');
  const [guardandoAlta, establecerGuardandoAlta] = useState(false);
  const [reclamoParaAsignar, establecerReclamoParaAsignar] = useState(null);
  const [reclamoAbiertoId, establecerReclamoAbiertoId] = useState(null);
  const [reclamoEnNotas, establecerReclamoEnNotas] = useState(null);
  const [reclamoExpandido, establecerReclamoExpandido] = useState(null);
  const [notasCoordinador, establecerNotasCoordinador] = useState('');
  const [errorNotas, establecerErrorNotas] = useState('');
  const [tecnicoSeleccionado, establecerTecnicoSeleccionado] = useState('');
  const [pagina, establecerPagina] = useState(1);
  const [filtros, establecerFiltros] = useState({
    estado: 'Abierto',
    tecnicoId: 'Todos',
    desde: '',
    hasta: '',
  });
  const { actualizarAsignacion, actualizarEstado, crearReclamo: crearReclamoData } = useAppData();
  const data = useRecursos('reclamos', 'usuarios', 'clientes');
  const reclamos = data.reclamos;

  const esModoOrden = formularioAbierto === 'orden';
  const mostrarFormulario = Boolean(formularioAbierto);

  const tecnicos = data.usuarios.filter(
    (usuario) => usuario.rol === 'Tecnico' && usuario.activo,
  );

  const nombreCliente = (clienteId) => data.clientes.find(
    (cliente) => cliente.id === clienteId,
  )?.nombre || 'Cliente no encontrado';

  const todosLosTecnicos = data.usuarios.filter((usuario) => usuario.rol === 'Tecnico');
  const nombreTecnico = (tecnicoId) => todosLosTecnicos.find(
    (tecnico) => tecnico.id === tecnicoId,
  )?.nombre || 'Sin asignar';

  const colorEstado = {
    Abierto: 'warning.main',
    Asignado: 'info.main',
    'En progreso': 'secondary.main',
    Bloqueado: 'error.main',
    Finalizado: 'success.main',
  };
  const colorChipEstado = {
    Abierto: 'warning',
    Asignado: 'info',
    'En progreso': 'secondary',
    Bloqueado: 'error',
    Finalizado: 'success',
  };

  const abrirEdicionTecnico = (reclamo) => {
    establecerTecnicoSeleccionado(reclamo.tecnicoId ? String(reclamo.tecnicoId) : '');
    establecerReclamoParaAsignar(reclamo);
  };

  const actualizarFiltro = (campo, valor) => {
    establecerFiltros((actuales) => ({ ...actuales, [campo]: valor }));
    establecerPagina(1);
  };

  const reclamosFiltrados = reclamos.filter((reclamo) => {
    const fechaCreacion = new Date(reclamo.creadoEn).getTime();
    const desde = filtros.desde ? new Date(filtros.desde).getTime() : null;
    const hasta = filtros.hasta ? new Date(filtros.hasta).getTime() : null;
    const coincideEstado = filtros.estado === 'Todos' || reclamo.estado === filtros.estado;
    const coincideTecnico = filtros.tecnicoId === 'Todos'
      || (filtros.tecnicoId === 'Sin asignar' && !reclamo.tecnicoId)
      || reclamo.tecnicoId === Number(filtros.tecnicoId);

    return coincideEstado
      && coincideTecnico
      && (!desde || fechaCreacion >= desde)
      && (!hasta || fechaCreacion <= hasta);
  }).sort((primero, segundo) => segundo.id - primero.id);
  const cantidadPaginas = Math.ceil(reclamosFiltrados.length / 10);
  const paginaActual = Math.min(pagina, Math.max(cantidadPaginas, 1));
  const reclamosVisibles = reclamosFiltrados.slice((paginaActual - 1) * 10, paginaActual * 10);

  const reclamoAbierto = reclamoAbiertoId != null
    ? reclamos.find((reclamo) => reclamo.id === reclamoAbiertoId) || null
    : null;
  const tecnicoDelReclamoAbierto = reclamoAbierto
    ? todosLosTecnicos.find((tecnico) => tecnico.id === reclamoAbierto.tecnicoId)
    : null;
  const clienteDelReclamoAbierto = reclamoAbierto
    ? data.clientes.find((cliente) => cliente.id === reclamoAbierto.clienteId)
    : null;

  const abrirReclamo = (reclamo) => establecerReclamoExpandido((actual) => (
    actual?.id === reclamo.id ? null : reclamo
  ));

  const abrirEdicionNotas = (reclamo) => {
    establecerReclamoEnNotas(reclamo);
    establecerNotasCoordinador(reclamo.notasCoordinador || '');
    establecerErrorNotas('');
  };

  const guardarNotas = async (event) => {
    event.preventDefault();
    if (!reclamoEnNotas) return;
    let reclamoActualizado;
    try {
      reclamoActualizado = await actualizarEstado(reclamoEnNotas.id, {
        notasCoordinador: notasCoordinador.trim(),
      });
    } catch (causa) {
      establecerErrorNotas(causa?.response?.data?.mensaje || 'No se pudieron guardar las notas. Intentá nuevamente.');
      return;
    }
    establecerReclamoExpandido((actual) => (
      actual?.id === reclamoActualizado.id ? reclamoActualizado : actual
    ));
    establecerReclamoEnNotas(null);
  };

  const guardarNuevoReclamo = async (event) => {
    event.preventDefault();
    const cliente = data.clientes.find((item) => String(item.id) === String(formularioNuevo.clienteId));
    if (!cliente) {
      establecerErrorAlta('Seleccioná un cliente.');
      return;
    }

    const tipoFinal = (esModoOrden ? (formularioNuevo.tipo || 'Instalación') : formularioNuevo.tipo).trim();
    if (!tipoFinal) {
      establecerErrorAlta(esModoOrden ? 'Indicá el tipo de orden.' : 'Indicá el tipo de reclamo.');
      return;
    }

    establecerErrorAlta('');
    establecerGuardandoAlta(true);
    try {
      await crearReclamoData({
        clienteId: Number(cliente.id),
        tipo: tipoFinal,
        prioridad: formularioNuevo.prioridad,
        descripcion: formularioNuevo.descripcion.trim(),
        fechaProgramada: formularioNuevo.fechaProgramada || new Date().toISOString().slice(0, 10),
        agrupacionGeografica: cliente.zona || '',
        tecnicoId: formularioNuevo.tecnicoId ? Number(formularioNuevo.tecnicoId) : null,
        esOrden: esModoOrden,
      });
      establecerFormularioNuevo(formularioNuevoInicial);
      establecerFormularioAbierto(false);
    } catch (causa) {
      establecerErrorAlta(
        causa?.response?.data?.mensaje
          || (esModoOrden
            ? 'No se pudo guardar la orden. Revisá los datos e intentá nuevamente.'
            : 'No se pudo guardar el reclamo. Revisá los datos e intentá nuevamente.'),
      );
    } finally {
      establecerGuardandoAlta(false);
    }
  };

  return (
    <Stack spacing={3}>
      {mostrarFormulario && (
        <Card>
          <CardContent>
            <Box component="form" onSubmit={guardarNuevoReclamo}>
              <Stack spacing={2}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {esModoOrden ? 'Alta de orden de servicio' : 'Alta de reclamo'}
                  </Typography>
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<CloseIcon />}
                    onClick={() => establecerFormularioAbierto(false)}
                  >
                    Cerrar
                  </Button>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <FormControl fullWidth required>
                    <InputLabel id="cliente-label">Cliente</InputLabel>
                    <Select
                      labelId="cliente-label"
                      value={formularioNuevo.clienteId}
                      onChange={(evento) => establecerFormularioNuevo((actual) => ({ ...actual, clienteId: evento.target.value }))}
                      label="Cliente"
                    >
                      {data.clientes.filter((cliente) => cliente.activo !== false).map((cliente) => (
                        <MenuItem key={cliente.id} value={cliente.id}>
                          {cliente.nombre}{cliente.zona ? ` - ${cliente.zona}` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {esModoOrden ? (
                    <FormControl fullWidth required>
                      <InputLabel id="tipo-orden-label">Tipo de orden</InputLabel>
                      <Select
                        labelId="tipo-orden-label"
                        value={formularioNuevo.tipo || 'Instalación'}
                        onChange={(evento) => establecerFormularioNuevo((actual) => ({ ...actual, tipo: evento.target.value }))}
                        label="Tipo de orden"
                      >
                        <MenuItem value="Instalación">Instalación</MenuItem>
                        <MenuItem value="Baja de servicio">Baja de servicio</MenuItem>
                        <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      required
                      label="Tipo de reclamo"
                      placeholder="Ej: Sin servicio"
                      value={formularioNuevo.tipo}
                      onChange={(evento) => establecerFormularioNuevo((actual) => ({ ...actual, tipo: evento.target.value }))}
                    />
                  )}
                  <FormControl fullWidth required>
                    <InputLabel id="prioridad-label">Prioridad</InputLabel>
                    <Select
                      labelId="prioridad-label"
                      value={formularioNuevo.prioridad}
                      onChange={(evento) => establecerFormularioNuevo((actual) => ({ ...actual, prioridad: evento.target.value }))}
                      label="Prioridad"
                    >
                      {['Normal', 'Alta', 'Urgente'].map((prioridad) => (
                        <MenuItem key={prioridad} value={prioridad}>{prioridad}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                <TextField
                  required
                  multiline
                  minRows={3}
                  label="Descripción"
                  value={formularioNuevo.descripcion}
                  onChange={(evento) => establecerFormularioNuevo((actual) => ({ ...actual, descripcion: evento.target.value }))}
                />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha programada"
                    InputLabelProps={{ shrink: true }}
                    value={formularioNuevo.fechaProgramada}
                    onChange={(evento) => establecerFormularioNuevo((actual) => ({ ...actual, fechaProgramada: evento.target.value }))}
                  />
                  <FormControl fullWidth>
                    <InputLabel id="tecnico-label">Asignar técnico</InputLabel>
                    <Select
                      labelId="tecnico-label"
                      value={formularioNuevo.tecnicoId}
                      onChange={(evento) => establecerFormularioNuevo((actual) => ({ ...actual, tecnicoId: evento.target.value }))}
                      label="Asignar técnico"
                      startAdornment={<PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                    >
                      <MenuItem value="">Sin asignar</MenuItem>
                      {tecnicos.map((tecnico) => (
                        <MenuItem key={tecnico.id} value={tecnico.id}>{tecnico.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
                {errorAlta && <Alert severity="error">{errorAlta}</Alert>}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={guardandoAlta}
                  startIcon={<SaveIcon />}
                  sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
                >
                  {guardandoAlta ? 'Guardando…' : (esModoOrden ? 'Guardar orden' : 'Guardar reclamo')}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Filtrar reclamos</Typography>
            <Stack
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
                gap: 2,
                alignItems: 'end',
              }}
            >
              <FormControl fullWidth>
                <InputLabel id="filtro-estado-label">Estado</InputLabel>
                <Select
                  labelId="filtro-estado-label"
                  value={filtros.estado}
                  label="Estado"
                  onChange={(evento) => actualizarFiltro('estado', evento.target.value)}
                >
                  {['Todos', 'Abierto', 'Asignado', 'En progreso', 'Bloqueado', 'Finalizado'].map((estado) => (
                    <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="filtro-tecnico-label">Técnico</InputLabel>
                <Select
                  labelId="filtro-tecnico-label"
                  value={filtros.tecnicoId}
                  label="Técnico"
                  onChange={(evento) => actualizarFiltro('tecnicoId', evento.target.value)}
                >
                  <MenuItem value="Todos">Todos</MenuItem>
                  <MenuItem value="Sin asignar">Sin asignar</MenuItem>
                  {tecnicos.map((tecnico) => (
                    <MenuItem key={tecnico.id} value={tecnico.id}>{tecnico.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Desde fecha y hora"
                  InputLabelProps={{ shrink: true }}
                  value={filtros.desde}
                  onChange={(evento) => actualizarFiltro('desde', evento.target.value)}
                />
              </Stack>
              <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Hasta fecha y hora"
                  InputLabelProps={{ shrink: true }}
                  value={filtros.hasta}
                  onChange={(evento) => actualizarFiltro('hasta', evento.target.value)}
                />
              </Stack>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {reclamosFiltrados.length} de {reclamos.length} reclamos visibles
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        {reclamosVisibles.map((reclamo) => (
          <Card
            key={reclamo.id}
            onClick={() => abrirReclamo(reclamo)}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter' || evento.key === ' ') abrirReclamo(reclamo);
            }}
            role="button"
            tabIndex={0}
            sx={{
              width: '100%',
              borderRadius: 1.5,
              borderColor: 'divider',
              borderLeft: 4,
              borderLeftColor: colorEstado[reclamo.estado] || 'divider',
              transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
              '&:hover': { borderColor: 'primary.main', boxShadow: 3, transform: 'translateY(-2px)' },
              cursor: 'pointer',
            }}
          >
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0} sx={{ alignItems: 'stretch' }}>
                <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
                      <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.08em' }}>
                        {reclamo.esOrden || reclamo.tipo === 'Instalación' || reclamo.tipo === 'Baja de servicio'
                          ? `Orden #${reclamo.id}`
                          : `Reclamo #${reclamo.id}`}
                      </Typography>
                      {(reclamo.esOrden || reclamo.tipo === 'Instalación' || reclamo.tipo === 'Baja de servicio') && (
                        <Chip size="small" label="Orden" color="secondary" variant="outlined" />
                      )}
                      <Chip
                        size="small"
                        label={`Prioridad ${reclamo.prioridad}`}
                        color={reclamo.prioridad === 'Urgente' ? 'error' : reclamo.prioridad === 'Alta' ? 'warning' : 'default'}
                      />
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{reclamo.tipo}</Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0.25, md: 1.5 }} sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">{nombreCliente(reclamo.clienteId)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reclamo.fechaProgramada || (reclamo.creadoEn ? new Date(reclamo.creadoEn).toLocaleDateString('es-AR') : 'Sin fecha')}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                <Box
                  sx={{
                    width: { xs: '100%', md: 150 },
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'center',
                    gap: 0.75,
                    py: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Estado</Typography>
                  <Chip size="small" label={reclamo.estado} color={colorChipEstado[reclamo.estado] || 'default'} />
                </Box>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                <Box
                  onClick={(evento) => evento.stopPropagation()}
                  onMouseDown={(evento) => evento.stopPropagation()}
                  onKeyDown={(evento) => evento.stopPropagation()}
                  sx={{
                    width: { xs: '100%', md: 190 },
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'center',
                    py: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, mb: 0.75 }}>
                    Técnico
                  </Typography>
                  {reclamo.tecnicoId ? (
                    <Tooltip title="Clic para reasignar técnico" arrow>
                      <Button
                        variant="text"
                        onClick={(evento) => {
                          evento.stopPropagation();
                          abrirEdicionTecnico(reclamo);
                        }}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textTransform: 'none',
                          p: 0.75,
                          borderRadius: 2,
                          width: '100%',
                          maxWidth: 170,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            mb: 0.5,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 28 }} />
                        </Avatar>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            textAlign: 'center',
                            lineHeight: 1.25,
                            maxWidth: 155,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {nombreTecnico(reclamo.tecnicoId)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'primary.main',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            mt: 0.25,
                          }}
                        >
                          Reasignar
                        </Typography>
                      </Button>
                    </Tooltip>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<PersonAddIcon />}
                      onClick={(evento) => {
                        evento.stopPropagation();
                        abrirEdicionTecnico(reclamo);
                      }}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        borderColor: 'divider',
                        color: 'primary.main',
                        px: 1.5,
                        py: 0.75,
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'action.hover',
                        },
                      }}
                    >
                      Asignar técnico
                    </Button>
                  )}
                </Box>
              </Stack>
              {reclamoExpandido?.id === reclamo.id && (
                <Box sx={{ p: { xs: 1.5, sm: 2 }, borderTop: 1, borderColor: 'divider', backgroundColor: 'action.hover' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {reclamo.esOrden || reclamo.tipo === 'Instalación' || reclamo.tipo === 'Baja de servicio'
                      ? 'Detalle de la orden'
                      : 'Detalle del reclamo'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{reclamo.descripcion}</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 2 }} sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">Cliente: {nombreCliente(reclamo.clienteId)}</Typography>
                    <Typography variant="body2" color="text.secondary">Zona: {reclamo.agrupacionGeografica}</Typography>
                    <Typography variant="body2" color="text.secondary">Fecha: {reclamo.fechaProgramada || 'No informada'}</Typography>
                  </Stack>
                  {reclamo.notasCoordinador && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Notas del coordinador:</strong> {reclamo.notasCoordinador}
                    </Typography>
                  )}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(evento) => {
                        evento.stopPropagation();
                        establecerReclamoAbiertoId(reclamo.id);
                      }}
                    >
                      {reclamo.esOrden || reclamo.tipo === 'Instalación' || reclamo.tipo === 'Baja de servicio'
                        ? 'Ver orden completa'
                        : 'Ver reclamo completo'}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<EditNoteIcon />}
                      onClick={(evento) => {
                        evento.stopPropagation();
                        abrirEdicionNotas(reclamo);
                      }}
                    >
                      Editar notas
                    </Button>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
        {cantidadPaginas > 1 && (
          <Stack spacing={1} sx={{ alignItems: 'center', pt: 2 }}>
            <Pagination
              count={cantidadPaginas}
              page={paginaActual}
              onChange={(_, nuevaPagina) => establecerPagina(nuevaPagina)}
              color="primary"
              aria-label="Paginación de reclamos"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75 }}>
              Página {paginaActual} de {cantidadPaginas}
            </Typography>
          </Stack>
        )}
      </Stack>

      {/* Diálogo para asignar o reasignar técnico */}
      <Dialog
        open={Boolean(reclamoParaAsignar)}
        onClose={() => establecerReclamoParaAsignar(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          {reclamoParaAsignar?.tecnicoId ? 'Reasignar técnico' : 'Asignar técnico'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {reclamoParaAsignar?.esOrden || reclamoParaAsignar?.tipo === 'Instalación' || reclamoParaAsignar?.tipo === 'Baja de servicio'
              ? `Orden #${reclamoParaAsignar?.id} · ${reclamoParaAsignar?.tipo}`
              : `Reclamo #${reclamoParaAsignar?.id} · ${reclamoParaAsignar?.tipo}`}
          </Typography>

          {reclamoParaAsignar?.tecnicoId && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                bgcolor: 'action.hover',
                borderRadius: 1.5,
                border: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                Técnico asignado actualmente:
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {nombreTecnico(reclamoParaAsignar.tecnicoId)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tecnicos.find((t) => t.id === reclamoParaAsignar.tecnicoId)?.email || 'Técnico de campo'}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          <Autocomplete
            options={tecnicos}
            value={tecnicos.find((tecnico) => String(tecnico.id) === String(tecnicoSeleccionado)) || null}
            onChange={(_, tecnico) => establecerTecnicoSeleccionado(tecnico ? String(tecnico.id) : '')}
            getOptionLabel={(tecnico) => tecnico.nombre}
            isOptionEqualToValue={(opcion, valor) => opcion.id === valor.id}
            noOptionsText="No se encontraron técnicos disponibles"
            clearText="Dejar sin asignar"
            openText="Mostrar técnicos"
            closeText="Cerrar lista"
            renderOption={(props, tecnico) => (
              <Box component="li" {...props} key={tecnico.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                  <PersonIcon fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{tecnico.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{tecnico.email || 'Técnico de campo'}</Typography>
                </Box>
              </Box>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccionar técnico"
                placeholder="Buscar por nombre..."
                helperText="Podés seleccionar un técnico o borrar el campo para dejarlo sin asignar."
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => establecerReclamoParaAsignar(null)} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={async () => {
              if (!reclamoParaAsignar) return;
              const nuevoTecnicoId = tecnicoSeleccionado ? Number(tecnicoSeleccionado) : null;
              await actualizarAsignacion(reclamoParaAsignar.id, nuevoTecnicoId);
              establecerReclamoParaAsignar(null);
            }}
          >
            Guardar asignación
          </Button>
        </DialogActions>
      </Dialog>

      <FichaDetalle
        abierto={Boolean(reclamoAbierto)}
        alCerrar={() => establecerReclamoAbiertoId(null)}
        titulo={reclamoAbierto?.tipo || 'Sin tipo'}
        subtitulo={reclamoAbierto && `${esOrdenDeServicio(reclamoAbierto) ? 'Orden' : 'Reclamo'} #${reclamoAbierto.id} · creado el ${formatearFecha(reclamoAbierto.creadoEn, { conHora: true })}`}
        icono={esOrdenDeServicio(reclamoAbierto) ? <AssignmentOutlinedIcon /> : <ReportProblemOutlinedIcon />}
        chips={reclamoAbierto ? [
          { label: esOrdenDeServicio(reclamoAbierto) ? 'Orden de servicio' : 'Reclamo', color: 'primary', variant: 'outlined' },
          { label: reclamoAbierto.estado, color: colorChipEstado[reclamoAbierto.estado] || 'default' },
          { label: `Prioridad ${reclamoAbierto.prioridad || 'Normal'}`, color: colorPrioridad[reclamoAbierto.prioridad] || 'default', variant: 'outlined' },
        ] : []}
        aviso={reclamoAbierto?.estado === 'Bloqueado' && reclamoAbierto.motivoBloqueo && (
          <Alert severity="error">
            <strong>Motivo del bloqueo:</strong> {reclamoAbierto.motivoBloqueo}
          </Alert>
        )}
        secciones={reclamoAbierto ? [
          {
            titulo: 'Descripción',
            icono: <DescriptionOutlinedIcon fontSize="small" />,
            campos: [['Detalle informado', reclamoAbierto.descripcion, { anchoCompleto: true }]],
          },
          {
            titulo: 'Cliente',
            icono: <PersonOutlineIcon fontSize="small" />,
            campos: [
              ['Nombre', clienteDelReclamoAbierto?.nombre || nombreCliente(reclamoAbierto.clienteId)],
              ['Teléfono', clienteDelReclamoAbierto?.telefono],
              ['Domicilio', clienteDelReclamoAbierto?.direccion, { anchoCompleto: true }],
              ['Zona', reclamoAbierto.agrupacionGeografica || clienteDelReclamoAbierto?.zona],
            ],
          },
          {
            titulo: 'Programación',
            icono: <EventOutlinedIcon fontSize="small" />,
            campos: [
              ['Fecha programada', formatearFecha(reclamoAbierto.fechaProgramada)],
              ['Creado', formatearFecha(reclamoAbierto.creadoEn, { conHora: true })],
              ...(reclamoAbierto.finalizadoEn
                ? [['Finalizado', formatearFecha(reclamoAbierto.finalizadoEn, { conHora: true })]]
                : []),
            ],
          },
          {
            titulo: 'Técnico asignado',
            icono: <EngineeringOutlinedIcon fontSize="small" />,
            campos: tecnicoDelReclamoAbierto ? [
              ['Nombre', tecnicoDelReclamoAbierto.nombre],
              ['Teléfono', tecnicoDelReclamoAbierto.telefono],
              ['Correo electrónico', tecnicoDelReclamoAbierto.email, { anchoCompleto: true }],
            ] : [['Nombre', 'Sin técnico asignado', { anchoCompleto: true }]],
          },
          {
            titulo: 'Cierre del técnico',
            icono: <TaskAltOutlinedIcon fontSize="small" />,
            campos: reclamoAbierto.comentarioFinalizacion
              ? [['Comentario', reclamoAbierto.comentarioFinalizacion, { anchoCompleto: true }]]
              : [],
          },
          {
            titulo: 'Notas del coordinador',
            icono: <StickyNote2OutlinedIcon fontSize="small" />,
            campos: [['Notas internas', reclamoAbierto.notasCoordinador, { anchoCompleto: true }]],
          },
        ] : []}
        acciones={reclamoAbierto && (
          <>
            <Button onClick={() => establecerReclamoAbiertoId(null)} sx={{ mr: 'auto' }}>Cerrar</Button>
            {reclamoAbierto.estado !== 'Finalizado' && (
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => abrirEdicionTecnico(reclamoAbierto)}
              >
                {reclamoAbierto.tecnicoId ? 'Reasignar' : 'Asignar técnico'}
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<EditNoteIcon />}
              onClick={() => abrirEdicionNotas(reclamoAbierto)}
            >
              Editar notas
            </Button>
          </>
        )}
      >
        {reclamoAbierto?.imagenes?.length > 0 && (
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, color: 'text.secondary' }}>
              <PhotoLibraryOutlinedIcon fontSize="small" />
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.08em', lineHeight: 1.5 }}>
                Imágenes del técnico ({reclamoAbierto.imagenes.length})
              </Typography>
            </Stack>
            <GaleriaImagenes
              key={reclamoAbierto.imagenes.join()}
              ids={reclamoAbierto.imagenes}
              descripcion={`Imagen del reclamo #${reclamoAbierto.id}`}
            />
          </Box>
        )}
      </FichaDetalle>

      <Dialog
        open={Boolean(reclamoEnNotas)}
        onClose={() => establecerReclamoEnNotas(null)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={guardarNotas}>
          <DialogTitle sx={{ fontWeight: 800 }}>
            {esOrdenDeServicio(reclamoEnNotas)
              ? `Notas de la orden #${reclamoEnNotas?.id}`
              : `Notas del reclamo #${reclamoEnNotas?.id}`}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Las imágenes, comentarios y controles cargados por el técnico no se pueden modificar desde aquí.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={4}
              label="Notas del coordinador"
              value={notasCoordinador}
              onChange={(evento) => establecerNotasCoordinador(evento.target.value)}
              placeholder="Agregá una observación interna"
            />
            {errorNotas && <Alert severity="error" sx={{ mt: 2 }}>{errorNotas}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => establecerReclamoEnNotas(null)}>Cancelar</Button>
            <Button type="submit" variant="contained" startIcon={<SaveIcon />}>Guardar notas</Button>
          </DialogActions>
        </Box>
      </Dialog>

    </Stack>
  );
}

export default Reclamos;