import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';

// Cantidad máxima de coincidencias que se dibujan; para encontrar otras hay que seguir escribiendo.
const MAXIMO_RESULTADOS = 50;
// Alto de la lista desplegable: unas 6 opciones a la vista, el resto con scroll o flechas ↑ ↓.
const ALTO_LISTA = 6 * 52;

// Selector con buscador: al escribir filtra las opciones (sin distinguir mayúsculas ni acentos).
// - opciones: lista de objetos con "id".
// - valor: id seleccionado ('' o null si no hay ninguno). alCambiar recibe el id o null.
// - etiqueta(opcion): texto principal; detalle(opcion): texto secundario opcional.
// - cargando: true mientras la lista todavía no llegó del backend.
function SelectorBuscable({
  label,
  opciones,
  valor,
  alCambiar,
  etiqueta,
  detalle,
  placeholder = 'Escribí para buscar...',
  textoSinOpciones = 'No hay coincidencias',
  required = false,
  disabled = false,
  helperText,
  autoFocus = false,
  cargando = false,
}) {
  const filtrar = createFilterOptions({
    limit: MAXIMO_RESULTADOS,
    stringify: (opcion) => [etiqueta(opcion), detalle?.(opcion)].filter(Boolean).join(' '),
  });
  const seleccionada = opciones.find((opcion) => String(opcion.id) === String(valor)) || null;

  return (
    <Autocomplete
      fullWidth
      options={opciones}
      value={seleccionada}
      onChange={(_, opcion) => alCambiar(opcion ? opcion.id : null)}
      getOptionLabel={etiqueta}
      isOptionEqualToValue={(opcion, elegida) => opcion.id === elegida.id}
      filterOptions={filtrar}
      disabled={disabled}
      noOptionsText={textoSinOpciones}
      loadingText="Cargando..."
      loading={cargando}
      clearText="Borrar"
      openText="Mostrar opciones"
      closeText="Cerrar lista"
      slotProps={{ listbox: { sx: { maxHeight: ALTO_LISTA } } }}
      renderOption={({ key, ...props }, opcion) => (
        <Box component="li" key={key} {...props}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>{etiqueta(opcion)}</Typography>
            {detalle?.(opcion) && (
              <Typography variant="caption" color="text.secondary">{detalle(opcion)}</Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          helperText={helperText}
          autoFocus={autoFocus}
        />
      )}
    />
  );
}

export default SelectorBuscable;
