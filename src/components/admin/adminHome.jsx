import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useMemo, useState } from 'react';
import AppLayout from '../AppLayout.jsx';
import MapaTecnicos from '../coordinador/MapaTecnicos.jsx';
import Reclamos from '../coordinador/Reclamos.jsx';
import Vehiculos from '../coordinador/Vehiculos.jsx';
import { useAppData } from '../../context/useAppData.js';

const secciones = ['Panel de administración', 'Usuarios', 'Reclamos', 'Vehículos', 'Reportes'];

function TarjetaMetrica({ icono, etiqueta, valor, color = 'primary.main' }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ color, display: 'grid', placeItems: 'center' }}>{icono}</Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>{valor}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>{etiqueta}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// Componente principal para la pantalla del administrador.
function AdminHome({ usuario, nombre, alCerrarSesion, alCambiarTema, modo }) {
  const [seccion, establecerSeccion] = useState('Panel de administración');
  const [usuarioNuevo, establecerUsuarioNuevo] = useState({ nombre: '', documento: '', direccion: '', telefono: '', email: '', fechaNacimiento: '', usuario: '', contrasena: '', rol: 'Tecnico' });
  const [dialogoUsuarioAbierto, establecerDialogoUsuarioAbierto] = useState(false);
  const [usuariosExtra, establecerUsuariosExtra] = useState(() => (
    JSON.parse(localStorage.getItem('usuariosAdministracion') || '[]')
  ));
  const [servicios, establecerServicios] = useState(() => (
    JSON.parse(localStorage.getItem('serviciosAdministracion') || '[]')
  ));
  const [vehiculosExtra, establecerVehiculosExtra] = useState(() => (
    JSON.parse(localStorage.getItem('vehiculosAdministracion') || '[]')
  ));
  const [vehiculoNuevo, establecerVehiculoNuevo] = useState({ patente: '', marca: '', modelo: '', kilometrajeInicial: '', kilometrajeActual: '', companiaSeguro: '', poliza: '', venceSeguro: '', ultimoService: '', detalle: '' });
  const [servicioNuevo, establecerServicioNuevo] = useState({ cliente: '', tipo: 'Instalación' });
  const [filtrosReporte, establecerFiltrosReporte] = useState({ tecnicoId: 'Todos', desde: '', hasta: '' });
  const { data } = useAppData();

  const tecnicos = data.usuarios.filter((item) => item.rol === 'Tecnico');
  const usuarios = [...data.usuarios, ...usuariosExtra];
  const reclamosFinalizados = data.reclamos.filter((reclamo) => reclamo.estado === 'Finalizado');
  const reclamosPendientes = data.reclamos.filter((reclamo) => reclamo.estado !== 'Finalizado');

  const rendimiento = useMemo(() => tecnicos.map((tecnico) => {
    const trabajos = reclamosFinalizados.filter((reclamo) => reclamo.tecnicoId === tecnico.id).length;
    const jornadas = data.jornadas.filter((jornada) => jornada.tecnicoId === tecnico.id && jornada.fin);
    const horas = jornadas.reduce((total, jornada) => (
      total + ((new Date(jornada.fin) - new Date(jornada.inicio)) / 3600000)
    ), 0);
    return { ...tecnico, trabajos, horas: horas.toFixed(1) };
  }), [data.jornadas, reclamosFinalizados, tecnicos]);

  const reporte = useMemo(() => {
    const desde = filtrosReporte.desde ? new Date(`${filtrosReporte.desde}T00:00:00`) : null;
    const hasta = filtrosReporte.hasta ? new Date(`${filtrosReporte.hasta}T23:59:59`) : null;
    const servicios = data.reclamos.filter((reclamo) => {
      const fecha = new Date(reclamo.finalizadoEn || reclamo.fechaProgramada || reclamo.creadoEn);
      const coincideTecnico = filtrosReporte.tecnicoId === 'Todos'
        || reclamo.tecnicoId === Number(filtrosReporte.tecnicoId);
      return reclamo.estado === 'Finalizado'
        && coincideTecnico
        && (!desde || fecha >= desde)
        && (!hasta || fecha <= hasta);
    });
    const jornadas = data.jornadas.filter((jornada) => {
      const coincideTecnico = filtrosReporte.tecnicoId === 'Todos'
        || jornada.tecnicoId === Number(filtrosReporte.tecnicoId);
      const fecha = new Date(jornada.inicio);
      return coincideTecnico && (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
    });
    const dias = new Set(servicios.map((servicio) => (
      servicio.fechaProgramada || servicio.finalizadoEn?.slice(0, 10) || servicio.creadoEn.slice(0, 10)
    )));
    const horas = jornadas.reduce((total, jornada) => (
      total + (jornada.fin ? (new Date(jornada.fin) - new Date(jornada.inicio)) / 3600000 : 0)
    ), 0);
    const tipos = servicios.reduce((conteo, servicio) => ({
      ...conteo,
      [servicio.tipo]: (conteo[servicio.tipo] || 0) + 1,
    }), {});
    return { servicios, jornadas, dias: dias.size, horas: horas.toFixed(1), tipos };
  }, [data.jornadas, data.reclamos, filtrosReporte]);

  const actualizarFiltroReporte = (campo, valor) => {
    establecerFiltrosReporte((actual) => ({ ...actual, [campo]: valor }));
  };

  const guardarUsuarios = (nuevosUsuarios) => {
    establecerUsuariosExtra(nuevosUsuarios);
    localStorage.setItem('usuariosAdministracion', JSON.stringify(nuevosUsuarios));
  };

  const agregarUsuario = (evento) => {
    evento.preventDefault();
    if (!usuarioNuevo.nombre.trim() || !usuarioNuevo.usuario.trim()) return;
    guardarUsuarios([...usuariosExtra, {
      id: `local-${Date.now()}`,
      ...usuarioNuevo,
      activo: true,
    }]);
    establecerUsuarioNuevo({ nombre: '', documento: '', direccion: '', telefono: '', email: '', fechaNacimiento: '', usuario: '', contrasena: '', rol: 'Tecnico' });
    establecerDialogoUsuarioAbierto(false);
  };

  const cambiarEstadoUsuario = (id) => {
    guardarUsuarios(usuariosExtra.map((item) => (
      item.id === id ? { ...item, activo: !item.activo } : item
    )));
  };

  const agregarServicio = (evento) => {
    evento.preventDefault();
    if (!servicioNuevo.cliente.trim()) return;
    const serviciosActualizados = [...servicios, {
      id: Date.now(),
      ...servicioNuevo,
      tecnicoId: null,
      estado: 'Pendiente de asignación',
      creadoEn: new Date().toISOString(),
    }];
    establecerServicios(serviciosActualizados);
    localStorage.setItem('serviciosAdministracion', JSON.stringify(serviciosActualizados));
    establecerServicioNuevo({ cliente: '', tipo: 'Instalación' });
  };

  const cambiarEstadoServicio = (id) => {
    const serviciosActualizados = servicios.map((servicio) => (
      servicio.id === id
        ? { ...servicio, estado: servicio.estado === 'Pendiente de asignación' ? 'Asignado' : 'Pendiente de asignación' }
        : servicio
    ));
    establecerServicios(serviciosActualizados);
    localStorage.setItem('serviciosAdministracion', JSON.stringify(serviciosActualizados));
  };

  const asignarTecnicoServicio = (id, tecnicoId) => {
    const serviciosActualizados = servicios.map((servicio) => (
      servicio.id === id
        ? { ...servicio, tecnicoId: tecnicoId ? Number(tecnicoId) : null, estado: tecnicoId ? 'Asignado' : 'Pendiente de asignación' }
        : servicio
    ));
    establecerServicios(serviciosActualizados);
    localStorage.setItem('serviciosAdministracion', JSON.stringify(serviciosActualizados));
  };

  const agregarVehiculo = (evento) => {
    evento.preventDefault();
    if (!vehiculoNuevo.patente.trim() || !vehiculoNuevo.marca.trim() || !vehiculoNuevo.modelo.trim()) return;
    const nuevosVehiculos = [...vehiculosExtra, {
      id: `local-${Date.now()}`,
      ...vehiculoNuevo,
      tecnicoAsignado: null,
      disponible: true,
      kilometraje: { inicial: Number(vehiculoNuevo.kilometrajeInicial) || 0, actual: Number(vehiculoNuevo.kilometrajeActual) || 0, final: null },
      seguro: { compania: vehiculoNuevo.companiaSeguro, poliza: vehiculoNuevo.poliza, vence: vehiculoNuevo.venceSeguro },
    }];
    establecerVehiculosExtra(nuevosVehiculos);
    localStorage.setItem('vehiculosAdministracion', JSON.stringify(nuevosVehiculos));
    establecerVehiculoNuevo({ patente: '', marca: '', modelo: '', kilometrajeInicial: '', kilometrajeActual: '', companiaSeguro: '', poliza: '', venceSeguro: '', ultimoService: '', detalle: '' });
  };

  const actualizarVehiculoExtra = (vehiculoId, tecnicoId) => {
    const nuevosVehiculos = vehiculosExtra.map((vehiculo) => (
      vehiculo.id === vehiculoId ? { ...vehiculo, tecnicoAsignado: tecnicoId || null } : vehiculo
    ));
    establecerVehiculosExtra(nuevosVehiculos);
    localStorage.setItem('vehiculosAdministracion', JSON.stringify(nuevosVehiculos));
  };

  const contenidoPanel = (
    <Stack spacing={3}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        <TarjetaMetrica icono={<AssignmentIcon fontSize="large" />} etiqueta="Reclamos pendientes" valor={reclamosPendientes.length} color="warning.main" />
        <TarjetaMetrica icono={<SupportAgentIcon fontSize="large" />} etiqueta="Técnicos activos" valor={tecnicos.filter((item) => item.activo).length} color="success.main" />
        <TarjetaMetrica icono={<GroupIcon fontSize="large" />} etiqueta="Usuarios registrados" valor={usuarios.length} color="info.main" />
        <TarjetaMetrica icono={<QueryStatsIcon fontSize="large" />} etiqueta="Servicios gestionados" valor={servicios.length} color="secondary.main" />
      </Box>
      <MapaTecnicos />
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Rendimiento del equipo técnico</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 2 }}>
            Trabajos finalizados y horas registradas en jornadas cerradas.
          </Typography>
          <TablaRendimiento rendimiento={rendimiento} />
        </CardContent>
      </Card>
      <GestionServicios
        servicioNuevo={servicioNuevo}
        establecerServicioNuevo={establecerServicioNuevo}
        agregarServicio={agregarServicio}
        servicios={servicios}
        tecnicos={tecnicos}
        asignarTecnicoServicio={asignarTecnicoServicio}
        cambiarEstadoServicio={cambiarEstadoServicio}
      />
    </Stack>
  );

  const contenidoUsuarios = (
    <Stack spacing={3}>
      <Card>
        <CardContent><Button variant="contained" startIcon={<AddIcon />} onClick={() => establecerDialogoUsuarioAbierto(true)}>Nuevo usuario</Button></CardContent>
      </Card>
      <Dialog open={dialogoUsuarioAbierto} onClose={() => establecerDialogoUsuarioAbierto(false)} fullWidth maxWidth="md">
        <DialogTitle>Alta completa de usuario</DialogTitle>
        <Box component="form" onSubmit={agregarUsuario}>
          <DialogContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            <TextField required label="Nombre y apellido" value={usuarioNuevo.nombre} onChange={(evento) => establecerUsuarioNuevo({ ...usuarioNuevo, nombre: evento.target.value })} />
            <TextField required label="DNI" value={usuarioNuevo.documento} onChange={(evento) => establecerUsuarioNuevo({ ...usuarioNuevo, documento: evento.target.value })} />
            <TextField required label="Domicilio" value={usuarioNuevo.direccion} onChange={(evento) => establecerUsuarioNuevo({ ...usuarioNuevo, direccion: evento.target.value })} />
            <TextField label="Teléfono" value={usuarioNuevo.telefono} onChange={(evento) => establecerUsuarioNuevo({ ...usuarioNuevo, telefono: evento.target.value })} />
            <TextField type="email" label="Correo electrónico" value={usuarioNuevo.email} onChange={(evento) => establecerUsuarioNuevo({ ...usuarioNuevo, email: evento.target.value })} />
            <TextField type="date" label="Fecha de nacimiento" InputLabelProps={{ shrink: true }} value={usuarioNuevo.fechaNacimiento} onChange={(evento) => establecerUsuarioNuevo({ ...usuarioNuevo, fechaNacimiento: evento.target.value })} />
            <TextField required label="Usuario" value={usuarioNuevo.usuario} onChange={(evento) => establecerUsuarioNuevo({ ...usuarioNuevo, usuario: evento.target.value })} />
            <TextField required type="password" label="Contraseña" value={usuarioNuevo.contrasena} onChange={(evento) => establecerUsuarioNuevo({ ...usuarioNuevo, contrasena: evento.target.value })} />
            <TextField select required label="Rol" value={usuarioNuevo.rol} onChange={(evento) => establecerUsuarioNuevo({ ...usuarioNuevo, rol: evento.target.value })}>
              <MenuItem value="Tecnico">Técnico</MenuItem><MenuItem value="Coordinador">Coordinador</MenuItem><MenuItem value="Administrador">Administrador</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions><Button onClick={() => establecerDialogoUsuarioAbierto(false)}>Cancelar</Button><Button type="submit" variant="contained">Guardar usuario</Button></DialogActions>
        </Box>
      </Dialog>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Usuarios del sistema</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell>Nombre</TableCell><TableCell>Usuario</TableCell><TableCell>Rol</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acción</TableCell></TableRow></TableHead>
            <TableBody>{usuarios.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.nombre}</TableCell><TableCell>{item.usuario}</TableCell><TableCell>{item.rol}</TableCell>
                <TableCell><Chip size="small" label={item.activo ? 'Activo' : 'Inactivo'} color={item.activo ? 'success' : 'default'} /></TableCell>
                <TableCell align="right">{String(item.id).startsWith('local-') && <Button size="small" onClick={() => cambiarEstadoUsuario(item.id)}>{item.activo ? 'Dar de baja' : 'Reactivar'}</Button>}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </Stack>
  );

  const contenidoReportes = (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Historial de servicios</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField select fullWidth label="Técnico" value={filtrosReporte.tecnicoId} onChange={(evento) => actualizarFiltroReporte('tecnicoId', evento.target.value)}>
              <MenuItem value="Todos">Todos los técnicos</MenuItem>
              {tecnicos.map((tecnico) => <MenuItem key={tecnico.id} value={tecnico.id}>{tecnico.nombre}</MenuItem>)}
            </TextField>
            <TextField fullWidth type="date" label="Desde" InputLabelProps={{ shrink: true }} value={filtrosReporte.desde} onChange={(evento) => actualizarFiltroReporte('desde', evento.target.value)} />
            <TextField fullWidth type="date" label="Hasta" InputLabelProps={{ shrink: true }} value={filtrosReporte.hasta} onChange={(evento) => actualizarFiltroReporte('hasta', evento.target.value)} />
          </Stack>
        </CardContent>
      </Card>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        <TarjetaMetrica icono={<AssignmentIcon fontSize="large" />} etiqueta="Servicios realizados" valor={reporte.servicios.length} color="success.main" />
        <TarjetaMetrica icono={<QueryStatsIcon fontSize="large" />} etiqueta="Días de servicio" valor={reporte.dias} color="info.main" />
        <TarjetaMetrica icono={<SupportAgentIcon fontSize="large" />} etiqueta="Horas registradas" valor={`${reporte.horas} h`} color="secondary.main" />
        <TarjetaMetrica icono={<GroupIcon fontSize="large" />} etiqueta="Tipos de servicio" valor={Object.keys(reporte.tipos).length} color="warning.main" />
      </Box>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Detalle de productividad</Typography>
          <TablaRendimiento rendimiento={rendimiento} />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Servicios finalizados en el período</Typography>
          {reporte.servicios.length === 0 ? <Typography color="text.secondary">No hay servicios que coincidan con los filtros.</Typography> : (
            <Table size="small"><TableHead><TableRow><TableCell>Fecha</TableCell><TableCell>Técnico</TableCell><TableCell>Tipo</TableCell><TableCell>Estado</TableCell><TableCell>Zona</TableCell></TableRow></TableHead><TableBody>{reporte.servicios.map((servicio) => <TableRow key={servicio.id}><TableCell>{servicio.fechaProgramada || new Date(servicio.finalizadoEn || servicio.creadoEn).toLocaleDateString('es-AR')}</TableCell><TableCell>{tecnicos.find((tecnico) => tecnico.id === servicio.tecnicoId)?.nombre || 'Sin técnico'}</TableCell><TableCell>{servicio.tipo}</TableCell><TableCell><Chip size="small" label="Finalizado" color="success" /></TableCell><TableCell>{servicio.agrupacionGeografica || 'Sin zona'}</TableCell></TableRow>)}</TableBody></Table>
          )}
        </CardContent>
      </Card>
    </Stack>
  );

  const contenidoPorSeccion = {
    'Panel de administración': contenidoPanel,
    Usuarios: contenidoUsuarios,
    Reclamos: <Reclamos />,
    Vehículos: (
      <Stack spacing={3}>
        <GestionVehiculos
          vehiculoNuevo={vehiculoNuevo}
          establecerVehiculoNuevo={establecerVehiculoNuevo}
          agregarVehiculo={agregarVehiculo}
        />
        <Vehiculos
          gestionable
          vehiculosExtra={vehiculosExtra}
          alActualizarVehiculo={actualizarVehiculoExtra}
        />
      </Stack>
    ),
    Reportes: contenidoReportes,
  };

  return (
    <AppLayout
      titulo={seccion}
      subtitulo="Supervisá la operación general y mantené ordenado el equipo de trabajo."
      rol="Administrador"
      usuario={usuario}
      nombre={nombre}
      opciones={secciones}
      alCerrarSesion={alCerrarSesion}
      alCambiarTema={alCambiarTema}
      modo={modo}
      alSeleccionarOpcion={establecerSeccion}
    >
      {contenidoPorSeccion[seccion]}
    </AppLayout>
  );
}

