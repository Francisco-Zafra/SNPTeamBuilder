import { beforeEach, describe, expect, it } from "vitest";
import { createEmptyLineup } from "../domain/lineupReducer.js";
import { createLocalStore } from "./localStore.js";

let data;
beforeEach(() => {
  data = new Map();
  globalThis.localStorage = {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
});

const latest = (store) => {
  let state;
  store.subscribe((s) => (state = s))();
  return state;
};

describe("createLocalStore", () => {
  it("migra la alineación única de la versión anterior", () => {
    const legacy = createEmptyLineup().map((p) => (p.id === "pair-1" ? { ...p, reves: "a" } : p));
    data.set("snp:v1:lineup", JSON.stringify(legacy));

    const state = latest(createLocalStore());
    expect(state.lineups).toHaveLength(1);
    expect(state.lineups[0].name).toBe("Alineación");
    expect(state.lineups[0].pairs).toEqual(legacy);
    expect(JSON.parse(data.get("snp:v1:lineups"))).toHaveLength(1);
  });

  it("crea, duplica, renombra y borra alineaciones", async () => {
    const store = createLocalStore();
    const a = await store.createLineup({ name: "Jornada 3" });
    await store.applyAction(a, { type: "PLACE", playerId: "p1", pairId: "pair-1", slot: "reves" });
    const b = await store.createLineup({ name: "Jornada 4", fromId: a });
    await store.updateLineupMeta(b, { name: "Jornada 4 · vs X" });

    let state = latest(store);
    const byId = Object.fromEntries(state.lineups.map((l) => [l.id, l]));
    expect(byId[b].name).toBe("Jornada 4 · vs X");
    expect(byId[b].pairs[0].reves).toBe("p1");

    await store.deleteLineup(a);
    state = latest(store);
    expect(state.lineups.map((l) => l.id)).toContain(b);
    expect(state.lineups.map((l) => l.id)).not.toContain(a);
  });

  it("aplica acciones limpiando jugadores que ya no están", async () => {
    const store = createLocalStore();
    const id = await store.createLineup();
    await store.applyAction(id, { type: "PLACE", playerId: "gone", pairId: "pair-1", slot: "reves" });
    await store.applyAction(id, { type: "PLACE", playerId: "p1", pairId: "pair-2", slot: "reves" }, { validIds: ["p1"] });
    const lineup = latest(store).lineups.find((l) => l.id === id);
    expect(lineup.pairs[0].reves).toBeNull();
    expect(lineup.pairs[1].reves).toBe("p1");
  });

  it("en el primer uso crea una alineación vacía; si se borran todas, no la recrea", async () => {
    const store = createLocalStore();
    const [first] = latest(store).lineups;
    expect(first.name).toBe("Alineación");
    await store.deleteLineup(first.id);
    expect(latest(createLocalStore()).lineups).toEqual([]);
  });

  it("guarda las posiciones preferentes", async () => {
    const store = createLocalStore();
    await store.setSide("p1", "REVES");
    expect(latest(store).sides).toEqual({ p1: "REVES" });
    expect(latest(createLocalStore()).sides).toEqual({ p1: "REVES" });
  });

  it("falla al editar una alineación inexistente", async () => {
    await expect(createLocalStore().applyAction("nope", { type: "CLEAR" })).rejects.toMatchObject({ code: "not-found" });
  });
});
