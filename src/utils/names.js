const firstWord = (s) => (s ?? "").split(" ")[0] ?? "";

// Si el jugador tiene alias, es lo único que se muestra en cualquier formato.

/** Para huecos y avisos: primer nombre + apellidos ("Daniel García Fernandez"). */
export function shortName(player) {
  if (player.alias) return player.alias;
  const first = firstWord(player.firstName);
  return [first, player.lastName].filter(Boolean).join(" ") || player.name;
}

/** Para comparar a dos columnas: primer nombre + primer apellido ("Daniel García"). */
export function mediumName(player) {
  if (player.alias) return player.alias;
  const first = firstWord(player.firstName);
  const last = firstWord(player.lastName);
  return [first, last].filter(Boolean).join(" ") || player.name;
}

/**
 * Para la hoja de huecos y la comparación de 3: primer nombre + inicial del
 * apellido ("David T."). La inicial distingue a los que se llaman igual.
 */
export function compactName(player) {
  if (player.alias) return player.alias;
  const first = firstWord(player.firstName);
  const initial = (player.lastName ?? "").charAt(0);
  if (!first) return firstWord(player.lastName) || player.name;
  return initial ? `${first} ${initial}.` : first;
}
