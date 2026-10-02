import { commonPrefix, compareLineups, shortLabel } from "../domain/compare.js";
import { formatPoints } from "../utils/format.js";
import { compactName, mediumName } from "../utils/names.js";
import { Icon } from "./Icon.jsx";

const deltaText = (d) => (d === 0 ? "= pts" : `${d > 0 ? "+" : "−"}${formatPoints(Math.abs(d))} pts`);

const joinNames = (players) => players.map(mediumName).join(", ");

function summaryLines(summary, refLabel) {
  const lines = [];
  const { entering, leaving, missing, diffCourts, movedCourts } = summary;
  if (entering.length) lines.push(["in", `${entering.length > 1 ? "Entran" : "Entra"} ${joinNames(entering)}`]);
  if (leaving.length) lines.push(["out", `${leaving.length > 1 ? "Salen" : "Sale"} ${joinNames(leaving)}`]);
  if (missing > 0)
    lines.push(["miss", `${missing === 1 ? "Falta 1 jugador" : `Faltan ${missing} jugadores`} (${10 - missing}/10)`]);
  if (diffCourts.length)
    lines.push([
      "pair",
      `${diffCourts.length > 1 ? "Parejas distintas en" : "Pareja distinta en"} ${diffCourts.map((c) => `P${c}`).join(", ")}`,
    ]);
  if (movedCourts.length)
    lines.push(["mv", `Misma pareja en otra pista: ${movedCourts.map((m) => `P${m.from} → P${m.to}`).join(", ")}`]);
  if (!lines.length) lines.push(["", `Idéntica a ${refLabel}`]);
  return lines;
}

const STATUS_TEXT = { ref: "referencia", same: "igual", moved: "misma pareja en otra pista", diff: "pareja distinta" };

