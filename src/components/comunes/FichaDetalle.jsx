import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

const iniciales = (nombre = '') => nombre
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((parte) => parte[0].toUpperCase())
  .join('');

// Popup de detalle con encabezado (avatar, nombre, chips) y secciones de campos agrupados.
// secciones: [{ titulo, icono, campos: [[etiqueta, valor, { anchoCompleto }]] }]
// aviso se muestra antes de las secciones y children después (por ejemplo, una galería).
function FichaDetalle({ abierto, alCerrar, titulo, subtitulo, icono, chips = [], secciones = [], acciones, aviso, children }) {
  const esMovil = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  return (
    <Dialog open={abierto} onClose={alCerrar} fullWidth maxWidth="sm" fullScreen={esMovil}>
      <Box
        sx={(theme) => ({
          position: 'relative',
          px: { xs: 2.5, sm: 3 },
          pt: 3,
          pb: 2.5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.18)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
          borderBottom: 1,
          borderColor: 'divider',
        })}
      >
        <IconButton onClick={alCerrar} aria-label="Cerrar" sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', pr: 4 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60, fontSize: 22, fontWeight: 800, boxShadow: 2 }}>
            {icono || iniciales(titulo)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2, overflowWrap: 'anywhere' }}>
              {titulo}
            </Typography>
            {subtitulo && (
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {subtitulo}
              </Typography>
            )}
            {chips.length > 0 && (
              <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 0.75 }}>
                {chips.map((chip) => (
                  <Chip key={chip.label} size="small" label={chip.label} color={chip.color || 'default'} variant={chip.variant || 'filled'} />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Box>

      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5 }}>
        <Stack spacing={2.5}>
          {aviso}
          {secciones.filter((seccion) => seccion.campos.length > 0).map((seccion) => (
            <Box key={seccion.titulo}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                {seccion.icono}
                <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.08em', lineHeight: 1.5 }}>
                  {seccion.titulo}
                </Typography>
              </Stack>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  backgroundColor: 'action.hover',
                }}
              >
                {seccion.campos.map(([etiqueta, valor, opciones]) => {
                  const vacio = valor === undefined || valor === null || valor === '';
                  return (
                    <Box key={etiqueta} sx={{ minWidth: 0, gridColumn: opciones?.anchoCompleto ? '1 / -1' : 'auto' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {etiqueta}
                      </Typography>
                      <Typography
                        sx={{ fontWeight: vacio ? 400 : 600, overflowWrap: 'anywhere' }}
                        color={vacio ? 'text.disabled' : 'text.primary'}
                      >
                        {vacio ? 'No informado' : valor}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
          {children}
        </Stack>
      </DialogContent>

      {acciones && (
        <DialogActions sx={{ px: { xs: 2.5, sm: 3 }, py: 2, borderTop: 1, borderColor: 'divider' }}>
          {acciones}
        </DialogActions>
      )}
    </Dialog>
  );
}

export default FichaDetalle;
