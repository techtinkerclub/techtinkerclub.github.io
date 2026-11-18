// A reusable, literal visual map of TWO real, coach-authored outcomes.
// Used by both editors, both read-only players and the printed coaching pack.
// It visualises saved ball/player trajectories; it does not invent tactical decisions.
import {stepEndSeconds} from './step-timeline.js?v=1';
import {esc} from './model.js?v=0.13.4';
import {hasOutcomes,outcomeViews} from './branching.js?v=2';
import {playbackData,renderScene} from './scene.js?v=0.20.8';
import {movementFor,frameObjects} from './possession.js?v=0.12.31';
import {routeSamples,routeSVG} from './routes.js?v=0.4.3';
const ACTIVE=new Set(['coach','attacker','defender','neutral','shield','bagplayer','ball']);
const COLOURS={attack:'#73d5ff',defence:'#ffbc7d',ball:'#ffe27e'};
const colour=o=>o.type==='ball'?COLOURS.ball:['defender','bagplayer'].includes(o.type)?COLOURS.defence:COLOURS.attack;
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const round=n=>Number(n).toFixed(1);

export function decisionTime(d){
 if(!hasOutcomes(d))return null;
 return stepEndSeconds(d,d.branching.fork);
}
export function decisionReached(d,from,to,resolved=false){
 const at=decisionTime(d);
 return at!==null&&!resolved&&Number.isFinite(from)&&Number.isFinite(to)&&from<=at+1e-7&&to>=at-1e-7;
}
export function outcomePreviewSVG(raw,id,options={}){
 if(!hasOutcomes(raw))return '';
 const entry=outcomeViews(raw).find(c=>c.id===id);
 if(!entry)throw Error('Unknown decision outcome.');
 const d=playbackData(entry.drill),fork=raw.branching.fork;
 const scene=renderScene(d,{index:fork,runs:false,passes:false,decisions:false,labels:true,markups:true,scaleMode:'coaching',cartoonMode:options.cartoonMode===true,prefix:'branch-'+id});
 const g=scene.g,arrow='branch-'+id+'-route-arrow';
 let paths='',endpoints='';
 for(let i=fork+1;i<d.frames.length;i++){
  const old=d.frames[i-1],next=d.frames[i];
  for(const o of next.objects){
   if(!ACTIVE.has(o.type))continue;
   const m=movementFor(old,next,o,g),route=next.paths?.[o.id];
   if(!m||m.instant||m.turnover||m.presentation)continue;
   if(length(g.toView(m.start.x,m.start.y),g.toView(m.end.x,m.end.y))<3&&!route?.points?.length)continue;
   const path=routeSVG(routeSamples(m.start,m.end,route,g)),stroke=colour(o),ball=o.type==='ball';
   paths+='<path d="'+path+'" fill="none" stroke="#102c26" stroke-opacity=".6" stroke-width="'+(ball?7:6)+'"/>'+
     '<path d="'+path+'" fill="none" stroke="'+stroke+'" stroke-width="'+(ball?3.8:3)+'" opacity="'+(ball?'.98':'.83')+'"'+(ball?' stroke-dasharray="9 5"':'')+' marker-end="url(#'+arrow+')"/>';
  }
 }
 const last=frameObjects(d.frames.at(-1),g);
 for(const o of last){
  if(!ACTIVE.has(o.type))continue;
  const initial=d.frames[fork].objects.find(v=>v.id===o.id);
  if(!initial||length(g.toView(initial.x,initial.y),g.toView(o.x,o.y))<10)continue;
  const point=g.toView(o.x,o.y),ball=o.type==='ball';
  endpoints+='<circle cx="'+round(point.x)+'" cy="'+round(point.y)+'" r="'+(ball?9:7)+'" fill="none" stroke="'+colour(o)+'" stroke-width="3" stroke-dasharray="'+(ball?'2 2':'none')+'"/>';
 }
 const overlay='<defs><marker id="'+arrow+'" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#f6f9f0"/></marker></defs>'+
  '<g aria-hidden="true" pointer-events="none">'+paths+endpoints+'</g>';
 return scene.svg.replace('</svg>',overlay+'</svg>').replace(/\swidth="[^"]+"\sheight="[^"]+"/,' width="100%" style="height:auto;display:block"');
}
export function outcomeCardsMarkup(raw,mode='choose',options={}){
 if(!hasOutcomes(raw))return '';
 const views=outcomeViews(raw),b=raw.branching;
 return '<div class="branch-preview-grid">'+views.map(entry=>{
  const label=esc(entry.label),steps=entry.drill.frames.slice(b.fork+1);
  const sequence=steps.map(s=>s.name).filter(Boolean).slice(0,4).join(' → ');
  const option=raw.branching.choices.find(c=>c.id===entry.id),tip=String(option?.watchFor||option?.explanation||'').trim();
  const svg=outcomePreviewSVG(raw,entry.id,options),selected=raw.branching.active===entry.id;
  const content='<span class="branch-preview-title"><strong>OPTION '+entry.id.toUpperCase()+' · '+label+'</strong><small>'+steps.length+' animated step'+(steps.length===1?'':'s')+'</small></span>'+
    '<span class="branch-preview-pitch">'+svg+'</span>'+
    '<span class="branch-preview-summary">'+esc(tip||sequence||'Create the movement for this option')+'</span>'+
    (mode==='print'?'':'<span class="branch-preview-action">'+(mode==='edit'?'Open this outcome for editing':'Continue with this outcome')+'</span>');
  return mode==='print'?'<div class="branch-preview-card branch-print-card">'+content+'</div>':
   '<button type="button" class="branch-preview-card'+(selected?' is-active':'')+'" data-branch-choice="'+entry.id+'" aria-label="'+(mode==='edit'?'Edit ':'Play ')+'option '+entry.id.toUpperCase()+': '+label+'">'+content+'</button>';
 }).join('')+'</div><p class="branch-preview-legend"><span class="branch-legend-attack">●</span> Attacking run <span class="branch-legend-defence">●</span> Defenders <span class="branch-legend-ball">●</span> Ball movement · circles show end positions</p>';
}
