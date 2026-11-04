import { useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, Tab, Tabs, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import { describirReporte } from './formatoReportes.js';

const TEMAS = [
  { tema: 'Reclamos', icono: AssignmentOutlinedIcon },
  { tema: 'Técnicos', icono: EngineeringOutlinedIcon },
  { tema: 'Clientes', icono: PeopleOutlinedIcon },
  { tema: 'Flota', icono: LocalShippingOutlinedIcon },
];

function Tarjeta({ titulo, descripcion, etiqueta, alAbrir, acciones }) {
  return (
    <Paper
      variant="outlined"
      role="button"
      tabIndex={0}
      onClick={alAbrir}
      onKeyDown={(evento) => { if (evento.key === 'Enter') alAbrir(); }}
      sx={{
        p: 2, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 0.75, height: '100%',
        transition: 'border-color .15s, box-shadow .15s', '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 700 }}>{titulo}</Typography>
        {acciones}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>{descripcion}</Typography>
      {etiqueta && <Box>{etiqueta}</Box>}
    </Paper>
  );
}

const MIS_REPORTES = 'Mis reportes';

// Inicio del módulo: una pestaña por tema con sus reportes listos para usar ("¿qué querés
// saber?") y otra con los que guardó el usuario o le compartieron.
// pestana / alCambiarPestana: la pestaña elegida vive en el módulo, así se mantiene al volver
// de un reporte.
export default function InicioReportes({
  fuentes, plantillas, guardados, pestana, alCambiarPestana, alAbrirPlantilla, alAbrirGuardado, alCrear, alEliminar,
}) {
  const [aEliminar, establecerAEliminar] = useState(null);
  const temasConPlantillas = TEMAS.filter(({ tema }) => plantillas.some((plantilla) => plantilla.tema === tema));
  const pestanas = [...temasConPlantillas.map(({ tema }) => tema), MIS_REPORTES];
  const pestanaVisible = pestanas.includes(pestana) ? pestana : pestanas[0];
  const fuentePorClave = new Map(fuentes.map((fuente) => [fuente.clave, fuente]));
  const etiquetaResumen = <Chip size="small" icon={<BarChartOutlinedIcon />} label="Resumen" variant="outlined" />;

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>¿Qué querés saber?</Typography>
          <Typography color="text.secondary">Elegí un reporte para verlo al instante. Después podés filtrarlo, personalizarlo, guardarlo y exportarlo a CSV.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={alCrear} sx={{ flexShrink: 0 }}>Crear reporte propio</Button>
      </Stack>

      <Tabs
        value={pestanaVisible}
        onChange={(_, nueva) => alCambiarPestana(nueva)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="Temas de reportes"
        sx={{ borderBottom: 1, borderColor: 'divider', mt: -1 }}
      >
        {temasConPlantillas.map(({ tema, icono: Icono }) => (
          <Tab key={tema} value={tema} icon={<Icono fontSize="small" />} iconPosition="start" label={tema} sx={{ minHeight: 48 }} />
        ))}
        <Tab
          value={MIS_REPORTES}
          icon={<BookmarkBorderOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label={`Mis reportes${guardados.length ? ` (${guardados.length})` : ''}`}
          sx={{ minHeight: 48 }}
        />
      </Tabs>

      {pestanaVisible === MIS_REPORTES ? (
        !guardados.length ? (
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography color="text.secondary">
              Todavía no guardaste reportes. Abrí cualquiera de los de las otras pestañas, personalizalo y tocá "Guardar": va a aparecer acá.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' } }}>
            {guardados.map((reporte) => {
              const fuente = fuentePorClave.get(reporte.definicion?.fuente);
              return (
                <Tarjeta
                  key={reporte.id}
                  titulo={reporte.nombre}
                  descripcion={reporte.descripcion || (fuente ? describirReporte(reporte.definicion, fuente, null) : '')}
                  alAbrir={() => alAbrirGuardado(reporte)}
                  etiqueta={(
                    <Stack direction="row" spacing={1}>
                      {reporte.autor && <Chip size="small" label={`Compartido por ${reporte.autor}`} />}
                      {reporte.esAutor && reporte.compartidoCon?.length > 0 && <Chip size="small" variant="outlined" label="Compartido" />}
                      {reporte.definicion?.agrupacion && etiquetaResumen}
                    </Stack>
                  )}
                  acciones={reporte.puedeEditar && (
                    <Tooltip title="Eliminar">
                      <IconButton size="small" aria-label={`Eliminar ${reporte.nombre}`} onClick={(evento) => { evento.stopPropagation(); establecerAEliminar(reporte); }}>
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                />
              );
            })}
          </Box>
        )
      ) : (
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' } }}>
          {plantillas.filter((plantilla) => plantilla.tema === pestanaVisible).map((plantilla) => (
            <Tarjeta
              key={plantilla.id}
              titulo={plantilla.nombre}
              descripcion={plantilla.descripcion}
              alAbrir={() => alAbrirPlantilla(plantilla)}
              etiqueta={plantilla.definicion.agrupacion ? etiquetaResumen : null}
            />
          ))}
        </Box>
      )}

      <Dialog open={Boolean(aEliminar)} onClose={() => establecerAEliminar(null)}>
        <DialogTitle>¿Eliminar el reporte?</DialogTitle>
        <DialogContent>
          <Typography>
            Se va a eliminar "{aEliminar?.nombre}"{aEliminar?.compartidoCon?.length ? ', también para las personas con las que lo compartiste' : ''}. Los datos no se borran: solo el reporte guardado.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => establecerAEliminar(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => { alEliminar(aEliminar); establecerAEliminar(null); }}>Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
