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
  Divider,
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
import CloseIcon from '@mui/icons-material/Close';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useMemo, useState } from 'react';
import AppLayout from '../AppLayout.jsx';
import Clientes from './Clientes.jsx';
import UsuariosAdmin from './UsuariosAdmin.jsx';
import MapaTecnicos from '../coordinador/MapaTecnicos.jsx';
import Reclamos from '../coordinador/Reclamos.jsx';
import Vehiculos from '../coordinador/Vehiculos.jsx';
import { useAppData } from '../../context/useAppData.js';

const secciones = ['Panel de administración', 'Usuarios', 'Clientes', 'Reclamos', 'Vehículos', 'Reportes'];

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
  const [formularioReclamoAbierto, establecerFormularioReclamoAbierto] = useState(false);
  const [vehiculosExtra, establecerVehiculosExtra] = useState(() => (
    JSON.parse(localStorage.getItem('vehiculosAdministracion') || '[]')
  ));
  const [vehiculoNuevo, establecerVehiculoNuevo] = useState({ patente: '', marca: '', modelo: '', kilometrajeInicial: '', kilometrajeActual: '', companiaSeguro: '', poliza: '', venceSeguro: '', ultimoService: '', detalle: '' });
  const [filtrosReporte, establecerFiltrosReporte] = useState({ tecnicoId: 'Todos', desde: '', hasta: '' });
  const { data, actualizarAsignacion } = useAppData();

  const ordenesServicio = useMemo(() => (
    data.reclamos.filter((r) => r.esOrden || r.tipo === 'Instalación' || r.tipo === 'Baja de servicio')
  ), [data.reclamos]);

  const tecnicos = data.usuarios.filter((item) => item.rol === 'Tecnico');
  const usuarios = data.usuarios;
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

  const rendimientoPeriodo = useMemo(() => tecnicos.map((tecnico) => {
    const trabajos = reporte.servicios.filter((servicio) => servicio.tecnicoId === tecnico.id).length;
    const jornadas = reporte.jornadas.filter((jornada) => jornada.tecnicoId === tecnico.id);
    const horas = jornadas.reduce((total, jornada) => (
      total + (jornada.fin ? (new Date(jornada.fin) - new Date(jornada.inicio)) / 3600000 : 0)
    ), 0);
    const dias = new Set(jornadas.map((jornada) => new Date(jornada.inicio).toLocaleDateString('es-AR'))).size;
    return { ...tecnico, trabajos, horas: Number(horas.toFixed(1)), dias };
  }), [reporte, tecnicos]);

  const actualizarFiltroReporte = (campo, valor) => {
    establecerFiltrosReporte((actual) => ({ ...actual, [campo]: valor }));
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
        <TarjetaMetrica icono={<QueryStatsIcon fontSize="large" />} etiqueta="Servicios gestionados" valor={ordenesServicio.length} color="secondary.main" />
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
    </Stack>
  );

  const contenidoReclamos = (
    <Stack spacing={3}>
      <Reclamos
        formularioAbierto={formularioReclamoAbierto}
        establecerFormularioAbierto={establecerFormularioReclamoAbierto}
      />
    </Stack>
  );

  const contenidoUsuarios = <UsuariosAdmin />;

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
          <GraficosRendimiento rendimiento={rendimientoPeriodo} tecnicoId={filtrosReporte.tecnicoId} />
          <Divider sx={{ my: 3 }} />
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
    Clientes: <Clientes />,
    Reclamos: contenidoReclamos,
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
      accionTitulo={seccion === 'Reclamos' && (
        <Stack direction="row" spacing={1.5} sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, flexShrink: 0 }}>
          <Button
            variant={formularioReclamoAbierto === 'reclamo' ? 'outlined' : 'contained'}
            startIcon={formularioReclamoAbierto === 'reclamo' ? <CloseIcon /> : <AddIcon />}
            onClick={() => establecerFormularioReclamoAbierto((actual) => (actual === 'reclamo' ? false : 'reclamo'))}
          >
            {formularioReclamoAbierto === 'reclamo' ? 'Cerrar alta' : 'Nuevo reclamo'}
          </Button>
          <Button
            variant={formularioReclamoAbierto === 'orden' ? 'outlined' : 'contained'}
            color="secondary"
            startIcon={formularioReclamoAbierto === 'orden' ? <CloseIcon /> : <AddIcon />}
            onClick={() => establecerFormularioReclamoAbierto((actual) => (actual === 'orden' ? false : 'orden'))}
          >
            {formularioReclamoAbierto === 'orden' ? 'Cerrar alta' : 'Registrar orden'}
          </Button>
        </Stack>
      )}
    >
      {contenidoPorSeccion[seccion]}
    </AppLayout>
  );
}

function TablaRendimiento({ rendimiento }) {
  return <Table size="small"><TableHead><TableRow><TableCell>Técnico</TableCell><TableCell>Trabajos realizados</TableCell><TableCell>Horas de servicio</TableCell><TableCell>Estado</TableCell></TableRow></TableHead><TableBody>{rendimiento.map((tecnico) => <TableRow key={tecnico.id}><TableCell sx={{ fontWeight: 700 }}>{tecnico.nombre}</TableCell><TableCell>{tecnico.trabajos}</TableCell><TableCell>{tecnico.horas} h</TableCell><TableCell><Chip size="small" label={tecnico.activo ? 'Activo' : 'Inactivo'} color={tecnico.activo ? 'success' : 'default'} /></TableCell></TableRow>)}</TableBody></Table>;
}

