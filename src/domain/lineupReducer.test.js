import { describe, expect, it } from "vitest";
import { createEmptyLineup, findPlayerSlot, lineupReducer, restoreLineup } from "./lineupReducer.js";

/** Construye una alineación a partir de `{ "pair-1": ["a", "b"], ... }`. */
function lineupOf(spec) {
  return createEmptyLineup().map((pair) => {
    const [reves = null, derecha = null] = spec[pair.id] ?? [];
    return { ...pair, reves, derecha };
  });
}

const place = (lineup, playerId, pairId, slot) =>
  lineupReducer(lineup, { type: "PLACE", playerId, pairId, slot });

describe("createEmptyLineup", () => {
  it("crea 5 parejas vacías", () => {
    expect(createEmptyLineup()).toEqual([
      { id: "pair-1", reves: null, derecha: null },
      { id: "pair-2", reves: null, derecha: null },
      { id: "pair-3", reves: null, derecha: null },
      { id: "pair-4", reves: null, derecha: null },
      { id: "pair-5", reves: null, derecha: null },
    ]);
  });
});

describe("PLACE", () => {
  it("plantilla → hueco vacío: se coloca", () => {
    expect(place(lineupOf({}), "a", "pair-2", "reves")).toEqual(lineupOf({ "pair-2": ["a"] }));
  });

  it("plantilla → hueco ocupado: sustituye y el ocupante vuelve a la plantilla", () => {
    const result = place(lineupOf({ "pair-1": ["q", "x"] }), "a", "pair-1", "reves");
    expect(result).toEqual(lineupOf({ "pair-1": ["a", "x"] }));
    expect(findPlayerSlot(result, "q")).toBeNull();
  });

  it("alineado → hueco vacío: se mueve", () => {
    expect(place(lineupOf({ "pair-1": ["a", "x"] }), "a", "pair-3", "derecha")).toEqual(
      lineupOf({ "pair-1": [null, "x"], "pair-3": [null, "a"] })
    );
  });

  it("alineado → hueco ocupado de otra pareja: intercambio", () => {
    expect(
      place(lineupOf({ "pair-1": ["a", "x"], "pair-4": ["y", "q"] }), "a", "pair-4", "derecha")
    ).toEqual(lineupOf({ "pair-1": ["q", "x"], "pair-4": ["y", "a"] }));
  });

  it("alineado → otro hueco de la misma pareja: intercambio dentro de la pareja", () => {
    expect(place(lineupOf({ "pair-2": ["a", "b"] }), "a", "pair-2", "derecha")).toEqual(
      lineupOf({ "pair-2": ["b", "a"] })
    );
    expect(place(lineupOf({ "pair-2": ["a"] }), "a", "pair-2", "derecha")).toEqual(
      lineupOf({ "pair-2": [null, "a"] })
    );
  });

  it("mismo hueco: no cambia nada (misma referencia)", () => {
    const lineup = lineupOf({ "pair-1": ["a"] });
    expect(place(lineup, "a", "pair-1", "reves")).toBe(lineup);
  });

  it("nunca deja a un jugador repetido", () => {
    let lineup = lineupOf({});
    lineup = place(lineup, "a", "pair-1", "reves");
    lineup = place(lineup, "a", "pair-2", "reves");
    lineup = place(lineup, "a", "pair-5", "derecha");
    const ids = lineup.flatMap((p) => [p.reves, p.derecha]).filter(Boolean);
    expect(ids).toEqual(["a"]);
  });

  it("ignora pareja o hueco inexistentes", () => {
    const lineup = lineupOf({});
    expect(place(lineup, "a", "pair-9", "reves")).toBe(lineup);
    expect(place(lineup, "a", "pair-1", "centro")).toBe(lineup);
    expect(place(lineup, null, "pair-1", "reves")).toBe(lineup);
  });

  it("no muta el estado anterior", () => {
    const lineup = lineupOf({ "pair-1": ["a", "x"] });
    const snapshot = structuredClone(lineup);
    place(lineup, "a", "pair-2", "reves");
    expect(lineup).toEqual(snapshot);
  });
});

describe("REMOVE", () => {
  it("vacía el hueco", () => {
    expect(
      lineupReducer(lineupOf({ "pair-1": ["a", "x"] }), { type: "REMOVE", pairId: "pair-1", slot: "reves" })
    ).toEqual(lineupOf({ "pair-1": [null, "x"] }));
  });

  it("hueco ya vacío: misma referencia", () => {
    const lineup = lineupOf({});
    expect(lineupReducer(lineup, { type: "REMOVE", pairId: "pair-1", slot: "reves" })).toBe(lineup);
  });
});

describe("CLEAR", () => {
  it("vacía todas las parejas", () => {
    expect(lineupReducer(lineupOf({ "pair-1": ["a", "b"], "pair-5": ["c"] }), { type: "CLEAR" })).toEqual(
      createEmptyLineup()
    );
  });
});

describe("PRUNE", () => {
  it("quita los jugadores que ya no están en la plantilla", () => {
    expect(
      lineupReducer(lineupOf({ "pair-1": ["a", "gone"], "pair-2": ["b"] }), {
        type: "PRUNE",
        validIds: ["a", "b"],
      })
    ).toEqual(lineupOf({ "pair-1": ["a"], "pair-2": ["b"] }));
  });

  it("sin cambios: misma referencia", () => {
    const lineup = lineupOf({ "pair-1": ["a"] });
    expect(lineupReducer(lineup, { type: "PRUNE", validIds: ["a"] })).toBe(lineup);
  });
});

describe("restoreLineup", () => {
  it("recupera una alineación guardada válida", () => {
    const stored = lineupOf({ "pair-1": ["a", "b"], "pair-3": [null, "c"] });
    expect(restoreLineup(stored)).toEqual(stored);
  });

  it("devuelve una alineación vacía ante datos inválidos", () => {
    expect(restoreLineup(null)).toEqual(createEmptyLineup());
    expect(restoreLineup({ foo: 1 })).toEqual(createEmptyLineup());
  });

  it("ignora parejas desconocidas, valores no válidos y repetidos", () => {
    expect(
      restoreLineup([
        { id: "pair-1", reves: "a", derecha: 42 },
        { id: "pair-2", reves: "a", derecha: "b" },
        { id: "pair-9", reves: "z", derecha: null },
      ])
    ).toEqual(lineupOf({ "pair-1": ["a"], "pair-2": [null, "b"] }));
  });
});
