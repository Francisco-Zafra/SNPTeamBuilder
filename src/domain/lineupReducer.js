import { CONFIG } from "../config.js";
import { SLOT_ORDER } from "./sides.js";

export const createEmptyLineup = (courts = CONFIG.courts) =>
  Array.from({ length: courts }, (_, i) => ({
    id: `pair-${i + 1}`,
    reves: null,
    derecha: null,
  }));

const isSlot = (value) => SLOT_ORDER.includes(value);

/** Hueco que ocupa un jugador: `{ pairId, slot }` o `null`. */
export function findPlayerSlot(lineup, playerId) {
  for (const pair of lineup) {
    for (const slot of SLOT_ORDER) {
      if (pair[slot] === playerId) return { pairId: pair.id, slot };
    }
  }
  return null;
}

/**
 * Coloca un jugador en un hueco (sección 8 de PLAN.md):
 * - no alineado → hueco vacío: se coloca;
 * - no alineado → hueco ocupado: sustituye, el ocupante vuelve a la plantilla;
 * - alineado → hueco vacío: se mueve;
 * - alineado → hueco ocupado: intercambio;
 * - mismo hueco: nada.
 */
function place(lineup, { playerId, pairId, slot }) {
  if (playerId == null || !isSlot(slot)) return lineup;

  const target = lineup.find((pair) => pair.id === pairId);
  if (!target) return lineup;

  const origin = findPlayerSlot(lineup, playerId);
  if (origin && origin.pairId === pairId && origin.slot === slot) return lineup;

  const displaced = target[slot];

  return lineup.map((pair) => {
    let next = pair;
    if (origin && pair.id === origin.pairId) next = { ...next, [origin.slot]: displaced };
    if (pair.id === pairId) next = { ...next, [slot]: playerId };
    return next;
  });
}

function remove(lineup, { pairId, slot }) {
  if (!isSlot(slot)) return lineup;
  const target = lineup.find((pair) => pair.id === pairId);
  if (!target || target[slot] == null) return lineup;

  return lineup.map((pair) => (pair.id === pairId ? { ...pair, [slot]: null } : pair));
}

/** Vacía los huecos de jugadores que ya no están en la plantilla. */
function prune(lineup, { validIds }) {
  const valid = new Set(validIds);
  let changed = false;

  const next = lineup.map((pair) => {
    let updated = pair;
    for (const slot of SLOT_ORDER) {
      if (pair[slot] != null && !valid.has(pair[slot])) {
        updated = { ...updated, [slot]: null };
        changed = true;
      }
    }
    return updated;
  });

  return changed ? next : lineup;
}

export function lineupReducer(lineup, action) {
  switch (action.type) {
    case "PLACE":
      return place(lineup, action);
    case "REMOVE":
      return remove(lineup, action);
    case "CLEAR":
      return createEmptyLineup(lineup.length);
    case "PRUNE":
      return prune(lineup, action);
    default:
      return lineup;
  }
}

/**
 * Valida una alineación leída de localStorage. Conserva los IDs por posición
 * (`pair-1`…`pair-N`), ignora lo que no encaje y elimina jugadores repetidos.
 */
export function restoreLineup(value, courts = CONFIG.courts) {
  const lineup = createEmptyLineup(courts);
  if (!Array.isArray(value)) return lineup;

  const seen = new Set();

  return lineup.map((empty) => {
    const stored = value.find((pair) => pair?.id === empty.id);
    if (!stored) return empty;

    const pair = { ...empty };
    for (const slot of SLOT_ORDER) {
      const id = stored[slot];
      if (typeof id === "string" && id && !seen.has(id)) {
        pair[slot] = id;
        seen.add(id);
      }
    }
    return pair;
  });
}
