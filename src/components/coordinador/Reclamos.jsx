import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Chip,
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
import { datosIniciales } from '../../data/datosIniciales.js';

const reclamoVacio = {
  clienteId: '',
  tipo: '',
  prioridad: 'Normal',
  descripcion: '',
  tecnicoId: '',
};

function Reclamos() {
  const [reclamos, establecerReclamos] = useState(datosIniciales.reclamos);
  const [formularioAbierto, establecerFormularioAbierto] = useState(false);
  const [formulario, establecerFormulario] = useState(reclamoVacio);
  const [filtros, establecerFiltros] = useState({
    estado: 'Todos',
    tecnicoId: 'Todos',
    desde: '',
    hasta: '',
  });
  const [reclamoEditado, establecerReclamoEditado] = useState(null);
  const [tecnicoEditado, establecerTecnicoEditado] = useState('');

  const tecnicos = datosIniciales.usuarios.filter(
    (usuario) => usuario.rol === 'Tecnico' && usuario.activo,
  );

  const actualizarCampo = (campo, valor) => {
    establecerFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardarReclamo = (evento) => {
    evento.preventDefault();
    const cliente = datosIniciales.clientes.find(
      (item) => item.id === Number(formulario.clienteId),
    );
    const tecnicoId = formulario.tecnicoId ? Number(formulario.tecnicoId) : null;

    establecerReclamos((actuales) => [
      ...actuales,
      {
        id: Math.max(...actuales.map((reclamo) => reclamo.id)) + 1,
        ...formulario,
        clienteId: Number(formulario.clienteId),
        tecnicoId,
        estado: tecnicoId ? 'Asignado' : 'Abierto',
        creadoEn: new Date().toISOString(),
        agrupacionGeografica: cliente.zona,
        fechaProgramada: new Date().toISOString().slice(0, 10),
      },
    ]);
    establecerFormulario(reclamoVacio);
    establecerFormularioAbierto(false);
  };

  const nombreCliente = (clienteId) => datosIniciales.clientes.find(
    (cliente) => cliente.id === clienteId,
  )?.nombre || 'Cliente no encontrado';

  const nombreTecnico = (tecnicoId) => tecnicos.find(
    (tecnico) => tecnico.id === tecnicoId,
  )?.nombre || 'Sin asignar';

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
    const coincideDesde = !desde || fechaCreacion >= desde;
    const coincideHasta = !hasta || fechaCreacion <= hasta;

    return coincideEstado && coincideTecnico && coincideDesde && coincideHasta;
  });

  const abrirEdicionTecnico = (reclamo) => {
    establecerReclamoEditado(reclamo.id);
    establecerTecnicoEditado(reclamo.tecnicoId || '');
  };

  const guardarAsignacion = (reclamoId) => {
    const tecnicoId = tecnicoEditado ? Number(tecnicoEditado) : null;
    establecerReclamos((actuales) => actuales.map((reclamo) => (
      reclamo.id === reclamoId
        ? { ...reclamo, tecnicoId, estado: tecnicoId ? 'Asignado' : 'Abierto' }
        : reclamo
    )));
    establecerReclamoEditado(null);
    establecerTecnicoEditado('');
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Reclamos</Typography>
          <Typography color="text.secondary">Alta y asignación de reclamos del equipo técnico.</Typography>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => establecerFormularioAbierto((actual) => !actual)}
        >
          Nuevo reclamo
        </Button>
      </Stack>

      {formularioAbierto && (
        <Card component="form" onSubmit={guardarReclamo}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Alta de reclamo</Typography>
                <Button
                  color="inherit"
                  startIcon={<CloseIcon />}
                  onClick={() => establecerFormularioAbierto(false)}
                >
                  Cancelar
                </Button>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <FormControl fullWidth required>
                  <InputLabel id="cliente-label">Cliente</InputLabel>
                  <Select
                    labelId="cliente-label"
                    value={formulario.clienteId}
                    label="Cliente"
                    onChange={(evento) => actualizarCampo('clienteId', evento.target.value)}
                  >
                    {datosIniciales.clientes.map((cliente) => (
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
                  value={formulario.tipo}
                  onChange={(evento) => actualizarCampo('tipo', evento.target.value)}
                  placeholder="Ej: Sin servicio"
                />
                <FormControl fullWidth required>
                  <InputLabel id="prioridad-label">Prioridad</InputLabel>
                  <Select
                    labelId="prioridad-label"
                    value={formulario.prioridad}
                    label="Prioridad"
                    onChange={(evento) => actualizarCampo('prioridad', evento.target.value)}
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
                value={formulario.descripcion}
                onChange={(evento) => actualizarCampo('descripcion', evento.target.value)}
              />
              <FormControl fullWidth>
                <InputLabel id="tecnico-label">Asignar técnico</InputLabel>
                <Select
                  labelId="tecnico-label"
                  value={formulario.tecnicoId}
                  label="Asignar técnico"
                  onChange={(evento) => actualizarCampo('tecnicoId', evento.target.value)}
                  startAdornment={<AssignmentIndIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  {tecnicos.map((tecnico) => (
                    <MenuItem key={tecnico.id} value={tecnico.id}>{tecnico.nombre}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />}>
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
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="filtro-estado-label">Estado</InputLabel>
                <Select
                  labelId="filtro-estado-label"
                  value={filtros.estado}
                  label="Estado"
                  onChange={(evento) => actualizarFiltro('estado', evento.target.value)}
                >
                  {['Todos', 'Abierto', 'Asignado', 'En progreso', 'Finalizado'].map((estado) => (
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
              <TextField
                fullWidth
                type="datetime-local"
                label="Desde fecha y hora"
                value={filtros.desde}
                onChange={(evento) => actualizarFiltro('desde', evento.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="datetime-local"
                label="Hasta fecha y hora"
                value={filtros.hasta}
                onChange={(evento) => actualizarFiltro('hasta', evento.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {reclamosFiltrados.length} de {reclamos.length} reclamos visibles
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        {reclamosFiltrados.map((reclamo) => (
          <Card key={reclamo.id}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{reclamo.tipo}</Typography>
                  <Typography color="text.secondary">
                    {nombreCliente(reclamo.clienteId)} · {reclamo.agrupacionGeografica}
                  </Typography>
                  <Typography sx={{ mt: 1 }}>{reclamo.descripcion}</Typography>
                </div>
                <Stack direction="row" gap={1} flexWrap="wrap" alignItems="flex-start">
                  <Chip label={reclamo.estado} color={reclamo.estado === 'Asignado' ? 'info' : 'default'} size="small" />
                  <Chip label={reclamo.prioridad} color={reclamo.prioridad === 'Urgente' ? 'error' : 'default'} size="small" />
                  <Chip icon={<AssignmentIndIcon />} label={nombreTecnico(reclamo.tecnicoId)} size="small" />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AssignmentIndIcon />}
                    onClick={() => abrirEdicionTecnico(reclamo)}
                  >
                    {reclamo.tecnicoId ? 'Cambiar técnico' : 'Asignar técnico'}
                  </Button>
                </Stack>
              </Stack>
              {reclamoEditado === reclamo.id && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2}>
                  <FormControl fullWidth>
                    <InputLabel id={`editar-tecnico-${reclamo.id}-label`}>Técnico asignado</InputLabel>
                    <Select
                      labelId={`editar-tecnico-${reclamo.id}-label`}
                      value={tecnicoEditado}
                      label="Técnico asignado"
                      onChange={(evento) => establecerTecnicoEditado(evento.target.value)}
                    >
                      <MenuItem value="">Sin asignar</MenuItem>
                      {tecnicos.map((tecnico) => (
                        <MenuItem key={tecnico.id} value={tecnico.id}>{tecnico.nombre}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={() => guardarAsignacion(reclamo.id)}>
                    Guardar asignación
                  </Button>
                  <Button color="inherit" onClick={() => establecerReclamoEditado(null)}>
                    Cancelar
                  </Button>
                </Stack>
              )}
            </CardContent>
          </Card>
        ))}
        {!reclamosFiltrados.length && (
          <Typography color="text.secondary">No hay reclamos que coincidan con los filtros.</Typography>
        )}
      </Stack>
    </Stack>
  );
}

export default Reclamos;