function TablaRendimiento({ rendimiento }) {
  return <Table size="small"><TableHead><TableRow><TableCell>Técnico</TableCell><TableCell>Trabajos realizados</TableCell><TableCell>Horas de servicio</TableCell><TableCell>Estado</TableCell></TableRow></TableHead><TableBody>{rendimiento.map((tecnico) => <TableRow key={tecnico.id}><TableCell sx={{ fontWeight: 700 }}>{tecnico.nombre}</TableCell><TableCell>{tecnico.trabajos}</TableCell><TableCell>{tecnico.horas} h</TableCell><TableCell><Chip size="small" label={tecnico.activo ? 'Activo' : 'Inactivo'} color={tecnico.activo ? 'success' : 'default'} /></TableCell></TableRow>)}</TableBody></Table>;
}

function GestionVehiculos({ vehiculoNuevo, establecerVehiculoNuevo, agregarVehiculo }) {
  const [dialogoAbierto, establecerDialogoAbierto] = useState(false);
  const actualizar = (campo, valor) => establecerVehiculoNuevo({ ...vehiculoNuevo, [campo]: valor });
  return <Card><CardContent><Button variant="contained" startIcon={<AddIcon />} onClick={() => establecerDialogoAbierto(true)}>Nuevo vehículo</Button><Dialog open={dialogoAbierto} onClose={() => establecerDialogoAbierto(false)} fullWidth maxWidth="md"><DialogTitle>Alta completa de vehículo</DialogTitle><Box component="form" onSubmit={(evento) => { agregarVehiculo(evento); establecerDialogoAbierto(false); }}><DialogContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}><TextField required label="Patente" value={vehiculoNuevo.patente} onChange={(evento) => actualizar('patente', evento.target.value)} /><TextField required label="Marca" value={vehiculoNuevo.marca} onChange={(evento) => actualizar('marca', evento.target.value)} /><TextField required label="Modelo" value={vehiculoNuevo.modelo} onChange={(evento) => actualizar('modelo', evento.target.value)} /><TextField required type="number" label="Kilometraje inicial" value={vehiculoNuevo.kilometrajeInicial} onChange={(evento) => actualizar('kilometrajeInicial', evento.target.value)} /><TextField required type="number" label="Kilometraje actual" value={vehiculoNuevo.kilometrajeActual} onChange={(evento) => actualizar('kilometrajeActual', evento.target.value)} /><TextField required label="Compañía de seguro" value={vehiculoNuevo.companiaSeguro} onChange={(evento) => actualizar('companiaSeguro', evento.target.value)} /><TextField required label="Número de póliza" value={vehiculoNuevo.poliza} onChange={(evento) => actualizar('poliza', evento.target.value)} /><TextField required type="date" label="Vencimiento del seguro" InputLabelProps={{ shrink: true }} value={vehiculoNuevo.venceSeguro} onChange={(evento) => actualizar('venceSeguro', evento.target.value)} /><TextField required type="date" label="Último service" InputLabelProps={{ shrink: true }} value={vehiculoNuevo.ultimoService} onChange={(evento) => actualizar('ultimoService', evento.target.value)} /><TextField multiline minRows={2} label="Detalle" value={vehiculoNuevo.detalle} onChange={(evento) => actualizar('detalle', evento.target.value)} /></DialogContent><DialogActions><Button onClick={() => establecerDialogoAbierto(false)}>Cancelar</Button><Button type="submit" variant="contained">Guardar vehículo</Button></DialogActions></Box></Dialog></CardContent></Card>;
}

