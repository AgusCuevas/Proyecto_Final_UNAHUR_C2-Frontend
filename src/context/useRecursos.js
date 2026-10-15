import { useLayoutEffect, useMemo } from 'react';
import { useAppData } from './useAppData.js';

const sinDatos = [];

// Pide al backend los recursos indicados cada vez que se monta la pantalla que los usa.
// Ejemplo: const data = useRecursos('reclamos', 'clientes');
export function useRecursos(...nombres) {
  const { data, errores, pendientes, cargarRecurso } = useAppData();
  const clave = nombres.join(',');

  // useLayoutEffect marca la carga antes de pintar, así no se ven datos viejos ni por un instante.
  useLayoutEffect(() => {
    if (!clave) return;
    clave.split(',').forEach(cargarRecurso);
  }, [clave, cargarRecurso]);

  return useMemo(() => {
    const lista = clave ? clave.split(',') : [];
    return {
      ...Object.fromEntries(lista.map((nombre) => [nombre, data[nombre] ?? sinDatos])),
      cargando: lista.some((nombre) => pendientes[nombre] || (data[nombre] === undefined && !errores[nombre])),
      error: lista.map((nombre) => errores[nombre]).find(Boolean) || '',
    };
  }, [clave, data, errores, pendientes]);
}
