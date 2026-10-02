import { describe, expect, it } from "vitest";
import { readJSON, writeJSON } from "./storage.js";

function memoryStorage() {
  const data = new Map();
  return {
    data,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
  };
}

describe("storage", () => {
  it("guarda y lee JSON con prefijo versionado", () => {
    const storage = memoryStorage();
    expect(writeJSON("lineup", [1, 2], storage)).toBe(true);
    expect(storage.data.has("snp:v1:lineup")).toBe(true);
    expect(readJSON("lineup", null, storage)).toEqual([1, 2]);
  });

  it("devuelve el fallback si no existe o el JSON está corrupto", () => {
    const storage = memoryStorage();
    expect(readJSON("lineup", "x", storage)).toBe("x");
    storage.data.set("snp:v1:lineup", "{roto");
    expect(readJSON("lineup", "x", storage)).toBe("x");
  });

  it("no lanza si el almacenamiento falla o no existe", () => {
    const broken = {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("lleno");
      },
    };
    expect(readJSON("lineup", "x", broken)).toBe("x");
    expect(writeJSON("lineup", 1, broken)).toBe(false);
    expect(writeJSON("lineup", 1, null)).toBe(false);
  });
});
