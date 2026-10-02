import { formatDateTime } from "../utils/format.js";
import { Icon } from "./Icon.jsx";

export function LoadingState() {
  return (
    <div className="state state--loading" role="status" aria-live="polite">
      <div className="loadline">
        <span className="spinner" aria-hidden="true" />
        Cargando jugadores...
      </div>
      <div className="skel skel--h" />
      <div className="skel" />
      <div className="skel" />
      <div className="skel" />
      <div className="skel skel--h" />
      <div className="skel" />
      <div className="skel" />
      <div className="skel" />
    </div>
  );
}

export function ErrorState({ onRetry }) {
  return (
    <div className="state" role="alert">
      <div className="state__ic">
        <Icon name="offline" />
      </div>
      <h2 className="state__t">No se ha podido cargar la plantilla.</h2>
      <p className="state__p">Comprueba la conexión y vuelve a intentarlo.</p>
      <button type="button" className="btn btn--primary" onClick={onRetry}>
        <Icon name="retry" />
        Reintentar
      </button>
    </div>
  );
}

export function CachedBanner({ fetchedAt, refreshing, onRetry }) {
  return (
    <div className="banner" role="status">
      {refreshing ? <span className="spinner spinner--sm" aria-hidden="true" /> : <Icon name="clock" size="sm" />}
      <span className="banner__txt">
        {refreshing ? "Actualizando plantilla…" : `Datos guardados del ${formatDateTime(fetchedAt)}`}
      </span>
      <button type="button" className="banner__btn" onClick={onRetry} disabled={refreshing}>
        Reintentar
      </button>
    </div>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={"toast" + (toast.kind === "warn" ? " toast--warn" : "")} role="status" aria-live="polite">
      <span className="toast__ic">
        <Icon name={toast.kind === "warn" ? "warn" : "check"} size="sm" />
      </span>
      <div>
        <div className="toast__t">{toast.title}</div>
        <div className="toast__s">{toast.sub}</div>
      </div>
    </div>
  );
}
