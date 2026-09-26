import { useState } from 'react';
import { Alert, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import { useAppData } from '../../context/useAppData.js';

function Vehiculo({ usuario }) {
  const { data, registrarControlVehiculo, actualizarEstadoVehiculo } = useAppData();
  const [kilometraje, establecerKilometraje] = useState('');
  const [litros, establecerLitros] = useState('');
  const [estadoControl, establecerEstadoControl] = useState('Activo');
  const [foto, establecerFoto] = useState(null);
  const [vistaPrevia, establecerVistaPrevia] = useState('');
  const [mensaje, establecerMensaje] = useState('');
  const tecnico = data.usuarios.find((usuarioRegistrado) => usuarioRegistrado.usuario === usuario);
  const vehiculo = data.vehiculos.find((vehiculoRegistrado) => vehiculoRegistrado.tecnicoAsignado === tecnico?.id);

  const guardarControl = (event) => {
    event.preventDefault();
    const valor = Number(kilometraje);
    if (!vehiculo || !kilometraje || valor < vehiculo.kilometraje.actual || litros === '' || !foto) return;
    registrarControlVehiculo(vehiculo.id, {
      kilometraje: valor,
      litros: Number(litros),
      estado: estadoControl,
      foto: {
        id: Date.now(),
        fecha: new Date().toISOString(),
        imagen: URL.createObjectURL(foto),
        nombre: foto.name,
      },
    });
    establecerKilometraje('');
    establecerLitros('');
    establecerFoto(null);
    establecerMensaje('Control del vehículo guardado correctamente.');
  };
  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <DirectionsCarIcon color="secondary" fontSize="large" />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Vehiculo asignado</Typography>
          <Typography color="text.secondary">{vehiculo?.modelo} · {vehiculo?.patente}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>Kilometraje inicial: {vehiculo?.kilometraje.inicial} km</Typography>
          <Typography variant="body2">Kilometraje actual: {vehiculo?.kilometraje.actual} km</Typography>
          <Chip
            icon={<BuildCircleIcon />}
            label={vehiculo?.enServicio === false ? 'Fuera de servicio' : 'Activo'}
            color={vehiculo?.enServicio === false ? 'default' : 'success'}
            size="small"
            sx={{ mt: 1, width: 'fit-content' }}
          />
          {vehiculo?.ultimoControl && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Último control: {vehiculo.ultimoControl.litros} litros · {vehiculo.ultimoControl.kilometraje} km
            </Typography>
          )}
        </Box>
        </Stack>
                {vehiculo && (
                  <Stack component="form" onSubmit={guardarControl} spacing={1.5} sx={{ mt: 1, p: 2, borderRadius: 1.5, backgroundColor: 'action.hover' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Control de salida y kilometraje</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                      <TextField
                        label="Kilometraje registrado"
                        type="number"
                        size="small"
                        value={kilometraje}
                        onChange={(event) => establecerKilometraje(event.target.value)}
                        inputProps={{ min: vehiculo.kilometraje.actual }}
                        helperText={`Debe ser igual o mayor a ${vehiculo.kilometraje.actual} km`}
                        required
                      />
                      <TextField
                        label="Litros de nafta"
                        type="number"
                        size="small"
                        value={litros}
                        onChange={(event) => establecerLitros(event.target.value)}
                        inputProps={{ min: 0, step: 0.1 }}
                        required
                      />
                      <TextField
                        select
                        label="Estado"
                        size="small"
                        value={estadoControl}
                        onChange={(event) => establecerEstadoControl(event.target.value)}
                      >
                        <MenuItem value="Activo">Activo</MenuItem>
                        <MenuItem value="Fuera de servicio">Fuera de servicio</MenuItem>
                      </TextField>
                      <Button component="label" variant="outlined" startIcon={<CameraAltIcon />} sx={{ minHeight: 40 }}>
                        Foto del tablero
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(event) => {
                            const archivo = event.target.files?.[0] || null;
                            establecerFoto(archivo);
                            establecerVistaPrevia(archivo ? URL.createObjectURL(archivo) : '');
                          }}
                        />
                      </Button>
                      <Button type="submit" variant="contained" startIcon={<AddPhotoAlternateIcon />} disabled={!kilometraje || litros === '' || !foto}>
                        Guardar control
                      </Button>
                    </Stack>
                    {foto && <Typography variant="body2" color="text.secondary">{foto.name}</Typography>}
                    {vistaPrevia && <Box component="img" src={vistaPrevia} alt="Vista previa del tablero" sx={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 1 }} />}
                    {mensaje && <Alert severity="success">{mensaje}</Alert>}
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="body2" color="text.secondary">Estado operativo:</Typography>
                      <Button size="small" variant={vehiculo.enServicio !== false ? 'contained' : 'outlined'} onClick={() => actualizarEstadoVehiculo(vehiculo.id, true)}>Activo</Button>
                      <Button size="small" variant={vehiculo.enServicio === false ? 'contained' : 'outlined'} color="warning" onClick={() => actualizarEstadoVehiculo(vehiculo.id, false)}>Fuera de servicio</Button>
                    </Stack>
                  </Stack>
                )}
        <Stack spacing={0.5}>
          <Typography variant="body2"><strong>Seguro:</strong> {vehiculo?.seguro.compania} · Póliza {vehiculo?.seguro.poliza}</Typography>
          <Typography variant="body2"><strong>Vencimiento:</strong> {vehiculo?.seguro.vence}</Typography>
          <Typography variant="body2"><strong>Último service:</strong> {vehiculo?.ultimoService}</Typography>
          <Typography variant="body2" color="text.secondary">{vehiculo?.detalle}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default Vehiculo;
