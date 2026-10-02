const firstWord = (s) => (s ?? "").split(" ")[0] ?? "";

/** Para huecos y avisos: primer nombre + apellidos ("Daniel García Fernandez"). */
export function shortName(player) {
  const first = firstWord(player.firstName);
  return [first, player.lastName].filter(Boolean).join(" ") || player.name;
}

/** Para la hoja de huecos: inicial + primer apellido ("D. García"). */
export function compactName(player) {
  const initial = (player.firstName ?? "").charAt(0);
  const last = firstWord(player.lastName);
  if (!initial) return last || player.name;
  return last ? `${initial}. ${last}` : player.firstName;
}
