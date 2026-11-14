import { useRef, useState } from 'react';
import {
  Box, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MapaTecnicos from './MapaTecnicos.jsx';

const horaDe = (fecha) => new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

// Tabla de rendimiento. Con "conJornada" (panel), la última columna muestra desde qué hora está
// trabajando y, si el técnico compartió su ubicación, al tocar la fila se lo ubica en el mapa.
export function TablaRendimiento({ rendimiento, conJornada = false, seleccionadoId = null, alSeleccionar, textoSinDatos }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Técnico</TableCell>
          <TableCell>Trabajos realizados</TableCell>
          <TableCell>Horas de servicio</TableCell>
          <TableCell>{conJornada ? 'Jornada' : 'Estado'}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rendimiento.map((tecnico) => {
          const ubicable = Boolean(alSeleccionar && tecnico.ubicacion);
          return (
            <TableRow
              key={tecnico.id}
              hover={ubicable}
              selected={tecnico.id === seleccionadoId}
              onClick={ubicable ? () => alSeleccionar(tecnico) : undefined}
              onKeyDown={ubicable ? (evento) => {
                if (evento.key === 'Enter' || evento.key === ' ') alSeleccionar(tecnico);
              } : undefined}
              tabIndex={ubicable ? 0 : undefined}
              aria-label={ubicable ? `Ver a ${tecnico.nombre} en el mapa` : undefined}
              sx={{ cursor: ubicable ? 'pointer' : 'default' }}
            >
              <TableCell sx={{ fontWeight: 700 }}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  {ubicable && <LocationOnIcon fontSize="small" color="primary" />}
                  <span>{tecnico.nombre}</span>
                </Stack>
              </TableCell>
              <TableCell>{tecnico.trabajos}</TableCell>
              <TableCell>{tecnico.horas} h</TableCell>
              <TableCell>
                {conJornada ? (
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip size="small" color="success" label={`Desde las ${horaDe(tecnico.jornadaActiva.inicio)}`} />
                    {!tecnico.ubicacion && <Chip size="small" variant="outlined" label="Sin ubicación" />}
                  </Stack>
                ) : (
                  <Chip size="small" label={tecnico.activo ? 'Activo' : 'Inactivo'} color={tecnico.activo ? 'success' : 'default'} />
                )}
              </TableCell>
            </TableRow>
          );
        })}
        {rendimiento.length === 0 && textoSinDatos && (
          <TableRow>
            <TableCell colSpan={4} sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>{textoSinDatos}</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

// Mapa de técnicos y, debajo, el rendimiento de los que tienen la jornada activa. Al tocar un
// técnico de la tabla se lo ubica en el mapa. Lo usan el panel del admin y el del coordinador.
// tecnicos: la lista de GET /tecnicos (cada uno trae ubicación, jornada activa, trabajos y horas).
function RendimientoEquipo({ tecnicos }) {
  // Técnicos trabajando ahora: los que tienen la jornada activa.
  const tecnicosEnJornada = tecnicos
    .filter((tecnico) => tecnico.activo && tecnico.jornadaActiva)
    .sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es'));
  // Técnico a ubicar en el mapa; "pedido" sube en cada clic para volver a centrarlo.
  const [enfoque, establecerEnfoque] = useState({ tecnicoId: null, pedido: 0 });
  const mapa = useRef(null);
  const ubicarEnMapa = (tecnico) => {
    establecerEnfoque((actual) => ({ tecnicoId: tecnico.id, pedido: actual.pedido + 1 }));
    mapa.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      <Box ref={mapa}>
        <MapaTecnicos tecnicos={tecnicos} tecnicoId={enfoque.tecnicoId} pedidoDeEnfoque={enfoque.pedido} />
      </Box>
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Rendimiento del equipo técnico</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5, mb: 2 }}>
            Técnicos con la jornada activa: trabajos finalizados y horas registradas en jornadas cerradas.
            Tocá un técnico para verlo en el mapa.
          </Typography>
          <TablaRendimiento
            rendimiento={tecnicosEnJornada}
            conJornada
            seleccionadoId={enfoque.tecnicoId}
            alSeleccionar={ubicarEnMapa}
            textoSinDatos="Ningún técnico tiene la jornada activa en este momento."
          />
        </CardContent>
      </Card>
    </>
  );
}

export default RendimientoEquipo;
