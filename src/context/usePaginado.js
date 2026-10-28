import { useCallback, useEffect, useState } from 'react';
import { useAppData } from './useAppData.js';

const sinDatos = [];

// Pide al backend UNA página de un listado, con sus filtros.
// - pedir: función de api.js que recibe los filtros (por ejemplo clientesApi.pagina).
// - filtros: { pagina, limite, buscar, estado, ... }. Si cambian, se pide la página de nuevo.
// Después de cualquier cambio en los datos (crear, editar, asignar...) vuelve a pedir la página.
// Mientras llega la página nueva, sigue mostrando la anterior (cargando = true).
// Devuelve { datos, paginacion, respuesta, cargando, error, recargar }.
export function usePaginado(pedir, filtros) {
  const { versionDatos } = useAppData();
  const [recargas, establecerRecargas] = useState(0);
  // Qué pedido corresponde mostrar ahora (filtros + cambios en los datos + recargas manuales).
  const filtrosJson = JSON.stringify(filtros);
  const pedido = JSON.stringify([filtrosJson, versionDatos, recargas]);
  const [resultado, establecerResultado] = useState({ pedido: null, respuesta: null, error: '' });

  useEffect(() => {
    let vigente = true;
    pedir(JSON.parse(JSON.parse(pedido)[0]))
      .then((respuesta) => {
        if (vigente) establecerResultado({ pedido, respuesta, error: '' });
      })
      .catch(() => {
        if (vigente) {
          establecerResultado((actual) => ({ ...actual, pedido, error: 'No se pudieron cargar los datos.' }));
        }
      });
    return () => { vigente = false; };
  }, [pedir, pedido]);

  const recargar = useCallback(() => establecerRecargas((actual) => actual + 1), []);

  return {
    datos: resultado.respuesta?.datos ?? sinDatos,
    paginacion: resultado.respuesta?.paginacion ?? null,
    respuesta: resultado.respuesta,
    // Está cargando mientras la respuesta que se muestra no es la del último pedido.
    cargando: resultado.pedido !== pedido,
    error: resultado.pedido === pedido ? resultado.error : '',
    recargar,
  };
}

// Número de página que vuelve solo a la 1 cuando cambian los valores indicados (por ejemplo, la
// búsqueda ya diferida). Así, al buscar se hace un único pedido: el de la página 1 con la búsqueda.
// Ejemplo: const [pagina, establecerPagina] = usePagina(buscar);
export function usePagina(...reiniciarCuandoCambie) {
  const clave = JSON.stringify(reiniciarCuandoCambie);
  const [estado, establecerEstado] = useState({ pagina: 1, clave });
  const pagina = estado.clave === clave ? estado.pagina : 1;
  const establecerPagina = useCallback((nueva) => establecerEstado({ pagina: nueva, clave }), [clave]);
  return [pagina, establecerPagina];
}

// Devuelve el valor recién cuando deja de cambiar por "espera" milisegundos.
// Sirve para el buscador: pide al backend cuando el usuario deja de escribir, no en cada letra.
export function useValorDiferido(valor, espera = 400) {
  const [diferido, establecerDiferido] = useState(valor);
  useEffect(() => {
    const temporizador = setTimeout(() => establecerDiferido(valor), espera);
    return () => clearTimeout(temporizador);
  }, [valor, espera]);
  return diferido;
}
