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

/** Código a partir de lo que pega el usuario: el enlace completo o el código suelto. */
export function parseTeamLink(text) {
  const value = String(text ?? "").trim();
  if (isTeamCode(value)) return value;
  const hashAt = value.indexOf("#");
  return hashAt >= 0 ? readCodeFromHash(value.slice(hashAt)) : null;
}

const storedCode = () => {
  const stored = readJSON(STORAGE_KEYS.teamCode);
  return isTeamCode(stored) ? stored : null;
};

export const rememberTeamCode = (code) => writeJSON(STORAGE_KEYS.teamCode, code);

/**
 * Código activo en este dispositivo. Si llega en el enlace se guarda y se quita
 * de la barra de direcciones (para no compartirlo sin querer en una captura).
 * `joined` indica que este dispositivo acaba de entrar con un código nuevo.
 */
export function resolveTeamCode(loc = window.location, history = window.history) {
  const fromHash = readCodeFromHash(loc.hash);
  const stored = storedCode();
  if (fromHash) {
    rememberTeamCode(fromHash);
    history.replaceState(null, "", loc.pathname + loc.search);
    return { code: fromHash, joined: fromHash !== stored };
  }
  return { code: stored, joined: false };
}

export const forgetTeamCode = () => removeJSON(STORAGE_KEYS.teamCode);

export const inviteLink = (code, loc = window.location) => `${loc.origin}${loc.pathname}#k=${code}`;
