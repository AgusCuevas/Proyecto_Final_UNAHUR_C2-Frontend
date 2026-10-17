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
    const cargando = lista.some((nombre) => pendientes[nombre] || (data[nombre] === undefined && !errores[nombre]));
    // Mientras falte algún recurso se devuelven todos vacíos: así la pantalla nunca combina
    // datos que ya llegaron (por ejemplo reclamos) con otros que todavía no (sus clientes).
    return {
      ...Object.fromEntries(lista.map((nombre) => [nombre, cargando ? sinDatos : (data[nombre] ?? sinDatos)])),
      cargando,
      error: lista.map((nombre) => errores[nombre]).find(Boolean) || '',
    };
  }, [clave, data, errores, pendientes]);
}
