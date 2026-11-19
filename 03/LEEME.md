# Ronald Palomino · Opción 03 · Después de la segunda ronda

Versión incluida en el comparador interno revisado. Abre esta página directamente o desde la portada. Las fotos son referencias internas, sin permiso de publicación o uso comercial verificado. Véase el README de la raíz.

## Actualizar la agenda

Usa como entrada `AGENDA.json` del brief canónico, guardado **fuera de la raíz pública**. Actualiza el corte y valida los estados antes de regenerar. Desde esta carpeta, con Python 3.9+ y la zona horaria America/Bogota disponible:

```sh
python3 herramientas/regenerar_agenda.py /ruta/al/AGENDA.json
```

El script actualiza el bloque HTML de agenda, la fecha de corte, el estado del hero y `datos/agenda.publica.json`. Solo los registros `confirmado` con inicio futuro se muestran como próximas participaciones; los `cuadro_publico` futuros se rotulan aparte. Para reproducir esta entrega, añade `--fecha-compilacion 2026-11-19`. El HTML es una instantánea: vuelve a generar y desplegar antes de que venza cualquier próxima fecha, y cuando cambien confirmaciones. Revisa manualmente las tres filas y el texto de continuidad del registro editorial si cambia el corte, la ronda, las fuentes o la siguiente participación. Para servir el sitio basta con `index.html`, `assets/` y, si se desea exponerlo, `datos/`.
