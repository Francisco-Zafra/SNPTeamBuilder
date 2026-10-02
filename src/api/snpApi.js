import { CONFIG } from "../config.js";

/**
 * Descarga los jugadores del equipo desde SNP Galaxy.
 *
 * Sin cookies ni cabeceras extra: con solo `Content-Type` form-urlencoded la
 * petición es "simple" y no dispara preflight CORS. La respuesta llega como
 * `text/html` aunque el cuerpo es JSON, así que no se valida el content-type.
 */
export async function fetchTeamPlayers({
  signal,
  teamId = CONFIG.teamId,
  seasonId = CONFIG.seasonId,
  timeoutMs = CONFIG.requestTimeoutMs,
  fetchImpl = globalThis.fetch,
} = {}) {
  const body = new URLSearchParams({
    filtro: "",
    num_pagina: "1",
    limite_pagina: "100",
    update: "1",
    idequipo: String(teamId),
    desde_clasificacion_final: "0",
    idtemporadaG: String(seasonId),
  });

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new Error(`Timeout tras ${timeoutMs} ms`)),
    timeoutMs
  );
  const forwardAbort = () => controller.abort(signal.reason);
  if (signal?.aborted) forwardAbort();
  signal?.addEventListener("abort", forwardAbort, { once: true });

  try {
    const response = await fetchImpl(CONFIG.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const entities = Array.isArray(data.entities) ? data.entities : [];

    if (Number(data.num_resultados) > entities.length) {
      console.warn(
        `SNP devolvió ${entities.length} de ${data.num_resultados} jugadores; revisar paginación.`
      );
    }

    return entities;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", forwardAbort);
  }
}
