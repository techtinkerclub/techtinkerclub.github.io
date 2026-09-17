from pathlib import Path
import re

ROOT=Path('.')

def replace_once(path, old, new):
    p=ROOT/path
    text=p.read_text()
    if old not in text:
        raise SystemExit(f'anchor not found in {path}: {old[:80]!r}')
    p.write_text(text.replace(old,new,1))

# Reuse the reviewed v1.88 science vocabulary verbatim so online and paper
# share one deterministic word source rather than maintaining two banks.
src=(ROOT/'assets/99club/games-play-symbol-decoder-v188.js').read_text()
m=re.search(r"const SCIENCE_DATA=`(.*?)`\.trim\(\);",src,re.S)
if not m:
    raise SystemExit('science bank not found')
science=m.group(1)

shared=r'''/* 99 Club Studio · shared Symbol Decoder engine v1.89
 * One deterministic generator for Online Play, browser sheets and PDF sheets.
 */
(function(global){
'use strict';
const G=global.TT99Games,A=global.TT99ArithmeticGames;
if(!G||!A||global.TT99SymbolDecoder)return;
const SYMBOLS=['◆','●','▲','■','★','⬟','✦'];
const DIFFS=['easy','standard','challenge'],THEMES=['mixed','maths','science'],STYLES=['auto','additive','coefficients'];
const SCIENCE_DATA=`__SCIENCE__`.trim();
const SCIENCE=SCIENCE_DATA.split('\n').map(line=>{const [term,definition,topic]=line.split('|');return {term,definition,topic,theme:'science'};});
function mathsBank(){return (G.VOCABULARY||[]).map(x=>({term:String(x.term||'').toUpperCase(),definition:String(x.definition||''),topic:x.topic||'maths',theme:'maths'})).filter(x=>/^[A-Z]{4,11}$/.test(x.term));}
function uniqueCount(word){return new Set(word).size;}
function bank(theme,difficulty){const all=[...mathsBank(),...SCIENCE],d=new Map();for(const x of all)if(/^[A-Z]{4,11}$/.test(x.term)&&!d.has(x.term))d.set(x.term,x);const b=difficulty==='easy'?{min:4,max:6,uMin:3,uMax:4}:difficulty==='challenge'?{min:6,max:10,uMin:5,uMax:7}:{min:5,max:8,uMin:4,uMax:6};return [...d.values()].filter(x=>(theme==='mixed'||x.theme===theme)&&x.term.length>=b.min&&x.term.length<=b.max&&uniqueCount(x.term)>=b.uMin&&uniqueCount(x.term)<=b.uMax);}
function hash(s){let h=2166136261>>>0;for(const ch of String(s)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=hash(seed)||0x6d2b79f5;return()=>{a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function pick(arr,r){return arr[Math.floor(r()*arr.length)];}
function letterValue(ch){return ch.charCodeAt(0)-64;}
function normalise(c={}){return {difficulty:DIFFS.includes(c.difficulty)?c.difficulty:'standard',theme:THEMES.includes(c.theme)?c.theme:'mixed',equationStyle:STYLES.includes(c.equationStyle)?c.equationStyle:'auto'};}
function relation(sym,sv,known,kv,style,r,step){const coeff=style==='coefficients'||(style==='auto'&&step>1&&r()<.45);if(coeff){const k=r()<.72?2:3;return r()<.5?`${k} × ${sym} + ${known} = ${k*sv+kv}`:`${sym} + ${k} × ${known} = ${sv+k*kv}`;}if(r()<.45)return `${sym} + ${known} = ${sv+kv}`;return sv>=kv?`${sym} − ${known} = ${sv-kv}`:`${known} − ${sym} = ${kv-sv}`;}
function generate(config,seed){const c=normalise(config),r=rng(seed),choices=bank(c.theme,c.difficulty);if(!choices.length)throw new Error('No decoder words available for these settings.');const chosen=pick(choices,r),word=chosen.term,letters=[...new Set(word)],symbols=SYMBOLS.slice(0,letters.length),map={};letters.forEach((ch,i)=>map[ch]=symbols[i]);const values=letters.map(letterValue),clues=[],firstK=c.equationStyle==='coefficients'||c.difficulty==='challenge'?3:2;clues.push(`${firstK} × ${symbols[0]} = ${firstK*values[0]}`);for(let i=1;i<symbols.length;i++)clues.push(relation(symbols[i],values[i],symbols[i-1],values[i-1],c.equationStyle,r,i));if(c.difficulty==='challenge'&&symbols.length>=5)clues.push(`${symbols[0]} + ${symbols.at(-1)} = ${values[0]+values.at(-1)}`);return {engineId:'symbols',title:'Symbol Decoder',difficulty:c.difficulty,theme:chosen.theme,topic:chosen.topic,word,definition:chosen.definition||'',letters,symbols,names:symbols,values,map,code:[...word].map(ch=>map[ch]),clues,equations:clues.map(text=>({text,answer:null})),instruction:'Crack the symbols to reveal the secret word. Each value is also a letter code: 1=A, 2=B, … 26=Z.',seed,options:c};}
const def=A.DEFINITIONS?.symbols;
if(def){def.title='Symbol Decoder';def.defaultSettings={difficulty:'standard',theme:'mixed',equationStyle:'auto'};def.settingsSchema=[{id:'difficulty',type:'difficulty',label:'Difficulty'},{id:'theme',type:'select',label:'Secret word',options:[{value:'mixed',label:'Maths + science'},{value:'maths',label:'Maths words'},{value:'science',label:'Science words'}]},{id:'equationStyle',type:'select',label:'Clue style',options:[{value:'auto',label:'Auto'},{value:'additive',label:'Addition / subtraction'},{value:'coefficients',label:'Include coefficients'}]}];def.difficultyDescriptions={easy:'Shorter secret words and simpler linked clues',standard:'Longer maths/science words with linked symbol clues',challenge:'Longer codes, more distinct symbols and coefficient clues'};}
const oldGenerate=A.generate.bind(A),oldWorked=A.workedExample.bind(A);
A.generate=function(id,settings,seed){return id==='symbols'?generate(settings?.engineSettings?.symbols||{},seed):oldGenerate(id,settings,seed);};
A.workedExample=function(id,settings,seed){if(id!=='symbols')return oldWorked(id,settings,seed);return {engineId:'symbols',title:'Symbol Decoder worked example',kind:'symbols',goal:'Solve the symbol values, turn the values into letters, then reveal the secret word.',rules:['The same symbol always has the same value.','Use 1=A, 2=B, … 26=Z to turn a cracked value into a letter.','A repeated symbol reveals the same letter everywhere in the secret word.'],steps:['Clue: 2 × ◆ = 36, so ◆ = 18.','18 is the 18th letter of the alphabet, so ◆ = R.','Use R’s value in the next linked clue to crack another symbol.','Keep going until every position in the secret word is decoded.'],tip:'Start with the clue that can be solved using only one unknown symbol.',commonMistake:'Do not stop after finding the number — convert it to its alphabet letter too.'};};
global.TT99SymbolDecoder={VERSION:'1.89',SYMBOLS,SCIENCE,normalise,bank,generate,letterValue};
A.__symbolDecoderV189=true;
})(typeof globalThis!=='undefined'?globalThis:this);
'''.replace('__SCIENCE__',science)
(ROOT/'assets/99club/games-symbol-decoder-v189.js').write_text(shared)

