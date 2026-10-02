import { restoreLineup } from "../domain/lineupReducer.js";
import { SIDES, isSide, restoreSides } from "../domain/sides.js";
import { getFirestore } from "./firebase.js";
import { applyLineupAction, lineupMetaFields, newLineupFields, restoreLineupDoc, sortLineups } from "./lineupDocs.js";

const ECHO_TIMEOUT_MS = 3000;
const samePairs = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Almacén compartido en Firestore para el espacio `teams/{code}`:
 *
 *   teams/{code}                 { sides: { [playerId]: Side } }
 *   teams/{code}/lineups/{id}    { name, date, pairs, createdAt, updatedAt }
 *
 * Los cambios de alineación se aplican con `lineupReducer` dentro de una
 * transacción, para que dos personas editando a la vez no se pisen. Mientras
 * la transacción viaja se muestra el resultado previsto (optimista).
 *
 * `status`: "connecting" | "synced" | "offline" (datos de caché, solo lectura)
 * | "denied" (código no válido) | "error".
 */
export async function createFirestoreStore(code) {
  const { db, fs } = await getFirestore();
  const teamRef = fs.doc(db, "teams", code);
  const lineupsRef = fs.collection(teamRef, "lineups");

  let sides = {};
  let remote = [];
  let teamMeta = null;
  let lineupsMeta = null;
  let failure = null; // "denied" | "error"
  let online = typeof navigator === "undefined" ? true : navigator.onLine !== false;

  const optimistic = new Map(); // lineupId → pairs previstas
  const inFlight = new Map(); // lineupId → transacciones en curso
  const awaitingEcho = new Map(); // lineupId → { pairs, timer }
  let pendingWrites = 0;
  const listeners = new Set();

  const status = () => {
    if (failure) return failure;
    if (!teamMeta || !lineupsMeta) return online ? "connecting" : "offline";
    if (!online || teamMeta.fromCache || lineupsMeta.fromCache) return "offline";
    return "synced";
  };

  const snapshot = () => ({
    status: status(),
    saving: pendingWrites > 0 || inFlight.size > 0,
    ready: Boolean(teamMeta && lineupsMeta) || failure != null,
    sides,
    lineups: sortLineups(
      remote.map((l) => (optimistic.has(l.id) ? { ...l, pairs: optimistic.get(l.id) } : l))
    ),
  });

  const emit = () => {
    const state = snapshot();
    listeners.forEach((listener) => listener(state));
  };

  const dropOptimistic = (id) => {
    const echo = awaitingEcho.get(id);
    if (echo) clearTimeout(echo.timer);
    awaitingEcho.delete(id);
    optimistic.delete(id);
  };

  const onListenError = (error) => {
    console.error("Firestore:", error);
    failure = error?.code === "permission-denied" ? "denied" : "error";
    emit();
  };

  const unsubTeam = fs.onSnapshot(
    teamRef,
    { includeMetadataChanges: true },
    (snap) => {
      teamMeta = snap.metadata;
      sides = restoreSides(snap.data()?.sides);
      emit();
    },
    onListenError
  );

  const unsubLineups = fs.onSnapshot(
    lineupsRef,
    { includeMetadataChanges: true },
    (snap) => {
      lineupsMeta = snap.metadata;
      remote = snap.docs
        .map((d) => restoreLineupDoc(d.id, d.data({ serverTimestamps: "estimate" })))
        .filter(Boolean);
      // Quita la previsión cuando llega una versión nueva del documento (la nuestra u otra posterior).
      for (const [id, echo] of awaitingEcho) {
        const doc = remote.find((l) => l.id === id);
        if (!doc || doc.updatedAt !== echo.version || samePairs(doc.pairs, echo.pairs)) dropOptimistic(id);
      }
      emit();
    },
    onListenError
  );

  const onOnline = () => {
    online = true;
    emit();
  };
  const onOffline = () => {
    online = false;
    emit();
  };
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  /** Cuenta una escritura en curso para el indicador "Guardando…". */
  const track = async (promise) => {
    pendingWrites += 1;
    emit();
    try {
      return await promise;
    } finally {
      pendingWrites -= 1;
      emit();
    }
  };

  const currentPairs = (id) => {
    if (optimistic.has(id)) return optimistic.get(id);
    return remote.find((l) => l.id === id)?.pairs ?? null;
  };

  return {
    mode: "shared",

    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },

    setSide(playerId, side) {
      if (side === SIDES.SIN_ASIGNAR || !isSide(side)) {
        return track(fs.updateDoc(teamRef, new fs.FieldPath("sides", playerId), fs.deleteField())).catch((error) => {
          if (error?.code !== "not-found") throw error;
        });
      }
      return track(fs.setDoc(teamRef, { sides: { [playerId]: side } }, { merge: true }));
    },

    async createLineup(options = {}) {
      const from = options.fromId ? remote.find((l) => l.id === options.fromId) : null;
      const ref = fs.doc(lineupsRef);
      const fields = newLineupFields({ ...options, from });
      await track(
        fs.setDoc(ref, { ...fields, createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp() })
      );
      return ref.id;
    },

    updateLineupMeta(id, meta) {
      return track(
        fs.updateDoc(fs.doc(lineupsRef, id), { ...lineupMetaFields(meta), updatedAt: fs.serverTimestamp() })
      );
    },

    deleteLineup(id) {
      return track(fs.deleteDoc(fs.doc(lineupsRef, id)));
    },

    async applyAction(id, action, { validIds } = {}) {
      const base = currentPairs(id);
      if (!base) throw Object.assign(new Error("La alineación ya no existe"), { code: "not-found" });

      const predicted = applyLineupAction(base, action, validIds);
      if (samePairs(predicted, base)) return;
      const startVersion = remote.find((l) => l.id === id)?.updatedAt;

      dropOptimistic(id);
      optimistic.set(id, predicted);
      inFlight.set(id, (inFlight.get(id) ?? 0) + 1);
      emit();

      let ok = false;
      try {
        await fs.runTransaction(db, async (tx) => {
          const ref = fs.doc(lineupsRef, id);
          const snap = await tx.get(ref);
          if (!snap.exists()) throw Object.assign(new Error("La alineación ya no existe"), { code: "not-found" });
          const current = restoreLineup(snap.data().pairs);
          const next = applyLineupAction(current, action, validIds);
          if (!samePairs(next, current)) tx.update(ref, { pairs: next, updatedAt: fs.serverTimestamp() });
        });
        ok = true;
      } finally {
        const left = (inFlight.get(id) ?? 1) - 1;
        if (left > 0) inFlight.set(id, left);
        else inFlight.delete(id);

        if (left === 0) {
          const pairs = optimistic.get(id);
          const doc = remote.find((l) => l.id === id);
          if (!ok || !pairs || !doc || doc.updatedAt !== startVersion || samePairs(doc.pairs, pairs)) {
            dropOptimistic(id);
          } else {
            // Espera a que el listener traiga el cambio para no parpadear al estado anterior.
            const timer = setTimeout(() => {
              dropOptimistic(id);
              emit();
            }, ECHO_TIMEOUT_MS);
            awaitingEcho.set(id, { pairs, version: startVersion, timer });
          }
        }
        emit();
      }
    },

    close() {
      unsubTeam();
      unsubLineups();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      for (const id of [...awaitingEcho.keys()]) dropOptimistic(id);
      listeners.clear();
    },
  };
}
