from pathlib import Path

p=Path('assets/99club/games-app.js')
t=p.read_text()
old="const parts=String(answers?r.solution:r.display).split(answers?String(r.answer):'□');const before=answers?String(r.solution).split(String(r.answer))[0]:String(r.display).split('□')[0],after=answers?String(r.solution).slice(before.length+String(r.answer).length):String(r.display).split('□').slice(1).join('□');"
new="const raw=String(r.display),parts=raw.split('□'),before=parts[0]||'',after=parts.slice(1).join('□');"
if old not in t: raise SystemExit('app answer split anchor missing')
p.write_text(t.replace(old,new,1))

p=Path('assets/99club/games-pdf.js')
t=p.read_text()
old="shown=answers?r.solution:r.display,needle=answers?String(r.answer):'□',pos=shown.indexOf(needle),before=pos>=0?shown.slice(0,pos):shown,after=pos>=0?shown.slice(pos+needle.length):''"
new="shown=r.display,needle='□',pos=shown.indexOf(needle),before=pos>=0?shown.slice(0,pos):shown,after=pos>=0?shown.slice(pos+needle.length):''"
if old not in t: raise SystemExit('pdf answer split anchor missing')
p.write_text(t.replace(old,new,1))
