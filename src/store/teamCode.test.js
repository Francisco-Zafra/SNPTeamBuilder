import { describe, expect, it, vi } from "vitest";
import { inviteLink, parseTeamLink, readCodeFromHash, resolveTeamCode } from "./teamCode.js";

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

describe("parseTeamLink", () => {
  it("acepta el enlace completo o el código suelto", () => {
    expect(parseTeamLink(`https://francisco-zafra.github.io/SNPTeamBuilder/#k=${CODE}`)).toBe(CODE);
    expect(parseTeamLink(`  ${CODE}\n`)).toBe(CODE);
    expect(parseTeamLink(`Mira: https://x.io/#k=${CODE}`)).toBe(CODE);
  });

  it("devuelve null si no hay código válido", () => {
    expect(parseTeamLink("")).toBeNull();
    expect(parseTeamLink("https://francisco-zafra.github.io/SNPTeamBuilder/")).toBeNull();
    expect(parseTeamLink("hola")).toBeNull();
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
  const at = (hash) => ({ hash, pathname: "/SNPTeamBuilder/", search: "" });

  it("guarda el código del enlace, lo quita de la URL y marca la entrada", () => {
    const data = memory();
    const history = { replaceState: vi.fn() };
    expect(resolveTeamCode(at(`#k=${CODE}`), history)).toEqual({ code: CODE, joined: true });
    expect(JSON.parse(data.get("snp:v1:team-code"))).toBe(CODE);
    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/SNPTeamBuilder/");
  });

  it("abrir otra vez el mismo enlace no cuenta como entrada nueva", () => {
    memory().set("snp:v1:team-code", JSON.stringify(CODE));
    expect(resolveTeamCode(at(`#k=${CODE}`), { replaceState: vi.fn() })).toEqual({ code: CODE, joined: false });
  });

  it("sin enlace usa el código guardado", () => {
    memory().set("snp:v1:team-code", JSON.stringify(CODE));
    expect(resolveTeamCode(at(""), { replaceState: vi.fn() })).toEqual({ code: CODE, joined: false });
  });

  it("sin enlace ni código guardado: modo local", () => {
    memory();
    expect(resolveTeamCode(at(""), { replaceState: vi.fn() })).toEqual({ code: null, joined: false });
  });
});

describe("inviteLink", () => {
  it("construye el enlace para compartir", () => {
    expect(inviteLink(CODE, { origin: "https://francisco-zafra.github.io", pathname: "/SNPTeamBuilder/" })).toBe(
      `https://francisco-zafra.github.io/SNPTeamBuilder/#k=${CODE}`
    );
  });
});
