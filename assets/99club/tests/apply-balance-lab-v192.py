from pathlib import Path

p=Path('assets/99club/games-balance-lab-v192.js'); t=p.read_text()
def rep(old,new,label):
    global t
    if old not in t: raise SystemExit(f'missing {label}')
    t=t.replace(old,new,1)
rep("  return {difficulty,rowCount:validRows.includes(String(raw.rowCount))?String(raw.rowCount):'auto',style:['auto','number','expression'].includes(raw.style)?raw.style:'auto'};","  const style=raw.style==='number'?'additive':raw.style==='expression'?'mixed':raw.style;\n  return {difficulty,rowCount:validRows.includes(String(raw.rowCount))?String(raw.rowCount):'auto',style:['auto','additive','mixed'].includes(style)?style:'auto'};",'normalise')
rep('function completeExpr(target,difficulty,rng){','function completeExpr(target,difficulty,rng,allowMul){','completeExpr')
rep("  if(difficulty!=='easy'){\n    const ds=divisors(target);if(ds.length){const d=choose(rng,ds);candidates.push(`${d} × ${target/d}`);}\n    const d=randInt(rng,2,difficulty==='challenge'?9:6);candidates.push(`${target*d} ÷ ${d}`);\n  }","  if(allowMul){\n    const ds=divisors(target);if(ds.length){const d=choose(rng,ds);candidates.push(`${d} × ${target/d}`);}\n    const d=randInt(rng,2,difficulty==='challenge'?9:6);candidates.push(`${target*d} ÷ ${d}`);\n  }",'complete allowMul')
rep('function blankExpr(target,difficulty,rng){','function blankExpr(target,difficulty,rng,allowMul){','blankExpr')
rep("  if(difficulty!=='easy'){\n    const ds=divisors(target);if(ds.length){const d=choose(rng,ds);candidates.push({text:`${d} × □`,answer:target/d});candidates.push({text:`□ × ${d}`,answer:target/d});}\n    const d=randInt(rng,2,difficulty==='challenge'?9:6);candidates.push({text:`□ ÷ ${d}`,answer:target*d});\n    if(difficulty==='challenge')candidates.push({text:`${target*d} ÷ □`,answer:d});\n  }","  if(allowMul){\n    const ds=divisors(target);if(ds.length){const d=choose(rng,ds);candidates.push({text:`${d} × □`,answer:target/d});candidates.push({text:`□ × ${d}`,answer:target/d});}\n    const d=randInt(rng,2,difficulty==='challenge'?9:6);candidates.push({text:`□ ÷ ${d}`,answer:target*d});\n    if(difficulty==='challenge')candidates.push({text:`${target*d} ÷ □`,answer:d});\n  }",'blank allowMul')
rep("function makeRow(target,difficulty,rng,index){\n  const blank=blankExpr(target,difficulty,rng),known=completeExpr(target,difficulty,rng),swap=(index+rng())%2>1;","function makeRow(target,difficulty,style,rng,index){\n  const allowMul=style==='mixed'||(style==='auto'&&difficulty!=='easy');\n  const blank=blankExpr(target,difficulty,rng,allowMul),known=completeExpr(target,difficulty,rng,allowMul),swap=(index+rng())%2>1;",'makeRow')
rep('  const rows=final.weights.map((v,i)=>makeRow(v,c.difficulty,rng,i));','  const rows=final.weights.map((v,i)=>makeRow(v,c.difficulty,c.style,rng,i));','row call')
rep("  if(style){style.label='Puzzle mix';style.options=[{value:'auto',label:'Mixed operations'},{value:'number',label:'Missing values'},{value:'expression',label:'Inverse-heavy'}];}","  if(style){style.label='Operations';style.options=[{value:'auto',label:'Auto for difficulty'},{value:'additive',label:'Addition + subtraction'},{value:'mixed',label:'Mixed + − × ÷'}];}",'definition style')
old="""  root.innerHTML=`<label><span>Difficulty</span><select data-bl-opt=\"difficulty\">${['easy','standard','challenge'].map(v=>`<option value=\"${v}\" ${c.difficulty===v?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')}</select></label><label><span>Balances</span><select data-bl-opt=\"rowCount\">${[['auto','Auto'],['4','4'],['5','5'],['6','6'],['8','8']].map(([v,l])=>`<option value=\"${v}\" ${c.rowCount===v?'selected':''}>${l}</option>`).join('')}</select></label>`;"""
new="""  root.innerHTML=`<label><span>Difficulty</span><select data-bl-opt=\"difficulty\">${['easy','standard','challenge'].map(v=>`<option value=\"${v}\" ${c.difficulty===v?'selected':''}>${v[0].toUpperCase()+v.slice(1)}</option>`).join('')}</select></label><label><span>Balances</span><select data-bl-opt=\"rowCount\">${[['auto','Auto'],['4','4'],['5','5'],['6','6'],['8','8']].map(([v,l])=>`<option value=\"${v}\" ${c.rowCount===v?'selected':''}>${l}</option>`).join('')}</select></label><label><span>Operations</span><select data-bl-opt=\"style\"><option value=\"auto\" ${c.style==='auto'?'selected':''}>Auto</option><option value=\"additive\" ${c.style==='additive'?'selected':''}>+ and −</option><option value=\"mixed\" ${c.style==='mixed'?'selected':''}>+ − × ÷</option></select></label>`;"""
rep(old,new,'online settings')
anchor="adapter.title='Balance Lab';"
setup="adapter.normalizeConfig=normalise;adapter.fromQuery=q=>({difficulty:q.get('d')||undefined,rowCount:q.get('rc')||undefined,style:q.get('s')||undefined});adapter.toQuery=c=>{c=normalise(c);return {d:c.difficulty,rc:c.rowCount,s:c.style};};adapter.recordKey=c=>{c=normalise(c);return `${c.difficulty}:${c.rowCount}:${c.style}:v192`;};adapter.createPuzzle=(c,seed)=>generateBalanceLab({minYear:c?.difficulty==='easy'?2:4,maxYear:6,topics:['calculation','algebra'],engineSettings:{balance:normalise(c)}},seed);\n"
rep(anchor,setup+anchor,'adapter setup')
p.write_text(t)

