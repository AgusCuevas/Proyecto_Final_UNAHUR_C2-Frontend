import { useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import { datosIniciales } from '../../data/datosIniciales.js';

function Tecnicos() {
  const tecnicos = datosIniciales.usuarios.filter(
    (usuario) => usuario.rol === 'Tecnico' && usuario.activo,
  );
  const [tecnicoSeleccionado, establecerTecnicoSeleccionado] = useState(tecnicos[0]?.id);
  const [fichaAbierta, establecerFichaAbierta] = useState(false);
  const tecnico = tecnicos.find((item) => item.id === tecnicoSeleccionado) || tecnicos[0];
  const vehiculo = datosIniciales.vehiculos.find(
    (item) => item.tecnicoAsignado === tecnico?.id,
  );
  const ubicacion = datosIniciales.ubicacionesTecnicos.find(
    (item) => item.tecnicoId === tecnico?.id,
  );

  if (!tecnico) return null;

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Técnicos</Typography>
        <Typography color="text.secondary">Seleccioná un técnico para consultar su información.</Typography>
      </div>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
        <Stack spacing={1.25} sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
          {tecnicos.map((item) => (
            <Card
              key={item.id}
              onClick={() => {
                establecerTecnicoSeleccionado(item.id);
                establecerFichaAbierta(false);
              }}
              sx={{
                cursor: 'pointer',
                borderColor: item.id === tecnico.id ? 'primary.main' : 'divider',
                backgroundColor: item.id === tecnico.id ? 'action.selected' : 'background.paper',
                transition: 'border-color 160ms ease, transform 160ms ease',
                '&:hover': { transform: 'translateY(-2px)' },
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 38, height: 38 }}>
                    {item.nombre.charAt(0)}
                  </Avatar>
                  <div>
                    <Typography sx={{ fontWeight: 700 }}>{item.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.telefono}</Typography>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        <Card sx={{ flex: 1, minWidth: 0 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', width: 58, height: 58 }}>
                  <PersonIcon />
                </Avatar>
                <div>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{tecnico.nombre}</Typography>
                  <Typography color="text.secondary">{tecnico.email}</Typography>
                  <Chip
                    size="small"
                    label={ubicacion?.estado || 'Libre'}
                    color={ubicacion?.estado === 'Activo' ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </div>
              </Stack>
              <Button
                size="small"
                variant="outlined"
                endIcon={<ExpandMoreIcon sx={{ transform: fichaAbierta ? 'rotate(180deg)' : 'none' }} />}
                onClick={() => establecerFichaAbierta((actual) => !actual)}
              >
                {fichaAbierta ? 'Ocultar ficha' : 'Ver ficha completa'}
              </Button>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} mt={3}>
              <div>
                <Typography variant="caption" color="text.secondary">Documento</Typography>
                <Typography>{tecnico.documento}</Typography>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                <Typography>{tecnico.telefono}</Typography>
              </div>
              <div>
                <Typography variant="caption" color="text.secondary">Estado operativo</Typography>
                <Typography>{ubicacion?.estado || 'Libre'}</Typography>
              </div>
            </Stack>

            {fichaAbierta && (
              <Stack spacing={2} mt={3}>
                <Divider />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Ficha personal y vehículo</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                  <div>
                    <Typography variant="caption" color="text.secondary">Usuario</Typography>
                    <Typography>{tecnico.usuario}</Typography>
                  </div>
                  <div>
                    <Typography variant="caption" color="text.secondary">Dirección</Typography>
                    <Typography>{tecnico.direccion}</Typography>
                  </div>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <DirectionsCarIcon color="primary" />
                  <div>
                    <Typography variant="caption" color="text.secondary">Vehículo asignado</Typography>
                    <Typography>
                      {vehiculo ? `${vehiculo.modelo} · ${vehiculo.patente}` : 'Sin vehículo asignado'}
                    </Typography>
                  </div>
                </Stack>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  );
}

export default Tecnicos;