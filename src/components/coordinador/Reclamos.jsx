import { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useAppData } from '../../context/useAppData.js';

function Reclamos() {
  const [formularioAbierto, establecerFormularioAbierto] = useState(false);
  const [reclamoEditado, establecerReclamoEditado] = useState(null);
  const [reclamoAbierto, establecerReclamoAbierto] = useState(null);
  const [imagenAbierta, establecerImagenAbierta] = useState(null);
  const [tecnicoAbierto, establecerTecnicoAbierto] = useState(null);
  const [tecnicoSeleccionado, establecerTecnicoSeleccionado] = useState('');
  const [filtros, establecerFiltros] = useState({
    estado: 'Abierto',
    tecnicoId: 'Todos',
    desde: '',
    hasta: '',
  });
  const { data, actualizarAsignacion } = useAppData();
  const reclamos = data.reclamos;

  const tecnicos = data.usuarios.filter(
    (usuario) => usuario.rol === 'Tecnico' && usuario.activo,
  );

  const nombreCliente = (clienteId) => data.clientes.find(
    (cliente) => cliente.id === clienteId,
  )?.nombre || 'Cliente no encontrado';

  const nombreTecnico = (tecnicoId) => tecnicos.find(
    (tecnico) => tecnico.id === tecnicoId,
  )?.nombre || 'Sin asignar';

  const colorEstado = {
    Abierto: 'warning.main',
    Asignado: 'info.main',
    'En progreso': 'secondary.main',
    Bloqueado: 'error.main',
    Finalizado: 'success.main',
  };

  const abrirEdicionTecnico = (reclamo) => {
    establecerTecnicoSeleccionado(reclamo.tecnicoId || '');
    establecerReclamoEditado((actual) => (
      actual === reclamo.id ? null : reclamo.id
    ));
  };

  const actualizarFiltro = (campo, valor) => {
    establecerFiltros((actuales) => ({ ...actuales, [campo]: valor }));
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

  const tecnicoDelReclamo = tecnicoAbierto
    ? tecnicos.find((tecnico) => tecnico.id === tecnicoAbierto.tecnicoId)
    : null;
  const tecnicoDelReclamoAbierto = reclamoAbierto
    ? tecnicos.find((tecnico) => tecnico.id === reclamoAbierto.tecnicoId)
    : null;

  const abrirReclamo = (reclamo) => establecerReclamoAbierto(reclamo);

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => establecerFormularioAbierto((actual) => !actual)}
          sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, ml: { sm: 'auto' }, flexShrink: 0 }}
        >
          Nuevo reclamo
        </Button>
      </Stack>

      {formularioAbierto && (
      <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Alta de reclamo</Typography>
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
                    defaultValue=""
                    label="Cliente"
                  >
                    {data.clientes.map((cliente) => (
                      <MenuItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre} - {cliente.zona}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  required
                  label="Tipo de reclamo"
                  placeholder="Ej: Sin servicio"
                />
                <FormControl fullWidth required>
                  <InputLabel id="prioridad-label">Prioridad</InputLabel>
                  <Select
                    labelId="prioridad-label"
                    defaultValue="Normal"
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
              />
              <FormControl fullWidth>
                <InputLabel id="tecnico-label">Asignar técnico</InputLabel>
                <Select
                  labelId="tecnico-label"
                    defaultValue=""
                  label="Asignar técnico"
                  startAdornment={<AssignmentIndIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  {tecnicos.map((tecnico) => (
                    <MenuItem key={tecnico.id} value={tecnico.id}>{tecnico.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="contained" startIcon={<SaveIcon />} sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}>
                Guardar reclamo
              </Button>
            </Stack>
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
                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                  Desde fecha y hora
                </Typography>
                <TextField
                  fullWidth
                  type="datetime-local"
                  value={filtros.desde}
                  onChange={(evento) => actualizarFiltro('desde', evento.target.value)}
                />
              </Stack>
              <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                  Hasta fecha y hora
                </Typography>
                <TextField
                  fullWidth
                  type="datetime-local"
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

      <Stack spacing={2}>
        {reclamosFiltrados.map((reclamo) => (
          <Card
            key={reclamo.id}
            onClick={() => abrirReclamo(reclamo)}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter' || evento.key === ' ') abrirReclamo(reclamo);
            }}
            role="button"
            tabIndex={0}
            sx={{
              borderRadius: 2.5,
              borderColor: 'divider',
              borderLeft: 4,
              borderLeftColor: colorEstado[reclamo.estado] || 'divider',
              transition: 'border-color 160ms ease, box-shadow 160ms ease',
              '&:hover': { borderColor: 'primary.main', boxShadow: 4 },
              cursor: 'pointer',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 2, md: 3 }}>
                <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                  <Box>
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.08em' }}>
                      Reclamo #{reclamo.id}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: reclamo.prioridad === 'Urgente' ? 'error.main' : 'text.secondary', mt: 0.25 }}>
                      Prioridad: {reclamo.prioridad}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{reclamo.tipo}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                      {nombreCliente(reclamo.clienteId)} · {reclamo.agrupacionGeografica}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Seleccioná el reclamo para ver la información completa.
                  </Typography>
                </Stack>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                <Box
                  sx={{
                    width: { xs: '100%', md: 250 },
                    flexShrink: 0,
                    alignSelf: 'flex-start',
                    height: 128,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 1.5,
                    borderRadius: 1.5,
                    border: 1,
                    borderColor: 'divider',
                    backgroundColor: 'action.hover',
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75, fontWeight: 700, textAlign: 'center' }}>
                      Estado del ticket
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                      <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: colorEstado[reclamo.estado] || 'text.secondary' }} />
                      <Typography sx={{ fontWeight: 800, color: colorEstado[reclamo.estado] || 'text.primary' }}>
                        {reclamo.estado}
                      </Typography>
                    </Stack>
                  </Box>
                </Box>

                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

                <Stack spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', md: 250 }, flexShrink: 0 }}>
                  <Stack spacing={1}>
                    <Box
                      sx={{
                        mt: 0,
                        p: 1.5,
                        height: 128,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        borderRadius: 1,
                        width: '100%',
                        border: 1,
                        borderColor: 'divider',
                        backgroundColor: 'action.hover',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.35, textAlign: 'center' }}>
                        Técnico
                      </Typography>
                      {reclamo.tecnicoId ? (
                        <Stack spacing={0.75} alignItems="center" sx={{ width: '100%' }}>
                          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <Button
                              variant="text"
                              onClick={(evento) => {
                                evento.stopPropagation();
                                establecerTecnicoAbierto(reclamo);
                              }}
                              sx={{
                                minWidth: 0,
                                maxWidth: '100%',
                                textTransform: 'none',
                                color: 'text.primary',
                                p: 0.5,
                              }}
                            >
                              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ maxWidth: '100%' }}>
                              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: 'text.secondary', flexShrink: 0 }} />
                              <AssignmentIndIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                              <Typography variant="body2" sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {nombreTecnico(reclamo.tecnicoId)}
                              </Typography>
                              </Stack>
                            </Button>
                          </Box>
                          <Button
                            size="small"
                            variant="text"
                            onClick={(evento) => {
                              evento.stopPropagation();
                              abrirEdicionTecnico(reclamo);
                            }}
                            sx={{
                              minWidth: 'auto',
                              px: 0.5,
                              flexShrink: 0,
                              color: 'text.secondary',
                              alignSelf: 'center',
                              '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' },
                            }}
                          >
                            Modificar
                          </Button>
                        </Stack>
                      ) : (
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          startIcon={<AssignmentIndIcon />}
                          onClick={(evento) => {
                            evento.stopPropagation();
                            abrirEdicionTecnico(reclamo);
                          }}
                          sx={{
                            color: 'text.primary',
                            borderColor: 'divider',
                            '&:hover': { borderColor: 'text.primary', backgroundColor: 'action.hover' },
                          }}
                        >
                          Asignar técnico
                        </Button>
                      )}
                    </Box>
                  </Stack>

                  {reclamoEditado === reclamo.id && (
                    <Stack spacing={1.5}>
                      <Autocomplete
                        options={tecnicos}
                        value={tecnicos.find((tecnico) => tecnico.id === Number(tecnicoSeleccionado)) || null}
                        onChange={(_, tecnico) => establecerTecnicoSeleccionado(tecnico?.id || '')}
                        getOptionLabel={(tecnico) => tecnico.nombre}
                        isOptionEqualToValue={(opcion, valor) => opcion.id === valor.id}
                        noOptionsText="No se encontraron técnicos"
                        clearText="Dejar sin asignar"
                        openText="Mostrar técnicos"
                        closeText="Cerrar lista"
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Técnico asignado"
                            placeholder="Buscar por nombre"
                          />
                        )}
                      />
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={(evento) => {
                          evento.stopPropagation();
                          const tecnicoId = tecnicoSeleccionado ? Number(tecnicoSeleccionado) : null;
                          actualizarAsignacion(reclamo.id, tecnicoId);
                          establecerReclamoEditado(null);
                        }}
                      >
                        Guardar asignación
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
        {!reclamosFiltrados.length && (
          <Typography color="text.secondary">No hay reclamos que coincidan con los filtros.</Typography>
        )}
      </Stack>

      <Dialog
        open={Boolean(tecnicoAbierto)}
        onClose={() => establecerTecnicoAbierto(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Información del técnico</DialogTitle>
        <DialogContent>
          {tecnicoDelReclamo && (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{tecnicoDelReclamo.nombre}</Typography>
              <Typography><strong>Usuario:</strong> {tecnicoDelReclamo.usuario}</Typography>
              <Typography><strong>Email:</strong> {tecnicoDelReclamo.email}</Typography>
              <Typography><strong>Teléfono:</strong> {tecnicoDelReclamo.telefono}</Typography>
              <Typography><strong>Documento:</strong> {tecnicoDelReclamo.documento}</Typography>
              <Typography><strong>Dirección:</strong> {tecnicoDelReclamo.direccion}</Typography>
              <Typography>
                <strong>Reclamo asignado:</strong> #{tecnicoAbierto?.id} · {tecnicoAbierto?.tipo}
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(reclamoAbierto)}
        onClose={() => establecerReclamoAbierto(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Reclamo #{reclamoAbierto?.id}
        </DialogTitle>
        <DialogContent>
          {reclamoAbierto && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{reclamoAbierto.tipo}</Typography>
                <Typography sx={{ fontWeight: 800, color: colorEstado[reclamoAbierto.estado] }}>
                  {reclamoAbierto.estado}
                </Typography>
              </Stack>
              <Typography><strong>Cliente:</strong> {nombreCliente(reclamoAbierto.clienteId)}</Typography>
              <Typography><strong>Prioridad:</strong> {reclamoAbierto.prioridad}</Typography>
              <Typography><strong>Zona:</strong> {reclamoAbierto.agrupacionGeografica}</Typography>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Descripción</Typography>
                <Typography>{reclamoAbierto.descripcion}</Typography>
              </Box>
              {reclamoAbierto.motivoBloqueo && (
                <Typography color="error.main">
                  <strong>Motivo del bloqueo:</strong> {reclamoAbierto.motivoBloqueo}
                </Typography>
              )}
              {tecnicoDelReclamoAbierto && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Técnico</Typography>
                  <Typography>{tecnicoDelReclamoAbierto.nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tecnicoDelReclamoAbierto.email} · {tecnicoDelReclamoAbierto.telefono}
                  </Typography>
                </Box>
              )}
              {reclamoAbierto.comentarioFinalizacion && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Comentario del técnico</Typography>
                  <Typography>{reclamoAbierto.comentarioFinalizacion}</Typography>
                </Box>
              )}
              {reclamoAbierto.imagen && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>Evidencia cargada</Typography>
                  <Box
                    component="img"
                    src={reclamoAbierto.imagen}
                    alt={`Evidencia del reclamo #${reclamoAbierto.id}`}
                    onClick={() => establecerImagenAbierta({
                      src: reclamoAbierto.imagen,
                      alt: `Evidencia del reclamo #${reclamoAbierto.id}`,
                    })}
                    sx={{
                      width: '100%',
                      maxHeight: 280,
                      objectFit: 'contain',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      cursor: 'zoom-in',
                    }}
                  />
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(imagenAbierta)}
        onClose={() => establecerImagenAbierta(null)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Imagen del reclamo</DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', p: { xs: 1.5, sm: 3 } }}>
          {imagenAbierta && (
            <Box
              component="img"
              src={imagenAbierta.src}
              alt={imagenAbierta.alt}
              sx={{ display: 'block', maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => establecerImagenAbierta(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default Reclamos;