from pathlib import Path
import re

# 1) Add a paper-specific four-weight puzzle to the shared generator. Online Play
# keeps using rows/finalChallenge; printable preview/PDF use paper.rows/paper.finalChallenge.
p=Path('assets/99club/games-balance-lab-v192.js')
t=p.read_text()
anchor="""function makeRow(target,difficulty,style,rng,index){
  const allowMul=style==='mixed'||(style==='auto'&&difficulty!=='easy');
  const blank=blankExpr(target,difficulty,rng,allowMul),known=completeExpr(target,difficulty,rng,allowMul),swap=(index+rng())%2>1;
  const left=swap?known:blank.text,right=swap?blank.text:known;
  const display=`${left} = ${right}`;
  return {display,answer:blank.answer,solution:display.replace('□',String(blank.answer)),balancedValue:target};
}
"""
if anchor not in t: raise SystemExit('makeRow anchor missing')
insert=anchor+r'''
function paperFinalWeights(difficulty,rng){
  const min=difficulty==='easy'?2:difficulty==='challenge'?6:4;
  const max=difficulty==='easy'?12:difficulty==='challenge'?26:20;
  let best=null;
  for(let attempt=0;attempt<30;attempt++){
    const target=randInt(rng,min*2,max*2),left=composition(target,2,min,max,rng),right=composition(target,2,min,max,rng);
    const tagged=shuffle(rng,left.map(value=>({value,side:'L'})).concat(right.map(value=>({value,side:'R'}))));
    const candidate={weights:tagged.map(x=>x.value),target,solutionSides:tagged.map(x=>x.side),solutionLeft:tagged.filter(x=>x.side==='L').map(x=>x.value),solutionRight:tagged.filter(x=>x.side==='R').map(x=>x.value)};
    best=candidate;
    const leftKey=left.slice().sort((a,b)=>a-b).join(','),rightKey=right.slice().sort((a,b)=>a-b).join(',');
    if(new Set(candidate.weights).size>=3&&leftKey!==rightKey)return candidate;
  }
  return best;
}
function paperKnownExpr(total,difficulty,rng){
  const candidates=[];
  const a=randInt(rng,2,Math.max(2,total-2));candidates.push(`${total-a} + ${a}`);
  const s=randInt(rng,2,difficulty==='easy'?10:18);candidates.push(`${total+s} − ${s}`);
  if(difficulty!=='easy'){
    const ds=divisors(total);if(ds.length){const d=choose(rng,ds);candidates.push(`${d} × ${total/d}`);}
    const d=randInt(rng,2,difficulty==='challenge'?8:5);candidates.push(`${total*d} ÷ ${d}`);
  }
  return choose(rng,candidates);
}
function makePaperRow(weight,difficulty,style,rng,index){
  const allowMul=style==='mixed'||(style==='auto'&&difficulty!=='easy'),modes=['add_after','add_before','subtract'];
  if(allowMul)modes.push('multiply');
  if(difficulty==='challenge'&&weight>=6)modes.push('divide');
  let mode=modes[index%modes.length],target,blank;
  if(mode==='multiply'){
    const m=randInt(rng,2,difficulty==='challenge'?6:4);target=weight*m;blank=(index%2?`□ × ${m}`:`${m} × □`);
  }else if(mode==='divide'){
    const divis=[2,3,4,5].filter(d=>weight%d===0&&weight/d>=2);
    if(divis.length){const d=choose(rng,divis);target=weight/d;blank=`□ ÷ ${d}`;}else mode='add_after';
  }
  if(mode==='add_after'){
    const k=randInt(rng,2,difficulty==='easy'?10:15);target=weight+k;blank=`${k} + □`;
  }else if(mode==='add_before'){
    const k=randInt(rng,2,difficulty==='easy'?10:15);target=weight+k;blank=`□ + ${k}`;
  }else if(mode==='subtract'){
    target=randInt(rng,Math.max(5,Math.ceil(weight/2)),difficulty==='challenge'?35:25);blank=`${target+weight} − □`;
  }
  const known=paperKnownExpr(target,difficulty,rng),swap=(index%4===3)||(rng()<.28),left=swap?known:blank,right=swap?blank:known,display=`${left} = ${right}`;
  return {display,answer:weight,solution:display.replace('□',String(weight)),balancedValue:target,weightValue:weight,weightLabel:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[index]||String(index+1)};
}
function generatePaperBalanceLab(c,seed){
  const rng=rngFromSeed(`${seed}:balance-lab-paper-v194`),final=paperFinalWeights(c.difficulty,rng),rows=final.weights.map((v,i)=>makePaperRow(v,c.difficulty,c.style,rng,i));
  return {rows,finalChallenge:final,instruction:'Find the four weight values, then use A, B, C and D exactly once to make the final scale balance.',version:'1.94'};
}
'''
t=t.replace(anchor,insert,1)
old="""  return {
    engineId:'balance',title:'Balance Lab',difficulty:c.difficulty,rows,
    finalChallenge:{...final,instruction:'Use every collected weight once. Split them between the two pans so both totals are equal.'},
    instruction:'Balance each equation to collect its weight. Then use every weight in the Final Balance.',seed,options:c,balanceLabVersion:'1.92'
  };
"""
new="""  return {
    engineId:'balance',title:'Balance Lab',difficulty:c.difficulty,rows,
    finalChallenge:{...final,instruction:'Use every collected weight once. Split them between the two pans so both totals are equal.'},
    paper:generatePaperBalanceLab(c,seed),
    instruction:'Balance each equation to collect its weight. Then use every weight in the Final Balance.',seed,options:c,balanceLabVersion:'1.92'
  };
"""
if old not in t: raise SystemExit('generate return anchor missing')
t=t.replace(old,new,1)
p.write_text(t)

