import AppLayout from '../AppLayout.jsx';

function TecnicoHome({ usuario, alCerrarSesion }) {
  return (
    <AppLayout
      titulo="Panel del técnico"
      subtitulo="Consultá tus reclamos asignados y registrá el trabajo realizado."
      rol="Técnico"
      usuario={usuario}
      opciones={['Panel del técnico', 'Mis reclamos', 'Vehículo', 'Jornada']}
      alCerrarSesion={alCerrarSesion}
    />
  );
}

export default TecnicoHome;
