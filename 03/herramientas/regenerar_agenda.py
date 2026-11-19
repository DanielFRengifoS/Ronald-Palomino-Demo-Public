#!/usr/bin/env python3
"""Regenera HTML y datos públicos a partir del AGENDA.json canónico."""
import argparse, json, re
from datetime import date, datetime
from html import escape
from pathlib import Path
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
MONTHS = 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split()
LABELS = {'E01':'Panam Sports · dobles', 'E02':'Comité Olímpico Colombiano · individual', 'E03':'PanAm Squash · resultado', 'E04':'Comité Olímpico Colombiano · resultado', 'E05':'FollowSquash · cuadro de terceros'}
MORE = re.compile(r'(Equipos|dobles con Juan Vargas|Fechas de todo el campeonato|Fechas y sede de squash|Sede y fechas del organizador):\s*(https://[^\s<>]+)', re.I)
URLS = re.compile(r'https://[^\s<>]+')


def time(d, text=None):
    return f'<time datetime="{d.isoformat()}">{text or f"{d.day} de {MONTHS[d.month-1]} de {d.year}"}</time>'


def dates(e):
    s, f = (date.fromisoformat(e[k]) if e[k] else None for k in ('inicio','fin'))
    if s and f:
        if s == f: return time(s)
        return (time(s, str(s.day)) + '–' if (s.year,s.month)==(f.year,f.month) else time(s) + ' – ') + time(f)
    if s: return 'Inicio: ' + time(s) + ' · Fin no consignado'
    if f: return 'Inicio no consignado · Fin: ' + time(f)
    return 'Rango de squash no consignado'


def link(url, label):
    if url and urlparse(url).scheme=='https' and urlparse(url).hostname:
        return f'<a href="{escape(url)}">{escape(label)}</a>'
    return ''


def item(e):
    status = {'disputado':'Disputado','confirmado':'Confirmado','cuadro_publico':'Cuadro público · asistencia no confirmada'}[e['estado']]
    note = e.get('nota','')
    sources = [link(e.get('fuente_url'),LABELS.get(e['id'],'Fuente del registro'))]
    sources += [link(u.rstrip('.,)'), label[0].upper()+label[1:]) for label,u in MORE.findall(note)]
    note = MORE.sub('',note).strip().rstrip('; ')
    sources += [link(u.rstrip('.,)'),'Fuente complementaria') for u in URLS.findall(note)]
    note = URLS.sub('',note).strip()
    if e['id']=='E01': note=note.split(' Fechas de las crónicas,')[0]
    if e['id']=='E05': note=note.replace(' No se usa el parcial ni se infiere motivo de cierre del partido.','')
    note = re.sub(r' \(H\d{2}\)','',note)
    return f'''<li class="event" id="{escape(e['id'])}">
  <div class="event-state">{status}</div>
  <div><h4>{escape(e['nombre'])}</h4><p class="event-meta">{dates(e)}</p><p>{escape(e['lugar'])}</p></div>
  <div><p>{escape(e['modalidad'])}</p><p>{escape(note)}</p><div class="event-sources">{' '.join(filter(None,sources))}</div></div>
</li>'''


def group(title, rows):
    return f'<h3 class="group-title">{title}</h3>\n<ol class="events" role="list">'+'\n'.join(map(item,rows))+'</ol>'


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('canonico',type=Path)
    p.add_argument('--fecha-compilacion',type=date.fromisoformat,help='Reproducir un corte histórico; si se omite, hoy en Colombia.')
    args=p.parse_args()
    obj=json.loads(args.canonico.read_text(encoding='utf-8'))
    cutoff=date.fromisoformat(obj['fecha_revision'])
    reference=max(cutoff,args.fecha_compilacion or datetime.now(ZoneInfo('America/Bogota')).date())
    events=obj['eventos']
    if len({e['id'] for e in events}) != len(events): raise ValueError('IDs repetidos')
    hist=[e for e in events if e['estado']=='disputado']
    def upcoming(state):
        return sorted((e for e in events if e['estado']==state and e['inicio'] and date.fromisoformat(e['inicio'])>reference),key=lambda e:e['inicio'])
    future,boards=upcoming('confirmado'),upcoming('cuadro_publico')
    summary='Hay participaciones individuales confirmadas. Consulta la agenda.' if future else 'Sin participaciones individuales confirmadas.'
    parts=['<p class="agenda-status">'+('Participaciones individuales confirmadas.' if future else 'Próximos torneos: sin participaciones individuales confirmadas al corte.')+'</p>']
    if future: parts.append(group('Próximas participaciones confirmadas',future))
    if boards: parts.append(group('Cuadros públicos de terceros · no confirman asistencia',boards))
    parts.append(group('Ediciones disputadas',hist))
    path=ROOT/'index.html'
    page=path.read_text(encoding='utf-8')
    page,n=re.subn(r'(<!-- AGENDA:START -->).*?(<!-- AGENDA:END -->)',lambda m:m[1]+'\n '+'\n '.join(parts)+'\n '+m[2],page,flags=re.S)
    if n!=1: raise ValueError('Se esperaba un único bloque de agenda')
    page=re.sub(r'<time data-corte datetime="[^"]+">[^<]+</time>',time(cutoff).replace('<time ','<time data-corte '),page)
    page=re.sub(r'(<p id="estado-hero">)[^<]+',lambda m:m[1]+summary,page)
    page=re.sub(r'(<span id="rotulo-hero">)[^<]+',lambda m:m[1]+('Confirmado' if future else 'Sin confirmar'),page)
    path.write_text(page,encoding='utf-8')
    (ROOT/'datos'/'agenda.publica.json').write_text(json.dumps({'fecha_revision':obj['fecha_revision'],'eventos':hist+future+boards},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


if __name__=='__main__': main()
