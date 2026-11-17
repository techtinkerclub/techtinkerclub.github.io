// Coach-directed continuation of a ruck. Never guess who gets the ball
// from distance or silently rewrite authored later steps.
import {assignPossession} from './possession.js?v=0.12.31';
import {ruckSide,contestWinner} from './ruck-outcome.js?v=0.12.33';

export function nextPlayPlayers(frame,marker){
 const winner=contestWinner(marker),members=new Set((marker?.members||[]).map(m=>m.id));
 if(!winner)return [];
 return (frame?.objects||[]).filter(o=>ruckSide(o)===winner&&!members.has(o.id));
}
export function nextPlayBalls(frame){
 return (frame?.objects||[]).filter(o=>o.type==='ball');
}
export function prepareRuckPlayAway(frame,markerId,playerId,ballId,g){
 const marker=frame?.objects?.find(o=>o.id===markerId),winner=contestWinner(marker);
 if(!marker||!winner||!['contest','secured'].includes(marker.breakdown?.phase))
  return {ok:false,message:'Choose a contest with a declared winning side first.'};
 const player=nextPlayPlayers(frame,marker).find(o=>o.id===playerId);
 if(!player)return {ok:false,message:'Choose a waiting player from the winning side.'};
 const ball=nextPlayBalls(frame).find(o=>o.id===ballId);
 if(!ball)return {ok:false,message:'Choose the rugby ball to be played in the next step.'};
 if(ball.ownerId===player.id)return {ok:false,message:'That player already has this ball; choose another action.'};
 const next=structuredClone(frame);
 next.name=(player.label||'Support player')+' plays ball away';
 next.seconds=2;
 next.notes='';
 next.paths={};
 next.timing={};
 const nextMarker=next.objects.find(o=>o.id===markerId);
 nextMarker.breakdown.phase='secured';
 nextMarker.label='Ball played away';
 // Callouts belong to a single authored step. The following action should
 // not inherit them, whether inserted here or edited later.
 delete nextMarker.breakdown.showWinnerLabel;
 delete nextMarker.breakdown.showNextPlayerLabel;
 delete nextMarker.breakdown.nextPlayerId;
 const originalOwner=ball.ownerId||null;
 const count=assignPossession([next],0,ball.id,player.id,g);
 if(count!==1)return {ok:false,message:'Unable to assign the selected ball to the player.'};
 const nextBall=next.objects.find(o=>o.id===ball.id);
 if(originalOwner&&originalOwner!==player.id){
  nextBall.transferKind='pass';
  next.timing[ball.id]={start:30,end:80};
 }else{
  delete nextBall.transferKind;
  next.timing[ball.id]={start:50,end:85};
 }
 return {ok:true,frame:next,message:'Created a new step: '+next.name+'. Check the ball timing and movement; the original step and later steps were not changed.'};
}
