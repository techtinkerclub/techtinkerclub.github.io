// Object deletion is scoped explicitly; preserve all other objects and timing.
export function removeObject(frames,id,index,scope='here'){
 if(!['here','onward','all'].includes(scope))throw Error('Unknown removal scope');
 let removed=0;
 const next=frames.map((frame,i)=>{
  if((scope==='here'&&i!==index)||(scope==='onward'&&i<index))return frame;
  if(!frame.objects.some(o=>o.id===id))return frame;
  const timing={...frame.timing};delete timing[id];removed++;
  return {...frame,objects:frame.objects.filter(o=>o.id!==id),timing};
 });
 return {frames:next,removed};
}
export function isEditingKeyTarget(target){
 return !!target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]');
}
