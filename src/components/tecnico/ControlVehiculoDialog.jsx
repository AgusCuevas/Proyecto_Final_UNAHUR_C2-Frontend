import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SaveIcon from '@mui/icons-material/Save';
import { comprimirImagen } from '../../utils/comprimirImagen.js';

const FOTOS_REQUERIDAS = 4;

function ControlVehiculoDialog({ abierto, titulo, kilometrajeMinimo = 0, cerrar, confirmar }) {
  const [kilometraje, establecerKilometraje] = useState('');
  const [litros, establecerLitros] = useState('');
  const [estado, establecerEstado] = useState('Activo');
  const [fotos, establecerFotos] = useState([]);
  const [vistaPrevia, establecerVistaPrevia] = useState('');
  const [error, establecerError] = useState('');

  const cerrarDialogo = () => {
    establecerKilometraje('');
    establecerLitros('');
    establecerEstado('Activo');
    establecerFotos([]);
    establecerVistaPrevia('');
    establecerError('');
    cerrar();
  };

  const seleccionarFoto = (event) => {
    const archivos = Array.from(event.target.files || []);
    establecerFotos(archivos);
    establecerVistaPrevia(archivos[0] ? URL.createObjectURL(archivos[0]) : '');
    establecerError('');
  };

  const guardar = async (event) => {
    event.preventDefault();
    const km = Number(kilometraje);
    const combustible = Number(litros);
    if (!kilometraje || km < kilometrajeMinimo) {
      establecerError(`El kilometraje debe ser igual o mayor a ${kilometrajeMinimo} km.`);
      return;
    }
    if (litros === '' || combustible < 0) {
      establecerError('Completá los litros registrados.');
      return;
    }
    if (fotos.length !== FOTOS_REQUERIDAS) {
      establecerError(`Adjuntá exactamente ${FOTOS_REQUERIDAS} fotos del vehículo para finalizar la jornada.`);
      return;
    }
    try {
      const imagenes = await Promise.all(fotos.map(async (foto, indice) => ({
        id: Date.now() + indice,
        fecha: new Date().toISOString(),
        imagen: await comprimirImagen(foto),
        nombre: foto.name,
      })));
      await confirmar({
        kilometraje: km,
        litros: combustible,
        estado,
        foto: imagenes[0],
        fotos: imagenes,
        fotosControl: imagenes.map((imagen) => imagen.imagen),
      });
      cerrarDialogo();
    } catch (causa) {
      establecerError(causa.message || 'No se pudieron procesar las fotos. Intentá nuevamente.');
    }
  };

  return (
    <Dialog open={abierto} onClose={cerrarDialogo} fullWidth maxWidth="sm">
      <Stack component="form" onSubmit={guardar}>
        <DialogTitle sx={{ fontWeight: 800 }}>{titulo}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Registrá el tablero completo antes de continuar.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Kilometraje"
                type="number"
                value={kilometraje}
                onChange={(event) => establecerKilometraje(event.target.value)}
                inputProps={{ min: kilometrajeMinimo }}
                helperText={`Mínimo: ${kilometrajeMinimo} km`}
                required
                fullWidth
              />
              <TextField
                label="Litros de nafta"
                type="number"
                value={litros}
                onChange={(event) => establecerLitros(event.target.value)}
                inputProps={{ min: 0, step: 0.1 }}
                helperText="Carga o lectura registrada"
                required
                fullWidth
              />
            </Stack>
            <FormControl fullWidth>
              <InputLabel id="estado-control-vehiculo-label">Estado del vehículo</InputLabel>
              <Select
                labelId="estado-control-vehiculo-label"
                value={estado}
                label="Estado del vehículo"
                onChange={(event) => establecerEstado(event.target.value)}
              >
                <MenuItem value="Activo">Activo</MenuItem>
                <MenuItem value="Fuera de servicio">Fuera de servicio</MenuItem>
              </Select>
            </FormControl>
            <Button component="label" variant="outlined" startIcon={<CameraAltIcon />}>
              Cargar 4 fotos del vehículo y medidor
              <input hidden type="file" accept="image/*" multiple capture="environment" onChange={seleccionarFoto} />
            </Button>
            <Typography variant="body2" color={fotos.length === FOTOS_REQUERIDAS ? 'success.main' : 'text.secondary'}>
              {fotos.length} de {FOTOS_REQUERIDAS} fotos seleccionadas
            </Typography>
            {vistaPrevia && (
              <img src={vistaPrevia} alt="Vista previa del tablero" style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 8 }} />
            )}
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />}>Guardar control</Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}

export default ControlVehiculoDialog;
