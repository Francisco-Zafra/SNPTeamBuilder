import { useDraggable, useDroppable } from "@dnd-kit/core";
import { SIDE_ORDER } from "../domain/sides.js";
import { SLOT_META, sideMeta } from "../ui/labels.js";
import { formatPoints } from "../utils/format.js";
import { Icon } from "./Icon.jsx";
import { SideBadge } from "./SideBadge.jsx";

export function RosterPanel({ groups, total, locations, selectedId, dragId, posFor, dropEnabled, actions }) {
  const { setNodeRef } = useDroppable({ id: "roster", data: { type: "roster" }, disabled: !dropEnabled });

  return (
    <section className="p-roster" aria-label="Plantilla" ref={setNodeRef}>
      <div className="ros-intro">
        <h2 className="ros-intro__t">Plantilla · {total} jugadores</h2>
        <p className="ros-intro__s">Toca un jugador para alinearlo · Toca su letra para cambiar la posición</p>
      </div>
      {groups.map((group) => {
        const meta = sideMeta(group.side);
        return (
          <div className="grp" key={group.side}>
            <div className="grp__head">
              <SideBadge side={group.side} />
              <span>{meta.label}</span>
              <span className="grp__count">{group.players.length}</span>
            </div>
            {group.players.length === 0 && <p className="grp__empty">Nadie con esta posición</p>}
            {group.players.map((player) => (
              <PlayerRow
                key={player.id}
                player={player}
                location={locations.get(player.id)}
                selected={selectedId === player.id}
                dragging={dragId === player.id}
                editing={posFor === player.id}
                actions={actions}
              />
            ))}
          </div>
        );
      })}
    </section>
  );
}

function PlayerRow({ player, location, selected, dragging, editing, actions }) {
  const { setNodeRef, listeners, attributes } = useDraggable({
    id: `player:${player.id}`,
    data: { playerId: player.id, from: null },
    attributes: { roleDescription: "arrastrable" },
  });

  const side = sideMeta(player.preferredSide);
  const points = formatPoints(player.points);
  const cls =
    "row" +
    (location ? " is-aligned" : "") +
    (selected && !dragging ? " is-selected" : "") +
    (dragging ? " is-dragging" : "") +
    (editing ? " is-editing" : "");

  return (
    <div className={cls}>
      <div className="row__line">
        <button
          type="button"
          className={`row__pos ${side.cls}`}
          onClick={() => actions.togglePosition(player.id)}
          aria-label={`Posición preferente de ${player.name}: ${side.label}. Cambiar`}
          aria-expanded={editing}
        >
          <span>{side.letter}</span>
          <Icon name="chevronDown" />
        </button>
        <button
          type="button"
          className="row__main"
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          onClick={() => actions.tapPlayer(player.id)}
          aria-pressed={selected}
          aria-label={`${player.name}, ${points} puntos, ${
            location ? `en pista ${location.court} ${SLOT_META[location.slot].label}` : "sin alinear"
          }`}
        >
          <span className="row__txt">
            <span className="row__name">{player.name}</span>
            {location && (
              <span className="chip">
                <Icon name="check" size="xs" />
                Pista {location.court} · {SLOT_META[location.slot].label}
              </span>
            )}
          </span>
          <span className="row__pts">
            <span className="num">{points}</span>
            <span className="unit"> pts</span>
          </span>
        </button>
      </div>
      {editing && <PositionEditor player={player} onSelect={actions.setSide} />}
    </div>
  );
}

function PositionEditor({ player, onSelect }) {
  const current = sideMeta(player.preferredSide);
  return (
    <div className="posed">
      <div className="posed__label">Posición preferente</div>
      <div className="seg" role="group" aria-label={`Posición preferente de ${player.name}: ${current.label}`}>
        {SIDE_ORDER.map((side) => {
          const on = player.preferredSide === side;
          return (
            <button
              key={side}
              type="button"
              className={"seg__opt" + (on ? " is-on" : "")}
              aria-pressed={on}
              onClick={() => onSelect(player.id, side)}
            >
              <SideBadge side={side} />
              <span>{sideMeta(side).label}</span>
            </button>
          );
        })}
      </div>
      <p className="posed__note">Se guarda en este dispositivo. Ambos y Sin asignar nunca generan aviso.</p>
    </div>
  );
}
