import { FormControl, InputLabel, MenuItem, Pagination, Select, Stack, Typography } from '@mui/material';

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
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="resultados-por-pagina-label">Por página</InputLabel>
        <Select
          labelId="resultados-por-pagina-label"
          value={resultadosPorPagina}
          label="Por página"
          onChange={(evento) => {
            establecerResultadosPorPagina(Number(evento.target.value));
            establecerPagina(1);
          }}
        >
          {OPCIONES_RESULTADOS_POR_PAGINA.map((opcion) => (
            <MenuItem key={opcion} value={opcion}>{opcion}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <Typography variant="body2" color="text.secondary">
        Página {Math.min(pagina, cantidadPaginas)} de {cantidadPaginas} · {total} resultados
      </Typography>
    </Stack>
  );
}
