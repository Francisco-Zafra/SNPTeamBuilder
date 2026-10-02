import { compareByPoints } from "../domain/roster.js";
import { SLOT_META, sideMeta } from "../ui/labels.js";
import { formatPoints } from "../utils/format.js";
import { Icon } from "./Icon.jsx";
import { SideBadge } from "./SideBadge.jsx";

/** Hoja para elegir jugador al tocar un hueco vacío sin selección (pestaña Alineación). */
export function PickSheet({ target, court, players, locations, onPick, onClose }) {
  const meta = SLOT_META[target.slot];
  const byAvailability = (a, b) =>
    (locations.has(a.id) ? 1 : 0) - (locations.has(b.id) ? 1 : 0) || compareByPoints(a, b);

  const groups = [
    {
      title: `Encajan en ${meta.label}`,
      warn: false,
      players: players.filter((p) => p.preferredSide !== meta.opposite).sort(byAvailability),
    },
    {
      title: `Prefieren ${sideMeta(meta.opposite).label} · saldrá aviso`,
      warn: true,
      players: players.filter((p) => p.preferredSide === meta.opposite).sort(byAvailability),
    },
  ].filter((g) => g.players.length);

  return (
    <>
      <button type="button" className="scrim" onClick={onClose} aria-label="Cerrar" />
      <section className="sheet sheet--pick" role="dialog" aria-label="Elegir jugador">
        <span className="grab" aria-hidden="true" />
        <div className="sheet__head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="eyebrow">Elegir jugador para</div>
            <div className="sheet__title">
              Pista {court.court} · {meta.label}
            </div>
          </div>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <div className="sheet__body">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="pgrp__t">
                {group.warn && <Icon name="warn" size="sm" />}
                {group.title}
              </div>
              {group.players.map((player) => {
                const location = locations.get(player.id);
                const points = formatPoints(player.points);
                return (
                  <button
                    key={player.id}
                    type="button"
                    className={"prow" + (location ? " is-aligned" : "")}
                    onClick={() => onPick(player.id)}
                    aria-label={`${player.name}, ${points} puntos${location ? `, ya en pista ${location.court}` : ""}`}
                  >
                    <SideBadge side={player.preferredSide} />
                    <span className="prow__name">{player.name}</span>
                    {location && (
                      <span className="chip">
                        P{location.court} · {SLOT_META[location.slot].letter}
                      </span>
                    )}
                    <span className="num prow__pts">{points}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function ConfirmClearSheet({ count, onConfirm, onCancel }) {
  return (
    <>
      <button type="button" className="scrim" onClick={onCancel} aria-label="Cancelar" />
      <section className="sheet sheet--confirm" role="alertdialog" aria-label="Limpiar alineación">
        <span className="grab" aria-hidden="true" />
        <div className="confirm__ic">
          <Icon name="trash" />
        </div>
        <h2 className="confirm__t">¿Limpiar alineación?</h2>
        <p className="confirm__p">
          Se vaciarán las 5 pistas ({count} {count === 1 ? "jugador colocado" : "jugadores colocados"}). Las
          posiciones preferentes no cambian.
        </p>
        <button type="button" className="btn btn--danger btn--block" onClick={onConfirm}>
          Sí, limpiar alineación
        </button>
        <button type="button" className="btn btn--soft btn--block" onClick={onCancel} autoFocus>
          Cancelar
        </button>
      </section>
    </>
  );
}
