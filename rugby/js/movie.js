// Movie-only preferences. They never alter a drill or its share link.
export const MOVIE_QUALITIES={
 '720':{width:1280,height:720,bitrate:6000000,fps:30},
 '1080':{width:1920,height:1080,bitrate:14000000,fps:30},
 '2160':{width:3840,height:2160,bitrate:36000000,fps:30}
};
export function movieOptions(o={}){
 return {mode:o.mode==='single'?'single':'dual',quality:Object.hasOwn(MOVIE_QUALITIES,o.quality)?String(o.quality):'1080',replaySpeed:[.25,.5,.75].includes(Number(o.replaySpeed))?Number(o.replaySpeed):.5};
}
export function moviePlan(seconds,options={}){
 if(!Number.isFinite(seconds)||seconds<=0)throw Error('Add at least one movement step before exporting a movie.');
 const o=movieOptions(options),dual=o.mode==='dual';
 const segments=[{kind:'normal',speed:1,duration:seconds,intro:.6,outro:.7,runs:dual?false:options.runs!==false,passes:dual?false:options.passes!==false,title:dual?'1 / 2 · Normal speed':'Normal speed'}];
 if(dual)segments.push({kind:'replay',speed:o.replaySpeed,duration:seconds/o.replaySpeed,intro:1.2,outro:.8,runs:true,passes:true,title:'2 / 2 · Coaching replay · '+o.replaySpeed+'×'});
 let total=0;for(const s of segments){s.start=total;total+=s.intro+s.duration+s.outro;s.end=total}
 return {segments,total,seconds,quality:MOVIE_QUALITIES[o.quality],options:o};
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
 return '<fieldset class="movie-settings"><legend>Movie settings</legend><label>Sequence<select id="'+prefix+'Mode"><option value="dual">Normal + slow coaching replay</option><option value="single">Normal speed only</option></select></label><label>Replay speed<select id="'+prefix+'Speed"><option value="0.25">0.25× · quarter speed</option><option value="0.5" selected>0.5× · half speed</option><option value="0.75">0.75×</option></select></label><label>Resolution<select id="'+prefix+'Quality"><option value="720">HD · 1280 × 720</option><option value="1080" selected>Full HD · 1920 × 1080</option><option value="2160">4K · 3840 × 2160</option></select></label><small>First viewing: no paths. Replay: runs and passes visible. Single viewing uses your selected overlays.</small></fieldset>';
}
export function bindMovieSettings(root,prefix){
 root.innerHTML=movieSettingsMarkup(prefix);
 const get=s=>document.getElementById(prefix+s),sync=()=>{get('Speed').disabled=get('Mode').value==='single'};
 get('Mode').onchange=sync;sync();
 return ()=>movieOptions({mode:get('Mode').value,replaySpeed:get('Speed').value,quality:get('Quality').value});
}
