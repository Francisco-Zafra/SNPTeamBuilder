# PLAN.md — Gestor de alineaciones SNP Pádel

## 1. Objetivo

Crear una aplicación web estática para administrar la plantilla de un equipo de las Series Nacionales de Pádel y preparar alineaciones de 5 pistas.

La aplicación debe:

- Obtener automáticamente todos los jugadores del equipo desde el endpoint público usado por SNP Galaxy.
- Mostrar el nombre del equipo (obtenido de la propia API).
- Mostrar la plantilla agrupada por posición preferente.
- Permitir asignar a cada jugador una posición preferente:
  - `REVES`
  - `DERECHA`
  - `AMBOS`
  - `SIN_ASIGNAR`
- Ordenar los jugadores por puntos, de mayor a menor.
- Permitir construir una alineación de 5 parejas.
- Añadir jugadores a las parejas mediante drag & drop y también mediante toque/clic.
- Calcular automáticamente los puntos de cada pareja.
- Ordenar las 5 pistas por puntos de pareja, de mayor a menor (norma de la SNP).
- Mostrar el total de puntos de toda la alineación.
- Impedir que un mismo jugador aparezca dos veces en la misma alineación.
- Copiar la alineación como texto para compartirla (p. ej. por WhatsApp).
- Estar diseñada **primero para móvil** y pantallas pequeñas.
- Publicarse como aplicación estática en GitHub Pages.

---

## 2. Restricciones técnicas

### Hosting

La aplicación debe funcionar como sitio estático en GitHub Pages.

El MVP no tendrá backend propio. No introducir servidor Node, Express, PHP, Python ni base de datos.

### Stack

- React + Vite.
- `@dnd-kit/core` para drag & drop (soporta ratón, táctil y teclado; el D&D nativo de HTML5 funciona mal en móvil).
- `@fontsource/barlow-condensed` y `@fontsource/atkinson-hyperlegible`: fuentes del diseño empaquetadas en el build, sin depender de Google Fonts.
- La reordenación de pistas se anima con una transición CSS de `translateY` (las pistas tienen altura fija), sin librería.
- Vitest para tests de la lógica pura.
- `localStorage` para persistencia local (ver sección 13).

Evitar otras dependencias salvo necesidad clara.

### Importante sobre la API

La petición a SNP se realiza directamente desde el navegador.

- No enviar cookies, `PHPSESSID`, tokens ni credenciales. No usar `credentials: "include"`.
- No añadir cabeceras innecesarias como `X-Requested-With`, ya que pueden provocar un preflight CORS.
- La petición debe usar `application/x-www-form-urlencoded`.

**Verificado (2026-10-02):** el endpoint responde con `access-control-allow-origin: *` y no necesita sesión. La respuesta llega con `Content-Type: text/html`, pero el cuerpo es JSON: usar `response.json()` y **no** validar el content-type.

---

## 3. Endpoint de jugadores

### URL

```text
POST https://seriesnacionalesdepadel.snpgalaxy.com/jugador/ajaxGetAllJugadores/s_:YDVuE1b1JFrIZbvc23gmrQobobubiVTC7YwcTA==
```

### Body

```text
filtro=
num_pagina=1
limite_pagina=100
update=1
idequipo=8201
desde_clasificacion_final=0
idtemporadaG=3
```

### Implementación

```js
import { CONFIG } from "../config";

export async function fetchTeamPlayers({ signal } = {}) {
  const body = new URLSearchParams({
    filtro: "",
    num_pagina: "1",
    limite_pagina: "100",
    update: "1",
    idequipo: String(CONFIG.teamId),
    desde_clasificacion_final: "0",
    idtemporadaG: String(CONFIG.seasonId),
  });

  const response = await fetch(CONFIG.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body,
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  const entities = data.entities ?? [];

  if (Number(data.num_resultados) > entities.length) {
    console.warn(
      `SNP devolvió ${entities.length} de ${data.num_resultados} jugadores; revisar paginación.`
    );
  }

  return entities;
}
```

