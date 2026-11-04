// Textos y formatos del módulo de reportes: todo lo que el usuario lee sale de acá, para que la
// pantalla hable en castellano y no con los nombres internos (esUnoDe, ultimosDias...).

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';
const formatoFechaHora = new Intl.DateTimeFormat('es-AR', {
  timeZone: ZONA_HORARIA, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
});
const formatoNumero = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

// Cómo se lee cada operador en el selector del filtro.
export const OPERADORES = {
  contiene: 'contiene',
  esIgualA: 'es exactamente',
  estaVacio: 'está vacío',
  esUnoDe: 'es',
  noEsNingunoDe: 'no es',
  igual: 'es igual a',
  mayor: 'es mayor que',
  menor: 'es menor que',
  entre: 'está entre',
  hoy: 'es de hoy',
  ultimosDias: 'es de los últimos…',
  esteMes: 'es de este mes',
  mesAnterior: 'es del mes pasado',
  esteAnio: 'es de este año',
  antes: 'es antes del',
  despues: 'es después del',
  esSi: 'es Sí',
  esNo: 'es No',
};

export const CALCULOS = { cantidad: 'Cantidad', suma: 'Suma', promedio: 'Promedio' };

// Períodos del filtro rápido "Período".
export const PERIODOS = [
  { valor: 'todo', etiqueta: 'Todo el tiempo' },
  { valor: 'hoy', etiqueta: 'Hoy', filtro: { operador: 'hoy' } },
  { valor: 'ultimos7', etiqueta: 'Últimos 7 días', filtro: { operador: 'ultimosDias', valor: 7 } },
  { valor: 'ultimos30', etiqueta: 'Últimos 30 días', filtro: { operador: 'ultimosDias', valor: 30 } },
  { valor: 'esteMes', etiqueta: 'Este mes', filtro: { operador: 'esteMes' } },
  { valor: 'mesAnterior', etiqueta: 'Mes pasado', filtro: { operador: 'mesAnterior' } },
  { valor: 'esteAnio', etiqueta: 'Este año', filtro: { operador: 'esteAnio' } },
];

export const esFecha = (tipo) => tipo === 'fecha' || tipo === 'dia';
export const esAgrupable = (tipo) => ['lista', 'texto', 'booleano', 'fecha', 'dia'].includes(tipo);

// "2026-11-02" → "02/11/2026" (sin pasar por Date, para que no se corra un día por la zona horaria).
const diaATexto = (dia) => {
  const [anio, mes, numero] = String(dia).slice(0, 10).split('-');
  return numero ? `${numero}/${mes}/${anio}` : String(dia);
};

// Valor de una celda tal como se muestra.
export function formatearValor(valor, tipo) {
  if (valor == null || valor === '') return '—';
  if (tipo === 'booleano') return valor ? 'Sí' : 'No';
  if (tipo === 'dia') return diaATexto(valor);
  if (tipo === 'fecha') {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? '—' : formatoFechaHora.format(fecha);
  }
  if (tipo === 'numero') return Number.isFinite(Number(valor)) ? formatoNumero.format(Number(valor)) : '—';
  return String(valor);
}

export const formatearNumero = (valor) => (valor == null ? '—' : formatoNumero.format(valor));

// Cómo se lee el sentido del orden según el tipo de la columna.
export function sentidos(tipo) {
  if (esFecha(tipo)) return { desc: 'más nuevo primero', asc: 'más viejo primero' };
  if (tipo === 'numero') return { desc: 'de mayor a menor', asc: 'de menor a mayor' };
  if (tipo === 'booleano') return { asc: 'Sí primero', desc: 'No primero' };
  return { asc: 'de la A a la Z', desc: 'de la Z a la A' };
}

// Operador y valor con los que arranca un filtro nuevo.
export function filtroInicial(columna) {
  const [operador] = columna.operadores;
  const porTipo = {
    texto: { operador: 'contiene', valor: '' },
    lista: { operador: 'esUnoDe', valor: [] },
    numero: { operador: 'mayor', valor: '' },
    booleano: { operador: 'esSi' },
  };
  return { campo: columna.campo, ...(porTipo[columna.tipo] || (esFecha(columna.tipo) ? { operador: 'esteMes' } : { operador })) };
}

// Valor inicial cuando se cambia el operador de un filtro.
export function valorInicial(operador) {
  if (['esUnoDe', 'noEsNingunoDe'].includes(operador)) return [];
  if (operador === 'entre') return ['', ''];
  if (operador === 'ultimosDias') return 30;
  if (['contiene', 'esIgualA', 'igual', 'mayor', 'menor', 'antes', 'despues'].includes(operador)) return '';
  return undefined;
}

const tieneTexto = (valor) => valor !== undefined && valor !== null && String(valor).trim() !== '';
const esNumero = (valor) => tieneTexto(valor) && Number.isFinite(Number(valor));

// ¿El filtro tiene todo lo necesario? Los incompletos se muestran pero no se aplican.
export function filtroCompleto(filtro, columna) {
  if (!columna) return false;
  const { operador, valor } = filtro;
  if (['esUnoDe', 'noEsNingunoDe'].includes(operador)) return Array.isArray(valor) && valor.length > 0;
  if (['contiene', 'esIgualA', 'antes', 'despues'].includes(operador)) return tieneTexto(valor);
  if (['igual', 'mayor', 'menor'].includes(operador)) return esNumero(valor);
  if (operador === 'ultimosDias') return Number.isInteger(Number(valor)) && Number(valor) >= 1;
  if (operador === 'entre') {
    return Array.isArray(valor) && valor.length === 2
      && valor.every(columna.tipo === 'numero' ? esNumero : tieneTexto)
      && (columna.tipo === 'numero' ? Number(valor[0]) <= Number(valor[1]) : valor[0] <= valor[1]);
  }
  return true;
}

