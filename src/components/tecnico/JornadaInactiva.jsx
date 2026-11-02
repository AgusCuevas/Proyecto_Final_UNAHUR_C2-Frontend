import { useState } from 'react';
import {
  Alert, Box, Button, Chip, Paper, Stack, Typography,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useAppData } from '../../context/useAppData.js';
import { usePaginado } from '../../context/usePaginado.js';
import { reclamosApi } from '../../services/api.js';

const sinFiltros = {};

// Sin jornada activa el técnico no ve sus reclamos: solo cuántos tiene pendientes (el backend no
// le devuelve datos de clientes) y el botón para iniciar la jornada, que desbloquea todo.
export default function JornadaInactiva() {
  const { sesion, iniciarJornada } = useAppData();
  const { respuesta: resumen } = usePaginado(reclamosApi.resumen, sinFiltros);
  const [iniciando, establecerIniciando] = useState(false);
  const [error, establecerError] = useState('');
  const pendientes = (resumen?.asignados || 0) + (resumen?.enProgreso || 0);

  const iniciar = async () => {
    establecerError('');
    establecerIniciando(true);
    try {
      await iniciarJornada(sesion.usuario.id);
    } catch (causa) {
      establecerError(causa?.response?.data?.mensaje || 'No se pudo iniciar la jornada.');
      establecerIniciando(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 3, md: 5 }, textAlign: 'center', borderTop: 4, borderColor: 'warning.main' }}>
      <Stack spacing={2.5} sx={{ alignItems: 'center', maxWidth: 460, mx: 'auto' }}>
        <Box sx={{
          width: 64, height: 64, borderRadius: '50%', bgcolor: 'action.hover',
          display: 'grid', placeItems: 'center',
        }}
        >
          <LockOutlinedIcon color="warning" sx={{ fontSize: 34 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Tu jornada no está activa</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {resumen && !pendientes
              ? 'No tenés reclamos pendientes. Iniciá tu jornada cuando empieces a trabajar.'
              : 'Iniciá tu jornada para ver el detalle de tus reclamos y trabajar en ellos.'}
          </Typography>
        </Box>
        {resumen && pendientes > 0 && (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            <Chip color="info" label={`${resumen.asignados} ${resumen.asignados === 1 ? 'asignado' : 'asignados'}`} />
            {resumen.enProgreso > 0 && <Chip color="secondary" label={`${resumen.enProgreso} en curso`} />}
            {resumen.urgentes > 0 && (
              <Chip color="error" label={`${resumen.urgentes} ${resumen.urgentes === 1 ? 'urgente' : 'urgentes'}`} />
            )}
          </Stack>
        )}
        {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
        <Button variant="contained" size="large" startIcon={<PlayArrowIcon />} onClick={iniciar} disabled={iniciando}>
          {iniciando ? 'Iniciando...' : 'Iniciar jornada'}
        </Button>
      </Stack>
    </Paper>
  );
}