# Wire Online Play.
p=Path('_pages/99-club-games-play.md'); t=p.read_text()
for old,new,label in [
('<link rel="stylesheet" href="/assets/99club/games-play-symbol-decoder-v189.css?v=1">','<link rel="stylesheet" href="/assets/99club/games-play-symbol-decoder-v189.css?v=1">\n<link rel="stylesheet" href="/assets/99club/games-balance-lab-v192.css?v=1">','play css'),
('<script src="/assets/99club/games-play-symbol-decoder-v189.js?v=1"></script>','<script src="/assets/99club/games-play-symbol-decoder-v189.js?v=1"></script>\n<script src="/assets/99club/games-balance-lab-v192.js?v=1"></script>','play js')]:
    if old not in t: raise SystemExit(f'missing {label}')
    t=t.replace(old,new,1)
p.write_text(t)

# Wire printable assets/cache keys.
p=Path('_pages/99-club-games.md'); t=p.read_text()
for old,new,label in [
('<link rel="stylesheet" href="/assets/99club/games-symbol-decoder-v189.css?v=2">','<link rel="stylesheet" href="/assets/99club/games-symbol-decoder-v189.css?v=2">\n<link rel="stylesheet" href="/assets/99club/games-balance-lab-v192.css?v=1">','print css'),
('<script src="/assets/99club/games-arithmetic.js?v=6"></script>','<script src="/assets/99club/games-arithmetic.js?v=6"></script>\n<script src="/assets/99club/games-balance-lab-v192.js?v=1"></script>','print js'),
('games-pdf.js?v=22','games-pdf.js?v=23','pdf cache'),('games-pdf-v136.js?v=2','games-pdf-v136.js?v=3','overlay cache'),('games-app.js?v=23','games-app.js?v=24','app cache'),('games-puzzle-redesign-v136.js?v=1','games-puzzle-redesign-v136.js?v=2','browser overlay cache')]:
    if old not in t: raise SystemExit(f'missing {label}')
    t=t.replace(old,new,1)