- Aplicar un timeout de `CONFIG.requestTimeoutMs` mediante `AbortController`.
- La respuesta incluye `num_resultados`. Si es mayor que el número de jugadores recibidos, avisar en consola (hoy son 17, con margen de sobra frente a `limite_pagina=100`).

### Fragilidad conocida

- `idtemporadaG` cambiará cada temporada.
- No se sabe si el token `s_:YDVu…` de la URL es fijo o rota.

Ambos valores viven solo en `CONFIG`. Si la API deja de responder, es lo primero que hay que revisar.

---

## 4. Ejemplo real de jugador recibido

```json
{
  "id": "316870",
  "nombre": "ALEXIS ",
  "apellidos": "MORENO LÓPEZ",
  "etiqueta_minima": "003",
  "imagen_jugador": "ca09b4ed82291c4da4ec1af7337818b2.jpg",
  "idusuario": "80430",
  "EquipoJugador": [
    {
      "idequipo": "8201",
      "idjugador": "316870",
      "capitan": "1",
      "Equipo": {
        "id": "8201",
        "nombre": "IMPACTO 360 MÁLAGA PADEL TEAM"
      }
    }
  ],
  "Ranking": [
    { "idzona": null,  "idcategoria": "20", "puntos": "57343.75", "orden": "1984", "num_part": "1" },
    { "idzona": "127", "idcategoria": "20", "puntos": "57343.75", "orden": "172",  "num_part": "1" },
    { "idzona": null,  "idcategoria": "19", "puntos": "0",        "orden": "14399","num_part": "0" },
    { "idzona": "127", "idcategoria": "19", "puntos": "0",        "orden": "1826", "num_part": "0" }
  ],
  "InscripcionJugador": [...]
}
```

Observaciones sobre los datos reales:

- Los nombres vienen con espacios sobrantes (al final y dobles) y con mayúsculas y minúsculas mezcladas.
- Los puntos son strings y pueden tener decimales (`"49583.33"`).
- `Ranking` puede estar vacío si el jugador aún no ha jugado ningún partido.
- `Ranking` puede incluir otras categorías además de la del equipo.

---

## 5. Normalización de jugadores

No trabajar directamente con la estructura original de la API. Transformar cada jugador a un modelo interno:

```ts
type Side = "REVES" | "DERECHA" | "AMBOS" | "SIN_ASIGNAR";

type Player = {
  id: string;
  name: string;      // nombre completo normalizado
  firstName: string;
  lastName: string;
  points: number;
  preferredSide: Side; // se combina desde localStorage, no viene de la API
};
```

No se usan imágenes de jugador.

### Nombres

```js
const cleanSpaces = (s) => (s ?? "").trim().replace(/\s+/g, " ");

const toTitleCase = (s) =>
  s
    .toLocaleLowerCase("es-ES")
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase("es-ES"));

const firstName = toTitleCase(cleanSpaces(raw.nombre));
const lastName = toTitleCase(cleanSpaces(raw.apellidos));
const name = `${firstName} ${lastName}`.trim();
```

Ejemplo: `"ALEXIS "` + `"MORENO LÓPEZ"` → `"Alexis Moreno López"`.

### Puntos

`Ranking` trae varias entradas (zonal y nacional, y a veces de otras categorías). **SNP las devuelve en orden aleatorio** (comprobado el 2026-10-02: Alexis alterna entre la categoría 20, con 57.343,75, y la 19, con 0). Por eso **no** se usa la primera entrada:

- se toma el máximo de las entradas de la **categoría del equipo** (`EquipoJugador → Equipo → FaseclubcatEquipo → Faseclubcat.idcategoria`, hoy la 20);
- si no hay entradas de esa categoría, o no se conoce, el máximo de todas;
- sin `Ranking` (aún no ha jugado), los puntos son `0` y se muestran como `0 pts`;
- no usar `orden` como puntos: `orden` es la posición en el ranking.

### Nombre del equipo

```js
function getTeamName(entities, teamId) {
  for (const raw of entities) {
    const link = raw.EquipoJugador?.find((ej) => String(ej.idequipo) === String(teamId));
    if (link?.Equipo?.nombre) return cleanSpaces(link.Equipo.nombre);
  }
  return null;
}
```

