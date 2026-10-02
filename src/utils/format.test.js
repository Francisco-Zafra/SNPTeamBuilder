import { describe, expect, it } from "vitest";
import { formatDateTime, formatPoints, formatRelative, formatShortDate } from "./format.js";

describe("formatPoints", () => {
  it("usa formato español, agrupando también los números de 4 cifras", () => {
    expect(formatPoints(3125)).toBe("3.125");
    expect(formatPoints(57343.75)).toBe("57.343,75");
    expect(formatPoints(153968.75)).toBe("153.968,75");
    expect(formatPoints(0)).toBe("0");
  });

  it("redondea a 2 decimales y oculta el ruido de coma flotante", () => {
    expect(formatPoints(49583.33 + 57343.75)).toBe("106.927,08");
    expect(formatPoints(0.1 + 0.2)).toBe("0,3");
  });
});

describe("formatDateTime", () => {
  it("muestra día/mes y hora con dos dígitos", () => {
    expect(formatDateTime(new Date(2026, 9, 2, 11, 58).getTime())).toBe("02/10 11:58");
    expect(formatDateTime(new Date(2026, 0, 9, 7, 5).getTime())).toBe("09/01 07:05");
  });
});

describe("formatShortDate", () => {
  it("muestra día de la semana y día/mes", () => {
    expect(formatShortDate("2026-10-10")).toBe("Sáb 10/10");
    expect(formatShortDate("2026-09-26")).toBe("Sáb 26/09");
  });

  it("vacío si no hay fecha o no es válida", () => {
    expect(formatShortDate(null)).toBe("");
    expect(formatShortDate("2026-02-31")).toBe("");
    expect(formatShortDate("10/10/2026")).toBe("");
  });
});

describe("formatRelative", () => {
  const now = new Date(2026, 9, 2, 12, 0).getTime();
  const ago = (ms) => formatRelative(now - ms, now);
  const MIN = 60000;

  it("usa la unidad adecuada", () => {
    expect(ago(10 * 1000)).toBe("ahora mismo");
    expect(ago(5 * MIN)).toBe("hace 5 min");
    expect(ago(3 * 60 * MIN)).toBe("hace 3 h");
    expect(ago(30 * 60 * MIN)).toBe("ayer");
    expect(ago(6 * 24 * 60 * MIN)).toBe("hace 6 días");
    expect(ago(21 * 24 * 60 * MIN)).toBe("hace 3 semanas");
    expect(ago(90 * 24 * 60 * MIN)).toBe("el 04/07");
  });
});
