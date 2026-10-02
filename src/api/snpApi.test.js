import { describe, expect, it, vi } from "vitest";
import { fetchTeamPlayers } from "./snpApi.js";

const jsonResponse = (data, init = {}) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  json: async () => data,
});

describe("fetchTeamPlayers", () => {
  it("hace un POST form-urlencoded sin credenciales ni cabeceras extra", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ error: "", num_resultados: "1", entities: [{ id: "1" }] }));

    const entities = await fetchTeamPlayers({ fetchImpl, teamId: 8201, seasonId: 3 });

    expect(entities).toEqual([{ id: "1" }]);
    const [, init] = fetchImpl.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    });
    expect(init.credentials).toBeUndefined();
    expect(Object.fromEntries(init.body)).toEqual({
      filtro: "",
      num_pagina: "1",
      limite_pagina: "100",
      update: "1",
      idequipo: "8201",
      desde_clasificacion_final: "0",
      idtemporadaG: "3",
    });
  });

  it("lanza con error HTTP o error de la API", async () => {
    await expect(
      fetchTeamPlayers({ fetchImpl: async () => jsonResponse({}, { ok: false, status: 500 }) })
    ).rejects.toThrow("HTTP 500");
    await expect(
      fetchTeamPlayers({ fetchImpl: async () => jsonResponse({ error: "Equipo no encontrado" }) })
    ).rejects.toThrow("Equipo no encontrado");
  });

  it("avisa si la API devuelve menos jugadores de los que dice tener", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await fetchTeamPlayers({
      fetchImpl: async () => jsonResponse({ error: "", num_resultados: "120", entities: [{ id: "1" }] }),
    });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("aborta por timeout", async () => {
    const fetchImpl = (_, { signal }) =>
      new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)));

    await expect(fetchTeamPlayers({ fetchImpl, timeoutMs: 10 })).rejects.toThrow("Timeout");
  });

  it("propaga la cancelación externa", async () => {
    const controller = new AbortController();
    const fetchImpl = (_, { signal }) =>
      new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason)));

    const promise = fetchTeamPlayers({ fetchImpl, signal: controller.signal });
    controller.abort(new Error("cancelado"));
    await expect(promise).rejects.toThrow("cancelado");
  });
});
