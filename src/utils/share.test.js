import { describe, expect, it } from "vitest";
import { createEmptyLineup } from "../domain/lineupReducer.js";
import { getCourts, getTotalPoints, indexPlayers } from "../domain/lineupSelectors.js";
import { buildLineupText } from "./share.js";

const players = indexPlayers([
  { id: "david", name: "David Gerardo Trujillo Vasquez", points: 78500, preferredSide: "REVES" },
  { id: "fran", name: "Francisco Zafra Del Moral", points: 75468.75, preferredSide: "DERECHA" },
  { id: "raul", name: "Raul Garcia Raga", points: 49166.67, preferredSide: "DERECHA" },
]);

describe("buildLineupText", () => {
  it("genera el texto para WhatsApp en el orden de pistas", () => {
    const lineup = createEmptyLineup().map((pair) =>
      pair.id === "pair-2"
        ? { ...pair, reves: "raul" }
        : pair.id === "pair-4"
          ? { ...pair, reves: "david", derecha: "fran" }
          : pair
    );
    const courts = getCourts(lineup, players);

    expect(
      buildLineupText({
        teamName: "IMPACTO 360 MÁLAGA PADEL TEAM",
        courts,
        totalPoints: getTotalPoints(courts),
      })
    ).toBe(
      [
        "IMPACTO 360 MÁLAGA PADEL TEAM — Alineación",
        "",
        "Pista 1 · 153.968,75 pts",
        "  R: David Gerardo Trujillo Vasquez (78.500)",
        "  D: Francisco Zafra Del Moral (75.468,75)",
        "",
        "Pista 2 · 49.166,67 pts",
        "  R: Raul Garcia Raga (49.166,67)",
        "  D: —",
        "",
        "Pista 3 · 0 pts",
        "  R: —",
        "  D: —",
        "",
        "Pista 4 · 0 pts",
        "  R: —",
        "  D: —",
        "",
        "Pista 5 · 0 pts",
        "  R: —",
        "  D: —",
        "",
        "Total: 203.135,42 pts",
      ].join("\n")
    );
  });

  it("sin nombre de equipo usa un título genérico", () => {
    const courts = getCourts(createEmptyLineup(), players);
    expect(buildLineupText({ teamName: null, courts, totalPoints: 0 })).toMatch(/^Alineación\n/);
  });
});
