import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, IconButton, InputAdornment, LinearProgress, List, ListItemButton, ListItemText, Popover,
  Paper, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel,
  TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SearchIcon from '@mui/icons-material/Search';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import { reportesApi } from '../../services/api.js';
import { usePagina, usePaginado, useValorDiferido } from '../../context/usePaginado.js';
import PaginacionLista from '../comunes/PaginacionLista.jsx';
import PanelPersonalizar from './PanelPersonalizar.jsx';
import DetalleRegistro from './DetalleRegistro.jsx';
import GuardarReporte from './GuardarReporte.jsx';
import ValorCelda from './ValorCelda.jsx';
import {
  PERIODOS, definicionNueva, definicionParaEnviar, describirReporte, esAgrupable, esFecha, formatearNumero, rangoDelMes,
} from './formatoReportes.js';
import SelectorBuscable from '../comunes/SelectorBuscable.jsx';

// Nombre del archivo: el del reporte, sin caracteres raros, y la fecha de hoy.
function nombreDeArchivo(nombre) {
  const base = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9 _-]/g, '').trim()
    .replace(/\s+/g, '-') || 'reporte';
  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  return `${base}-${fecha}.csv`;
}

// Los errores de una descarga llegan como Blob: se lee el mensaje del backend.
async function mensajeDeError(causa, porDefecto) {
  try {
    const datos = causa?.response?.data;
    if (datos instanceof Blob) return JSON.parse(await datos.text()).mensaje || porDefecto;
    return datos?.mensaje || porDefecto;
  } catch {
    return porDefecto;
  }
}

// Alto de cada columna en el menú "Columnas" (se ven 6; el resto con scroll).
const ALTO_COLUMNA = 40;
const sinAcentos = (texto) => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Un filtro rápido: lista desplegable de varios valores para una columna (por ejemplo, Estado).
function FiltroRapido({
  columna, opciones, filtros, alCambiar,
}) {
  const propio = filtros.find((filtro) => filtro.campo === columna.campo && filtro.operador === 'esUnoDe');
  const personalizado = !propio && filtros.some((filtro) => filtro.campo === columna.campo);
  const valores = propio?.valor || [];
  return (
    <SelectorBuscable
      multiple
      size="small"
      label={personalizado ? `${columna.etiqueta} (personalizado)` : columna.etiqueta}
      placeholder="Todos"
      textoSinOpciones="No hay valores"
      sx={{ minWidth: 200, width: 'auto' }}
      opciones={(opciones || []).map((id) => ({ id }))}
      valor={valores}
      alCambiar={(elegidos) => {
        const resto = filtros.filter((filtro) => filtro.campo !== columna.campo);
        alCambiar(elegidos.length ? [...resto, { campo: columna.campo, operador: 'esUnoDe', valor: elegidos }] : resto);
      }}
      etiqueta={(opcion) => opcion.id}
    />
  );
}

// Filtro rápido de período sobre la fecha principal de la fuente.
function FiltroPeriodo({ columna, filtros, alCambiar }) {
  const actual = filtros.filter((filtro) => filtro.campo === columna.campo);
  const periodo = !actual.length ? 'todo' : (actual.length === 1 && PERIODOS.find((item) => item.filtro
    && item.filtro.operador === actual[0].operador
    && (item.filtro.valor === undefined || Number(item.filtro.valor) === Number(actual[0].valor)))?.valor) || 'personalizado';
  return (
    <SelectorBuscable
      size="small"
      sinBorrar
      label={`Período (${columna.etiqueta.toLowerCase()})`}
      sx={{ minWidth: 220, width: 'auto' }}
      opciones={[
        ...PERIODOS.map((item) => ({ id: item.valor, nombre: item.etiqueta })),
        ...(periodo === 'personalizado' ? [{ id: 'personalizado', nombre: 'Personalizado' }] : []),
      ]}
      opcionDeshabilitada={(opcion) => opcion.id === 'personalizado'}
      valor={periodo}
      alCambiar={(valor) => {
        const elegido = PERIODOS.find((item) => item.valor === valor);
        const resto = filtros.filter((filtro) => filtro.campo !== columna.campo);
        alCambiar(elegido?.filtro ? [...resto, { campo: columna.campo, ...elegido.filtro }] : resto);
      }}
      etiqueta={(opcion) => opcion.nombre}
    />
  );
}

