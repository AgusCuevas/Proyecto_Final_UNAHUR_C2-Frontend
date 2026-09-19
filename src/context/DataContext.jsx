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
        setData({ usuarios, clientes, vehiculos, reclamos, ubicacionesTecnicos });
      })
      .catch(() => setError('No se pudieron cargar los datos de la aplicación.'));
  }, []);

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

  return (
    <DataContext.Provider value={{ data, error, actualizarAsignacion, crearReclamo }}>
      {children}
    </DataContext.Provider>
  );
}