# Browser sheet renderer: same decoded-message structure as Online Play.
app=ROOT/'assets/99club/games-app.js'
text=app.read_text()
pat=r"  function renderSymbols\(a,answers,index,si,ai\)\{return `.*?`;\}\n\n  function renderDomino"
new=r'''  function renderSymbols(a,answers,index,si,ai){
    const symbols=a.symbols||a.names||[],values=a.values||[],letters=a.letters||[],code=a.code||[],clues=a.clues||(a.equations||[]).map(e=>e.text),letterFor=s=>{const i=symbols.indexOf(s);return i>=0?letters[i]||'':'';},codeHtml=code.map(s=>`<span class="${answers?'answer-fill':''}"><b>${answers?esc(letterFor(s)):esc(s)}</b></span>`).join(''),clueHtml=clues.map((q,i)=>`<div><small>Clue ${i+1}</small>${esc(q)}</div>`).join(''),locks=symbols.map((s,i)=>`<span>${esc(s)} = ${answers?`<b>${esc(values[i])}</b> → ${esc(letters[i])}`:'____'}</span>`).join(''),definition=answers&&a.definition?`<p class="tt99-print-decoder-definition"><strong>${esc(a.word)}:</strong> ${esc(a.definition)}</p>`:'';
    return `<section class="tt99-game-activity tt99-symbols tt99-symbol-decoder-print" style="--decoder-count:${Math.max(1,code.length)};--decoder-symbol-count:${Math.max(1,symbols.length)}">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-print-decoder-message"><small>${a.theme==='science'?'Science word':a.theme==='maths'?'Maths word':'Maths / science word'} · secret message</small><div class="tt99-print-decoder-code">${codeHtml}</div>${definition}<span class="tt99-print-decoder-key">Number-to-letter code: 1=A · 2=B · … · 26=Z</span></div><div class="tt99-print-decoder-clues">${clueHtml}</div><div class="tt99-print-decoder-locks">${locks}</div></section>`;
  }

  function renderDomino'''
