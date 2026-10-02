export const cleanSpaces = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

/** "MORENO LÓPEZ" -> "Moreno López". También capitaliza tras guion. */
export const toTitleCase = (value) =>
  value
    .toLocaleLowerCase("es-ES")
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase("es-ES"));

/**
 * Puntos del jugador en la categoría del equipo.
 *
 * `Ranking` trae varias entradas (zonal/nacional y, a veces, otras categorías) y
 * SNP las devuelve **en orden aleatorio**: no se puede usar la primera. Se toma el
 * máximo de las entradas de `categoryId`; si no hay ninguna (o no se conoce la
 * categoría), el máximo de todas. Sin ranking (aún no ha jugado): 0.
 * Nunca usar `orden`, que es la posición en el ranking.
 */
export function getPlayerPoints(raw, categoryId = null) {
  const entries = (Array.isArray(raw?.Ranking) ? raw.Ranking : [])
    .map((r) => ({ category: String(r?.idcategoria ?? ""), points: r?.puntos == null ? NaN : Number(r.puntos) }))
    .filter((r) => Number.isFinite(r.points));
  if (!entries.length) return 0;
  const own = categoryId != null ? entries.filter((r) => r.category === String(categoryId)) : [];
  return Math.max(...(own.length ? own : entries).map((r) => r.points));
}

/** Categoría en la que compite el equipo (la más frecuente entre sus jugadores). */
export function getTeamCategory(entities, teamId) {
  const counts = new Map();
  for (const raw of entities) {
    const link = raw?.EquipoJugador?.find((ej) => String(ej.idequipo) === String(teamId));
    for (const fce of link?.Equipo?.FaseclubcatEquipo ?? []) {
      const category = fce?.Faseclubcat?.idcategoria ?? fce?.Faseclubcat?.Categoria?.id;
      if (category != null) counts.set(String(category), (counts.get(String(category)) ?? 0) + 1);
    }
  }
  let best = null;
  for (const [category, count] of counts) if (!best || count > best[1]) best = [category, count];
  return best?.[0] ?? null;
}

export function normalizePlayer(raw, categoryId = null) {
  const firstName = toTitleCase(cleanSpaces(raw.nombre));
  const lastName = toTitleCase(cleanSpaces(raw.apellidos));

  return {
    id: String(raw.id),
    name: `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    points: getPlayerPoints(raw, categoryId),
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
  const categoryId = getTeamCategory(entities, teamId);

  for (const raw of entities) {
    if (raw?.id == null) continue;
    const player = normalizePlayer(raw, categoryId);
    if (seen.has(player.id)) continue;
    seen.add(player.id);
    players.push(player);
  }

  return { teamName: getTeamName(entities, teamId), players };
}
