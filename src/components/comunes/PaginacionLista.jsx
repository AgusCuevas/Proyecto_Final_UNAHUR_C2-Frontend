import { Pagination, Stack, Typography, useMediaQuery } from '@mui/material';
import SelectorBuscable from './SelectorBuscable.jsx';

const OPCIONES_RESULTADOS_POR_PAGINA = [10, 15, 20, 30, 50];

// compacta: para columnas angostas (por ejemplo, la lista de técnicos al costado de la ficha).
export default function PaginacionLista({
  pagina,
  total,
  resultadosPorPagina,
  establecerPagina,
  establecerResultadosPorPagina,
  compacta = false,
}) {
  const cantidadPaginas = Math.max(1, Math.ceil(total / resultadosPorPagina));
  const esCelular = useMediaQuery((tema) => tema.breakpoints.down('sm'));
  const chica = compacta || esCelular;

  return (
    <Stack
      direction="row"
      useFlexGap
      sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'center', mt: 2 }}
    >
      <Pagination
        count={cantidadPaginas}
        page={Math.min(pagina, cantidadPaginas)}
        onChange={(_, nuevaPagina) => establecerPagina(nuevaPagina)}
        color="primary"
        size={chica ? 'small' : 'medium'}
        siblingCount={chica ? 0 : 1}
        // Los números y las flechas quedan siempre en la misma fila.
        sx={{ '& .MuiPagination-ul': { flexWrap: 'nowrap' } }}
      />
      <SelectorBuscable
        label="Por página"
        size="small"
        sinBorrar
        placeholder=""
        sx={{ width: 130 }}
        opciones={OPCIONES_RESULTADOS_POR_PAGINA.map((id) => ({ id }))}
        valor={resultadosPorPagina}
        alCambiar={(cantidad) => {
          establecerResultadosPorPagina(Number(cantidad));
          establecerPagina(1);
        }}
        etiqueta={(opcion) => String(opcion.id)}
      />
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        Página {Math.min(pagina, cantidadPaginas)} de {cantidadPaginas} · {total} resultados
      </Typography>
    </Stack>
  );
}
