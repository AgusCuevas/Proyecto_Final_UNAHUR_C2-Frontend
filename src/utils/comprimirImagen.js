// Convierte una imagen en un JPEG liviano (data URL en base64) listo para enviar a la API.
// Una imagen de celular de 3-4 MB queda en unos 150-300 KB. Si sigue siendo pesada se
// reduce la calidad y el tamaño hasta entrar en el máximo que acepta el backend.
const MAXIMO_BYTES = 550 * 1024;
const INTENTOS = [
  { ladoMaximo: 1600, calidad: 0.8 },
  { ladoMaximo: 1280, calidad: 0.7 },
  { ladoMaximo: 1024, calidad: 0.6 },
];

const bytesDeDataUrl = (dataUrl) => Math.floor(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);

export async function comprimirImagen(archivo) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`No se pudo leer la imagen "${archivo.name}". Usá imágenes JPG, PNG o WebP.`);
  }
  try {
    for (const { ladoMaximo, calidad } of INTENTOS) {
      const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.round(bitmap.width * escala);
      lienzo.height = Math.round(bitmap.height * escala);
      lienzo.getContext('2d').drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
      const dataUrl = lienzo.toDataURL('image/jpeg', calidad);
      if (bytesDeDataUrl(dataUrl) <= MAXIMO_BYTES) return dataUrl;
    }
    throw new Error(`La imagen "${archivo.name}" es demasiado grande. Probá con otra imagen.`);
  } finally {
    bitmap.close();
  }
}
