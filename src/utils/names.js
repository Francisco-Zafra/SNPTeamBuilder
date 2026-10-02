const firstWord = (s) => (s ?? "").split(" ")[0] ?? "";

// Si el jugador tiene alias, es lo único que se muestra en cualquier formato.

/** Para huecos y avisos: primer nombre + apellidos ("Daniel García Fernandez"). */
export function shortName(player) {
  if (player.alias) return player.alias;
  const first = firstWord(player.firstName);
  return [first, player.lastName].filter(Boolean).join(" ") || player.name;
}

/**
 * Nombres lo más cortos posible para un mismo grupo (el mensaje de WhatsApp):
 * el alias si lo tiene y, si no, el nombre de pila; si dos coinciden, se añade
 * la inicial del apellido ("Javier H." / "Javier R."). Devuelve `Map<id, nombre>`.
 */
export function uniqueShortNames(players) {
  const base = (p) => p.alias || firstWord(p.firstName) || p.name;
  const counts = new Map();
  for (const p of players) counts.set(base(p), (counts.get(base(p)) ?? 0) + 1);
  return new Map(
    players.map((p) => {
      const name = base(p);
      const initial = (p.lastName ?? "").charAt(0);
      return [p.id, counts.get(name) > 1 && !p.alias && initial ? `${name} ${initial}.` : name];
    })
  );
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
