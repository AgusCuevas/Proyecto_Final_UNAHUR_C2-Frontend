import { useState } from 'react';
import AppLayout from '../AppLayout.jsx';
import MapaTecnicos from './MapaTecnicos.jsx';
import Reclamos from './Reclamos.jsx';
import Tecnicos from './Tecnicos.jsx';
import Vehiculos from './Vehiculos.jsx';

function CoordinadorHome({ usuario, nombre, alCerrarSesion, alCambiarTema, modo }) {
  const [seccion, establecerSeccion] = useState('Panel del coordinador');

  const contenidoPorSeccion = {
    'Panel del coordinador': <MapaTecnicos />,
    Reclamos: <Reclamos />,
    Técnicos: <Tecnicos />,
    Vehículos: <Vehiculos />,
  };

  return (
    <AppLayout
      titulo={seccion}
      subtitulo="Organizá los reclamos y coordiná las tareas del equipo."
      rol="Coordinador"
      usuario={usuario}
      nombre={nombre}
      opciones={['Panel del coordinador', 'Reclamos', 'Técnicos', 'Vehículos']}
      alCerrarSesion={alCerrarSesion}
      alCambiarTema={alCambiarTema}
      modo={modo}
      alSeleccionarOpcion={establecerSeccion}
    >
      {contenidoPorSeccion[seccion] || <MapaTecnicos />}
    </AppLayout>
  );
}

export default CoordinadorHome;