function GraficosRendimiento({ rendimiento, tecnicoId }) {
  const datosGrupales = rendimiento.map((tecnico) => ({
    etiqueta: tecnico.nombre,
    valor: tecnico.trabajos,
    detalle: `${tecnico.trabajos} servicios`,
  }));
  const tecnico = rendimiento.find((item) => item.id === Number(tecnicoId));
  const datosIndividuales = tecnico
    ? [
      { etiqueta: 'Servicios finalizados', valor: tecnico.trabajos, detalle: `${tecnico.trabajos}` },
      { etiqueta: 'Horas trabajadas', valor: tecnico.horas, detalle: `${tecnico.horas} h` },
      { etiqueta: 'Días trabajados', valor: tecnico.dias, detalle: `${tecnico.dias}` },
    ]
    : [];

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <GraficoBarras
          titulo="Desempeño grupal"
          subtitulo="Servicios finalizados por técnico en el período seleccionado."
          datos={datosGrupales}
          color="primary.main"
        />
        <GraficoBarras
          titulo={tecnico ? `Desempeño individual: ${tecnico.nombre}` : 'Desempeño individual'}
          subtitulo={tecnico ? 'Resumen de actividad del técnico filtrado.' : 'Elegí un técnico para ver su resumen individual.'}
          datos={datosIndividuales}
          color="secondary.main"
        />
      </Stack>
    </Stack>
  );
}

function GraficoBarras({ titulo, subtitulo, datos, color }) {
  const maximo = Math.max(1, ...datos.map((dato) => dato.valor));

  return (
    <Box sx={{ flex: 1, minWidth: 0, p: 2, border: 1, borderColor: 'divider', borderRadius: 1.5, backgroundColor: 'action.hover' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{titulo}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{subtitulo}</Typography>
      {datos.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No hay datos para mostrar.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {datos.map((dato) => (
            <Box key={dato.etiqueta}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {dato.etiqueta}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, flexShrink: 0 }}>{dato.detalle}</Typography>
              </Stack>
              <Box sx={{ height: 10, borderRadius: 5, backgroundColor: 'background.paper', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${(dato.valor / maximo) * 100}%`, minWidth: dato.valor > 0 ? 6 : 0, borderRadius: 5, backgroundColor: color, transition: 'width 240ms ease' }} />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function GestionVehiculos({ vehiculoNuevo, establecerVehiculoNuevo, agregarVehiculo }) {
  const [dialogoAbierto, establecerDialogoAbierto] = useState(false);
  const actualizar = (campo, valor) => establecerVehiculoNuevo({ ...vehiculoNuevo, [campo]: valor });
  return <Card><CardContent><Button variant="contained" startIcon={<AddIcon />} onClick={() => establecerDialogoAbierto(true)}>Nuevo vehículo</Button><Dialog open={dialogoAbierto} onClose={() => establecerDialogoAbierto(false)} fullWidth maxWidth="md"><DialogTitle>Alta completa de vehículo</DialogTitle><Box component="form" onSubmit={(evento) => { agregarVehiculo(evento); establecerDialogoAbierto(false); }}><DialogContent sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}><TextField required label="Patente" value={vehiculoNuevo.patente} onChange={(evento) => actualizar('patente', evento.target.value)} /><TextField required label="Marca" value={vehiculoNuevo.marca} onChange={(evento) => actualizar('marca', evento.target.value)} /><TextField required label="Modelo" value={vehiculoNuevo.modelo} onChange={(evento) => actualizar('modelo', evento.target.value)} /><TextField required type="number" label="Kilometraje inicial" value={vehiculoNuevo.kilometrajeInicial} onChange={(evento) => actualizar('kilometrajeInicial', evento.target.value)} /><TextField required type="number" label="Kilometraje actual" value={vehiculoNuevo.kilometrajeActual} onChange={(evento) => actualizar('kilometrajeActual', evento.target.value)} /><TextField required label="Compañía de seguro" value={vehiculoNuevo.companiaSeguro} onChange={(evento) => actualizar('companiaSeguro', evento.target.value)} /><TextField required label="Número de póliza" value={vehiculoNuevo.poliza} onChange={(evento) => actualizar('poliza', evento.target.value)} /><TextField required type="date" label="Vencimiento del seguro" InputLabelProps={{ shrink: true }} value={vehiculoNuevo.venceSeguro} onChange={(evento) => actualizar('venceSeguro', evento.target.value)} /><TextField required type="date" label="Último service" InputLabelProps={{ shrink: true }} value={vehiculoNuevo.ultimoService} onChange={(evento) => actualizar('ultimoService', evento.target.value)} /><TextField multiline minRows={2} label="Detalle" value={vehiculoNuevo.detalle} onChange={(evento) => actualizar('detalle', evento.target.value)} /></DialogContent><DialogActions><Button onClick={() => establecerDialogoAbierto(false)}>Cancelar</Button><Button type="submit" variant="contained">Guardar vehículo</Button></DialogActions></Box></Dialog></CardContent></Card>;
}

export default AdminHome;