function GestionServicios({ servicioNuevo, establecerServicioNuevo, agregarServicio, servicios, tecnicos, asignarTecnicoServicio }) {
  return <Card><CardContent><Typography variant="h6" sx={{ fontWeight: 800 }}>Instalaciones y bajas de servicio</Typography><Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 2 }}>Registrá las órdenes que luego deberán ser asignadas por el administrador o el coordinador.</Typography><Stack component="form" onSubmit={agregarServicio} direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}><TextField required fullWidth label="Cliente o domicilio" value={servicioNuevo.cliente} onChange={(evento) => establecerServicioNuevo({ ...servicioNuevo, cliente: evento.target.value })} /><TextField select label="Tipo de servicio" value={servicioNuevo.tipo} onChange={(evento) => establecerServicioNuevo({ ...servicioNuevo, tipo: evento.target.value })}><MenuItem value="Instalación">Instalación</MenuItem><MenuItem value="Baja de servicio">Baja de servicio</MenuItem></TextField><Button type="submit" variant="contained" startIcon={<AddIcon />} sx={{ minWidth: 170 }}>Registrar orden</Button></Stack>{servicios.length === 0 ? <Typography color="text.secondary">Todavía no hay órdenes registradas.</Typography> : servicios.map((servicio) => <Stack key={servicio.id} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ py: 1.25, borderTop: 1, borderColor: 'divider', alignItems: { sm: 'center' } }}><Typography sx={{ flex: 1, fontWeight: 700 }}>{servicio.tipo}: {servicio.cliente}</Typography><TextField select size="small" label="Técnico" value={servicio.tecnicoId || ''} onChange={(evento) => asignarTecnicoServicio(servicio.id, evento.target.value)} sx={{ minWidth: 190 }}><MenuItem value="">Sin asignar</MenuItem>{tecnicos.filter((tecnico) => tecnico.activo).map((tecnico) => <MenuItem key={tecnico.id} value={tecnico.id}>{tecnico.nombre}</MenuItem>)}</TextField><Chip size="small" label={servicio.estado} color={servicio.estado === 'Asignado' ? 'success' : 'warning'} /></Stack>)}</CardContent></Card>;
}

export default AdminHome;
