/** Longitud máxima de un alias ("Fran", "El Rubio"…). */
export const MAX_ALIAS_LENGTH = 24;

export const cleanAlias = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_ALIAS_LENGTH)
    .trim();

/** Valida el mapa `{ [playerId]: alias }` leído de localStorage o Firestore. */
export function restoreAliases(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const aliases = {};
  for (const [id, alias] of Object.entries(value)) {
    const clean = typeof alias === "string" ? cleanAlias(alias) : "";
    if (clean) aliases[id] = clean;
  }
  return aliases;
}

/** Nuevo mapa con el alias de `playerId` actualizado; vacío lo quita. */
export function setAlias(aliases, playerId, alias) {
  const next = { ...aliases };
  const clean = cleanAlias(alias);
  if (clean) next[playerId] = clean;
  else delete next[playerId];
  return next;
}
