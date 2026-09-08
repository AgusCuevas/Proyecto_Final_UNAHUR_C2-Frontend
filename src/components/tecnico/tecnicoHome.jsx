import { useState } from 'react';
import AppLayout from '../AppLayout.jsx';
import MisAsignaciones from './MisAsignaciones.jsx';
import Vehiculo from './Vehiculo.jsx';
import Jornada from './Jornada.jsx';

function TecnicoHome({ usuario, alCerrarSesion }) {
  const [seccion, establecerSeccion] = useState('Mis asignaciones');

  const contenidoPorSeccion = {
    'Mis asignaciones': <MisAsignaciones usuario={usuario} />,
    'Vehículo': <Vehiculo usuario={usuario} />,
    'Jornada': <Jornada />,
  };

  return (
    <AppLayout
      titulo={seccion}
      subtitulo="Consultá tus reclamos asignados y registrá el trabajo realizado."
      rol="Técnico"
      usuario={usuario}
      opciones={['Mis asignaciones', 'Vehículo', 'Jornada']}
      alCerrarSesion={alCerrarSesion}
      alSeleccionarOpcion={establecerSeccion}
    >
      {contenidoPorSeccion[seccion]}
    </AppLayout>
  );
}

export default TecnicoHome;
