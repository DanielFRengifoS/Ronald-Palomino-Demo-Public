#!/usr/bin/env python3
import argparse, json, re
from datetime import date
from html import escape as h
from pathlib import Path
from urllib.parse import urlsplit

root = Path(__file__).resolve().parents[1]
months = 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split()
def fecha(s):
    d = date.fromisoformat(s)
    return f'{d.day} de {months[d.month-1]} de {d.year}'
def link(url, label):
    u = urlsplit(url)
    if u.scheme not in ('https', 'http') or not u.hostname:
        raise ValueError(f'Fuente no válida: {url}')
    return f'<a href="{h(url)}">{h(label)}</a>'
def nota(text):
    parts = re.split(r'(https?://[^\s<>]+)', text)
    return ''.join(h(p) if i % 2 == 0 else link(p.rstrip('.,;)'), urlsplit(p).hostname) + h(p[len(p.rstrip('.,;)')):]) for i,p in enumerate(parts))
def lista(items, label):
    out = ['<ul class="agenda-list">']
    for e in items:
        start, end = e['inicio'], e['fin']
        if start and end: dates = f'Del {fecha(start)} al {fecha(end)}' if start != end else fecha(start)
        elif start: dates = f'Inicio: {fecha(start)} · Cierre no consignado'
        elif end: dates = f'Inicio no consignado · Cierre: {fecha(end)}'
        else: dates = 'Rango de fechas de squash no consignado'
        out.append(f'''<li class="event" data-evento="{h(e['id'])}"><div><p class="eyebrow">{h(label)}</p><p class="event-meta">{dates}</p></div>
<div><h4>{h(e['nombre'])}</h4><p class="event-meta">{h(e['lugar'])} · {h(e['modalidad'])}</p><p>{nota(e['nota'])}</p><p class="event-sources">{link(e['fuente_url'], 'Consultar fuente del certamen')}</p></div></li>''')
    return '\n'.join(out + ['</ul>'])
def render(data, corte):
    events = data['eventos']
    def future(status):
        return sorted((e for e in events if e['estado']==status and e['inicio'] and date.fromisoformat(e['inicio']) > corte), key=lambda e:e['inicio'])
    coming, draws = future('confirmado'), future('cuadro_publico')
    out = [f'<div class="status"><h3>Próximos torneos</h3><p>Corte: <time datetime="{corte}">{fecha(corte.isoformat())}</time>.</p>',
           lista(coming,'Participación confirmada') if coming else '<p>Sin participaciones individuales confirmadas al corte.</p>', '</div>']
    if draws:
        out += ['<h3>Cuadros publicados por terceros</h3><p>Figurar en un cuadro no confirma asistencia.</p>',lista(draws,'Cuadro público · Asistencia no confirmada')]
    out += ['<h3>Archivo de torneos disputados</h3>',lista([e for e in events if e['estado']=='disputado'],'Disputado')]
    return '\n'.join(out)
def main():
    p = argparse.ArgumentParser(description='Regenera solo el bloque de agenda de index.html.')
    p.add_argument('--corte', type=date.fromisoformat, help='Fecha ISO; por defecto, fecha_revision del JSON.')
    args = p.parse_args()
    data = json.loads((root/'datos/AGENDA.json').read_text(encoding='utf-8'))
    page = root/'index.html'
    start, end = '<!-- agenda:inicio -->', '<!-- agenda:fin -->'
    text = page.read_text(encoding='utf-8')
    if text.count(start)!=1 or text.count(end)!=1 or text.index(start)>text.index(end):
        raise ValueError('Marcadores de agenda inválidos')
    page.write_text(text.split(start)[0]+start+'\n'+render(data,args.corte or date.fromisoformat(data['fecha_revision']))+'\n'+end+text.split(end)[1],encoding='utf-8')
if __name__ == '__main__': main()
