import {loadCatalogue,CATEGORIES,isAnimated,isRules,ageLabel,readFilters,filterParams,filterDrills,drillHref,copyText,feedbackText} from './catalogue.js?v=0.18.8';
import {playbackData,renderScene} from './scene.js?v=0.20.76';
import {publicVideoBuilder} from './public-video.js?v=0.20.76';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fields={q:'search',age:'age',category:'category',format:'format',sort:'sort'};
let drills=[],ready=false,limit=18,thumbs=new Map(),messageTimer,videoBuilder;
const initialVideoId=new URLSearchParams(location.search).get('video');
$('age').insertAdjacentHTML('beforeend',Array.from({length:11},(_,i)=>'<option value="'+(i+6)+'">U'+(i+6)+'</option>').join(''));
$('category').insertAdjacentHTML('beforeend',CATEGORIES.map(x=>'<option>'+esc(x)+'</option>').join(''));
function read(){return readFilters(new URLSearchParams(Object.entries(fields).map(([key,id])=>[key,$(id).value])))}
function write(f){for(const [key,id] of Object.entries(fields))$(id).value=f[key]}
function replaceUrl(f){const p=filterParams(f).toString();history.replaceState(null,'',location.pathname+(p?'?'+p:''))}
function thumb(d){
 if(!isAnimated(d))return '<span class="card-symbol" aria-hidden="true">▤</span><span>Coaching notes</span>';
 if(!thumbs.has(d.id)){try{const safe=playbackData(d);const i=Math.min(1,safe.frames.length-1);let svg=renderScene(safe,{index:i,runs:true,passes:true,labels:true,decisions:true,scaleMode:'coaching',prefix:'thumb-'+d.id}).svg;
 // Each thumbnail has its own SVG paint-server namespace, even when several are displayed.
 const names=[...new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]))];for(const id of names){const next='t-'+d.id+'-'+id;svg=svg.split('id="'+id+'"').join('id="'+next+'"').split('url(#'+id+')').join('url(#'+next+')').split('href="#'+id+'"').join('href="#'+next+'"')}
 thumbs.set(d.id,svg)}catch{thumbs.set(d.id,'<span>Open drill to view diagram</span>')}}
 return thumbs.get(d.id);
}
function card(d,f){const animated=isAnimated(d),kind=isRules(d)?'RULES WALK-THROUGH':animated?'ANIMATED DRILL':'COACHING CARD',href=esc(drillHref(d.id,f));return '<article class="drill-card"><a class="thumb '+(animated?'':'card-only')+'" href="'+href+'" aria-label="View '+esc(d.title)+'">'+thumb(d)+'</a><div class="card-body"><div class="card-type">'+kind+' · '+esc(d.category)+'</div><h3>'+esc(d.title)+'</h3><div class="card-meta">'+(d.publishedAt?'Updated '+esc(new Date(d.publishedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}))+' · '+(Number.isInteger(d.publishedRevision)?'Revision '+d.publishedRevision:'Legacy revision')+' · ':'')+esc(ageLabel(d))+' · '+esc(d.minutes)+' min'+(animated?' · '+d.frames.length+' steps':'')+' · '+esc(d.length)+' × '+esc(d.width)+' m</div><p class="card-objective">'+esc(d.objective)+'</p><a class="view-link" href="'+href+'">'+(animated?'Watch drill':'Read coaching card')+'<span aria-hidden="true">›</span></a>'+(animated?'<button type="button" class="add-to-video" data-add-video="'+esc(d.id)+'">+ Add to video</button>':'')+'</div></article>'}
function render(reset=true){
 const f=read();if(reset)limit=f.category==='Test drills'?40:18;replaceUrl(f);
 for(const b of $('quickFilters').querySelectorAll('button')){const k=b.dataset.quick,on=k==='all'?!f.age&&!f.category&&!f.format&&!f.q:k==='u10'?f.age==='10':k==='test'?f.category==='Test drills':f.format===k;b.setAttribute('aria-pressed',String(on))}
 if(!ready)return;
 const list=filterDrills(drills,f);$('count').textContent=list.length+' matching · '+list.filter(isAnimated).length+' animated';$('results').innerHTML=list.slice(0,limit).map(d=>card(d,f)).join('');$('empty').hidden=!!list.length;$('more').hidden=list.length<=limit;$('more').textContent='Show more ('+Math.max(0,list.length-limit)+' remaining)';refreshVideoCards();
}
function refreshVideoCards(){if(!videoBuilder)return;for(const b of $('results').querySelectorAll('[data-add-video]')){const exists=videoBuilder.has(b.dataset.addVideo);b.textContent=exists?'✓ Added to video':'+ Add to video';b.disabled=exists||videoBuilder.full()}}
$('results').addEventListener('click',e=>{const b=e.target.closest('[data-add-video]');if(b&&videoBuilder)videoBuilder.add(b.dataset.addVideo)});
async function copy(value,title){
 if(await copyText(value)){$('message').hidden=false;$('message').textContent=title+' copied.';clearTimeout(messageTimer);messageTimer=setTimeout(()=>{$('message').hidden=true},4000);return}
 $('copyTitle').textContent=title;$('copyValue').value=value;$('copyDialog').showModal();$('copyValue').select()
}
for(const id of Object.values(fields))$(id).addEventListener(id==='search'?'input':'change',()=>render());
$('clear').onclick=()=>{write(readFilters(''));render();$('search').focus()};
$('quickFilters').onclick=e=>{const b=e.target.closest('[data-quick]');if(!b)return;const f=read(),k=b.dataset.quick;if(k==='all')write(readFilters(''));else if(k==='u10')$('age').value=f.age==='10'?'':'10';else if(k==='test')$('category').value=f.category==='Test drills'?'':'Test drills';else $('format').value=f.format===k?'':k;render()};
$('more').onclick=()=>{limit+=18;render(false)};
$('shareLibrary').onclick=()=>copy(new URL('./library.html',location.href).href,'Library link');
$('feedback').onclick=()=>copy(feedbackText(null,new URL('./library.html',location.href).href),'Review questions');
window.addEventListener('popstate',()=>{write(readFilters(location.search));render()});
write(readFilters(location.search));
try{drills=await loadCatalogue();ready=true;videoBuilder=publicVideoBuilder({getDrills:()=>drills,isAnimated,ageLabel,onChange:refreshVideoCards});const stats=[[drills.length,'resources'],[drills.filter(isAnimated).length,'animated drills'],[drills.filter(isRules).length,'rules walk-throughs']];$('stats').innerHTML=stats.map(([n,label])=>'<div class="stat"><strong>'+n+'</strong><span>'+label+'</span></div>').join('');render();if(initialVideoId&&drills.some(d=>d.id===initialVideoId&&isAnimated(d)))videoBuilder.add(initialVideoId)}catch(err){$('count').textContent='Could not load the library.';$('message').hidden=false;$('message').textContent=err.message+' Refresh the page to retry.'}
