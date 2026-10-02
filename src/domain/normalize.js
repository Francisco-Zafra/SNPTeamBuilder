export const cleanSpaces = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

/** "MORENO LÓPEZ" -> "Moreno López". También capitaliza tras guion. */
export const toTitleCase = (value) =>
  value
    .toLocaleLowerCase("es-ES")
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase("es-ES"));

/**
 * Puntos del jugador: los de la primera entrada de `Ranking`.
 * Sin ranking (aún no ha jugado) o con un valor no numérico: 0.
 * Nunca usar `orden`, que es la posición en el ranking.
 */
export function getPlayerPoints(raw) {
  const first = Array.isArray(raw?.Ranking) ? raw.Ranking[0] : undefined;
  const points = Number(first?.puntos);
  return first?.puntos != null && Number.isFinite(points) ? points : 0;
}

export function normalizePlayer(raw) {
  const firstName = toTitleCase(cleanSpaces(raw.nombre));
  const lastName = toTitleCase(cleanSpaces(raw.apellidos));

  return {
    id: String(raw.id),
    name: `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    points: getPlayerPoints(raw),
  };
}

export function getTeamName(entities, teamId) {
  for (const raw of entities) {
    const link = raw?.EquipoJugador?.find((ej) => String(ej.idequipo) === String(teamId));
    const name = cleanSpaces(link?.Equipo?.nombre);
    if (name) return name;
  }
  return null;
}

/** Convierte la respuesta de SNP en `{ teamName, players }`. */
export function normalizeRoster(entities, teamId) {
  const seen = new Set();
  const players = [];

  for (const raw of entities) {
    if (raw?.id == null) continue;
    const player = normalizePlayer(raw);
    if (seen.has(player.id)) continue;
    seen.add(player.id);
    players.push(player);
  }

  return { teamName: getTeamName(entities, teamId), players };
}
