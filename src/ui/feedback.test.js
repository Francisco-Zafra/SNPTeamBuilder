import { describe, expect, it } from "vitest";
import { createEmptyLineup, lineupReducer } from "../domain/lineupReducer.js";
import { indexPlayers } from "../domain/lineupSelectors.js";
import { placementFeedback } from "./feedback.js";

const playersById = indexPlayers([
  { id: "david", name: "David Trujillo", firstName: "David", lastName: "Trujillo", points: 78500, preferredSide: "REVES" },
  { id: "fran", name: "Francisco Zafra", firstName: "Francisco", lastName: "Zafra", points: 75468.75, preferredSide: "DERECHA" },
  { id: "raul", name: "Raul Garcia", firstName: "Raul", lastName: "Garcia", points: 49166.67, preferredSide: "DERECHA" },
  { id: "pep", name: "Pep Garau", firstName: "Pep", lastName: "Garau", points: 49583.33, preferredSide: "AMBOS" },
]);

function run(before, action) {
  const full = { type: "PLACE", ...action };
  const after = lineupReducer(before, full);
  return placementFeedback({ before, after, action: full, playersById });
}

const lineupOf = (spec) =>
  createEmptyLineup().map((pair) => {
    const [reves = null, derecha = null] = spec[pair.id] ?? [];
    return { ...pair, reves, derecha };
  });

describe("placementFeedback", () => {
  it("colocar en la primera pista vacía muestra pista y puntos", () => {
    expect(run(lineupOf({}), { playerId: "david", pairId: "pair-1", slot: "reves" })).toEqual({
      title: "David Trujillo → Pista 1 · Revés",
      sub: "Pista 1 · 78.500 pts",
      kind: "ok",
    });
  });

  it("avisa cuando las pistas se reordenan", () => {
    const before = lineupOf({ "pair-1": ["pep"] });
    expect(run(before, { playerId: "david", pairId: "pair-2", slot: "reves" }).sub).toBe(
      "Las pistas se han reordenado por puntos"
    );
  });

  it("sustitución: el ocupante vuelve a la plantilla", () => {
    const before = lineupOf({ "pair-1": ["pep"] });
    expect(run(before, { playerId: "david", pairId: "pair-1", slot: "reves" }).sub).toBe(
      "Pep Garau vuelve a la plantilla"
    );
  });

  it("intercambio entre huecos", () => {
    const before = lineupOf({ "pair-1": ["pep"], "pair-2": [null, "fran"] });
    expect(run(before, { playerId: "pep", pairId: "pair-2", slot: "derecha" }).sub).toBe(
      "Intercambiado con Francisco Zafra"
    );
  });

  it("aviso de posición tiene prioridad y tipo warn", () => {
    const result = run(lineupOf({}), { playerId: "raul", pairId: "pair-1", slot: "reves" });
    expect(result.sub).toBe("Aviso: prefiere Derecha");
    expect(result.kind).toBe("warn");
  });

  it("sin cambios devuelve null", () => {
    const before = lineupOf({ "pair-1": ["david"] });
    expect(run(before, { playerId: "david", pairId: "pair-1", slot: "reves" })).toBeNull();
  });
});