/** Comparación de 2 o 3 alineaciones a pantalla completa (modal en escritorio). Solo lectura. */
export function CompareScreen({ lineups, comparing, playersById, isDesktop, locked, compare }) {
  const cols = comparing.ids.map((id) => lineups.find((l) => l.id === id)).filter(Boolean);
  const result = compareLineups(cols, comparing.ref, playersById);

  const prefix = commonPrefix(cols.map((l) => l.name));
  const label = (lineup) => shortLabel(lineup.name, prefix);
  const wide = cols.length === 2 || isDesktop;
  const nameOf = (player) => (wide ? mediumName(player) : compactName(player));
  const grid = { gridTemplateColumns: `34px repeat(${cols.length}, minmax(0, 1fr))` };
  const ref = result.heads.find((h) => h.isRef).lineup;
  const refLabel = label(ref);

  return (
    <>
      <div className="cmp-scrim" aria-hidden="true" />
      <section className="cmp" role="dialog" aria-label="Comparar alineaciones">
        <div className="cmp__top">
          <button type="button" className="iconbtn" onClick={compare.close} aria-label="Volver a Alineaciones">
            <Icon name="back" />
          </button>
          <div className="cmp__ttl">
            <div className="eyebrow">
              {prefix ? `${prefix} · ` : ""}
              {cols.length} propuestas
            </div>
            <h2 className="cmp__h">Comparar</h2>
          </div>
          {locked && (
            <span className="sync sync--offline" style={{ height: 36 }}>
              <Icon name="cloudOff" size="sm" />
              Sin conexión
            </span>
          )}
        </div>

        <div className="cmp__body">
          <div className="cmp__main">
            <div className="cmp__legend" aria-label="Leyenda">
              <span className="lg">
                <span className="lg__sw lg__sw--diff" />
                Pareja distinta
              </span>
              <span className="lg">
                <span className="lg__sw lg__sw--mv" />
                Misma pareja, otra pista
              </span>
              <span className="lg">
                <Icon name="warn" size="xs" />
                Fuera de su posición
              </span>
            </div>

            <div className="cmp__hrow" style={grid}>
              <span className="cmp__corner">Pista</span>
              {result.heads.map((h) => (
                <button
                  key={h.lineup.id}
                  type="button"
                  className={"cmph" + (h.isRef ? " is-ref" : "")}
                  onClick={() => compare.setRef(h.lineup.id)}
                  aria-pressed={h.isRef}
                  aria-label={`${h.lineup.name}, ${formatPoints(h.total)} puntos, ${h.count} de 10${
                    h.isRef ? ", referencia" : ". Usar como referencia"
                  }`}
                  title={h.lineup.name}
                >
                  <span className="cmph__badge">{h.isRef ? "Referencia" : "Ver como ref."}</span>
                  <span className="cmph__name">{label(h.lineup)}</span>
                  <span className="num cmph__pts">{formatPoints(h.total)}</span>
                  <span className={"cmph__cnt" + (h.count < 10 ? " is-inc" : "")}>{h.count}/10</span>
                </button>
              ))}
            </div>

            {result.rows.map((row) =>
              row.allSame ? (
                <div key={row.court} className="cmp__same" aria-label={`Pista ${row.court}, igual en todas las propuestas`}>
                  <span className="cmp__no">P{row.court}</span>
                  <span className="cmp__samen">
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.cells[0].slots.some((s) => s.player)
                        ? row.cells[0].slots.map((s) => (s.player ? mediumName(s.player) : "—")).join(" + ")
                        : "Pista vacía"}
                    </span>
                    {row.cells[0].slots.some((s) => s.mismatch) && <Icon name="warn" size="xs" />}
                  </span>
                  <span className="cmp__samel">Igual en las {cols.length}</span>
                </div>
              ) : (
                <div key={row.court} className="cmp__row" style={grid}>
                  <span className="cmp__no">P{row.court}</span>
                  {row.cells.map((cell, c) => {
                    const names = cell.slots.map((s) => (s.player ? s.player.name : "falta jugador")).join(" y ");
                    return (
                      <div
                        key={cell.lineupId}
                        className={`cmpc cmpc--${cell.status}`}
                        aria-label={`${label(result.heads[c].lineup)}, pista ${row.court}: ${names}, ${formatPoints(cell.points)} puntos, ${STATUS_TEXT[cell.status]}`}
                      >
                        {cell.status === "moved" && (
                          <span className="cmp__mv">
                            P{cell.fromCourt} → P{row.court}
                          </span>
                        )}
                        {cell.slots.map((s) =>
                          s.player ? (
                            <span key={s.slot} className={"cmpp" + (s.isNew ? " cmpp--new" : "")}>
                              <span className="cmpp__n">{nameOf(s.player)}</span>
                              {s.mismatch && <Icon name="warn" size="xs" />}
                            </span>
                          ) : (
                            <span key={s.slot} className="cmpp cmpp--miss">
                              <span className="cmpp__n">Falta jugador</span>
                            </span>
                          )
                        )}
                        <span className="num cmp__pts">{formatPoints(cell.points)}</span>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          <div className="cmp__sum">
            {result.allSame && (
              <div className="cmp__eq">
                <Icon name="check" />
                <span>Las {cols.length} propuestas son idénticas. Usa una y borra las copias.</span>
              </div>
            )}
            <h3 className="eyebrow">Cambios respecto a {refLabel}</h3>
            {result.summaries.map((summary) => {
              const lineup = cols.find((l) => l.id === summary.lineupId);
              return (
                <div key={summary.lineupId} className="cmps">
                  <div className="cmps__head">
                    <span className="cmps__name">{label(lineup)}</span>
                    <span className="num cmps__delta">{deltaText(summary.delta)}</span>
                  </div>
                  <ul className="cmps__list">
                    {summaryLines(summary, refLabel).map(([kind, text]) => (
                      <li key={text} className={"ln" + (kind ? ` ln--${kind}` : "")}>
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <div className="cmp__foot">
          <p className="note">Toca una cabecera para usarla como referencia</p>
          <button type="button" className="btn btn--primary btn--block" onClick={compare.askUse}>
            <Icon name="check" />
            Usar «{refLabel}»
          </button>
        </div>
      </section>
    </>
  );
}

/** Confirmación de "Usar esta", con la opción de borrar las otras propuestas comparadas. */
export function UseCompareSheet({ lineups, comparing, useDialog, shared, locked, compare }) {
  const target = lineups.find((l) => l.id === comparing.ref);
  const others = comparing.ids.filter((id) => id !== comparing.ref).map((id) => lineups.find((l) => l.id === id)).filter(Boolean);
  if (!target) return null;
  const del = useDialog.del && !locked;
  const n = others.length;

  return (
    <>
      <button type="button" className="scrim" style={{ zIndex: 40 }} onClick={compare.cancelUse} aria-label="Cancelar" />
      <section className="sheet sheet--confirm" style={{ zIndex: 41 }} role="alertdialog" aria-label="Usar esta alineación">
        <span className="grab" aria-hidden="true" />
        <div className="confirm__ic confirm__ic--ok">
          <Icon name="check" />
        </div>
        <h2 className="confirm__t">¿Usar «{target.name}»?</h2>
        <p className="confirm__p">Pasará a ser la alineación activa y volverás a la pestaña Alineación.</p>
        <label className={"usechk" + (del ? " is-on" : "") + (locked ? " is-disabled" : "")}>
          <input type="checkbox" checked={del} disabled={locked} onChange={compare.toggleDelete} />
          <span>
            <span className="usechk__t" style={{ display: "block" }}>
              {n > 1 ? `Borrar las otras ${n} propuestas comparadas` : "Borrar la otra propuesta comparada"}
            </span>
            <span className="usechk__s" style={{ display: "block" }}>
              {others.map((l) => l.name).join(" · ")}
            </span>
          </span>
        </label>
        {del && (
          <p className="usewarn">
            <Icon name="warn" size="sm" />
            {shared ? "Se borrarán para todo el equipo. No se puede deshacer." : "Se borrarán de este dispositivo. No se puede deshacer."}
          </p>
        )}
        {locked && (
          <p className="useoff">
            <Icon name="lock" size="sm" />
            Sin conexión: puedes usarla en este dispositivo, pero no borrar las demás. Hazlo desde Alineaciones al volver
            la conexión.
          </p>
        )}
        <button type="button" className={"btn btn--block " + (del ? "btn--danger" : "btn--primary")} onClick={compare.confirmUse}>
          {del ? `Usar y borrar ${n}` : "Usar esta alineación"}
        </button>
        <button type="button" className="btn btn--soft btn--block" onClick={compare.cancelUse}>
          Cancelar
        </button>
      </section>
    </>
  );
}
