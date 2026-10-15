import { useCallback, useEffect, useState } from 'react';
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
  const [data, setData] = useState(() => (sessionStorage.getItem('galacticappToken') ? null : {
    usuarios: [], clientes: [], vehiculos: [], reclamos: [], ubicacionesTecnicos: [], jornadas: [],
  }));
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarDatos = () => {
      if (!sessionStorage.getItem('galacticappToken')) return;
      Promise.allSettled([
      usuariosApi.listar(),
      clientesApi.listar(),
      vehiculosApi.listar(),
      reclamosApi.listar(),
      ubicacionesApi.listar(),
      jornadasApi.listar(),
      ]).then((resultados) => {
        if (resultados.every((resultado) => resultado.status === 'rejected')) {
          setError('No se pudieron cargar los datos de la aplicación.');
          return;
        }
        const valor = (indice, valorPorDefecto = []) => (
          resultados[indice].status === 'fulfilled' ? resultados[indice].value : valorPorDefecto
        );
        const usuarios = valor(0);
        const clientes = valor(1);
        const vehiculos = valor(2);
        const reclamos = valor(3);
        const ubicacionesTecnicos = valor(4);
        const jornadas = valor(5);
        setData({ usuarios, clientes, vehiculos, reclamos, ubicacionesTecnicos, jornadas });
      });
    };
    cargarDatos();
    window.addEventListener('auth-changed', cargarDatos);
    return () => window.removeEventListener('auth-changed', cargarDatos);
  }, []);

  const crearCliente = async (cliente) => {
    const nuevoCliente = await clientesApi.crear(cliente);
    setData((actual) => ({ ...actual, clientes: [...actual.clientes, nuevoCliente] }));
    return nuevoCliente;
  };

  const actualizarCliente = async (clienteId, cambios) => {
    const clienteActualizado = await clientesApi.actualizar(clienteId, cambios);
    setData((actual) => ({
      ...actual,
      clientes: actual.clientes.map((cliente) => (
        String(cliente.id) === String(clienteId) ? clienteActualizado : cliente
      )),
    }));
    return clienteActualizado;
  };

  const crearUsuario = async (usuario) => {
    const nuevoUsuario = await usuariosApi.crear(usuario);
    setData((actual) => ({ ...actual, usuarios: [...actual.usuarios, nuevoUsuario] }));
    return nuevoUsuario;
  };

  const actualizarUsuario = async (usuarioId, cambios) => {
    const usuarioActualizado = await usuariosApi.actualizar(usuarioId, cambios);
    setData((actual) => ({
      ...actual,
      usuarios: actual.usuarios.map((usuario) => (
        String(usuario.id) === String(usuarioId) ? usuarioActualizado : usuario
      )),
    }));
    return usuarioActualizado;
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

  const actualizarAsignacionVehiculo = async (vehiculoId, tecnicoId) => {
    const vehiculoActualizado = await vehiculosApi.actualizarAsignacion(vehiculoId, tecnicoId);
    setData((actual) => ({
      ...actual,
      vehiculos: actual.vehiculos.map((vehiculo) => (
        vehiculo.id === vehiculoId ? vehiculoActualizado : vehiculo
      )),
    }));
    return vehiculoActualizado;
  };

  const actualizarControlVehiculo = async (vehiculoId, kilometraje) => {
    const vehiculoActualizado = await vehiculosApi.actualizarKilometraje(vehiculoId, kilometraje);
    setData((actual) => ({
      ...actual,
      vehiculos: actual.vehiculos.map((vehiculo) => (
        vehiculo.id === vehiculoId ? vehiculoActualizado : vehiculo
      )),
    }));
    return vehiculoActualizado;
  };

  const crearVehiculo = async (vehiculo) => {
    const nuevoVehiculo = await vehiculosApi.crear(vehiculo);
    setData((actual) => ({ ...actual, vehiculos: [...actual.vehiculos, nuevoVehiculo] }));
    return nuevoVehiculo;
  };

  const registrarControlVehiculo = async (vehiculoId, control) => {
    const vehiculoActualizado = await vehiculosApi.registrarControl(vehiculoId, control);
    setData((actual) => ({
      ...actual,
      vehiculos: actual.vehiculos.map((vehiculo) => (
        vehiculo.id === vehiculoId ? vehiculoActualizado : vehiculo
      )),
    }));
    return vehiculoActualizado;
  };

  const actualizarEstadoVehiculo = async (vehiculoId, enServicio) => {
    const vehiculoActualizado = await vehiculosApi.actualizar(vehiculoId, { enServicio });
    setData((actual) => ({
      ...actual,
      vehiculos: actual.vehiculos.map((vehiculo) => (
        vehiculo.id === vehiculoId ? vehiculoActualizado : vehiculo
      )),
    }));
    return vehiculoActualizado;
  };

  const registrarUbicacionTecnico = useCallback(async (tecnicoId, latitud, longitud) => {
    const ubicacion = await ubicacionesApi.actualizar(tecnicoId, { latitud, longitud });
    setData((actual) => ({
      ...actual,
      ubicacionesTecnicos: [
        ...actual.ubicacionesTecnicos.filter((item) => item.tecnicoId !== tecnicoId),
        ubicacion,
      ],
    }));
    return ubicacion;
  }, []);

  const actualizarUbicaciones = useCallback(async () => {
    const ubicaciones = await ubicacionesApi.listar();
    setData((actual) => ({ ...actual, ubicacionesTecnicos: ubicaciones }));
    return ubicaciones;
  }, []);

  const actualizarKilometraje = async (vehiculoId, kilometraje) => {
    const vehiculoActualizado = await vehiculosApi.actualizarKilometraje(vehiculoId, kilometraje);
    setData((actual) => ({
      ...actual,
      vehiculos: actual.vehiculos.map((vehiculo) => (
        vehiculo.id === vehiculoId ? vehiculoActualizado : vehiculo
      )),
    }));
    return vehiculoActualizado;
  };

  const iniciarJornada = async (tecnicoId) => {
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
    const jornadaCreada = await jornadasApi.crear(jornada);
    setData((actual) => ({
      ...actual,
      jornadas: [
        ...actual.jornadas.map((item) => ({ ...item, activa: false })),
        jornadaCreada,
      ],
    }));
    return jornadaCreada;
  };

  const finalizarJornada = async (jornadaId, controlFinal) => {
    const jornadaFinalizada = await jornadasApi.finalizar(jornadaId, controlFinal);
    setData((actual) => ({
      ...actual,
      jornadas: actual.jornadas.map((jornada) => (
        jornada.id === jornadaId ? jornadaFinalizada : jornada
      )),
    }));
    return jornadaFinalizada;
  };

  return (
    <DataContext.Provider value={{
      data,
      error,
      actualizarAsignacion,
      actualizarEstado,
      actualizarAsignacionVehiculo,
      crearVehiculo,
      actualizarControlVehiculo,
      registrarControlVehiculo,
      actualizarEstadoVehiculo,
      registrarUbicacionTecnico,
      actualizarUbicaciones,
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