Si no se encuentra, la cabecera muestra solo el título de la app.

---

## 6. Diseño de la interfaz

**El diseño visual y la disposición concreta se definirán con el designer.** Esta sección fija solo los requisitos funcionales que el diseño debe cubrir.

Requisitos:

- **Mobile-first.** La pantalla principal de referencia es un teléfono en vertical. El escritorio es una adaptación.
- Cabecera con el nombre del equipo.
- Dos zonas: **Plantilla** y **Alineación**. En móvil pueden ser pestañas, un drawer, secciones apiladas, etc., según decida el diseño.
- Plantilla agrupada en: `REVÉS`, `DERECHA`, `AMBOS`, `SIN ASIGNAR`. Dentro de cada grupo, orden por puntos de mayor a menor.
- Cada jugador muestra nombre, puntos y su posición preferente, editable.
- Los jugadores ya alineados deben distinguirse visualmente (p. ej. atenuados, indicando su pista) sin ocultarse.
- El jugador seleccionado (flujo por toque) debe quedar claramente resaltado.
- Zonas táctiles de al menos 44×44 px.
- Respetar `prefers-reduced-motion`.

### Asignación de posición

Cada jugador puede marcarse como Revés, Derecha, Ambos o Sin asignar. El control concreto lo define el diseño.

La preferencia se persiste en `localStorage` por ID de jugador:

```json
{
  "398538": "REVES",
  "349876": "AMBOS"
}
```

Los jugadores sin entrada guardada son `SIN_ASIGNAR`.

---

## 7. Alineación

Cinco pistas. Cada pista tiene exactamente dos huecos: **Revés** y **Derecha**.

Cada pista muestra:

- número de pista (calculado por orden de puntos, ver sección 9);
- los dos jugadores (o el hueco vacío);
- los puntos de la pareja.

Se debe poder:

- colocar un jugador de la plantilla en un hueco;
- mover un jugador de una pista a otra;
- intercambiar jugadores;
- quitar un jugador de una pareja (botón en el hueco o arrastrándolo de vuelta a la plantilla).

---

## 8. Reglas de alineación

### Jugadores únicos

Un jugador no puede estar en dos huecos a la vez. Si se coloca un jugador que ya está alineado, se **mueve** al nuevo hueco.

### Semántica de colocar (`PLACE`)

Todas las operaciones de colocar, mover e intercambiar son una sola acción, `PLACE(playerId, pairId, slot)`, donde `slot` es `"reves"` o `"derecha"`:

| Origen del jugador | Hueco destino | Resultado |
|---|---|---|
| Plantilla (no alineado) | Vacío | Se coloca. |
| Plantilla (no alineado) | Ocupado por Q | Se coloca; Q vuelve a la plantilla. |
| Ya alineado en el hueco O | Vacío | Se mueve; O queda vacío. |
| Ya alineado en el hueco O | Ocupado por Q | Intercambio: Q pasa a O. |
| Ya alineado en el mismo hueco | — | No hace nada. |

Da igual si el jugador se arrastra desde la plantilla o desde otro hueco: lo que cuenta es si ya está alineado.

### Posición

La posición preferente es una preferencia, no un bloqueo. Un jugador `REVES` puede colocarse en `DERECHA`.

Si la posición no coincide, mostrar un aviso visual discreto, sin impedir la acción. Los jugadores `AMBOS` y `SIN_ASIGNAR` nunca generan aviso.

### Puntos de pareja

```js
pairPoints = (reves?.points ?? 0) + (derecha?.points ?? 0);
```

---

## 9. Orden automático de las pistas (norma SNP)

La normativa de la SNP exige que las pistas estén ordenadas por suma de puntos de la pareja, de mayor a menor:

```text
PISTA 1 = pareja con más puntos
...
PISTA 5 = pareja con menos puntos
```

