import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTeamPlayers } from "../api/snpApi.js";
import { CONFIG } from "../config.js";
import { normalizeRoster } from "../domain/normalize.js";
import { restoreRosterCache } from "../domain/roster.js";
import { STORAGE_KEYS, readJSON, writeJSON } from "../utils/storage.js";

const EMPTY = { teamName: null, players: [], fetchedAt: null };

/**
 * Carga la plantilla de SNP con caché local de respaldo.
 *
 * `status`:
 * - "loading": primera carga, aún sin datos;
 * - "ready":   datos recién descargados;
 * - "stale":   la API falló y se muestran los datos guardados de `fetchedAt`;
 * - "error":   la API falló y no hay caché.
 *
 * `refreshing` indica que se está reintentando mientras ya hay datos en pantalla.
 * `retry()` devuelve una promesa con el estado resultante (o `null` si se canceló).
 */
export function useRoster() {
  const [state, setState] = useState({ status: "loading", refreshing: false, ...EMPTY });
  const controllerRef = useRef(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState((prev) =>
      prev.players.length ? { ...prev, refreshing: true } : { ...prev, status: "loading" }
    );

    try {
      const entities = await fetchTeamPlayers({ signal: controller.signal });
      if (controller.signal.aborted) return null;

      const { teamName, players } = normalizeRoster(entities, CONFIG.teamId);
      const fetchedAt = Date.now();
      writeJSON(STORAGE_KEYS.roster, { fetchedAt, teamName, players });
      setState({ status: "ready", refreshing: false, teamName, players, fetchedAt });
      return "ready";
    } catch (error) {
      if (controller.signal.aborted) return null;

      console.error("No se ha podido cargar la plantilla de SNP:", error);
      const cache = restoreRosterCache(readJSON(STORAGE_KEYS.roster));
      const next = cache
        ? { status: "stale", refreshing: false, ...cache }
        : { status: "error", refreshing: false, ...EMPTY };
      setState(next);
      return next.status;
    }
  }, []);

  useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  return { ...state, retry: load };
}
