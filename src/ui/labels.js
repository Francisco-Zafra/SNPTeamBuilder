import { SIDES, SLOTS } from "../domain/sides.js";

/** Letra, texto y clase de color de cada posición preferente. */
export const SIDE_META = {
  [SIDES.REVES]: { letter: "R", label: "Revés", cls: "s-reves" },
  [SIDES.DERECHA]: { letter: "D", label: "Derecha", cls: "s-derecha" },
  [SIDES.AMBOS]: { letter: "A", label: "Ambos", cls: "s-ambos" },
  [SIDES.SIN_ASIGNAR]: { letter: "–", label: "Sin asignar", cls: "s-none" },
};

/** Letra y texto de cada hueco, y la posición que encaja en él. */
export const SLOT_META = {
  [SLOTS.REVES]: { letter: "R", label: "Revés", fits: SIDES.REVES, opposite: SIDES.DERECHA },
  [SLOTS.DERECHA]: { letter: "D", label: "Derecha", fits: SIDES.DERECHA, opposite: SIDES.REVES },
};

export const sideMeta = (side) => SIDE_META[side] ?? SIDE_META[SIDES.SIN_ASIGNAR];
