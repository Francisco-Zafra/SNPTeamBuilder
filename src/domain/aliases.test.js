import { describe, expect, it } from "vitest";
import { cleanAlias, restoreAliases, setAlias } from "./aliases.js";

describe("cleanAlias", () => {
  it("quita espacios sobrantes y recorta a 24 caracteres", () => {
    expect(cleanAlias("  El   Rubio ")).toBe("El Rubio");
    expect(cleanAlias("x".repeat(40))).toHaveLength(24);
    expect(cleanAlias(null)).toBe("");
  });
});

describe("restoreAliases", () => {
  it("conserva solo alias de texto no vacíos", () => {
    expect(restoreAliases({ a: "Fran", b: "  ", c: 3, d: " Pep " })).toEqual({ a: "Fran", d: "Pep" });
    expect(restoreAliases(null)).toEqual({});
    expect(restoreAliases(["Fran"])).toEqual({});
  });
});

describe("setAlias", () => {
  it("asigna sin mutar y un alias vacío lo quita", () => {
    const aliases = { a: "Fran" };
    expect(setAlias(aliases, "b", " Pep ")).toEqual({ a: "Fran", b: "Pep" });
    expect(setAlias(aliases, "a", "   ")).toEqual({});
    expect(aliases).toEqual({ a: "Fran" });
  });
});
