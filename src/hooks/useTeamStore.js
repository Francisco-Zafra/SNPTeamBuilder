import { useCallback, useEffect, useState } from "react";
import { isSyncAvailable } from "../store/firebase.js";
import { createLocalStore } from "../store/localStore.js";
import { forgetTeamCode, inviteLink, resolveTeamCode } from "../store/teamCode.js";

const LOADING = { status: "connecting", saving: false, ready: false, sides: {}, lineups: [] };

/**
 * Elige el almacén según el dispositivo: compartido (Firestore) si hay código de
 * equipo y Firebase está configurado; si no, local. Firebase se carga bajo demanda.
 */
export function useTeamStore() {
  const [teamCode, setTeamCode] = useState(() => (isSyncAvailable() ? resolveTeamCode() : null));
  const [store, setStore] = useState(null);
  const [state, setState] = useState(LOADING);

  useEffect(() => {
    let active = true;
    let opened = null;
    let unsubscribe = () => {};

    const open = teamCode
      ? import("../store/firestoreStore.js").then((m) => m.createFirestoreStore(teamCode))
      : Promise.resolve(createLocalStore());

    open
      .then((s) => {
        if (!active) return s.close();
        opened = s;
        setStore(s);
        unsubscribe = s.subscribe(setState);
      })
      .catch((error) => {
        console.error("No se ha podido abrir el almacén:", error);
        if (active) setState({ ...LOADING, status: "error", ready: true });
      });

    return () => {
      active = false;
      unsubscribe();
      opened?.close();
      setStore(null);
      setState(LOADING);
    };
  }, [teamCode]);

  /** Olvida el código en este dispositivo y vuelve al modo local. */
  const leave = useCallback(() => {
    forgetTeamCode();
    setTeamCode(null);
  }, []);

  return {
    ...state,
    store,
    mode: teamCode ? "shared" : "local",
    teamCode,
    inviteLink: teamCode ? inviteLink(teamCode) : null,
    leave,
  };
}
