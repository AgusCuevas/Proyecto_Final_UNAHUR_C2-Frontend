import { useState } from 'react';
import {
  Alert, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField,
} from '@mui/material';

// Guardar el reporte en "Mis reportes". Si ya estaba guardado y el usuario puede editarlo, se
// puede guardar encima o como uno nuevo.
export default function GuardarReporte({
  abierto, cerrar, nombreInicial, descripcionInicial, compartidoInicial, puedeSobrescribir, rolId, alGuardar,
}) {
  const [nombre, establecerNombre] = useState(nombreInicial || '');
  const [descripcion, establecerDescripcion] = useState(descripcionInicial || '');
  const [compartido, establecerCompartido] = useState(Boolean(compartidoInicial));
  const [guardando, establecerGuardando] = useState(false);
  const [error, establecerError] = useState('');

  const guardar = async (comoNuevo) => {
    if (!nombre.trim()) {
      establecerError('Poné un nombre para encontrarlo después.');
      return;
    }
    establecerGuardando(true);
    establecerError('');
    try {
      await alGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim(), compartidoCon: compartido ? [2] : [] }, comoNuevo);
      cerrar();
    } catch (causa) {
      establecerError(causa?.response?.data?.mensaje || 'No se pudo guardar el reporte.');
    } finally {
      establecerGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onClose={cerrar} fullWidth maxWidth="sm">
      <DialogTitle>Guardar reporte</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Nombre" value={nombre} onChange={(evento) => establecerNombre(evento.target.value)} autoFocus slotProps={{ htmlInput: { maxLength: 80 } }} />
          <TextField label="Para qué sirve (opcional)" value={descripcion} onChange={(evento) => establecerDescripcion(evento.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 300 } }} />
          <FormControlLabel
            control={<Checkbox checked={compartido} onChange={(evento) => establecerCompartido(evento.target.checked)} />}
            label={rolId === 1 ? 'Compartir con los coordinadores' : 'Compartir con los demás coordinadores'}
          />
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={cerrar}>Cancelar</Button>
        {puedeSobrescribir && <Button onClick={() => guardar(true)} disabled={guardando}>Guardar como nuevo</Button>}
        <Button variant="contained" onClick={() => guardar(false)} disabled={guardando}>
          {puedeSobrescribir ? 'Guardar cambios' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
