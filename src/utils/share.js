import { SLOT_ORDER } from "../domain/sides.js";
import { formatShortDate } from "./format.js";
import { uniqueShortNames } from "./names.js";

const EMPTY_SLOT = "—";

/** Negrita de WhatsApp: `*texto*`. */
const bold = (text) => `*${text}*`;

/**
 * Texto de la alineación para pegar en WhatsApp, compacto: una línea por pista
 * («Pista 1: David - Fran», revés primero), sin puntos. Título «nombre - fecha»
 * (la fecha solo si la tiene). `courts` viene de `getCourts`.
 */
export function buildLineupText({ lineupName, lineupDate, courts }) {
  const title = [lineupName || "Alineación", formatShortDate(lineupDate)].filter(Boolean).join(" - ");
  const names = uniqueShortNames(courts.flatMap((c) => SLOT_ORDER.map((slot) => c[slot]?.player).filter(Boolean)));

  const lines = courts.map((c) => {
    const pair = SLOT_ORDER.map((slot) => (c[slot] ? names.get(c[slot].player.id) : EMPTY_SLOT));
    return `${bold(`Pista ${c.court}:`)} ${pair.every((n) => n === EMPTY_SLOT) ? EMPTY_SLOT : pair.join(" - ")}`;
  });

  return [`🎾 ${bold(title)}`, lines.join("\n"), "💪 ¡Vamos equipo!"].join("\n\n");
}