- No asociar una pareja a un número de pista fijo. Internamente se guardan cinco parejas y, al representarlas, se ordenan por `pairPoints DESC`. Así la norma se cumple siempre.
- **Empates** (no se esperan): desempate estable por `pair.id`.
- Las parejas vacías quedan al final.
- Cuando el orden cambia, las pistas se recolocan con una **animación rápida** (180 ms, transición CSS de `translateY`; el DOM conserva el orden por pareja para que la transición funcione). Sin animación si `prefers-reduced-motion`.

---

## 10. Puntos totales

Mostrar:

```text
TOTAL ALINEACIÓN: 37.625 PUNTOS
```

```js
const totalPoints = pairs.reduce((sum, pair) => sum + pair.points, 0);
```

Como los puntos pueden tener decimales, redondear a 2 decimales **solo al mostrar** (ver sección 16).

---

## 11. Interacciones

### Drag & drop (`@dnd-kit/core`)

- Sensores: `MouseSensor` (se activa tras 6 px, así un clic sigue seleccionando) y `TouchSensor` con pulsación larga (200 ms, tolerancia 6 px) para no interferir con el scroll. Sin `KeyboardSensor`: Enter/Espacio iniciarían un arrastre en vez de seleccionar; con teclado se usa el flujo de toque.
- Origen arrastrable: tarjeta de jugador en la plantilla y jugador dentro de un hueco.
- Destino: cada hueco. En móvil, al arrastrar desde la plantilla aparece la hoja de huecos compacta como destino. En escritorio, soltar en la plantilla quita al jugador de la alineación.

### Toque / clic

1. Tocar un jugador (en la plantilla o en un hueco) lo selecciona y queda resaltado.
2. Tocar un hueco ejecuta `PLACE` con el jugador seleccionado y limpia la selección.
3. Tocar de nuevo el jugador seleccionado lo deselecciona.
4. `Esc` o tocar fuera también deseleccionan.
5. Tocar un hueco ocupado sin nada seleccionado selecciona a ese jugador para moverlo.
6. Tocar un hueco vacío sin nada seleccionado (móvil) abre la hoja **Elegir jugador**, con dos grupos: los que encajan en ese hueco y los que prefieren el contrario (saldrá aviso). En escritorio muestra «Primero toca un jugador».
7. Cada acción muestra un aviso breve (colocado, reordenado, intercambiado, vuelve a la plantilla, posición guardada…).

### Layout (propuesta A del diseño)

- **Móvil (< 1024 px):** pestañas **Alineación** / **Plantilla**. Con un jugador seleccionado en Plantilla aparece una hoja inferior con las 5 pistas compactas para colocarlo sin cambiar de pestaña. En Alineación, una barra inferior muestra el jugador seleccionado con «Quitar».
- **Escritorio (≥ 1024 px):** tres columnas: plantilla, alineación y vista previa del texto de WhatsApp.
- Diseño de referencia: [design/claude-design/](design/claude-design/).

---

## 12. Estado

```js
// Plantilla normalizada (sección 5) + preferencias aplicadas
players: Player[]

// Alineación: solo IDs, nunca objetos de jugador completos
lineup = [
  { id: "pair-1", reves: null, derecha: null },
  { id: "pair-2", reves: null, derecha: null },
  { id: "pair-3", reves: null, derecha: null },
  { id: "pair-4", reves: null, derecha: null },
  { id: "pair-5", reves: null, derecha: null },
];
```

La alineación se gestiona con un `useReducer` puro (testeable) con estas acciones:

- `PLACE { playerId, pairId, slot }`: semántica de la sección 8.
- `REMOVE { pairId, slot }`.
- `CLEAR`.
- `PRUNE { validIds }`: elimina IDs que ya no están en la plantilla.

La selección del flujo por toque es estado de UI aparte y no se persiste.

---

## 13. Persistencia local

Claves de `localStorage` (solo hay un equipo; se versionan por si cambia el formato):

```text
snp:v1:player-sides   → { [playerId]: Side }
snp:v1:lineup         → lineup (sección 12)
snp:v1:roster-cache   → { fetchedAt, teamName, players } (última plantilla descargada)
```

