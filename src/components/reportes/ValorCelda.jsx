import { Chip, Typography } from '@mui/material';
import { formatearValor } from './formatoReportes.js';

// Mismos colores de estado que el resto de la aplicación.
const COLORES = {
  estado: {
    Abierto: 'warning', Asignado: 'info', 'En progreso': 'secondary', Bloqueado: 'error', Finalizado: 'success', Activa: 'success',
  },
  prioridad: { Urgente: 'error', Alta: 'warning' },
};

// Valor de una celda: estados y prioridades como etiquetas de color; el resto, como texto.
export default function ValorCelda({ valor, columna }) {
  const color = COLORES[columna.campo]?.[valor];
  if (color) return <Chip size="small" color={color} label={valor} />;
  const texto = formatearValor(valor, columna.tipo);
  if (texto === '—') return <Typography component="span" color="text.disabled">—</Typography>;
  return texto;
}
