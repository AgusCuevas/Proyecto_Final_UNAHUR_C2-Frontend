import { useEffect, useState } from 'react';

// Carga datos recién cuando hacen falta (por ejemplo, las listas de un formulario al abrirlo)
// y los conserva mientras la pantalla siga abierta.
// "cargar" debe ser una función definida fuera del componente para que no cambie en cada render.
// Ejemplo: const tecnicos = useCargaDiferida(cargarTecnicosActivos, dialogoAbierto);
export function useCargaDiferida(cargar, habilitado) {
  const [datos, establecerDatos] = useState(null);

  useEffect(() => {
    if (!habilitado || datos) return undefined;
    let vigente = true;
    cargar()
      .then((respuesta) => { if (vigente) establecerDatos(respuesta); })
      .catch(() => undefined);
    return () => { vigente = false; };
  }, [cargar, datos, habilitado]);

  return datos;
}
