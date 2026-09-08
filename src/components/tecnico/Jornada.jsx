import { Paper, Stack, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

function Jornada() {
  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <AccessTimeIcon color="primary" fontSize="large" />
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Jornada de trabajo</Typography>
          <Typography color="text.secondary">Consulta el resumen de tu jornada actual.</Typography>
          <Typography variant="body2">Estado: Jornada activa</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default Jornada;