p.write_text(t)

# Browser printable renderer.
p=Path('assets/99club/games-app.js'); t=p.read_text()
old='''  function renderBalance(a,answers,index,si,ai){return `<section class="tt99-game-activity tt99-balance">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-equation-list big">${a.rows.map(r=>`<div>${esc(answers?r.solution:r.display)}</div>`).join('')}</div></section>`;}'''
new='''  function renderBalance(a,answers,index,si,ai){const f=a.finalChallenge||{},left=f.solutionLeft||[],right=f.solutionRight||[],cards=a.rows.map((r,i)=>`<div class="tt99-balance-print-card"><small>Balance ${i+1}</small><div class="tt99-balance-print-eq">${esc(answers?r.solution:r.display)}</div><div class="tt99-balance-print-weight">Collected weight <b>${answers?esc(r.balancedValue):'________'}</b></div></div>`).join(''),final=answers?`<div class="tt99-balance-print-final"><small>Final balance · example solution</small><p>Use every collected weight once.</p><div class="tt99-balance-print-pans"><span class="tt99-balance-print-pan">${esc(left.join(' + '))}</span><b class="tt99-balance-print-equals">=</b><span class="tt99-balance-print-pan">${esc(right.join(' + '))}</span></div></div>`:`<div class="tt99-balance-print-final"><small>Final balance</small><p>Use every collected weight once. Split them between the two pans so both totals are equal.</p><div class="tt99-balance-print-pans"><span class="tt99-balance-print-pan">LEFT PAN __________________</span><b class="tt99-balance-print-equals">=</b><span class="tt99-balance-print-pan">RIGHT PAN __________________</span></div></div>`;return `<section class="tt99-game-activity tt99-balance tt99-balance-lab-print">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-balance-print-list">${cards}</div>${final}</section>`;}'''
if old not in t: raise SystemExit('missing games-app renderBalance')
p.write_text(t.replace(old,new,1))

# Skip legacy browser repair-tile overlay.
p=Path('assets/99club/games-puzzle-redesign-v136.js'); t=p.read_text(); old='function redesignBalance(a){if(a.dataset.v136)return;'; new="function redesignBalance(a){if(a.classList.contains('tt99-balance-lab-print')||a.dataset.v136)return;"
if old not in t: raise SystemExit('missing browser overlay balance')
p.write_text(t.replace(old,new,1))

# PDF renderer.
p=Path('assets/99club/games-pdf.js'); t=p.read_text()
old='''  function drawBalance(page,a,answers,x,y,w,h,index){const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.8,{color:MUTED,maxLines:2});let cy=top+32,rowH=(h-(cy-y)-12)/a.rows.length;for(const r of a.rows){page.rect(x+w*.15,cy,w*.70,Math.min(30,rowH-4),{fill:WHITE,stroke:[216,227,228],width:.5});page.text(x+w/2,cy+Math.min(20,rowH*.62),clean(answers?r.solution:r.display),8.2,{bold:true,color:answers?TEAL:INK,align:'center'});cy+=rowH;}}'''
new='''  function drawBalance(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.6,{color:MUTED,maxLines:2});
    const f=a.finalChallenge||{},cols=2,rows=Math.ceil(a.rows.length/cols),bodyY=top+29,finalH=64,gapX=7,gapY=6,cardW=(w-30-gapX)/2,available=h-(bodyY-y)-finalH-9,cardH=Math.max(31,Math.min(45,(available-gapY*(rows-1))/Math.max(1,rows)));
    a.rows.forEach((r,i)=>{const rr=Math.floor(i/cols),cc=i%cols,cx=x+15+cc*(cardW+gapX),cy=bodyY+rr*(cardH+gapY);drawRoundRect(page,cx,cy,cardW,cardH,6,{fill:WHITE,stroke:[207,224,223],width:.65});page.text(cx+7,cy+9,`BALANCE ${i+1}`,4.5,{bold:true,color:MUTED});fitDiagramText(page,cx+cardW/2,cy+cardH*.53,clean(answers?r.solution:r.display),cardW-14,7.4,{bold:true,color:answers?TEAL:INK});page.text(cx+7,cy+cardH-6,'WEIGHT',4.3,{bold:true,color:MUTED});const value=answers?formatNumber(r.balancedValue):'________';fitDiagramText(page,cx+cardW-8,cy+cardH-6,value,cardW*.45,5.8,{bold:true,color:answers?TEAL:DARK});});
    const fy=y+h-finalH+3;drawRoundRect(page,x+15,fy,w-30,finalH-8,7,{fill:answers?[248,252,251]:[245,250,249],stroke:[178,207,203],width:.75});page.text(x+w/2,fy+10,answers?'FINAL BALANCE - EXAMPLE SOLUTION':'FINAL BALANCE',5.2,{bold:true,color:MUTED,align:'center'});page.text(x+w/2,fy+21,'Use every collected weight once.',5.2,{color:DARK,align:'center'});
    if(answers){const left=(f.solutionLeft||[]).join(' + '),right=(f.solutionRight||[]).join(' + ');fitDiagramText(page,x+w/2,fy+42,`${left} = ${right}`,w-60,7.2,{bold:true,color:TEAL});}
    else{const panW=(w-82)/2,py=fy+31;page.text(x+19,py,'LEFT PAN',4.4,{bold:true,color:MUTED});page.line(x+19,py+14,x+19+panW,py+14,{color:[118,151,151],width:1});page.text(x+w/2,py+12,'=',8,{bold:true,color:TEAL,align:'center'});page.text(x+w/2+22,py,'RIGHT PAN',4.4,{bold:true,color:MUTED});page.line(x+w/2+22,py+14,x+w/2+22+panW,py+14,{color:[118,151,151],width:1});}
  }'''
