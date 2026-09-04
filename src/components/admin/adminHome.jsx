import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import AppLayout from '../AppLayout.jsx';
import { datosIniciales } from '../../data/datosIniciales.js';

// Componente principal para la pantalla del administrador.
function AdminHome({ usuario, alCerrarSesion }) {
  const [seccion, establecerSeccion] = useState('Panel de administración');

  return (
    <AppLayout
      titulo={seccion}
      subtitulo="Gestioná usuarios, clientes y el historial de servicios."
      rol="Administrador"
      usuario={usuario}
      opciones={['Panel de administración', 'Usuarios', 'Clientes', 'Reportes']}
      alCerrarSesion={alCerrarSesion}
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
