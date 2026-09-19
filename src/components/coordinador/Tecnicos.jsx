import { useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { useAppData } from '../../context/useAppData.js';

function Tecnicos() {
  const { data } = useAppData();
  const [busqueda, establecerBusqueda] = useState('');
  const [filtroEstado, establecerFiltroEstado] = useState('Todos');
  const [cantidadVisible, establecerCantidadVisible] = useState(10);
  const tecnicos = data.usuarios
    .filter((usuario) => usuario.rol === 'Tecnico' && usuario.activo)
    .map((tecnico) => {
      const reclamoEnCurso = data.reclamos.find(
        (reclamo) => reclamo.tecnicoId === tecnico.id && reclamo.estado === 'En progreso',
      );
      const reclamoAsignado = data.reclamos.find(
        (reclamo) => reclamo.tecnicoId === tecnico.id
          && reclamo.estado !== 'Finalizado'
          && reclamo.estado !== 'En progreso',
      );

      return {
        ...tecnico,
        estado: reclamoEnCurso ? 'Activo' : reclamoAsignado ? 'Asignado' : 'Libre',
      };
    })
    .sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es'));
  const tecnicosFiltrados = tecnicos
    .filter((tecnico) => {
      const texto = busqueda.trim().toLowerCase();
      const coincideBusqueda = !texto
        || [tecnico.nombre, tecnico.usuario, tecnico.email]
          .some((campo) => campo?.toLowerCase().includes(texto));
      const coincideEstado = filtroEstado === 'Todos' || tecnico.estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  const tecnicosVisibles = tecnicosFiltrados.slice(0, cantidadVisible);
  const [tecnicoSeleccionado, establecerTecnicoSeleccionado] = useState(tecnicos[0]?.id);
  const [fichaAbierta, establecerFichaAbierta] = useState(false);
  const tecnico = tecnicosFiltrados.find((item) => item.id === tecnicoSeleccionado)
    || tecnicosFiltrados[0];
  const vehiculo = data.vehiculos.find(
    (item) => item.tecnicoAsignado === tecnico?.id,
  );

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          value={busqueda}
          onChange={(event) => establecerBusqueda(event.target.value)}
          label="Buscar técnico"
          placeholder="Nombre, usuario o email"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl sx={{ minWidth: { sm: 190 } }}>
          <InputLabel id="filtro-estado-tecnicos-label">Estado</InputLabel>
          <Select
            labelId="filtro-estado-tecnicos-label"
            value={filtroEstado}
            label="Estado"
            onChange={(event) => establecerFiltroEstado(event.target.value)}
          >
            {['Todos', 'Activo', 'Asignado', 'Libre'].map((estado) => (
              <MenuItem key={estado} value={estado}>{estado}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Mostrando {tecnicosVisibles.length} de {tecnicosFiltrados.length} técnicos encontrados.
      </Typography>

      {tecnicosFiltrados.length === 0 ? (
        <Typography color="text.secondary">No hay técnicos que coincidan con los filtros.</Typography>
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
          <Stack spacing={1.25} sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
            {tecnicosVisibles.map((item) => (
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

          <Card sx={{ flex: 1, minWidth: 0, alignSelf: 'flex-start' }}>
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
                    label={tecnico.estado}
                    color={tecnico.estado === 'Activo' ? 'success' : tecnico.estado === 'Asignado' ? 'warning' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </div>
              </Stack>
              <Button
                size="small"
                variant="outlined"
                endIcon={<ExpandMoreIcon sx={{ transform: fichaAbierta ? 'rotate(180deg)' : 'none' }} />}
                onClick={() => establecerFichaAbierta((actual) => !actual)}
                sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minWidth: { sm: 174 } }}
              >
                {fichaAbierta ? 'Ocultar ficha' : 'Ver ficha completa'}
              </Button>
            </Stack>

            <Divider sx={{ my: 2.5 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Stack spacing={0.5} sx={{ flex: 1, p: 1.5, borderRadius: 1.5, backgroundColor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary">Documento</Typography>
                <Typography sx={{ fontWeight: 800 }}>{tecnico.documento}</Typography>
              </Stack>
              <Stack spacing={0.5} sx={{ flex: 1, p: 1.5, borderRadius: 1.5, backgroundColor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                <Typography sx={{ fontWeight: 800 }}>{tecnico.telefono}</Typography>
              </Stack>
              <Stack spacing={0.5} sx={{ flex: 1, p: 1.5, borderRadius: 1.5, backgroundColor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary">Estado operativo</Typography>
                    <Typography sx={{ fontWeight: 800 }}>{tecnico.estado}</Typography>
              </Stack>
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
      )}
      {tecnicosVisibles.length < tecnicosFiltrados.length && (
        <Button
          variant="outlined"
          onClick={() => establecerCantidadVisible((actual) => actual + 10)}
          sx={{ alignSelf: 'center' }}
        >
          Mostrar más
        </Button>
      )}
    </Stack>
  );
}

export default Tecnicos;