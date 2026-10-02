import { getCourts } from "./lineupSelectors.js";
import { SLOT_ORDER } from "./sides.js";

/** Máximo de alineaciones que se comparan a la vez (diseño a 360 px). */
export const MAX_COMPARE = 3;

const playerIds = (court) => SLOT_ORDER.map((slot) => court[slot]?.player.id).filter(Boolean);

/** Clave de pareja independiente del lado: "a+b" ordenado; "" si la pista está vacía. */
const pairKey = (court) => playerIds(court).sort().join("+");

const lineupPlayerIds = (courts) => courts.flatMap(playerIds);

/**
 * Prefijo común "Jornada 4" cuando todos los nombres son "Jornada 4 · X":
 * las cabeceras muestran solo "X".
 */
export function commonPrefix(names) {
  if (names.length < 2) return "";
  const parts = names.map((n) => n.split(" · "));
  const first = parts[0][0];
  return parts.every((p) => p.length > 1 && p[0] === first) ? first : "";
}

export const shortLabel = (name, prefix) => (prefix ? name.slice(prefix.length + 3) : name);

/**
 * Compara alineaciones pista a pista contra la de referencia.
 *
 * Cada celda tiene `status`:
 * - "ref":   la columna de referencia;
 * - "same":  la misma pareja en la misma pista;
 * - "moved": la misma pareja, pero en otra pista de la referencia (`fromCourt`);
 * - "diff":  pareja distinta. Sus jugadores que no estaban en esa pista de la
 *            referencia llevan `isNew`.
 *
 * `summaries` (una por alineación que no es la referencia): quién entra y sale,
 * jugadores que faltan, pistas con pareja distinta o movida y diferencia de puntos.
 */
export function compareLineups(lineups, refId, playersById) {
  const columns = lineups.map((lineup) => {
    const courts = getCourts(lineup.pairs, playersById);
    const total = courts.reduce((sum, c) => sum + c.points, 0);
    const count = lineupPlayerIds(courts).length;
    return { lineup, courts, total, count };
  });

  const ref = columns.find((c) => c.lineup.id === refId) ?? columns[0];
  const refKeys = ref.courts.map(pairKey);

  const statuses = new Map(columns.map((c) => [c.lineup.id, []]));

  const rows = ref.courts.map((refCourt, i) => {
    const keys = columns.map((c) => pairKey(c.courts[i]));
    const refIds = new Set(playerIds(refCourt));

    const cells = columns.map((col, c) => {
      const court = col.courts[i];
      let status = "same";
      let fromCourt = null;
      if (col === ref) status = "ref";
      else if (keys[c] !== refKeys[i]) {
        const j = keys[c] ? refKeys.indexOf(keys[c]) : -1;
        if (j >= 0) {
          status = "moved";
          fromCourt = j + 1;
        } else status = "diff";
      }
      statuses.get(col.lineup.id).push({ court: i + 1, status, fromCourt });

      const slots = SLOT_ORDER.map((slot) => {
        const entry = court[slot];
        if (!entry) return { slot, player: null, mismatch: false, isNew: false };
        return {
          slot,
          player: entry.player,
          mismatch: entry.mismatch,
          isNew: status === "diff" && !refIds.has(entry.player.id),
        };
      });

      return { lineupId: col.lineup.id, status, fromCourt, points: court.points, slots };
    });

    return { court: i + 1, allSame: keys.every((k) => k === keys[0]), refCourt, cells };
  });

  const refPlayers = lineupPlayerIds(ref.courts);
  const summaries = columns
    .filter((col) => col !== ref)
    .map((col) => {
      const mine = lineupPlayerIds(col.courts);
      const own = statuses.get(col.lineup.id);
      return {
        lineupId: col.lineup.id,
        entering: mine.filter((id) => !refPlayers.includes(id)).map((id) => playersById.get(id)),
        leaving: refPlayers.filter((id) => !mine.includes(id)).map((id) => playersById.get(id)),
        missing: 10 - col.count,
        diffCourts: own.filter((s) => s.status === "diff").map((s) => s.court),
        movedCourts: own.filter((s) => s.status === "moved").map((s) => ({ from: s.fromCourt, to: s.court })),
        delta: Math.round((col.total - ref.total) * 100) / 100,
      };
    });

  return {
    refId: ref.lineup.id,
    heads: columns.map((c) => ({ lineup: c.lineup, total: c.total, count: c.count, isRef: c === ref })),
    rows,
    summaries,
    allSame: rows.every((r) => r.allSame),
  };
}
