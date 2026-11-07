import { Autocomplete, Box, Checkbox, TextField, Typography } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';

// Regla de todos los desplegables de la app: se ven como máximo 6 opciones (el resto, con scroll
// o con las flechas ↑ ↓) y al escribir se filtran (sin distinguir mayúsculas ni acentos).
const OPCIONES_A_LA_VISTA = 6;
// Cantidad máxima de coincidencias que se dibujan; para encontrar otras hay que seguir escribiendo.
const MAXIMO_RESULTADOS = 50;
// Alto fijo de cada opción (una línea, o con el detalle debajo): así la lista mide justo 6.
const ALTO_OPCION = { chica: 36, normal: 44, conDetalle: 56 };

// Selector con buscador para cualquier lista desplegable.
// - opciones: lista de objetos con "id" (puede ser texto o número).
// - valor: id elegido ('' o null si no hay ninguno); con multiple, la lista de ids elegidos.
// - alCambiar recibe el id (o null) o, con multiple, la lista de ids.
// - etiqueta(opcion): texto principal; detalle(opcion): texto secundario opcional.
// - sinBorrar: sin la cruz para vaciar el campo (filtros que siempre tienen un valor, como "Todos").
// - opcionDeshabilitada(opcion): true para mostrar una opción que no se puede elegir.
// - cargando: true mientras la lista todavía no llegó del backend.
function SelectorBuscable({
  label,
  opciones,
  valor,
  alCambiar,
  etiqueta,
  detalle,
  multiple = false,
  sinBorrar = false,
  opcionDeshabilitada,
  placeholder = 'Escribí para buscar...',
  textoSinOpciones = 'No hay coincidencias',
  required = false,
  disabled = false,
  helperText,
  autoFocus = false,
  cargando = false,
  size,
  sx,
  ariaLabel,
}) {
  // createFilterOptions ya ignora mayúsculas y acentos.
  const filtrar = createFilterOptions({
    limit: MAXIMO_RESULTADOS,
    stringify: (opcion) => [etiqueta(opcion), detalle?.(opcion)].filter(Boolean).join(' '),
  });
  const mismoId = (opcion, id) => String(opcion.id) === String(id);
  const seleccion = multiple
    ? opciones.filter((opcion) => (valor || []).some((id) => mismoId(opcion, id)))
    : opciones.find((opcion) => mismoId(opcion, valor)) || null;
  const tieneDetalle = Boolean(detalle) && opciones.some((opcion) => detalle(opcion));
  const altoOpcion = tieneDetalle ? ALTO_OPCION.conDetalle : (size === 'small' ? ALTO_OPCION.chica : ALTO_OPCION.normal);

  return (
    <Autocomplete
      fullWidth
      multiple={multiple}
      disableCloseOnSelect={multiple}
      limitTags={multiple ? 2 : undefined}
      size={size}
      sx={sx}
      options={opciones}
      value={seleccion}
      onChange={(_, elegida) => alCambiar(multiple
        ? elegida.map((opcion) => opcion.id)
        : (elegida ? elegida.id : null))}
      getOptionLabel={(opcion) => String(etiqueta(opcion) ?? '')}
      // La clave de cada opción es su id: dos opciones con el mismo nombre (por ejemplo, dos
      // técnicos homónimos) no se confunden al filtrar.
      getOptionKey={(opcion) => String(opcion.id)}
      getOptionDisabled={opcionDeshabilitada}
      isOptionEqualToValue={(opcion, elegida) => mismoId(opcion, elegida.id)}
      filterOptions={filtrar}
      disableClearable={sinBorrar}
      openOnFocus
      autoHighlight
      disabled={disabled}
      noOptionsText={textoSinOpciones}
      loadingText="Cargando..."
      loading={cargando}
      clearText="Borrar"
      openText="Mostrar opciones"
      closeText="Cerrar lista"
      // La lista mide exactamente 6 opciones (sin relleno, así no asoma una séptima).
      slotProps={{ listbox: { sx: { maxHeight: OPCIONES_A_LA_VISTA * altoOpcion, py: 0 } } }}
      renderOption={({ key, ...props }, opcion, { selected }) => (
        // El alto va como estilo directo: el de MUI para las opciones tiene más prioridad que sx.
        <Box component="li" key={key} {...props} style={{ ...props.style, minHeight: altoOpcion, height: altoOpcion }} sx={{ py: 0 }}>
          {multiple && <Checkbox size="small" checked={selected} sx={{ ml: -1, mr: 0.5, p: 0.5 }} />}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: tieneDetalle ? 700 : 400 }}>{etiqueta(opcion)}</Typography>
            {detalle?.(opcion) && (
              <Typography variant="caption" color="text.secondary" noWrap component="div">{detalle(opcion)}</Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={multiple && seleccion.length ? '' : placeholder}
          required={required && !(multiple ? seleccion.length : seleccion)}
          helperText={helperText}
          autoFocus={autoFocus}
          slotProps={{
            ...params.slotProps,
            htmlInput: { ...params.slotProps.htmlInput, ...(ariaLabel ? { 'aria-label': ariaLabel } : {}) },
            inputLabel: { ...params.slotProps.inputLabel, shrink: true },
          }}
        />
      )}
    />
  );
}

export default SelectorBuscable;
