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

// Paradas del recorrido: la ubicación del técnico y después los domicilios de sus servicios,
// que el backend ya envía en orden dentro de cada técnico ("recorrido").
export function obtenerParadasTecnico(ubicacion, recorrido = []) {
  const servicios = recorrido.map((parada) => ({
    latitud: parada.latitud,
    longitud: parada.longitud,
    etiqueta: `Servicio #${parada.reclamoId}`,
    tipo: parada.tipo,
  }));
  return ubicacion ? [{
    latitud: ubicacion.latitud,
    longitud: ubicacion.longitud,
    etiqueta: 'Inicio de jornada',
    tipo: 'inicio',
  }, ...servicios] : servicios;
}

export function calcularRecorridoKm(paradas) {
  return paradas.slice(1).reduce((total, parada, indice) => (
    total + distanciaEntrePuntos(paradas[indice], parada)
  ), 0);
}