Todo acceso a `localStorage` va envuelto en `try/catch`. Si falla o los datos no son válidos, se usan los valores por defecto.

Al arrancar:

1. Cargar jugadores desde SNP.
2. Normalizarlos y guardar el resultado en `roster-cache`.
3. Aplicar las posiciones guardadas.
4. Recuperar la alineación guardada.
5. Ejecutar `PRUNE` con los IDs de la plantilla actual.

Botón **Limpiar alineación**: borra solo las parejas, no las posiciones guardadas. Pedir confirmación si hay jugadores alineados.

---

## 14. Estados de carga y errores

Mientras se consulta la API:

```text
Cargando jugadores...
```

Si falla (error HTTP, error en el JSON, timeout o red):

- **Con `roster-cache`:** usar la plantilla guardada y mostrar un aviso no bloqueante, `Datos guardados del 02/10 11:58 · [Reintentar]`.
- **Sin caché:**

  ```text
  No se ha podido cargar la plantilla.
  [Reintentar]
  ```

El detalle técnico va solo a consola.

Si la API deja de admitir CORS, la arquitectura tendrá que cambiar e introducir un proxy. No hacerlo preventivamente mientras la petición directa funcione.

---

## 15. Responsive

- **Mobile-first**: el diseño base es para teléfono en vertical (≥ 360 px de ancho). Lo concreta el designer (sección 6).
- En móvil, el flujo por toque es el principal y el drag & drop por pulsación larga, un complemento.
- En escritorio se puede usar un layout de dos columnas (plantilla a la izquierda, alineación a la derecha), con drag & drop como mecanismo principal.
- Sin scroll horizontal en ningún ancho.

---

## 16. Formato de números

Formato español, con un máximo de 2 decimales:

```js
const formatPoints = (n) =>
  n.toLocaleString("es-ES", { maximumFractionDigits: 2, useGrouping: "always" });
```

`useGrouping: "always"` es obligatorio: en `es-ES`, por defecto, los números de 4 cifras no se agrupan y `3125` saldría como `3125` en vez de `3.125`.

```text
3125      -> 3.125
57343.75  -> 57.343,75
49583.33  -> 49.583,33
```

El valor numérico interno no se modifica. El redondeo es solo de presentación, lo que también evita mostrar ruido de coma flotante en las sumas.

---

## 17. Copiar alineación

Botón **Copiar alineación** que genera texto listo para WhatsApp. El título es el nombre de la alineación, con negritas de WhatsApp (`*…*`) y **sin puntos**:

```text
*Jornada 4 · vs Pádel Indoor Sur*

*Pista 1*
R: David Gerardo Trujillo Vasquez
D: Francisco Zafra Del Moral

*Pista 2*
R: Raul Garcia Raga
D: —
…
```

- Pistas en el mismo orden que en pantalla. Los huecos vacíos se muestran como `—`.
- Usar `navigator.clipboard.writeText` (GitHub Pages sirve por HTTPS). Confirmar con un aviso breve, «Alineación copiada».
- Si el portapapeles falla, mostrar el texto en un cuadro seleccionable para copiarlo a mano.
- Opcional: si `navigator.share` está disponible (móvil), ofrecer también **Compartir**, que abre la hoja nativa.
- La generación del texto es una función pura (`utils/share.js`) con test.

---

## 18. Configuración

```js
export const CONFIG = {
  teamId: 8201,
  seasonId: 3,
  apiUrl:
    "https://seriesnacionalesdepadel.snpgalaxy.com/jugador/ajaxGetAllJugadores/s_:YDVuE1b1JFrIZbvc23gmrQobobubiVTC7YwcTA==",
  requestTimeoutMs: 10000,
  courts: 5,
};
```

Nada de IDs mágicos repartidos por los componentes.

---

## 19. GitHub Pages

- Inicializar el repositorio git (la carpeta aún no lo es) y crear el repo en GitHub.
- Vite con `base: "./"` (rutas relativas), así no depende del nombre del repositorio.
- Workflow de GitHub Actions: `npm ci` → `npm test` → `npm run build` → `actions/upload-pages-artifact` → `actions/deploy-pages`.
- En el repo: *Settings → Pages → Source: GitHub Actions*.
- El resultado es completamente estático. Sin secretos ni variables privadas: todo lo que llega al frontend es público.

