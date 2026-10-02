import { describe, expect, it } from "vitest";
import { formatDateTime, formatPoints } from "./format.js";

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
