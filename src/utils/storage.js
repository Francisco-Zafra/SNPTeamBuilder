const PREFIX = "snp:v1:";

export const STORAGE_KEYS = Object.freeze({
  sides: "player-sides",
  lineup: "lineup",
  roster: "roster-cache",
});

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Acceder a localStorage puede lanzar (modo privado, cookies bloqueadas).
    return null;
  }
}

/** Lee y parsea JSON. Ante cualquier fallo devuelve `fallback`. */
export function readJSON(key, fallback = null, storage = defaultStorage()) {
  try {
    const raw = storage?.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Serializa y guarda. Devuelve `false` si no se pudo guardar. */
export function writeJSON(key, value, storage = defaultStorage()) {
  try {
    if (!storage) return false;
    storage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