# 2) Browser printable preview: 2x2 equations -> A-D result strip -> final balance.
p=Path('assets/99club/games-app.js')
t=p.read_text()
pat=r"  function renderBalance\(a,answers,index,si,ai\)\{.*?\n\n  function logicHead"
new=r'''  function renderBalance(a,answers,index,si,ai){
    const paper=a.paper||{},rows=paper.rows||a.rows||[],f=paper.finalChallenge||a.finalChallenge||{},labels='ABCDEFGHIJKLMNOPQRSTUVWXYZ',label=i=>rows[i]?.weightLabel||labels[i]||String(i+1),side=s=>rows.map((r,i)=>({r,i})).filter(x=>f.solutionSides?.[x.i]===s),slot=(r,i,compact=false)=>`<span class="tt99-balance-paper-weight ${compact?'compact':''} ${answers?'answer-fill':''}"><i>${esc(label(i))}</i><b>${answers?esc(r.answer):''}</b></span>`,cards=rows.map((r,i)=>{const parts=String(answers?r.solution:r.display).split(answers?String(r.answer):'□');const before=answers?String(r.solution).split(String(r.answer))[0]:String(r.display).split('□')[0],after=answers?String(r.solution).slice(before.length+String(r.answer).length):String(r.display).split('□').slice(1).join('□');return `<div class="tt99-balance-print-card"><small>Weight ${esc(label(i))}</small><div class="tt99-balance-print-equation"><span>${esc(before)}</span>${slot(r,i)}<span>${esc(after)}</span></div></div>`;}).join(''),results=rows.map((r,i)=>slot(r,i,true)).join(''),pan=(name,items)=>`<div class="tt99-balance-paper-pan"><small>${name}</small><div class="tt99-balance-paper-pan-slots">${[0,1].map(j=>{const item=items[j];return item&&answers?`<span class="filled"><b>${esc(label(item.i))}</b><em>${esc(item.r.answer)}</em></span>`:'<span class="blank">____</span>';}).join('')}</div><strong>Total ${answers?esc(f.target):'____'}</strong></div>`,left=side('L'),right=side('R');
    return `<section class="tt99-game-activity tt99-balance tt99-balance-lab-print">${activityReplaceButton(si,ai)}${arithmeticHead({...a,title:'Balance Lab',instruction:'Find the value of each weight so both sides of every equation are equal.'},index)}<div class="tt99-balance-print-list">${cards}</div><div class="tt99-balance-print-results"><strong>Your weights</strong>${results}</div><div class="tt99-balance-print-final"><small>${answers?'Final balance · example solution':'Final balance'}</small><p>Use A, B, C and D exactly once. Put two weights on each side, then add the totals.</p><div class="tt99-balance-paper-scale">${pan('Left',left)}<div class="tt99-balance-paper-centre"><span class="beam"></span><span class="stand">▲</span><b>=</b></div>${pan('Right',right)}</div></div></section>`;
  }

  function logicHead'''
