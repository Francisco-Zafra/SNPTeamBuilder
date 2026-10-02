import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
import { MAX_ALIAS_LENGTH } from "../domain/aliases.js";
import { SIDE_ORDER } from "../domain/sides.js";
import { SLOT_META, sideMeta } from "../ui/labels.js";
import { formatPoints } from "../utils/format.js";
import { Icon } from "./Icon.jsx";
import { SideBadge } from "./SideBadge.jsx";

export function RosterPanel({ groups, total, locations, selectedId, dragId, posFor, dropEnabled, shared, locked, actions }) {
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
                shared={shared}
                locked={locked}
                actions={actions}
              />
            ))}
          </div>
        );
      })}
    </section>
  );
}

function PlayerRow({ player, location, selected, dragging, editing, shared, locked, actions }) {
  const { setNodeRef, listeners, attributes } = useDraggable({
    id: `player:${player.id}`,
    data: { playerId: player.id, from: null },
    attributes: { roleDescription: "arrastrable" },
    disabled: locked,
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
          {...(locked ? {} : { ...attributes, ...listeners })}
          onClick={() => actions.tapPlayer(player.id)}
          aria-pressed={selected}
          aria-label={`${player.alias ? `${player.alias} (${player.fullName})` : player.name}, ${points} puntos, ${
            location ? `en pista ${location.court} ${SLOT_META[location.slot].label}` : "sin alinear"
          }`}
        >
          <span className="row__txt">
            <span className="row__name">{player.name}</span>
            {player.alias && <span className="row__full">{player.fullName}</span>}
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
      {editing && (
        <PositionEditor player={player} shared={shared} onSelect={actions.setSide} onAlias={actions.setAlias} />
      )}
    </div>
  );
}

function PositionEditor({ player, shared, onSelect, onAlias }) {
  const current = sideMeta(player.preferredSide);
  const ref = useRef(null);
  // Si el jugador está abajo en la lista, que el panel (con el alias) quede a la vista.
  useEffect(() => {
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);
  return (
    <div className="posed" ref={ref}>
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
      <p className="posed__note">
        {shared ? "Se comparte con el equipo." : "Se guarda en este dispositivo."} Ambos y Sin asignar nunca generan
        aviso.
      </p>
      <AliasField player={player} onSave={onAlias} />
    </div>
  );
}

/** Alias del jugador: se guarda al salir del campo o con Enter. */
function AliasField({ player, onSave }) {
  const [value, setValue] = useState(player.alias ?? "");
  const id = `alias-${player.id}`;
  return (
    <div className="fld alias">
      <label className="posed__label" htmlFor={id}>
        Alias <span className="fld__opt">(opcional)</span>
      </label>
      <div className="joinrow">
        <input
          id={id}
          className="inp"
          type="text"
          value={value}
          maxLength={MAX_ALIAS_LENGTH}
          placeholder={`Ej.: ${player.firstName?.split(" ")[0] || "Fran"}`}
          autoComplete="off"
          enterKeyHint="done"
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => onSave(player.id, value)}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        />
        {player.alias && (
          <button
            type="button"
            className="btn btn--soft"
            onClick={() => {
              setValue("");
              onSave(player.id, "");
            }}
          >
            Quitar
          </button>
        )}
      </div>
      <p className="posed__note">Si tiene alias, se muestra siempre en lugar de «{player.fullName}».</p>
    </div>
  );
}
