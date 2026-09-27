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
  direccion: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  usuario: '',
  contrasena: '',
  rol: 'Tecnico',
};

const estaActivo = (usuario) => usuario.activo !== false;

function UsuariosAdmin() {
  const { data, crearUsuario, actualizarUsuario } = useAppData();
  const [busqueda, establecerBusqueda] = useState('');
  const [filtroRol, establecerFiltroRol] = useState('Todos');
  const [filtroEstado, establecerFiltroEstado] = useState('Todos');
  const [dialogoFormularioAbierto, establecerDialogoFormularioAbierto] = useState(false);
  const [dialogoDetalleAbierto, establecerDialogoDetalleAbierto] = useState(false);
  const [usuarioEditando, establecerUsuarioEditando] = useState(null);
  const [usuarioSeleccionado, establecerUsuarioSeleccionado] = useState(null);
  const [usuarioPendienteEstado, establecerUsuarioPendienteEstado] = useState(null);
  const [formulario, establecerFormulario] = useState(formularioVacio);
  const [error, establecerError] = useState('');
  const [guardando, establecerGuardando] = useState(false);

  const termino = busqueda.trim().toLocaleLowerCase('es');
  const usuarios = data.usuarios
    .filter((usuario) => {
      const coincideEstado = filtroEstado === 'Todos'
        || (filtroEstado === 'Activos' ? estaActivo(usuario) : !estaActivo(usuario));
      const coincideRol = filtroRol === 'Todos' || usuario.rol === filtroRol;
      const texto = [usuario.nombre, usuario.usuario, usuario.documento, usuario.email, usuario.rol]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es');
      return coincideEstado && coincideRol && texto.includes(termino);
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const abrirFormulario = (usuario = null) => {
    establecerUsuarioEditando(usuario);
    establecerFormulario(usuario ? {
      nombre: usuario.nombre || '',
      documento: usuario.documento || '',
      direccion: usuario.direccion || '',
      telefono: usuario.telefono || '',
      email: usuario.email || '',
      fechaNacimiento: usuario.fechaNacimiento || '',
      usuario: usuario.usuario || '',
      contrasena: '',
      rol: usuario.rol || 'Tecnico',
    } : formularioVacio);
    establecerError('');
    establecerDialogoFormularioAbierto(true);
  };

  const actualizarCampo = (campo, valor) => {
    establecerFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardarUsuario = async (evento) => {
    evento.preventDefault();
    establecerError('');
    establecerGuardando(true);
    const cambios = Object.fromEntries(
      Object.entries(formulario).map(([campo, valor]) => [
        campo,
        campo === 'contrasena' ? valor : valor.trim(),
      ]),
    );
    if (usuarioEditando && !cambios.contrasena) delete cambios.contrasena;

    try {
      if (usuarioEditando) {
        await actualizarUsuario(usuarioEditando.id, cambios);
      } else {
        await crearUsuario(cambios);
      }
      establecerDialogoFormularioAbierto(false);
    } catch (causa) {
      establecerError(causa?.response?.data?.mensaje || 'No se pudo guardar el usuario. Revisá los datos e intentá nuevamente.');
    } finally {
      establecerGuardando(false);
    }
  };

  const cambiarEstadoUsuario = async () => {
    if (!usuarioPendienteEstado) return;
    establecerError('');
    try {
      await actualizarUsuario(usuarioPendienteEstado.id, {
        activo: !estaActivo(usuarioPendienteEstado),
      });
      establecerUsuarioPendienteEstado(null);
    } catch {
      establecerError('No se pudo cambiar el estado del usuario. Intentá nuevamente.');
      establecerUsuarioPendienteEstado(null);
    }
  };

  const detalles = usuarioSeleccionado ? [
    ['Nombre y apellido', usuarioSeleccionado.nombre],
    ['Nombre de usuario', usuarioSeleccionado.usuario],
    ['Rol', usuarioSeleccionado.rol],
    ['Estado', estaActivo(usuarioSeleccionado) ? 'Activo' : 'Inactivo'],
    ['DNI', usuarioSeleccionado.documento],
    ['Domicilio', usuarioSeleccionado.direccion],
    ['Teléfono', usuarioSeleccionado.telefono],
    ['Correo electrónico', usuarioSeleccionado.email],
    ['Fecha de nacimiento', usuarioSeleccionado.fechaNacimiento],
    ['Vencimiento de registro', usuarioSeleccionado.vencimientoRegistro],
  ].filter(([, valor]) => valor) : [];

  return (
    <Stack spacing={2.5}>
      {error && !dialogoFormularioAbierto && (
        <Alert severity="error" onClose={() => establecerError('')}>{error}</Alert>
      )}

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
            >
              <TextField
                fullWidth
                label="Buscar usuarios"
                placeholder="Nombre, usuario, documento, correo o rol"
                value={busqueda}
                onChange={(evento) => establecerBusqueda(evento.target.value)}
                sx={{ maxWidth: { md: 520 } }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => abrirFormulario()}
                sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'stretch', sm: 'auto' } }}
              >
                Nuevo usuario
              </Button>
            </Stack>

            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              spacing={2}
              sx={{ alignItems: { xs: 'stretch', lg: 'center' }, pt: 0.5, flexWrap: 'wrap' }}
            >
              {/* Filtro por Tipo de Usuario (Rol) */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, minWidth: 95 }}>
                  Tipo de usuario:
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  aria-label="Filtrar usuarios por rol"
                  sx={{
                    width: { xs: '100%', sm: 'fit-content' },
                    flexWrap: 'wrap',
                    p: 0.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    backgroundColor: 'action.hover',
                    '& .MuiButton-root': {
                      flex: { xs: 1, sm: 'initial' },
                      minWidth: { sm: 64 },
                      minHeight: 32,
                      px: 1.25,
                      textTransform: 'none',
                      fontWeight: 600,
                    },
                  }}
                >
                  {['Todos', 'Administrador', 'Coordinador', 'Tecnico'].map((rol) => (
                    <Button
                      key={rol}
                      size="small"
                      variant={filtroRol === rol ? 'contained' : 'outlined'}
                      onClick={() => establecerFiltroRol(rol)}
                    >
                      {rol === 'Tecnico' ? 'Técnico' : rol}
                    </Button>
                  ))}
                </Stack>
              </Stack>

              {/* Filtro por Estado */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, minWidth: 50 }}>
                  Estado:
                </Typography>
                <Stack
                  direction="row"
                  spacing={0.5}
                  aria-label="Filtrar por estado"
                  sx={{
                    width: { xs: '100%', sm: 'fit-content' },
                    flexWrap: 'wrap',
                    p: 0.5,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1.5,
                    backgroundColor: 'action.hover',
                    '& .MuiButton-root': {
                      flex: { xs: 1, sm: 'initial' },
                      minWidth: { sm: 64 },
                      minHeight: 32,
                      px: 1.25,
                      textTransform: 'none',
                      fontWeight: 600,
                    },
                  }}
                >
                  {['Todos', 'Activos', 'Inactivos'].map((estado) => (
                    <Button
                      key={estado}
                      size="small"
                      variant={filtroEstado === estado ? 'contained' : 'outlined'}
                      onClick={() => establecerFiltroEstado(estado)}
                    >
                      {estado}
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Usuarios del sistema</Typography>
            <Typography variant="body2" color="text.secondary">
              {usuarios.length} {usuarios.length === 1 ? 'resultado' : 'resultados'}
            </Typography>
          </Stack>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 790 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.map((usuario) => {
                  const activo = estaActivo(usuario);
                  return (
                    <TableRow key={usuario.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{usuario.nombre}</TableCell>
                      <TableCell>{usuario.usuario}</TableCell>
                      <TableCell>{usuario.rol}</TableCell>
                      <TableCell>{usuario.email || usuario.telefono || '—'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={activo ? 'Activo' : 'Inactivo'} color={activo ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Ver información">
                          <IconButton
                            aria-label={`Ver información de ${usuario.nombre}`}
                            onClick={() => {
                              establecerUsuarioSeleccionado(usuario);
                              establecerDialogoDetalleAbierto(true);
                            }}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modificar usuario">
                          <IconButton aria-label={`Modificar ${usuario.nombre}`} onClick={() => abrirFormulario(usuario)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={activo ? 'Deshabilitar usuario' : 'Reactivar usuario'}>
                          <IconButton
                            aria-label={activo ? `Deshabilitar ${usuario.nombre}` : `Reactivar ${usuario.nombre}`}
                            color={activo ? 'default' : 'success'}
                            onClick={() => establecerUsuarioPendienteEstado(usuario)}
                          >
                            {activo ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {usuarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 4, textAlign: 'center' }}>
                      <Typography color="text.secondary">No hay usuarios que coincidan con los filtros.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={dialogoFormularioAbierto} onClose={() => establecerDialogoFormularioAbierto(false)} fullWidth maxWidth="md">
        <DialogTitle>{usuarioEditando ? 'Modificar usuario' : 'Alta completa de usuario'}</DialogTitle>
        <Box component="form" onSubmit={guardarUsuario}>
          <DialogContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            {error && <Alert severity="error" sx={{ gridColumn: '1 / -1' }}>{error}</Alert>}
            <TextField required autoFocus label="Nombre y apellido" value={formulario.nombre} onChange={(evento) => actualizarCampo('nombre', evento.target.value)} />
            <TextField required label="DNI" value={formulario.documento} onChange={(evento) => actualizarCampo('documento', evento.target.value)} />
            <TextField label="Domicilio" value={formulario.direccion} onChange={(evento) => actualizarCampo('direccion', evento.target.value)} />
            <TextField label="Teléfono" value={formulario.telefono} onChange={(evento) => actualizarCampo('telefono', evento.target.value)} />
            <TextField type="email" label="Correo electrónico" value={formulario.email} onChange={(evento) => actualizarCampo('email', evento.target.value)} />
            <TextField type="date" label="Fecha de nacimiento" InputLabelProps={{ shrink: true }} value={formulario.fechaNacimiento} onChange={(evento) => actualizarCampo('fechaNacimiento', evento.target.value)} />
            <TextField required label="Usuario" value={formulario.usuario} onChange={(evento) => actualizarCampo('usuario', evento.target.value)} />
            <TextField
              required={!usuarioEditando}
              type="password"
              label={usuarioEditando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              helperText={usuarioEditando ? 'Dejala vacía para conservar la actual.' : ''}
              value={formulario.contrasena}
              onChange={(evento) => actualizarCampo('contrasena', evento.target.value)}
            />
            <TextField select required label="Rol" value={formulario.rol} onChange={(evento) => actualizarCampo('rol', evento.target.value)}>
              <MenuItem value="Tecnico">Técnico</MenuItem>
              <MenuItem value="Coordinador">Coordinador</MenuItem>
              <MenuItem value="Administrador">Administrador</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => establecerDialogoFormularioAbierto(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar usuario'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={dialogoDetalleAbierto} onClose={() => establecerDialogoDetalleAbierto(false)} fullWidth maxWidth="sm">
        <DialogTitle>Información del usuario</DialogTitle>
        <DialogContent>
          {usuarioSeleccionado && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
              {detalles.map(([etiqueta, valor]) => (
                <Box key={etiqueta} sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary">{etiqueta}</Typography>
                  <Typography sx={{ overflowWrap: 'anywhere' }}>{valor}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => establecerDialogoDetalleAbierto(false)}>Cerrar</Button>
          {usuarioSeleccionado && (
            <Button onClick={() => {
              establecerDialogoDetalleAbierto(false);
              abrirFormulario(usuarioSeleccionado);
            }}>
              Modificar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(usuarioPendienteEstado)} onClose={() => establecerUsuarioPendienteEstado(null)} fullWidth maxWidth="xs">
        <DialogTitle>
          {usuarioPendienteEstado && estaActivo(usuarioPendienteEstado) ? 'Deshabilitar usuario' : 'Reactivar usuario'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {usuarioPendienteEstado && estaActivo(usuarioPendienteEstado)
              ? `¿Querés deshabilitar a ${usuarioPendienteEstado.nombre}? Sus datos se conservarán.`
              : `¿Querés volver a habilitar a ${usuarioPendienteEstado?.nombre}?`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => establecerUsuarioPendienteEstado(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color={usuarioPendienteEstado && estaActivo(usuarioPendienteEstado) ? 'error' : 'success'}
            onClick={cambiarEstadoUsuario}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default UsuariosAdmin;