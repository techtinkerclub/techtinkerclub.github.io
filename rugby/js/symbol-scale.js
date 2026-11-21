// Nominal top-view dimensions in metres. Coaching view is an illustrative
// size mode, not an actual-size pitch measurement. Maintain shape proportions
// and modest minima on full-sized fields (rather than blowing up every shape).
export const COACHING_MAGNIFICATION = 1.30;
const MIN_COACHING_FACTOR = 0.80;
// The old universal floor of 1.05 made a 20 cm cone almost as big as a player
// and overwhelmed a 20 × 15 m training area when zoomed in. Use symbol-specific
// minima, preserving relative visual weight and contact-shape proportions.
const FIELD_COACH_MINIMUM = Object.freeze({
 player:.29,ball:.18,cone:.17,flag:.19,shieldItem:.24,
 bag:.23,sausage:.24,donut:.25,ladder:.24,hurdle:.23,hoop:.23,slalomPole:.18,markerDisc:.16,other:.22
});
function fullFieldMinimum(o){
 if(playerTypes.has(o?.type))return FIELD_COACH_MINIMUM.player;
 return FIELD_COACH_MINIMUM[o?.type]??FIELD_COACH_MINIMUM.other;
}
export const normalScaleMode = value => value === 'coaching' ? 'coaching' : 'realistic';
export const physicalUnit = g => Number.isFinite(g?.scale)&&g.scale>0 ? g.scale*0.45/30 : 1;
export const visualUnit = g => g?.displayMode==='coaching' ? Math.max(physicalUnit(g)*COACHING_MAGNIFICATION,g?.fieldContext?.mode==='field'?FIELD_COACH_MINIMUM.player:MIN_COACHING_FACTOR) : physicalUnit(g);
const playerTypes=new Set(['attacker','defender','neutral','coach','shield','bagplayer']);
export function symbolFactors(o,g,pose){
 const k=Number.isFinite(g?.scale)&&g.scale>0?g.scale:30/0.45, u=physicalUnit(g), mode=normalScaleMode(g?.displayMode);
 let x=u,y=u;
 if(playerTypes.has(o.type)){
  if(pose==='grounded'){x=.40*k/24;y=1.10*k/46}
 }else switch(o.type){
  case 'ball': x=.25*k/20;y=.15*k/11.6;break;
  case 'cone': x=.20*k/22;y=.20*k/22;break;
  case 'flag': x=.24*k/18;y=.24*k/29;break;
  case 'shieldItem': x=.40*k/34;y=.20*k/12;break;
  case 'bag': x=.40*k/20;y=.40*k/42;break;
  case 'sausage': x=1.25*k/58;y=.35*k/18;break;
  case 'donut': x=.75*k/(o.donutState==='down'?46:20);y=.75*k/46;if(o.donutState!=='down')x=.30*k/20;break;
  case 'ladder': x=.45*k/24;y=4*k/50;break;
  case 'hurdle': x=.55*k/50;y=.30*k/28;break;
  case 'hoop': x=.55*k/48;y=.55*k/34;break;
  case 'slalomPole': x=.12*k/24;y=.60*k/54;break; // schematic upright equipment marker
  case 'markerDisc': x=.20*k/36;y=.20*k/24;break;
  case 'label':case 'decision': return [1,1];
 }
 if(mode==='coaching'){
  // At full-field scale, a single universal minimum would erase distinctions
  // between players, cones and balls. Use a modest floor for each shape.
  const minimum=g?.fieldContext?.mode==='field'?fullFieldMinimum(o):MIN_COACHING_FACTOR;
  x=Math.max(x*COACHING_MAGNIFICATION,minimum);
  y=Math.max(y*COACHING_MAGNIFICATION,minimum);
 }
 return [x,y];
}
export function symbolTransform(o,g,pose){const [x,y]=symbolFactors(o,g,pose);return 'scale('+x+' '+y+')'}
export function symbolRadius(o,g,pose){const [x,y]=symbolFactors(o,g,pose);const base=o.type==='hoop'?[24,17]:o.type==='hurdle'?[25,15]:o.type==='slalomPole'?[12,27]:o.type==='markerDisc'?[18,12]:o.type==='ladder'?[12,25]:o.type==='donut'?[o.donutState==='down'?23:10,23]:o.type==='sausage'?[29,9]:o.type==='bag'?[10,21]:o.type==='shieldItem'?[17,6]:o.type==='ball'?[10,6]:o.type==='cone'?[11,12]:pose==='grounded'?[12,23]:pose==='ready'?[22,15]:[16,20];return Math.max(base[0]*x,base[1]*y)}
export const symbolLabelSize = g => g?.fieldContext?.mode==='field'?10:13;
// Text is aligned by its visible glyph box, not by its SVG baseline.
// Reserve the same six-pixel gap from the true sprite edge on both sides of
// the pitch, regardless of team colour or heading.
const captionAscent = g => symbolLabelSize(g)*.78*(Number(g?.annotationScale)||1);
const captionGap = g => (g?.fieldContext?.mode==='field'?6:7)*(Number(g?.annotationScale)||1);
export const labelOffset=(o,g,pose)=>o.type==='label'?4:symbolRadius(o,g,pose)+captionAscent(g)+captionGap(g);
// A player's arrow points forward (local -Y); put the caption behind their
// facing direction (local +Y) while keeping text horizontally readable.
// Other equipment retains its simple lower caption.
// The coach name stays a screen-readable caption rather than rotating with the body.
// Keep it below the full sprite (or above if near the pitch's lower edge).
function coachCaptionPosition(o,g,cartoon=false){
 // Use the actual object anchor and SVG viewport, not the training pitch width:
 // clamping to an offset training area made the coach's label drift sideways.
 const at=g.toView(o.x,o.y),[sx,sy]=symbolFactors(o,g);
 const extent=(cartoon?39:20)*Math.max(sx,sy),size=symbolLabelSize(g);
 const vw=Number(g.viewWidth)||900,vh=Number(g.viewHeight)||540;
 const halfLabel=Math.max(23,String(o.label||'Coach').length*size*.33);
 const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
 const below=at.y+extent+size+4,above=at.y-extent-5;
 // Keep the coach's name on the pitch near its lower edge; this check is
 // vertical only, so an offset training area cannot push the name sideways.
 const top=Math.max(size+5,(Number(g.margin)||0)+size+5);
 const bottom=Math.min(vh-5,(Number(g.margin)||0)+(Number(g.fh)||vh)-7);
 const baseline=below<=bottom?below:above>=top?above:clamp(below,top,Math.max(top,bottom));
 return {x:clamp(at.x,halfLabel+4,Math.max(halfLabel+4,vw-halfLabel-4))-at.x,
  y:baseline-at.y};
}
function playerCaptionPosition(o,g,pose,cartoon=false){
 const angle=((Number(o.rot)||0)+(Number(g.rotation)||0))*Math.PI/180;
 const backX=-Math.sin(angle),backY=Math.cos(angle);
 let distance=labelOffset(o,g,pose);
 if(cartoon){
  const [sx,sy]=symbolFactors(o,g,pose);
  distance+=Math.max(0,27*Math.max(sx,sy)-symbolRadius(o,g,pose));
 }
 // Above the sprite the text baseline is its nearest edge; below the sprite
 // the baseline is one glyph ascent below the nearest edge.
 const desired={x:backX*distance,y:backY*distance+captionAscent(g)*Math.max(0,-backY)};
 const at=g.toView(o.x,o.y),margin=g.margin||0;
 const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
 return {x:clamp(at.x+desired.x,margin+7,margin+g.fw-7)-at.x,
  y:clamp(at.y+desired.y,margin+captionAscent(g)+captionGap(g),margin+g.fh-7)-at.y};
}
export function labelPosition(o,g,pose){
 if(o?.type==='coach')return coachCaptionPosition(o,g);
 if(!playerTypes.has(o?.type))return {x:0,y:labelOffset(o,g,pose)};
 return playerCaptionPosition(o,g,pose);
}
// Minion captions follow EXACTLY the same side and body direction as Classic.
// The image atlas is slightly larger than the schematic circle, so increase
// the distance only by the additional visible footprint, never switch sides.
export function cartoonLabelPosition(o,g,pose){
 if(o?.type==='coach')return coachCaptionPosition(o,g,true);
 if(!playerTypes.has(o?.type))return labelPosition(o,g,pose);
 return playerCaptionPosition(o,g,pose,true);
}