---

## 20. Estructura

Estado actual.

```text
src/
├── api/
│   └── snpApi.js            # fetch + timeout
├── domain/
│   ├── sides.js             # posiciones, huecos, aviso de posición
│   ├── normalize.js         # nombres, puntos, nombre de equipo
│   ├── roster.js            # posiciones aplicadas, grupos, orden, caché
│   ├── lineupReducer.js     # PLACE / REMOVE / CLEAR / PRUNE + restaurar
│   └── lineupSelectors.js   # pistas ordenadas, total, pista de cada jugador
├── utils/
│   ├── format.js            # formatPoints, formatDateTime
│   ├── names.js             # nombre corto / compacto
│   ├── share.js             # texto de "Copiar alineación"
│   ├── clipboard.js         # copiar y compartir
│   └── storage.js           # localStorage seguro y versionado
├── ui/
│   ├── labels.js            # letras, textos y colores de posiciones y huecos
│   └── feedback.js          # textos de los avisos
├── hooks/
│   ├── useRoster.js         # carga + caché + reintento
│   ├── useLineupBuilder.js  # selección, hojas, arrastre y acciones de la pantalla
│   ├── usePersistentState.js
│   └── useMediaQuery.js
├── components/
│   ├── Header.jsx, States.jsx (carga, error, banner, aviso), Bars.jsx (barras, pestañas, vista previa)
│   ├── RosterPanel.jsx      # plantilla agrupada + selector de posición
│   ├── LineupPanel.jsx      # resumen, pistas y huecos
│   ├── PlaceSheet.jsx       # hoja de huecos compacta (móvil)
│   ├── Sheets.jsx           # elegir jugador, confirmar limpiar
│   └── Icon.jsx, SideBadge.jsx, slotState.js
├── styles/
│   ├── tokens.css           # tokens del diseño, claro/oscuro
│   └── app.css
├── config.js
├── App.jsx
└── main.jsx
```

La lógica de API y de dominio va separada de los componentes visuales. `api/`, `domain/`, `utils/` y `ui/` llevan tests con Vitest (`*.test.js` junto al archivo).

`npm run check:api` consulta la API real y lista la plantilla normalizada. Sirve para comprobar el cambio de temporada o diagnosticar si la app deja de cargar.

---

## 21. Fases de implementación

### Fase 0 — Diseño (en paralelo con las fases 1 y 2)

- Definir con el designer la interfaz mobile-first: plantilla, alineación, control de posición, flujo por toque y estados.

### Fase 1 — API y dominio

- Crear el proyecto (Vite + React + Vitest).
- Implementar la petición a SNP con timeout.
- Normalizar jugadores y obtener el nombre del equipo.
- Tests de normalización (nombres sucios, `Ranking` vacío, decimales).
- Verificar que aparecen los 17 jugadores del equipo 8201.

### Fase 2 — Lógica de alineación

- Reducer `PLACE` / `REMOVE` / `CLEAR` / `PRUNE` con tests de todos los casos de la tabla de la sección 8.
- Selectores: puntos de pareja, orden de pistas (con desempate y parejas vacías al final) y total.
- Generador de texto para copiar, con test.

### Fase 3 — Plantilla

- Lista agrupada (Revés / Derecha / Ambos / Sin asignar), ordenada por puntos.
- Editar la posición preferente y persistirla.

### Fase 4 — Alineación

- 5 pistas, huecos Revés/Derecha, puntos por pareja y total.
- Flujo por toque/clic.
- Drag & drop con dnd-kit.
- Animación de reordenación.
- Aviso de posición no coincidente.

### Fase 5 — UX y robustez

- Estados de carga y error, caché de plantilla y reintento.
- Limpiar alineación (con confirmación).
- Copiar / compartir alineación.
- Pruebas en un móvil real (iOS Safari y Android Chrome).

### Fase 6 — Deploy

