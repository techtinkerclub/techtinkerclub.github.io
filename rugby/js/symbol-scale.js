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
export const labelOffset=(o,g,pose)=>o.type==='label'?4:g?.fieldContext?.mode==='field'?Math.max(9,symbolRadius(o,g,pose)+5):Math.max(13,symbolRadius(o,g,pose)+11);
// A player's arrow points forward (local -Y); put the caption behind their
// facing direction (local +Y) while keeping text horizontally readable.
// Other equipment retains its simple lower caption.
export function labelPosition(o,g,pose){
 const distance=labelOffset(o,g,pose);
 if(!playerTypes.has(o?.type))return {x:0,y:distance};
 const angle=((Number(o.rot)||0)+(Number(g.rotation)||0))*Math.PI/180;
 // SVG text uses its bottom baseline by default. Above a player, that
 // puts the whole 13px caption another ~10px away from the shirt; below a
 // player, the glyphs sit 10px ABOVE the baseline and look much closer.
 // Compensate only for the upward-facing placement so the visible gaps match.
 const behindY=Math.cos(angle);
 const desired={x:-Math.sin(angle)*distance,y:behindY*distance+(g?.fieldContext?.mode==='field'?7.5:10)*Math.max(0,-behindY)};
 // Keep the caption anchor inside the playing field at pitch edges.
 const at=g.toView(o.x,o.y),margin=g.margin||0;
 const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
 return {x:clamp(at.x+desired.x,margin+7,margin+g.fw-7)-at.x,
  y:clamp(at.y+desired.y,margin+10,margin+g.fh-7)-at.y};
}

// Minion artwork is an image atlas whose visible silhouette is much wider than
// Classic's symbol radius. Place labels clear BELOW the entire sprite, not
// "behind" the player (which overlaps goggles in rotated/side-on poses).
// Prefer above only when the bottom of the field cannot accommodate a caption.
export function cartoonLabelPosition(o,g,pose){
 const [sx,sy]=symbolFactors(o,g,pose==='grounded'?'grounded':'standing');
 // The original 54px sprite cell rotates inside its own SVG; allow for the
 // diagonal bounding box, separately from the unscaled text label.
 const extent=38*Math.max(sx,sy);
 const gap=7,baseline=extent+gap+symbolLabelSize(g);
 const q=g.toView(o.x,o.y),margin=g.margin||0;
 const fieldBottom=margin+g.fh,fieldTop=margin;
 const below=q.y+baseline<=fieldBottom-4;
 const y=below?baseline:-extent-gap;
 return {x:Math.max(margin+12,Math.min(q.x,margin+g.fw-12))-q.x,
  y:Math.max(fieldTop+symbolLabelSize(g),Math.min(q.y+y,fieldBottom-4))-q.y};
}
