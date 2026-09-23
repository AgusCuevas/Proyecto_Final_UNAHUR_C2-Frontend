import MockAdapter from 'axios-mock-adapter';
import { datosIniciales } from '../data/datosIniciales.js';
import { apiClient } from './apiClient.js';

const mock = import.meta.env.VITE_USE_MOCKS === 'false'
  ? null
  : new MockAdapter(apiClient, { delayResponse: 250 });
const estadoMock = JSON.parse(JSON.stringify(datosIniciales));

const respuesta = (config, data, status = 200) => [status, data, config.headers];

mock?.onGet('/usuarios').reply((config) => {
  const usuario = config.params?.usuario;
  const usuarios = usuario
    ? estadoMock.usuarios.filter((item) => item.usuario === usuario)
    : estadoMock.usuarios;
  return respuesta(config, usuarios);
});

mock?.onGet('/clientes').reply((config) => respuesta(config, estadoMock.clientes));
mock?.onGet('/vehiculos').reply((config) => respuesta(config, estadoMock.vehiculos));
mock?.onGet('/ubicaciones-tecnicos').reply((config) => respuesta(config, estadoMock.ubicacionesTecnicos));
mock?.onGet('/reclamos').reply((config) => respuesta(config, estadoMock.reclamos));

mock?.onPatch(/\/vehiculos\/\d+\/kilometraje/).reply((config) => {
  const vehiculoId = Number(config.url.match(/vehiculos\/(\d+)\/kilometraje/)[1]);
  const { kilometraje } = JSON.parse(config.data);
  const vehiculo = estadoMock.vehiculos.find((item) => item.id === vehiculoId);

  if (!vehiculo) return respuesta(config, { mensaje: 'Vehículo no encontrado' }, 404);
  if (!Number.isFinite(Number(kilometraje)) || Number(kilometraje) < vehiculo.kilometraje.actual) {
    return respuesta(config, { mensaje: 'El kilometraje debe ser válido y no menor al actual.' }, 400);
  }

  vehiculo.kilometraje.actual = Number(kilometraje);
  vehiculo.kilometraje.actualizadoEn = new Date().toISOString();
  return respuesta(config, vehiculo);
});

mock?.onPost('/reclamos').reply((config) => {
  const nuevoReclamo = JSON.parse(config.data);
  const reclamo = {
    id: Math.max(0, ...estadoMock.reclamos.map((item) => item.id)) + 1,
    ...nuevoReclamo,
    creadoEn: nuevoReclamo.creadoEn || new Date().toISOString(),
    estado: nuevoReclamo.tecnicoId ? 'Asignado' : 'Abierto',
  };
  estadoMock.reclamos.push(reclamo);
  return respuesta(config, reclamo, 201);
});

mock?.onPatch(/\/reclamos\/\d+\/asignacion/).reply((config) => {
  const reclamoId = Number(config.url.match(/reclamos\/(\d+)\/asignacion/)[1]);
  const cambios = JSON.parse(config.data);
  const reclamo = estadoMock.reclamos.find((item) => item.id === reclamoId);

  if (!reclamo) return respuesta(config, { mensaje: 'Reclamo no encontrado' }, 404);

  Object.assign(reclamo, cambios, {
    estado: cambios.tecnicoId ? 'Asignado' : 'Abierto',
  });
  return respuesta(config, reclamo);
});

mock?.onPatch(/\/reclamos\/\d+\/estado/).reply((config) => {
  const reclamoId = Number(config.url.match(/reclamos\/(\d+)\/estado/)[1]);
  const cambios = JSON.parse(config.data);
  const reclamo = estadoMock.reclamos.find((item) => item.id === reclamoId);

  if (!reclamo) return respuesta(config, { mensaje: 'Reclamo no encontrado' }, 404);

  Object.assign(reclamo, cambios);
  return respuesta(config, reclamo);
});

export const activarMockApi = () => mock;