text2,n=re.subn(pat,new,text,count=1,flags=re.S)
if n!=1: raise SystemExit(f'renderSymbols patch count {n}')
app.write_text(text2)

# PDF renderer: vector symbols avoid relying on missing Unicode glyphs in Helvetica.
pdf=ROOT/'assets/99club/games-pdf.js'
text=pdf.read_text()
pat=r"  function drawSymbols\(page,a,answers,x,y,w,h,index\)\{.*?\}\n\n  function drawDomino"
new=r'''  function drawSymbols(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a),symbols=a.symbols||a.names||[],values=a.values||[],letters=a.letters||[],code=a.code||[],clues=a.clues||(a.equations||[]).map(e=>e.text),letterFor=s=>{const i=symbols.indexOf(s);return i>=0?letters[i]||'':'';};
    function shape(page,cx,cy,s,r=5){const i=symbols.indexOf(s),stroke=[47,105,103],fill=[232,246,243];if(i===1)return drawCircle(page,cx,cy,r,{fill,stroke,width:.8});if(i===3)return page.rect(cx-r,cy-r,r*2,r*2,{fill,stroke,width:.8});const pts=i===2?[[cx,cy-r],[cx+r,cy+r],[cx-r,cy+r]]:i===5?Array.from({length:6},(_,k)=>{const a=-Math.PI/2+k*Math.PI/3;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];}):i===4?Array.from({length:10},(_,k)=>{const a=-Math.PI/2+k*Math.PI/5,rr=k%2?r*.45:r;return [cx+Math.cos(a)*rr,cy+Math.sin(a)*rr];}):i===6?[[cx,cy-r],[cx+r*.42,cy-r*.42],[cx+r,cy],[cx+r*.42,cy+r*.42],[cx,cy+r],[cx-r*.42,cy+r*.42],[cx-r,cy],[cx-r*.42,cy-r*.42]]:[[cx,cy-r],[cx+r,cy],[cx,cy+r],[cx-r,cy]];if(!page?.c)return drawCircle(page,cx,cy,r,{fill,stroke,width:.8});const Y=v=>page.height-v,parts=[`${pdfN(pts[0][0])} ${pdfN(Y(pts[0][1]))} m`,...pts.slice(1).map(p=>`${pdfN(p[0])} ${pdfN(Y(p[1]))} l`),'h'];rawPath(page,parts,{fill,stroke,width:.8});}
    function equation(page,text,cx,baseline,maxW){const tokens=String(text).split(/\s+/),parts=tokens.map(t=>symbols.includes(t)?{t,w:14,s:true}:{t,w:diagramTextWidth(clean(t),7.3,true)+5,s:false}),total=parts.reduce((q,p)=>q+p.w,0),scale=Math.min(1,maxW/Math.max(1,total));let xx=cx-total*scale/2;for(const p of parts){const ww=p.w*scale;if(p.s)shape(page,xx+ww/2,baseline-2,p.t,4.6*scale);else diagramText(page,xx+ww/2,baseline,clean(p.t),7.3*scale,{bold:true,color:INK});xx+=ww;}}
    drawWrapped(page,x+12,top,a.instruction,w-24,6.7,{color:MUTED,maxLines:2});let cy=top+25;
    page.text(x+w/2,cy,'SECRET WORD',5.4,{bold:true,color:MUTED,align:'center'});cy+=7;const gap=3,n=Math.max(1,code.length),cell=Math.min(28,(w-54-gap*(n-1))/n),total=n*cell+(n-1)*gap,sx=x+w/2-total/2;for(let i=0;i<n;i++){const xx=sx+i*(cell+gap);drawRoundRect(page,xx,cy,cell,cell,4,{fill:answers?HIT:WHITE,stroke:[116,161,156],width:.8});if(answers)diagramText(page,xx+cell/2,cy+cell*.64,letterFor(code[i]),Math.min(10,cell*.42),{bold:true,color:TEAL});else shape(page,xx+cell/2,cy+cell/2,code[i],Math.min(5.5,cell*.24));}cy+=cell+8;page.text(x+w/2,cy,'1=A · 2=B · ... · 26=Z',5.6,{bold:true,color:MUTED,align:'center'});cy+=10;
    if(answers&&a.definition){const used=drawWrapped(page,x+20,cy,`${a.word}: ${a.definition}`,w-40,5.9,{color:DARK,maxLines:2,lineHeight:7});cy+=used+5;}
    const cols=clues.length>=5?3:2,rows=Math.ceil(clues.length/cols),cg=5,cw=(w-24-cg*(cols-1))/cols,ch=Math.max(20,Math.min(27,(h-(cy-y)-52)/Math.max(1,rows)));clues.forEach((q,i)=>{const r=Math.floor(i/cols),c=i%cols,xx=x+12+c*(cw+cg),yy=cy+r*(ch+4);drawRoundRect(page,xx,yy,cw,ch,5,{fill:WHITE,stroke:[211,225,224],width:.6});page.text(xx+5,yy+7,`CLUE ${i+1}`,4.4,{bold:true,color:MUTED});equation(page,q,xx+cw/2,yy+ch*.70,cw-8);});cy+=rows*(ch+4)+3;
    const lc=Math.max(1,symbols.length),lw=(w-24)/lc;symbols.forEach((s,i)=>{const cx=x+12+lw*i+lw/2;shape(page,cx-lw*.20,cy+9,s,4.6);const label=answers?`= ${values[i]} -> ${letters[i]}`:'= ____';fitDiagramText(page,cx+lw*.10,cy+12,label,lw*.62,6.3,{bold:true,color:answers?TEAL:DARK});});
  }

  function drawDomino'''