function Indicadores({ indicadores }) {
  if (!indicadores?.length) return null;
  return (
    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${indicadores.length}, 1fr)` } }}>
      {indicadores.map((indicador) => (
        <Paper key={indicador.etiqueta} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{formatearNumero(indicador.valor)}</Typography>
          <Typography variant="body2" color="text.secondary">{indicador.etiqueta}</Typography>
        </Paper>
      ))}
    </Box>
  );
}

// Resumen: una fila por grupo, con una barra proporcional. Al tocar un grupo se ven sus registros.
function Resumen({ respuesta, alElegirGrupo }) {
  const { grupos = [], encabezados } = respuesta;
  const maximo = Math.max(0, ...grupos.map((grupo) => grupo.valor || 0));
  const conPorcentaje = grupos.some((grupo) => grupo.porcentaje != null);
  if (!grupos.length) {
    return <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">No hay datos para resumir con estos filtros.</Typography></Paper>;
  }
  return (
    <Paper variant="outlined">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 90px', sm: 'minmax(140px, 1fr) 2fr 100px 70px 24px' }, gap: 2, px: 2, py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{encabezados?.grupo}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }} />
        <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'right' }}>{encabezados?.valor}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>{conPorcentaje ? '%' : ''}</Typography>
      </Box>
      {grupos.map((grupo) => (
        <Box
          key={grupo.clave || 'sin-dato'}
          role="button"
          tabIndex={0}
          onClick={() => alElegirGrupo(grupo)}
          onKeyDown={(evento) => { if (evento.key === 'Enter') alElegirGrupo(grupo); }}
          sx={{
            display: 'grid', gridTemplateColumns: { xs: '1fr 90px', sm: 'minmax(140px, 1fr) 2fr 100px 70px 24px' }, gap: 2, px: 2, py: 1.25,
            alignItems: 'center', cursor: 'pointer', borderBottom: 1, borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Typography color={grupo.clave ? 'text.primary' : 'text.secondary'}>{grupo.etiqueta}</Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' }, height: 12, borderRadius: 6, bgcolor: 'action.hover' }}>
            <Box sx={{ height: '100%', borderRadius: 6, bgcolor: 'primary.main', width: `${maximo ? Math.max(2, ((grupo.valor || 0) * 100) / maximo) : 0}%` }} />
          </Box>
          <Typography sx={{ fontWeight: 700, textAlign: 'right' }}>{formatearNumero(grupo.valor)}</Typography>
          <Typography color="text.secondary" sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            {grupo.porcentaje != null ? `${formatearNumero(grupo.porcentaje)} %` : ''}
          </Typography>
          <ChevronRightIcon color="action" sx={{ display: { xs: 'none', sm: 'block' } }} />
        </Box>
      ))}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, py: 1 }}>
        Tocá un grupo para ver sus registros.
      </Typography>
    </Paper>
  );
}

// Pantalla principal de un reporte: la frase que explica qué se ve, filtros rápidos, indicadores
// y la tabla (o el resumen). Personalizar, guardar y exportar, sin salir del módulo.
export default function ResultadoReporte({
  fuentes, inicial, rolId, alVolver, alGuardado,
}) {
  const [definicion, establecerDefinicion] = useState(inicial.definicion);
  const [datosGuardado, establecerDatosGuardado] = useState({
    nombre: inicial.nombre, descripcion: inicial.descripcion || '', origen: inicial.origen,
  });
  const [buscar, establecerBuscar] = useState('');
  const [porPagina, establecerPorPagina] = useState(20);
  const [panelAbierto, establecerPanelAbierto] = useState(Boolean(inicial.personalizar));
  const [filaElegida, establecerFilaElegida] = useState(null);
  const [guardarAbierto, establecerGuardarAbierto] = useState(false);
  const [menuColumnas, establecerMenuColumnas] = useState(null);
  const [buscarColumna, establecerBuscarColumna] = useState('');
  const [exportando, establecerExportando] = useState(false);
  const [aviso, establecerAviso] = useState(null);

  const fuente = fuentes.find((item) => item.clave === definicion.fuente) || fuentes[0];
  // Columnas del menú "Columnas" que coinciden con lo que se escribe en su buscador.
  const columnasDelMenu = fuente.columnas.filter((columna) => sinAcentos(columna.etiqueta).includes(sinAcentos(buscarColumna.trim())));
  const columnasPorCampo = useMemo(() => new Map(fuente.columnas.map((columna) => [columna.campo, columna])), [fuente]);
  const enviada = useMemo(() => definicionParaEnviar(definicion, fuente), [definicion, fuente]);
  // Se espera a que el usuario deje de escribir antes de pedir el resultado.
  const enviadaDiferida = useValorDiferido(enviada, 300);
  const buscarDiferido = useValorDiferido(buscar, 400);
  const [pagina, establecerPagina] = usePagina(JSON.stringify(enviadaDiferida), buscarDiferido, porPagina);
  const {
    respuesta, cargando, error, recargar,
  } = usePaginado(reportesApi.vistaPrevia, {
    definicion: enviadaDiferida, pagina, limite: porPagina, buscar: buscarDiferido,
  });

  const cambiar = (cambios) => establecerDefinicion((actual) => ({ ...actual, ...cambios }));
  const columnasVisibles = definicion.columnas.map((campo) => columnasPorCampo.get(campo)).filter(Boolean);
  const esResumen = respuesta?.vista === 'resumen';
  const total = respuesta?.total ?? null;
  const filasParaExportar = esResumen ? respuesta?.grupos?.length : total;
  const { origen } = datosGuardado;

  const ordenarPor = (columna) => {
    const actual = definicion.orden;
    if (actual?.campo === columna.campo) cambiar({ orden: { campo: columna.campo, sentido: actual.sentido === 'asc' ? 'desc' : 'asc' } });
    else cambiar({ orden: { campo: columna.campo, sentido: esFecha(columna.tipo) || columna.tipo === 'numero' ? 'desc' : 'asc' } });
  };

  const alternarColumna = (campo) => {
    const elegidas = new Set(definicion.columnas);
    if (elegidas.has(campo)) elegidas.delete(campo); else elegidas.add(campo);
    if (!elegidas.size) return;
    cambiar({ columnas: fuente.columnas.filter((columna) => elegidas.has(columna.campo)).map((columna) => columna.campo) });
  };

  const verComo = (vista) => {
    if (!vista) return;
    if (vista === 'lista') return cambiar({ agrupacion: null });
    const agrupables = fuente.columnas.filter((columna) => esAgrupable(columna.tipo));
    const por = fuente.filtrosRapidos.map((campo) => columnasPorCampo.get(campo)).find(Boolean)
      || agrupables.find((columna) => columna.tipo === 'lista') || agrupables[0];
    return cambiar({ agrupacion: { por: por.campo, calculo: 'cantidad' } });
  };

  // Desde el resumen: muestra la lista con los registros del grupo elegido.
  const verGrupo = (grupo) => {
    const por = columnasPorCampo.get(definicion.agrupacion.por);
    let filtro;
    if (!grupo.clave) filtro = { campo: por.campo, operador: 'estaVacio' };
    else if (por.tipo === 'booleano') filtro = { campo: por.campo, operador: grupo.clave === 'si' ? 'esSi' : 'esNo' };
    else if (esFecha(por.tipo)) filtro = { campo: por.campo, operador: 'entre', valor: rangoDelMes(grupo.clave) };
    else if (por.tipo === 'lista') filtro = { campo: por.campo, operador: 'esUnoDe', valor: [grupo.clave] };
    else filtro = { campo: por.campo, operador: 'esIgualA', valor: grupo.clave };
    cambiar({ agrupacion: null, filtros: [...definicion.filtros.filter((actual) => actual.campo !== por.campo), filtro] });
  };

  const exportar = async () => {
    establecerExportando(true);
    try {
      const respuestaCsv = await reportesApi.exportar({ nombre: datosGuardado.nombre, definicion: enviada, buscar });
      const url = URL.createObjectURL(respuestaCsv.data);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombreDeArchivo(datosGuardado.nombre);
      enlace.click();
      URL.revokeObjectURL(url);
      establecerAviso({ tipo: 'success', texto: `Se descargó el CSV con ${formatearNumero(filasParaExportar)} filas.` });
    } catch (causa) {
      establecerAviso({ tipo: 'error', texto: await mensajeDeError(causa, 'No se pudo exportar el reporte.') });
    } finally {
      establecerExportando(false);
    }
  };

  const guardar = async ({ nombre, descripcion, compartidoCon }, comoNuevo) => {
    const datos = {
      nombre, descripcion, compartidoCon, definicion: enviada,
    };
    const sobrescribir = origen.tipo === 'guardado' && origen.puedeEditar && !comoNuevo;
    const guardado = sobrescribir ? await reportesApi.actualizar(origen.id, datos) : await reportesApi.crear(datos);
    establecerDatosGuardado({
      nombre: guardado.nombre,
      descripcion: guardado.descripcion,
      origen: {
        tipo: 'guardado', id: guardado.id, puedeEditar: guardado.puedeEditar, compartidoCon: guardado.compartidoCon, autor: guardado.autor,
      },
    });
    establecerAviso({ tipo: 'success', texto: 'Reporte guardado en "Mis reportes".' });
    alGuardado(guardado);
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between', alignItems: { md: 'flex-start' } }}>
        <Box>
          <Button startIcon={<ArrowBackIcon />} onClick={alVolver} sx={{ mb: 0.5, ml: -1 }}>Reportes</Button>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{datosGuardado.nombre}</Typography>
            {origen.autor && <Chip size="small" label={`Compartido por ${origen.autor}`} />}
          </Stack>
          {datosGuardado.descripcion && <Typography color="text.secondary">{datosGuardado.descripcion}</Typography>}
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button variant="outlined" startIcon={<TuneOutlinedIcon />} onClick={() => establecerPanelAbierto(true)}>Personalizar</Button>
          <Button variant="outlined" startIcon={<SaveOutlinedIcon />} onClick={() => establecerGuardarAbierto(true)}>Guardar</Button>
          <Button variant="contained" startIcon={<FileDownloadOutlinedIcon />} onClick={exportar} disabled={exportando || !filasParaExportar}>
            {exportando ? 'Exportando...' : `Exportar CSV${filasParaExportar ? ` (${formatearNumero(filasParaExportar)} ${filasParaExportar === 1 ? 'fila' : 'filas'})` : ''}`}
          </Button>
        </Stack>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
        <Typography sx={{ fontWeight: 600 }}>{describirReporte(definicion, fuente, total)}</Typography>
      </Paper>

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        {fuente.columnaPeriodo && columnasPorCampo.get(fuente.columnaPeriodo) && (
          <FiltroPeriodo columna={columnasPorCampo.get(fuente.columnaPeriodo)} filtros={definicion.filtros} alCambiar={(filtros) => cambiar({ filtros })} />
        )}
        {fuente.filtrosRapidos.map((campo) => columnasPorCampo.get(campo)).filter(Boolean).map((columna) => (
          <FiltroRapido
            key={columna.campo}
            columna={columna}
            opciones={columna.opciones || respuesta?.opciones?.[columna.campo]}
            filtros={definicion.filtros}
            alCambiar={(filtros) => cambiar({ filtros })}
          />
        ))}
        <TextField
          size="small"
          placeholder="Buscar en el resultado"
          value={buscar}
          onChange={(evento) => establecerBuscar(evento.target.value)}
          sx={{ minWidth: 220, flex: { md: 1 } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
        <ToggleButtonGroup size="small" exclusive value={definicion.agrupacion ? 'resumen' : 'lista'} onChange={(_, vista) => verComo(vista)} aria-label="Ver como">
          <ToggleButton value="lista"><TableRowsOutlinedIcon fontSize="small" sx={{ mr: 0.75 }} />Lista</ToggleButton>
          <ToggleButton value="resumen"><BarChartOutlinedIcon fontSize="small" sx={{ mr: 0.75 }} />Resumen</ToggleButton>
        </ToggleButtonGroup>
        {definicion.agrupacion && (
          <SelectorBuscable
            label="Resumen por"
            size="small"
            sinBorrar
            sx={{ minWidth: 200, width: 'auto' }}
            opciones={fuente.columnas.filter((columna) => esAgrupable(columna.tipo))
              .map((columna) => ({ id: columna.campo, nombre: `${columna.etiqueta}${esFecha(columna.tipo) ? ' (por mes)' : ''}` }))}
            valor={definicion.agrupacion.por}
            alCambiar={(por) => cambiar({ agrupacion: { ...definicion.agrupacion, por } })}
            etiqueta={(opcion) => opcion.nombre}
          />
        )}
      </Stack>

      <Indicadores indicadores={respuesta?.indicadores} />

      <Box sx={{ height: 4 }}>{cargando && <LinearProgress aria-label="Actualizando el reporte" />}</Box>
      {error && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={recargar}>Reintentar</Button>}>
          No se pudo armar el reporte. Verificá la conexión e intentá nuevamente.
        </Alert>
      )}

      {respuesta && esResumen && <Resumen respuesta={respuesta} alElegirGrupo={verGrupo} />}

      {respuesta && !esResumen && (
        <Paper variant="outlined">
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1 }}>
            <Typography variant="body2" color="text.secondary">Tocá una fila para ver el detalle. Tocá un encabezado para ordenar.</Typography>
            <Tooltip title="Elegir columnas">
              <Button size="small" startIcon={<ViewColumnOutlinedIcon />} onClick={(evento) => establecerMenuColumnas(evento.currentTarget)}>Columnas</Button>
            </Tooltip>
          </Stack>
          <Popover
            anchorEl={menuColumnas}
            open={Boolean(menuColumnas)}
            onClose={() => { establecerMenuColumnas(null); establecerBuscarColumna(''); }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ p: 1.5, width: 280 }}>
              <TextField
                size="small"
                fullWidth
                autoFocus
                placeholder="Buscar columna..."
                value={buscarColumna}
                onChange={(evento) => establecerBuscarColumna(evento.target.value)}
                slotProps={{ htmlInput: { 'aria-label': 'Buscar columna' } }}
              />
              {/* Regla de los desplegables: 6 opciones a la vista y el resto con scroll. */}
              <List dense disablePadding sx={{ maxHeight: 6 * ALTO_COLUMNA, overflowY: 'auto', mt: 1 }}>
                {columnasDelMenu.map((columna) => (
                  <ListItemButton key={columna.campo} style={{ height: ALTO_COLUMNA }} sx={{ py: 0 }} onClick={() => alternarColumna(columna.campo)}>
                    <Checkbox size="small" edge="start" checked={definicion.columnas.includes(columna.campo)} />
                    <ListItemText primary={columna.etiqueta} />
                  </ListItemButton>
                ))}
                {!columnasDelMenu.length && (
                  <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1 }}>No hay columnas que coincidan</Typography>
                )}
              </List>
            </Box>
          </Popover>
          <TableContainer sx={{ maxHeight: 560 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {columnasVisibles.map((columna) => (
                    <TableCell key={columna.campo} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align={columna.tipo === 'numero' ? 'right' : 'left'}>
                      <TableSortLabel
                        active={definicion.orden?.campo === columna.campo}
                        direction={definicion.orden?.campo === columna.campo ? definicion.orden.sentido : 'asc'}
                        onClick={() => ordenarPor(columna)}
                      >
                        {columna.etiqueta}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell padding="checkbox" />
                </TableRow>
              </TableHead>
              <TableBody>
                {(respuesta.datos || []).map((fila, indice) => (
                  <TableRow hover key={fila.id ?? indice} onClick={() => establecerFilaElegida(fila)} sx={{ cursor: 'pointer' }}>
                    {columnasVisibles.map((columna) => (
                      <TableCell key={columna.campo} align={columna.tipo === 'numero' ? 'right' : 'left'} sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <ValorCelda valor={fila[columna.campo]} columna={columna} />
                      </TableCell>
                    ))}
                    <TableCell padding="checkbox"><IconButton size="small" aria-label="Ver detalle"><ChevronRightIcon fontSize="small" /></IconButton></TableCell>
                  </TableRow>
                ))}
                {!(respuesta.datos || []).length && (
                  <TableRow>
                    <TableCell colSpan={columnasVisibles.length + 1} sx={{ py: 5, textAlign: 'center' }}>
                      <Typography color="text.secondary">No hay resultados con estos filtros.</Typography>
                      <Button size="small" sx={{ mt: 1 }} onClick={() => establecerPanelAbierto(true)}>Revisar los filtros</Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {total > 0 && (
            <Box sx={{ pb: 2 }}>
              <PaginacionLista
                pagina={pagina}
                total={total}
                resultadosPorPagina={porPagina}
                establecerPagina={establecerPagina}
                establecerResultadosPorPagina={establecerPorPagina}
              />
            </Box>
          )}
        </Paper>
      )}

      <PanelPersonalizar
        abierto={panelAbierto}
        cerrar={() => establecerPanelAbierto(false)}
        fuentes={fuentes}
        fuente={fuente}
        definicion={definicion}
        opciones={respuesta?.opciones}
        alCambiar={establecerDefinicion}
        alCambiarFuente={(clave) => establecerDefinicion(definicionNueva(fuentes.find((item) => item.clave === clave)))}
      />
      {filaElegida && (
        <DetalleRegistro
          key={filaElegida.id ?? JSON.stringify(filaElegida)}
          fila={filaElegida}
          fuente={fuente}
          columnas={respuesta?.columnas || fuente.columnas}
          cerrar={() => establecerFilaElegida(null)}
          alActualizar={recargar}
        />
      )}
      {guardarAbierto && (
        <GuardarReporte
          abierto
          cerrar={() => establecerGuardarAbierto(false)}
          nombreInicial={origen.tipo === 'nuevo' ? '' : datosGuardado.nombre}
          descripcionInicial={datosGuardado.descripcion}
          compartidoInicial={(origen.compartidoCon || []).includes(2)}
          puedeSobrescribir={origen.tipo === 'guardado' && origen.puedeEditar}
          rolId={rolId}
          alGuardar={guardar}
        />
      )}
      <Snackbar open={Boolean(aviso)} autoHideDuration={4000} onClose={() => establecerAviso(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {aviso ? <Alert severity={aviso.tipo} onClose={() => establecerAviso(null)} variant="filled">{aviso.texto}</Alert> : undefined}
      </Snackbar>
    </Stack>
  );
}
