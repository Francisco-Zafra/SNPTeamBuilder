import { describe, expect, it } from "vitest";
import { createEmptyLineup } from "../domain/lineupReducer.js";
import { getCourts, indexPlayers } from "../domain/lineupSelectors.js";
import { buildLineupText } from "./share.js";

const player = (id, firstName, lastName, points, extra = {}) => ({
  id,
  firstName,
  lastName,
  name: `${firstName} ${lastName}`,
  points,
  preferredSide: "SIN_ASIGNAR",
  ...extra,
});

const players = indexPlayers([
  player("david", "David Gerardo", "Trujillo Vasquez", 78500),
  player("fran", "Francisco", "Zafra Del Moral", 75468.75, { alias: "Fran", name: "Fran" }),
  player("raul", "Raul", "Garcia Raga", 49166.67),
  player("javih", "Javier", "Hurtado Martin", 46406.25),
  player("javir", "Javier", "Ruiz Lopez", 15625),
]);

const lineupWith = (spec) =>
  createEmptyLineup().map((pair) => {
    const [reves = null, derecha = null] = spec[pair.id] ?? [];
    return { ...pair, reves, derecha };
  });

describe("buildLineupText", () => {
  it("una línea por pista, nombres cortos, sin puntos y con título decorado", () => {
    const courts = getCourts(
      lineupWith({ "pair-2": ["raul", "javih"], "pair-4": ["david", "fran"], "pair-5": ["javir"] }),
      players
    );

    expect(buildLineupText({ lineupName: "Jornada 4 · vs Pádel Indoor Sur", lineupDate: "2026-10-10", courts })).toBe(
      [
        "🎾 *Jornada 4 · vs Pádel Indoor Sur - Sáb 10/10*",
        "",
        "*Pista 1:* David - Fran",
        "*Pista 2:* Raul - Javier H.",
        "*Pista 3:* Javier R. - —",
        "*Pista 4:* —",
        "*Pista 5:* —",
        "",
        "💪 ¡Vamos equipo!",
      ].join("\n")
    );
  });

  it("sin fecha el título es solo el nombre; sin nombre, «Alineación»", () => {
    const courts = getCourts(createEmptyLineup(), players);
    expect(buildLineupText({ lineupName: "Jornada 4", lineupDate: null, courts })).toMatch(/^🎾 \*Jornada 4\*\n/);
    expect(buildLineupText({ lineupName: null, courts })).toMatch(/^🎾 \*Alineación\*\n/);
  });

  it("no incluye puntos", () => {
    const courts = getCourts(lineupWith({ "pair-1": ["david"] }), players);
    expect(buildLineupText({ lineupName: "X", courts })).not.toMatch(/pts|78\.500/);
  });
});
