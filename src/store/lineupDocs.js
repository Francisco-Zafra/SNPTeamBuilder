import { createEmptyLineup, lineupReducer, restoreLineup } from "../domain/lineupReducer.js";

export const DEFAULT_LINEUP_NAME = "Alineación";
export const MAX_NAME_LENGTH = 80;

const cleanName = (name) => String(name ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);

/** Fecha opcional "AAAA-MM-DD" o `null`. */
const cleanDate = (date) => (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null);

/** Campos de una alineación nueva, vacía o copiada de `from`. */
export function newLineupFields({ name, date, from } = {}, now = Date.now()) {
  return {
    name: cleanName(name) || DEFAULT_LINEUP_NAME,
    date: cleanDate(date),
    pairs: from ? restoreLineup(from.pairs) : createEmptyLineup(),
    createdAt: now,
    updatedAt: now,
  };
}

export function lineupMetaFields({ name, date }) {
  const fields = {};
  if (name !== undefined) fields.name = cleanName(name) || DEFAULT_LINEUP_NAME;
  if (date !== undefined) fields.date = cleanDate(date);
  return fields;
}

/** Valida un documento leído (localStorage o Firestore); `null` si no sirve. */
export function restoreLineupDoc(id, data) {
  if (typeof id !== "string" || !id || !data || typeof data !== "object") return null;
  const toMillis = (v) => (typeof v === "number" ? v : typeof v?.toMillis === "function" ? v.toMillis() : 0);
  return {
    id,
    name: cleanName(data.name) || DEFAULT_LINEUP_NAME,
    date: cleanDate(data.date),
    pairs: restoreLineup(data.pairs),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

/** Más reciente primero; a igualdad, por nombre. */
export const sortLineups = (lineups) =>
  [...lineups].sort((a, b) => b.updatedAt - a.updatedAt || a.name.localeCompare(b.name, "es-ES"));

/**
 * Aplica una acción del reducer limpiando antes los jugadores que ya no están
 * en la plantilla (`validIds`), para que no viajen IDs fantasma.
 */
export function applyLineupAction(pairs, action, validIds) {
  const current = restoreLineup(pairs);
  const pruned = validIds ? lineupReducer(current, { type: "PRUNE", validIds }) : current;
  const next = lineupReducer(pruned, action);
  return next === current ? current : next;
}
