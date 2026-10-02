import { SLOT_ORDER, hasPositionMismatch } from "./sides.js";

export const indexPlayers = (players) => new Map(players.map((p) => [p.id, p]));

/**
 * Pistas tal como se muestran: ordenadas por puntos de pareja (norma SNP),
 * con las parejas vacías al final y desempate estable por posición interna.
 *
 * Cada pista: `{ court, pairId, points, reves, derecha }`, donde cada hueco es
 * `{ player, mismatch }` o `null`.
 */
export function getCourts(lineup, playersById) {
  const pairs = lineup.map((pair, index) => {
    const slots = {};
    let points = 0;
    let filled = 0;

    for (const slot of SLOT_ORDER) {
      const player = pair[slot] != null ? playersById.get(pair[slot]) : undefined;
      if (player) {
        slots[slot] = { player, mismatch: hasPositionMismatch(player, slot) };
        points += player.points;
        filled += 1;
      } else {
        slots[slot] = null;
      }
    }

    return { pairId: pair.id, points, filled, index, ...slots };
  });

  pairs.sort(
    (a, b) =>
      (a.filled === 0) - (b.filled === 0) || b.points - a.points || a.index - b.index
  );

  return pairs.map(({ filled, index, ...court }, i) => ({ court: i + 1, ...court }));
}

/** Total de puntos y jugadores colocados de una alineación (para la lista). */
export function getLineupStats(lineup, playersById) {
  const courts = getCourts(lineup, playersById);
  return { totalPoints: getTotalPoints(courts), count: countPlacedPlayers(courts) };
}

export const getTotalPoints = (courts) => courts.reduce((sum, c) => sum + c.points, 0);

export const countPlacedPlayers = (courts) =>
  courts.reduce(
    (count, c) => count + SLOT_ORDER.filter((slot) => c[slot] != null).length,
    0
  );

/** `Map<playerId, número de pista>` para marcar en la plantilla dónde juega cada uno. */
export function getPlayerCourtMap(courts) {
  const map = new Map();
  for (const c of courts) {
    for (const slot of SLOT_ORDER) {
      if (c[slot]) map.set(c[slot].player.id, c.court);
    }
  }
  return map;
}
