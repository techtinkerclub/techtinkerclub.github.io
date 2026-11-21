import {loadCatalogue} from './catalogue.js?v=0.20.88';
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const ids=(params.get('drills')||'').split(',').map(x=>x.trim()).filter(x=>/^seed-[a-z0-9-]{1,30}$/i.test(x)).slice(0,8);
const unique=[...new Set(ids)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let stages=[],current=0;
function showError(message){$('sequenceError').hidden=false;$('sequenceError').textContent=message;$('sequenceSummary').textContent='Progression unavailable';$('copySequence').disabled=true}
function select(i){
 if(!Number.isInteger(i)||i<0||i>=stages.length)return;
 current=i;const d=stages[i];
 $('stageCounter').textContent='STAGE '+(i+1)+' OF '+stages.length;
 $('stageTitle').textContent=d.title;
 $('stageObjective').textContent=d.objective||'Follow the drill demonstration and coaching card.';
 $('previousStage').disabled=i===0;$('nextStage').disabled=i===stages.length-1;
 $('stageNav').querySelectorAll('button').forEach((b,j)=>{if(j===i)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
 const p=new URLSearchParams({drill:d.id});if(params.get('style')==='minion')p.set('minion','1');$('drillViewer').src='./play.html?'+p;
 const u=new URL(location.href);u.searchParams.set('stage',String(i+1));history.replaceState(null,'',u);
}
$('previousStage').onclick=()=>select(current-1);
$('nextStage').onclick=()=>select(current+1);
$('stageNav').onclick=e=>{const b=e.target.closest('[data-stage]');if(b)select(Number(b.dataset.stage))};
$('copySequence').onclick=async()=>{
 const u=new URL(location.href);u.searchParams.delete('stage');
 try{await navigator.clipboard.writeText(u.href);$('copySequence').textContent='✓ Link copied'}
 catch{window.prompt('Copy this progression link',u.href)}
};
try{
 if(!unique.length)throw Error('This link contains no published drill IDs. Build a progression from the public library.');
 const catalogue=await loadCatalogue();
 const lookup=new Map(catalogue.map(d=>[d.id,d]));
 const missing=unique.filter(id=>!lookup.has(id));
 if(missing.length)throw Error('Some published drills are unavailable or have been unpublished: '+missing.join(', '));
 stages=unique.map(id=>lookup.get(id));
 $('sequenceTitle').textContent=stages.length===1?stages[0].title:'Coaching progression · '+stages.length+' drills';
 $('sequenceSummary').textContent='Follow these '+stages.length+' published drills in order. Select any stage to review it.';
 $('stageNav').innerHTML=stages.map((d,i)=>'<button type="button" data-stage="'+i+'"><span>STAGE '+(i+1)+'</span><strong>'+esc(d.title)+'</strong></button>').join('');
 const requested=Number(params.get('stage'));select(Number.isInteger(requested)&&requested>=1?Math.min(requested-1,stages.length-1):0);
}catch(error){showError(error.message)}
