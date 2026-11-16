// Shared native modal; the export remains in the current tab.
export function createExportProgress(doc=document,win=window){
 const modal=doc.createElement('dialog');modal.id='movieProgressDialog';modal.setAttribute('aria-labelledby','movieProgressTitle');
 modal.innerHTML='<h2 id="movieProgressTitle">Exporting movie</h2><p id="movieProgressStage" role="status">Preparing video…</p><div class="movie-progress-row"><progress id="movieProgressBar" max="100" aria-label="Movie export progress"></progress><strong id="movieProgressPercent">—</strong></div><p id="movieProgressHint">Keep this tab open and visible while the video is being created.</p><div class="movie-progress-actions"><button id="movieProgressCancel" type="button">Cancel export</button><button id="movieProgressClose" type="button" hidden>Close</button></div>';
 doc.body.append(modal);const $=id=>doc.getElementById(id),title=$('movieProgressTitle'),stage=$('movieProgressStage'),bar=$('movieProgressBar'),percent=$('movieProgressPercent'),hint=$('movieProgressHint'),cancel=$('movieProgressCancel'),close=$('movieProgressClose');
 let active=false,controller=null;
 const guard=e=>{if(active){e.preventDefault();e.returnValue=''}};
 win.addEventListener('beforeunload',guard);
 modal.addEventListener('cancel',e=>{if(active)e.preventDefault()});
 cancel.onclick=()=>{if(!active||!controller)return;controller.abort();cancel.disabled=true;stage.textContent='Cancelling export…';hint.textContent='No partial movie will be downloaded.'};
 close.onclick=()=>{if(!active)modal.close()};
 function update(p,label){if(!active||controller.signal.aborted)return;const n=Number(p);if(Number.isFinite(n)){const value=Math.min(99,Math.max(0,Math.floor(n*100)));bar.value=value;percent.textContent=value+'%'}if(label)stage.textContent=label}
 async function run(task){
  if(active)return null;
  controller=new AbortController();active=true;modal.dataset.state='working';title.textContent='Exporting movie';stage.textContent='Preparing video…';bar.removeAttribute('value');percent.textContent='—';hint.textContent='Keep this tab open and visible. Recording runs in real time.';cancel.hidden=false;cancel.disabled=false;close.hidden=true;modal.showModal();
  try{
   const result=await task(update,controller.signal);if(controller.signal.aborted)throw new DOMException('Export cancelled','AbortError');
   modal.dataset.state='success';title.textContent='Movie exported';stage.textContent=result.width+' × '+result.height+' · '+result.extension.toUpperCase();bar.value=100;percent.textContent='100%';hint.textContent='Video created. Check your browser downloads for the file.';return result;
  }catch(error){
   const stopped=controller.signal.aborted||error?.name==='AbortError';modal.dataset.state=stopped?'cancelled':'error';title.textContent=stopped?'Export cancelled':'Export failed';stage.textContent=stopped?'No movie downloaded.':String(error?.message||error);hint.textContent=stopped?'You can change settings and export again.':'Your drill is unchanged. Close this window and try again.';return null;
  }finally{active=false;controller=null;cancel.hidden=true;close.hidden=false;close.focus()}
 }
 return {run,get active(){return active}};
}
