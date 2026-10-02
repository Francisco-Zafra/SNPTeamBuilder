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

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** "2026-10-10" -> "Sáb 10/10". Vacío si no hay fecha válida. */
export function formatShortDate(isoDate) {
  if (typeof isoDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getMonth() !== m - 1) return "";
  return `${DAYS[date.getDay()]} ${pad(d)}/${pad(m)}`;
}

/** Tiempo transcurrido: "ahora mismo", "hace 5 min", "hace 3 h", "hace 6 días", "hace 3 semanas"… */
export function formatRelative(timestamp, now = Date.now()) {
  const minutes = Math.floor(Math.max(0, now - timestamp) / 60000);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return days === 1 ? "ayer" : `hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (days < 60) return `hace ${weeks} semanas`;
  return `el ${formatDateTime(timestamp).split(" ")[0]}`;
}
