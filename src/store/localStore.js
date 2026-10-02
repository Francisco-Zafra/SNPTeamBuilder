import { restoreSides, setSide as setSideIn } from "../domain/sides.js";
import { STORAGE_KEYS, readJSON, writeJSON } from "../utils/storage.js";
import { applyLineupAction, lineupMetaFields, newLineupFields, restoreLineupDoc, sortLineups } from "./lineupDocs.js";

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `l-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function loadLineups() {
  const stored = readJSON(STORAGE_KEYS.lineups);
  if (Array.isArray(stored)) return stored.map((d) => restoreLineupDoc(d?.id, d)).filter(Boolean);

  // Migración: la versión anterior guardaba una sola alineación.
  const legacy = readJSON(STORAGE_KEYS.legacyLineup);
  if (Array.isArray(legacy)) return [{ id: newId(), ...newLineupFields({ from: { pairs: legacy } }) }];

  // Primer uso: una alineación vacía para empezar a montar parejas directamente.
  return [{ id: newId(), ...newLineupFields() }];
}

/**
 * Almacén en este dispositivo (modo local). Misma interfaz que el de Firestore:
 * `subscribe`, `setSide`, `createLineup`, `updateLineupMeta`, `deleteLineup`,
 * `applyAction` y `close`. Los métodos de escritura devuelven promesas.
 */
export function createLocalStore() {
  let sides = restoreSides(readJSON(STORAGE_KEYS.sides));
  let lineups = loadLineups();
  const listeners = new Set();

  const snapshot = () => ({
    status: "local",
    saving: false,
    ready: true,
    sides,
    lineups: sortLineups(lineups),
  });

  const commit = () => {
    writeJSON(STORAGE_KEYS.sides, sides);
    writeJSON(STORAGE_KEYS.lineups, lineups);
    const state = snapshot();
    listeners.forEach((listener) => listener(state));
  };

  commit();

  return {
    mode: "local",

    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },

    async setSide(playerId, side) {
      sides = setSideIn(sides, playerId, side);
      commit();
    },

    async createLineup(options = {}) {
      const from = options.fromId ? lineups.find((l) => l.id === options.fromId) : null;
      const doc = { id: newId(), ...newLineupFields({ ...options, from }) };
      lineups = [...lineups, doc];
      commit();
      return doc.id;
    },

    async updateLineupMeta(id, meta) {
      lineups = lineups.map((l) => (l.id === id ? { ...l, ...lineupMetaFields(meta), updatedAt: Date.now() } : l));
      commit();
    },

    async deleteLineup(id) {
      lineups = lineups.filter((l) => l.id !== id);
      commit();
    },

    async applyAction(id, action, { validIds } = {}) {
      const target = lineups.find((l) => l.id === id);
      if (!target) throw Object.assign(new Error("La alineación ya no existe"), { code: "not-found" });
      const pairs = applyLineupAction(target.pairs, action, validIds);
      if (pairs === target.pairs) return;
      lineups = lineups.map((l) => (l.id === id ? { ...l, pairs, updatedAt: Date.now() } : l));
      commit();
    },

    close() {
      listeners.clear();
    },
  };
}
