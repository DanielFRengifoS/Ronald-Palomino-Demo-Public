# Ronald Palomino · Opción 02 · Dos títulos, dos fichas

Versión incluida en el comparador interno revisado. Abre esta página directamente o desde la portada. Las fotos son referencias internas, sin permiso de publicación o uso comercial verificado. Véase el README de la raíz.

## Actualizar agenda

1. Sustituye `actualizacion/AGENDA.json` por la revisión canónica y comprueba `fecha_revision`, estados y fuentes. No cambies los datos directamente en el HTML. Mantén `inicio`/`fin` nulos cuando no consten; no uses fechas de crónicas para completar rangos.
2. Desde la raíz ejecuta `python3 actualizacion/regenerar_agenda.py`. Solo se modifica el fragmento entre `AGENDA:INICIO` y `AGENDA:FIN`. Para detectar si se desincronizó, ejecuta el mismo comando con `--check`.
3. Revisa el resultado antes de volver a servirlo: al corte de esta entrega solo se muestran E01–E05 como disputados. El generador exige `confirmado` e inicio posterior al corte para anunciar un próximo torneo; `cuadro_publico` va en un grupo separado y no confirma asistencia. E06 se excluye expresamente en esta versión; no levantar el bloqueo sin validación editorial. `aspiraciones` no se procesa como calendario.