t2,n=re.subn(pat,new,t,count=1,flags=re.S)
if n!=1: raise SystemExit(f'app renderBalance replacement count {n}')
p.write_text(t2)

# 3) PDF renderer matching the approved v5c hierarchy and clean rounded weight tiles.
p=Path('assets/99club/games-pdf.js')
t=p.read_text()
pat=r"  function drawBalance\(page,a,answers,x,y,w,h,index\)\{.*?\n  \}\n\n\n  function drawKakuro"
new=r'''  function drawBalance(page,a,answers,x,y,w,h,index){
    const paper=a.paper||{},rows=paper.rows||a.rows||[],f=paper.finalChallenge||a.finalChallenge||{},labels='ABCDEFGHIJKLMNOPQRSTUVWXYZ',label=i=>rows[i]?.weightLabel||labels[i]||String(i+1),top=activityFrame(page,x,y,w,h,index,{...a,title:'Balance Lab'});
    drawWrapped(page,x+12,top,'Find the value of each weight so both sides of every equation are equal.',w-24,6.2,{color:MUTED,maxLines:1});
    function token(tx,ty,tw,th,lab,value,filled){drawRoundRect(page,tx,ty,tw,th,5,{fill:filled?HIT:WHITE,stroke:[22,139,130],width:.85});drawCircle(page,tx+11,ty+th/2,7.2,{fill:[22,139,130],stroke:[22,139,130],width:.5});diagramText(page,tx+11,ty+th/2+2.1,lab,5.4,{bold:true,color:WHITE});if(filled)diagramText(page,tx+tw-14,ty+th/2+2.4,formatNumber(value),6.4,{bold:true,color:[15,111,104]});else page.line(tx+23,ty+th/2+2,tx+tw-7,ty+th/2+2,{color:[110,134,137],width:.55});}
    const cols=2,gapX=7,gapY=6,bodyY=top+25,cardW=(w-30-gapX)/2,cardH=Math.max(37,Math.min(44,(h-178)/2));
    rows.slice(0,4).forEach((r,i)=>{const rr=Math.floor(i/2),cc=i%2,cx=x+15+cc*(cardW+gapX),cy=bodyY+rr*(cardH+gapY),shown=answers?r.solution:r.display,needle=answers?String(r.answer):'□',pos=shown.indexOf(needle),before=pos>=0?shown.slice(0,pos):shown,after=pos>=0?shown.slice(pos+needle.length):'',fs=7.2,preW=diagramTextWidth(before,fs,true),postW=diagramTextWidth(after,fs,true),tw=44,eqGap=5,totalW=preW+postW+tw+eqGap*2,start=cx+cardW/2-totalW/2,baseline=cy+cardH*.62;drawRoundRect(page,cx,cy,cardW,cardH,6,{fill:WHITE,stroke:[207,224,223],width:.65});page.text(cx+7,cy+10,`WEIGHT ${label(i)}`,4.8,{bold:true,color:MUTED});if(before)page.text(start,baseline,clean(before),fs,{bold:true,color:INK});const tx=start+preW+eqGap;token(tx,baseline-13,tw,22,label(i),r.answer,answers);if(after)page.text(tx+tw+eqGap,baseline,clean(after),fs,{bold:true,color:INK});});
    const resultY=bodyY+2*(cardH+gapY)+1,resultH=29;drawRoundRect(page,x+15,resultY,w-30,resultH,6,{fill:[240,248,246],stroke:[205,222,220],width:.6});page.text(x+25,resultY+18,'YOUR WEIGHTS',4.8,{bold:true,color:MUTED});const resultStart=x+100,resultGap=7,resultW=(w-130-resultGap*3)/4;rows.slice(0,4).forEach((r,i)=>token(resultStart+i*(resultW+resultGap),resultY+4,resultW,21,label(i),r.answer,answers));
    const fy=resultY+resultH+7,fh=y+h-fy-9;drawRoundRect(page,x+15,fy,w-30,fh,7,{fill:[245,250,249],stroke:[166,194,191],width:.75});page.text(x+25,fy+13,answers?'FINAL BALANCE - EXAMPLE SOLUTION':'FINAL BALANCE',5.2,{bold:true,color:[15,111,104]});page.text(x+25,fy+25,'Use A, B, C and D exactly once. Put two weights on each side, then add the totals.',5.0,{color:DARK});
    const centre=x+w/2,beamY=fy+45,beamHalf=Math.min(72,w*.18),panW=Math.min(126,w*.31),panH=Math.max(34,fh-58),panY=fy+52;page.line(centre-beamHalf,beamY,centre+beamHalf,beamY,{color:[100,132,135],width:2.6});rawPath(page,[`${pdfN(centre)} ${pdfN(page.height-(beamY+1))} m`,`${pdfN(centre-15)} ${pdfN(page.height-(fy+fh-8))} l`,`${pdfN(centre+15)} ${pdfN(page.height-(fy+fh-8))} l`,'h'],{fill:[100,132,135],stroke:[100,132,135],width:.5});drawCircle(page,centre,beamY,3.6,{fill:WHITE,stroke:[100,132,135],width:.8});
    function drawPan(px,side){const items=rows.map((r,i)=>({r,i})).filter(z=>f.solutionSides?.[z.i]===side),pcx=px+panW/2,anchor=side==='L'?centre-beamHalf:centre+beamHalf;page.line(anchor,beamY,pcx,panY,{color:[129,157,160],width:.7});drawRoundRect(page,px,panY,panW,panH,8,{fill:WHITE,stroke:[144,178,174],width:.8});page.text(px+8,panY+11,side==='L'?'LEFT':'RIGHT',4.3,{bold:true,color:MUTED});for(let j=0;j<2;j++){const sx=px+30+j*50,sy=panY+8;if(answers&&items[j])token(sx,sy,44,20,label(items[j].i),items[j].r.answer,true);else drawRoundRect(page,sx,sy,44,20,5,{fill:WHITE,stroke:[159,188,184],width:.65});}page.text(pcx,panY+panH+10,`TOTAL ${answers?formatNumber(f.target):'______'}`,5.2,{bold:true,color:INK,align:'center'});}
    drawPan(x+22,'L');drawPan(x+w-22-panW,'R');drawRoundRect(page,centre-18,panY+7,36,22,10,{fill:WHITE,stroke:[144,178,174],width:.7});diagramText(page,centre,panY+22,'=',8.5,{bold:true,color:[15,111,104]});
  }


  function drawKakuro'''
