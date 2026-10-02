// Comprueba contra la API real que la plantilla se descarga y normaliza bien.
// Útil al cambiar de temporada (`seasonId`) o si la app deja de cargar.
// Uso: npm run check:api
import { fetchTeamPlayers } from "../src/api/snpApi.js";
import { CONFIG } from "../src/config.js";
import { normalizeRoster } from "../src/domain/normalize.js";
import { sortByPoints } from "../src/domain/roster.js";
import { formatPoints } from "../src/utils/format.js";

try {
  const entities = await fetchTeamPlayers();
  const { teamName, players } = normalizeRoster(entities, CONFIG.teamId);

  console.log(`Equipo: ${teamName ?? "(sin nombre)"}`);
  console.log(`Jugadores: ${players.length}\n`);
  for (const p of sortByPoints(players)) {
    console.log(`${formatPoints(p.points).padStart(10)}  ${p.name}  (${p.id})`);
  }

  if (!players.length) {
    console.error("\nLa API no ha devuelto jugadores. Revisar teamId / seasonId / apiUrl.");
    process.exitCode = 1;
  }
} catch (error) {
  console.error("Error consultando SNP:", error);
  process.exitCode = 1;
}
