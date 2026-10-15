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
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import { useState } from 'react';
import FichaDetalle from '../comunes/FichaDetalle.jsx';
import { useAppData } from '../../context/useAppData.js';
import { useRecursos } from '../../context/useRecursos.js';

const perfilesVacios = {
  Administrador: { departamento: '', nivelAcceso: '' },
  Coordinador: { zonaAsignada: '', maxTecnicosACargo: '' },
  Tecnico: {
    documento: '',
    fechaNacimiento: '',
    vencimientoRegistro: '',
    telefono: '',
    email: '',
    direccion: '',
  },
};

const etiquetasPerfil = {
  departamento: 'Departamento',
  nivelAcceso: 'Nivel de acceso',
  zonaAsignada: 'Zona asignada',
  maxTecnicosACargo: 'Máximo de técnicos a cargo',
  documento: 'DNI',
  fechaNacimiento: 'Fecha de nacimiento',
  vencimientoRegistro: 'Vencimiento de registro',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
  direccion: 'Domicilio',
};

const crearFormularioVacio = () => ({
  nombre: '',
  usuario: '',
  contrasena: '',
  rol: 'Tecnico',
  perfil: { ...perfilesVacios.Tecnico },
});

const fechaParaFormulario = (fecha) => {
  if (!fecha) return '';
  const fechaParseada = new Date(fecha);
  return Number.isNaN(fechaParseada.getTime()) ? '' : fechaParseada.toISOString().slice(0, 10);
};

const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const fechaISO = fecha instanceof Date
    ? fecha.toISOString().slice(0, 10)
    : String(fecha).slice(0, 10);
  const fechaLocal = new Date(`${fechaISO}T12:00:00`);
  return Number.isNaN(fechaLocal.getTime())
    ? String(fecha)
    : new Intl.DateTimeFormat('es-AR').format(fechaLocal);
};

const obtenerPerfilEditable = (usuario, rol) => Object.fromEntries(
  Object.keys(perfilesVacios[rol]).map((campo) => [
    campo,
    usuario?.perfil?.[campo] ?? usuario?.[campo] ?? '',
  ]),
);

const estaActivo = (usuario) => usuario.activo !== false;