- Repo git, workflow de GitHub Actions y GitHub Pages.
- Verificar que la API funciona desde el dominio `github.io`.

---

## 22. Criterios de aceptación del MVP

El MVP está terminado cuando:

1. Al abrir la web se descargan automáticamente los jugadores del equipo 8201 y se muestra el nombre del equipo.
2. No es necesario iniciar sesión en SNP.
3. Cada jugador muestra nombre (normalizado) y puntos; los jugadores sin partidos muestran 0.
4. Los jugadores aparecen agrupados por posición y ordenados por puntos.
5. Se puede asignar Revés, Derecha, Ambos o Sin asignar.
6. La preferencia se conserva al recargar.
7. Existen exactamente 5 parejas, con un máximo de 10 jugadores.
8. Ningún jugador puede estar repetido; colocar uno ya alineado lo mueve o lo intercambia según la sección 8.
9. Cada pareja muestra la suma de sus puntos.
10. Las pistas quedan siempre ordenadas de mayor a menor puntuación, con animación al reordenarse.
11. Se muestra el total de puntos de la alineación.
12. La alineación se conserva al recargar.
13. Existe un botón para limpiar la alineación sin perder las posiciones.
14. Se puede copiar la alineación como texto.
15. La alineación se puede montar cómodamente en un móvil, solo con toques.
16. Si la API falla, se usa la última plantilla guardada con un aviso, o se muestra un error con reintento.
17. Los tests de dominio pasan.
18. La aplicación funciona publicada en GitHub Pages.

---

## 23. Fuera de alcance inicialmente

No implementar todavía:

- login de usuarios;
- base de datos;
- edición de datos en SNP;
- múltiples equipos (no está previsto);
- rivales;
- estadísticas históricas;
- generación automática de la alineación óptima;
- exportación a PDF/imagen;
- imágenes de jugador;
- roles de administrador.

Diseñar el código de forma que estas funciones puedan añadirse más adelante sin rehacer el MVP.

---

## 24. Sincronización entre dispositivos (Firebase)

**Qué se comparte:** las posiciones preferentes y las alineaciones (solo parejas de IDs, nombre y fecha). Los datos de los jugadores **no** se guardan en Firebase: siguen llegando de la API de SNP.

**Acceso por enlace con código secreto**, sin login: `…/SNPTeamBuilder/#k=<código>`.
- Al abrir el enlace, el código se guarda en el dispositivo (`snp:v1:team-code`) y se quita de la barra de direcciones.
- Sin código (o si Firebase no está configurado) la app funciona en **modo local** como antes. La alineación única antigua se migra a la lista de alineaciones.
- Un código que no existe en las reglas devuelve `permission-denied`: aviso «Enlace no válido» y vuelta a modo local.

**Datos en Firestore:**

```text
teams/{código}                 { sides: { [playerId]: Side } }
teams/{código}/lineups/{id}    { name, date, pairs[5], createdAt, updatedAt }
```

**Edición:**
- Los cambios de alineación se aplican con `lineupReducer` dentro de `runTransaction`, de modo que dos personas editando a la vez no se pisan. Antes se limpian los IDs que ya no están en la plantilla.
- Mientras la transacción viaja se muestra el resultado previsto (optimista).
- Las posiciones se escriben campo a campo (`sides.<id>`).
- **Sin conexión, solo lectura:** se ve la última versión (caché persistente de Firestore), pero no se edita.
- Los cambios llegados de otro dispositivo muestran el aviso «Alineación actualizada».

**Seguridad (`firestore.rules.template`):**
- Solo se accede a `teams/{código}` si el código coincide con el de las reglas. No se pueden listar equipos.
- Se valida la forma de los documentos: campos permitidos, 5 parejas, nombre ≤ 80, timestamps del servidor.
- El repo es público, así que el código real **nunca** se commitea: `npm run team-code` genera `.team-code` y `firestore.rules` (ambos ignorados por git), y las reglas se pegan en la consola de Firebase.
- Rotar el código (`npm run team-code -- --new`) invalida los enlaces anteriores.

