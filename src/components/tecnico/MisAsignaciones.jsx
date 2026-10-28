import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAppData } from '../../context/useAppData.js';
import { usePaginado } from '../../context/usePaginado.js';
import { reclamosApi } from '../../services/api.js';
import AvisoCarga from '../comunes/AvisoCarga.jsx';
import EntradaVoz from './EntradaVoz.jsx';
import ControlVehiculoDialog from './ControlVehiculoDialog.jsx';
import GaleriaImagenes from '../comunes/GaleriaImagenes.jsx';
import SelectorImagenes from '../comunes/SelectorImagenes.jsx';
import PaginacionLista from '../comunes/PaginacionLista.jsx';
import { subirImagenes } from '../../utils/subirImagenes.js';

const MAXIMO_IMAGENES = 5;

function formatearFecha(fecha) {
  if (!fecha) return 'Sin fecha';
  const valor = new Date(String(fecha).length === 10 ? `${fecha}T12:00:00` : fecha);
  return Number.isNaN(valor.getTime()) ? 'Sin fecha' : new Intl.DateTimeFormat('es-AR').format(valor);
}

function MisAsignaciones({ soloEnCurso = false }) {
  const [filtro, setFiltro] = useState(soloEnCurso ? 'En progreso' : 'Todos');
  const [pagina, establecerPagina] = useState(1);
  const [resultadosPorPagina, establecerResultadosPorPagina] = useState(10);
  const esMovil = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const { actualizarEstado, registrarControlVehiculo } = useAppData();
  // El vehículo llega en el login.
  const { sesion } = useAppData();
  const { vehiculo } = sesion;
  // Paginación en el servidor: GET /reclamos devuelve solo los del técnico, de la página visible
  // y del estado elegido ("Servicio en curso" pide solo los que están en progreso).
  // También trae cuántos reclamos tiene en cada estado, para los totales y para saber si ya
  // tiene uno en curso aunque no esté en esta página.
  const filtroActivo = soloEnCurso ? 'En progreso' : filtro;
  const {
    datos: reclamosVisibles, paginacion, respuesta, cargando, error: errorCarga,
  } = usePaginado(reclamosApi.pagina, { pagina, limite: resultadosPorPagina, estado: filtroActivo });
  const totalesPorEstado = respuesta?.totalesPorEstado || {};
  const totalAsignaciones = Object.values(totalesPorEstado).reduce((suma, cantidad) => suma + cantidad, 0);
  const totalFiltradas = paginacion?.total ?? 0;
  const tieneReclamoEnProgreso = (totalesPorEstado['En progreso'] || 0) > 0;
  const asignacionesVisibles = reclamosVisibles.map((reclamo) => ({
    reclamo,
    cliente: reclamo.cliente ?? { nombre: 'Cliente no disponible', telefono: '', direccion: '' },
  }));
  const cambiarFiltro = (nuevoFiltro) => {
    setFiltro(nuevoFiltro);
    establecerPagina(1);
  };

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {soloEnCurso ? 'Servicio en curso' : 'Tus reclamos'}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {soloEnCurso
                ? (totalFiltradas ? 'El reclamo que estás realizando.' : 'No tenés un reclamo en curso.')
                : `${totalAsignaciones} reclamos asociados a tu usuario: primero el que está en curso, después los asignados y al final los finalizados.`}
            </Typography>
          </Box>
          {!soloEnCurso && esMovil ? (
            <FormControl fullWidth>
              <InputLabel id="filtro-estado-label">Filtrar servicios</InputLabel>
              <Select
                labelId="filtro-estado-label"
                value={filtro}
                label="Filtrar servicios"
                onChange={(event) => cambiarFiltro(event.target.value)}
              >
                <MenuItem value="Todos">Todos los servicios ({totalAsignaciones})</MenuItem>
                <MenuItem value="En progreso">Servicio en curso ({totalesPorEstado['En progreso'] || 0})</MenuItem>
                <MenuItem value="Asignado">Asignados ({totalesPorEstado.Asignado || 0})</MenuItem>
                <MenuItem value="Finalizado">Finalizados ({totalesPorEstado.Finalizado || 0})</MenuItem>
              </Select>
            </FormControl>
          ) : !soloEnCurso && (
            <Tabs
              value={filtro}
              onChange={(_, nuevoFiltro) => cambiarFiltro(nuevoFiltro)}
              variant="fullWidth"
              aria-label="Filtrar asignaciones por estado"
            >
              <Tab label={`Todos (${totalAsignaciones})`} value="Todos" />
              <Tab label={`En curso (${totalesPorEstado['En progreso'] || 0})`} value="En progreso" />
              <Tab label={`Asignados (${totalesPorEstado.Asignado || 0})`} value="Asignado" />
              <Tab label={`Finalizados (${totalesPorEstado.Finalizado || 0})`} value="Finalizado" />
            </Tabs>
          )}
          {!soloEnCurso && (
            <Typography variant="body2" color="text.secondary">
              {totalFiltradas} de {totalAsignaciones} asignaciones visibles
            </Typography>
          )}
        </Stack>
      </Paper>

      <AvisoCarga cargando={cargando} error={errorCarga} />
      {asignacionesVisibles.length === 0 ? (
        !cargando && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No hay asignaciones con este estado.</Typography>
          </Paper>
        )
      ) : asignacionesVisibles.map(({ reclamo, cliente }) => (
        <Asignacion
          key={reclamo.id}
          reclamo={reclamo}
          cliente={cliente}
          puedeComenzar={!tieneReclamoEnProgreso}
          noDesplegable={soloEnCurso}
          actualizarEstado={actualizarEstado}
          registrarControlVehiculo={registrarControlVehiculo}
          vehiculo={vehiculo}
        />
      ))}
      {totalFiltradas > 0 && (
        <PaginacionLista
          pagina={pagina}
          total={totalFiltradas}
          resultadosPorPagina={resultadosPorPagina}
          establecerPagina={establecerPagina}
          establecerResultadosPorPagina={establecerResultadosPorPagina}
        />
      )}
    </Stack>
  );
}

