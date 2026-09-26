import { useState } from 'react';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useAppData } from '../../context/useAppData.js';

function RegistroKilometraje({ vehiculo, alGuardar, compacto = false }) {
  const { actualizarKilometraje } = useAppData();
  const [kilometraje, establecerKilometraje] = useState('');
  const [error, establecerError] = useState('');
  const [guardando, establecerGuardando] = useState(false);

  const guardar = async (event) => {
    event.preventDefault();
    const valor = Number(kilometraje);
    if (!kilometraje || !Number.isFinite(valor) || valor < vehiculo.kilometraje.actual) {
      establecerError(`Ingresá un kilometraje igual o mayor a ${vehiculo.kilometraje.actual} km.`);
      return;
    }

    establecerGuardando(true);
    establecerError('');
    try {
      const vehiculoActualizado = await actualizarKilometraje(vehiculo.id, valor);
      establecerKilometraje('');
      alGuardar?.(vehiculoActualizado);
    } catch (errorDeCarga) {
      establecerError(errorDeCarga.response?.data?.mensaje || 'No se pudo guardar el kilometraje.');
    } finally {
      establecerGuardando(false);
    }
  };

  return (
    <Stack component="form" onSubmit={guardar} spacing={1.5}>
      {!compacto && <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Registrar kilometraje</Typography>}
      <TextField
        label="Kilometraje actual"
        type="number"
        value={kilometraje}
        onChange={(event) => establecerKilometraje(event.target.value)}
        inputProps={{ min: vehiculo.kilometraje.actual }}
        helperText={`Último registro: ${vehiculo.kilometraje.actual.toLocaleString('es-AR')} km`}
        size="small"
        required
        fullWidth
      />
      {error && <Alert severity="error">{error}</Alert>}
      <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={guardando}>
        {guardando ? 'Guardando...' : 'Guardar kilometraje'}
      </Button>
    </Stack>
  );
}

export default RegistroKilometraje;
