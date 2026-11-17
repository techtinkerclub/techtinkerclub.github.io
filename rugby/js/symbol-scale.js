// Nominal top-view dimensions in metres. Coaching mode magnifies glyphs only.
export const normalScaleMode = value => value === 'coaching' ? 'coaching' : 'realistic';
export const physicalUnit = g => Number.isFinite(g?.scale)&&g.scale>0 ? g.scale*0.45/30 : 1;
export const visualUnit = g => g?.displayMode==='coaching' ? Math.max(physicalUnit(g),0.80) : physicalUnit(g);
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
  case 'label':case 'decision': return [1,1];
 }
 if(mode==='coaching'){x=Math.max(x,.80);y=Math.max(y,.80)}
 return [x,y];
}
export function symbolTransform(o,g,pose){const [x,y]=symbolFactors(o,g,pose);return 'scale('+x+' '+y+')'}
export function symbolRadius(o,g,pose){const [x,y]=symbolFactors(o,g,pose);const base=o.type==='ladder'?[12,25]:o.type==='donut'?[o.donutState==='down'?23:10,23]:o.type==='sausage'?[29,9]:o.type==='bag'?[10,21]:o.type==='shieldItem'?[17,6]:o.type==='ball'?[10,6]:o.type==='cone'?[11,12]:pose==='grounded'?[12,23]:pose==='ready'?[23,24]:[16,20];return Math.max(base[0]*x,base[1]*y)}
export const labelOffset=(o,g,pose)=>o.type==='label'?4:Math.max(13,symbolRadius(o,g,pose)+11);