function UsuariosAdmin() {
  const { crearUsuario, actualizarUsuario } = useAppData();
  const data = useRecursos('usuarios', 'vehiculos');
  const [busqueda, establecerBusqueda] = useState('');
  const [filtroRol, establecerFiltroRol] = useState('Todos');
  const [filtroEstado, establecerFiltroEstado] = useState('Todos');
  const [dialogoFormularioAbierto, establecerDialogoFormularioAbierto] = useState(false);
  const [dialogoDetalleAbierto, establecerDialogoDetalleAbierto] = useState(false);
  const [usuarioEditando, establecerUsuarioEditando] = useState(null);
  const [usuarioSeleccionado, establecerUsuarioSeleccionado] = useState(null);
  const [usuarioPendienteEstado, establecerUsuarioPendienteEstado] = useState(null);
  const [formulario, establecerFormulario] = useState(crearFormularioVacio);
  const [error, establecerError] = useState('');
  const [guardando, establecerGuardando] = useState(false);

  const termino = busqueda.trim().toLocaleLowerCase('es');
  const usuarios = data.usuarios
    .filter((usuario) => {
      const coincideEstado = filtroEstado === 'Todos'
        || (filtroEstado === 'Activos' ? estaActivo(usuario) : !estaActivo(usuario));
      const coincideRol = filtroRol === 'Todos' || usuario.rol === filtroRol;
      const texto = [
        usuario.nombre,
        usuario.usuario,
        usuario.perfil?.documento,
        usuario.perfil?.email,
        usuario.rol,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('es');
      return coincideEstado && coincideRol && texto.includes(termino);
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

  const abrirFormulario = (usuario = null) => {
    establecerUsuarioEditando(usuario);
    const rol = usuario?.rol || 'Tecnico';
    const perfil = obtenerPerfilEditable(usuario, rol);
    if (perfil.fechaNacimiento) perfil.fechaNacimiento = fechaParaFormulario(perfil.fechaNacimiento);
    if (perfil.vencimientoRegistro) perfil.vencimientoRegistro = fechaParaFormulario(perfil.vencimientoRegistro);
    establecerFormulario(usuario ? {
      nombre: usuario.nombre || '',
      usuario: usuario.usuario || '',
      contrasena: '',
      rol,
      perfil,
    } : crearFormularioVacio());
    establecerError('');
    establecerDialogoFormularioAbierto(true);
  };

  const actualizarCampo = (campo, valor) => {
    establecerFormulario((actual) => ({ ...actual, [campo]: valor }));
  };

  const actualizarPerfil = (campo, valor) => {
    establecerFormulario((actual) => ({
      ...actual,
      perfil: { ...actual.perfil, [campo]: valor },
    }));
  };

  const guardarUsuario = async (evento) => {
    evento.preventDefault();
    establecerError('');
    establecerGuardando(true);
    const camposPerfil = Object.keys(perfilesVacios[formulario.rol]);
    const cambios = {
      nombre: formulario.nombre.trim(),
      usuario: formulario.usuario.trim(),
      rol: formulario.rol,
      perfil: Object.fromEntries(camposPerfil.map((campo) => {
        const valor = formulario.perfil[campo] ?? '';
        if (valor === '') return [campo, null];
        if (campo === 'maxTecnicosACargo') return [campo, Number(valor)];
        return [campo, valor.trim()];
      })),
    };
    if (formulario.contrasena) cambios.contrasena = formulario.contrasena;
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

  const esTecnicoSeleccionado = usuarioSeleccionado?.rol === 'Tecnico';
  const vehiculoSeleccionado = esTecnicoSeleccionado
    ? data.vehiculos.find((item) => item.tecnicoAsignado === usuarioSeleccionado.id)
    : null;

  const seccionesDetalle = usuarioSeleccionado ? [
    {
      titulo: 'Cuenta',
      icono: <AccountCircleOutlinedIcon fontSize="small" />,
      campos: [
        ['Nombre de usuario', usuarioSeleccionado.usuario],
        ['Rol', usuarioSeleccionado.rol],
      ],
    },
    {
      titulo: 'Datos del perfil',
      icono: <BadgeOutlinedIcon fontSize="small" />,
      campos: Object.keys(perfilesVacios[usuarioSeleccionado.rol] || {}).map((campo) => {
        const valor = usuarioSeleccionado.perfil?.[campo];
        return [
          etiquetasPerfil[campo] || campo,
          campo === 'fechaNacimiento' || campo === 'vencimientoRegistro' ? formatearFecha(valor) : valor,
          campo === 'direccion' || campo === 'email' ? { anchoCompleto: true } : undefined,
        ];
      }),
    },
    ...(esTecnicoSeleccionado ? [{
      titulo: 'Vehículo asignado',
      icono: <DirectionsCarOutlinedIcon fontSize="small" />,
      campos: vehiculoSeleccionado ? [
        ['Vehículo', [vehiculoSeleccionado.marca, vehiculoSeleccionado.modelo].filter(Boolean).join(' ')],
        ['Patente', vehiculoSeleccionado.patente],
        ['Kilometraje actual', vehiculoSeleccionado.kilometraje?.actual != null
          ? `${vehiculoSeleccionado.kilometraje.actual.toLocaleString('es-AR')} km`
          : ''],
        ['Vencimiento del seguro', formatearFecha(vehiculoSeleccionado.seguro?.vence)],
      ] : [['Vehículo', 'Sin vehículo asignado', { anchoCompleto: true }]],
    }] : []),
  ] : [];

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
                      <TableCell>{usuario.perfil?.email || usuario.perfil?.telefono || '—'}</TableCell>
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
            <TextField required label="Usuario" value={formulario.usuario} onChange={(evento) => actualizarCampo('usuario', evento.target.value)} />
            <TextField
              required={!usuarioEditando}
              type="password"
              label={usuarioEditando ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              helperText={usuarioEditando ? 'Dejala vacía para conservar la actual.' : ''}
              value={formulario.contrasena}
              onChange={(evento) => actualizarCampo('contrasena', evento.target.value)}
            />
            <TextField select required label="Rol" value={formulario.rol} onChange={(evento) => {
              const rol = evento.target.value;
              establecerFormulario((actual) => ({
                ...actual,
                rol,
                perfil: { ...perfilesVacios[rol] },
              }));
            }}>
              <MenuItem value="Tecnico">Técnico</MenuItem>
              <MenuItem value="Coordinador">Coordinador</MenuItem>
              <MenuItem value="Administrador">Administrador</MenuItem>
            </TextField>
            {Object.entries(formulario.perfil).map(([campo, valor]) => (
              <TextField
                key={campo}
                label={etiquetasPerfil[campo]}
                type={campo === 'fechaNacimiento' || campo === 'vencimientoRegistro'
                  ? 'date'
                  : campo === 'maxTecnicosACargo' ? 'number' : campo === 'email' ? 'email' : 'text'}
                value={valor}
                onChange={(evento) => actualizarPerfil(campo, evento.target.value)}
                inputProps={campo === 'maxTecnicosACargo' ? { min: 0, step: 1 } : undefined}
                InputLabelProps={campo === 'fechaNacimiento' || campo === 'vencimientoRegistro'
                  ? { shrink: true }
                  : undefined}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => establecerDialogoFormularioAbierto(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar usuario'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <FichaDetalle
        abierto={dialogoDetalleAbierto && Boolean(usuarioSeleccionado)}
        alCerrar={() => establecerDialogoDetalleAbierto(false)}
        titulo={usuarioSeleccionado?.nombre}
        subtitulo={usuarioSeleccionado && `@${usuarioSeleccionado.usuario}`}
        chips={usuarioSeleccionado ? [
          { label: usuarioSeleccionado.rol, color: 'primary', variant: 'outlined' },
          estaActivo(usuarioSeleccionado)
            ? { label: 'Activo', color: 'success' }
            : { label: 'Inactivo', color: 'default' },
        ] : []}
        secciones={seccionesDetalle}
        acciones={(
          <>
            <Button onClick={() => establecerDialogoDetalleAbierto(false)}>Cerrar</Button>
            <Button
              variant="contained"
              startIcon={<EditOutlinedIcon />}
              onClick={() => {
                establecerDialogoDetalleAbierto(false);
                abrirFormulario(usuarioSeleccionado);
              }}
            >
              Modificar
            </Button>
          </>
        )}
      />

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