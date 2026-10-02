import { MAX_COMPARE } from "../domain/compare.js";
import { getLineupStats } from "../domain/lineupSelectors.js";
import { formatPoints, formatRelative, formatShortDate } from "../utils/format.js";
import { Icon } from "./Icon.jsx";

const SYNC = {
  ok: { icon: "cloudOk", label: "Sincronizado", aria: "Sincronizado con el equipo. Abrir espacio del equipo" },
  saving: { spinner: true, label: "Guardando…", aria: "Guardando cambios" },
  connecting: { spinner: true, label: "Conectando…", aria: "Conectando con el equipo" },
  offline: { icon: "cloudOff", label: "Sin conexión", aria: "Sin conexión: solo lectura" },
  local: { icon: "phone", label: "Local", aria: "Modo local: solo en este dispositivo. Compartir con el equipo" },
};

const SYNC_LINE = {
  ok: "Sincronizado · en tiempo real",
  saving: "Guardando cambios…",
  connecting: "Conectando…",
  offline: "Sin conexión · solo lectura",
  local: "Solo en este dispositivo",
};

const syncCls = (state) => (state === "connecting" ? "saving" : state);

/** Cabecera de dos filas: equipo + espacio · selector de alineación + sincronización. */
export function SpaceHeader({ teamName, shared, syncAvailable, activeLineup, syncState, canAct, onOpenLists, onOpenSpace, onClear, onShare, onCopy }) {
  const sync = SYNC[syncState];
  const date = formatShortDate(activeLineup?.date);
  return (
    <header className="hdr hdr--v2">
      <div className="hdr__r1">
        <span className="hdr__mark" aria-hidden="true">
          <Icon name="ball" />
        </span>
        <h1 className="hdr__team">{teamName ?? "Alineación SNP"}</h1>
        {syncAvailable && (
          <button
            type="button"
            className={"teambtn" + (shared ? " teambtn--icon" : " teambtn--cta")}
            onClick={onOpenSpace}
            aria-label={shared ? "Espacio del equipo: invitar o salir" : "Compartir con el equipo"}
          >
            <Icon name="userPlus" />
            {!shared && <span>Compartir</span>}
          </button>
        )}
      </div>
      <div className="hdr__r2">
        <button
          type="button"
          className="lsel"
          onClick={onOpenLists}
          aria-label={
            activeLineup
              ? `Alineación activa: ${activeLineup.name}. Cambiar de alineación`
              : "Elegir o crear alineación"
          }
        >
          <span className="lsel__txt">
            <span className="lsel__eye">{activeLineup ? `Alineación${date ? ` · ${date}` : ""}` : "Sin alineación"}</span>
            <span className="lsel__name">{activeLineup ? activeLineup.name : "Crear o elegir alineación"}</span>
          </span>
          <Icon name="chevronDown" />
        </button>
        {syncAvailable && (
          <button
            type="button"
            className={`sync sync--${syncCls(syncState)}`}
            onClick={onOpenSpace}
            aria-label={sync.aria}
          >
            {sync.spinner ? <span className="spinner" aria-hidden="true" /> : <Icon name={sync.icon} size={syncState === "ok" ? undefined : "sm"} />}
            <span className="sync__lbl">{sync.label}</span>
          </button>
        )}
      </div>
      <div className="hdr__actions">
        <button type="button" className="btn btn--ghost" onClick={onClear} disabled={!canAct}>
          <Icon name="trash" />
          Limpiar
        </button>
        <button type="button" className="btn btn--soft" onClick={onShare} disabled={!canAct}>
          <Icon name="share" />
          Compartir
        </button>
        <button type="button" className="btn btn--primary" onClick={onCopy} disabled={!canAct}>
          <Icon name="copy" />
          Copiar alineación
        </button>
      </div>
    </header>
  );
}

export function OfflineBar() {
  return (
    <div className="offbar" role="status">
      <Icon name="lock" />
      <div>
        <div className="offbar__t">Sin conexión · solo lectura</div>
        <div className="offbar__s">Puedes ver y copiar. Podrás editar al volver la conexión.</div>
      </div>
    </div>
  );
}

