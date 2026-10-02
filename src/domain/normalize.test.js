import { describe, expect, it } from "vitest";
import {
  cleanSpaces,
  getPlayerPoints,
  getTeamName,
  normalizeRoster,
  toTitleCase,
} from "./normalize.js";
import response from "./__fixtures__/snpResponse.json";

describe("cleanSpaces / toTitleCase", () => {
  it("quita espacios sobrantes", () => {
    expect(cleanSpaces("  Sebastien   Sánchez  ")).toBe("Sebastien Sánchez");
    expect(cleanSpaces(null)).toBe("");
  });

  it("pasa a formato título respetando tildes y guiones", () => {
    expect(toTitleCase("MORENO LÓPEZ")).toBe("Moreno López");
    expect(toTitleCase("ÁLVARO GARCÍA-PÉREZ")).toBe("Álvaro García-Pérez");
    expect(toTitleCase("del moral")).toBe("Del Moral");
  });
});

describe("getPlayerPoints", () => {
  it("usa la primera entrada de Ranking, no `orden`", () => {
    expect(getPlayerPoints({ Ranking: [{ puntos: "57343.75", orden: "172" }, { puntos: "0" }] })).toBe(
      57343.75
    );
  });

  it("devuelve 0 si no hay ranking o el valor no es numérico", () => {
    expect(getPlayerPoints({ Ranking: [] })).toBe(0);
    expect(getPlayerPoints({})).toBe(0);
    expect(getPlayerPoints({ Ranking: [{ puntos: null }] })).toBe(0);
    expect(getPlayerPoints({ Ranking: [{ puntos: "abc" }] })).toBe(0);
  });
});

describe("normalizeRoster con datos reales de SNP", () => {
  const { teamName, players } = normalizeRoster(response.entities, 8201);
  const byId = Object.fromEntries(players.map((p) => [p.id, p]));

  it("obtiene el nombre del equipo", () => {
    expect(teamName).toBe("IMPACTO 360 MÁLAGA PADEL TEAM");
  });

  it("normaliza nombres sucios", () => {
    expect(byId["316870"]).toEqual({
      id: "316870",
      name: "Alexis Moreno López",
      firstName: "Alexis",
      lastName: "Moreno López",
      points: 57343.75,
    });
    expect(byId["398480"].name).toBe("Sebastien Sánchez Sánchez");
    expect(byId["331277"].name).toBe("Daniel Eliot Lolani García Fernandez");
  });

  it("jugador sin partidos tiene 0 puntos", () => {
    expect(byId["398480"].points).toBe(0);
  });

  it("ignora entradas sin id y duplicadas", () => {
    const result = normalizeRoster([...response.entities, response.entities[0], {}], 8201);
    expect(result.players).toHaveLength(response.entities.length);
  });
});

describe("getTeamName", () => {
  it("devuelve null si ningún jugador está vinculado al equipo", () => {
    expect(getTeamName(response.entities, 1)).toBeNull();
    expect(getTeamName([], 8201)).toBeNull();
  });
});
