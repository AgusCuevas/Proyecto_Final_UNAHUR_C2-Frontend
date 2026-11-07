import {
  Box, Button, Checkbox, Divider, Drawer, FormControlLabel, IconButton, Stack, Switch, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditorFiltro from './EditorFiltro.jsx';
import {
  CALCULOS, esAgrupable, esFecha, filtroInicial, sentidos,
} from './formatoReportes.js';
import SelectorBuscable from '../comunes/SelectorBuscable.jsx';

function Seccion({ titulo, ayuda, children }) {
  return (
    <Stack spacing={1.25}>
      <Box>
        <Typography variant="overline" sx={{ fontWeight: 800, lineHeight: 1.6 }}>{titulo}</Typography>
        {ayuda && <Typography variant="body2" color="text.secondary">{ayuda}</Typography>}
      </Box>
      {children}
    </Stack>
  );
}

// Panel lateral para personalizar el reporte. Cada cambio se ve enseguida en el resultado.
export default function PanelPersonalizar({
  abierto, cerrar, fuentes, fuente, definicion, opciones, alCambiar, alCambiarFuente,
}) {
  const columnas = fuente.columnas;
  const elegidas = new Set(definicion.columnas);
  const agrupables = columnas.filter((columna) => esAgrupable(columna.tipo));
  const numericas = columnas.filter((columna) => columna.tipo === 'numero');
  const columnaOrden = columnas.find((columna) => columna.campo === definicion.orden?.campo);
  const cambiar = (cambios) => alCambiar({ ...definicion, ...cambios });

  // Las columnas se muestran siempre en el orden del catálogo.
  const alternarColumna = (campo) => {
    const nuevas = new Set(elegidas);
    if (nuevas.has(campo)) nuevas.delete(campo); else nuevas.add(campo);
    if (!nuevas.size) return;
    cambiar({ columnas: columnas.filter((columna) => nuevas.has(columna.campo)).map((columna) => columna.campo) });
  };

  const cambiarFiltro = (indice, filtro) => cambiar({ filtros: definicion.filtros.map((actual, posicion) => (posicion === indice ? filtro : actual)) });
  const quitarFiltro = (indice) => cambiar({ filtros: definicion.filtros.filter((_, posicion) => posicion !== indice) });

  const activarResumen = (activo) => {
    if (!activo) return cambiar({ agrupacion: null });
    const por = agrupables.find((columna) => columna.tipo === 'lista') || agrupables[0];
    return cambiar({ agrupacion: { por: por.campo, calculo: 'cantidad' } });
  };
  const cambiarCalculo = (calculo) => cambiar({
    agrupacion: calculo === 'cantidad'
      ? { por: definicion.agrupacion.por, calculo }
      : { por: definicion.agrupacion.por, calculo, campo: definicion.agrupacion.campo || numericas[0]?.campo },
  });

  return (
    // Por encima de la barra superior de la aplicación (que está sobre los menús laterales).
    <Drawer anchor="right" open={abierto} onClose={cerrar} sx={{ zIndex: (tema) => tema.zIndex.modal }}>
      <Box sx={{ width: { xs: '100vw', sm: 440 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Personalizar</Typography>
          <IconButton aria-label="Cerrar" onClick={cerrar}><CloseIcon /></IconButton>
        </Stack>
        <Divider />
        <Stack spacing={3} sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
          <Seccion titulo="Qué datos">
            <SelectorBuscable
              label="Datos"
              size="small"
              sinBorrar
              opciones={fuentes.map((item) => ({ id: item.clave, nombre: item.etiqueta, descripcion: item.descripcion }))}
              valor={fuente.clave}
              alCambiar={alCambiarFuente}
              etiqueta={(opcion) => opcion.nombre}
              detalle={(opcion) => opcion.descripcion}
            />
          </Seccion>

          <Seccion titulo="Filtrar" ayuda="Solo se muestran los registros que cumplen todas las condiciones.">
            {definicion.filtros.map((filtro, indice) => (
              <EditorFiltro
                key={indice}
                filtro={filtro}
                columnas={columnas}
                opciones={columnas.find((columna) => columna.campo === filtro.campo)?.opciones || opciones?.[filtro.campo]}
                alCambiar={(nuevo) => cambiarFiltro(indice, nuevo)}
                alQuitar={() => quitarFiltro(indice)}
              />
            ))}
            <Button startIcon={<AddIcon />} sx={{ alignSelf: 'flex-start' }} onClick={() => cambiar({ filtros: [...definicion.filtros, filtroInicial(columnas.find((columna) => columna.tipo === 'lista') || columnas[0])] })}>
              Agregar condición
            </Button>
          </Seccion>

          <Seccion titulo="Resumen" ayuda="Agrupá los resultados para ver totales, por ejemplo cuántos reclamos tiene cada técnico.">
            <FormControlLabel
              control={<Switch checked={Boolean(definicion.agrupacion)} onChange={(evento) => activarResumen(evento.target.checked)} />}
              label="Ver como resumen"
            />
            {definicion.agrupacion && (
              <Stack spacing={1.5}>
                <SelectorBuscable
                  label="Agrupar por"
                  size="small"
                  sinBorrar
                  opciones={agrupables.map((columna) => ({ id: columna.campo, nombre: `${columna.etiqueta}${esFecha(columna.tipo) ? ' (por mes)' : ''}` }))}
                  valor={definicion.agrupacion.por}
                  alCambiar={(por) => cambiar({ agrupacion: { ...definicion.agrupacion, por } })}
                  etiqueta={(opcion) => opcion.nombre}
                />
                <SelectorBuscable
                  label="Calcular"
                  size="small"
                  sinBorrar
                  opciones={Object.entries(CALCULOS)
                    .filter(([calculo]) => calculo === 'cantidad' || numericas.length)
                    .map(([calculo, etiqueta]) => ({ id: calculo, nombre: etiqueta }))}
                  valor={definicion.agrupacion.calculo}
                  alCambiar={cambiarCalculo}
                  etiqueta={(opcion) => opcion.nombre}
                />
                {definicion.agrupacion.calculo !== 'cantidad' && (
                  <SelectorBuscable
                    label="De la columna"
                    size="small"
                    sinBorrar
                    opciones={numericas.map((columna) => ({ id: columna.campo, nombre: columna.etiqueta }))}
                    valor={definicion.agrupacion.campo || ''}
                    alCambiar={(campo) => cambiar({ agrupacion: { ...definicion.agrupacion, campo } })}
                    etiqueta={(opcion) => opcion.nombre}
                  />
                )}
              </Stack>
            )}
          </Seccion>

          <Seccion titulo="Ordenar" ayuda={definicion.agrupacion ? 'En el resumen, los grupos se ordenan de mayor a menor (o por mes).' : undefined}>
            <Stack direction="row" spacing={1}>
              <SelectorBuscable
                label="Ordenar por"
                size="small"
                sinBorrar
                disabled={Boolean(definicion.agrupacion)}
                opciones={[{ id: '', nombre: 'Sin orden' }, ...columnas.map((columna) => ({ id: columna.campo, nombre: columna.etiqueta }))]}
                valor={definicion.orden?.campo || ''}
                alCambiar={(campo) => {
                  const columna = columnas.find((item) => item.campo === campo);
                  cambiar({ orden: columna ? { campo: columna.campo, sentido: esFecha(columna.tipo) || columna.tipo === 'numero' ? 'desc' : 'asc' } : null });
                }}
                etiqueta={(opcion) => opcion.nombre}
              />
              {columnaOrden && (
                <SelectorBuscable
                  label="Sentido"
                  size="small"
                  sinBorrar
                  disabled={Boolean(definicion.agrupacion)}
                  opciones={Object.entries(sentidos(columnaOrden.tipo)).map(([sentido, etiqueta]) => ({ id: sentido, nombre: etiqueta }))}
                  valor={definicion.orden.sentido}
                  alCambiar={(sentido) => cambiar({ orden: { ...definicion.orden, sentido } })}
                  etiqueta={(opcion) => opcion.nombre}
                />
              )}
            </Stack>
          </Seccion>

          <Seccion titulo="Columnas" ayuda={definicion.agrupacion ? 'Se usan al ver la lista y en el detalle de cada grupo.' : 'Las que se muestran en la tabla y en el CSV.'}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              {columnas.map((columna) => (
                <FormControlLabel
                  key={columna.campo}
                  control={<Checkbox size="small" checked={elegidas.has(columna.campo)} onChange={() => alternarColumna(columna.campo)} disabled={elegidas.has(columna.campo) && elegidas.size === 1} />}
                  label={<Typography variant="body2">{columna.etiqueta}</Typography>}
                />
              ))}
            </Box>
          </Seccion>
        </Stack>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Button variant="contained" fullWidth onClick={cerrar}>Listo</Button>
        </Box>
      </Box>
    </Drawer>
  );
}
