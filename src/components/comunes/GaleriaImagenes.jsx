import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import { imagenesApi } from '../../services/api.js';

function GaleriaImagenes({ ids = [], descripcion = 'Imagen' }) {
  const [estado, establecerEstado] = useState({ imagenes: [], cargando: ids.length > 0, error: '' });
  const [indiceAbierto, establecerIndiceAbierto] = useState(null);
  const clave = ids.join(',');

  useEffect(() => {
    if (!clave) return undefined;
    let vigente = true;
    imagenesApi.obtener(clave.split(','))
      .then((imagenes) => { if (vigente) establecerEstado({ imagenes, cargando: false, error: '' }); })
      .catch(() => {
        if (vigente) establecerEstado({ imagenes: [], cargando: false, error: 'No se pudieron cargar las imágenes.' });
      });
    return () => { vigente = false; };
  }, [clave]);

  if (!ids.length) return null;
  if (estado.error) return <Alert severity="warning">{estado.error}</Alert>;

  const { imagenes } = estado;
  const total = imagenes.length;
  const mover = (paso) => establecerIndiceAbierto((actual) => Math.min(total - 1, Math.max(0, actual + paso)));

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 1 }}>
        {estado.cargando
          ? ids.map((id) => (
            <Skeleton key={id} variant="rectangular" sx={{ width: '100%', height: 'auto', aspectRatio: '1', borderRadius: 1.5 }} />
          ))
          : imagenes.map((imagen, indice) => (
            <Box
              key={imagen.id}
              component="button"
              type="button"
              onClick={() => establecerIndiceAbierto(indice)}
              aria-label={`Ampliar ${descripcion.toLowerCase()} ${indice + 1} de ${total}`}
              sx={{
                p: 0,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1.5,
                overflow: 'hidden',
                cursor: 'zoom-in',
                bgcolor: 'transparent',
                '&:hover, &:focus-visible': { borderColor: 'primary.main', outline: 'none' },
              }}
            >
              <Box
                component="img"
                src={imagen.url}
                alt={`${descripcion} ${indice + 1}`}
                sx={{ display: 'block', width: '100%', aspectRatio: '1', objectFit: 'cover' }}
              />
            </Box>
          ))}
      </Box>

      <Dialog
        open={indiceAbierto !== null}
        onClose={() => establecerIndiceAbierto(null)}
        fullWidth
        maxWidth="lg"
        onKeyDown={(evento) => {
          if (evento.key === 'ArrowLeft') mover(-1);
          if (evento.key === 'ArrowRight') mover(1);
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1.5 }}>
          <Typography sx={{ fontWeight: 700 }}>
            {descripcion} · {indiceAbierto !== null ? indiceAbierto + 1 : ''} de {total}
          </Typography>
          <IconButton onClick={() => establecerIndiceAbierto(null)} aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        </Stack>
        <DialogContent sx={{ p: { xs: 1, sm: 2 } }}>
          {indiceAbierto !== null && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
              <IconButton onClick={() => mover(-1)} disabled={indiceAbierto === 0} aria-label="Imagen anterior">
                <ChevronLeftIcon />
              </IconButton>
              <Box
                component="img"
                src={imagenes[indiceAbierto].url}
                alt={`${descripcion} ${indiceAbierto + 1} de ${total}`}
                sx={{ display: 'block', maxWidth: 'calc(100% - 96px)', maxHeight: '75vh', objectFit: 'contain' }}
              />
              <IconButton onClick={() => mover(1)} disabled={indiceAbierto === total - 1} aria-label="Imagen siguiente">
                <ChevronRightIcon />
              </IconButton>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GaleriaImagenes;
