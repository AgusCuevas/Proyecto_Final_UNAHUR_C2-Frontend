import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DoneIcon from '@mui/icons-material/Done';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlaceIcon from '@mui/icons-material/Place';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAppData } from '../../context/useAppData.js';

// Formatea una fecha en formato "dd/mm/yyyy" para mostrarla en la interfaz.
function formatearFecha(fecha) {
  return new Intl.DateTimeFormat('es-AR').format(new Date(`${fecha}T12:00:00`));
}

// Muestra las asignaciones de un técnico, permitiendo filtrar por estado
function MisAsignaciones({ usuario, soloEnCurso = false }) {
  const [filtro, setFiltro] = useState(soloEnCurso ? 'En progreso' : 'Todos');
  const esMovil = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const { data, actualizarEstado } = useAppData();
  const tecnico = data.usuarios.find((usuarioRegistrado) => usuarioRegistrado.usuario === usuario);
  const asignaciones = data.reclamos
    .filter((reclamo) => reclamo.tecnicoId === tecnico?.id)
    .map((reclamo) => ({
      reclamo,
      cliente: data.clientes.find((cliente) => cliente.id === reclamo.clienteId),
    }));
  const tieneReclamoEnProgreso = asignaciones.some(
    ({ reclamo }) => reclamo.estado === 'En progreso',
  );
  const filtroActivo = soloEnCurso ? 'En progreso' : filtro;
  const asignacionesFiltradas = asignaciones.filter(
    ({ reclamo }) => filtroActivo === 'Todos' || reclamo.estado === filtroActivo,
  );

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {soloEnCurso ? 'Servicio en curso' : 'Asignaciones de hoy'}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {asignaciones.length} reclamos asociados a tu usuario.
            </Typography>
          </Box>
          {!soloEnCurso && esMovil ? (
            <FormControl fullWidth>
              <InputLabel id="filtro-estado-label">Filtrar servicios</InputLabel>
              <Select
                labelId="filtro-estado-label"
                value={filtro}
                label="Filtrar servicios"
                onChange={(event) => setFiltro(event.target.value)}
              >
                <MenuItem value="Todos">Todos los servicios</MenuItem>
                <MenuItem value="En progreso">Servicio en curso</MenuItem>
                <MenuItem value="Asignado">Asignados</MenuItem>
                <MenuItem value="Finalizado">Finalizados</MenuItem>
              </Select>
            </FormControl>
          ) : !soloEnCurso && (
            <Tabs
              value={filtro}
              onChange={(_, nuevoFiltro) => setFiltro(nuevoFiltro)}
              variant="fullWidth"
              aria-label="Filtrar asignaciones por estado"
            >
              <Tab label="Todos los servicios" value="Todos" />
              <Tab label="Servicio en curso" value="En progreso" />
              <Tab label="Asignados" value="Asignado" />
              <Tab label="Finalizados" value="Finalizado" />
            </Tabs>
          )}
          <Typography variant="body2" color="text.secondary">
            {asignacionesFiltradas.length} de {asignaciones.length} asignaciones visibles
          </Typography>
        </Stack>
      </Paper>

      {asignacionesFiltradas.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay asignaciones con este estado.</Typography>
        </Paper>
      ) : asignacionesFiltradas.map(({ reclamo, cliente }) => (
        <Asignacion
          key={reclamo.id}
          reclamo={reclamo}
          cliente={cliente}
          puedeComenzar={!tieneReclamoEnProgreso}
          noDesplegable={soloEnCurso}
          actualizarEstado={actualizarEstado}
        />
      ))}
    </Stack>
  );
}

