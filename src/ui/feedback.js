import { findPlayerSlot } from "../domain/lineupReducer.js";
import { getCourts } from "../domain/lineupSelectors.js";
import { hasPositionMismatch } from "../domain/sides.js";
import { formatPoints } from "../utils/format.js";
import { shortName } from "../utils/names.js";
import { SLOT_META, sideMeta } from "./labels.js";

const courtOrder = (courts) => courts.map((c) => c.pairId).join();

/**
 * Aviso tras un PLACE. `before`/`after` son la alineación antes y después.
 * Devuelve `{ title, sub, kind }` o `null` si no hubo cambio.
 */
export function placementFeedback({ before, after, action, playersById }) {
  if (before === after) return null;

  const player = playersById.get(action.playerId);
  if (!player) return null;

  const courtsBefore = getCourts(before, playersById);
  const courtsAfter = getCourts(after, playersById);
  const court = courtsAfter.find((c) => c.pairId === action.pairId);
  const slotLabel = SLOT_META[action.slot].label;

  const targetBefore = before.find((p) => p.id === action.pairId)?.[action.slot] ?? null;
  const displaced = targetBefore ? playersById.get(targetBefore) : null;
  const wasPlaced = findPlayerSlot(before, action.playerId) != null;
  const mismatch = hasPositionMismatch(player, action.slot);

  let sub;
  if (mismatch) sub = `Aviso: prefiere ${sideMeta(player.preferredSide).label}`;
  else if (displaced && wasPlaced) sub = `Intercambiado con ${shortName(displaced)}`;
  else if (displaced) sub = `${shortName(displaced)} vuelve a la plantilla`;
  else if (courtOrder(courtsBefore) !== courtOrder(courtsAfter))
    sub = "Las pistas se han reordenado por puntos";
  else sub = `Pista ${court.court} · ${formatPoints(court.points)} pts`;

  return {
    title: `${shortName(player)} → Pista ${court.court} · ${slotLabel}`,
    sub,
    kind: mismatch ? "warn" : "ok",
  };
}

export const removalFeedback = (player, slot) => ({
  title: `${shortName(player)} vuelve a la plantilla`,
  sub: `Hueco de ${SLOT_META[slot].label} libre`,
  kind: "ok",
});

export const sideFeedback = (player, side, mode = "local") => ({
  title: `${shortName(player)} · ${sideMeta(side).label}`,
  sub: mode === "shared" ? "Posición preferente compartida con el equipo" : "Posición preferente guardada en este dispositivo",
  kind: "ok",
});

export const aliasFeedback = (player, alias, mode = "local") => ({
  title: alias ? `${player.fullName} → «${alias}»` : `${player.fullName} sin alias`,
  sub: mode === "shared" ? "Se ve así para todo el equipo" : "Se ve así en este dispositivo",
  kind: "ok",
});

export const MESSAGES = {
  copied: { title: "Alineación copiada", sub: "Pégala en el grupo de WhatsApp", kind: "ok" },
  copyFailed: { title: "No se ha podido copiar", sub: "Este navegador no permite copiar aquí", kind: "warn" },
  cleared: { title: "Alineación vacía", sub: "Las posiciones preferentes se mantienen", kind: "ok" },
  pickFirst: { title: "Primero toca un jugador", sub: "Después toca este hueco para colocarlo", kind: "warn" },
  stillOffline: { title: "Sigue sin conexión", sub: "Se muestran los datos guardados", kind: "warn" },
  readOnly: {
    title: "Sin conexión: no se puede editar",
    sub: "Puedes ver y copiar la alineación. Podrás editar al volver la conexión.",
    kind: "warn",
  },
  notReady: { title: "Conectando…", sub: "Espera un momento para editar", kind: "warn" },
  saveFailed: { title: "No se ha guardado el cambio", sub: "Comprueba la conexión y vuelve a intentarlo", kind: "warn" },
  lineupGone: { title: "Esta alineación ya no existe", sub: "Otra persona la ha borrado", kind: "warn" },
  linkCopied: { title: "Enlace copiado", sub: "Pégalo en el grupo de WhatsApp", kind: "ok" },
  joined: { title: "Estás en el espacio del equipo", sub: "Los cambios se comparten al momento", kind: "ok" },
  left: { title: "Has salido del espacio", sub: "Este dispositivo vuelve al modo local", kind: "ok" },
  badJoinLink: { title: "Ese enlace no tiene código", sub: "Copia el enlace completo que te ha mandado el capitán", kind: "warn" },
  remoteUpdate: (courts) => ({
    title: "Alineación actualizada desde otro dispositivo",
    sub: !courts.length
      ? "Cambios desde otro dispositivo"
      : courts.length === 1
        ? `Ha cambiado la Pista ${courts[0]}`
        : `Han cambiado las pistas ${courts.slice(0, -1).join(", ")} y ${courts.at(-1)}`,
    kind: "info",
  }),
  lineupCreated: (fromName) => ({
    title: "Alineación creada",
    sub: fromName ? `Copiada de «${fromName}»` : "Empieza con las 5 pistas vacías",
    kind: "ok",
  }),
  lineupRenamed: (name) => ({ title: "Alineación renombrada", sub: name, kind: "ok" }),
  lineupDeleted: (name) => ({ title: "Alineación borrada", sub: `«${name}»`, kind: "ok" }),
  using: (name, deleted) => ({
    title: `Usando «${name}»`,
    sub: deleted
      ? `Se ${deleted > 1 ? `han borrado ${deleted} propuestas` : "ha borrado 1 propuesta"}`
      : "Las demás propuestas siguen en Alineaciones",
    kind: "ok",
  }),
  viewing: (name) => ({ title: `Viendo «${name}»`, sub: "Cambia de alineación desde la cabecera", kind: "ok" }),
  refreshed: (count) => ({ title: "Plantilla actualizada", sub: `${count} jugadores descargados ahora`, kind: "ok" }),
};
