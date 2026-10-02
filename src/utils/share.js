const EMPTY_SLOT = "—";

/** Negrita de WhatsApp: `*texto*`. */
const bold = (text) => `*${text}*`;

const slotLine = (label, slot) => `${label}: ${slot ? slot.player.name : EMPTY_SLOT}`;

/**
 * Texto de la alineación para pegar en WhatsApp: nombre de la alineación y las
 * parejas de cada pista, sin puntos. `courts` viene de `getCourts`.
 */
export function buildLineupText({ lineupName, courts }) {
  const blocks = courts.map((c) =>
    [bold(`Pista ${c.court}`), slotLine("R", c.reves), slotLine("D", c.derecha)].join("\n")
  );
  return [bold(lineupName || "Alineación"), ...blocks].join("\n\n");
}