if old not in t: raise SystemExit('missing PDF drawBalance')
p.write_text(t.replace(old,new,1))

# Disable old PDF repair overlay for balance.
p=Path('assets/99club/games-pdf-v136.js'); t=p.read_text()
t=t.replace(' * Symbol Decoder is intentionally excluded: games-pdf.js v1.89+ owns its paper layout.',' * Symbol Decoder and Balance Lab are intentionally excluded: the base PDF renderer owns their current paper layouts.',1)
old="function drawOverlay(cmds,a,answers,x,y,w,h,index){if(a.engineId==='balance')return drawRepair(cmds,a,answers,x,y,w,h,index);if(a.engineId==='operationgrid')return drawCode(cmds,a,answers,x,y,w,h,index);if(a.engineId==='functionmachine')return drawMachine(cmds,a,answers,x,y,w,h,index);}"
new="function drawOverlay(cmds,a,answers,x,y,w,h,index){if(a.engineId==='operationgrid')return drawCode(cmds,a,answers,x,y,w,h,index);if(a.engineId==='functionmachine')return drawMachine(cmds,a,answers,x,y,w,h,index);}"
if old not in t: raise SystemExit('missing PDF overlay function')
t=t.replace(old,new,1)
old="if(['balance','operationgrid','functionmachine'].includes(a.engineId))drawOverlay(entry.cmds,a,answers,M,bodyTop+i*(ah+gap),w,ah,i+1);"
new="if(['operationgrid','functionmachine'].includes(a.engineId))drawOverlay(entry.cmds,a,answers,M,bodyTop+i*(ah+gap),w,ah,i+1);"
if old not in t: raise SystemExit('missing PDF overlay list')
p.write_text(t.replace(old,new,1))

# Docs.
p=Path('docs/99club/GAMES.md')
if p.exists():
    t=p.read_text()
    if 'Balance the Equation' in t and 'Balance the Equation (Online Play: Balance Lab)' not in t:
        t=t.replace('Balance the Equation','Balance the Equation (Online Play: Balance Lab)',1)
    if '### v1.92 — Balance Lab' not in t:
        t += '\n\n### v1.92 — Balance Lab\nBalance the Equation now uses operations on both sides. Each solved equation yields its common balanced value as a weight; all weights feed a final equal-partition challenge. Online accepts any valid equal split; printable answers show an example solution.\n'
    p.write_text(t)
print('Balance Lab v1.92 integration applied')
