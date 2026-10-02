import { STORAGE_KEYS, readJSON, removeJSON, writeJSON } from "../utils/storage.js";

/** Código secreto del espacio compartido: solo letras y números. */
export const TEAM_CODE_PATTERN = /^[A-Za-z0-9]{12,64}$/;

export const isTeamCode = (value) => typeof value === "string" && TEAM_CODE_PATTERN.test(value);

/** Extrae `k` de un hash como `#k=abc` o `#x=1&k=abc`. */
export function readCodeFromHash(hash) {
  const params = new URLSearchParams(String(hash ?? "").replace(/^#/, ""));
  const code = params.get("k");
  return isTeamCode(code) ? code : null;
}

/**
 * Código activo en este dispositivo. Si llega en el enlace se guarda y se quita
 * de la barra de direcciones (para no compartirlo sin querer en una captura).
 */
export function resolveTeamCode(loc = window.location, history = window.history) {
  const fromHash = readCodeFromHash(loc.hash);
  if (fromHash) {
    writeJSON(STORAGE_KEYS.teamCode, fromHash);
    history.replaceState(null, "", loc.pathname + loc.search);
    return fromHash;
  }
  const stored = readJSON(STORAGE_KEYS.teamCode);
  return isTeamCode(stored) ? stored : null;
}

export const forgetTeamCode = () => removeJSON(STORAGE_KEYS.teamCode);

export const inviteLink = (code, loc = window.location) => `${loc.origin}${loc.pathname}#k=${code}`;
