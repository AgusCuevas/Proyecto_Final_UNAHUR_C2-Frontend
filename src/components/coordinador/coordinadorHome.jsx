import AppLayout from '../AppLayout.jsx';

function CoordinadorHome({ usuario, alCerrarSesion }) {
  return (
    <AppLayout
      titulo="Panel del coordinador"
      subtitulo="Organizá los reclamos y coordiná las tareas del equipo."
      rol="Coordinador"
      usuario={usuario}
      opciones={['Panel del coordinador', 'Reclamos', 'Técnicos', 'Vehículos']}
      alCerrarSesion={alCerrarSesion}
    />
  );
}

export default CoordinadorHome;
