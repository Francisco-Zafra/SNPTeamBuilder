// `useGrouping: "always"` es necesario: en es-ES, por defecto, los números de
// 4 cifras no se agrupan (3125 saldría "3125" en vez de "3.125").
const pointsFormatter = new Intl.NumberFormat("es-ES", {
  maximumFractionDigits: 2,
  useGrouping: "always",
});

/** 3125 -> "3.125"; 57343.75 -> "57.343,75". Redondeo solo de presentación. */
export const formatPoints = (points) => pointsFormatter.format(points);

const pad = (n) => String(n).padStart(2, "0");

/**
 * Timestamp -> "02/10 11:58" (aviso de datos guardados). Se compone a mano porque
 * Intl con es-ES ignora `day: "2-digit"` y su salida varía entre navegadores.
 */
export function formatDateTime(timestamp) {
  const d = new Date(timestamp);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
