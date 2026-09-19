import { useNavigate } from 'react-router-dom';
import AppLayout from '../AppLayout.jsx';
import MisAsignaciones from './MisAsignaciones.jsx';

function ServicioEnCurso({ usuario, alCerrarSesion, alCambiarTema, modo }) {
  const navegar = useNavigate();

  const seleccionarOpcion = (opcion) => {
    if (opcion === 'Servicio en curso') return;
    navegar('/tecnicoHome');
  };

  return (
    <AppLayout
      titulo="Servicio en curso"
      subtitulo="Consultá el reclamo que estás realizando actualmente."
      rol="Técnico"
      usuario={usuario}
      opciones={['Mis asignaciones', 'Servicio en curso', 'Vehículo', 'Jornada']}
      alCerrarSesion={alCerrarSesion}
      alCambiarTema={alCambiarTema}
      modo={modo}
      alSeleccionarOpcion={seleccionarOpcion}
    >
      <MisAsignaciones usuario={usuario} soloEnCurso />
    </AppLayout>
  );
}

export default ServicioEnCurso;
