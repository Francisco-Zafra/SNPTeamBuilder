import { describe, expect, it } from "vitest";
import { SIDES, SLOTS, hasPositionMismatch, restoreSides, setSide } from "./sides.js";

describe("restoreSides", () => {
  it("conserva solo valores válidos y descarta SIN_ASIGNAR", () => {
    expect(
      restoreSides({ a: "REVES", b: "AMBOS", c: "SIN_ASIGNAR", d: "PORTERO", e: 3 })
    ).toEqual({ a: "REVES", b: "AMBOS" });
  });

  it("devuelve {} ante datos inválidos", () => {
    expect(restoreSides(null)).toEqual({});
    expect(restoreSides(["REVES"])).toEqual({});
    expect(restoreSides("REVES")).toEqual({});
  });
});

describe("setSide", () => {
  it("asigna sin mutar el original", () => {
    const sides = { a: "REVES" };
    expect(setSide(sides, "b", SIDES.DERECHA)).toEqual({ a: "REVES", b: "DERECHA" });
    expect(sides).toEqual({ a: "REVES" });
  });

  it("SIN_ASIGNAR elimina la entrada", () => {
    expect(setSide({ a: "REVES" }, "a", SIDES.SIN_ASIGNAR)).toEqual({});
  });
});

describe("hasPositionMismatch", () => {
  const player = (preferredSide) => ({ preferredSide });

  it("avisa si un Revés juega en Derecha y viceversa", () => {
    expect(hasPositionMismatch(player(SIDES.REVES), SLOTS.DERECHA)).toBe(true);
    expect(hasPositionMismatch(player(SIDES.DERECHA), SLOTS.REVES)).toBe(true);
    expect(hasPositionMismatch(player(SIDES.REVES), SLOTS.REVES)).toBe(false);
  });

  it("AMBOS y SIN_ASIGNAR nunca avisan", () => {
    for (const slot of [SLOTS.REVES, SLOTS.DERECHA]) {
      expect(hasPositionMismatch(player(SIDES.AMBOS), slot)).toBe(false);
      expect(hasPositionMismatch(player(SIDES.SIN_ASIGNAR), slot)).toBe(false);
      expect(hasPositionMismatch(player(undefined), slot)).toBe(false);
    }
  });
});
