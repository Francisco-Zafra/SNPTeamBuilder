import { describe, expect, it } from "vitest";
import { createEmptyLineup } from "./lineupReducer.js";
import {
  countPlacedPlayers,
  getCourts,
  getPlayerCourtMap,
  getTotalPoints,
  indexPlayers,
} from "./lineupSelectors.js";

const players = indexPlayers([
  { id: "david", name: "David", points: 78500, preferredSide: "REVES" },
  { id: "fran", name: "Francisco", points: 75468.75, preferredSide: "DERECHA" },
  { id: "pep", name: "Pep", points: 49583.33, preferredSide: "REVES" },
  { id: "alexis", name: "Alexis", points: 57343.75, preferredSide: "AMBOS" },
  { id: "raul", name: "Raul", points: 49166.67, preferredSide: "DERECHA" },
  { id: "seb", name: "Sebastien", points: 0, preferredSide: "SIN_ASIGNAR" },
]);

function lineupOf(spec) {
  return createEmptyLineup().map((pair) => {
    const [reves = null, derecha = null] = spec[pair.id] ?? [];
    return { ...pair, reves, derecha };
  });
}

describe("getCourts", () => {
  it("ordena las pistas por puntos de pareja, de mayor a menor (norma SNP)", () => {
    const courts = getCourts(
      lineupOf({
        "pair-1": ["raul"],
        "pair-3": ["david", "fran"],
        "pair-4": ["pep", "alexis"],
      }),
      players
    );

    expect(courts.map((c) => [c.court, c.pairId])).toEqual([
      [1, "pair-3"],
      [2, "pair-4"],
      [3, "pair-1"],
      [4, "pair-2"],
      [5, "pair-5"],
    ]);
    expect(courts[0].points).toBe(153968.75);
    expect(courts[1].points).toBeCloseTo(106927.08, 2);
    expect(courts[2].points).toBe(49166.67);
  });

  it("devuelve cada hueco con su jugador y el aviso de posición", () => {
    const [court] = getCourts(lineupOf({ "pair-1": ["raul", "alexis"] }), players);
    expect(court.reves).toEqual({ player: players.get("raul"), mismatch: true });
    expect(court.derecha).toEqual({ player: players.get("alexis"), mismatch: false });
  });

  it("las parejas vacías van al final aunque haya una pareja con 0 puntos", () => {
    const courts = getCourts(lineupOf({ "pair-4": ["seb"] }), players);
    expect(courts[0].pairId).toBe("pair-4");
    expect(courts[0].points).toBe(0);
    expect(courts.slice(1).map((c) => c.pairId)).toEqual(["pair-1", "pair-2", "pair-3", "pair-5"]);
  });

  it("empate: orden estable por posición interna", () => {
    const tied = indexPlayers([
      { id: "a", name: "A", points: 100 },
      { id: "b", name: "B", points: 100 },
    ]);
    const courts = getCourts(lineupOf({ "pair-5": ["a"], "pair-2": ["b"] }), tied);
    expect(courts.slice(0, 2).map((c) => c.pairId)).toEqual(["pair-2", "pair-5"]);
  });

  it("trata como vacío un ID que no está en la plantilla", () => {
    const [court] = getCourts(lineupOf({ "pair-1": ["ghost", "david"] }), players);
    expect(court.reves).toBeNull();
    expect(court.points).toBe(78500);
  });
});

describe("totales", () => {
  const courts = getCourts(
    lineupOf({ "pair-1": ["david", "fran"], "pair-2": ["pep"], "pair-3": [null, "raul"] }),
    players
  );

  it("suma los puntos de todas las parejas", () => {
    expect(getTotalPoints(courts)).toBeCloseTo(78500 + 75468.75 + 49583.33 + 49166.67, 2);
  });

  it("cuenta los jugadores colocados", () => {
    expect(countPlacedPlayers(courts)).toBe(4);
  });

  it("indica en qué pista juega cada jugador", () => {
    const map = getPlayerCourtMap(courts);
    expect(map.get("david")).toBe(1);
    expect(map.get("pep")).toBe(2);
    expect(map.get("raul")).toBe(3);
    expect(map.has("alexis")).toBe(false);
  });
});
