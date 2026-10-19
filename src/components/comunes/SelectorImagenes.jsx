import { useEffect, useMemo } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';

const TIPOS_ACEPTADOS = 'image/jpeg,image/png,image/webp';

function SelectorImagenes({ archivos, alCambiar, maximo, requeridas, deshabilitado = false }) {
  const vistasPrevias = useMemo(() => archivos.map((archivo) => URL.createObjectURL(archivo)), [archivos]);
  useEffect(() => () => vistasPrevias.forEach((url) => URL.revokeObjectURL(url)), [vistasPrevias]);

  const agregar = (evento) => {
    const nuevas = Array.from(evento.target.files || []);
    evento.target.value = '';
    alCambiar([...archivos, ...nuevas].slice(0, maximo));
  };
  const quitar = (indice) => alCambiar(archivos.filter((_, posicion) => posicion !== indice));

  const completo = archivos.length >= maximo;
  const cantidadCorrecta = requeridas ? archivos.length === requeridas : archivos.length > 0;

  return (
    <Stack spacing={1.25}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        {}
        <Button component="label" variant="outlined" startIcon={<PhotoCameraOutlinedIcon />} disabled={deshabilitado || completo}>
          Usar la cámara
          <input hidden type="file" accept={TIPOS_ACEPTADOS} capture="environment" onChange={agregar} />
        </Button>
        <Button component="label" variant="outlined" startIcon={<AddPhotoAlternateOutlinedIcon />} disabled={deshabilitado || completo}>
          Elegir de la galería
          <input hidden type="file" accept={TIPOS_ACEPTADOS} multiple onChange={agregar} />
        </Button>
      </Stack>
      <Typography variant="body2" color={cantidadCorrecta ? 'success.main' : 'text.secondary'}>
        {requeridas
          ? `${archivos.length} de ${requeridas} imágenes requeridas`
          : `${archivos.length} de ${maximo} imágenes`}
        {' · JPG, PNG o WebP'}
      </Typography>
      {vistasPrevias.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))', gap: 1 }}>
          {vistasPrevias.map((url, indice) => (
            <Box key={url} sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={url}
                alt={`Imagen seleccionada ${indice + 1}`}
                sx={{ display: 'block', width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 1.5, border: 1, borderColor: 'divider' }}
              />
              <IconButton
                size="small"
                onClick={() => quitar(indice)}
                disabled={deshabilitado}
                aria-label={`Quitar imagen ${indice + 1}`}
                sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.paper' } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Stack>
  );
}

export default SelectorImagenes;