// Filtro listo para enviar al backend (números como números).
function normalizarFiltro(filtro, columna) {
  const { campo, operador, valor } = filtro;
  if (['igual', 'mayor', 'menor', 'ultimosDias'].includes(operador)) return { campo, operador, valor: Number(valor) };
  if (operador === 'entre' && columna.tipo === 'numero') return { campo, operador, valor: valor.map(Number) };
  return valor === undefined ? { campo, operador } : { campo, operador, valor };
}

// Definición que se manda al backend: solo los filtros completos.
export function definicionParaEnviar(definicion, fuente) {
  const columnas = new Map(fuente.columnas.map((columna) => [columna.campo, columna]));
  return {
    ...definicion,
    filtros: definicion.filtros
      .filter((filtro) => filtroCompleto(filtro, columnas.get(filtro.campo)))
      .map((filtro) => normalizarFiltro(filtro, columnas.get(filtro.campo))),
  };
}

const unir = (partes, conector = 'y') => (partes.length <= 1
  ? partes.join('')
  : `${partes.slice(0, -1).join(', ')} ${conector} ${partes.at(-1)}`);

const textoDeValor = (valor, tipo) => (esFecha(tipo) ? diaATexto(valor) : formatearValor(valor, tipo));

// Un filtro contado en palabras: "Estado es Bloqueado o Asignado".
export function describirFiltro(filtro, columna) {
  const nombre = columna.etiqueta;
  const { operador, valor } = filtro;
  const frases = {
    esUnoDe: () => `${nombre} es ${unir(valor.map(String), 'o')}`,
    noEsNingunoDe: () => `${nombre} no es ${unir(valor.map(String), 'ni')}`,
    contiene: () => `${nombre} contiene "${valor}"`,
    esIgualA: () => `${nombre} es "${valor}"`,
    estaVacio: () => `${nombre} está vacío`,
    igual: () => `${nombre} es ${formatearNumero(Number(valor))}`,
    mayor: () => `${nombre} es mayor que ${formatearNumero(Number(valor))}`,
    menor: () => `${nombre} es menor que ${formatearNumero(Number(valor))}`,
    entre: () => `${nombre} está entre ${textoDeValor(valor[0], columna.tipo)} y ${textoDeValor(valor[1], columna.tipo)}`,
    hoy: () => `${nombre} es de hoy`,
    ultimosDias: () => `${nombre} es de los últimos ${valor} días`,
    esteMes: () => `${nombre} es de este mes`,
    mesAnterior: () => `${nombre} es del mes pasado`,
    esteAnio: () => `${nombre} es de este año`,
    antes: () => `${nombre} es antes del ${diaATexto(valor)}`,
    despues: () => `${nombre} es después del ${diaATexto(valor)}`,
    esSi: () => `${nombre}: sí`,
    esNo: () => `${nombre}: no`,
  };
  return frases[operador]?.() || nombre;
}

// La frase que explica qué se está viendo, por ejemplo:
// "Mostrando 12 reclamos donde Estado es Bloqueado, ordenados por Creado (más nuevo primero)."
export function describirReporte(definicion, fuente, total) {
  if (!fuente) return '';
  const columnas = new Map(fuente.columnas.map((columna) => [columna.campo, columna]));
  const { singular, plural } = fuente.sustantivo;
  const cantidad = total == null ? plural : `${formatearNumero(total)} ${total === 1 ? singular : plural}`;
  const condiciones = definicion.filtros
    .filter((filtro) => filtroCompleto(filtro, columnas.get(filtro.campo)))
    .map((filtro) => describirFiltro(filtro, columnas.get(filtro.campo)));
  let texto = `${definicion.agrupacion ? 'Resumen de' : 'Mostrando'} ${cantidad}`;
  if (condiciones.length) texto += ` donde ${unir(condiciones)}`;
  const { agrupacion, orden } = definicion;
  if (agrupacion && columnas.get(agrupacion.por)) {
    const por = columnas.get(agrupacion.por);
    texto += `, agrupados por ${por.etiqueta}${esFecha(por.tipo) ? ' (por mes)' : ''}`;
    if (agrupacion.calculo !== 'cantidad' && columnas.get(agrupacion.campo)) {
      texto += `, con el ${agrupacion.calculo === 'suma' ? 'total' : 'promedio'} de ${columnas.get(agrupacion.campo).etiqueta}`;
    }
  } else if (orden && columnas.get(orden.campo)) {
    const columna = columnas.get(orden.campo);
    texto += `, ordenados por ${columna.etiqueta} (${sentidos(columna.tipo)[orden.sentido]})`;
  }
  return `${texto}.`;
}

// Definición de un reporte nuevo para una fuente: sus columnas y orden por defecto, sin filtros.
export const definicionNueva = (fuente) => ({
  fuente: fuente.clave,
  columnas: fuente.columnasPorDefecto,
  filtros: [],
  orden: fuente.ordenPorDefecto,
  agrupacion: null,
});

// Último día de un mes "AAAA-MM" (para ver los registros de un mes del resumen).
export function rangoDelMes(clave) {
  const [anio, mes] = clave.split('-').map(Number);
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return [`${clave}-01`, `${clave}-${String(ultimo).padStart(2, '0')}`];
}
