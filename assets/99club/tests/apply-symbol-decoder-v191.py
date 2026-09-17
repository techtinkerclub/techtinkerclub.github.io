from pathlib import Path
import re

app=Path('assets/99club/games-app.js')
t=app.read_text()
pat=r"  function renderSymbols\(a,answers,index,si,ai\)\{.*?\n  \}\n\n  function renderDomino"
new=r'''  function renderSymbols(a,answers,index,si,ai){
    const symbols=a.symbols||a.names||[],values=a.values||[],letters=a.letters||[],code=a.code||[],clues=a.clues||(a.equations||[]).map(e=>e.text),letterFor=s=>{const i=symbols.indexOf(s);return i>=0?letters[i]||'':'';},codeHtml=code.map(s=>`<span><b>${esc(s)}</b></span>`).join(''),answerHtml=code.map(s=>`<span class="${answers?'answer-fill':''}">${answers?`<b>${esc(letterFor(s))}</b>`:''}</span>`).join(''),clueHtml=clues.map((q,i)=>`<div><small>Clue ${i+1}</small>${esc(q)}</div>`).join(''),locks=symbols.map((s,i)=>`<span>${esc(s)} = ${answers?`<b>${esc(values[i])}</b> → ${esc(letters[i])}`:'____'}</span>`).join(''),definition=answers&&a.definition?`<p class="tt99-print-decoder-definition"><strong>${esc(a.word)}:</strong> ${esc(a.definition)}</p>`:'',alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const alphabetRows=[alphabet.slice(0,13),alphabet.slice(13)].map(row=>`<span>${[...row].map(ch=>`${ch}=${ch.charCodeAt(0)-64}`).join(' · ')}</span>`).join('');
    return `<section class="tt99-game-activity tt99-symbols tt99-symbol-decoder-print" style="--decoder-count:${Math.max(1,code.length)};--decoder-symbol-count:${Math.max(1,symbols.length)}">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-print-decoder-message"><small>${a.theme==='science'?'Science word':a.theme==='maths'?'Maths word':'Maths / science word'} · secret message</small><div class="tt99-print-decoder-code">${codeHtml}</div><small class="tt99-print-decoder-answer-label">Write the word</small><div class="tt99-print-decoder-answer">${answerHtml}</div><div class="tt99-print-decoder-alphabet"><strong>Letter code</strong>${alphabetRows}</div>${definition}</div><div class="tt99-print-decoder-clues">${clueHtml}</div><div class="tt99-print-decoder-locks">${locks}</div></section>`;
  }

  function renderDomino'''
t2,n=re.subn(pat,lambda _m:new,t,count=1,flags=re.S)
if n!=1: raise SystemExit(f'renderSymbols replacement count {n}')
app.write_text(t2)

css=Path('assets/99club/games-symbol-decoder-v189.css')
t=css.read_text()
anchor='.tt99-print-decoder-code>span.answer-fill{background:#e3f4f0;border-color:#58a196;color:#176f66}\n'
insert='''.tt99-print-decoder-answer-label{\n  display:block;\n  margin:8px 0 4px;\n  color:#536f73;\n  font-size:.62rem;\n  font-weight:900;\n  letter-spacing:.08em;\n  text-transform:uppercase;\n}\n.tt99-print-decoder-answer{\n  display:grid;\n  grid-template-columns:repeat(var(--decoder-count,6),minmax(0,1fr));\n  gap:4px;\n  width:min(100%,620px);\n  margin:0 auto;\n}\n.tt99-print-decoder-answer>span{\n  min-width:0;\n  aspect-ratio:1;\n  max-width:34px;\n  width:100%;\n  justify-self:center;\n  display:grid;\n  place-items:center;\n  border:1.2px solid #a7c0be;\n  border-radius:6px;\n  background:#fff;\n  color:#176f66;\n  font-size:clamp(.72rem,2.2vw,1rem);\n  font-weight:900;\n}\n.tt99-print-decoder-answer>span.answer-fill{background:#e8f5f2;border-color:#6aa9a1}\n.tt99-print-decoder-alphabet{\n  margin:8px auto 0;\n  max-width:660px;\n  color:#61797c;\n  font-size:.59rem;\n  line-height:1.45;\n}\n.tt99-print-decoder-alphabet strong{\n  display:block;\n  margin-bottom:2px;\n  color:#4d686c;\n  font-size:.6rem;\n  letter-spacing:.06em;\n  text-transform:uppercase;\n}\n.tt99-print-decoder-alphabet span{display:block;white-space:nowrap}\n'''
if anchor not in t: raise SystemExit('decoder CSS anchor missing')
t=t.replace(anchor,anchor+insert,1)
t=t.replace('  .tt99-print-decoder-code>span{max-width:36px;border-radius:7px;font-size:.78rem}\n','  .tt99-print-decoder-code>span{max-width:36px;border-radius:7px;font-size:.78rem}\n  .tt99-print-decoder-answer>span{max-width:30px}\n  .tt99-print-decoder-alphabet{font-size:.52rem}\n',1)
t=t.replace('  .tt99-print-decoder-code>span.answer-fill{background:#eef7f5!important}\n','  .tt99-print-decoder-code>span.answer-fill{background:#eef7f5!important}\n  .tt99-print-decoder-answer>span,.tt99-print-decoder-answer>span.answer-fill{background:#fff!important}\n',1)
css.write_text(t)

