import { SLOT_META } from "../ui/labels.js";

/**
 * Estado visual común a los huecos de pista y a los de la hoja compacta.
 * `selectedId` es el jugador seleccionado o el que se está arrastrando.
 */
export function slotState({ entry, slot, selectedId, selectedSide, isOver }) {
  const playerId = entry?.player.id ?? null;
  const isSelected = playerId != null && playerId === selectedId;
  const isTarget = selectedId != null && !isSelected;

  return {
    playerId,
    isSelected,
    isTarget,
    isPreferred: isTarget && selectedSide === SLOT_META[slot].fits,
    mismatch: Boolean(entry?.mismatch),
    cls:
      (playerId ? " is-filled" : " is-empty") +
      (isTarget ? " is-target" : "") +
      (isSelected ? " is-selected" : "") +
      (isOver ? " is-over" : "") +
      (entry?.mismatch ? " has-warn" : ""),
  };
}
