import { Paper, Typography } from '@mui/material';
import { useState } from 'react';
import AppLayout from '../AppLayout.jsx';

// Componente principal para la pantalla del administrador.
function AdminHome({ usuario, alCerrarSesion, alCambiarTema, modo }) {
  const [seccion, establecerSeccion] = useState('Panel de administración');

  return (
    <AppLayout
      titulo={seccion}
      subtitulo="Gestioná usuarios, clientes y el historial de servicios."
      rol="Administrador"
      usuario={usuario}
      opciones={['Panel de administración', 'Usuarios', 'Clientes', 'Reportes']}
      alCerrarSesion={alCerrarSesion}
      alCambiarTema={alCambiarTema}
      modo={modo}
      alSeleccionarOpcion={establecerSeccion}
    >
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6">Sección: {seccion}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Esta pantalla se agregará en el próximo paso.
        </Typography>
      </Paper>
    </AppLayout>
  );
}

export default AdminHome;
