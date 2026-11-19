#!/usr/bin/env python3
"""Renderiza la agenda desde el JSON canónico (solo biblioteca estándar)."""
from datetime import date
from html import escape
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

HERE = Path(__file__).resolve().parent
START, END = '<!-- AGENDA:INICIO -->', '<!-- AGENDA:FIN -->'
MONTHS = 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split()
LABELS = {
    'E01': ('Panam Sports · dobles', 'Panam Sports · equipos'),
    'E02': ('COC · individual', 'COC · dobles'),
    'E03': ('PanAm Squash · resultado', 'PanAm Squash · fechas del campeonato'),
    'E04': ('COC · resultados', 'Organización · fechas y sede de squash'),
    'E05': ('FollowSquash · resultado (fuente secundaria)', 'Organizador · sede y fechas'),
}


def time(d):
    return f'<time datetime="{d}">{d.day} de {MONTHS[d.month-1]} de {d.year}</time>'


def source(url, label):
    parsed = urlsplit(url)
    if parsed.scheme != 'https' or not parsed.hostname:
        raise ValueError(f'Fuente no HTTPS: {url}')
    return f'<a href="{escape(url, quote=True)}">{escape(label)}</a>'


def card(e):
    ident = e['id']
    if not re.fullmatch(r'E\d+', ident):
        raise ValueError(f'ID no válido: {ident}')
    a, b = [date.fromisoformat(e[k]) if e[k] else None for k in ('inicio', 'fin')]
    if a and b and a > b:
        raise ValueError(f'Rango invertido: {ident}')
    if a and b:
        dates = time(a) if a == b else f'{time(a)} al {time(b)}'
    elif a or b:
        dates = f'Inicio: {time(a)} · Fin no consignado' if a else f'Inicio no consignado · Fin: {time(b)}'
    else:
        dates = 'Rango de squash no consignado' if ident == 'E01' else 'Fechas no consignadas'
    dates += {'E03':' · fechas del campeonato','E04':' · fechas de squash'}.get(ident,'')
    note = e.get('nota', '')
    urls = [e['fuente_url'], *[u.rstrip('.,;)') for u in re.findall(r'https://[^\s]+', note)]]
    note = re.sub(r' Fechas de las crónicas, no del rango de competencia: [^.]+\.', '', note)
    note = re.sub(r'https://[^\s]+', '', note)
    note = re.sub(r'\s+(?:Equipos|Fechas de todo el campeonato|Fechas y sede de squash|Sede y fechas del organizador):\s*$', '', note)
    note = note.rstrip(' :;')
    if note and not note.endswith('.'):
        note += '.'
    labels = LABELS.get(ident, ('Fuente del registro',))
    links = ' · '.join(source(u, labels[i] if i < len(labels) else f'Fuente complementaria {i}') for i,u in enumerate(urls))
    status = {'disputado':'Disputado','confirmado':'Confirmado','cuadro_publico':'Cuadro de terceros · asistencia no confirmada'}[e['estado']]
    return f'''      <article class="event" id="evento-{ident.lower()}">
        <p class="eyebrow">{status}</p>
        <h4>{escape(e['nombre'])}</h4>
        <p class="meta">{dates}</p>
        <p class="meta">{escape(e['lugar'])}</p>
        <p class="meta">{escape(e['modalidad'])}</p>
        <p class="note">{escape(note)}</p>
        <p class="sources">{links}</p>
      </article>'''


def render(data):
    cut = date.fromisoformat(data['fecha_revision'])
    events = [e for e in data['eventos'] if e['id'] != 'E06']  # Interno en esta versión.
    future = lambda e: e['inicio'] and date.fromisoformat(e['inicio']) > cut
    confirmed = [e for e in events if e['estado'] == 'confirmado' and future(e)]
    third = [e for e in events if e['estado'] == 'cuadro_publico' and future(e)]
    archive = [e for e in events if e['estado'] == 'disputado' and not future(e)]
    out = [f'    <p class="cut">Corte de la agenda: {time(cut)}.</p>']
    if not confirmed:
        out.append('    <p class="upcoming">Próximos torneos: sin participaciones individuales confirmadas al corte.</p>')
    for rows,title,ident in [(confirmed,'Próximos torneos confirmados','confirmados'), (third,'Cuadros de terceros · no confirman asistencia','cuadros'), (archive,'Archivo de torneos disputados','archivo')]:
        if rows:
            out.extend([f'    <h3 class="archive-title" id="{ident}">{title}</h3>', '    <div class="events">', *(card(e) for e in rows), '    </div>'])
    return '\n'.join(out)


if __name__ == '__main__':
    page = HERE.parent / 'index.html'
    old = page.read_text(encoding='utf-8')
    if old.count(START) != 1 or old.count(END) != 1:
        raise SystemExit('Marcadores de agenda ausentes o duplicados.')
    a, tail = old.split(START)
    _, b = tail.split(END)
    new = a + START + '\n' + render(json.loads((HERE/'AGENDA.json').read_text(encoding='utf-8'))) + '\n    ' + END + b
    if '--check' in sys.argv:
        if old != new:
            raise SystemExit('La agenda estática no coincide con el JSON.')
        print('Agenda estática verificada.')
    else:
        page.write_text(new, encoding='utf-8')
        print('Agenda estática regenerada.')
