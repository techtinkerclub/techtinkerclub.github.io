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

// Cancel a planned run in a single step, without deleting the player.
// Routes belong to the destination step: restore that player's position from
// the preceding step and drop only this movement's path and timing.
const RUN_PLAYER_TYPES=new Set(['attacker','defender','neutral','coach','shield','bagplayer']);
export function resetStepMovement(frames,index,id){
 if(!Array.isArray(frames)||!Number.isInteger(index)||index<=0||index>=frames.length)
  return {ok:false,message:'Select a step after the initial setup to remove movement.'};
 const current=frames[index],previous=frames[index-1];
 const player=current.objects?.find(o=>o.id===id),start=previous.objects?.find(o=>o.id===id);
 if(!player||!start)return {ok:false,message:'This player has no starting position in the previous step.'};
 const simpleBall=player.type==='ball'&&!player.ownerId&&!start.ownerId&&!player.transferKind;
 if(!RUN_PLAYER_TYPES.has(player.type)&&!simpleBall)
  return {ok:false,message:'This movement is part of a ball transfer or equipment action. Edit that action separately; the object has not been deleted.'};
 const changedPosition=Math.hypot(player.x-start.x,player.y-start.y)>1e-6;
 const hasRoute=Object.hasOwn(current.paths||{},id);
 const hasTiming=Object.hasOwn(current.timing||{},id);
 if(!changedPosition&&!hasRoute&&!hasTiming)
  return {ok:false,message:'No movement to remove in this step.'};
 const paths={...(current.paths||{})},timing={...(current.timing||{})};
 delete paths[id];delete timing[id];
 const frame={...current,
  objects:current.objects.map(o=>o.id===id?{...o,x:start.x,y:start.y}:o),
  paths,timing
 };
 const result=frames.slice();result[index]=frame;
 return {ok:true,frames:result,playerId:id,changedPosition};
}