function Sheet({ cls = "sheet--confirm", label, role = "dialog", onClose, children }) {
  return (
    <>
      <button type="button" className="scrim" onClick={onClose} aria-label="Cerrar" />
      <section className={`sheet ${cls}`} role={role} aria-label={label}>
        <span className="grab" aria-hidden="true" />
        {children}
      </section>
    </>
  );
}

/** Lista de alineaciones con menú ⋯ por fila (renombrar, duplicar, borrar). */
const SELECT_HINTS = [
  `Marca 2 o ${MAX_COMPARE} alineaciones para compararlas`,
  "1 marcada · marca al menos otra",
  `2 marcadas · puedes añadir ${MAX_COMPARE - 2} más`,
  `Máximo ${MAX_COMPARE} · desmarca una para cambiarla`,
];

export function LineupsSheet({
  lineups,
  activeId,
  menuFor,
  playersById,
  shared,
  locked,
  lists,
  onShareSpace,
  selecting,
  picked,
  compare,
}) {
  const now = Date.now();
  const emptyText = shared ? "Crea la primera; el equipo la verá al momento." : "Crea la primera para empezar a montar parejas.";
  const atLimit = picked.length >= MAX_COMPARE;
  return (
    <Sheet cls="sheet--list" label={selecting ? "Comparar alineaciones" : "Alineaciones"} onClose={lists.close}>
      <div className="sheet__head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="eyebrow">
            {shared ? "Espacio del equipo" : "En este dispositivo"} · {lineups.length}
          </div>
          <div className="sheet__title">{selecting ? "Comparar" : "Alineaciones"}</div>
        </div>
        {!selecting && lineups.length >= 2 && (
          <button type="button" className="btn btn--soft btn--sm" onClick={compare.startSelect}>
            <Icon name="compare" size="sm" />
            Comparar
          </button>
        )}
        <button type="button" className="iconbtn" onClick={lists.close} aria-label="Cerrar">
          <Icon name="close" />
        </button>
      </div>
      <div className="sheet__body">
        {selecting ? (
          <p className={"sel-hint" + (atLimit ? " is-limit" : "")} role="status" aria-live="polite">
            {SELECT_HINTS[Math.min(picked.length, 3)]}
          </p>
        ) : (
          <div className="lnew">
            <button type="button" className="btn btn--primary btn--block" onClick={lists.openNew} disabled={locked}>
              <Icon name="plus" />
              Nueva alineación
            </button>
          </div>
        )}
        {lineups.length === 0 && (
          <div className="lempty">
            <div className="state__ic">
              <Icon name="list" />
            </div>
            <h3 className="lempty__t">Aún no hay alineaciones</h3>
            <p className="lempty__p">{emptyText}</p>
          </div>
        )}
        {lineups.map((lineup) => {
          const active = lineup.id === activeId;
          const open = menuFor === lineup.id;
          const { totalPoints, count } = getLineupStats(lineup.pairs, playersById);
          const date = formatShortDate(lineup.date);
          const meta = (
            <span className="lrow__meta">
              {date && (
                <>
                  <span>{date}</span>
                  <span className="sep">·</span>
                </>
              )}
              <span>
                <span className="num">{formatPoints(totalPoints)}</span> pts
              </span>
              <span className="sep">·</span>
              <span>
                <span className="num">{count}</span>/10
              </span>
            </span>
          );
          if (selecting) {
            const checked = picked.includes(lineup.id);
            const disabled = !checked && atLimit;
            return (
              <label
                key={lineup.id}
                className={"lrow--sel" + (checked ? " is-checked" : "") + (disabled ? " is-disabled" : "")}
              >
                <input
                  type="checkbox"
                  className="lchk"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => compare.toggle(lineup.id)}
                />
                <span className="lrow__txt">
                  <span className="lrow__name">{lineup.name}</span>
                  {meta}
                  <span className="lrow__mod">Modificada {formatRelative(lineup.updatedAt, now)}</span>
                </span>
              </label>
            );
          }
          return (
            <div key={lineup.id} className={"lrow" + (active ? " is-active" : "")}>
              <div className="lrow__line">
                <button
                  type="button"
                  className="lrow__main"
                  onClick={() => lists.pick(lineup.id)}
                  aria-current={active ? "true" : undefined}
                >
                  <span className="lrow__radio" aria-hidden="true">
                    {active && <Icon name="check" size="xs" />}
                  </span>
                  <span className="lrow__txt">
                    <span className="lrow__name">{lineup.name}</span>
                    {meta}
                    <span className="lrow__mod">Modificada {formatRelative(lineup.updatedAt, now)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => lists.toggleMenu(lineup.id)}
                  aria-label={`Más acciones para ${lineup.name}`}
                  aria-expanded={open}
                  disabled={locked}
                >
                  <Icon name="dots" />
                </button>
              </div>
              {open && (
                <div className="lrow__acts">
                  <button type="button" className="btn btn--soft btn--sm" onClick={() => lists.openRename(lineup.id)}>
                    Renombrar
                  </button>
                  <button type="button" className="btn btn--soft btn--sm" onClick={() => lists.openDuplicate(lineup.id)}>
                    Duplicar
                  </button>
                  <button type="button" className="btn btn--dangersoft btn--sm" onClick={() => lists.askDelete(lineup.id)}>
                    Borrar
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {onShareSpace && !shared && !selecting && lineups.length > 0 && (
          <div className="lcard">
            <div className="lcard__t">Solo en este dispositivo</div>
            <p className="lcard__s">Con el espacio del equipo, todos ven y editan las alineaciones en tiempo real.</p>
            <button type="button" className="btn btn--soft btn--sm" onClick={onShareSpace}>
              Unirme al espacio del equipo
            </button>
          </div>
        )}
      </div>
      {selecting && (
        <div className="sheet__foot">
          <button type="button" className="btn btn--soft" onClick={compare.cancelSelect}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary" onClick={compare.open} disabled={picked.length < 2}>
            Comparar{picked.length ? ` (${picked.length})` : ""}
          </button>
        </div>
      )}
    </Sheet>
  );
}

/** Nueva alineación (con "Empezar desde…") o renombrar. */
export function LineupFormSheet({ form, lineups, playersById, lists }) {
  const isNew = form.mode === "new";
  const title = isNew ? "Nueva alineación" : "Renombrar alineación";
  const submit = (e) => {
    e.preventDefault();
    lists.submitForm();
  };
  const options = isNew
    ? [
        ...lineups.map((l) => {
          const { totalPoints, count } = getLineupStats(l.pairs, playersById);
          return { id: l.id, title: `Duplicar «${l.name}»`, sub: `${count}/10 · ${formatPoints(totalPoints)} pts` };
        }),
        { id: "empty", title: "Vacía", sub: "Las 5 pistas sin jugadores" },
      ]
    : [];

  return (
    <Sheet cls="sheet--form" label={title} onClose={lists.cancelForm}>
      <div className="sheet__head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sheet__title">{title}</div>
        </div>
        <button type="button" className="iconbtn" onClick={lists.cancelForm} aria-label="Cerrar">
          <Icon name="close" />
        </button>
      </div>
      <form className="form" onSubmit={submit} noValidate>
        <div className="fld">
          <label className="fld__l" htmlFor="ln-name" style={{ marginBottom: 0 }}>
            Nombre
          </label>
          <input
            id="ln-name"
            className={"inp" + (form.error ? " is-invalid" : "")}
            type="text"
            value={form.name}
            maxLength={80}
            onChange={(e) => lists.setFormField("name", e.target.value)}
            placeholder="Ej.: Jornada 5 · vs Club Y"
            aria-invalid={form.error}
            aria-describedby={form.error ? "ln-err" : undefined}
            autoFocus
          />
          {form.error && (
            <p id="ln-err" className="fld__err">
              <Icon name="warn" size="sm" />
              Escribe un nombre para la alineación.
            </p>
          )}
        </div>
        <div className="fld">
          <label className="fld__l" htmlFor="ln-date" style={{ marginBottom: 0 }}>
            Fecha <span className="fld__opt">(opcional)</span>
          </label>
          <input
            id="ln-date"
            className="inp"
            type="date"
            value={form.date}
            onChange={(e) => lists.setFormField("date", e.target.value)}
          />
        </div>
        {isNew && (
          <fieldset className="fld">
            <legend className="fld__l">Empezar desde</legend>
            <div className="opts">
              {options.map((o) => (
                <label key={o.id} className={"opt" + (form.from === o.id ? " is-on" : "")}>
                  <input
                    type="radio"
                    name="ln-from"
                    checked={form.from === o.id}
                    onChange={() => lists.setFormField("from", o.id)}
                  />
                  <span className="opt__txt">
                    <span className="opt__t">{o.title}</span>
                    <span className="opt__s">{o.sub}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <button type="submit" hidden />
      </form>
      <div className="sheet__foot">
        <button type="button" className="btn btn--soft" onClick={lists.cancelForm}>
          Cancelar
        </button>
        <button type="button" className="btn btn--primary" onClick={lists.submitForm}>
          {isNew ? "Crear" : "Guardar"}
        </button>
      </div>
    </Sheet>
  );
}

export function DeleteLineupSheet({ target, lineups, activeId, shared, lists }) {
  const next = target.id === activeId ? lineups.find((l) => l.id !== target.id) : null;
  return (
    <Sheet label="Borrar alineación" role="alertdialog" onClose={lists.cancelDelete}>
      <div className="confirm__ic">
        <Icon name="trash" />
      </div>
      <h2 className="confirm__t">¿Borrar «{target.name}»?</h2>
      <p className="confirm__p">
        {shared ? "Se borrará para todo el equipo y no se puede deshacer." : "Se borrará de este dispositivo y no se puede deshacer."}
        {next ? ` Pasarás a ver «${next.name}».` : ""}
      </p>
      <button type="button" className="btn btn--danger btn--block" onClick={lists.confirmDelete}>
        Sí, borrar alineación
      </button>
      <button type="button" className="btn btn--soft btn--block" onClick={lists.cancelDelete} autoFocus>
        Cancelar
      </button>
    </Sheet>
  );
}

/** Modo local: unirse pegando el enlace del equipo. */
export function JoinSheet({ joinText, space }) {
  return (
    <Sheet label="Unirme al espacio del equipo" onClose={space.close}>
      <div className="confirm__ic confirm__ic--ink">
        <Icon name="userPlus" />
      </div>
      <h2 className="confirm__t">Unirme al espacio del equipo</h2>
      <p className="confirm__p">
        Ahora todo está solo en este dispositivo. Con el enlace del equipo, capitán y jugadores ven y editan lo mismo
        en tiempo real.
      </p>
      <div className="fld">
        <label className="fld__l" htmlFor="join-link" style={{ marginBottom: 0 }}>
          Enlace del equipo
        </label>
        <div className="joinrow">
          <input
            id="join-link"
            className="inp"
            type="url"
            value={joinText}
            onChange={(e) => space.setJoinText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && space.submitJoin()}
            placeholder="Pega aquí el enlace"
            autoComplete="off"
          />
          <button type="button" className="btn btn--soft" onClick={space.paste}>
            Pegar
          </button>
        </div>
        <p className="note">El que te ha mandado el capitán por WhatsApp.</p>
      </div>
      <button type="button" className="btn btn--primary btn--block" onClick={space.submitJoin} disabled={!joinText.trim()}>
        Unirme
      </button>
      <button type="button" className="btn btn--soft btn--block" onClick={space.close}>
        Cancelar
      </button>
      <p className="note">Lo que tienes en este dispositivo se queda aquí: lo recuperas si sales del espacio.</p>
    </Sheet>
  );
}

export function InviteSheet({ link, syncState, space }) {
  const lineCls = "syncline" + (syncState === "offline" ? " syncline--off" : syncState === "saving" || syncState === "connecting" ? " syncline--saving" : "");
  return (
    <Sheet label="Espacio del equipo" onClose={space.close}>
      <div className="eyebrow" style={{ marginTop: 8 }}>
        Espacio del equipo
      </div>
      <h2 className="confirm__t">Invitar al equipo</h2>
      <p className={lineCls}>
        <Icon name="cloud" size="sm" />
        {SYNC_LINE[syncState]}
      </p>
      <div className="linkbox">{link}</div>
      <div className="btnrow">
        <button type="button" className="btn btn--primary" onClick={space.shareLink}>
          <Icon name="share" />
          Compartir
        </button>
        <button type="button" className="btn btn--soft" onClick={space.copyLink}>
          <Icon name="copy" />
          Copiar
        </button>
      </div>
      <div className="divider" />
      <button type="button" className="btn btn--dangerghost btn--block" onClick={space.askLeave}>
        <Icon name="logout" />
        Salir del espacio en este dispositivo
      </button>
      <p className="note">El espacio sigue existiendo para el resto del equipo.</p>
    </Sheet>
  );
}

export function LeaveSheet({ space }) {
  return (
    <Sheet label="Salir del espacio" role="alertdialog" onClose={space.close}>
      <div className="confirm__ic">
        <Icon name="logout" />
      </div>
      <h2 className="confirm__t">¿Salir del espacio?</h2>
      <p className="confirm__p">
        Este dispositivo olvidará el enlace y volverá al modo local, con lo que tenías antes de unirte. Las alineaciones
        siguen en el espacio para el equipo. Para volver necesitarás el enlace.
      </p>
      <button type="button" className="btn btn--danger btn--block" onClick={space.confirmLeave}>
        Salir del espacio
      </button>
      <button type="button" className="btn btn--soft btn--block" onClick={space.close} autoFocus>
        Cancelar
      </button>
    </Sheet>
  );
}

export function DeletedSheet({ notice, space }) {
  return (
    <Sheet label="Alineación borrada" role="alertdialog" onClose={space.ackDeleted}>
      <div className="confirm__ic">
        <Icon name="trash" />
      </div>
      <h2 className="confirm__t">Esta alineación ya no existe</h2>
      <p className="confirm__p">
        «{notice.name}» se ha borrado desde otro dispositivo.
        {notice.now ? ` Ahora ves «${notice.now}».` : ""}
      </p>
      <button type="button" className="btn btn--primary btn--block" onClick={space.ackDeleted}>
        Entendido
      </button>
      <button type="button" className="btn btn--soft btn--block" onClick={space.deletedToLists}>
        Ver alineaciones
      </button>
    </Sheet>
  );
}

export function WelcomeScreen({ teamName, space }) {
  return (
    <section className="screen" role="dialog" aria-label="Bienvenida al espacio del equipo">
      <span className="screen__mark" aria-hidden="true">
        <Icon name="ball" />
      </span>
      <div className="eyebrow">Te has unido al espacio de</div>
      <h1 className="screen__t">{teamName ?? "tu equipo"}</h1>
      <ul className="screen__list">
        <li>
          <Icon name="retry" />
          Ves y editas las mismas alineaciones que el resto del equipo, en tiempo real.
        </li>
        <li>
          <Icon name="users" />
          Las posiciones preferentes de los jugadores son comunes para todos.
        </li>
        <li>
          <Icon name="phone" />
          Este dispositivo recordará el espacio: la próxima vez entras directamente.
        </li>
      </ul>
      <div className="screen__foot">
        <button type="button" className="btn btn--primary btn--block" onClick={space.enter} autoFocus>
          Entrar
        </button>
        <p className="note" style={{ textAlign: "center" }}>
          Sin cuenta: el enlace es la llave. No lo compartas fuera del equipo.
        </p>
      </div>
    </section>
  );
}

export function InvalidLinkScreen({ code, space }) {
  const shown = code && code.length > 10 ? `${code.slice(0, 8)}…` : code;
  return (
    <section className="screen" role="alertdialog" aria-label="Enlace no válido">
      <span className="screen__mark screen__mark--err" aria-hidden="true">
        <Icon name="linkBroken" />
      </span>
      <h1 className="screen__t screen__t--plain">Este enlace no funciona</h1>
      <p className="screen__p">
        El código <span className="code">{shown}</span> no corresponde a ningún espacio. Puede que esté mal copiado o
        que el espacio ya no exista.
      </p>
      <p className="screen__p">Pide al capitán que te lo vuelva a enviar.</p>
      <div className="screen__foot">
        <button type="button" className="btn btn--primary btn--block" onClick={space.invalidPaste}>
          Pegar otro enlace
        </button>
        <button type="button" className="btn btn--soft btn--block" onClick={space.invalidLocal}>
          Seguir en modo local
        </button>
      </div>
    </section>
  );
}