**Código:** `src/store/` contiene `localStore.js` y `firestoreStore.js` (misma interfaz), `lineupDocs.js`, `teamCode.js` y `firebase.js`. El SDK de Firebase se carga bajo demanda. El hook es `src/hooks/useTeamStore.js`.

**Desarrollo con emulador:** `npm run emulator` (requiere Java) y, en otra terminal, `npm run dev:emulator`.

**Interfaz (serie C del diseño, [design/claude-design/](design/claude-design/)):**
- **Cabecera de dos filas:** equipo + botón del espacio; selector de la alineación activa + indicador de sincronización (Sincronizado · Guardando… · Conectando… · Sin conexión · Local).
- **Hoja de alineaciones:** lista (más reciente primero, con fecha, total, x/10 y «Modificada hace…»), menú ⋯ (Renombrar, Duplicar, Borrar), «Nueva alineación» con «Empezar desde» (duplicar una existente o vacía). La alineación activa es por dispositivo (`snp:v1:active-lineup`).
- **Sin conexión:** franja «Sin conexión · solo lectura», huecos con candado y sin arrastre; al tocar sale un aviso. Copiar sigue funcionando.
- **Cambios de otro dispositivo:** las pistas cambiadas se resaltan («Actualizada», 2,4 s) y sale el aviso «Ha cambiado la Pista N».
- **Si otra persona borra la alineación activa:** aviso y paso a la siguiente.
- **Espacio:** en modo local, «Compartir» abre **Unirme** (pegar el enlace); en modo compartido abre **Invitar** (enlace con Compartir/Copiar) y **Salir del espacio** con confirmación. Al entrar con un enlace nuevo aparece la bienvenida; un código inválido muestra «Este enlace no funciona» (pegar otro o seguir en local).
- **No se implementa «Crear espacio» desde la app:** el espacio es único y se crea con `npm run team-code`.

---

## 25. Comparar alineaciones (serie K del diseño)

- En la hoja **Alineaciones**, **Comparar** activa un modo selección: de 2 a `MAX_COMPARE` (3) alineaciones.
- **Comparación:** una columna por propuesta y una fila por pista.
  - La primera columna es la **referencia**; tocar otra cabecera la cambia.
  - Cada celda puede ser **igual**, **pareja distinta** (resalte magenta, con los jugadores nuevos subrayados) o **misma pareja en otra pista** (borde discontinuo, «P5 → P4»).
  - Si todas coinciden en una pista, la fila se compacta («Igual en las N»).
- **Resumen por propuesta:** quién entra y quién sale, jugadores que faltan, pistas con pareja distinta o movida y diferencia de puntos.
- **Usar esta:** la convierte en la alineación activa y, opcionalmente, borra las otras comparadas. Sin conexión solo se puede usar, no borrar.
- **Lógica pura:** `src/domain/compare.js` (con tests); interfaz en `src/components/CompareUI.jsx`. En escritorio se muestra como modal ancho.
- El límite de 3 viene del diseño a 360 px. Subirlo es cambiar `MAX_COMPARE`, pero las celdas necesitarían otro diseño para seguir legibles.

---

## 26. Alias de jugadores

- **Dónde se edita:** en el panel que se abre al tocar la letra de posición de un jugador, campo **Alias** (opcional, máximo 24 caracteres). Se guarda al salir del campo o con Enter; «Quitar» lo borra.
- **Dónde se ve:** si un jugador tiene alias, se muestra **siempre** en su lugar: plantilla, huecos, hojas, comparación, avisos y mensaje de WhatsApp. En la plantilla, el nombre de SNP aparece debajo en pequeño.
- **Cómo funciona:** `withPreferredSides` pone el alias en `name` y guarda el original en `fullName`. Los formatos `shortName`, `mediumName` y `compactName` devuelven el alias tal cual.
- **Dónde se guarda:** como las posiciones. En modo local, `snp:v1:player-aliases`; en modo compartido, el campo `aliases` del documento `teams/{código}`. Las reglas admiten `sides` y `aliases`: tras añadir los alias hay que **volver a publicar `firestore.rules`**.
