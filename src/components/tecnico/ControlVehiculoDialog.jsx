import { useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SelectorImagenes from '../comunes/SelectorImagenes.jsx';
import { subirImagenes } from '../../utils/subirImagenes.js';
import SelectorBuscable from '../comunes/SelectorBuscable.jsx';

const IMAGENES_REQUERIDAS = 4;

function ControlVehiculoDialog({ abierto, titulo, kilometrajeMinimo = 0, cerrar, confirmar }) {
  const [kilometraje, establecerKilometraje] = useState('');
  const [litros, establecerLitros] = useState('');
  const [estado, establecerEstado] = useState('Activo');
  const [imagenes, establecerImagenes] = useState([]);
  const [guardando, establecerGuardando] = useState(false);
  const [error, establecerError] = useState('');

  const cerrarDialogo = () => {
    establecerKilometraje('');
    establecerLitros('');
    establecerEstado('Activo');
    establecerImagenes([]);
    establecerError('');
    cerrar();
  };

  const cambiarImagenes = (archivos) => {
    establecerImagenes(archivos);
    establecerError('');
  };

  const guardar = async (event) => {
    event.preventDefault();
    // Acepta coma o punto decimal ("12,5") y rechaza lo que no es un número.
    const aNumero = (texto) => (String(texto).trim() === '' ? NaN : Number(String(texto).trim().replace(',', '.')));
    const km = aNumero(kilometraje);
    const combustible = aNumero(litros);
    if (!Number.isFinite(km) || km < kilometrajeMinimo) {
      establecerError(`El kilometraje debe ser un número igual o mayor a ${kilometrajeMinimo} km.`);
      return;
    }
    if (!Number.isFinite(combustible) || combustible < 0) {
      establecerError('Completá los litros registrados con un número.');
      return;
    }
    if (imagenes.length !== IMAGENES_REQUERIDAS) {
      establecerError(`Adjuntá exactamente ${IMAGENES_REQUERIDAS} imágenes del vehículo.`);
      return;
    }
    establecerGuardando(true);
    try {
      const idsImagenes = await subirImagenes(imagenes);
      await confirmar({ kilometraje: km, litros: combustible, estado, imagenes: idsImagenes });
      cerrarDialogo();
    } catch (causa) {
      establecerError(causa?.response?.data?.mensaje || causa.message || 'No se pudieron guardar las imágenes. Intentá nuevamente.');
    } finally {
      establecerGuardando(false);
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
                // Sin "min" en el campo: el mínimo lo valida la app, con un mensaje en castellano.
                slotProps={{ htmlInput: { step: 'any' } }}
                helperText={`Mínimo: ${kilometrajeMinimo} km`}
                required
                fullWidth
              />
              <TextField
                label="Litros de nafta"
                type="number"
                value={litros}
                onChange={(event) => establecerLitros(event.target.value)}
                slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                helperText="Carga o lectura registrada"
                required
                fullWidth
              />
            </Stack>
            <SelectorBuscable
              label="Estado del vehículo"
              sinBorrar
              opciones={['Activo', 'Fuera de servicio'].map((id) => ({ id }))}
              valor={estado}
              alCambiar={establecerEstado}
              etiqueta={(opcion) => opcion.id}
            />
            <Typography variant="subtitle2">Imágenes del vehículo y del tablero</Typography>
            <SelectorImagenes
              archivos={imagenes}
              alCambiar={cambiarImagenes}
              maximo={IMAGENES_REQUERIDAS}
              requeridas={IMAGENES_REQUERIDAS}
              deshabilitado={guardando}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
          <Button onClick={cerrarDialogo} disabled={guardando}>Cancelar</Button>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar control'}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}

export default ControlVehiculoDialog;
