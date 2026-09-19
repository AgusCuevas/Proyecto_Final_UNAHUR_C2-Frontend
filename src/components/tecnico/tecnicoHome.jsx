import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../AppLayout.jsx';
import MisAsignaciones from './MisAsignaciones.jsx';
import Vehiculo from './Vehiculo.jsx';
import Jornada from './Jornada.jsx';

function TecnicoHome({ usuario, alCerrarSesion, alCambiarTema, modo }) {
  const [seccion, establecerSeccion] = useState('Mis asignaciones');
  const navegar = useNavigate();

  const contenidoPorSeccion = {
    'Mis asignaciones': <MisAsignaciones usuario={usuario} />,
    'Vehículo': <Vehiculo usuario={usuario} />,
    'Jornada': <Jornada usuario={usuario} />,
  };
  const seleccionarOpcion = (opcion) => {
    if (opcion === 'Servicio en curso') {
      navegar('/tecnicoHome/servicio-en-curso');
      return;
    }
    establecerSeccion(opcion);
  };

  return (
    <AppLayout
      titulo={seccion}
      subtitulo="Consultá tus reclamos asignados y registrá el trabajo realizado."
      rol="Técnico"
      usuario={usuario}
      opciones={['Mis asignaciones', 'Servicio en curso', 'Vehículo', 'Jornada']}
      alCerrarSesion={alCerrarSesion}
      alCambiarTema={alCambiarTema}
      modo={modo}
      alSeleccionarOpcion={seleccionarOpcion}
    >
      {contenidoPorSeccion[seccion]}
    </AppLayout>
  );
}

export default TecnicoHome;
