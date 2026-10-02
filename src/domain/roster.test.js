import { describe, expect, it } from "vitest";
import { groupPlayersBySide, restoreRosterCache, sortByPoints, withPreferredSides } from "./roster.js";

const players = [
  { id: "1", name: "Paco", points: 3125 },
  { id: "2", name: "David", points: 78500 },
  { id: "3", name: "Daniel", points: 3125 },
  { id: "4", name: "Alexis", points: 57343.75 },
  { id: "5", name: "Sebastien", points: 0 },
];

describe("withPreferredSides", () => {
  it("aplica las posiciones guardadas y SIN_ASIGNAR por defecto", () => {
    const result = withPreferredSides(players, { 2: "REVES" });
    expect(result.find((p) => p.id === "2").preferredSide).toBe("REVES");
    expect(result.find((p) => p.id === "1").preferredSide).toBe("SIN_ASIGNAR");
  });
});

describe("withPreferredSides con alias", () => {
  it("el alias sustituye al nombre y se conserva el completo", () => {
    const [p] = withPreferredSides([{ id: "1", name: "Francisco Zafra Del Moral", points: 1 }], {}, { 1: "Fran" });
    expect(p).toMatchObject({ name: "Fran", alias: "Fran", fullName: "Francisco Zafra Del Moral" });
  });

  it("sin alias todo queda igual", () => {
    const [p] = withPreferredSides([{ id: "1", name: "Paco Muro", points: 1 }], {});
    expect(p).toMatchObject({ name: "Paco Muro", alias: null, fullName: "Paco Muro" });
  });
});

describe("sortByPoints", () => {
  it("ordena de mayor a menor y desempata por nombre", () => {
    expect(sortByPoints(players).map((p) => p.name)).toEqual([
      "David",
      "Alexis",
      "Daniel",
      "Paco",
      "Sebastien",
    ]);
  });
});

describe("groupPlayersBySide", () => {
  it("devuelve los cuatro grupos en orden fijo, cada uno ordenado", () => {
    const groups = groupPlayersBySide(
      withPreferredSides(players, { 1: "REVES", 2: "REVES", 4: "AMBOS" })
    );
    expect(groups.map((g) => g.side)).toEqual(["REVES", "DERECHA", "AMBOS", "SIN_ASIGNAR"]);
    expect(groups[0].players.map((p) => p.id)).toEqual(["2", "1"]);
    expect(groups[1].players).toEqual([]);
    expect(groups[2].players.map((p) => p.id)).toEqual(["4"]);
    expect(groups[3].players.map((p) => p.id)).toEqual(["3", "5"]);
  });
});

describe("restoreRosterCache", () => {
  it("acepta una caché válida", () => {
    const cache = { fetchedAt: 1, teamName: "Equipo", players };
    expect(restoreRosterCache(cache)).toEqual(cache);
  });

  it("filtra jugadores inválidos y rechaza cachés inservibles", () => {
    expect(
      restoreRosterCache({ fetchedAt: 1, teamName: null, players: [players[0], { id: 2 }] }).players
    ).toEqual([players[0]]);
    expect(restoreRosterCache({ fetchedAt: 1, players: [] })).toBeNull();
    expect(restoreRosterCache({ players })).toBeNull();
    expect(restoreRosterCache(null)).toBeNull();
  });
});