pdf=Path('assets/99club/games-pdf.js')
t=pdf.read_text()
old="""    page.text(x+w/2,cy,'SECRET WORD',5.4,{bold:true,color:MUTED,align:'center'});cy+=7;const gap=3,n=Math.max(1,code.length),cell=Math.min(28,(w-54-gap*(n-1))/n),total=n*cell+(n-1)*gap,sx=x+w/2-total/2;for(let i=0;i<n;i++){const xx=sx+i*(cell+gap);drawRoundRect(page,xx,cy,cell,cell,4,{fill:answers?HIT:WHITE,stroke:[116,161,156],width:.8});if(answers)diagramText(page,xx+cell/2,cy+cell*.64,letterFor(code[i]),Math.min(10,cell*.42),{bold:true,color:TEAL});else shape(page,xx+cell/2,cy+cell/2,code[i],Math.min(5.5,cell*.24));}cy+=cell+8;page.text(x+w/2,cy,'1=A · 2=B · ... · 26=Z',5.6,{bold:true,color:MUTED,align:'center'});cy+=10;\n    if(answers&&a.definition){const used=drawWrapped(page,x+20,cy,`${a.word}: ${a.definition}`,w-40,5.9,{color:DARK,maxLines:2,lineHeight:7});cy+=used+5;}\n"""
new="""    page.text(x+w/2,cy,'SECRET WORD',5.4,{bold:true,color:MUTED,align:'center'});cy+=7;const gap=3,n=Math.max(1,code.length),cell=Math.min(27,(w-54-gap*(n-1))/n),total=n*cell+(n-1)*gap,sx=x+w/2-total/2;for(let i=0;i<n;i++){const xx=sx+i*(cell+gap);drawRoundRect(page,xx,cy,cell,cell,4,{fill:WHITE,stroke:[116,161,156],width:.8});shape(page,xx+cell/2,cy+cell/2,code[i],Math.min(5.3,cell*.23));}cy+=cell+6;\n    page.text(x+w/2,cy,'WRITE THE WORD',4.8,{bold:true,color:MUTED,align:'center'});cy+=5;const answerCell=Math.min(21,(w-82-gap*(n-1))/n),answerTotal=n*answerCell+(n-1)*gap,answerX=x+w/2-answerTotal/2;for(let i=0;i<n;i++){const xx=answerX+i*(answerCell+gap);drawRoundRect(page,xx,cy,answerCell,answerCell,3,{fill:answers?HIT:WHITE,stroke:[151,181,178],width:.7});if(answers)diagramText(page,xx+answerCell/2,cy+answerCell*.66,letterFor(code[i]),Math.min(8.5,answerCell*.43),{bold:true,color:TEAL});}cy+=answerCell+6;\n    page.text(x+w/2,cy,'LETTER CODE',4.7,{bold:true,color:MUTED,align:'center'});cy+=5;const alpha1='A=1  B=2  C=3  D=4  E=5  F=6  G=7  H=8  I=9  J=10  K=11  L=12  M=13',alpha2='N=14  O=15  P=16  Q=17  R=18  S=19  T=20  U=21  V=22  W=23  X=24  Y=25  Z=26';fitDiagramText(page,x+w/2,cy,alpha1,w-36,4.6,{bold:true,color:MUTED});cy+=6;fitDiagramText(page,x+w/2,cy,alpha2,w-36,4.6,{bold:true,color:MUTED});cy+=8;\n    if(answers&&a.definition){const used=drawWrapped(page,x+20,cy,`${a.word}: ${a.definition}`,w-40,5.9,{color:DARK,maxLines:2,lineHeight:7});cy+=used+5;}\n"""
if old not in t: raise SystemExit('PDF secret-word block anchor missing')
pdf.write_text(t.replace(old,new,1))

page=Path('_pages/99-club-games.md')
t=page.read_text()
for old,new in [('games-symbol-decoder-v189.css?v=1','games-symbol-decoder-v189.css?v=2'),('games-pdf.js?v=21','games-pdf.js?v=22'),('games-app.js?v=22','games-app.js?v=23')]:
    if old not in t: raise SystemExit(f'cache anchor missing: {old}')
    t=t.replace(old,new,1)
page.write_text(t)
print('v1.91 patch applied')
