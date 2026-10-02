import { describe, expect, it } from "vitest";
import { commonPrefix, compareLineups, shortLabel } from "./compare.js";
import { indexPlayers } from "./lineupSelectors.js";

// Datos del diseño (serie K): jugadores reales con sus puntos.
const playersById = indexPlayers([
  { id: "david", name: "David Trujillo", points: 78500, preferredSide: "REVES" },
  { id: "fran", name: "Francisco Zafra", points: 75468.75, preferredSide: "DERECHA" },
  { id: "rafa", name: "Rafa Bonillo", points: 73883.93, preferredSide: "REVES" },
  { id: "mauro", name: "Mauro Stopiello", points: 64375, preferredSide: "DERECHA" },
  { id: "alexis", name: "Alexis Moreno", points: 57343.75, preferredSide: "AMBOS" },
  { id: "luis", name: "Luis Rodriguez", points: 55500, preferredSide: "REVES" },
  { id: "rodrigo", name: "Rodrigo Curci", points: 53750, preferredSide: "DERECHA" },
  { id: "pep", name: "Pep Garau", points: 49583.33, preferredSide: "REVES" },
  { id: "raul", name: "Raul Garcia", points: 49166.67, preferredSide: "DERECHA" },
  { id: "javi", name: "Javier Hurtado", points: 46406.25, preferredSide: "AMBOS" },
  { id: "eze", name: "Ezequiel Campins", points: 39375, preferredSide: "DERECHA" },
]);

const pairs = (list) => list.map(([reves, derecha], i) => ({ id: `pair-${i + 1}`, reves, derecha }));

const paco = {
  id: "paco",
  name: "Jornada 4 · Paco",
  pairs: pairs([["david", "fran"], ["rafa", "mauro"], ["luis", "rodrigo"], ["pep", "alexis"], ["raul", "javi"]]),
};
const rafa = {
  id: "rafa",
  name: "Jornada 4 · Rafa",
  pairs: pairs([["david", "fran"], ["rafa", "mauro"], ["luis", "rodrigo"], ["alexis", "eze"], ["raul", "javi"]]),
};
const fran = {
  id: "fran",
  name: "Jornada 4 · Fran",
  pairs: pairs([["rafa", "fran"], ["david", "mauro"], ["luis", "rodrigo"], ["pep", "alexis"], ["raul", null]]),
};

const statusRow = (result, court) => result.rows[court - 1].cells.map((c) => c.status);

describe("compareLineups", () => {
  const result = compareLineups([paco, rafa, fran], "paco", playersById);

  it("calcula totales y jugadores de cada propuesta", () => {
    expect(result.heads.map((h) => [h.lineup.id, h.total, h.count, h.isRef])).toEqual([
      ["paco", 603977.68, 10, true],
      ["rafa", 593769.35, 10, false],
      ["fran", 557571.43, 9, false],
    ]);
  });

  it("marca pareja distinta e igual, pista a pista", () => {
    expect(statusRow(result, 1)).toEqual(["ref", "same", "diff"]);
    expect(statusRow(result, 2)).toEqual(["ref", "same", "diff"]);
    expect(result.rows[2].allSame).toBe(true);
    expect(statusRow(result, 4)).toEqual(["ref", "diff", "same"]);
    expect(statusRow(result, 5)).toEqual(["ref", "same", "diff"]);
  });

  it("señala los jugadores nuevos en una pareja distinta", () => {
    const rafaP4 = result.rows[3].cells[1].slots;
    expect(rafaP4.map((s) => [s.player.id, s.isNew])).toEqual([
      ["alexis", false],
      ["eze", true],
    ]);
  });

  it("resume quién entra, quién sale y qué falta", () => {
    const [vsRafa, vsFran] = result.summaries;
    expect(vsRafa.entering.map((p) => p.id)).toEqual(["eze"]);
    expect(vsRafa.leaving.map((p) => p.id)).toEqual(["pep"]);
    expect(vsRafa.diffCourts).toEqual([4]);
    expect(vsRafa.delta).toBe(-10208.33);

    expect(vsFran.entering).toEqual([]);
    expect(vsFran.leaving.map((p) => p.id)).toEqual(["javi"]);
    expect(vsFran.missing).toBe(1);
    expect(vsFran.diffCourts).toEqual([1, 2, 5]);
  });

  it("detecta la misma pareja en otra pista", () => {
    // Misma pareja que Paco en P5 pero con más puntos en P4 → baja al reordenar.
    const otra = {
      id: "otra",
      name: "Jornada 4 · Otra",
      pairs: pairs([["david", "fran"], ["rafa", "mauro"], ["luis", "rodrigo"], ["raul", "javi"], ["eze", null]]),
    };
    const r = compareLineups([paco, otra], "paco", playersById);
    expect(r.rows[3].cells[1]).toMatchObject({ status: "moved", fromCourt: 5 });
    expect(r.summaries[0].movedCourts).toEqual([{ from: 5, to: 4 }]);
  });

  it("cambiar la referencia cambia las diferencias", () => {
    const r = compareLineups([paco, rafa, fran], "fran", playersById);
    expect(r.refId).toBe("fran");
    expect(statusRow(r, 1)).toEqual(["diff", "diff", "ref"]);
    expect(r.summaries.map((s) => s.lineupId)).toEqual(["paco", "rafa"]);
  });

  it("todas iguales", () => {
    const copia = { ...paco, id: "copia", name: "Jornada 4 · Paco (copia)" };
    const r = compareLineups([paco, copia], "paco", playersById);
    expect(r.allSame).toBe(true);
    expect(r.summaries[0]).toMatchObject({ entering: [], leaving: [], missing: 0, diffCourts: [], movedCourts: [], delta: 0 });
  });
});

describe("etiquetas", () => {
  it("quita el prefijo común «Jornada 4 · »", () => {
    const names = ["Jornada 4 · Paco", "Jornada 4 · Rafa"];
    const prefix = commonPrefix(names);
    expect(prefix).toBe("Jornada 4");
    expect(names.map((n) => shortLabel(n, prefix))).toEqual(["Paco", "Rafa"]);
  });

  it("sin prefijo común deja los nombres completos", () => {
    expect(commonPrefix(["Jornada 4 · Paco", "Previa liga"])).toBe("");
    expect(commonPrefix(["Jornada 4"])).toBe("");
  });
});
