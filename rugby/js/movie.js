// Video-only preferences. They never alter a drill or its share link.
export const MOVIE_QUALITIES={
 '720':{width:1280,height:720,bitrate:6000000,fps:30},
 '1080':{width:1920,height:1080,bitrate:14000000,fps:30},
 '2160':{width:3840,height:2160,bitrate:36000000,fps:30}
};
export function movieOptions(o={}){
 return {mode:o.mode==='single'?'single':'dual',quality:Object.hasOwn(MOVIE_QUALITIES,o.quality)?String(o.quality):'1080',replaySpeed:[.25,.5,.75].includes(Number(o.replaySpeed))?Number(o.replaySpeed):.5,format:o.format==='portrait'?'portrait':'landscape',notes:o.notes!==false,card:o.card===true,branchMode:o.branchMode==='selected'?'selected':'all',pauseCards:o.pauseCards!==false,introSeconds:[0,2,3,5].includes(Number(o.introSeconds))?Number(o.introSeconds):3,decisionSeconds:[3,5,8].includes(Number(o.decisionSeconds))?Number(o.decisionSeconds):8,choiceSeconds:[3,4,6].includes(Number(o.choiceSeconds))?Number(o.choiceSeconds):6};
}
export function moviePlan(seconds,options={}){
 if(!Number.isFinite(seconds)||seconds<=0)throw Error('Add at least one movement step before exporting a video.');
 const o=movieOptions(options),dual=o.mode==='dual',q=MOVIE_QUALITIES[o.quality];
 const segments=[{kind:'normal',speed:1,duration:seconds,intro:.6,outro:.7,runs:dual?false:options.runs!==false,passes:dual?false:options.passes!==false,title:dual?'1 / 2 · Normal speed':'Normal speed'}];
 if(dual)segments.push({kind:'replay',speed:o.replaySpeed,duration:seconds/o.replaySpeed,intro:1.2,outro:.8,runs:true,passes:true,title:'2 / 2 · Coaching replay · '+o.replaySpeed+'×'});
 let total=0;for(const s of segments){s.start=total;total+=s.intro+s.duration+s.outro;s.end=total}
 return {segments,total,seconds,quality:o.format==='portrait'?{...q,width:q.height,height:q.width}:q,options:o};
}
export function movieMoment(plan,elapsed){
 const t=Math.max(0,Math.min(plan.total,elapsed)),segment=plan.segments.find(s=>t<s.end)||plan.segments.at(-1),local=t-segment.start;
 return {segment,time:Math.max(0,Math.min(plan.seconds,(local-segment.intro)*segment.speed)),progress:t/plan.total,holding:local<segment.intro||local>=segment.intro+segment.duration};
}
// Compute an integer target raster, keeping the full pitch aspect ratio.
export function movieRaster(g,width,height){
 const scale=Math.min(width/g.viewWidth,height/g.viewHeight);
 return {width:Math.max(1,Math.floor(g.viewWidth*scale)),height:Math.max(1,Math.floor(g.viewHeight*scale))};
}
// Force SVG image decode at the actual output pixel dimensions; do not enlarge a low-res image.
export function rasterSVG(svg,w,h){
 return svg.replace(/(<svg\b[^>]*?)\swidth="[^"]*"\sheight="[^"]*"/,(_,prefix)=>prefix+' width="'+w+'" height="'+h+'"');
}

