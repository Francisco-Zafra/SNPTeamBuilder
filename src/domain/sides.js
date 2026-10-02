/** Posición preferente de un jugador. */
export const SIDES = Object.freeze({
  REVES: "REVES",
  DERECHA: "DERECHA",
  AMBOS: "AMBOS",
  SIN_ASIGNAR: "SIN_ASIGNAR",
});

/** Orden de los grupos en la plantilla. */
export const SIDE_ORDER = [SIDES.REVES, SIDES.DERECHA, SIDES.AMBOS, SIDES.SIN_ASIGNAR];

/** Huecos de cada pareja. */
export const SLOTS = Object.freeze({
  REVES: "reves",
  DERECHA: "derecha",
});

export const SLOT_ORDER = [SLOTS.REVES, SLOTS.DERECHA];

const SLOT_BY_SIDE = {
  [SIDES.REVES]: SLOTS.REVES,
  [SIDES.DERECHA]: SLOTS.DERECHA,
};

export const isSide = (value) => SIDE_ORDER.includes(value);

/**
 * Valida el mapa `{ [playerId]: Side }` leído de localStorage.
 * Descarta valores desconocidos y `SIN_ASIGNAR` (es el valor por defecto).
 */
export function restoreSides(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const sides = {};
  for (const [id, side] of Object.entries(value)) {
    if (isSide(side) && side !== SIDES.SIN_ASIGNAR) sides[id] = side;
  }
  return sides;
}

/** Devuelve un nuevo mapa de posiciones con la de `playerId` actualizada. */
export function setSide(sides, playerId, side) {
  const next = { ...sides };
  if (side === SIDES.SIN_ASIGNAR || !isSide(side)) delete next[playerId];
  else next[playerId] = side;
  return next;
}

/**
 * Indica si el jugador está colocado en el hueco contrario a su preferencia.
 * `AMBOS` y `SIN_ASIGNAR` nunca generan aviso.
 */
export function hasPositionMismatch(player, slot) {
  const preferredSlot = SLOT_BY_SIDE[player?.preferredSide];
  return Boolean(preferredSlot) && preferredSlot !== slot;
}