text2,n=re.subn(pat,new,text,count=1,flags=re.S)
if n!=1: raise SystemExit(f'drawSymbols patch count {n}')
pdf.write_text(text2)

# Wire shared engine and new presentation CSS/JS into both surfaces.
replace_once(Path('_pages/99-club-games-play.md'),'<link rel="stylesheet" href="/assets/99club/games-play-symbol-decoder-v188.css?v=1">','<link rel="stylesheet" href="/assets/99club/games-play-symbol-decoder-v188.css?v=1">\n<link rel="stylesheet" href="/assets/99club/games-play-symbol-decoder-v189.css?v=1">')
replace_once(Path('_pages/99-club-games-play.md'),'<script src="/assets/99club/games-engine.js?v=15"></script>','<script src="/assets/99club/games-engine.js?v=15"></script>\n<script src="/assets/99club/games-symbol-decoder-v189.js?v=1"></script>')
replace_once(Path('_pages/99-club-games-play.md'),'<script src="/assets/99club/games-play-symbol-decoder-v188.js?v=1"></script>','<script src="/assets/99club/games-play-symbol-decoder-v188.js?v=1"></script>\n<script src="/assets/99club/games-play-symbol-decoder-v189.js?v=1"></script>')
replace_once(Path('_pages/99-club-games.md'),'<link rel="stylesheet" href="/assets/99club/games-killer-cages-v181.css?v=1">','<link rel="stylesheet" href="/assets/99club/games-killer-cages-v181.css?v=1">\n<link rel="stylesheet" href="/assets/99club/games-symbol-decoder-v189.css?v=1">')
replace_once(Path('_pages/99-club-games.md'),'<script src="/assets/99club/games-engine.js?v=15"></script>','<script src="/assets/99club/games-engine.js?v=15"></script>\n<script src="/assets/99club/games-symbol-decoder-v189.js?v=1"></script>')

# Make Online Play use the shared generator too.
p=ROOT/'assets/99club/games-play-symbol-decoder-v189.js'
t=p.read_text()
t=t.replace("const Play=global.TT99GamesPlay;\nconst adapter=Play?.adapters?.get?.('symbols');","const Play=global.TT99GamesPlay,Shared=global.TT99SymbolDecoder;\nconst adapter=Play?.adapters?.get?.('symbols');")
t=t.replace("const previousMount=adapter.mount.bind(adapter);","const previousMount=adapter.mount.bind(adapter),previousCreate=adapter.createPuzzle.bind(adapter);\nadapter.createPuzzle=function(config,seed){return Shared?.generate?Shared.generate(config,seed):previousCreate(config,seed);};")
p.write_text(t)

# Documentation note.
doc=ROOT/'docs/99club/GAMES.md';t=doc.read_text();anchor='## Curriculum mapping principle'
entry='''### v1.89 — Symbol Decoder shared paper/online design\n- Symbol Decoder now uses one deterministic puzzle generator for Online Play, browser worksheet preview and PDF export.\n- The printable Symbol Equations activity is replaced by the same decode-a-secret-word mechanic rather than remaining a separate worksheet-only variant.\n- Decoded Online Play words are forced onto one responsive row; long words shrink their tiles instead of wrapping a final letter onto a second line.\n- Once the word is decoded, its curriculum-friendly definition appears directly beneath the word.\n- Printable pupil sheets show the coded word, linked clues, A1Z26 key and symbol-value working slots; answer sheets/PDFs reveal the word and definition.\n- PDF symbols are drawn as vector shapes so output does not depend on Unicode glyph support in the built-in Helvetica font.\n\n'''
if entry not in t:
    if anchor not in t: raise SystemExit('docs anchor missing')
    t=t.replace(anchor,entry+anchor,1);doc.write_text(t)

print('v1.89 source patch applied')
