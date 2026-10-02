import { formatPoints } from "./format.js";

const EMPTY_SLOT = "—";

const slotLine = (label, slot) =>
  slot
    ? `  ${label}: ${slot.player.name} (${formatPoints(slot.player.points)})`
    : `  ${label}: ${EMPTY_SLOT}`;

/** Texto plano de la alineación para pegar en WhatsApp. `courts` viene de `getCourts`. */
export function buildLineupText({ teamName, lineupName, courts, totalPoints }) {
  const name = lineupName || "Alineación";
  const title = teamName ? `${teamName} — ${name}` : name;

  const blocks = courts.map((c) =>
    [
      `Pista ${c.court} · ${formatPoints(c.points)} pts`,
      slotLine("R", c.reves),
      slotLine("D", c.derecha),
    ].join("\n")
  );

  return [title, ...blocks, `Total: ${formatPoints(totalPoints)} pts`].join("\n\n");
}
