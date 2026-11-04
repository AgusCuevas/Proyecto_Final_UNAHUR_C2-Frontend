import {
  Autocomplete, IconButton, InputAdornment, MenuItem, Paper, Stack, TextField, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  OPERADORES, esFecha, filtroCompleto, filtroInicial, valorInicial,
} from './formatoReportes.js';

const campoFecha = { inputLabel: { shrink: true } };

// Una condición del reporte: [columna] [operador] [valor]. El control del valor cambia según el
// tipo de la columna: lista desplegable, texto, número, días o calendario.
export default function EditorFiltro({
  filtro, columnas, opciones, alCambiar, alQuitar,
}) {
  const columna = columnas.find((item) => item.campo === filtro.campo);
  const cambiarValor = (valor) => alCambiar({ ...filtro, valor });
  const cambiarExtremo = (indice, valor) => {
    const actual = Array.isArray(filtro.valor) ? [...filtro.valor] : ['', ''];
    actual[indice] = valor;
    cambiarValor(actual);
  };

  let control = null;
  const { operador } = filtro;
  if (['esUnoDe', 'noEsNingunoDe'].includes(operador)) {
    control = (
      <Autocomplete
        multiple
        size="small"
        options={opciones || []}
        value={Array.isArray(filtro.valor) ? filtro.valor : []}
        onChange={(_, valores) => cambiarValor(valores)}
        noOptionsText="No hay valores para elegir"
        renderInput={(parametros) => <TextField {...parametros} label="Elegí uno o más" />}
      />
    );
  } else if (['contiene', 'esIgualA'].includes(operador)) {
    control = <TextField size="small" label="Texto" value={filtro.valor ?? ''} onChange={(evento) => cambiarValor(evento.target.value)} />;
  } else if (['igual', 'mayor', 'menor'].includes(operador)) {
    control = <TextField size="small" type="number" label="Número" value={filtro.valor ?? ''} onChange={(evento) => cambiarValor(evento.target.value)} />;
  } else if (operador === 'ultimosDias') {
    control = (
      <TextField
        size="small"
        type="number"
        label="Cantidad de días"
        value={filtro.valor ?? ''}
        onChange={(evento) => cambiarValor(evento.target.value)}
        slotProps={{ htmlInput: { min: 1 }, input: { endAdornment: <InputAdornment position="end">días</InputAdornment> } }}
      />
    );
  } else if (['antes', 'despues'].includes(operador)) {
    control = <TextField size="small" type="date" label="Fecha" value={filtro.valor ?? ''} onChange={(evento) => cambiarValor(evento.target.value)} slotProps={campoFecha} />;
  } else if (operador === 'entre') {
    const fecha = esFecha(columna?.tipo);
    const [desde = '', hasta = ''] = Array.isArray(filtro.valor) ? filtro.valor : [];
    control = (
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <TextField size="small" fullWidth type={fecha ? 'date' : 'number'} label="Desde" value={desde} onChange={(evento) => cambiarExtremo(0, evento.target.value)} slotProps={fecha ? campoFecha : undefined} />
        <Typography color="text.secondary">y</Typography>
        <TextField size="small" fullWidth type={fecha ? 'date' : 'number'} label="Hasta" value={hasta} onChange={(evento) => cambiarExtremo(1, evento.target.value)} slotProps={fecha ? campoFecha : undefined} />
      </Stack>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <TextField
            select
            size="small"
            fullWidth
            label="Columna"
            value={filtro.campo}
            onChange={(evento) => alCambiar(filtroInicial(columnas.find((item) => item.campo === evento.target.value)))}
          >
            {columnas.map((item) => <MenuItem key={item.campo} value={item.campo}>{item.etiqueta}</MenuItem>)}
          </TextField>
          <IconButton aria-label="Quitar condición" onClick={alQuitar} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
        <TextField
          select
          size="small"
          label="Condición"
          value={operador}
          onChange={(evento) => {
            const nuevo = evento.target.value;
            const valor = valorInicial(nuevo);
            alCambiar(valor === undefined ? { campo: filtro.campo, operador: nuevo } : { campo: filtro.campo, operador: nuevo, valor });
          }}
        >
          {(columna?.operadores || []).map((item) => <MenuItem key={item} value={item}>{OPERADORES[item] || item}</MenuItem>)}
        </TextField>
        {control}
        {columna && !filtroCompleto(filtro, columna) && (
          <Typography variant="caption" color="warning.main">Completá el valor para que se aplique esta condición.</Typography>
        )}
      </Stack>
    </Paper>
  );
}