// Color de cada estado: los mismos que ven el admin y el coordinador (coordinador/Reclamos.jsx).
const COLOR_ESTADO = {
  Abierto: 'warning',
  Asignado: 'info',
  'En progreso': 'secondary',
  Bloqueado: 'error',
  Finalizado: 'success',
};

// Dato con ícono, etiqueta y valor (y una acción opcional debajo).
function Dato({ icono, etiqueta, children, accion }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
      <Box sx={{ color: 'text.secondary', pt: 0.25, display: 'flex' }}>{icono}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {etiqueta}
        </Typography>
        <Box sx={{ overflowWrap: 'anywhere' }}>{children}</Box>
        {accion}
      </Box>
    </Stack>
  );
}

// Tarjeta de un reclamo del técnico, con el mismo formato que la lista del admin y el coordinador:
// arriba el resumen (número, prioridad, tipo, cliente, fecha, dirección y estado);
// al desplegarla, el detalle y las acciones (comenzar, finalizar o reportar un inconveniente).
function Asignacion({ reclamo, cliente, puedeComenzar, noDesplegable = false, actualizarEstado, registrarControlVehiculo, vehiculo }) {
  const [comentario, setComentario] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [finalizando, establecerFinalizando] = useState(false);
  const [errorFinalizar, establecerErrorFinalizar] = useState('');
  const [dialogoAbierto, establecerDialogoAbierto] = useState(false);
  const [inconvenienteAbierto, establecerInconvenienteAbierto] = useState(false);
  const [motivoInconveniente, establecerMotivoInconveniente] = useState('');
  const [controlInicioAbierto, establecerControlInicioAbierto] = useState(false);
  const estaEnProgreso = reclamo.estado === 'En progreso';
  // El reclamo en progreso aparece desplegado: es el que el técnico está trabajando.
  const [desplegado, establecerDesplegado] = useState(estaEnProgreso);
  const abierto = noDesplegable || desplegado;
  const color = COLOR_ESTADO[reclamo.estado] || 'primary';
  const formularioId = `formulario-reclamo-${reclamo.id}`;
  const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.direccion || '')}`;

  const reportarInconveniente = async (event) => {
    event.preventDefault();
    const motivo = motivoInconveniente.trim();
    if (!motivo) return;

    await actualizarEstado(reclamo.id, {
      tecnicoId: null,
      estado: 'Bloqueado',
      motivoBloqueo: motivo,
    });
    establecerInconvenienteAbierto(false);
    establecerMotivoInconveniente('');
  };
  // Primero se suben las imágenes (comprimidas) y después se finaliza el reclamo con sus ids.
  const finalizarAsignacion = async (event) => {
    event.preventDefault();
    if (!comentario.trim()) {
      establecerErrorFinalizar('Escribí un comentario sobre el trabajo realizado.');
      return;
    }
    if (!imagenes.length) {
      establecerErrorFinalizar('Agregá al menos una imagen del trabajo terminado.');
      return;
    }

    establecerErrorFinalizar('');
    establecerFinalizando(true);
    try {
      const idsImagenes = await subirImagenes(imagenes);
      await actualizarEstado(reclamo.id, {
        estado: 'Finalizado',
        comentarioFinalizacion: comentario.trim(),
        imagenes: idsImagenes,
      });
      establecerDialogoAbierto(false);
      setImagenes([]);
      setComentario('');
    } catch (causa) {
      establecerErrorFinalizar(
        causa?.response?.data?.mensaje
          || causa?.message
          || 'No se pudo finalizar el reclamo. Verificá la conexión e intentá nuevamente.',
      );
    } finally {
      establecerFinalizando(false);
    }
  };
  const iniciarAsignacion = async (control) => {
    if (!vehiculo) return;
    registrarControlVehiculo(vehiculo.id, control);
    await actualizarEstado(reclamo.id, {
      estado: 'En progreso',
      vehiculoId: vehiculo.id,
      inicioServicio: control,
    });
  };

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 1.5,
          overflow: 'hidden',
          borderColor: 'divider',
          borderLeft: 4,
          borderLeftColor: `${color}.main`,
          transition: 'transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease',
          ...(abierto
            ? { boxShadow: 3 }
            : !noDesplegable && { '&:hover': { borderColor: 'primary.main', borderLeftColor: `${color}.main`, boxShadow: 3, transform: 'translateY(-2px)' } }),
        }}
      >
        {/* Resumen (mismo formato que la lista del admin y el coordinador): siempre visible.
            Al tocarlo se despliega el detalle. */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          role={noDesplegable ? undefined : 'button'}
          tabIndex={noDesplegable ? undefined : 0}
          aria-expanded={noDesplegable ? undefined : abierto}
          onClick={noDesplegable ? undefined : () => establecerDesplegado((actual) => !actual)}
          onKeyDown={noDesplegable ? undefined : (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              establecerDesplegado((actual) => !actual);
            }
          }}
          sx={{
            alignItems: 'stretch',
            cursor: noDesplegable ? 'default' : 'pointer',
            '&:focus-visible': { outline: 2, outlineColor: 'primary.main', outlineOffset: -2 },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 2 } }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: '0.08em' }}>
                Reclamo #{reclamo.id}
              </Typography>
              <Chip
                size="small"
                label={`Prioridad ${reclamo.prioridad || 'Normal'}`}
                color={reclamo.prioridad === 'Urgente' ? 'error' : reclamo.prioridad === 'Alta' ? 'warning' : 'default'}
              />
            </Stack>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, overflowWrap: 'anywhere' }}>{reclamo.tipo}</Typography>
            <Stack
              direction="row"
              sx={{ mt: 0.75, color: 'text.secondary', flexWrap: 'wrap', columnGap: 2, rowGap: 0.5, alignItems: 'center' }}
            >
              <ResumenItem icono={<PersonOutlineIcon fontSize="inherit" />}>{cliente.nombre}</ResumenItem>
              <ResumenItem icono={<EventOutlinedIcon fontSize="inherit" />}>{formatearFecha(reclamo.fechaProgramada)}</ResumenItem>
              {cliente.direccion && (
                <ResumenItem icono={<PlaceOutlinedIcon fontSize="inherit" />}>{cliente.direccion}</ResumenItem>
              )}
            </Stack>
          </Box>

          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

          <Box
            sx={{
              width: { xs: '100%', md: 150 },
              flexShrink: 0,
              display: 'flex',
              flexDirection: { xs: 'row', md: 'column' },
              alignItems: 'center',
              justifyContent: { xs: 'space-between', md: 'center' },
              gap: 0.75,
              py: 1,
              px: { xs: 1.5, sm: 2, md: 0 },
              borderTop: { xs: 1, md: 0 },
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Estado</Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <Chip size="small" label={reclamo.estado} color={color} />
              {!noDesplegable && (
                <ExpandMoreIcon
                  aria-hidden
                  sx={{ display: { md: 'none' }, color: 'text.secondary', transition: 'transform .2s', transform: abierto ? 'rotate(180deg)' : 'none' }}
                />
              )}
            </Stack>
          </Box>

          {!noDesplegable && (
            <>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', px: 1.5 }}>
                <ExpandMoreIcon
                  aria-hidden
                  sx={{ color: 'text.secondary', transition: 'transform .2s', transform: abierto ? 'rotate(180deg)' : 'none' }}
                />
              </Box>
            </>
          )}
        </Stack>

        <Collapse in={abierto} unmountOnExit>
          <Divider />
          <Stack spacing={2.5} sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' } }}>
              <Dato
                icono={<PersonOutlineIcon fontSize="small" />}
                etiqueta="Cliente"
                accion={cliente.telefono && (
                  <Link href={`tel:${cliente.telefono}`} underline="hover" variant="body2" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneOutlinedIcon fontSize="inherit" /> {cliente.telefono}
                  </Link>
                )}
              >
                <Typography>{cliente.nombre}</Typography>
              </Dato>
              <Dato icono={<EventOutlinedIcon fontSize="small" />} etiqueta="Visita programada">
                <Typography>{formatearFecha(reclamo.fechaProgramada)}</Typography>
                <Typography variant="body2" color="text.secondary">Prioridad {reclamo.prioridad?.toLowerCase() || 'normal'}</Typography>
              </Dato>
              <Dato
                icono={<PlaceOutlinedIcon fontSize="small" />}
                etiqueta="Dirección"
                accion={cliente.direccion && (
                  <Link href={urlMaps} target="_blank" rel="noreferrer" underline="hover" variant="body2" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <MapOutlinedIcon fontSize="inherit" /> Ver en Maps
                  </Link>
                )}
              >
                <Typography>{cliente.direccion || 'Sin dirección'}</Typography>
              </Dato>
            </Box>

            {reclamo.descripcion && (
              <Box sx={{ bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Descripción
                </Typography>
                <Typography sx={{ mt: 0.5, whiteSpace: 'pre-line' }}>{reclamo.descripcion}</Typography>
              </Box>
            )}

            {reclamo.notasCoordinador && (
              <Alert severity="info" variant="outlined">
                <strong>Notas del coordinador:</strong> {reclamo.notasCoordinador}
              </Alert>
            )}

            {reclamo.comentarioFinalizacion && (
              <Alert severity="success" variant="outlined" icon={<TaskAltIcon />}>
                <strong>Trabajo realizado:</strong> {reclamo.comentarioFinalizacion}
              </Alert>
            )}

            {reclamo.imagenes?.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Imágenes del trabajo ({reclamo.imagenes.length})
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <GaleriaImagenes
                    key={reclamo.imagenes.join()}
                    ids={reclamo.imagenes}
                    descripcion={`Imagen del reclamo #${reclamo.id}`}
                  />
                </Box>
              </Box>
            )}
          </Stack>

          {(reclamo.estado === 'Asignado' || estaEnProgreso) && (
            <>
              <Divider />
              <Stack
                direction={{ xs: 'column-reverse', sm: 'row' }}
                spacing={1}
                sx={{ p: { xs: 2, sm: 2 }, px: { sm: 2.5 }, alignItems: { sm: 'center' }, justifyContent: 'flex-end', bgcolor: 'action.hover' }}
              >
                {reclamo.estado === 'Asignado' && (
                  <>
                    {!puedeComenzar && (
                      <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                        Finalizá el reclamo en progreso antes de comenzar otro.
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      disabled={!puedeComenzar}
                      onClick={() => establecerControlInicioAbierto(true)}
                    >
                      Comenzar asignación
                    </Button>
                  </>
                )}
                {estaEnProgreso && (
                  <>
                    <Button
                      color="warning"
                      startIcon={<ReportProblemOutlinedIcon />}
                      onClick={() => establecerInconvenienteAbierto(true)}
                    >
                      Reportar inconveniente
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<DoneIcon />}
                      onClick={() => establecerDialogoAbierto(true)}
                    >
                      Finalizar reclamo
                    </Button>
                  </>
                )}
              </Stack>
            </>
          )}
        </Collapse>
      </Paper>

      {estaEnProgreso && (
        <FormularioFinalizar
          abierto={dialogoAbierto}
          cerrar={() => establecerDialogoAbierto(false)}
          formularioId={formularioId}
          comentario={comentario}
          setComentario={setComentario}
          imagenes={imagenes}
          setImagenes={setImagenes}
          onSubmit={finalizarAsignacion}
          finalizando={finalizando}
          error={errorFinalizar}
        />
      )}

      <Dialog
        open={inconvenienteAbierto}
        onClose={() => establecerInconvenienteAbierto(false)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={reportarInconveniente}>
          <DialogTitle sx={{ fontWeight: 800 }}>Reportar inconveniente</DialogTitle>
          <DialogContent>
            <EntradaVoz
              autoFocus
              label="Motivo del inconveniente"
              value={motivoInconveniente}
              onChange={(event) => establecerMotivoInconveniente(event.target.value)}
              placeholder="Explicá por qué no podés completar el reclamo"
              multiline
              minRows={3}
              required
              fullWidth
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
            <Button onClick={() => establecerInconvenienteAbierto(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              color="warning"
              disabled={!motivoInconveniente.trim()}
            >
              Bloquear reclamo
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ControlVehiculoDialog
        abierto={controlInicioAbierto}
        titulo="Control inicial del servicio"
        kilometrajeMinimo={vehiculo?.kilometraje?.actual || 0}
        cerrar={() => establecerControlInicioAbierto(false)}
        confirmar={iniciarAsignacion}
      />
    </>
  );
}

// Dato chico del resumen de la tarjeta (ícono + texto en una línea).
function ResumenItem({ icono, children }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0, fontSize: 18 }}>
      {icono}
      <Typography variant="body2" noWrap sx={{ maxWidth: { xs: 220, sm: 320 } }}>{children}</Typography>
    </Stack>
  );
}

