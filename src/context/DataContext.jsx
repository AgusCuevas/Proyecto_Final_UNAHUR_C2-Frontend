import { useEffect, useState } from 'react';
import {
  clientesApi,
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
        setData({ usuarios, clientes, vehiculos, reclamos, ubicacionesTecnicos, jornadas });
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
  };

  const actualizarEstadoVehiculo = (vehiculoId, enServicio) => {
    setData((actual) => ({
      ...actual,
      vehiculos: actual.vehiculos.map((vehiculo) => (
        vehiculo.id === vehiculoId ? { ...vehiculo, enServicio } : vehiculo
      )),
    }));
  };

  const iniciarJornada = (tecnicoId) => {
    const jornada = {
      id: Date.now(),
      tecnicoId,
      inicio: new Date().toISOString(),
      fin: null,
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
      crearReclamo,
      iniciarJornada,
      finalizarJornada,
    }}>
      {children}
    </DataContext.Provider>
  );
}