t2,n=re.subn(pat,new,t,count=1,flags=re.S)
if n!=1: raise SystemExit(f'pdf drawBalance replacement count {n}')
p.write_text(t2)

# 4) Printable preview styling. Keep the Online Play styles above this marker untouched.
p=Path('assets/99club/games-balance-lab-v192.css')
t=p.read_text()
marker='/* Printable/browser preview'
idx=t.find(marker)
if idx<0: raise SystemExit('printable CSS marker missing')
head=t[:idx]
tail=r'''/* Printable/browser preview · v1.94 */
.tt99-balance-lab-print .tt99-balance-print-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:8px}
.tt99-balance-lab-print .tt99-balance-print-card{display:grid;gap:5px;padding:8px 9px;border:1px solid #d5e3e2;border-radius:9px;background:#fff}.tt99-balance-lab-print .tt99-balance-print-card>small{font-size:.54rem;font-weight:900;color:#71868a;text-transform:uppercase;letter-spacing:.04em}
.tt99-balance-print-equation{display:flex;justify-content:center;align-items:center;gap:5px;min-height:34px;color:#294f54;font-weight:900;font-size:.82rem;white-space:nowrap}
.tt99-balance-paper-weight{display:inline-grid;grid-template-columns:19px minmax(25px,1fr);align-items:center;min-width:55px;height:28px;padding:0 6px 0 3px;border:1.4px solid #168b82;border-radius:8px;background:#fff;color:#0f6f68}.tt99-balance-paper-weight i{display:grid;place-items:center;width:19px;height:19px;border-radius:50%;background:#168b82;color:#fff;font-style:normal;font-size:.62rem;font-weight:950}.tt99-balance-paper-weight b{min-width:22px;border-bottom:1px solid #7f999b;text-align:center;font-size:.72rem;line-height:1.25}.tt99-balance-paper-weight.answer-fill{background:#eaf6f3}.tt99-balance-paper-weight.answer-fill b{border-bottom:0}.tt99-balance-paper-weight.compact{min-width:50px;height:25px;grid-template-columns:18px minmax(22px,1fr)}.tt99-balance-paper-weight.compact i{width:18px;height:18px}
.tt99-balance-print-results{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:7px;padding:6px 9px;border:1px solid #d5e3e2;border-radius:9px;background:#f0f8f6}.tt99-balance-print-results>strong{margin-right:3px;font-size:.53rem;letter-spacing:.04em;text-transform:uppercase;color:#71868a}
.tt99-balance-print-final{margin-top:7px;padding:8px 10px 7px;border:1px solid #a6c2bf;border-radius:10px;background:#f5faf9;text-align:left}.tt99-balance-print-final>small{display:block;font-size:.57rem;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#0f6f68}.tt99-balance-print-final>p{margin:2px 0 6px;color:#4f6c70;font-size:.59rem}
.tt99-balance-paper-scale{display:grid;grid-template-columns:1fr 66px 1fr;gap:5px;align-items:end}.tt99-balance-paper-pan{position:relative;display:grid;gap:2px;padding:5px 7px 4px;border:1px solid #90b2ae;border-radius:9px;background:#fff;text-align:center}.tt99-balance-paper-pan>small{position:absolute;left:7px;top:4px;font-size:.45rem;font-weight:900;color:#71868a;text-transform:uppercase}.tt99-balance-paper-pan-slots{display:flex;justify-content:center;gap:7px;padding-top:10px}.tt99-balance-paper-pan-slots>span{display:grid;place-items:center;min-width:48px;height:22px;border:1px solid #a6c0bd;border-radius:6px;background:#fff;color:#657f82;font-size:.54rem}.tt99-balance-paper-pan-slots>span.filled{grid-template-columns:auto auto;gap:4px;background:#eaf6f3;color:#0f6f68}.tt99-balance-paper-pan-slots span b{font-size:.58rem}.tt99-balance-paper-pan-slots span em{font-size:.58rem;font-style:normal;font-weight:900}.tt99-balance-paper-pan>strong{font-size:.55rem;color:#385d61}
.tt99-balance-paper-centre{position:relative;height:55px;display:grid;align-items:end;justify-items:center}.tt99-balance-paper-centre .beam{position:absolute;top:10px;width:66px;height:4px;border-radius:99px;background:#648487}.tt99-balance-paper-centre .stand{font-size:1.8rem;line-height:1;color:#648487}.tt99-balance-paper-centre>b{position:absolute;bottom:16px;display:grid;place-items:center;width:36px;height:22px;border:1px solid #90b2ae;border-radius:12px;background:#fff;color:#0f6f68}
@media(max-width:620px){.tt99-balance-lab-list{grid-template-columns:1fr}.tt99-balance-scale{grid-template-columns:minmax(0,1fr) 70px minmax(0,1fr)}.tt99-balance-beam{width:66px}.tt99-balance-equation{grid-template-columns:minmax(0,1fr) 62px minmax(0,1fr)}.tt99-balance-lab-print .tt99-balance-print-list{grid-template-columns:1fr}.tt99-balance-print-results{flex-wrap:wrap}.tt99-balance-paper-scale{grid-template-columns:1fr 55px 1fr}.tt99-balance-paper-pan-slots{gap:4px}.tt99-balance-paper-pan-slots>span{min-width:38px}}
@media print{.tt99-balance-print-final,.tt99-balance-print-results{background:#fff}.tt99-balance-lab-print .tt99-balance-print-card{break-inside:avoid}}
'''
p.write_text(head+tail)

# 5) Cache bumps on printable page only.
p=Path('_pages/99-club-games.md')
t=p.read_text()
repls=[('games-balance-lab-v192.css?v=2','games-balance-lab-v192.css?v=3'),('games-balance-lab-v192.js?v=1','games-balance-lab-v192.js?v=2'),('games-pdf.js?v=24','games-pdf.js?v=25'),('games-app.js?v=25','games-app.js?v=26')]
for old,new in repls:
    if old not in t: raise SystemExit(f'cache anchor missing: {old}')
    t=t.replace(old,new,1)
p.write_text(t)
