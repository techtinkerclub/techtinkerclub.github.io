// Video-only storyboard. Every movement comes from the saved drill.
// Static cards explain the decision and reset between alternatives;
// no movement or rugby judgement is inferred by this planner.
import {hasOutcomes,outcomeViews} from './branching.js?v=2';
import {decisionTime} from './branching-visual.js?v=10';
import {drillDuration} from './scene.js?v=0.20.5';

const clean=(v,max=500)=>String(v??'').replace(/\s+/g,' ').trim().slice(0,max);
const seconds=(n,fallback,min=0,max=12)=>Number.isFinite(Number(n))?
 Math.max(min,Math.min(max,Number(n))):fallback;
export function movieStoryboard(source,opts={}){
 const drills=Array.isArray(source)?source:[source];
 if(!drills.length||drills.length>8)throw Error('Choose between 1 and 8 drills for a coaching video.');
 const intro=opts.pauseCards===false?0:seconds(opts.introSeconds,3,0,12);
 const decisionPause=opts.pauseCards===false?0:seconds(opts.decisionSeconds,8,0,15);
 const choicePause=opts.pauseCards===false?0:seconds(opts.choiceSeconds,6,0,15);
 const replay=opts.mode!=='single',replaySpeed=[.25,.5,.75].includes(Number(opts.replaySpeed))?
  Number(opts.replaySpeed):.5;
 const clips=[];
 const add=(clip,duration)=>{if(duration>.00001)clips.push({...clip,duration})};
 for(const [i,d] of drills.entries()){
  const total=drillDuration(d);
  if(total<=0)throw Error('Video stage '+(i+1)+' ('+clean(d.title,60)+') has no animated movement.');
  const stage=drills.length>1?'STAGE '+(i+1)+' / '+drills.length:'COACHING DRILL';
  const base={stage,title:clean(d.title,160),drill:d,index:i};
  add({...base,kind:'intro',at:0,heading:stage,body:clean(d.objective,420)||clean(d.instructions,420)||'Watch the setup, then follow the actions.'},intro);
  const makeMotion=(view,from,to,optionLabel='',pass='normal')=>{
   if(to-from<=.00001)return;
   const rate=pass==='replay'?replaySpeed:1;
   add({...base,kind:'motion',drill:view,from,to,speed:rate,pass,
    heading:optionLabel?(optionLabel+' · '+(pass==='replay'?'Coaching replay':'Normal speed')):(pass==='replay'?'Coaching replay':'Normal speed')},
    (to-from)/rate);
  };
  // Do not teleport a player from the end of an option to the fork (or
  // from the drill end to the start for a replay). Reverse the SAME saved
  // animation, clearly labelled as a rewind, before presenting a new option.
  // No newly invented movement or changes to the original drill are needed.
  const rewind=(view,from,to,heading='REWIND TO DECISION POINT')=>{
   if(from-to<=.00001)return;
   const duration=Math.max(1,Math.min(3,(from-to)/3));
   add({...base,kind:'rewind',drill:view,from,to,speed:(from-to)/duration,heading},duration);
  };
  if(!hasOutcomes(d)){
   makeMotion(d,0,total);
   if(replay){rewind(d,total,0,'REWIND FOR SLOW-MOTION REPLAY');makeMotion(d,0,total,'','replay');}
   continue;
  }
  const b=d.branching,fork=decisionTime(d),views=outcomeViews(d),ordered=opts.branchMode==='selected'?views.filter(v=>v.id===b.active):views;
  if(fork>.00001)makeMotion(d,0,fork,'Shared setup');
  add({...base,kind:'decision',at:fork,heading:'DECISION POINT · WATCH THE REACTION',
   body:clean(b.question,240)||'What does the player decide?',
   why:clean(b.context,500)||'See how the players respond before following either outcome.',
   watch:clean(b.watchFor,500)||'Watch the first reaction and how the players keep their spacing.'},decisionPause);
  let previousOption=null;
  for(const v of ordered){
   const choice=b.choices.find(q=>q.id===v.id),first=v.drill.frames[b.fork+1];
   const title='OPTION '+v.id.toUpperCase()+' · '+clean(v.label,140);
   // Each alternative must start from the very same frozen fork position.
   // Show the reverse journey instead of an unexplained snap backwards.
   if(previousOption)rewind(previousOption.drill,drillDuration(previousOption.drill),fork);
   add({...base,drill:v.drill,kind:'choice',at:fork,heading:title,
    body:clean(choice.explanation,500)||clean(first?.notes,420)||'Follow the movement shown in this option.',
    watch:clean(choice.watchFor,500)||'Watch the players nearest the ball and the space around them.'},choicePause);
   makeMotion(v.drill,fork,drillDuration(v.drill),title);
   if(replay){
    rewind(v.drill,drillDuration(v.drill),fork,'REWIND FOR SLOW-MOTION REPLAY');
    makeMotion(v.drill,fork,drillDuration(v.drill),title,'replay');
   }
   previousOption=v;
  }
 }
 let end=0;
 for(const clip of clips){clip.start=end;end+=clip.duration;clip.end=end}
 if(end>360)throw Error('This video is longer than six minutes. Reduce pause cards, use normal-speed-only or remove a drill.');
 return {clips,total:end,drills,replay};
}
export function storyboardClip(plan,at){
 return plan.clips.find(q=>at<q.end)||plan.clips.at(-1);
}
export function storyboardTime(clip,elapsed){
 const passed=Math.max(0,elapsed-clip.start);
 if(clip.kind==='motion')return Math.min(clip.to,clip.from+passed*clip.speed);
 if(clip.kind==='rewind')return Math.max(clip.to,clip.from-passed*clip.speed);
 return clip.at;
}
