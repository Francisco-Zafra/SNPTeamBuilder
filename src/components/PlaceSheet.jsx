import { useDroppable } from "@dnd-kit/core";
import { SIDES, SLOT_ORDER } from "../domain/sides.js";
import { SLOT_META, sideMeta } from "../ui/labels.js";
import { formatPoints } from "../utils/format.js";
import { compactName } from "../utils/names.js";
import { Icon } from "./Icon.jsx";
import { SideBadge } from "./SideBadge.jsx";
import { slotState } from "./slotState.js";

const ROW = { height: 48, stride: 54 };

/** Hoja inferior con las pistas compactas, en la pestaña Plantilla con un jugador seleccionado. */
export function PlaceSheet({ lineup, courtsByPair, selectedPlayer, dragging, actions }) {
  const side = selectedPlayer.preferredSide;
  const hint = dragging
    ? "Suelta sobre un hueco para colocarlo"
    : side === SIDES.REVES || side === SIDES.DERECHA
      ? `Toca un hueco · los de ${sideMeta(side).label} van marcados`
      : "Toca un hueco para colocarlo";

  return (
    <section className="p-compact" aria-label="Elegir hueco">
      <span className="grab" aria-hidden="true" />
      <div className="pc-who">
        <SideBadge side={side} />
        <div className="pc-who__txt">
          <div className="eyebrow">Colocar a</div>
          <div className="pc-who__name">{selectedPlayer.name}</div>
        </div>
        <span className="num pc-who__pts">{formatPoints(selectedPlayer.points)}</span>
        <button type="button" className="iconbtn" onClick={actions.cancel} aria-label="Cancelar selección">
          <Icon name="close" />
        </button>
      </div>
      <p className="pc-hint">{hint}</p>
      <div className="ccourts" style={{ height: lineup.length * ROW.stride - (ROW.stride - ROW.height) }}>
        {lineup.map((pair) => {
          const court = courtsByPair.get(pair.id);
          return (
            <div
              key={pair.id}
              className="ccourt"
              style={{ transform: `translateY(${(court.court - 1) * ROW.stride}px)` }}
            >
              <div className="ccourt__lbl">
                <span className="ccourt__no">Pista {court.court}</span>
                <span className="num ccourt__pts">{formatPoints(court.points)}</span>
              </div>
              {SLOT_ORDER.map((slot) => (
                <CompactSlot key={slot} court={court} slot={slot} selectedPlayer={selectedPlayer} actions={actions} />
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CompactSlot({ court, slot, selectedPlayer, actions }) {
  const entry = court[slot];
  const player = entry?.player ?? null;
  const meta = SLOT_META[slot];
  const { setNodeRef, isOver } = useDroppable({
    id: `cslot:${court.pairId}:${slot}`,
    data: { type: "slot", pairId: court.pairId, slot },
  });

  const state = slotState({
    entry,
    slot,
    selectedId: selectedPlayer.id,
    selectedSide: selectedPlayer.preferredSide,
    isOver,
  });

  const label = player ? compactName(player) : isOver ? "Soltar aquí" : state.isTarget ? "Colocar" : "Libre";

  return (
    <button
      type="button"
      ref={setNodeRef}
      className={`cslot cslot--${slot}${state.cls}${state.isPreferred ? " is-pref" : ""}`}
      onClick={() => actions.tapSlot(court.pairId, slot)}
      aria-label={`Pista ${court.court}, ${meta.label}: ${
        player ? `${player.name}, ${formatPoints(player.points)} puntos` : "vacío"
      }`}
    >
      <span className="cslot__side">{meta.letter}</span>
      <span className="cslot__name">{label}</span>
      {state.mismatch && (
        <span className="cslot__warn">
          <Icon name="warn" size="xs" />
        </span>
      )}
    </button>
  );
}
