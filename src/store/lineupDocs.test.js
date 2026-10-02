import { describe, expect, it } from "vitest";
import { createEmptyLineup } from "../domain/lineupReducer.js";
import { applyLineupAction, lineupMetaFields, newLineupFields, restoreLineupDoc, sortLineups } from "./lineupDocs.js";

const withPlayers = () =>
  createEmptyLineup().map((p) => (p.id === "pair-1" ? { ...p, reves: "a", derecha: "gone" } : p));

describe("newLineupFields", () => {
  it("crea una alineación vacía con nombre por defecto", () => {
    expect(newLineupFields({}, 10)).toEqual({
      name: "Alineación",
      date: null,
      pairs: createEmptyLineup(),
      createdAt: 10,
      updatedAt: 10,
    });
  });

  it("duplica las parejas de otra y limpia nombre y fecha", () => {
    const fields = newLineupFields({ name: "  Jornada   4 ", date: "2026-10-04", from: { pairs: withPlayers() } }, 1);
    expect(fields.name).toBe("Jornada 4");
    expect(fields.date).toBe("2026-10-04");
    expect(fields.pairs).toEqual(withPlayers());
  });

  it("descarta fechas mal formadas", () => {
    expect(newLineupFields({ date: "4/10/2026" }).date).toBeNull();
  });
});

describe("lineupMetaFields", () => {
  it("solo incluye los campos indicados", () => {
    expect(lineupMetaFields({ name: "X" })).toEqual({ name: "X" });
    expect(lineupMetaFields({ date: null })).toEqual({ date: null });
    expect(lineupMetaFields({ name: "   " })).toEqual({ name: "Alineación" });
  });
});

describe("restoreLineupDoc", () => {
  it("valida y convierte timestamps de Firestore", () => {
    const doc = restoreLineupDoc("l1", {
      name: "Jornada 3",
      pairs: withPlayers(),
      createdAt: { toMillis: () => 5 },
      updatedAt: 7,
    });
    expect(doc).toEqual({ id: "l1", name: "Jornada 3", date: null, pairs: withPlayers(), createdAt: 5, updatedAt: 7 });
  });

  it("rechaza documentos inválidos y repara parejas corruptas", () => {
    expect(restoreLineupDoc("", {})).toBeNull();
    expect(restoreLineupDoc("l1", null)).toBeNull();
    expect(restoreLineupDoc("l1", { pairs: "roto" }).pairs).toEqual(createEmptyLineup());
  });
});

describe("sortLineups", () => {
  it("pone primero la modificada más recientemente", () => {
    const list = [
      { id: "a", name: "B", updatedAt: 1 },
      { id: "b", name: "A", updatedAt: 3 },
      { id: "c", name: "A", updatedAt: 1 },
    ];
    expect(sortLineups(list).map((l) => l.id)).toEqual(["b", "c", "a"]);
  });
});

describe("applyLineupAction", () => {
  it("aplica la acción tras quitar IDs fantasma", () => {
    const next = applyLineupAction(withPlayers(), { type: "PLACE", playerId: "b", pairId: "pair-1", slot: "derecha" }, ["a", "b"]);
    expect(next[0]).toEqual({ id: "pair-1", reves: "a", derecha: "b" });
  });

  it("devuelve las mismas parejas si nada cambia", () => {
    const pairs = createEmptyLineup();
    const current = applyLineupAction(pairs, { type: "REMOVE", pairId: "pair-1", slot: "reves" }, []);
    expect(current).toEqual(pairs);
  });
});
