import { useState } from 'react';
import { Dialog, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

// Popup con un botón para agrandarlo a pantalla completa y volver al tamaño normal. Recibe lo
// mismo que el Dialog de MUI. Al cerrarse vuelve a su tamaño normal.
// - estirar: en pantalla completa el contenido ocupa todo el ancho (fichas y fotos). Sin estirar,
//   queda centrado con el ancho de "maxWidth" (formularios).
// - botonSx: para correr el botón cuando el popup ya tiene una X para cerrar en esa esquina.
// En celular no se muestra el botón. Mientras está agrandado, el popup lleva la clase
// "maximizado", que el contenido puede usar para aprovechar el espacio.
function DialogoMaximizable({ children, fullScreen = false, maxWidth = 'sm', estirar = false, botonSx, ...resto }) {
  const [maximizado, establecerMaximizado] = useState(false);
  const esCelular = useMediaQuery((tema) => tema.breakpoints.down('sm'));
  const conBoton = !fullScreen && !esCelular;
  const agrandado = conBoton && maximizado;

  return (
    <Dialog
      {...resto}
      maxWidth={maxWidth}
      fullScreen={fullScreen || agrandado}
      slotProps={{
        transition: { onExited: () => establecerMaximizado(false) },
        paper: {
          className: agrandado ? 'maximizado' : undefined,
          'data-testid': 'dialogo',
          sx: agrandado && !estirar
            ? (tema) => ({
              '& > :not(.boton-maximizar)': { width: '100%', maxWidth: tema.breakpoints.values[maxWidth], alignSelf: 'center' },
            })
            : undefined,
        },
      }}
    >
      {conBoton && (
        <Tooltip title={agrandado ? 'Volver al tamaño normal' : 'Pantalla completa'}>
          <IconButton
            className="boton-maximizar"
            data-testid="boton-maximizar"
            onClick={() => establecerMaximizado((actual) => !actual)}
            aria-label={agrandado ? 'Volver al tamaño normal' : 'Ver en pantalla completa'}
            sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1, ...botonSx }}
          >
            {agrandado ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
      )}
      {children}
    </Dialog>
  );
}

export default DialogoMaximizable;
