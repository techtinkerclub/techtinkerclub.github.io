// Text annotations are overlays, not moving players. The same SVG is used in
// editing, playback, printed coaching sheets and rendered movie frames.
const color=(value,fallback)=>typeof value==='string'&&/^#[0-9a-fA-F]{6}$/.test(value)?value.toLowerCase():fallback;
const number=(v,fallback,min,max)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
export const DEFAULT_TEXT_STYLE=Object.freeze({fontSize:16,color:'#ffffff',background:false,backgroundColor:'#193b2a',backgroundOpacity:80,border:false,borderColor:'#d4e6c9',borderWidth:1.5});
export function normaliseTextStyle(input={}){
 const a=input&&typeof input==='object'?input:{};
 return {
  fontSize:number(a.fontSize,DEFAULT_TEXT_STYLE.fontSize,10,48),
  color:color(a.color,DEFAULT_TEXT_STYLE.color),
  background:a.background===true,
  backgroundColor:color(a.backgroundColor,DEFAULT_TEXT_STYLE.backgroundColor),
  backgroundOpacity:number(a.backgroundOpacity,DEFAULT_TEXT_STYLE.backgroundOpacity,0,100),
  border:a.border===true,
  borderColor:color(a.borderColor,DEFAULT_TEXT_STYLE.borderColor),
  borderWidth:number(a.borderWidth,DEFAULT_TEXT_STYLE.borderWidth,0.5,5)
 };
}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// The label's anchor is the same as in older drill files, keeping placements stable.
export function textLabelSVG(o,{baseline=4,ink=false}={}){
 const s=normaliseTextStyle(o?.textStyle),value=String(o?.label||'Text').slice(0,160);
 // Approximate text width; actual SVG glyphs stay text so they remain crisp in PDFs.
 const characters=Array.from(value),units=characters.reduce((a,c)=>a+(c===' '?0.35:/[ilI1.,'!:;]/.test(c)?.34:/[MW@#%]/.test(c)?.9:.63),0);
 const padding=9,width=Math.max(28,units*s.fontSize+padding*2),height=s.fontSize+12,left=-width/2,top=baseline-s.fontSize*.82-6;
 const hasSurface=s.background||s.border;
 const border=s.border?s.borderColor:'none',fill=s.background?s.backgroundColor:'none';
 const rect='<rect x="'+left+'" y="'+top+'" width="'+width+'" height="'+height+'" rx="5" fill="'+fill+'" fill-opacity="'+(s.background?s.backgroundOpacity/100:0)+'" stroke="'+border+'" stroke-width="'+(s.border?s.borderWidth:0)+'"/>';
 const hit='<rect x="'+left+'" y="'+top+'" width="'+width+'" height="'+height+'" rx="5" fill="transparent" pointer-events="all"/>';
 const outline=hasSurface?'':' paint-order="stroke" stroke="'+(ink?'#ffffff':'#234f38')+'" stroke-width="3"';
 const text='<text x="0" y="'+baseline+'" text-anchor="middle" font-family="Arial,sans-serif" font-size="'+s.fontSize+'" font-weight="650" fill="'+s.color+'"'+outline+' pointer-events="none">'+esc(value)+'</text>';
 return '<g class="text-annotation">'+rect+hit+text+'</g>';
}
export function textVisible(timing,progress){
 const s=number(timing?.start,0,0,99)/100,e=number(timing?.end,100,1,100)/100,p=number(progress,1,0,1);
 return p+1e-9>=s&&p<=Math.max(s+.01,e)+1e-9;
}
