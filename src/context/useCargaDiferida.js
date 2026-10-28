import { useEffect, useState } from 'react';
import { useAppData } from './useAppData.js';

// Carga datos recién cuando hacen falta (por ejemplo, las listas de un formulario al abrirlo)
// y los conserva mientras la pantalla siga abierta. Si mientras tanto cambió algún dato
// (crear, editar, asignar...), los vuelve a pedir la próxima vez que se necesiten.
// "cargar" debe ser una función definida fuera del componente para que no cambie en cada render.
// Ejemplo: const tecnicos = useCargaDiferida(cargarTecnicosActivos, dialogoAbierto);
export function useCargaDiferida(cargar, habilitado) {
  const { versionDatos } = useAppData();
  const [cargado, establecerCargado] = useState({ datos: null, version: null });
  const estaAlDia = cargado.version === versionDatos;

  useEffect(() => {
    if (!habilitado || estaAlDia) return undefined;
    let vigente = true;
    cargar()
      .then((respuesta) => { if (vigente) establecerCargado({ datos: respuesta, version: versionDatos }); })
      .catch(() => undefined);
    return () => { vigente = false; };
  }, [cargar, habilitado, estaAlDia, versionDatos]);

  return cargado.datos;
}
