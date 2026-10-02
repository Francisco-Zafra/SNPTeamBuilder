import { describe, expect, it } from "vitest";
import { createEmptyLineup } from "../domain/lineupReducer.js";
import { getCourts, indexPlayers } from "../domain/lineupSelectors.js";
import { buildLineupText } from "./share.js";

const players = indexPlayers([
  { id: "david", name: "David Gerardo Trujillo Vasquez", points: 78500, preferredSide: "REVES" },
  { id: "fran", name: "Francisco Zafra Del Moral", points: 75468.75, preferredSide: "DERECHA" },
  { id: "raul", name: "Raul Garcia Raga", points: 49166.67, preferredSide: "DERECHA" },
]);

describe("buildLineupText", () => {
  it("genera el texto para WhatsApp: nombre en negrita, pistas en orden y sin puntos", () => {
    const lineup = createEmptyLineup().map((pair) =>
      pair.id === "pair-2"
        ? { ...pair, reves: "raul" }
        : pair.id === "pair-4"
          ? { ...pair, reves: "david", derecha: "fran" }
          : pair
    );
    const courts = getCourts(lineup, players);

    expect(buildLineupText({ lineupName: "Jornada 4 · vs Pádel Indoor Sur", courts })).toBe(
      [
        "*Jornada 4 · vs Pádel Indoor Sur*",
        "",
        "*Pista 1*",
        "R: David Gerardo Trujillo Vasquez",
        "D: Francisco Zafra Del Moral",
        "",
        "*Pista 2*",
        "R: Raul Garcia Raga",
        "D: —",
        "",
        "*Pista 3*",
        "R: —",
        "D: —",
        "",
        "*Pista 4*",
        "R: —",
        "D: —",
        "",
        "*Pista 5*",
        "R: —",
        "D: —",
      ].join("\n")
    );
  });

  it("no incluye puntos", () => {
    const courts = getCourts(createEmptyLineup().map((p, i) => (i === 0 ? { ...p, reves: "david" } : p)), players);
    expect(buildLineupText({ lineupName: "X", courts })).not.toMatch(/pts|78\.500/);
  });

  it("sin nombre usa «Alineación»", () => {
    const courts = getCourts(createEmptyLineup(), players);
    expect(buildLineupText({ lineupName: null, courts })).toMatch(/^\*Alineación\*\n/);
  });
});
