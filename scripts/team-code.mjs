// Genera el código secreto del espacio compartido y las reglas de Firestore.
//
//   npm run team-code            crea el código (si no existe ya) y escribe firestore.rules
//   npm run team-code -- --new   genera un código nuevo (invalida el enlace anterior)
//
// `firestore.rules` y `.team-code` están en .gitignore: el repo es público.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const APP_URL = "https://francisco-zafra.github.io/SNPTeamBuilder/";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const LENGTH = 20; // ≈119 bits

function generate() {
  // Rechazo de bytes >= 248 para no sesgar hacia los primeros caracteres.
  let code = "";
  while (code.length < LENGTH) {
    for (const byte of randomBytes(LENGTH * 2)) {
      if (byte < 248 && code.length < LENGTH) code += ALPHABET[byte % ALPHABET.length];
    }
  }
  return code;
}

const root = new URL("../", import.meta.url);
const codeFile = new URL(".team-code", root);
const rulesFile = new URL("firestore.rules", root);
const template = readFileSync(new URL("firestore.rules.template", root), "utf8");

const rotate = process.argv.includes("--new");
let code = !rotate && existsSync(codeFile) ? readFileSync(codeFile, "utf8").trim() : null;
const created = !code;
if (!code) code = generate();

writeFileSync(codeFile, code + "\n");
writeFileSync(rulesFile, template.replace(/__TEAM_CODE__/g, code));

console.log(created ? "Código nuevo generado." : "Usando el código existente (.team-code).");
console.log(`\nEnlace para el equipo:\n  ${APP_URL}#k=${code}\n`);
console.log("Reglas listas en firestore.rules: pégalas en Firebase → Firestore → Reglas → Publicar.");
if (created && rotate) console.log("Ojo: el enlace anterior deja de funcionar al publicar las reglas nuevas.");
