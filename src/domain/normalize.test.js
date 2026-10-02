import { describe, expect, it } from "vitest";
import {
  cleanSpaces,
  getPlayerPoints,
  getTeamCategory,
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
  // Alexis (real): categoría 20 con 57.343,75 y categoría 19 con 0. SNP devuelve el orden al azar.
  const alexis = [
    { idcategoria: "19", puntos: "0", orden: "14399" },
    { idcategoria: "20", puntos: "57343.75", orden: "172" },
    { idcategoria: "19", puntos: "0", orden: "1826" },
    { idcategoria: "20", puntos: "57343.75", orden: "1984" },
  ];

  it("usa la categoría del equipo, sea cual sea el orden de Ranking", () => {
    for (let i = 0; i < alexis.length; i++) {
      const rotated = [...alexis.slice(i), ...alexis.slice(0, i)];
      expect(getPlayerPoints({ Ranking: rotated }, "20")).toBe(57343.75);
      expect(getPlayerPoints({ Ranking: [...rotated].reverse() }, 20)).toBe(57343.75);
    }
  });

  it("respeta la categoría aunque otra tenga más puntos", () => {
    const ranking = [{ idcategoria: "19", puntos: "90000" }, { idcategoria: "20", puntos: "1000" }];
    expect(getPlayerPoints({ Ranking: ranking }, "20")).toBe(1000);
  });

  it("sin categoría conocida o sin entradas de ella, el máximo; nunca `orden`", () => {
    expect(getPlayerPoints({ Ranking: alexis })).toBe(57343.75);
    expect(getPlayerPoints({ Ranking: alexis }, "99")).toBe(57343.75);
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

describe("getTeamCategory (datos reales)", () => {
  it("obtiene la categoría del equipo", () => {
    expect(getTeamCategory(response.entities, 8201)).toBe("20");
    expect(getTeamCategory(response.entities, 1)).toBeNull();
  });
});

describe("getTeamName", () => {
  it("devuelve null si ningún jugador está vinculado al equipo", () => {
    expect(getTeamName(response.entities, 1)).toBeNull();
    expect(getTeamName([], 8201)).toBeNull();
  });
});
