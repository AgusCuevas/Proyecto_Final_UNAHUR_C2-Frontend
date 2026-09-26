import { useEffect, useState } from 'react';
import {
  clientesApi,
  jornadasApi,
  reclamosApi,
  ubicacionesApi,
  usuariosApi,
  vehiculosApi,
} from '../services/api.js';
import { DataContext } from './dataContext.js';

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      usuariosApi.listar(),
      clientesApi.listar(),
      vehiculosApi.listar(),
      reclamosApi.listar(),
      ubicacionesApi.listar(),
    ])
      .then(([usuarios, clientes, vehiculos, reclamos, ubicacionesTecnicos]) => {
        const jornadas = JSON.parse(localStorage.getItem('jornadasTecnicos') || '[]');
        const vehiculosConRegistro = vehiculos.map((vehiculo) => {
          const registro = JSON.parse(localStorage.getItem(`kilometrajeVehiculo:${vehiculo.id}`) || 'null');
          return registro ? {
            ...vehiculo,
            kilometraje: { ...vehiculo.kilometraje, ...registro },
          } : vehiculo;
        });
        const ubicacionesGuardadas = JSON.parse(localStorage.getItem('ubicacionesTecnicosActuales') || '{}');
        const ubicacionesCombinadas = ubicacionesTecnicos.map((ubicacion) => (
          ubicacionesGuardadas[ubicacion.tecnicoId]
            ? { ...ubicacion, ...ubicacionesGuardadas[ubicacion.tecnicoId] }
            : ubicacion
        ));
        setData({ usuarios, clientes, vehiculos: vehiculosConRegistro, reclamos, ubicacionesTecnicos: ubicacionesCombinadas, jornadas });
      })
      .catch(() => setError('No se pudieron cargar los datos de la aplicación.'));
  }, []);

  const guardarJornadas = (jornadas) => {
    localStorage.setItem('jornadasTecnicos', JSON.stringify(jornadas));
    return jornadas;
  };

  const actualizarAsignacion = async (reclamoId, tecnicoId) => {
    const reclamoActualizado = await reclamosApi.actualizarAsignacion(reclamoId, tecnicoId);
    setData((actual) => ({
      ...actual,
      reclamos: actual.reclamos.map((reclamo) => (
        reclamo.id === reclamoId ? reclamoActualizado : reclamo
      )),
    }));
    return reclamoActualizado;
  };

  const crearReclamo = async (reclamo) => {
    const nuevoReclamo = await reclamosApi.crear(reclamo);
    setData((actual) => ({ ...actual, reclamos: [...actual.reclamos, nuevoReclamo] }));
    return nuevoReclamo;
  };

  const actualizarEstado = async (reclamoId, cambios) => {
    const cambiosConJornada = cambios.estado === 'Finalizado'
      ? {
        ...cambios,
        finalizadoEn: cambios.finalizadoEn || new Date().toISOString(),
        jornadaId: data.jornadas.find((jornada) => jornada.activa)?.id || null,
      }
      : cambios;
    const reclamoActualizado = await reclamosApi.actualizarEstado(reclamoId, cambiosConJornada);
    setData((actual) => ({
      ...actual,
      reclamos: actual.reclamos.map((reclamo) => (
        reclamo.id === reclamoId ? reclamoActualizado : reclamo
      )),
    }));
    return reclamoActualizado;
  };

  const actualizarAsignacionVehiculo = (vehiculoId, tecnicoId) => {
    let vehiculoActualizado;
    setData((actual) => {
      const vehiculos = actual.vehiculos.map((vehiculo) => {
        if (vehiculo.id !== vehiculoId) return vehiculo;
        vehiculoActualizado = { ...vehiculo, tecnicoAsignado: tecnicoId || null };
        return vehiculoActualizado;
      });
      return { ...actual, vehiculos };
    });
    return vehiculoActualizado;
  };

  const actualizarControlVehiculo = (vehiculoId, kilometraje, foto) => {
    setData((actual) => ({
      ...actual,
      vehiculos: actual.vehiculos.map((vehiculo) => (
        vehiculo.id !== vehiculoId
          ? vehiculo
          : {
            ...vehiculo,
            kilometraje: { ...vehiculo.kilometraje, actual: Number(kilometraje) },
            fotosControl: foto
              ? [...(vehiculo.fotosControl || []), foto]
              : vehiculo.fotosControl || [],
          }
      )),
    }));
  };

  const registrarControlVehiculo = (vehiculoId, control) => {
    setData((actual) => ({
      ...actual,
      vehiculos: actual.vehiculos.map((vehiculo) => (
        vehiculo.id !== vehiculoId
          ? vehiculo
          : {
            ...vehiculo,
            kilometraje: { ...vehiculo.kilometraje, actual: control.kilometraje },
            enServicio: control.estado === 'Activo',
            controles: [...(vehiculo.controles || []), control],
            ultimoControl: control,
          }
      )),
    }));
    vehiculosApi.registrarControl(vehiculoId, control).catch(() => undefined);
  };

  const actualizarEstadoVehiculo = (vehiculoId, enServicio) => {
    setData((actual) => ({
      ...actual,
      vehiculos: actual.vehiculos.map((vehiculo) => (
        vehiculo.id === vehiculoId ? { ...vehiculo, enServicio } : vehiculo
      )),
    }));
  };

  const registrarUbicacionTecnico = (tecnicoId, latitud, longitud) => {
    const ubicacion = { tecnicoId, latitud, longitud, actualizadoEn: new Date().toISOString() };
    const ubicacionesGuardadas = JSON.parse(localStorage.getItem('ubicacionesTecnicosActuales') || '{}');
    ubicacionesGuardadas[tecnicoId] = ubicacion;
    localStorage.setItem('ubicacionesTecnicosActuales', JSON.stringify(ubicacionesGuardadas));
    setData((actual) => ({
      ...actual,
      ubicacionesTecnicos: actual.ubicacionesTecnicos.map((item) => (
        item.tecnicoId === tecnicoId ? { ...item, ...ubicacion } : item
      )),
    }));
    ubicacionesApi.actualizar(tecnicoId, { latitud, longitud }).catch(() => undefined);
  };

  const actualizarUbicaciones = async () => {
    const ubicaciones = await ubicacionesApi.listar();
    setData((actual) => ({ ...actual, ubicacionesTecnicos: ubicaciones }));
    return ubicaciones;
  };

  const actualizarKilometraje = async (vehiculoId, kilometraje) => {
    const vehiculoActualizado = await vehiculosApi.actualizarKilometraje(vehiculoId, kilometraje);
    localStorage.setItem(`kilometrajeVehiculo:${vehiculoId}`, JSON.stringify(vehiculoActualizado.kilometraje));
    setData((actual) => ({
      ...actual,
      vehiculos: actual.vehiculos.map((vehiculo) => (
        vehiculo.id === vehiculoId ? vehiculoActualizado : vehiculo
      )),
    }));
    return vehiculoActualizado;
  };

  const iniciarJornada = (tecnicoId) => {
    const vehiculo = data.vehiculos.find((item) => item.tecnicoAsignado === tecnicoId);
    const jornada = {
      id: Date.now(),
      tecnicoId,
      inicio: new Date().toISOString(),
      fin: null,
      kilometrajeInicial: vehiculo?.kilometraje.actual || 0,
      kilometrajeFinal: null,
      activa: true,
    };
    setData((actual) => {
      const jornadas = guardarJornadas([
        ...actual.jornadas.map((item) => ({ ...item, activa: false })),
        jornada,
      ]);
      return { ...actual, jornadas };
    });
    jornadasApi.crear(jornada).catch(() => undefined);
    return jornada;
  };

  const finalizarJornada = (jornadaId, controlFinal) => {
    let jornadaFinalizada;
    setData((actual) => {
      const jornadas = guardarJornadas(actual.jornadas.map((jornada) => {
        if (jornada.id !== jornadaId) return jornada;
        jornadaFinalizada = {
          ...jornada,
          fin: new Date().toISOString(),
          kilometrajeFinal: Number(controlFinal.kilometraje),
          controlFinal,
          activa: false,
        };
        return jornadaFinalizada;
      }));
      const vehiculos = actual.vehiculos.map((vehiculo) => (
        vehiculo.tecnicoAsignado === jornadaFinalizada?.tecnicoId
          ? {
            ...vehiculo,
            kilometraje: {
              ...vehiculo.kilometraje,
              actual: Number(controlFinal.kilometraje),
              final: Number(controlFinal.kilometraje),
            },
          }
          : vehiculo
      ));
      return { ...actual, jornadas, vehiculos };
    });
    jornadasApi.finalizar(jornadaId, controlFinal).catch(() => undefined);
    return jornadaFinalizada;
  };

  return (
    <DataContext.Provider value={{
      data,
      error,
      actualizarAsignacion,
      actualizarEstado,
      actualizarAsignacionVehiculo,
      actualizarControlVehiculo,
      registrarControlVehiculo,
      actualizarEstadoVehiculo,
      registrarUbicacionTecnico,
      actualizarUbicaciones,
      actualizarKilometraje,
      crearReclamo,
      iniciarJornada,
      finalizarJornada,
    }}>
      {children}
    </DataContext.Provider>
  );
}
