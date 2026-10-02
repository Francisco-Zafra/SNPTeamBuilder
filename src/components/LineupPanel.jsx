import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CONFIG } from "../config.js";
import { SLOT_ORDER } from "../domain/sides.js";
import { SLOT_META, sideMeta } from "../ui/labels.js";
import { formatPoints } from "../utils/format.js";
import { shortName } from "../utils/names.js";
import { Icon } from "./Icon.jsx";
import { slotState } from "./slotState.js";

const MAX_PLAYERS = CONFIG.courts * 2;

// Altura fija de cada pista + separación: la posición se anima con translateY.
const LAYOUT = {
  tabs: { height: 146, stride: 154 },
  desktop: { height: 98, stride: 108 },
};

export function LineupPanel({
  lineup,
  courtsByPair,
  totalPoints,
  count,
  isDesktop,
  selectedPlayer,
  dropEnabled,
  locked,
  changed = [],
  hasLineup = true,
  emptyText,
  onNewLineup,
  actions,
}) {
  const { height, stride } = LAYOUT[isDesktop ? "desktop" : "tabs"];
  const canAct = count > 0;

  if (!hasLineup) {
    return (
      <section className="p-lineup" aria-label="Alineación">
        <div className="lempty" style={{ paddingTop: 56 }}>
          <div className="state__ic">
            <Icon name="court" />
          </div>
          <h2 className="lempty__t">Aún no hay alineaciones</h2>
          <p className="lempty__p">{emptyText}</p>
          <button
            type="button"
            className="btn btn--primary"
            style={{ minWidth: 220, marginTop: 8 }}
            onClick={onNewLineup}
            disabled={locked}
          >
            <Icon name="plus" />
            Crear alineación
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="p-lineup" aria-label="Alineación">
      <div className="sum">
        <div className="sum__row">
          <div>
            <div className="eyebrow">Total alineación</div>
            <div className="sum__total">
              {formatPoints(totalPoints)} <span className="unit">pts</span>
            </div>
          </div>
          <div className="sum__count">
            <div className="sum__countv">
              {count}
              <span className="sum__of">/{MAX_PLAYERS}</span>
            </div>
            <div className="eyebrow">jugadores</div>
          </div>
        </div>
        <div className="sum__row2">
          <div className="dots" aria-hidden="true">
            {Array.from({ length: MAX_PLAYERS }, (_, i) => (
              <span key={i} className={"dot" + (i < count ? " is-on" : "")} />
            ))}
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm tabs-only"
            onClick={actions.askClear}
            disabled={!canAct}
          >
            <Icon name="trash" size="sm" />
            Limpiar
          </button>
        </div>
        <p className="sum__rule">
          <Icon name="sort" size="sm" />
          Pista 1 = pareja con más puntos (normativa SNP)
        </p>
      </div>

      <div className="desk-only desk-hint">
        <Icon name="info" size="sm" />
        {selectedPlayer
          ? `Toca un hueco para colocar a ${selectedPlayer.name} · o arrástralo`
          : "Toca un jugador y después un hueco, o arrástralo. Suelta en la plantilla para quitarlo."}
      </div>

      {count === 0 && !locked && (
        <div className="onb">
          <h2 className="onb__title">Monta la alineación</h2>
          <ol className="onb__steps">
            <li>
              <span className="onb__n">1</span>Toca un jugador de la plantilla.
            </li>
            <li>
              <span className="onb__n">2</span>Toca un hueco de Revés o Derecha.
            </li>
            <li>
              <span className="onb__n">3</span>Las pistas se ordenan solas por puntos.
            </li>
          </ol>
          <button type="button" className="btn btn--primary btn--block tabs-only" onClick={() => actions.goTab("roster")}>
            Ir a la plantilla
          </button>
        </div>
      )}

      {/* Orden del DOM fijo (por pareja) para que la transición de translateY anime la reordenación. */}
      <div className="courts" style={{ height: lineup.length * stride - (stride - height) }}>
        {lineup.map((pair) => {
          const court = courtsByPair.get(pair.id);
          return (
            <Court
              key={pair.id}
              court={court}
              y={(court.court - 1) * stride}
              selectedPlayer={selectedPlayer}
              dropEnabled={dropEnabled && !locked}
              locked={locked}
              changed={changed.includes(pair.id)}
              actions={actions}
            />
          );
        })}
      </div>
    </section>
  );
}

function Court({ court, y, selectedPlayer, dropEnabled, locked, changed, actions }) {
  const warn = SLOT_ORDER.some((slot) => court[slot]?.mismatch);
  return (
    <article
      className={"court" + (changed ? " is-changed" : "")}
      style={{ transform: `translateY(${y}px)` }}
      aria-label={`Pista ${court.court}, ${formatPoints(court.points)} puntos`}
    >
      <div className="court__head">
        <span className="court__badge">{court.court}</span>
        <span className="court__title">Pista {court.court}</span>
        {changed && <span className="court__chg">Actualizada</span>}
        {warn && (
          <span className="court__warn" title="Hay un jugador fuera de su posición preferente">
            <Icon name="warn" size="sm" />
          </span>
        )}
        <span className="court__pts">
          {formatPoints(court.points)} <span className="unit">pts</span>
        </span>
      </div>
      <div className="court__slots">
        {SLOT_ORDER.map((slot) => (
          <Slot
            key={slot}
            court={court}
            slot={slot}
            selectedPlayer={selectedPlayer}
            dropEnabled={dropEnabled}
            locked={locked}
            actions={actions}
          />
        ))}
      </div>
    </article>
  );
}

function Slot({ court, slot, selectedPlayer, dropEnabled, locked, actions }) {
  const entry = court[slot];
  const player = entry?.player ?? null;
  const meta = SLOT_META[slot];

  const drop = useDroppable({
    id: `slot:${court.pairId}:${slot}`,
    data: { type: "slot", pairId: court.pairId, slot },
    disabled: !dropEnabled,
  });
  const drag = useDraggable({
    id: `slotplayer:${court.pairId}:${slot}`,
    data: { playerId: player?.id, from: { pairId: court.pairId, slot } },
    attributes: { roleDescription: "arrastrable" },
    disabled: !player || locked,
  });

  const state = slotState({
    entry,
    slot,
    selectedId: selectedPlayer?.id ?? null,
    selectedSide: selectedPlayer?.preferredSide,
    isOver: drop.isOver,
  });

  const points = player ? formatPoints(player.points) : "";
  const emptyText = locked
    ? "Vacío"
    : drop.isOver
      ? "Soltar aquí"
      : state.isTarget
        ? "Colocar aquí"
        : `Añadir ${meta.label.toLowerCase()}`;

  return (
    <div
      ref={drop.setNodeRef}
      className={`slot slot--${slot}${state.cls}${drag.isDragging ? " is-dragging" : ""}`}
    >
      <button
        type="button"
        className="slot__tap"
        ref={drag.setNodeRef}
        // Hueco vacío: sin atributos de arrastre (dnd-kit pondría aria-disabled y lo anunciaría desactivado).
        {...(player && !locked ? { ...drag.attributes, ...drag.listeners } : {})}
        onClick={() => actions.tapSlot(court.pairId, slot)}
        aria-label={`Pista ${court.court}, ${meta.label}: ${
          player
            ? `${player.name}, ${points} puntos${state.mismatch ? ", fuera de su posición preferente" : ""}`
            : "vacío"
        }`}
      >
        <span className="slot__side">{meta.letter}</span>
        <span className="slot__body">
          {player ? (
            <>
              <span className="slot__name" title={player.name}>
                {shortName(player)}
              </span>
              <span className="slot__meta">
                <span className="num">{points}</span>
                {state.mismatch && (
                  <span className="slot__warn">
                    <Icon name="warn" size="xs" />
                    prefiere {sideMeta(player.preferredSide).label}
                  </span>
                )}
              </span>
            </>
          ) : (
            <span className="slot__empty">{emptyText}</span>
          )}
        </span>
      </button>
      {locked ? (
        player && (
          <span className="slot__lock" aria-hidden="true">
            <Icon name="lock" size="sm" />
          </span>
        )
      ) : player ? (
        <button
          type="button"
          className="slot__x"
          onClick={() => actions.remove(court.pairId, slot)}
          aria-label={`Quitar a ${player.name} de la pista ${court.court}`}
        >
          <Icon name="close" />
        </button>
      ) : (
        <span className="slot__plus" aria-hidden="true">
          <Icon name="plus" />
        </span>
      )}
    </div>
  );
}
