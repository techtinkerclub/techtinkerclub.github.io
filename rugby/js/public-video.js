import {recordDrill,saveBlob,outputName,printProgression} from './outputs.js?v=0.20.37';
import {bindMovieSettings} from './movie.js?v=0.18.4';
import {createExportProgress} from './export-progress.js?v=0.18.3';
import {playbackData} from './scene.js?v=0.20.37';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Uses only the published catalogue. No editable drill or GitHub write access.
export function publicVideoBuilder({getDrills,isAnimated,ageLabel,onChange}){
 const ids=[],get=id=>document.getElementById(id);
 const button=document.createElement('button');button.id='videoOpen';button.type='button';button.textContent='Create video';
 document.querySelector('.header-row').insertBefore(button,get('shareLibrary'));
 const dialog=document.createElement('dialog');dialog.id='videoBuilder';dialog.className='video-builder';
 dialog.innerHTML='<div class="video-heading"><div><h2>Create coaching video</h2><p>Combine up to eight published animated drills. Each keeps its own pitch, timings, notes and decision outcomes.</p></div><button type="button" id="videoClose">Close</button></div>'+
 '<label class="video-field">Video title<input id="videoTitle" maxlength="160" placeholder="Defensive line progression"></label>'+
 '<div class="video-row"><h3>Stages in order</h3><button type="button" id="videoClear">Clear all</button></div>'+
 '<ol id="videoStages"></ol><p id="videoHint" role="status"></p>'+
 '<label class="video-field">Add published drill<select id="videoPick"><option value="">Choose another drill…</option></select></label>'+
 '<button type="button" id="videoAdd">Add drill</button>'+
 '<div class="video-row"><button type="button" id="videoPresent">Open linked presentation</button><button type="button" id="videoLink">Copy presentation link</button><button type="button" id="videoPrint">Print progression pack</button></div>'+
 '<details class="video-details"><summary>Video settings</summary><div id="publicMovieOptions"></div><label class="video-field">Character style <select id="publicVideoStyle" aria-label="Video character style"><option value="classic">Classic coaching</option><option value="minion">Minion Mode · playful sprites and video cards</option></select></label></details>'+
 '<div class="video-row video-footer"><p id="videoStatus" role="status"></p><button type="button" id="videoExport">Export video</button></div>'+
 '<small>The video downloads to your device. Keep this tab visible while recording. Your drills and public library remain unchanged.</small>';
 document.body.append(dialog);
 const settings=bindMovieSettings(get('publicMovieOptions'),'publicMovie'),progress=createExportProgress();
 let busy=false;
 const eligible=()=>getDrills().filter(d=>isAnimated(d)&&d.frames?.length>1);
 const selected=()=>ids.map(id=>eligible().find(d=>d.id===id)).filter(Boolean);
 function render(){
  const stages=selected();
  get('videoStages').innerHTML=stages.map((d,i)=>'<li><b class="video-number">'+(i+1)+'</b><span class="video-stage-title"><strong>'+esc(d.title)+'</strong><small>'+esc(ageLabel(d))+' · '+d.frames.length+' steps</small></span><span class="video-stage-controls"><button data-video-move="up" data-index="'+i+'" aria-label="Move earlier" '+(!i?'disabled':'')+'>↑</button><button data-video-move="down" data-index="'+i+'" aria-label="Move later" '+(i===stages.length-1?'disabled':'')+'>↓</button><button data-video-move="remove" data-index="'+i+'" aria-label="Remove stage">×</button></span></li>').join('');
  get('videoHint').textContent=stages.length?stages.length+' of 8 selected · each stage plays in order.':'Select an animated drill to get started.';
  button.textContent=stages.length?'Create video ('+stages.length+')':'Create video';
  get('videoPick').innerHTML='<option value="">Choose another drill…</option>'+eligible().filter(d=>!ids.includes(d.id)).map(d=>'<option value="'+esc(d.id)+'">'+esc(d.title)+' · '+esc(ageLabel(d))+'</option>').join('');
  get('videoExport').disabled=busy||!stages.length;
  for(const id of ['videoPresent','videoLink','videoPrint'])get(id).disabled=busy||!stages.length;
  get('videoClear').disabled=busy||!stages.length;get('videoClose').disabled=busy;
  get('videoAdd').disabled=busy||ids.length>=8;
  for(const b of get('videoStages').querySelectorAll('button'))b.disabled=busy||b.disabled;
  onChange();
 }
 function add(id){
  if(!eligible().some(d=>d.id===id)||ids.includes(id))return;
  if(ids.length>=8){get('videoStatus').textContent='Maximum eight drills per video.';return}
  ids.push(id);if(ids.length===1)get('videoTitle').value=eligible().find(d=>d.id===id).title;
  get('videoStatus').textContent='';render();
 }
 button.onclick=()=>{render();dialog.showModal()};
 get('videoClose').onclick=()=>{if(!busy)dialog.close()};
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault()});
 get('videoAdd').onclick=()=>add(get('videoPick').value);
 get('videoClear').onclick=()=>{if(busy)return;ids.length=0;get('videoTitle').value='';get('videoStatus').textContent='';render()};
 get('videoStages').onclick=e=>{
  const b=e.target.closest('[data-video-move]');if(!b||busy)return;
  const i=Number(b.dataset.index),action=b.dataset.videoMove;
  if(!Number.isInteger(i)||i<0||i>=ids.length)return;
  if(action==='remove')ids.splice(i,1);
  if(action==='up'&&i>0)[ids[i-1],ids[i]]=[ids[i],ids[i-1]];
  if(action==='down'&&i<ids.length-1)[ids[i+1],ids[i]]=[ids[i],ids[i+1]];
  render();
 };
 const progressionUrl=()=>{
  const url=new URL('./sequence.html',location.href);url.searchParams.set('drills',ids.join(','));if(get('publicVideoStyle').value==='minion')url.searchParams.set('style','minion');return url.href;
 };
 get('videoPresent').onclick=()=>{if(!ids.length||busy)return;window.open(progressionUrl(),'_blank','noopener')};
 get('videoLink').onclick=async()=>{
  if(!ids.length||busy)return;
  const link=progressionUrl();
  try{await navigator.clipboard.writeText(link);get('videoStatus').textContent='Linked presentation copied. Recipients see published updates through the same link.'}
  catch{window.prompt('Copy the read-only progression link',link)}
 };
 get('videoPrint').onclick=()=>{
  if(!ids.length||busy)return;
  const stages=selected().map(playbackData),title=get('videoTitle').value.trim()||stages[0].title;
  dialog.close();printProgression(stages,title,{scaleMode:'coaching',framing:'action',decisions:true,markups:true});
 };
 get('videoExport').onclick=async()=>{
  if(busy||!ids.length)return;busy=true;render();get('videoStatus').textContent='';
  try{
   const stages=selected().map(playbackData),title=get('videoTitle').value.trim()||stages[0].title;
   const options={...settings(),cartoonMode:get('publicVideoStyle').value==='minion',sequenceDrills:stages,movieTitle:title,scaleMode:'coaching',framing:'action',labels:true,decisions:true,teachingGuides:true,markups:true};
   const file=await progress.run(async(update,signal)=>{
    const video=await recordDrill(stages[0],options,update,signal);
    if(!signal.aborted)saveBlob(video.blob,outputName({title})+'.'+video.extension);
    return video;
   });
   get('videoStatus').textContent=file?'Video exported · '+file.width+' × '+file.height+' · '+file.extension.toUpperCase():'Export not completed. See the export status.';
  }catch(err){get('videoStatus').textContent='Export failed: '+err.message}
  finally{busy=false;render()}
 };
 return {add(id){add(id);if(!dialog.open)dialog.showModal()},has:id=>ids.includes(id),full:()=>ids.length>=8||busy};
}
