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
import AddIcon from '@mui/icons-material/Add';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { useState } from 'react';
import { useAppData } from '../../context/useAppData.js';

const formularioVacio = {
  nombre: '',
  documento: '',
  telefono: '',
  email: '',
  direccion: '',
};

const estaActivo = (cliente) => cliente.activo !== false;

function Clientes() {
  const { data, crearCliente, actualizarCliente } = useAppData();
  const [busqueda, establecerBusqueda] = useState('');
  const [filtroEstado, establecerFiltroEstado] = useState('Activos');
  const [dialogoFormularioAbierto, establecerDialogoFormularioAbierto] = useState(false);
  const [dialogoDetalleAbierto, establecerDialogoDetalleAbierto] = useState(false);
  const [clienteEditando, establecerClienteEditando] = useState(null);
  const [clienteSeleccionado, establecerClienteSeleccionado] = useState(null);
  const [clientePendienteEstado, establecerClientePendienteEstado] = useState(null);
  const [formulario, establecerFormulario] = useState(formularioVacio);
  const [error, establecerError] = useState('');
  const [guardando, establecerGuardando] = useState(false);

  const clientes = data.clientes || [];
  const termino = busqueda.trim().toLocaleLowerCase('es');
  const clientesFiltrados = clientes
    .filter((cliente) => {
      const coincideEstado = filtroEstado === 'Todos'
        || (filtroEstado === 'Activos' ? estaActivo(cliente) : !estaActivo(cliente));
      const texto = [cliente.nombre, cliente.documento, cliente.telefono, cliente.email, cliente.direccion]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es');
      return coincideEstado && texto.includes(termino);
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const abrirFormulario = (cliente = null) => {
    establecerClienteEditando(cliente);
    establecerFormulario(cliente ? {
      nombre: cliente.nombre || '',
      documento: cliente.documento || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
    } : formularioVacio);
    establecerError('');
    establecerDialogoFormularioAbierto(true);
  };

  const actualizarCampo = (campo, valor) => {
    establecerFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardarCliente = async (evento) => {
    evento.preventDefault();
    establecerError('');
    establecerGuardando(true);
    const cambios = Object.fromEntries(
      Object.entries(formulario).map(([campo, valor]) => [campo, valor.trim()]),
    );

    try {
      if (clienteEditando) {
        await actualizarCliente(clienteEditando.id, cambios);
      } else {
        await crearCliente(cambios);
      }
      establecerDialogoFormularioAbierto(false);
    } catch {
      establecerError('No se pudo guardar el cliente. Revisá los datos e intentá nuevamente.');
    } finally {
      establecerGuardando(false);
    }
  };

  const cambiarEstadoCliente = async () => {
    if (!clientePendienteEstado) return;
    establecerError('');
    try {
      await actualizarCliente(clientePendienteEstado.id, {
        activo: !estaActivo(clientePendienteEstado),
      });
      establecerClientePendienteEstado(null);
    } catch {
      establecerError('No se pudo cambiar el estado del cliente. Intentá nuevamente.');
      establecerClientePendienteEstado(null);
    }
  };

  const detalles = clienteSeleccionado ? [
    ['Nombre y apellido', clienteSeleccionado.nombre],
    ['DNI / CUIT', clienteSeleccionado.documento],
    ['Teléfono', clienteSeleccionado.telefono],
    ['Correo electrónico', clienteSeleccionado.email],
    ['Domicilio', clienteSeleccionado.direccion],
    ['Zona', clienteSeleccionado.zona],
    ['Referencias de acceso', clienteSeleccionado.referenciasAcceso],
    ['Coordenadas', clienteSeleccionado.coordenadas
      ? `${clienteSeleccionado.coordenadas.latitud}, ${clienteSeleccionado.coordenadas.longitud}`
      : ''],
    ['Historial de potencias', clienteSeleccionado.historialPotencias?.join(', ')],
  ].filter(([, valor]) => valor) : [];

  return (
    <Stack spacing={2.5}>
      {error && <Alert severity="error" onClose={() => establecerError('')}>{error}</Alert>}

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
          >
            <TextField
              fullWidth
              label="Buscar clientes"
              placeholder="Nombre, documento, teléfono, correo o domicilio"
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
                label="Estado"
                value={filtroEstado}
                onChange={(evento) => establecerFiltroEstado(evento.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="Todos">Todos</MenuItem>
                <MenuItem value="Activos">Activos</MenuItem>
                <MenuItem value="Inactivos">Inactivos</MenuItem>
              </TextField>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => abrirFormulario()}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Nuevo cliente
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Clientes</Typography>
            <Typography variant="body2" color="text.secondary">
              {clientesFiltrados.length} {clientesFiltrados.length === 1 ? 'resultado' : 'resultados'}
            </Typography>
          </Stack>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Cliente</TableCell>
                  <TableCell>DNI / CUIT</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Domicilio</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clientesFiltrados.map((cliente) => {
                  const activo = estaActivo(cliente);
                  return (
                    <TableRow key={cliente.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{cliente.nombre}</TableCell>
                      <TableCell>{cliente.documento || '—'}</TableCell>
                      <TableCell>{cliente.telefono || '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>{cliente.direccion || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={activo ? 'Activo' : 'Inactivo'}
                          color={activo ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Ver información">
                          <IconButton
                            aria-label={`Ver información de ${cliente.nombre}`}
                            onClick={() => {
                              establecerClienteSeleccionado(cliente);
                              establecerDialogoDetalleAbierto(true);
                            }}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modificar cliente">
                          <IconButton
                            aria-label={`Modificar ${cliente.nombre}`}
                            onClick={() => abrirFormulario(cliente)}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={activo ? 'Deshabilitar cliente' : 'Reactivar cliente'}>
                          <IconButton
                            aria-label={activo ? `Deshabilitar ${cliente.nombre}` : `Reactivar ${cliente.nombre}`}
                            color={activo ? 'default' : 'success'}
                            onClick={() => establecerClientePendienteEstado(cliente)}
                          >
                            {activo
                              ? <BlockOutlinedIcon fontSize="small" />
                              : <CheckCircleOutlineIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {clientesFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        {clientes.length ? 'No hay clientes que coincidan con la búsqueda.' : 'Todavía no hay clientes registrados.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={dialogoFormularioAbierto}
        onClose={() => establecerDialogoFormularioAbierto(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{clienteEditando ? 'Modificar cliente' : 'Registrar cliente'}</DialogTitle>
        <Box component="form" onSubmit={guardarCliente}>
          <DialogContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            {error && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{error}</Alert>}
            <TextField
              required
              autoFocus
              label="Nombre y apellido"
              value={formulario.nombre}
              onChange={(evento) => actualizarCampo('nombre', evento.target.value)}
            />
            <TextField
              required
              label="DNI / CUIT"
              value={formulario.documento}
              onChange={(evento) => actualizarCampo('documento', evento.target.value)}
            />
            <TextField
              label="Teléfono"
              value={formulario.telefono}
              onChange={(evento) => actualizarCampo('telefono', evento.target.value)}
            />
            <TextField
              type="email"
              label="Correo electrónico"
              value={formulario.email}
              onChange={(evento) => actualizarCampo('email', evento.target.value)}
            />
            <TextField
              label="Domicilio"
              value={formulario.direccion}
              onChange={(evento) => actualizarCampo('direccion', evento.target.value)}
              sx={{ gridColumn: { sm: '1 / -1' } }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => establecerDialogoFormularioAbierto(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar cliente'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={dialogoDetalleAbierto}
        onClose={() => establecerDialogoDetalleAbierto(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Información del cliente</DialogTitle>
        <DialogContent>
          {clienteSeleccionado && (
            <Stack spacing={2}>
              <Chip
                label={estaActivo(clienteSeleccionado) ? 'Activo' : 'Inactivo'}
                color={estaActivo(clienteSeleccionado) ? 'success' : 'default'}
                size="small"
                sx={{ alignSelf: 'flex-start' }}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {detalles.map(([etiqueta, valor]) => (
                  <Box key={etiqueta} sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary">{etiqueta}</Typography>
                    <Typography sx={{ overflowWrap: 'anywhere' }}>{valor}</Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => establecerDialogoDetalleAbierto(false)}>Cerrar</Button>
          {clienteSeleccionado && (
            <Button onClick={() => {
              establecerDialogoDetalleAbierto(false);
              abrirFormulario(clienteSeleccionado);
            }}>
              Modificar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(clientePendienteEstado)}
        onClose={() => establecerClientePendienteEstado(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {clientePendienteEstado && estaActivo(clientePendienteEstado) ? 'Deshabilitar cliente' : 'Reactivar cliente'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {clientePendienteEstado && estaActivo(clientePendienteEstado)
              ? `¿Querés deshabilitar a ${clientePendienteEstado.nombre}? Sus datos se conservarán.`
              : `¿Querés volver a habilitar a ${clientePendienteEstado?.nombre}?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => establecerClientePendienteEstado(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color={clientePendienteEstado && estaActivo(clientePendienteEstado) ? 'error' : 'success'}
            onClick={cambiarEstadoCliente}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default Clientes;