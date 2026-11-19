# Ronald Palomino · Tres opciones · UI de firma

Descomprime **todo** el ZIP y abre `index.html`. Conserva la portada y el selector originales de Gallinas y Valientes, con la bienvenida GTL AI. Las opciones están en `01/index.html`, `02/index.html` y `03/index.html` y también se pueden abrir directamente.

Si el navegador restringe iframes desde archivos locales, sirve esta carpeta:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

En Windows: `py -m http.server 8765 --bind 127.0.0.1`. Abre `http://127.0.0.1:8765/`. Fotos, CSS, JS, video y póster son locales. No hay dependencias ni compilación.

| Opción | Entrada | Inmediatamente debajo de la foto |
| --- | --- | --- |
| 01 · La dupla que vuelve | Ventanas fotográficas y geometrías entrelazadas | Dos medallones se separan y revelan Santiago 2023 / Río 2025 |
| 02 · Dos títulos, dos fichas | Placas con profundidad se registran detrás de la foto | Un archivo apilado se abre en dos fichas de campeón |
| 03 · Después de la segunda ronda | Bandas diagonales encajan en un encuadre de circuito | Tira de archivo revela Rosario / Santa Ana / próxima participación pendiente |

La primera apertura espera a que termine la transición de GTL AI. Cada vez que eliges una pestaña distinta, la opción vuelve al hero y repite su apertura sin recargar el documento. La pieza post-hero se rearma y vuelve a animarse cuando llegas a ella con el scroll. Con `prefers-reduced-motion: reduce` se muestra la composición final sin animación.

El código nuevo está en `assets/firma.css` y `assets/firma.js`. Los antiguos `01/02/03/assets/motion.js` se conservan como archivo original, pero ya no se cargan. Las agendas, sus JSON y herramientas de regeneración se mantienen intactas.

Consulta **REFERENCIAS_Y_QA.md**: nueve portafolios inspeccionados, selección previa, fotografías, seis secuencias de fotogramas, pruebas y pendientes expresos. `evidencia/qa/visor.html` es un visor de QA separado del producto; sus controles no aparecen en las opciones. `evidencia/qa/selector.html` permite revisar la coordinación del selector original.

Prueba de regresión de la repetición de efectos: `node evidencia/qa/probar_lifecycle.cjs`. Ejecuta el JavaScript real del selector y las opciones con DOM y mensajes de iframe simulados.

Se mantienen las condiciones de uso interno y los créditos del ZIP recibido; véase `CREDITOS_FOTOGRAFICOS.md`.
