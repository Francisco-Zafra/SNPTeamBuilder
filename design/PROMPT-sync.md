Vamos a ampliar el diseño de **"Alineación SNP · Impacto 360"**, la propuesta A (pestañas + hoja de huecos). Trabaja **en el mismo lienzo**, añadiendo artboards nuevos y reutilizando los tokens, componentes y reglas que ya existen. No rediseñes lo que ya está; solo integra lo nuevo.

## Qué cambia

Hasta ahora la app guardaba todo en el propio móvil. Ahora pasa a ser **compartida en tiempo real** entre el capitán y los jugadores, y se pueden tener **varias alineaciones**.

1. **Espacio compartido del equipo, por enlace.** No hay login. El capitán comparte por WhatsApp un enlace con un código secreto (`…/SNPTeamBuilder/#k=x7Fq92Lm`). Quien lo abre entra en el espacio del equipo y ve y edita lo mismo que los demás, en tiempo real. El dispositivo recuerda el código, así que las siguientes veces se entra directamente.
   - **Sin código**, la app funciona como ahora: modo local, sin compartir, en este dispositivo.
   - Desde el modo local se puede **crear el espacio compartido**, que genera el código y el enlace, o **unirse** pegando un enlace.
   - Dentro del espacio: **invitar** (compartir o copiar el enlace) y **salir del espacio** en este dispositivo, que vuelve al modo local. Salir pide confirmación.
2. **Posiciones preferentes compartidas.** Revés, Derecha, Ambos y Sin asignar se comparten con todo el equipo. El texto actual, "Se guarda en este dispositivo", debe cambiar según el modo.
3. **Varias alineaciones.** Por ejemplo "Jornada 3 · vs Club X" o "Previa liga".
   - Ver la lista, ordenada por la última modificación.
   - Crear una nueva, vacía o **duplicando** otra. Duplicar es lo habitual: se parte de la de la semana anterior.
   - Renombrar. El nombre es obligatorio; la fecha es opcional.
   - Borrar, con confirmación.
   - Elegir cuál es la **activa**, que es la que se ve y se edita en la pestaña Alineación.
   - Cada fila muestra el nombre, la fecha si la hay, el total de puntos, cuántos jugadores tiene (x/10) y cuándo se cambió por última vez.
   - El nombre de la alineación activa tiene que verse siempre y servir para cambiar de alineación.
4. **Estado de sincronización.** Un indicador discreto y siempre visible, con estos estados:
   - **Sincronizado.**
   - **Guardando…**: unos instantes tras cada cambio.
   - **Sin conexión**: se puede **ver** la última versión, pero **no editar** hasta recuperar la conexión. Hay que diseñar cómo se ve una alineación bloqueada: los huecos, la plantilla, los botones y qué pasa si alguien toca.
   - **Modo local**: sin espacio compartido.
5. **Cambios de otros.** Si otra persona cambia la alineación que estoy viendo, los cambios llegan solos. Hace falta:
   - un aviso breve como "Alineación actualizada desde otro dispositivo";
   - un resalte momentáneo de las pistas que han cambiado.

   Si otra persona **borra** la alineación que estoy viendo, se me avisa y paso a otra.

## Interacción y ubicación

El reto es encajar la lista de alineaciones en la propuesta A sin empeorar el flujo principal, que es tocar un jugador y luego un hueco. Propón dónde vive: un selector en la cabecera, una hoja inferior, una tercera pestaña… Si ves dos opciones buenas, enséñalas y di cuál recomiendas. Haz lo mismo con el acceso a invitar, salir del espacio y el indicador de sincronización.

En escritorio (tres columnas) adapta lo mismo.

## Estados y pantallas a diseñar

1. **Modo local** con la invitación a crear o unirse a un espacio, sin agobiar.
2. **Crear espacio**: confirmación y pantalla de "comparte este enlace con el equipo", con Copiar y Compartir.
3. **Abrir un enlace con código por primera vez**: bienvenida al espacio del equipo.
4. **Enlace con un código que no existe** o no es válido.
5. **Lista de alineaciones**: con varias, con una sola y vacía (primer uso en un espacio).
6. **Crear o renombrar alineación**: nombre y fecha opcional, con "duplicar desde…".
7. **Confirmar borrar alineación.**
8. **Indicador de sincronización** en sus cuatro estados.
9. **Sin conexión**: alineación en solo lectura, y qué pasa al intentar editar.
10. **Cambio llegado de otro dispositivo**: aviso y resalte de pistas.
11. **La alineación activa ha sido borrada por otro.**
12. **Invitar / salir del espacio.**

## Datos para el diseño

Usa los mismos jugadores reales de `players.json`. Para la lista, inventa 3 o 4 alineaciones verosímiles, por ejemplo:

- "Jornada 4 · vs Pádel Indoor Sur": 10/10, 557.571 pts, modificada hace 5 min.
- "Jornada 3 · vs Club X": 10/10, 531.200 pts, hace 6 días.
- "Previa liga": 6/10, hace 3 semanas.

## Restricciones (las mismas de antes)

- Mobile-first a 360 px, zonas táctiles de 44 px como mínimo, contraste alto para leer al sol, modo claro y oscuro, todo en español.
- **Reutiliza los tokens existentes.** Si necesitas alguno nuevo, por ejemplo para el indicador de sincronización o el resalte de cambios, añádelo a la hoja de tokens con sus valores en claro y oscuro.
- Sin login ni fotos de jugador. Nada de mostrar quién ha hecho cada cambio.

## Qué espero recibir

Los artboards nuevos en el mismo lienzo, la recomendación de ubicación (lista de alineaciones, invitar o salir, indicador) con su alternativa si la hay, y los tokens nuevos si los hay.
