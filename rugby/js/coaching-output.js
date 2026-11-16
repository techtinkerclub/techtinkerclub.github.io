// A shared schema for video, read-only presentation and print. No editor-only state.
import {esc} from './model.js?v=0.5.3';
import {decisionList,decisionData} from './training.js?v=0.8.0';
export function decisionMarkup(f){return decisionList(f).map(o=>{const d=decisionData(o.decision);return '<div class="decision-note"><strong>◆ '+esc(o.label)+'</strong><p>'+esc(d.question)+'</p><p>'+esc(d.cue)+'</p>'+d.options.map((q,i)=>'<p>'+String.fromCharCode(65+i)+' · '+esc(q.label)+(q.kind==='main'?' (demonstrated)':' (alternative)')+'</p>').join('')+'</div>'}).join('')}
export const CARD_FIELDS=[['objective','Learning objective'],['players','Players & organisation'],['equipment','Equipment & materials'],['instructions','How to run the drill'],['coaching','Technical coaching points'],['safety','Safety & law notes'],['regression','Make it easier'],['progression','Make it harder'],['questions','Questions for players'],['notes','Additional coaching notes']];
export function cardAge(d){return d.ageMin===d.ageMax?'U'+d.ageMin:'U'+d.ageMin+'–U'+d.ageMax}
export function cardMeta(d){return [cardAge(d),d.length+' × '+d.width+' m',d.minutes?d.minutes+' min':null,d.category||null].filter(Boolean).join(' · ')}
export function cardEntries(d){return CARD_FIELDS.map(([key,label])=>({key,label,value:String(d[key]||'').trim()})).filter(x=>x.value)}
export function cardLinks(d){return (Array.isArray(d.links)?d.links:[]).filter(x=>x&&typeof x.url==='string'&&/^https?:\/\/[^\s]+$/i.test(x.url)).slice(0,30).map(x=>({label:String(x.label||x.url).slice(0,200),url:x.url.slice(0,2000),kind:String(x.kind||'Reference').slice(0,80)}))}
export function coachingMarkup(d){const items=cardEntries(d),links=cardLinks(d);return '<p class="coach-meta">'+esc(cardMeta(d))+'</p><div class="coach-fields">'+(items.length?items.map(x=>'<section class="coach-field"><h3>'+esc(x.label)+'</h3><p>'+esc(x.value)+'</p></section>').join(''):'<p>No coaching card notes have been added yet.</p>')+'</div>'+(links.length?'<section class="coach-links"><h3>References</h3>'+links.map(x=>'<p><a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">'+esc(x.label)+'</a><small> '+esc(x.kind)+'</small></p>').join('')+'</section>':'')}
export function sequenceMarkup(d){return d.frames.map((f,i)=>'<article class="coach-sequence-row"><h3>'+String(i+1).padStart(2,'0')+' · '+esc(f.name)+'</h3><p>'+esc(f.notes||'No step note added.')+'</p>'+decisionMarkup(f)+'<button data-jump-step="'+i+'">View step</button></article>').join('')}
// Canvas text wrapping, including long unbroken words, respecting explicit paragraph breaks.
export function wrapCanvas(ctx,value,maxWidth){
 const lines=[];for(const paragraph of String(value||'').split(/\r?\n/)){let line='';for(const word of paragraph.trim().split(/\s+/).filter(Boolean)){
  if(ctx.measureText((line?line+' ':'')+word).width<=maxWidth){line+=(line?' ':'')+word;continue}
  if(line){lines.push(line);line=''}
  let chunk='';for(const c of word){if(chunk&&ctx.measureText(chunk+c).width>maxWidth){lines.push(chunk);chunk=''}chunk+=c}line=chunk
 }lines.push(line)}return lines
}
export function noteLines(ctx,value,width,maxLines){const all=wrapCanvas(ctx,value,width);if(all.length<=maxLines)return all;const out=all.slice(0,maxLines);let last=out.at(-1);const suffix=' …';while(last&&ctx.measureText(last+suffix).width>width)last=last.slice(0,-1);out[out.length-1]=last+suffix;return out}
