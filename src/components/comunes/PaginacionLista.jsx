import { Pagination, Stack, Typography } from '@mui/material';
import SelectorBuscable from './SelectorBuscable.jsx';

const OPCIONES_RESULTADOS_POR_PAGINA = [10, 15, 20, 30, 50];

export default function PaginacionLista({
  pagina,
  total,
  resultadosPorPagina,
  establecerPagina,
  establecerResultadosPorPagina,
}) {
  const cantidadPaginas = Math.max(1, Math.ceil(total / resultadosPorPagina));

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: 'center', justifyContent: 'center', mt: 2 }}
    >
      <Pagination
        count={cantidadPaginas}
        page={Math.min(pagina, cantidadPaginas)}
        onChange={(_, nuevaPagina) => establecerPagina(nuevaPagina)}
        color="primary"
        siblingCount={1}
      />
      <SelectorBuscable
        label="Por página"
        size="small"
        sinBorrar
        placeholder=""
        sx={{ width: 150 }}
        opciones={OPCIONES_RESULTADOS_POR_PAGINA.map((id) => ({ id }))}
        valor={resultadosPorPagina}
        alCambiar={(cantidad) => {
          establecerResultadosPorPagina(Number(cantidad));
          establecerPagina(1);
        }}
        etiqueta={(opcion) => String(opcion.id)}
      />
      <Typography variant="body2" color="text.secondary">
        Página {Math.min(pagina, cantidadPaginas)} de {cantidadPaginas} · {total} resultados
      </Typography>
    </Stack>
  );
}
