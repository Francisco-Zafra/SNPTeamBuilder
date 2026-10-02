import { CONFIG } from "../config.js";

/** "127.0.0.1:8080" en desarrollo para usar el emulador de Firestore. */
const EMULATOR = import.meta.env?.VITE_FIRESTORE_EMULATOR || null;

export const isSyncAvailable = () => Boolean(CONFIG.firebase || EMULATOR);

let firestorePromise = null;

/**
 * Inicializa Firebase una sola vez y bajo demanda (el modo local no descarga el
 * SDK). Devuelve `{ db, fs }`, con `fs` el módulo `firebase/firestore`.
 */
export function getFirestore() {
  firestorePromise ??= (async () => {
    const [{ initializeApp }, fs] = await Promise.all([import("firebase/app"), import("firebase/firestore")]);
    const app = initializeApp(CONFIG.firebase ?? { projectId: "demo-snp", apiKey: "demo" });
    const db = fs.initializeFirestore(app, {
      // Caché persistente: sin conexión se sigue viendo la última versión.
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
    });
    if (EMULATOR) {
      const [host, port] = EMULATOR.split(":");
      fs.connectFirestoreEmulator(db, host, Number(port));
    }
    return { db, fs };
  })();
  return firestorePromise;
}
