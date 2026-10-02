Seguimos con **"Alineación SNP · Impacto 360"**. Trabaja **en el mismo lienzo**, con los tokens y componentes que ya existen (propuesta A y serie C).

## Qué hay que diseñar

Una **pantalla para comparar varias alineaciones, maximo 5**.

**El caso real:** antes de cada jornada, varias personas del equipo montan su propuesta duplicando una alineación. Por ejemplo, "Jornada 4 · Paco", "Jornada 4 · Rafa" y "Jornada 4 · Fran". Después quieren verlas juntas para ver en qué se diferencian y quedarse con una. La discusión de verdad está en **qué parejas juegan en cada pista** y en **quién entra y quién sale**, no en el total de puntos.

## Cómo se llega

- En la hoja **Alineaciones**, un botón **Comparar** activa un modo de selección con casillas en cada fila.
- Se pueden marcar **2 o 3**. Con menos de 2 el botón de comparar está desactivado; a partir de 3, el resto de casillas se desactiva.
- Al confirmar se abre la comparación a pantalla completa, con botón para volver.

## Qué muestra la comparación

1. **Una cabecera por propuesta (columna):** nombre (truncado si no cabe), total de puntos y jugadores x/10.
2. **Una fila por pista, de la 1 a la 5.** Cada celda lleva la pareja de esa pista en esa propuesta, con nombres compactos en dos líneas ("D. Trujillo" / "F. Zafra") y los puntos de la pareja.
3. **La primera columna es la referencia.** Las celdas que no coinciden con ella se resaltan. Tocar la cabecera de otra columna la convierte en referencia.
4. **Si las tres coinciden en una pista,** la fila se atenúa o se compacta ("Igual en las 3"), para que se vea enseguida dónde está la diferencia.
5. **Ojo con el orden automático.** Las pistas se ordenan solas por puntos (norma SNP), así que la **misma pareja puede estar en pistas distintas** según la propuesta. Hay que distinguir dos casos:
   - **Pareja distinta:** cambian los jugadores. Es el resalte fuerte.
   - **Misma pareja, otra pista:** solo cambia la posición. Es una marca suave, por ejemplo "P2 → P1".
6. **Resumen de cambios** respecto a la referencia, por propuesta. Por ejemplo, "Rafa: entra Ezequiel Campins, sale Pep Garau", o "Fran: falta 1 jugador (9/10)".
7. **Avisos de posición:** si un jugador está fuera de su posición preferente, se mantiene el mismo icono de aviso que en la alineación, en pequeño.
8. **Usar esta.** Elegir una propuesta como la definitiva: pasa a ser la alineación activa y se vuelve a la pestaña Alineación. Propón también cómo ofrecer, de forma opcional y con confirmación, **borrar las otras propuestas comparadas** para no acumular.

## Restricciones

- **Mobile-first a 360 px.** Con 3 columnas quedan unos 100 px por celda más una columna estrecha de número de pista. Decide cómo se ven los nombres largos ("Daniel Eliot Lolani García Fernandez" → "D. García"). Con 2 columnas, aprovecha el espacio extra.
- **Sin scroll horizontal.** Si hace falta, prioriza la legibilidad de las celdas sobre mostrar los puntos de cada pareja.
- Zonas táctiles de 44 px como mínimo, modo claro y oscuro y todo en español.
- **Escritorio:** las 3 columnas con más aire, en el panel central o en un modal ancho.
- La comparación es **solo de lectura**: no se editan parejas desde aquí.

## Estados

1. Lista en **modo selección**: con 0, 1, 2 y 3 seleccionadas, incluido el límite.
2. **Comparación de 3** con diferencias. Usa los datos de abajo.
3. **Comparación de 2.**
4. **Todas iguales:** por ejemplo, alguien duplicó y no cambió nada.
5. **Una propuesta incompleta** (9/10).
6. **Cambio de referencia** al tocar otra cabecera.
7. **Usar esta**, con la confirmación de borrar las demás.
8. **Sin conexión**, que es solo lectura: se puede comparar, pero no "Usar esta" si eso borra.
9. Modo oscuro y escritorio.

## Datos de ejemplo (jugadores reales; las pistas ya están ordenadas por puntos)

**Jornada 4 · Paco**: 603.977,68 pts · 10/10

- P1 David Trujillo + Francisco Zafra · 153.968,75
- P2 Rafa Bonillo + Mauro Stopiello · 138.258,93
- P3 Luis Rodriguez + Rodrigo Curci · 109.250
- P4 Pep Garau + Alexis Moreno · 106.927,08
- P5 Raul Garcia + Javier Hurtado · 95.572,92

**Jornada 4 · Rafa**: 593.769,35 pts · 10/10. Igual que Paco salvo la P4.

- P1–P3 y P5 iguales que Paco
- P4 Ezequiel Campins + Alexis Moreno · 96.718,75 (entra Ezequiel, sale Pep)

**Jornada 4 · Fran**: 557.571,43 pts · 9/10

- P1 Rafa Bonillo + Francisco Zafra · 149.352,68 (pareja distinta)
- P2 David Trujillo + Mauro Stopiello · 142.875 (pareja distinta)
- P3 Luis Rodriguez + Rodrigo Curci · 109.250 (igual)
- P4 Pep Garau + Alexis Moreno · 106.927,08 (igual que Paco)
- P5 Raul Garcia + — · 49.166,67 (falta Javier Hurtado)

## Qué espero recibir

Los artboards de los estados de arriba en el mismo lienzo, la propuesta de cómo se ven las celdas y las diferencias a 360 px, y los tokens nuevos si hacen falta (por ejemplo, para "pareja distinta" y "otra pista").
