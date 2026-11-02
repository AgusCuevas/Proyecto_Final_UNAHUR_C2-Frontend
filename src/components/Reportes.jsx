import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, Drawer, FormControlLabel, IconButton, MenuItem,
  Paper, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { reportesApi, reclamosApi } from '../services/api.js';

const plantillas = [
  { nombre: 'Reclamos abiertos sin asignar', fuente: 'reclamos', filtros: [{ campo: 'estado', operador: 'esUnoDe', valor: ['Abierto'] }] },
  { nombre: 'Reclamos bloqueados', fuente: 'reclamos', filtros: [{ campo: 'estado', operador: 'esUnoDe', valor: ['Bloqueado'] }] },
  { nombre: 'Reclamos finalizados del mes', fuente: 'reclamos', filtros: [{ campo: 'estado', operador: 'esUnoDe', valor: ['Finalizado'] }, { campo: 'finalizadoEn', operador: 'esteMes' }] },
  { nombre: 'Reclamos por técnico (mes)', fuente: 'reclamos', filtros: [{ campo: 'creadoEn', operador: 'esteMes' }], agrupacion: { por: 'tecnico', calculo: 'cantidad' } },
  { nombre: 'Jornadas del mes', fuente: 'jornadas', filtros: [{ campo: 'fecha', operador: 'esteMes' }] },
  { nombre: 'Seguros por vencer', fuente: 'vehiculos', filtros: [{ campo: 'diasParaVencer', operador: 'menor', valor: 30 }] },
];

const inicial = { fuente: 'reclamos', columnas: [], filtros: [], orden: { campo: 'creadoEn', sentido: 'desc' }, agrupacion: null };
const valorVisible = (valor, tipo) => {
  if (valor == null) return '-';
  if (tipo === 'booleano') return valor ? 'Sí' : 'No';
  if (tipo === 'fecha') return new Date(valor).toLocaleString('es-AR');
  if (typeof valor === 'number') return Number.isInteger(valor) ? valor : valor.toFixed(1);
  return String(valor);
};

function definirVista(vista, reporteId = '') {
  const params = new URLSearchParams(window.location.search);
  params.set('reportes', vista);
  if (reporteId) params.set('reporte', reporteId); else params.delete('reporte');
  window.history.pushState({}, '', `${window.location.pathname}?${params}`);
}

