# Ronald Palomino · Opción 01 · La dupla que vuelve

Versión incluida en el comparador interno revisado. Abre esta página directamente o desde la portada. Las fotos son referencias internas, sin permiso de publicación o uso comercial verificado. Véase el README de la raíz.

## Actualizar la agenda

Sustituye `datos/AGENDA.json` por la revisión canónica y ejecuta `python3 herramientas/regenerar_agenda.py`. El script usa solo la biblioteca estándar y modifica únicamente el bloque entre los comentarios `agenda:inicio` y `agenda:fin`. Usa `fecha_revision` como corte; puedes pasar `--corte AAAA-MM-DD` para evaluar el bloque a otra fecha. Confirma que el corte, los estados y los enlaces correspondan a la revisión editorial antes de distribuir el HTML. Un cuadro externo futuro se rotula por separado y nunca cuenta como asistencia confirmada. No se consulta el JSON en el navegador; los resultados quedan en HTML.