// Muestra la información de un reclamo asignado a un técnico, incluyendo detalles del cliente y 
// la opción de finalizar el reclamo si está en progreso.
function Asignacion({ reclamo, cliente, puedeComenzar, noDesplegable = false, actualizarEstado }) {
  const [comentario, setComentario] = useState('');
  const [imagen, setImagen] = useState(null);
  const [imagenAbierta, establecerImagenAbierta] = useState(null);
  const [dialogoAbierto, establecerDialogoAbierto] = useState(false);
  const [inconvenienteAbierto, establecerInconvenienteAbierto] = useState(false);
  const [motivoInconveniente, establecerMotivoInconveniente] = useState('');
  const estaEnProgreso = reclamo.estado === 'En progreso';
  const formularioId = `formulario-reclamo-${reclamo.id}`;
  const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.direccion)}`;
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
  const finalizarAsignacion = async (event) => {
    event.preventDefault();
    if (!comentario.trim() || !imagen) return;

    await actualizarEstado(reclamo.id, {
      estado: 'Finalizado',
      comentarioFinalizacion: comentario.trim(),
      imagen: URL.createObjectURL(imagen),
    });
    establecerDialogoAbierto(false);
  };

  return (
    <Accordion expanded={noDesplegable || undefined} disableGutters>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ alignItems: 'flex-start', display: noDesplegable ? 'none' : 'flex' }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{reclamo.tipo}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
            Reclamo #{reclamo.id} · {cliente.nombre}
          </Typography>
        </Box>
        <Chip
          label={reclamo.estado}
          color={reclamo.estado === 'Finalizado' ? 'success' : reclamo.estado === 'En progreso' ? 'warning' : 'info'}
          size="small"
          sx={{ mr: 1, flexShrink: 0 }}
        />
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="overline" color="text.secondary">Cliente</Typography>
              <Typography>{cliente.nombre}</Typography>
              <Typography variant="body2" color="text.secondary">{cliente.telefono}</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="overline" color="text.secondary">Visita programada</Typography>
              <Typography>{formatearFecha(reclamo.fechaProgramada)}</Typography>
              <Typography variant="body2" color="text.secondary">Prioridad: {reclamo.prioridad}</Typography>
            </Box>
          </Stack>

          <Box>
            <Typography variant="overline" color="text.secondary">Descripcion</Typography>
            <Typography>{reclamo.descripcion}</Typography>
            {reclamo.estado === 'Finalizado' && reclamo.imagen && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75, fontWeight: 700 }}>
                  Evidencia del trabajo
                </Typography>
                <Box
                  component="img"
                  src={reclamo.imagen}
                  alt={`Evidencia del reclamo #${reclamo.id}`}
                  onClick={() => establecerImagenAbierta({
                    src: reclamo.imagen,
                    alt: `Evidencia del reclamo #${reclamo.id}`,
                  })}
                  sx={{
                    display: 'block',
                    width: { xs: '100%', sm: 180 },
                    maxWidth: '100%',
                    height: 120,
                    objectFit: 'contain',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                    cursor: 'zoom-in',
                  }}
                />
              </Box>
            )}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <PlaceIcon color="primary" fontSize="small" />
            <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
              {cliente.direccion}
            </Typography>
            {estaEnProgreso && (
              <Link href={urlMaps} target="_blank" rel="noreferrer" underline="none">
                <Button size="small" variant="outlined" startIcon={<PlaceIcon />}>Ver en Maps</Button>
              </Link>
            )}
          </Stack>

          {reclamo.estado === 'Asignado' && (
            <Stack spacing={0.75} alignItems="flex-start">
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                disabled={!puedeComenzar}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Comenzar asignacion
              </Button>
              {!puedeComenzar && (
                <Typography variant="caption" color="text.secondary">
                  Finalizá el reclamo en progreso antes de comenzar otro.
                </Typography>
              )}
            </Stack>
          )}

          {estaEnProgreso && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                color="success"
                startIcon={<DoneIcon />}
                onClick={() => establecerDialogoAbierto(true)}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Finalizar reclamo
              </Button>
              <Button
                variant="outlined"
                color="warning"
                onClick={() => establecerInconvenienteAbierto(true)}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Reportar inconveniente
              </Button>
            </Stack>
          )}
        </Stack>
      </AccordionDetails>

      {estaEnProgreso && (
        <FormularioFinalizar
          abierto={dialogoAbierto}
          cerrar={() => establecerDialogoAbierto(false)}
          formularioId={formularioId}
          comentario={comentario}
          setComentario={setComentario}
          imagen={imagen}
          setImagen={setImagen}
          onSubmit={finalizarAsignacion}
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
            <TextField
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
    </Accordion>
  );
}

// Componente que muestra las asignaciones de un técnico, permitiendo filtrar por estado 
// y finalizar reclamos en progreso.
function FormularioFinalizar({ abierto, cerrar, formularioId, comentario, setComentario, imagen, setImagen, onSubmit }) {
  const [vistaPrevia, establecerVistaPrevia] = useState('');

  useEffect(() => {
    if (!imagen) {
      establecerVistaPrevia('');
      return undefined;
    }

    const url = URL.createObjectURL(imagen);
    establecerVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [imagen]);

  return (
    <Dialog open={abierto} onClose={cerrar} fullWidth maxWidth="sm">
      <Box component="form" id={formularioId} onSubmit={onSubmit}>
        <DialogTitle sx={{ fontWeight: 800 }}>Finalizar reclamo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Agregá un comentario y una imagen del trabajo realizado.
            </Typography>

            <TextField
              label="Comentario del trabajo"
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              placeholder="Describí la solución aplicada"
              multiline
              minRows={3}
              required
              fullWidth
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
              <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateIcon />}>
                Cargar imagen
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImagen(event.target.files?.[0] ?? null)}
                />
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                {imagen ? imagen.name : 'No seleccionaste ninguna imagen'}
              </Typography>
            </Stack>
            {vistaPrevia && (
              <Box
                component="img"
                src={vistaPrevia}
                alt="Vista previa de la imagen seleccionada"
                sx={{
                  width: 112,
                  height: 112,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                }}
              />
            )}
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
          <Button onClick={cerrar}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            color="success"
            startIcon={<DoneIcon />}
            disabled={!comentario || !imagen}
          >
            Finalizar asignacion
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}



export default MisAsignaciones;
