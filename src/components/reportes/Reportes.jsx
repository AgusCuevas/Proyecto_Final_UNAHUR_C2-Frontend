import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Snackbar,
} from '@mui/material';
import { reportesApi } from '../../services/api.js';
import InicioReportes from './InicioReportes.jsx';
import ResultadoReporte from './ResultadoReporte.jsx';
import { definicionNueva } from './formatoReportes.js';

// La navegación interna del módulo usa el parámetro "reporte" de la URL
// (plantilla:<id>, guardado:<id> o nuevo), así "atrás" del navegador y recargar la página funcionan.
const PARAMETRO = 'reporte';
const leerClave = () => new URLSearchParams(window.location.search).get(PARAMETRO);

function urlCon(clave) {
  const parametros = new URLSearchParams(window.location.search);
  if (clave) parametros.set(PARAMETRO, clave); else parametros.delete(PARAMETRO);
  const consulta = parametros.toString();
  return `${window.location.pathname}${consulta ? `?${consulta}` : ''}`;
}

// Ajusta una definición guardada a las columnas que hoy puede ver el usuario (por ejemplo, un
// reporte que le compartieron con columnas que su rol no ve).
function ajustarDefinicion(definicion, fuentes) {
  const fuente = fuentes.find((item) => item.clave === definicion?.fuente);
  if (!fuente) return null;
  const campos = new Set(fuente.columnas.map((columna) => columna.campo));
  const columnas = (definicion.columnas || []).filter((campo) => campos.has(campo));
  const { orden, agrupacion } = definicion;
  return {
    fuente: fuente.clave,
    columnas: columnas.length ? columnas : fuente.columnasPorDefecto,
    filtros: (definicion.filtros || []).filter((filtro) => filtro && campos.has(filtro.campo)),
    orden: orden && campos.has(orden.campo) ? orden : fuente.ordenPorDefecto,
    agrupacion: agrupacion && campos.has(agrupacion.por) && (agrupacion.calculo === 'cantidad' || campos.has(agrupacion.campo))
      ? agrupacion : null,
  };
}

// Módulo de reportes: inicio (plantillas por tema y "Mis reportes") y resultado de un reporte.
// Todo ocurre dentro del módulo: el detalle de un registro se abre en un panel lateral.
export default function Reportes({ rolId }) {
  const [datos, establecerDatos] = useState(null);
  const [error, establecerError] = useState(false);
  const [intentos, establecerIntentos] = useState(0);
  const [clave, establecerClave] = useState(leerClave);
  const [aviso, establecerAviso] = useState(null);
  // Pestaña del inicio (Reclamos, Técnicos, Clientes, Flota o Mis reportes).
  const [pestana, establecerPestana] = useState('Reclamos');

  useEffect(() => {
    let vigente = true;
    Promise.all([reportesApi.fuentes(), reportesApi.plantillas(), reportesApi.listar()])
      .then(([{ fuentes }, plantillas, guardados]) => {
        if (vigente) {
          establecerDatos({ fuentes, plantillas, guardados });
          establecerError(false);
        }
      })
      .catch(() => { if (vigente) establecerError(true); });
    return () => { vigente = false; };
  }, [intentos]);

  useEffect(() => {
    const alNavegar = () => establecerClave(leerClave());
    window.addEventListener('popstate', alNavegar);
    return () => window.removeEventListener('popstate', alNavegar);
  }, []);

  const navegar = (nuevaClave) => {
    window.history.pushState({}, '', urlCon(nuevaClave));
    establecerClave(nuevaClave);
    window.scrollTo({ top: 0 });
  };

  if (error) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => establecerIntentos((actual) => actual + 1)}>Reintentar</Button>}>
        No se pudieron cargar los reportes. Verificá la conexión e intentá nuevamente.
      </Alert>
    );
  }
  if (!datos) return <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress /></Box>;

  const { fuentes, plantillas, guardados } = datos;
  let inicial = null;
  const [tipo, id] = (clave || '').split(':');
  if (tipo === 'plantilla') {
    const plantilla = plantillas.find((item) => item.id === id);
    const definicion = plantilla && ajustarDefinicion(plantilla.definicion, fuentes);
    if (definicion) {
      inicial = {
        definicion, nombre: plantilla.nombre, descripcion: plantilla.descripcion, origen: { tipo: 'plantilla' },
      };
    }
  } else if (tipo === 'guardado') {
    const reporte = guardados.find((item) => String(item.id) === id);
    const definicion = reporte && ajustarDefinicion(reporte.definicion, fuentes);
    if (definicion) {
      inicial = {
        definicion,
        nombre: reporte.nombre,
        descripcion: reporte.descripcion,
        origen: {
          tipo: 'guardado', id: reporte.id, puedeEditar: reporte.puedeEditar, compartidoCon: reporte.compartidoCon, autor: reporte.autor,
        },
      };
    }
  } else if (tipo === 'nuevo' && fuentes.length) {
    inicial = {
      definicion: definicionNueva(fuentes[0]), nombre: 'Nuevo reporte', origen: { tipo: 'nuevo' }, personalizar: true,
    };
  }

  const alGuardado = (reporte) => {
    establecerDatos((actual) => ({ ...actual, guardados: [reporte, ...actual.guardados.filter((item) => item.id !== reporte.id)] }));
    // Queda en la misma pantalla, pero la URL ya apunta al reporte guardado.
    window.history.replaceState({}, '', urlCon(`guardado:${reporte.id}`));
  };

  const eliminar = async (reporte) => {
    try {
      await reportesApi.eliminar(reporte.id);
      establecerDatos((actual) => ({ ...actual, guardados: actual.guardados.filter((item) => item.id !== reporte.id) }));
      establecerAviso({ tipo: 'success', texto: `Se eliminó "${reporte.nombre}".` });
    } catch (causa) {
      establecerAviso({ tipo: 'error', texto: causa?.response?.data?.mensaje || 'No se pudo eliminar el reporte.' });
    }
  };

  return (
    <>
      {inicial ? (
        <ResultadoReporte
          key={clave}
          fuentes={fuentes}
          inicial={inicial}
          rolId={rolId}
          alVolver={() => navegar(null)}
          alGuardado={alGuardado}
        />
      ) : (
        <InicioReportes
          fuentes={fuentes}
          plantillas={plantillas}
          guardados={guardados}
          pestana={pestana}
          alCambiarPestana={establecerPestana}
          alAbrirPlantilla={(plantilla) => navegar(`plantilla:${plantilla.id}`)}
          alAbrirGuardado={(reporte) => navegar(`guardado:${reporte.id}`)}
          alCrear={() => navegar('nuevo')}
          alEliminar={eliminar}
        />
      )}
      <Snackbar open={Boolean(aviso)} autoHideDuration={4000} onClose={() => establecerAviso(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {aviso ? <Alert severity={aviso.tipo} variant="filled" onClose={() => establecerAviso(null)}>{aviso.texto}</Alert> : undefined}
      </Snackbar>
    </>
  );
}
