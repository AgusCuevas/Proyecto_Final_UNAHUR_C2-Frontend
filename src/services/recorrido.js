const radioTierraKm = 6371;

export function distanciaEntrePuntos(origen, destino) {
  if (!origen || !destino) return 0;
  const latitud = (destino.latitud - origen.latitud) * Math.PI / 180;
  const longitud = (destino.longitud - origen.longitud) * Math.PI / 180;
  const origenLatitud = origen.latitud * Math.PI / 180;
  const destinoLatitud = destino.latitud * Math.PI / 180;
  const mitad = Math.sin(latitud / 2) ** 2
    + Math.sin(longitud / 2) ** 2 * Math.cos(origenLatitud) * Math.cos(destinoLatitud);
  return radioTierraKm * 2 * Math.atan2(Math.sqrt(mitad), Math.sqrt(1 - mitad));
}

export function obtenerParadasTecnico(tecnicoId, data, ubicacionActual) {
  const reclamos = data.reclamos
    .filter((reclamo) => reclamo.tecnicoId === tecnicoId && reclamo.estado !== 'Bloqueado')
    .sort((primero, segundo) => (
      new Date(primero.fechaProgramada || primero.creadoEn) - new Date(segundo.fechaProgramada || segundo.creadoEn)
    ));
  const clientes = reclamos
    .map((reclamo) => {
      const cliente = data.clientes.find((item) => item.id === reclamo.clienteId);
      return cliente?.coordenadas ? {
        latitud: cliente.coordenadas.latitud,
        longitud: cliente.coordenadas.longitud,
        etiqueta: `Servicio #${reclamo.id}`,
        tipo: reclamo.tipo,
      } : null;
    })
    .filter(Boolean);
  const inicio = ubicacionActual || data.ubicacionesTecnicos.find((item) => item.tecnicoId === tecnicoId);
  const puntos = inicio ? [{
    latitud: inicio.latitud,
    longitud: inicio.longitud,
    etiqueta: 'Inicio de jornada',
    tipo: 'inicio',
  }, ...clientes] : clientes;
  return puntos;
}

export function calcularRecorridoKm(paradas) {
  return paradas.slice(1).reduce((total, parada, indice) => (
    total + distanciaEntrePuntos(paradas[indice], parada)
  ), 0);
}
