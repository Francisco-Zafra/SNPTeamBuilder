import { SIDES, SIDE_ORDER } from "./sides.js";

/** Combina la plantilla normalizada con las posiciones guardadas. */
export const withPreferredSides = (players, sides) =>
  players.map((player) => ({
    ...player,
    preferredSide: sides[player.id] ?? SIDES.SIN_ASIGNAR,
  }));

/** Puntos de mayor a menor; a igualdad, por nombre para que el orden sea estable. */
export const compareByPoints = (a, b) =>
  b.points - a.points || a.name.localeCompare(b.name, "es-ES");

export const sortByPoints = (players) => [...players].sort(compareByPoints);

/** Grupos de la plantilla en orden fijo, cada uno ordenado por puntos. */
export function groupPlayersBySide(players) {
  return SIDE_ORDER.map((side) => ({
    side,
    players: sortByPoints(
      players.filter((p) => (p.preferredSide ?? SIDES.SIN_ASIGNAR) === side)
    ),
  }));
}

const isValidCachedPlayer = (p) =>
  p &&
  typeof p.id === "string" &&
  typeof p.name === "string" &&
  typeof p.points === "number" &&
  Number.isFinite(p.points);

/** Valida la caché de plantilla leída de localStorage; `null` si no sirve. */
export function restoreRosterCache(value) {
  if (!value || typeof value !== "object") return null;
  if (typeof value.fetchedAt !== "number" || !Array.isArray(value.players)) return null;

  const players = value.players.filter(isValidCachedPlayer);
  if (!players.length) return null;

  return {
    fetchedAt: value.fetchedAt,
    teamName: typeof value.teamName === "string" ? value.teamName : null,
    players,
  };
}
