import { useCallback, useRef, useState } from 'react';
import {
  clientesApi,
  jornadasApi,
  reclamosApi,
  tecnicosApi,
  ubicacionesApi,
  usuariosApi,
  vehiculosApi,
} from '../services/api.js';
import { DataContext } from './dataContext.js';

// Cada recurso se pide al backend cada vez que una pantalla lo necesita (ver useRecursos).
// Las respuestas ya traen sus datos relacionados (por ejemplo, cada vehículo trae su técnico),
// así cada pantalla pide un solo recurso.
const cargadores = {
  usuarios: usuariosApi.listar,
  tecnicos: tecnicosApi.listar,
  reclamosEnCurso: reclamosApi.listarEnCurso,
  resumenUsuarios: usuariosApi.resumen,
  resumenReclamos: reclamosApi.resumen,
  clientes: clientesApi.listar,
  vehiculos: vehiculosApi.listar,
  reclamos: reclamosApi.listar,
  ubicacionesTecnicos: ubicacionesApi.listar,
  jornadas: jornadasApi.listar,
};

export function DataProvider({ children }) {
  // Un recurso en undefined todavía no se cargó.
  const [data, setData] = useState({});
  const [errores, setErrores] = useState({});
  // Recursos con una petición en curso: { reclamos: true, ... }.
  const [pendientes, setPendientes] = useState({});
  const enCurso = useRef({});
  // Las respuestas de una sesión anterior se descartan al cerrar sesión.
  const sesion = useRef(0);
  // Datos del usuario que llegan en el login. Para el técnico incluye su jornada activa
  // y su vehículo, que se muestran en todas sus pantallas sin volver a pedirlos.
  const [datosSesion, establecerDatosSesion] = useState({ usuario: null, jornadaActiva: null, vehiculo: null });

  const iniciarSesion = useCallback((respuestaLogin) => {
    establecerDatosSesion({
      usuario: respuestaLogin.usuario,
      jornadaActiva: respuestaLogin.jornadaActiva ?? null,
      vehiculo: respuestaLogin.vehiculo ?? null,
    });
  }, []);

  // Si ya hay una petición en curso del mismo recurso se reutiliza; si no, se pide de nuevo.
  const cargarRecurso = useCallback((nombre) => {
    if (enCurso.current[nombre]) return enCurso.current[nombre];
    const sesionActual = sesion.current;
    const esVigente = () => sesionActual === sesion.current;
    setPendientes((actual) => ({ ...actual, [nombre]: true }));
    enCurso.current[nombre] = cargadores[nombre]()
      .then((valor) => {
        if (!esVigente()) return;
        setData((actual) => ({ ...actual, [nombre]: valor }));
        setErrores((actual) => {
          const restantes = { ...actual };
          delete restantes[nombre];
          return restantes;
        });
      })
      .catch(() => {
        if (!esVigente()) return;
        setErrores((actual) => ({ ...actual, [nombre]: 'No se pudieron cargar los datos.' }));
      })
      .finally(() => {
        if (!esVigente()) return;
        delete enCurso.current[nombre];
        setPendientes((actual) => {
          const restantes = { ...actual };
          delete restantes[nombre];
          return restantes;
        });
      });
    return enCurso.current[nombre];
  }, []);

  const limpiarDatos = useCallback(() => {
    sesion.current += 1;
    enCurso.current = {};
    setData({});
    setErrores({});
    setPendientes({});
    establecerDatosSesion({ usuario: null, jornadaActiva: null, vehiculo: null });
  }, []);

  // Si cambia el vehículo del técnico logueado, se actualiza también el de la sesión.
  const actualizarVehiculoDeSesion = (vehiculo) => establecerDatosSesion((actual) => (
    actual.vehiculo && String(actual.vehiculo.id) === String(vehiculo.id) ? { ...actual, vehiculo } : actual
  ));

  // Las modificaciones solo tocan recursos ya cargados; si no, se pedirán completos al necesitarlos.
  const agregar = (nombre, item) => setData((actual) => (
    actual[nombre] ? { ...actual, [nombre]: [...actual[nombre], item] } : actual
  ));
  const reemplazar = (nombre, id, item) => setData((actual) => (
    actual[nombre]
      ? { ...actual, [nombre]: actual[nombre].map((x) => (String(x.id) === String(id) ? item : x)) }
      : actual
  ));

  // El backend libera el vehículo anterior del técnico; se refleja lo mismo en memoria.
  const reemplazarVehiculoAsignado = (vehiculo) => setData((actual) => {
    if (!actual.vehiculos) return actual;
    const esElMismo = (item) => String(item.id) === String(vehiculo.id);
    const vehiculos = actual.vehiculos.map((item) => {
      if (esElMismo(item)) return vehiculo;
      return vehiculo.tecnicoAsignado != null && item.tecnicoAsignado === vehiculo.tecnicoAsignado
        ? { ...item, tecnicoAsignado: null, tecnico: null }
        : item;
    });
    return { ...actual, vehiculos: actual.vehiculos.some(esElMismo) ? vehiculos : [...vehiculos, vehiculo] };
  });

  const crearCliente = async (cliente) => {
    const nuevoCliente = await clientesApi.crear(cliente);
    agregar('clientes', nuevoCliente);
    return nuevoCliente;
  };

  const actualizarCliente = async (clienteId, cambios) => {
    const clienteActualizado = await clientesApi.actualizar(clienteId, cambios);
    reemplazar('clientes', clienteId, clienteActualizado);
    return clienteActualizado;
  };

  const crearUsuario = async (usuario) => {
    const nuevoUsuario = await usuariosApi.crear(usuario);
    agregar('usuarios', nuevoUsuario);
    return nuevoUsuario;
  };

  const actualizarUsuario = async (usuarioId, cambios) => {
    const usuarioActualizado = await usuariosApi.actualizar(usuarioId, cambios);
    reemplazar('usuarios', usuarioId, usuarioActualizado);
    return usuarioActualizado;
  };

  const actualizarAsignacion = async (reclamoId, tecnicoId) => {
    const reclamoActualizado = await reclamosApi.actualizarAsignacion(reclamoId, tecnicoId);
    reemplazar('reclamos', reclamoId, reclamoActualizado);
    return reclamoActualizado;
  };

  const crearReclamo = async (reclamo) => {
    const nuevoReclamo = await reclamosApi.crear(reclamo);
    agregar('reclamos', nuevoReclamo);
    return nuevoReclamo;
  };

  const actualizarEstado = async (reclamoId, cambios) => {
    const cambiosConJornada = cambios.estado === 'Finalizado'
      ? {
        ...cambios,
        finalizadoEn: cambios.finalizadoEn || new Date().toISOString(),
        jornadaId: datosSesion.jornadaActiva?.id || null,
      }
      : cambios;
    const reclamoActualizado = await reclamosApi.actualizarEstado(reclamoId, cambiosConJornada);
    reemplazar('reclamos', reclamoId, reclamoActualizado);
    reemplazar('reclamosEnCurso', reclamoId, reclamoActualizado);
    return reclamoActualizado;
  };

  const actualizarAsignacionVehiculo = async (vehiculoId, tecnicoId) => {
    const vehiculoActualizado = await vehiculosApi.actualizarAsignacion(vehiculoId, tecnicoId);
    reemplazarVehiculoAsignado(vehiculoActualizado);
    return vehiculoActualizado;
  };

  const actualizarControlVehiculo = async (vehiculoId, kilometraje) => {
    const vehiculoActualizado = await vehiculosApi.actualizarKilometraje(vehiculoId, kilometraje);
    reemplazar('vehiculos', vehiculoId, vehiculoActualizado);
    actualizarVehiculoDeSesion(vehiculoActualizado);
    return vehiculoActualizado;
  };

  const crearVehiculo = async (vehiculo) => {
    const nuevoVehiculo = await vehiculosApi.crear(vehiculo);
    reemplazarVehiculoAsignado(nuevoVehiculo);
    return nuevoVehiculo;
  };

  const registrarControlVehiculo = async (vehiculoId, control) => {
    const vehiculoActualizado = await vehiculosApi.registrarControl(vehiculoId, control);
    reemplazar('vehiculos', vehiculoId, vehiculoActualizado);
    actualizarVehiculoDeSesion(vehiculoActualizado);
    return vehiculoActualizado;
  };

  // Admin y coordinador: seguro, último service, detalle y si está en servicio.
  const actualizarVehiculo = async (vehiculoId, cambios) => {
    const vehiculoActualizado = await vehiculosApi.actualizar(vehiculoId, cambios);
    reemplazar('vehiculos', vehiculoId, vehiculoActualizado);
    actualizarVehiculoDeSesion(vehiculoActualizado);
    return vehiculoActualizado;
  };

  const actualizarEstadoVehiculo = async (vehiculoId, enServicio) => {
    const vehiculoActualizado = await vehiculosApi.actualizar(vehiculoId, { enServicio });
    reemplazar('vehiculos', vehiculoId, vehiculoActualizado);
    return vehiculoActualizado;
  };

  const registrarUbicacionTecnico = useCallback(async (tecnicoId, latitud, longitud) => {
    const ubicacion = await ubicacionesApi.actualizar(tecnicoId, { latitud, longitud });
    setData((actual) => (actual.ubicacionesTecnicos ? {
      ...actual,
      ubicacionesTecnicos: [
        ...actual.ubicacionesTecnicos.filter((item) => item.tecnicoId !== tecnicoId),
        ubicacion,
      ],
    } : actual));
    return ubicacion;
  }, []);

  // El mapa refresca las ubicaciones cada 5 minutos pidiendo de nuevo los técnicos,
  // sin mostrar el indicador de carga.
  const actualizarTecnicos = useCallback(async () => {
    const tecnicos = await tecnicosApi.listar();
    setData((actual) => ({ ...actual, tecnicos }));
    return tecnicos;
  }, []);

  const actualizarKilometraje = async (vehiculoId, kilometraje) => {
    const vehiculoActualizado = await vehiculosApi.actualizarKilometraje(vehiculoId, kilometraje);
    reemplazar('vehiculos', vehiculoId, vehiculoActualizado);
    actualizarVehiculoDeSesion(vehiculoActualizado);
    return vehiculoActualizado;
  };

  const iniciarJornada = async (tecnicoId) => {
    const { vehiculo } = datosSesion;
    const jornada = {
      id: Date.now(),
      tecnicoId,
      inicio: new Date().toISOString(),
      fin: null,
      kilometrajeInicial: vehiculo?.kilometraje?.actual || 0,
      kilometrajeFinal: null,
      activa: true,
    };
    const jornadaCreada = await jornadasApi.crear(jornada);
    setData((actual) => (actual.jornadas ? {
      ...actual,
      jornadas: [
        ...actual.jornadas.map((item) => ({ ...item, activa: false })),
        { ...jornadaCreada, servicios: [] },
      ],
    } : actual));
    establecerDatosSesion((actual) => ({ ...actual, jornadaActiva: jornadaCreada }));
    return jornadaCreada;
  };

  const finalizarJornada = async (jornadaId, controlFinal) => {
    const jornadaFinalizada = await jornadasApi.finalizar(jornadaId, controlFinal);
    setData((actual) => (actual.jornadas ? {
      ...actual,
      jornadas: actual.jornadas.map((item) => (
        String(item.id) === String(jornadaId) ? { ...jornadaFinalizada, servicios: item.servicios } : item
      )),
    } : actual));
    establecerDatosSesion((actual) => ({ ...actual, jornadaActiva: null }));
    return jornadaFinalizada;
  };

  return (
    <DataContext.Provider value={{
      data,
      errores,
      pendientes,
      cargando: Object.keys(pendientes).length > 0,
      cargarRecurso,
      limpiarDatos,
      sesion: datosSesion,
      iniciarSesion,
      actualizarAsignacion,
      actualizarEstado,
      actualizarAsignacionVehiculo,
      crearVehiculo,
      actualizarControlVehiculo,
      registrarControlVehiculo,
      actualizarEstadoVehiculo,
      actualizarVehiculo,
      registrarUbicacionTecnico,
      actualizarTecnicos,
      actualizarKilometraje,
      crearCliente,
      actualizarCliente,
      crearUsuario,
      actualizarUsuario,
      crearReclamo,
      iniciarJornada,
      finalizarJornada,
    }}>
      {children}
    </DataContext.Provider>
  );
}