function Reportes({ rolId = 1 }) {
  const [vista, setVista] = useState(() => new URLSearchParams(window.location.search).get('reportes') || 'inicio');
  const [fuentes, setFuentes] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [definicion, setDefinicion] = useState(inicial);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [compartidoCon, setCompartidoCon] = useState([]);
  const [reporteId, setReporteId] = useState(null);
  const [resultado, setResultado] = useState({ datos: [], total: 0, paginacion: { pagina: 1, paginas: 1 }, columnas: [] });
  const [pagina, setPagina] = useState(1);
  const [buscar, setBuscar] = useState('');
  const [columnasVisibles, setColumnasVisibles] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [dialogoFiltro, setDialogoFiltro] = useState(false);
  const [filtroNuevo, setFiltroNuevo] = useState({ campo: '', operador: '', valor: '' });

  const catalogo = useMemo(() => fuentes.find((item) => item.fuente === definicion.fuente), [fuentes, definicion.fuente]);
  const columnasDisponibles = catalogo?.columnas || [];
  const mostrarError = (exception) => setError(exception.response?.data?.mensaje || 'No se pudo completar la operación');

  useEffect(() => {
    let activo = true;
    Promise.all([reportesApi.fuentes(), reportesApi.listar()]).then(([catalogoRespuesta, reportesRespuesta]) => {
      if (!activo) return;
      setFuentes(catalogoRespuesta.fuentes || []);
      setReportes(reportesRespuesta || []);
    }).catch(mostrarError);
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    const alNavegar = () => setVista(new URLSearchParams(window.location.search).get('reportes') || 'inicio');
    window.addEventListener('popstate', alNavegar);
    return () => window.removeEventListener('popstate', alNavegar);
  }, []);

  const cargarResultado = useCallback(async (paginaSolicitada = 1, definicionActual = definicion) => {
    if (!definicionActual.columnas.length) return;
    setCargando(true); setError('');
    try {
      const datos = await reportesApi.vistaPrevia({ definicion: definicionActual, pagina: paginaSolicitada, limite: 15, buscar });
      setResultado(datos); setPagina(paginaSolicitada);
      setColumnasVisibles((actuales) => actuales.length ? actuales : definicionActual.columnas);
    } catch (exception) { mostrarError(exception); } finally { setCargando(false); }
  }, [buscar, definicion]);

  const abrirConstructor = (reporte = null, plantilla = null) => {
    const fuente = reporte?.definicion?.fuente || plantilla?.fuente || 'reclamos';
    const columnas = reporte?.definicion?.columnas || fuentes.find((item) => item.fuente === fuente)?.columnas.map((item) => item.campo) || [];
    const nueva = { ...inicial, ...(reporte?.definicion || plantilla || {}), fuente, columnas };
    setDefinicion(nueva); setNombre(reporte?.nombre || plantilla?.nombre || ''); setDescripcion(reporte?.descripcion || '');
    setCompartidoCon(reporte?.compartidoCon || []);
    setReporteId(reporte?.id || null); setError(''); definirVista('constructor', reporte?.id || '');
    setVista('constructor');
  };

  const cambiarFuente = (fuente) => {
    const columnas = fuentes.find((item) => item.fuente === fuente)?.columnas || [];
    setDefinicion((actual) => ({ ...actual, fuente, columnas: columnas.map((item) => item.campo), filtros: [], agrupacion: null }));
  };
  const cambiarColumnas = (campo) => setDefinicion((actual) => ({ ...actual, columnas: actual.columnas.includes(campo) ? actual.columnas.filter((item) => item !== campo) : [...actual.columnas, campo] }));
  const agregarFiltro = () => {
    if (!filtroNuevo.campo || !filtroNuevo.operador) return;
    const columna = columnasDisponibles.find((item) => item.campo === filtroNuevo.campo);
    let valor = filtroNuevo.valor;
    if (['esUnoDe', 'noEsNingunoDe'].includes(filtroNuevo.operador)) valor = String(valor).split(',').map((item) => item.trim()).filter(Boolean);
    if (columna?.tipo === 'numero' && filtroNuevo.operador !== 'entre') valor = Number(valor);
    setDefinicion((actual) => ({ ...actual, filtros: [...actual.filtros, { campo: filtroNuevo.campo, operador: filtroNuevo.operador, valor }] }));
    setFiltroNuevo({ campo: '', operador: '', valor: '' }); setDialogoFiltro(false);
  };
  const guardar = async () => {
    try {
      const datos = { nombre: nombre.trim() || 'Reporte sin nombre', descripcion, definicion, compartidoCon };
      const guardado = reporteId ? await reportesApi.actualizar(reporteId, datos) : await reportesApi.crear(datos);
      setReportes((actuales) => [guardado, ...actuales.filter((item) => item.id !== guardado.id)]);
      setReporteId(guardado.id); setError(''); definirVista('resultado', guardado.id); setVista('resultado'); await cargarResultado(1);
    } catch (exception) { mostrarError(exception); }
  };
  const exportar = async () => {
    try {
      const respuesta = await reportesApi.exportar({ nombre, definicion, columnasVisibles });
      const url = URL.createObjectURL(respuesta.data); const enlace = document.createElement('a');
      enlace.href = url; enlace.download = `${nombre || 'reporte'}.csv`; enlace.click(); URL.revokeObjectURL(url);
    } catch (exception) { mostrarError(exception); }
  };
  const borrar = async (id) => {
    try { await reportesApi.eliminar(id); setReportes((actuales) => actuales.filter((item) => item.id !== id)); } catch (exception) { mostrarError(exception); }
  };
  const seleccionarResultado = (nuevo = definicion) => { setDefinicion(nuevo); definirVista('resultado', reporteId || ''); setVista('resultado'); cargarResultado(1, nuevo); };

  if (vista === 'inicio') return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
        <Box><Typography variant="h5" fontWeight={800}>Reportes</Typography><Typography color="text.secondary">Armá, guardá y exportá reportes sin salir del módulo.</Typography></Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => abrirConstructor()}>Nuevo reporte</Button>
      </Stack>
      <Card><CardContent><Typography variant="h6" fontWeight={800} mb={2}>Plantillas</Typography><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>{plantillas.filter((item) => item.fuente !== 'clientes' || rolId === 1).map((plantilla) => <Paper key={plantilla.nombre} variant="outlined" sx={{ p: 2 }}><Typography fontWeight={700}>{plantilla.nombre}</Typography><Typography variant="body2" color="text.secondary" my={1}>{fuentes.find((item) => item.fuente === plantilla.fuente)?.etiqueta || plantilla.fuente}</Typography><Button size="small" onClick={() => abrirConstructor(null, plantilla)}>Usar plantilla</Button></Paper>)}</Box></CardContent></Card>
      <Card><CardContent><Typography variant="h6" fontWeight={800} mb={2}>Mis reportes</Typography>{reportes.length === 0 ? <Typography color="text.secondary">Todavía no guardaste reportes.</Typography> : <Table size="small"><TableHead><TableRow><TableCell>Nombre</TableCell><TableCell>Fuente</TableCell><TableCell>Modificado</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead><TableBody>{reportes.map((reporte) => <TableRow key={reporte.id}><TableCell>{reporte.nombre}</TableCell><TableCell>{fuentes.find((item) => item.fuente === reporte.definicion?.fuente)?.etiqueta || reporte.definicion?.fuente}</TableCell><TableCell>{valorVisible(reporte.modificadoEn, 'fecha')}</TableCell><TableCell align="right"><IconButton aria-label="Abrir" onClick={() => { setDefinicion(reporte.definicion); setNombre(reporte.nombre); setReporteId(reporte.id); seleccionarResultado(reporte.definicion); }}><VisibilityIcon /></IconButton><IconButton aria-label="Editar" onClick={() => abrirConstructor(reporte)}><EditIcon /></IconButton><IconButton aria-label="Duplicar" onClick={() => abrirConstructor(null, { ...reporte.definicion, nombre: `${reporte.nombre} (copia)` })}><AddIcon /></IconButton><IconButton aria-label="Eliminar" onClick={() => borrar(reporte.id)}><DeleteIcon /></IconButton></TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card>
    </Stack>
  );

  if (vista === 'constructor') return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Button startIcon={<ArrowBackIcon />} onClick={() => { definirVista('inicio'); setVista('inicio'); }}>Volver a Reportes</Button>
      <Card><CardContent><Typography variant="h5" fontWeight={800} mb={2}>Constructor</Typography><Stack spacing={2}>
        <TextField label="Nombre del reporte" value={nombre} onChange={(event) => setNombre(event.target.value)} />
        <TextField label="Descripción" value={descripcion} onChange={(event) => setDescripcion(event.target.value)} />
        <TextField select label="Fuente de datos" value={definicion.fuente} onChange={(event) => cambiarFuente(event.target.value)}>{fuentes.map((item) => <MenuItem key={item.fuente} value={item.fuente}>{item.etiqueta}</MenuItem>)}</TextField>
        <Typography variant="subtitle1" fontWeight={700}>Columnas</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>{columnasDisponibles.map((columna) => <FormControlLabel key={columna.campo} control={<Checkbox checked={definicion.columnas.includes(columna.campo)} onChange={() => cambiarColumnas(columna.campo)} />} label={columna.etiqueta} />)}</Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="subtitle1" fontWeight={700}>Filtros</Typography><Button onClick={() => setDialogoFiltro(true)}>Agregar filtro</Button></Stack>
        <Stack direction="row" flexWrap="wrap" gap={1}>{definicion.filtros.map((filtro, indice) => <Chip key={`${filtro.campo}-${indice}`} label={`${filtro.campo} ${filtro.operador} ${Array.isArray(filtro.valor) ? filtro.valor.join(', ') : filtro.valor || ''}`} onDelete={() => setDefinicion((actual) => ({ ...actual, filtros: actual.filtros.filter((_, posicion) => posicion !== indice) }))} />)}</Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={2}><TextField select fullWidth label="Ordenar por" value={definicion.orden?.campo || ''} onChange={(event) => setDefinicion((actual) => ({ ...actual, orden: { ...actual.orden, campo: event.target.value } }))}><MenuItem value="">Sin orden</MenuItem>{columnasDisponibles.map((columna) => <MenuItem key={columna.campo} value={columna.campo}>{columna.etiqueta}</MenuItem>)}</TextField><Select value={definicion.orden?.sentido || 'asc'} onChange={(event) => setDefinicion((actual) => ({ ...actual, orden: { ...actual.orden, sentido: event.target.value } }))}><MenuItem value="asc">Ascendente</MenuItem><MenuItem value="desc">Descendente</MenuItem></Select></Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} gap={2}><TextField select fullWidth label="Agrupar por (opcional)" value={definicion.agrupacion?.por || ''} onChange={(event) => setDefinicion((actual) => ({ ...actual, agrupacion: event.target.value ? { por: event.target.value, calculo: actual.agrupacion?.calculo || 'cantidad', campo: actual.agrupacion?.campo } : null }))}><MenuItem value="">Sin agrupación</MenuItem>{columnasDisponibles.filter((columna) => ['texto', 'lista'].includes(columna.tipo)).map((columna) => <MenuItem key={columna.campo} value={columna.campo}>{columna.etiqueta}</MenuItem>)}</TextField><TextField select fullWidth label="Cálculo" disabled={!definicion.agrupacion} value={definicion.agrupacion?.calculo || 'cantidad'} onChange={(event) => setDefinicion((actual) => ({ ...actual, agrupacion: { ...actual.agrupacion, calculo: event.target.value } }))}><MenuItem value="cantidad">Cantidad</MenuItem><MenuItem value="suma">Suma</MenuItem><MenuItem value="promedio">Promedio</MenuItem></TextField>{definicion.agrupacion?.calculo !== 'cantidad' && <TextField select fullWidth label="Columna numérica" value={definicion.agrupacion?.campo || ''} onChange={(event) => setDefinicion((actual) => ({ ...actual, agrupacion: { ...actual.agrupacion, campo: event.target.value } }))}>{columnasDisponibles.filter((columna) => columna.tipo === 'numero').map((columna) => <MenuItem key={columna.campo} value={columna.campo}>{columna.etiqueta}</MenuItem>)}</TextField>}</Stack>
        <FormControlLabel control={<Checkbox checked={compartidoCon.includes(2)} onChange={(event) => setCompartidoCon(event.target.checked ? [2] : [])} />} label="Compartir con coordinadores" />
        <Stack direction="row" gap={1} flexWrap="wrap"><Button variant="outlined" onClick={() => seleccionarResultado()}>Ver resultado</Button><Button variant="contained" onClick={guardar}>Guardar</Button><Button onClick={exportar} startIcon={<DownloadIcon />}>Exportar CSV</Button></Stack>
      </Stack></CardContent></Card>
      <Dialog open={dialogoFiltro} onClose={() => setDialogoFiltro(false)} fullWidth maxWidth="sm"><DialogTitle>Agregar filtro</DialogTitle><DialogContent><Stack spacing={2} mt={1}><TextField select label="Campo" value={filtroNuevo.campo} onChange={(event) => { const columna = columnasDisponibles.find((item) => item.campo === event.target.value); setFiltroNuevo({ campo: event.target.value, operador: columna?.operadores[0] || '', valor: '' }); }}>{columnasDisponibles.map((columna) => <MenuItem key={columna.campo} value={columna.campo}>{columna.etiqueta}</MenuItem>)}</TextField><TextField select label="Operador" value={filtroNuevo.operador} onChange={(event) => setFiltroNuevo((actual) => ({ ...actual, operador: event.target.value }))}>{(columnasDisponibles.find((item) => item.campo === filtroNuevo.campo)?.operadores || []).map((operador) => <MenuItem key={operador} value={operador}>{operador}</MenuItem>)}</TextField><TextField label="Valor (para listas, separar con comas)" value={filtroNuevo.valor} onChange={(event) => setFiltroNuevo((actual) => ({ ...actual, valor: event.target.value }))} /></Stack></DialogContent><DialogActions><Button onClick={() => setDialogoFiltro(false)}>Cancelar</Button><Button onClick={agregarFiltro} variant="contained">Agregar</Button></DialogActions></Dialog>
    </Stack>
  );

  const columnas = resultado.columnas.filter((columna) => columnasVisibles.includes(columna.campo));
  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}><Button startIcon={<ArrowBackIcon />} onClick={() => { definirVista('inicio'); setVista('inicio'); }}>Reportes</Button><Stack direction="row" gap={1}><Button startIcon={<EditIcon />} onClick={() => { definirVista('constructor', reporteId || ''); setVista('constructor'); }}>Editar reporte</Button><Button variant="contained" startIcon={<DownloadIcon />} onClick={exportar}>Exportar CSV</Button></Stack></Stack>
      <Typography variant="h5" fontWeight={800}>{nombre || 'Resultado'}</Typography>
      <TextField size="small" label="Búsqueda rápida" value={buscar} onChange={(event) => { setBuscar(event.target.value); cargarResultado(1); }} />
      <Stack direction="row" gap={1} flexWrap="wrap">{definicion.filtros.map((filtro, indice) => <Chip key={`${filtro.campo}-${indice}`} label={`${filtro.campo}: ${filtro.valor || filtro.operador}`} />)}</Stack>
      <Card><CardContent sx={{ overflowX: 'auto' }}>{cargando ? <Typography>Cargando...</Typography> : <Table size="small"><TableHead><TableRow>{columnas.map((columna) => <TableCell key={columna.campo}>{columna.etiqueta}</TableCell>)}</TableRow></TableHead><TableBody>{resultado.datos.map((fila, indice) => <TableRow hover sx={{ cursor: 'pointer' }} key={fila.id || indice} onClick={() => setDetalle(fila)}>{columnas.map((columna) => <TableCell key={columna.campo}>{valorVisible(fila[columna.campo], columna.tipo)}</TableCell>)}</TableRow>)}{!resultado.datos.length && <TableRow><TableCell colSpan={columnas.length || 1}>No hay resultados.</TableCell></TableRow>}</TableBody></Table>}</CardContent></Card>
      <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography color="text.secondary">{resultado.total} resultados</Typography><Stack direction="row" gap={1}><Button disabled={pagina <= 1} onClick={() => cargarResultado(pagina - 1)}>Anterior</Button><Typography sx={{ alignSelf: 'center' }}>{pagina} / {resultado.paginacion?.paginas || 1}</Typography><Button disabled={pagina >= (resultado.paginacion?.paginas || 1)} onClick={() => cargarResultado(pagina + 1)}>Siguiente</Button></Stack></Stack>
      <Drawer anchor="right" open={Boolean(detalle)} onClose={() => setDetalle(null)}><Box sx={{ width: { xs: '85vw', sm: 420 }, p: 3 }}><Typography variant="h6" fontWeight={800} mb={2}>Detalle del registro</Typography>{detalle && Object.entries(detalle).filter(([clave]) => !['_id', '__v'].includes(clave)).map(([clave, valor]) => <Box key={clave} sx={{ mb: 1 }}><Typography variant="caption" color="text.secondary">{clave}</Typography><Typography>{valorVisible(valor, typeof valor === 'boolean' ? 'booleano' : '')}</Typography></Box>)}{definicion.fuente === 'reclamos' && detalle?.id && <Button variant="outlined" onClick={async () => { try { const actualizado = await reclamosApi.actualizarEstado(detalle.id, { notasCoordinador: 'Actualizado desde Reportes' }); setDetalle(actualizado); await cargarResultado(pagina); } catch (exception) { mostrarError(exception); } }}>Agregar nota</Button>}</Box></Drawer>
    </Stack>
  );
}

export default Reportes;
