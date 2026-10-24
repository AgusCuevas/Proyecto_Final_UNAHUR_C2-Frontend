import { useState } from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AppLayout from '../AppLayout.jsx';
import MapaTecnicos from './MapaTecnicos.jsx';
import Reclamos from './Reclamos.jsx';
import Tecnicos from './Tecnicos.jsx';
import Vehiculos from './Vehiculos.jsx';
import { useRecursos } from '../../context/useRecursos.js';

// Panel: el mapa con un solo pedido (GET /tecnicos).
function PanelCoordinador() {
  const data = useRecursos('tecnicos');
  return <MapaTecnicos tecnicos={data.tecnicos} />;
}

function CoordinadorHome({ usuario, nombre, alCerrarSesion, alCambiarTema, modo }) {
  const [seccion, establecerSeccion] = useState('Panel del coordinador');
  const [formularioReclamoAbierto, establecerFormularioReclamoAbierto] = useState(false);

  const contenidoPorSeccion = {
    'Panel del coordinador': <PanelCoordinador />,
    Reclamos: (
      <Reclamos
        formularioAbierto={formularioReclamoAbierto}
        establecerFormularioAbierto={establecerFormularioReclamoAbierto}
      />
    ),
    Técnicos: <Tecnicos />,
    // Puede asignar técnicos y editar datos; el alta de vehículos queda para el admin.
    Vehículos: <Vehiculos gestionable />,
  };

  return (
    <AppLayout
      titulo={seccion}
      subtitulo={seccion === 'Panel del coordinador'
        ? 'Seguimiento del equipo en la zona de trabajo.'
        : 'Organizá los reclamos y coordiná las tareas del equipo.'}
      rol="Coordinador"
      usuario={usuario}
      nombre={nombre}
      opciones={['Panel del coordinador', 'Reclamos', 'Técnicos', 'Vehículos']}
      alCerrarSesion={alCerrarSesion}
      alCambiarTema={alCambiarTema}
      modo={modo}
      alSeleccionarOpcion={establecerSeccion}
      accionTitulo={seccion === 'Reclamos' && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => establecerFormularioReclamoAbierto((actual) => !actual)}
          sx={{ alignSelf: { xs: 'stretch', sm: 'center' }, flexShrink: 0 }}
        >
          Nuevo reclamo
        </Button>
      )}
    >
      {contenidoPorSeccion[seccion] || <PanelCoordinador />}
    </AppLayout>
  );
}

export default CoordinadorHome;
