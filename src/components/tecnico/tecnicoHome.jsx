import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../AppLayout.jsx';
import MisAsignaciones from './MisAsignaciones.jsx';
import Vehiculo from './Vehiculo.jsx';
import Jornada from './Jornada.jsx';
import RegistroKilometraje from './RegistroKilometraje.jsx';
import { useAppData } from '../../context/useAppData.js';

const semanaEnMilisegundos = 7 * 24 * 60 * 60 * 1000;

function TecnicoHome({ usuario, nombre, alCerrarSesion, alCambiarTema, modo }) {
  const [seccion, establecerSeccion] = useState('Mis asignaciones');
  const { data } = useAppData();
  const navegar = useNavigate();
  const tecnico = data.usuarios.find((usuarioRegistrado) => usuarioRegistrado.usuario === usuario);
  const vehiculo = data.vehiculos.find((vehiculoRegistrado) => vehiculoRegistrado.tecnicoAsignado === tecnico?.id);
  const [avisoKilometrajeAbierto, establecerAvisoKilometrajeAbierto] = useState(() => {
    const ultimoRegistro = vehiculo?.kilometraje?.actualizadoEn;
    const ultimoAviso = localStorage.getItem(`avisoKilometrajeTecnico:${tecnico?.id}`);
    const pasoUnaSemanaDesdeElAviso = !ultimoAviso
      || Date.now() - new Date(ultimoAviso).getTime() >= semanaEnMilisegundos;
    const pasoUnaSemanaDesdeElRegistro = !ultimoRegistro
      || Date.now() - new Date(ultimoRegistro).getTime() >= semanaEnMilisegundos;
    return Boolean(vehiculo && pasoUnaSemanaDesdeElAviso && pasoUnaSemanaDesdeElRegistro);
  });

  const cerrarAvisoKilometraje = () => {
    localStorage.setItem(`avisoKilometrajeTecnico:${tecnico.id}`, new Date().toISOString());
    establecerAvisoKilometrajeAbierto(false);
  };

  const contenidoPorSeccion = {
    'Mis asignaciones': <MisAsignaciones usuario={usuario} />,
    'Vehículo': <Vehiculo usuario={usuario} />,
    'Resumen de servicios': <Jornada usuario={usuario} />,
  };
  const seleccionarOpcion = (opcion) => {
    if (opcion === 'Servicio en curso') {
      navegar('/tecnicoHome/servicio-en-curso');
      return;
    }
    establecerSeccion(opcion);
  };

  return (
    <>
      <AppLayout
        titulo={seccion}
        subtitulo="Consultá tus resoluciones generadas."
        rol="Técnico"
        usuario={usuario}
        nombre={nombre}
        opciones={['Mis asignaciones', 'Servicio en curso', 'Vehículo', 'Resumen de servicios']}
        alCerrarSesion={alCerrarSesion}
        alCambiarTema={alCambiarTema}
        modo={modo}
        alSeleccionarOpcion={seleccionarOpcion}
      >
        {contenidoPorSeccion[seccion]}
      </AppLayout>
      <Dialog open={avisoKilometrajeAbierto} onClose={cerrarAvisoKilometraje} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 6 }}>
          Registrar kilometraje semanal
          <IconButton onClick={cerrarAvisoKilometraje} aria-label="Cerrar aviso" sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography color="text.secondary">
              Recordá cargar el kilometraje del vehículo asignado al finalizar el día o, como mínimo, una vez por semana.
            </Typography>
            {vehiculo && (
              <RegistroKilometraje
                vehiculo={vehiculo}
                alGuardar={cerrarAvisoKilometraje}
              />
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TecnicoHome;