export function movieSettingsMarkup(prefix){
 const id=s=>prefix+s;
 const item=(condition,html)=>'<div class="movie-conditional" data-video-if="'+condition+'">'+html+'</div>';
 return '<fieldset class="movie-settings"><legend>Video settings</legend>'+
  item('decision','<label>Decision outcomes<select id="'+id('Branches')+'"><option value="all">Both outcomes · A then B</option><option value="selected">Currently selected outcome only</option></select></label>')+
  '<label>Playback<select id="'+id('Mode')+'"><option value="dual">Normal + slow coaching replay</option><option value="single">Normal speed only</option></select></label>'+
  item('replay','<label>Replay speed<select id="'+id('Speed')+'"><option value="0.25">0.25× · quarter speed</option><option value="0.5" selected>0.5× · half speed</option><option value="0.75">0.75×</option></select></label>')+
  '<label>Video camera<select id="'+id('Camera')+'"><option value="action">Action focus · frame each step</option><option value="follow">Follow action · smooth moving camera</option><option value="field">Whole pitch · fixed camera</option></select></label>'+
  '<label>Video format<select id="'+id('Format')+'"><option value="landscape">Landscape · 16:9</option><option value="portrait">Shorts / Reels · 9:16</option></select></label>'+
  '<label>Resolution<select id="'+id('Quality')+'"><option value="720">HD · 1280 × 720</option><option value="1080" selected>Full HD · 1920 × 1080</option><option value="2160">4K · 3840 × 2160</option></select></label>'+
  item('decision','<label class="movie-check"><input id="'+id('PauseCards')+'" type="checkbox" checked> Explain decisions and outcomes with pause cards</label>')+
  item('decision-pause','<label>Decision pause<select id="'+id('DecisionSeconds')+'"><option value="3">3 s</option><option value="5">5 s</option><option value="8" selected>8 s</option></select></label>')+
  item('decision-pause','<label>Option explanation<select id="'+id('ChoiceSeconds')+'"><option value="3">3 s</option><option value="4">4 s</option><option value="6" selected>6 s</option></select></label>')+
  item('story','<label>Drill introduction<select id="'+id('IntroSeconds')+'"><option value="0">None</option><option value="2">2 s</option><option value="3" selected>3 s</option><option value="5">5 s</option></select></label>')+
  '<label class="movie-check"><input id="'+id('Notes')+'" type="checkbox" checked> Show step coaching notes</label>'+
  '<label class="movie-check"><input id="'+id('Card')+'" type="checkbox"> Include full coaching card at end</label>'+
  '<small>Video format and resolution apply to the downloaded file. Coaching replay shows movement and ball paths.</small></fieldset>';
}
export function videoSettingVisibility(context={},mode='dual',pauseCards=true){
 const decision=context.hasDecision===true;
 return {decision,'decision-pause':decision&&pauseCards===true,
  replay:mode!=='single',story:context.story===true};
}
export function bindMovieSettings(root,prefix){
 root.innerHTML=movieSettingsMarkup(prefix);
 const get=s=>document.getElementById(prefix+s);
 let context={hasDecision:false,story:false};
 const sync=()=>{
  const visibility=videoSettingVisibility(context,get('Mode').value,get('PauseCards').checked);
  for(const wrapper of root.querySelectorAll('[data-video-if]')){
   const visible=visibility[wrapper.dataset.videoIf]===true;
   wrapper.hidden=!visible;
   for(const input of wrapper.querySelectorAll('input,select'))input.disabled=!visible;
  }
  const portrait=get('Format').value==='portrait';
  for(const q of get('Quality').options){
   const quality=MOVIE_QUALITIES[q.value];
   q.textContent=(q.value==='720'?'HD':q.value==='1080'?'Full HD':'4K')+' · '+
    (portrait?quality.height+' × '+quality.width:quality.width+' × '+quality.height);
  }
 };
 for(const name of ['Mode','Format','PauseCards'])get(name).addEventListener('change',sync);
 const read=()=>movieOptions({
  mode:get('Mode').value,replaySpeed:get('Speed').value,
  framing:get('Camera').value,
  quality:get('Quality').value,format:get('Format').value,
  notes:get('Notes').checked,card:get('Card').checked,
  branchMode:context.hasDecision?get('Branches').value:'all',
  pauseCards:context.hasDecision?get('PauseCards').checked:false,
  decisionSeconds:Number(get('DecisionSeconds').value),
  choiceSeconds:Number(get('ChoiceSeconds').value),
  introSeconds:context.story?Number(get('IntroSeconds').value):0
 });
 read.setContext=next=>{
  context={hasDecision:next?.hasDecision===true,story:next?.story===true};
  if(['field','action','follow'].includes(next?.framing))get('Camera').value=next.framing;
  sync();
 };
 read.setContext(context);
 return read;
}