// Componente que muestra las asignaciones de un técnico, permitiendo filtrar por estado 
// y finalizar reclamos en progreso.
function FormularioFinalizar({ abierto, cerrar, formularioId, comentario, setComentario, imagenes, setImagenes, onSubmit, finalizando, error }) {
  return (
    <Dialog open={abierto} onClose={finalizando ? undefined : cerrar} fullWidth maxWidth="sm">
      <Box component="form" id={formularioId} onSubmit={onSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: 800 }}>Finalizar reclamo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Agregá un comentario y entre 1 y {MAXIMO_IMAGENES} imágenes del trabajo realizado.
            </Typography>

            <EntradaVoz
              label="Comentario del trabajo"
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              placeholder="Describí la solución aplicada"
              multiline
              minRows={3}
              required
              fullWidth
            />

            <SelectorImagenes
              archivos={imagenes}
              alCambiar={setImagenes}
              maximo={MAXIMO_IMAGENES}
              deshabilitado={finalizando}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            pb: 2,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            gap: 1,
            '& > .MuiButton-root': { width: { xs: '100%', sm: 'auto' } },
          }}
        >
          <Button onClick={cerrar} disabled={finalizando}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            color="success"
            startIcon={<DoneIcon />}
            disabled={finalizando}
          >
            {finalizando ? 'Guardando…' : 'Finalizar reclamo'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}



export default MisAsignaciones;
