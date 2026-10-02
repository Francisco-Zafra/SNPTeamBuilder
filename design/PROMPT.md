Necesito el diseño de una web app **mobile-first** para preparar la alineación de mi equipo de pádel en las Series Nacionales de Pádel (SNP). Te adjunto `players.json` con los datos reales del equipo. Úsalos tal cual en el diseño, sin datos de relleno.

## Para quién es y cuándo se usa

La usa el capitán (o un jugador) desde el **móvil**, normalmente en vertical y a veces en la propia pista. Su objetivo es montar en un par de minutos las 5 parejas del próximo partido y mandarlas al grupo de WhatsApp. Tiene que poder hacerse con una mano y leerse bien a pleno sol.

## Qué hace la app

1. Descarga automáticamente la plantilla del equipo: 17 jugadores, cada uno con sus puntos de ranking.
2. Cada jugador tiene una **posición preferente** editable: **Revés**, **Derecha**, **Ambos** o **Sin asignar**. Se guarda en el dispositivo.
3. La plantilla se muestra **agrupada por posición** (Revés, Derecha, Ambos, Sin asignar) y, dentro de cada grupo, ordenada por puntos de mayor a menor.
4. La **alineación** tiene 5 pistas. Cada pista es una pareja con dos huecos fijos: **Revés** y **Derecha**.
5. Cada pista muestra la suma de puntos de su pareja. Las pistas se **reordenan solas** de mayor a menor suma, porque lo exige la normativa SNP: la Pista 1 es siempre la pareja con más puntos. El número de pista no es fijo; se recalcula cada vez que cambia la alineación.
6. Se muestra el **total** de puntos de la alineación.
7. Un jugador solo puede estar en un hueco. Si colocas a alguien que ya está alineado, se mueve o se intercambia.
8. **Copiar alineación** genera texto para pegar en WhatsApp. En móvil puede haber también un botón **Compartir** nativo.
9. **Limpiar alineación** vacía las parejas, pero no toca las posiciones preferentes. Pide confirmación.

## Interacción (lo más importante del diseño)

- **El flujo principal en móvil es tocar:**
  1. Tocas un jugador, de la plantilla o de un hueco, y queda seleccionado y resaltado.
  2. Tocas un hueco y el jugador se coloca ahí.
  3. Tocar otra vez el jugador seleccionado, tocar fuera o pulsar Esc cancela la selección.
  4. Tocar un hueco ocupado sin nada seleccionado selecciona a ese jugador para moverlo.
- **Arrastrar** es un complemento: pulsación larga en móvil y arrastre normal en escritorio. Se puede arrastrar de la plantilla a un hueco, de hueco a hueco, o de un hueco a la plantilla para quitarlo.
- **Quitar** a un jugador de un hueco tiene que ser fácil y visible.
- Si colocas a un jugador en una posición distinta de su preferente (un "Revés" en Derecha), aparece un **aviso discreto** que no bloquea. Los jugadores "Ambos" y "Sin asignar" nunca generan aviso.
- Al reordenarse las pistas hay una **animación rápida** de recolocación (~150–200 ms). Con `prefers-reduced-motion` no hay animación.

El mayor reto es que en un móvil la plantilla y la alineación no caben a la vez. Propón cómo conviven: pestañas, una hoja inferior que se despliega al seleccionar un jugador, secciones apiladas… Lo que funcione mejor para el flujo de "tocar jugador → tocar hueco". Si ves varias opciones buenas, enséñame dos y explica cuál recomiendas.

## Información que debe verse

- **Cabecera:** el nombre del equipo, `IMPACTO 360 MÁLAGA PADEL TEAM`.
- **Jugador en la plantilla:** nombre, puntos, posición preferente (editable de forma rápida) y si ya está alineado. Los alineados se atenúan o se marcan, y si se puede se indica en qué pista están, pero **nunca se ocultan**.
- **Pista:** número, jugador de revés, jugador de derecha y puntos de la pareja. Los huecos vacíos deben verse claramente como destinos.
- **Total** de la alineación y cuántos jugadores hay colocados (p. ej. 9/10).
- **Sin fotos de jugador.** Si hace falta un elemento visual por jugador, usa iniciales o nada.

## Estados que hay que diseñar

1. **Cargando** la plantilla ("Cargando jugadores...").
2. **Error sin datos:** "No se ha podido cargar la plantilla." con botón Reintentar.
3. **Datos guardados:** la API ha fallado y se muestra la última plantilla descargada, con un aviso no bloqueante del tipo "Datos guardados del 02/10 11:58 · Reintentar".
4. **Alineación vacía**, el primer uso.
5. **Alineación a medias**: el ejemplo del JSON tiene 9 jugadores, con un hueco vacío y un aviso de posición.
6. **Alineación completa** de 10 jugadores.
7. **Jugador seleccionado**, mientras eliges hueco.
8. **Arrastrando.**
9. **Confirmación** de "Limpiar alineación".
10. Aviso breve de **"Alineación copiada"**.

## Casos límite a tener en cuenta (están en los datos)

- **Nombre más largo:** "Daniel Eliot Lolani García Fernandez". Tiene que caber en un hueco de pista a 360 px de ancho; decide si se trunca, se parte en dos líneas o se abrevia.
- **Puntos de 0 a 78.500 con hasta 2 decimales**, en formato español: `78.500`, `75.468,75`. Una pareja ronda los 154.000 y el total los 600.000.
- **Un jugador con 0 puntos** (aún no ha jugado), que debe mostrarse como `0 pts`.
- **Dos jugadores empatados** a 3.125.

## Restricciones

- **Mobile-first:** ancho base de 360 px, en vertical y sin scroll horizontal. Para escritorio basta con proponer cómo se adapta, por ejemplo con plantilla a la izquierda y alineación a la derecha.
- Zonas táctiles de **44×44 px como mínimo**.
- Buen contraste, legible al sol. Incluye **modo claro y oscuro**.
- Toda la interfaz en **español**.
- Sin logos ni marca oficial de la SNP; la app tiene identidad propia.
- Se implementará en **React + Vite con CSS propio**, sin framework de UI. Define colores, tipografía, espaciados y radios como **tokens (variables CSS)**, para poder trasladarlos directamente.

## Qué espero recibir

- El diseño de la pantalla principal en móvil con los datos reales, y los estados de la lista anterior.
- La propuesta de cómo conviven plantilla y alineación en móvil, y su adaptación a escritorio.
- El control para cambiar la posición preferente de un jugador.
- Los tokens de diseño.

## Fuera de alcance (no diseñar)

Login, varios equipos, varias jornadas o alineaciones guardadas, rivales, estadísticas, alineación óptima automática, exportar a PDF o imagen y fotos de jugador.

## Texto que genera "Copiar alineación" (como referencia)

```text
IMPACTO 360 MÁLAGA PADEL TEAM — Alineación

Pista 1 · 153.968,75 pts
  R: David Gerardo Trujillo Vasquez (78.500)
  D: Francisco Zafra Del Moral (75.468,75)

Pista 2 · 138.258,93 pts
  R: Rafa Bonillo Saavedra (73.883,93)
  D: Mauro Stopiello (64.375)

...

Pista 5 · 49.166,67 pts
  R: Raul Garcia Raga (49.166,67)
  D: —

Total: 557.571,43 pts
```
