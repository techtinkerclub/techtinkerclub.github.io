/* 99 Club Studio · Mobile Balance connected renderer fix v1.97
 * Re-registers only the Mobile Balance online adapter.  The generator is unchanged.
 */
(function(global){
'use strict';
const Play=global.TT99GamesPlay,A=global.TT99ArithmeticGames;
if(!Play||!A||typeof Play.registerAdapter!=='function')return;

const DIFFS=['easy','standard','challenge'];
const MB_LAYOUT=['auto','simple','nested','multiple'],MB_GIVEN=['auto','shape','total'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c));
const cap=s=>String(s||'').replace(/^./,x=>x.toUpperCase());
function select(c,id,label,vals,labels={}){return `<label><span>${label}</span><select data-v197-opt="${id}">${vals.map(v=>`<option value="${v}" ${String(c[id])===String(v)?'selected':''}>${labels[v]||cap(v)}</option>`).join('')}</select></label>`;}
function bindOptions(root,c,onChange,norm){root.querySelectorAll('[data-v197-opt]').forEach(el=>el.addEventListener('change',()=>onChange(norm({...c,[el.dataset.v197Opt]:el.value}))));}
function numericPad(){return `<div class="tt99-v196-keypad" data-v197-pad>${[1,2,3,4,5,6,7,8,9].map(v=>`<button type="button" data-v197-digit="${v}">${v}</button>`).join('')}<button type="button" data-v197-back>⌫</button><button type="button" data-v197-digit="0">0</button><button type="button" data-v197-clear>Clear</button></div>`;}
function appendDigit(cur,d){const s=cur==null?'':String(cur);return (s==='0'?String(d):s+String(d)).slice(0,5);}
function backspace(cur){const s=cur==null?'':String(cur);return s.length>1?s.slice(0,-1):null;}

function mbNorm(c={}){return {difficulty:DIFFS.includes(c.difficulty)?c.difficulty:'standard',layout:MB_LAYOUT.includes(c.layout)?c.layout:'auto',givenMode:MB_GIVEN.includes(c.givenMode)?c.givenMode:'auto'};}
function mbFrom(q){const o={};if(q.has('d'))o.difficulty=q.get('d');if(q.has('lay'))o.layout=q.get('lay');if(q.has('gm'))o.givenMode=q.get('gm');return o;}
function mbTo(c){c=mbNorm(c);return {d:c.difficulty,lay:c.layout,gm:c.givenMode};}
function mbOptions(root,c,onChange){c=mbNorm(c);root.innerHTML=select(c,'difficulty','Difficulty',DIFFS)+select(c,'layout','Mobile layout',MB_LAYOUT,{auto:'Auto for difficulty',simple:'Single balance',nested:'Nested balance',multiple:'Multiple nested balances'})+select(c,'givenMode','Starting clue',MB_GIVEN,{auto:'Mixed',shape:'Give one shape value',total:'Give whole-mobile total'});bindOptions(root,c,onChange,mbNorm);}
function mbCreate(c,seed){c=mbNorm(c);const settings={minYear:c.difficulty==='easy'?2:4,maxYear:6,topics:['calculation','algebra'],engineSettings:{mobilebalance:c}};for(let i=0;i<8;i++){const p=A.generate('mobilebalance',settings,`${seed}:online:${i}`);if(p&&!p.error&&A.validate(p)?.ok)return p;}throw new Error('Mobile Balance generation failed');}
function mbMeta(p,c){return `${cap(c.difficulty)} · ${p.barCount} balance${p.barCount===1?'':'s'} · ${p.shapeIds.length} shapes`;}
function mbRecord(c){c=mbNorm(c);return `${c.difficulty}:${c.layout}:${c.givenMode}`;}

function shapeSvg(id,cx,cy,size,cls=''){
  if(id==='circle')return `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${size*.46}"/>`;
  if(id==='square')return `<rect class="${cls}" x="${cx-size*.45}" y="${cy-size*.45}" width="${size*.9}" height="${size*.9}" rx="3"/>`;
  if(id==='triangle')return `<path class="${cls}" d="M ${cx} ${cy-size*.52} L ${cx+size*.52} ${cy+size*.45} L ${cx-size*.52} ${cy+size*.45} Z"/>`;
  if(id==='diamond')return `<path class="${cls}" d="M ${cx} ${cy-size*.55} L ${cx+size*.5} ${cy} L ${cx} ${cy+size*.55} L ${cx-size*.5} ${cy} Z"/>`;
  return `<path class="${cls}" d="M ${cx} ${cy-size*.56} L ${cx+size*.16} ${cy-size*.18} L ${cx+size*.55} ${cy-size*.17} L ${cx+size*.25} ${cy+size*.08} L ${cx+size*.35} ${cy+size*.48} L ${cx} ${cy+size*.25} L ${cx-size*.35} ${cy+size*.48} L ${cx-size*.25} ${cy+size*.08} L ${cx-size*.55} ${cy-size*.17} L ${cx-size*.16} ${cy-size*.18} Z"/>`;
}
function leaves(n){return n.type==='group'?1:leaves(n.left)+leaves(n.right);}
function depth(n){return n.type==='group'?1:1+Math.max(depth(n.left),depth(n.right));}
function shapeIds(n,out=new Set()){if(n.type==='group')out.add(n.shape);else{shapeIds(n.left,out);shapeIds(n.right,out);}return out;}
function branchKnown(n,vals){return [...shapeIds(n)].every(id=>vals[id]!=null);}
function branchValue(n,vals){if(n.type==='group')return n.count*Number(vals[n.shape]);return branchValue(n.left,vals)+branchValue(n.right,vals);}

function mobileSvg(p,state,feedback){
  let barId=0;
  const colors={circle:'#3f68c5',square:'#e48932',triangle:'#41a56a',diamond:'#d95b4f',star:'#8c5bc7'},vals={...p.givens,...state};
  function rec(n,x0,x1,y){
    const cx=(x0+x1)/2;
    if(n.type==='group'){
      const gap=23,first=y+20,last=first+Math.max(0,n.count-1)*gap,bottom=last+13;
      let out=`<g class="tt99-mobile-leaf"><line class="string" x1="${cx}" y1="${y}" x2="${cx}" y2="${bottom}"/>`;
      for(let i=0;i<n.count;i++)out+=shapeSvg(n.shape,cx,first+i*gap,18,`shape s-${n.shape}`);
      return `${out}</g>`;
    }
    const id=barId++,ll=leaves(n.left),rr=leaves(n.right),split=x0+(x1-x0)*ll/(ll+rr),lc=(x0+split)/2,rc=(split+x1)/2,childY=y+70;
    let tilt=0;
    if(feedback&&branchKnown(n.left,vals)&&branchKnown(n.right,vals)){
      const a=branchValue(n.left,vals),b=branchValue(n.right,vals),m=Math.max(1,a,b);
      tilt=Math.max(-4,Math.min(4,(b-a)/m*8));
    }
    const anim=Math.abs(tilt)>.01?`<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${y}" to="${tilt} ${cx} ${y}" dur="0.28s" fill="freeze"/>`:'';
    return `<g class="tt99-mobile-subtree" data-bar="${id}">${anim}<line class="bar" x1="${lc}" y1="${y}" x2="${rc}" y2="${y}"/><circle class="tt99-mobile-pivot" cx="${cx}" cy="${y}" r="3"/><line class="string" x1="${lc}" y1="${y}" x2="${lc}" y2="${childY}"/>${rec(n.left,x0,split,childY)}<line class="string" x1="${rc}" y1="${y}" x2="${rc}" y2="${childY}"/>${rec(n.right,split,x1,childY)}</g>`;
  }
  const rootY=62,viewH=Math.max(245,depth(p.tree)*82+100),style=Object.entries(colors).map(([k,v])=>`--${k}:${v}`).join(';');
  const note=p.topTotal!=null?'<p class="tt99-mobile-total-note">The number in the top circle is the total weight of the whole mobile.</p>':'';
  const top=p.topTotal!=null?`<g class="top-total"><circle cx="300" cy="25" r="20"/><text x="300" y="30">${esc(p.topTotal)}</text><line x1="300" y1="45" x2="300" y2="${rootY}"/></g>`:`<line class="top-string" x1="300" y1="18" x2="300" y2="${rootY}"/>`;
  return `${note}<svg class="tt99-mobile-svg" viewBox="0 0 600 ${viewH}" style="${style}">${top}${rec(p.tree,20,580,rootY)}</svg>`;
}

function mbMount(root,p,ctx){
  const unknown=p.shapeIds.filter(id=>p.givens[id]==null),state=Object.fromEntries(unknown.map(id=>[id,null]));
  let selected=unknown[0]||null,wrong=new Set(),hint=null,finished=false,feedback=false;
  root.className='tt99-mobile-online';
  root.innerHTML=`<div class="tt99-mobile-stage" data-mobile-stage></div><div class="tt99-mobile-values">${p.shapeIds.map(id=>{const m=p.shapeMeta[id];return p.givens[id]!=null?`<div class="given"><span data-shape-icon="${id}"></span><b>${esc(m.label)} = ${esc(p.givens[id])}</b></div>`:`<button type="button" data-mobile-answer="${id}"><span data-shape-icon="${id}"></span><b>${esc(m.label)} = <em data-mobile-value></em></b></button>`;}).join('')}</div>${numericPad()}`;
  const stage=root.querySelector('[data-mobile-stage]'),boxes=[...root.querySelectorAll('[data-mobile-answer]')],pad=root.querySelector('[data-v197-pad]');
  function renderIcons(){root.querySelectorAll('[data-shape-icon]').forEach(el=>{el.innerHTML=`<svg viewBox="0 0 40 40">${shapeSvg(el.dataset.shapeIcon,20,20,20,`shape s-${el.dataset.shapeIcon}`)}</svg>`;});}
  function isChallenge(){return !!document.querySelector('[data-mode="challenge"].is-active');}
  function render(){stage.innerHTML=mobileSvg(p,state,!isChallenge()||feedback);boxes.forEach(b=>{const id=b.dataset.mobileAnswer;b.querySelector('[data-mobile-value]').textContent=state[id]??'';b.classList.toggle('is-selected',selected===id);b.classList.toggle('is-wrong',wrong.has(id));b.classList.toggle('is-hint',hint===id);b.disabled=finished;});pad.querySelectorAll('button').forEach(b=>b.disabled=finished||!selected);renderIcons();}
  function snapshot(){return {...state};}
  function emptySnapshot(){return Object.fromEntries(unknown.map(id=>[id,null]));}
  function restore(s){for(const id of unknown)state[id]=s?.[id]??null;wrong.clear();hint=null;feedback=false;render();}
  function commit(v){if(!selected||finished||ctx.isPaused?.())return;state[selected]=v;wrong.clear();hint=null;feedback=false;render();ctx.onChange?.(snapshot());}
  function click(e){const b=e.target.closest('[data-mobile-answer]');if(b&&!finished){selected=b.dataset.mobileAnswer;hint=null;render();return;}const d=e.target.closest('[data-v197-digit]');if(d)return commit(appendDigit(state[selected],d.dataset.v197Digit));if(e.target.closest('[data-v197-back]'))return commit(backspace(state[selected]));if(e.target.closest('[data-v197-clear]'))return commit(null);}
  function keydown(e){if(!selected)return;if(/^\d$/.test(e.key)){e.preventDefault();commit(appendDigit(state[selected],e.key));}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();commit(backspace(state[selected]));}}
  root.addEventListener('click',click);root.addEventListener('keydown',keydown);
  function bad(){return unknown.filter(id=>state[id]!=null&&Number(state[id])!==Number(p.values[id]));}
  function filled(){return unknown.filter(id=>state[id]!=null).length;}
  function complete(){return filled()===unknown.length&&!bad().length;}
  function progress(){return `${filled()} / ${unknown.length} shape values found · ${p.barCount} balance${p.barCount===1?'':'s'}`;}
  function check({silent=false}={}){if(complete())return {complete:true,message:'Balanced! Every bar and every shape value is correct.'};const b=bad();if(!silent){wrong=new Set(b);feedback=true;render();}return b.length?{complete:false,wrong:true,message:`${b.length} shape value${b.length===1?' is':'s are'} incorrect. The mobile shows which completed balances are off.`}:{complete:false,wrong:false,message:'No incorrect values so far. Use the lower balances to unlock the higher ones.'};}
  function hintFn(){if(bad().length)return {tone:'hint',message:'At least one entered shape value is wrong. Use Check to highlight it.'};const id=unknown.find(x=>state[x]==null);if(!id)return {tone:'hint',message:'All values are filled — try Check.'};selected=id;hint=id;render();return {tone:'hint',message:p.barCount>1?'Start with the lowest bar whose shapes you can compare directly. Once that bar is solved, treat its whole branch as one known weight higher up.':'Both sides of the bar weigh the same. Compare the number of shapes on each side before calculating.'};}
  function setFinished(v){finished=!!v;wrong.clear();hint=null;feedback=true;render();}
  function destroy(){root.removeEventListener('click',click);root.removeEventListener('keydown',keydown);}
  render();
  return {snapshot,restore,emptySnapshot,progress,check,hint:hintFn,setFinished,destroy};
}

Play.registerAdapter('mobilebalance',{
  id:'mobilebalance',order:35,icon:'⚖',title:'Mobile Balance',shortTitle:'Mobile Balance',category:'Algebra & arithmetic',
  blurb:'Use balanced hanging shapes to work out hidden values. Challenge has multiple nested balances.',
  completionTitle:'Mobile balanced',completeMessage:'Every bar is balanced and every shape value is correct.',
  startMessage:'Use the lowest balance first, then work upwards through the mobile.',
  instruction:'Every horizontal bar is balanced. Work out the value of each shape.',
  howTitle:'A whole branch has weight too',
  howText:'The left and right sides of every bar weigh the same. Repeated shapes mean repeated copies of the same value. On nested mobiles, solve a lower bar first, then use the total weight of that whole branch higher up. If a number is shown in the top circle, it is the total weight of the whole mobile.',
  normalizeConfig:mbNorm,fromQuery:mbFrom,toQuery:mbTo,renderOptions:mbOptions,createPuzzle:mbCreate,mount:mbMount,meta:mbMeta,recordKey:mbRecord
});
})(typeof globalThis!=='undefined'?globalThis:this);
