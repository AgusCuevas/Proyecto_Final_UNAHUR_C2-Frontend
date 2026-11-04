import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Divider, Drawer, IconButton, Stack, TextField, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { reclamosApi, reportesApi } from '../../services/api.js';
import ValorCelda from './ValorCelda.jsx';

// Notas del coordinador que tiene hoy el reclamo.
async function notasActuales(reclamoId) {
  const respuesta = await reportesApi.vistaPrevia({
    definicion: {
      fuente: 'reclamos', columnas: ['id'], filtros: [{ campo: 'id', operador: 'igual', valor: reclamoId }],
    },
  });
  return respuesta.datos?.[0]?.notasCoordinador || '';
}

// Detalle de un registro del reporte, sin salir del módulo: todas las columnas que el usuario
// puede ver, con sus nombres. En los reclamos se puede agregar una nota para el técnico.
export default function DetalleRegistro({
  fila, fuente, columnas, cerrar, alActualizar,
}) {
  const [nota, establecerNota] = useState('');
  const [notas, establecerNotas] = useState(fila?.notasCoordinador || '');
  const [guardando, establecerGuardando] = useState(false);
  const [mensaje, establecerMensaje] = useState(null);
  const esReclamo = Boolean(fuente.clave === 'reclamos' && fila?.id);

  // Al abrir, muestra las notas actuales (las de la tabla pueden ser de hace un rato).
  useEffect(() => {
    if (!esReclamo) return undefined;
    let vigente = true;
    notasActuales(fila.id).then((actuales) => { if (vigente) establecerNotas(actuales); }).catch(() => undefined);
    return () => { vigente = false; };
  }, [esReclamo, fila?.id]);

  if (!fila) return null;
  const titulo = fuente.sustantivo.singular.charAt(0).toUpperCase() + fuente.sustantivo.singular.slice(1);

  // La nota se agrega a las que tiene el reclamo en este momento (no las reemplaza): se leen
  // justo antes de guardar, por si alguien agregó otra desde que se abrió el reporte.
  const agregarNota = async () => {
    const texto = nota.trim();
    if (!texto) return;
    establecerGuardando(true);
    establecerMensaje(null);
    try {
      const actuales = await notasActuales(fila.id);
      const nuevas = actuales ? `${actuales}\n${texto}` : texto;
      await reclamosApi.actualizarEstado(fila.id, { notasCoordinador: nuevas });
      establecerNotas(nuevas);
      establecerNota('');
      establecerMensaje({ tipo: 'success', texto: 'Nota agregada.' });
      alActualizar();
    } catch (causa) {
      establecerMensaje({ tipo: 'error', texto: causa?.response?.data?.mensaje || 'No se pudo guardar la nota.' });
    } finally {
      establecerGuardando(false);
    }
  };

  return (
    <Drawer anchor="right" open onClose={cerrar} sx={{ zIndex: (tema) => tema.zIndex.modal }}>
      <Box sx={{ width: { xs: '100vw', sm: 420 } }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{titulo}{fila.id ? ` N.º ${fila.id}` : ''}</Typography>
          <IconButton aria-label="Cerrar" onClick={cerrar}><CloseIcon /></IconButton>
        </Stack>
        <Divider />
        <Stack spacing={1.5} sx={{ p: 2.5 }}>
          {columnas.filter((columna) => columna.campo !== 'notasCoordinador' || !esReclamo).map((columna) => (
            <Box key={columna.campo}>
              <Typography variant="caption" color="text.secondary">{columna.etiqueta}</Typography>
              <Typography component="div" sx={{ whiteSpace: 'pre-line' }}><ValorCelda valor={fila[columna.campo]} columna={columna} /></Typography>
            </Box>
          ))}
          {esReclamo && (
            <>
              <Divider />
              <Box>
                <Typography variant="caption" color="text.secondary">Notas del coordinador</Typography>
                <Typography sx={{ whiteSpace: 'pre-line' }} color={notas ? 'text.primary' : 'text.disabled'}>{notas || 'Sin notas'}</Typography>
              </Box>
              <TextField
                label="Agregar una nota"
                multiline
                minRows={2}
                value={nota}
                onChange={(evento) => establecerNota(evento.target.value)}
                helperText="Se suma a las notas que ya tiene el reclamo. El técnico la ve en el detalle."
              />
              <Button variant="contained" onClick={agregarNota} disabled={guardando || !nota.trim()} sx={{ alignSelf: 'flex-start' }}>
                {guardando ? 'Guardando...' : 'Agregar nota'}
              </Button>
              {mensaje && <Alert severity={mensaje.tipo}>{mensaje.texto}</Alert>}
            </>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
}
