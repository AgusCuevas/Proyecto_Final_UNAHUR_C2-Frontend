import { imagenesApi } from '../services/api.js';
import { comprimirImagen } from './comprimirImagen.js';

// Comprime las imágenes elegidas por el usuario, las sube a la API y devuelve sus ids,
// listos para guardar en el campo "imagenes" de un reclamo, jornada o vehículo.
export async function subirImagenes(archivos) {
  const comprimidas = await Promise.all(archivos.map((archivo) => comprimirImagen(archivo)));
  const subidas = await imagenesApi.subir(comprimidas);
  return subidas.map((imagen) => imagen.id);
}
