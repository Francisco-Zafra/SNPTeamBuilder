import { CONFIG } from "../config.js";
import { SLOT_META } from "../ui/labels.js";
import { formatPoints } from "../utils/format.js";
import { Icon } from "./Icon.jsx";
import { SideBadge } from "./SideBadge.jsx";

const MAX_PLAYERS = CONFIG.courts * 2;

export function ActionBar({ canAct, onCopy, onShare }) {
  return (
    <div className="actbar">
      <button type="button" className="btn btn--primary" onClick={onCopy} disabled={!canAct}>
        <Icon name="copy" />
        Copiar alineación
      </button>
      <button
        type="button"
        className="btn btn--soft btn--icon"
        onClick={onShare}
        disabled={!canAct}
        aria-label="Compartir alineación"
      >
        <Icon name="share" />
      </button>
    </div>
  );
}

/** Barra del jugador seleccionado en la pestaña Alineación. */
export function SelectionBar({ player, location, onRemove, onCancel }) {
  if (!player) return null;
  return (
    <div className="selbar" role="status" aria-live="polite">
      <SideBadge side={player.preferredSide} />
      <div className="selbar__txt">
        <div className="selbar__name">{player.name}</div>
        <div className="selbar__hint">
          {location
            ? `Pista ${location.court} · ${SLOT_META[location.slot].label} — toca otro hueco para mover o intercambiar`
            : "Toca un hueco para colocarlo"}
        </div>
      </div>
      {location && (
        <button type="button" className="btn btn--soft btn--sm" onClick={onRemove}>
          Quitar
        </button>
      )}
      <button type="button" className="iconbtn" onClick={onCancel} aria-label="Cancelar selección">
        <Icon name="close" />
      </button>
    </div>
  );
}

export function TabBar({ tab, count, rosterCount, onTab }) {
  return (
    <nav className="tabbar" aria-label="Secciones">
      <button
        type="button"
        className={"tab" + (tab === "lineup" ? " is-active" : "")}
        onClick={() => onTab("lineup")}
        aria-current={tab === "lineup" ? "page" : undefined}
      >
        <span className="tab__row">
          <Icon name="court" />
          <span className="tab__badge">
            {count}/{MAX_PLAYERS}
          </span>
        </span>
        <span>Alineación</span>
      </button>
      <button
        type="button"
        className={"tab" + (tab === "roster" ? " is-active" : "")}
        onClick={() => onTab("roster")}
        aria-current={tab === "roster" ? "page" : undefined}
      >
        <span className="tab__row">
          <Icon name="users" />
          <span className="tab__badge">{rosterCount}</span>
        </span>
        <span>Plantilla</span>
      </button>
    </nav>
  );
}

export function PreviewPanel({ text, canAct, onCopy }) {
  return (
    <aside className="p-preview" aria-label="Vista previa del texto">
      <h2 className="prev__t">Texto para WhatsApp</h2>
      <pre className="wa">{text}</pre>
      <button type="button" className="btn btn--primary btn--block" onClick={onCopy} disabled={!canAct}>
        <Icon name="copy" />
        Copiar alineación
      </button>
    </aside>
  );
}

export function DragGhost({ player }) {
  return (
    <div className="ghost">
      <SideBadge side={player.preferredSide} />
      <span className="ghost__name">{player.name}</span>
      <span className="num ghost__pts">{formatPoints(player.points)}</span>
    </div>
  );
}

export function DragTip() {
  return (
    <div className="dragtip">
      <Icon name="move" size="sm" />
      Suelta en un hueco · fuera para cancelar
    </div>
  );
}
