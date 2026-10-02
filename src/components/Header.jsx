import { Icon } from "./Icon.jsx";

export function Header({ teamName, canAct, onClear, onShare, onCopy }) {
  return (
    <header className="hdr">
      <span className="hdr__mark" aria-hidden="true">
        <Icon name="ball" />
      </span>
      <div className="hdr__txt">
        <h1 className="hdr__team">{teamName ?? "Alineación SNP"}</h1>
        <p className="hdr__sub">Alineación · Series Nacionales de Pádel</p>
      </div>
      {onCopy && (
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
      )}
    </header>
  );
}
