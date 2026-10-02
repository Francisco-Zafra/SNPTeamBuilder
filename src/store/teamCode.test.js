import { describe, expect, it, vi } from "vitest";
import { inviteLink, readCodeFromHash, resolveTeamCode } from "./teamCode.js";

const CODE = "x7Fq92LmAb3dQz1K";

describe("readCodeFromHash", () => {
  it("lee el código del hash", () => {
    expect(readCodeFromHash(`#k=${CODE}`)).toBe(CODE);
    expect(readCodeFromHash(`#a=1&k=${CODE}`)).toBe(CODE);
  });

  it("ignora códigos ausentes o con formato inválido", () => {
    expect(readCodeFromHash("")).toBeNull();
    expect(readCodeFromHash("#k=corto")).toBeNull();
    expect(readCodeFromHash("#k=../../etc/passwd")).toBeNull();
  });
});

describe("resolveTeamCode", () => {
  const memory = () => {
    const data = new Map();
    globalThis.localStorage = {
      getItem: (k) => (data.has(k) ? data.get(k) : null),
      setItem: (k, v) => data.set(k, String(v)),
      removeItem: (k) => data.delete(k),
    };
    return data;
  };

  it("guarda el código del enlace y lo quita de la URL", () => {
    const data = memory();
    const history = { replaceState: vi.fn() };
    const code = resolveTeamCode({ hash: `#k=${CODE}`, pathname: "/SNPTeamBuilder/", search: "" }, history);
    expect(code).toBe(CODE);
    expect(JSON.parse(data.get("snp:v1:team-code"))).toBe(CODE);
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/SNPTeamBuilder/");
  });

  it("sin enlace usa el código guardado", () => {
    memory().set("snp:v1:team-code", JSON.stringify(CODE));
    expect(resolveTeamCode({ hash: "", pathname: "/", search: "" }, { replaceState: vi.fn() })).toBe(CODE);
  });

  it("sin enlace ni código guardado: modo local", () => {
    memory();
    expect(resolveTeamCode({ hash: "", pathname: "/", search: "" }, { replaceState: vi.fn() })).toBeNull();
  });
});

describe("inviteLink", () => {
  it("construye el enlace para compartir", () => {
    expect(inviteLink(CODE, { origin: "https://francisco-zafra.github.io", pathname: "/SNPTeamBuilder/" })).toBe(
      `https://francisco-zafra.github.io/SNPTeamBuilder/#k=${CODE}`
    );
  });
});
