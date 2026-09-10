import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DoneIcon from '@mui/icons-material/Done';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlaceIcon from '@mui/icons-material/Place';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { datosIniciales } from '../../data/datosIniciales.js';

// Define los posibles estados de los reclamos para filtrar las asignaciones del técnico.
const estados = ['Todos', 'Asignado', 'En progreso', 'Finalizado'];

// Formatea una fecha en formato "dd/mm/yyyy" para mostrarla en la interfaz.
function formatearFecha(fecha) {
  return new Intl.DateTimeFormat('es-AR').format(new Date(`${fecha}T12:00:00`));
}

// Muestra las asignaciones de un técnico, permitiendo filtrar por estado
function MisAsignaciones({ usuario }) {
  const [filtro, setFiltro] = useState('Todos');
  const tecnico = datosIniciales.usuarios.find((usuarioRegistrado) => usuarioRegistrado.usuario === usuario);
  const asignaciones = datosIniciales.reclamos
    .filter((reclamo) => reclamo.tecnicoId === tecnico?.id)
    .map((reclamo) => ({
      reclamo,
      cliente: datosIniciales.clientes.find((cliente) => cliente.id === reclamo.clienteId),
    }));
  const asignacionesFiltradas = asignaciones.filter(
    ({ reclamo }) => filtro === 'Todos' || reclamo.estado === filtro,
  );

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Asignaciones de hoy</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {asignaciones.length} reclamos asociados a tu usuario.
            </Typography>
          </Box>
          <Stack
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'minmax(220px, 320px)' },
              gap: 2,
            }}
          >
            <FormControl fullWidth>
              <InputLabel id="filtro-estado-label">Filtrar por estado</InputLabel>
              <Select
                labelId="filtro-estado-label"
                value={filtro}
                label="Filtrar por estado"
                onChange={(event) => setFiltro(event.target.value)}
              >
                {estados.map((estado) => <MenuItem key={estado} value={estado}>{estado}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
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
        <Asignacion key={reclamo.id} reclamo={reclamo} cliente={cliente} />
      ))}
    </Stack>
  );
}

// Muestra la información de un reclamo asignado a un técnico, incluyendo detalles del cliente y 
// la opción de finalizar el reclamo si está en progreso.
function Asignacion({ reclamo, cliente }) {
  const [comentario, setComentario] = useState('');
  const [imagen, setImagen] = useState(null);
  const estaEnProgreso = reclamo.estado === 'En progreso';
  const formularioId = `formulario-reclamo-${reclamo.id}`;
  const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.direccion)}`;

  return (
    <Accordion disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography sx={{ fontWeight: 800 }}>{reclamo.tipo}</Typography>
          <Typography variant="body2" color="text.secondary">
            Reclamo #{reclamo.id} · {cliente.nombre}
          </Typography>
        </Box>
        <Chip
          label={reclamo.estado}
          color={reclamo.estado === 'Finalizado' ? 'success' : reclamo.estado === 'En progreso' ? 'warning' : 'info'}
          size="small"
          sx={{ mr: 1 }}
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
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <PlaceIcon color="primary" fontSize="small" />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>{cliente.direccion}</Typography>
            {estaEnProgreso && (
              <Link href={urlMaps} target="_blank" rel="noreferrer" underline="none">
                <Button size="small" variant="outlined" startIcon={<PlaceIcon />}>Ver en Maps</Button>
              </Link>
            )}
          </Stack>

          {reclamo.estado === 'Asignado' && (
            <Button variant="contained" startIcon={<PlayArrowIcon />}>
              Comenzar asignacion
            </Button>
          )}

          {estaEnProgreso && (
            <FormularioFinalizar
              formularioId={formularioId}
              comentario={comentario}
              setComentario={setComentario}
              imagen={imagen}
              setImagen={setImagen}
            />
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

// Componente que muestra las asignaciones de un técnico, permitiendo filtrar por estado 
// y finalizar reclamos en progreso.
function FormularioFinalizar({ formularioId, comentario, setComentario, imagen, setImagen }) {
  return (
    <Paper component="form" id={formularioId} onSubmit={(event) => event.preventDefault()} variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Finalizar reclamo</Typography>
          <Typography variant="body2" color="text.secondary">
            Agregá un comentario y una imagen del trabajo realizado.
          </Typography>
        </Box>

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
          <Typography variant="body2" color="text.secondary">
            {imagen ? imagen.name : 'No seleccionaste ninguna imagen'}
          </Typography>
        </Stack>

        <Button
          type="submit"
          variant="outlined"
          color="success"
          startIcon={<DoneIcon />}
          disabled={!comentario || !imagen}
        >
          Finalizar asignacion
        </Button>
      </Stack>
    </Paper>
  );
}



export default MisAsignaciones;
