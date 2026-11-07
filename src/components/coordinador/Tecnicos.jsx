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
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { usePagina, usePaginado, useValorDiferido } from '../../context/usePaginado.js';
import { tecnicosApi } from '../../services/api.js';
import MapaTecnicos from './MapaTecnicos.jsx';
import FichaDetalle from '../comunes/FichaDetalle.jsx';
import PaginacionLista from '../comunes/PaginacionLista.jsx';
import AvisoCarga from '../comunes/AvisoCarga.jsx';

const colorEstado = { Activo: 'success', Asignado: 'warning', Libre: 'default' };

// Las fechas llegan como 'AAAA-MM-DD' o como ISO completo desde MongoDB.
const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const fechaLocal = new Date(`${String(fecha).slice(0, 10)}T12:00:00`);
  return Number.isNaN(fechaLocal.getTime()) ? String(fecha) : new Intl.DateTimeFormat('es-AR').format(fechaLocal);
};

const describirReclamo = (reclamo) => (reclamo ? `#${reclamo.id} · ${reclamo.tipo}` : '');

function Tecnicos() {
  const [busqueda, establecerBusqueda] = useState('');
  const [filtroEstado, establecerFiltroEstado] = useState('Todos');
  const [resultadosPorPagina, establecerResultadosPorPagina] = useState(10);
  // Paginación en el servidor: solo técnicos habilitados, con la búsqueda y el estado
  // (Activo, Asignado o Libre). Cada técnico trae estado, reclamos, vehículo y ubicación.
  const buscar = useValorDiferido(busqueda.trim());
  const [pagina, establecerPagina] = usePagina(buscar);
  const {
    datos: tecnicosVisibles, paginacion, cargando, error: errorCarga,
  } = usePaginado(tecnicosApi.pagina, {
    pagina, limite: resultadosPorPagina, buscar, estado: filtroEstado, activo: 'true',
  });
  const totalTecnicos = paginacion?.total ?? 0;
  const [tecnicoSeleccionado, establecerTecnicoSeleccionado] = useState(null);
  const [fichaAbierta, establecerFichaAbierta] = useState(false);
  const [tecnicoEnMapa, establecerTecnicoEnMapa] = useState(null);
  const tecnico = tecnicosVisibles.find((item) => item.id === tecnicoSeleccionado)
    || tecnicosVisibles[0];
  const vehiculo = tecnico?.vehiculo;
  const seccionesFicha = tecnico ? [
    {
      titulo: 'Datos personales',
      icono: <BadgeOutlinedIcon fontSize="small" />,
      campos: [
        ['DNI', tecnico.documento],
        ['Fecha de nacimiento', formatearFecha(tecnico.fechaNacimiento)],
        ['Teléfono', tecnico.telefono],
        ['Vencimiento de registro', formatearFecha(tecnico.vencimientoRegistro)],
        ['Correo electrónico', tecnico.email, { anchoCompleto: true }],
        ['Domicilio', tecnico.direccion, { anchoCompleto: true }],
      ],
    },
    {
      titulo: 'Trabajo actual',
      icono: <EngineeringOutlinedIcon fontSize="small" />,
      campos: [
        ['En curso', describirReclamo(tecnico.reclamoEnCurso) || 'Ninguno'],
        ['Próximo asignado', describirReclamo(tecnico.reclamoAsignado) || 'Ninguno'],
      ],
    },
    {
      titulo: 'Vehículo asignado',
      icono: <DirectionsCarOutlinedIcon fontSize="small" />,
      campos: vehiculo ? [
        ['Vehículo', [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ')],
        ['Patente', vehiculo.patente],
        ['Kilometraje actual', vehiculo.kilometraje?.actual != null
          ? `${vehiculo.kilometraje.actual.toLocaleString('es-AR')} km`
          : ''],
        ['Vencimiento del seguro', formatearFecha(vehiculo.seguro?.vence)],
      ] : [['Vehículo', 'Sin vehículo asignado', { anchoCompleto: true }]],
    },
  ] : [];

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          value={busqueda}
          onChange={(event) => establecerBusqueda(event.target.value)}
          label="Buscar técnico"
          placeholder="Nombre, usuario o email"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl sx={{ minWidth: { sm: 190 } }}>
          <InputLabel id="filtro-estado-tecnicos-label">Estado</InputLabel>
          <Select
            labelId="filtro-estado-tecnicos-label"
            value={filtroEstado}
            label="Estado"
            onChange={(event) => {
              establecerFiltroEstado(event.target.value);
              establecerPagina(1);
            }}
          >
            {['Todos', 'Activo', 'Asignado', 'Libre'].map((estado) => (
              <MenuItem key={estado} value={estado}>{estado}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      <PaginacionLista
        pagina={pagina}
        total={totalTecnicos}
        resultadosPorPagina={resultadosPorPagina}
        establecerPagina={establecerPagina}
        establecerResultadosPorPagina={establecerResultadosPorPagina}
      />
      <Typography variant="body2" color="text.secondary">
        Mostrando {tecnicosVisibles.length} de {totalTecnicos} técnicos encontrados.
      </Typography>
      <AvisoCarga cargando={cargando} error={errorCarga} />

      {tecnicosVisibles.length === 0 ? (
        !cargando && <Typography color="text.secondary">No hay técnicos que coincidan con los filtros.</Typography>
      ) : (
        <>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
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
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
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

          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          <Card sx={{ width: '100%', alignSelf: 'flex-start' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
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
                startIcon={<VisibilityOutlinedIcon />}
                onClick={() => establecerFichaAbierta(true)}
                sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' }, minWidth: { sm: 174 } }}
              >
                Ver ficha completa
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<LocationOnIcon />}
                onClick={() => establecerTecnicoEnMapa(tecnico.id)}
                sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
              >
                Ubicar en mapa
              </Button>
            </Stack>

            <Divider sx={{ my: 2.5 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Stack spacing={0.5} sx={{ flex: 1, p: 1.5, borderRadius: 1.5, backgroundColor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary">DNI</Typography>
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
          </CardContent>
          </Card>
          <FichaDetalle
            abierto={fichaAbierta}
            alCerrar={() => establecerFichaAbierta(false)}
            titulo={tecnico.nombre}
            subtitulo={`@${tecnico.usuario}`}
            chips={[
              { label: 'Técnico', color: 'primary', variant: 'outlined' },
              { label: tecnico.estado, color: colorEstado[tecnico.estado] },
            ]}
            secciones={seccionesFicha}
            acciones={<Button onClick={() => establecerFichaAbierta(false)}>Cerrar</Button>}
          />
          {tecnicoEnMapa && <MapaTecnicos tecnicos={tecnicosVisibles} tecnicoId={tecnicoEnMapa} />}
          </Stack>
          </Stack>
        </>
      )}
    </Stack>
  );
}

export default Tecnicos;