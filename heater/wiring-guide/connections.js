/* Interactive photo connection map for the Heating Rate Controller.
   D12 design-review indication only. No drawing indicates a physical cable route.
   The connector names are not installation authority until verified as built. */
(() => {
  'use strict';
  if (typeof parts === 'undefined' || typeof cdata === 'undefined' ||
      typeof goLayer !== 'function' || typeof interpolate !== 'function') return;

  const photo = document.getElementById('photoArea');
  const photoPanel = photo?.closest('.photoPanel');
  const netTable = document.getElementById('netRows');
  if (!photo || !photoPanel || !netTable) return;

  const styles = document.createElement('style');
  styles.textContent = `
    .wireToolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 1px 12px;padding:11px 12px;border:1px solid #42617a;background:#112a40;border-radius:11px}
    .wireToolbar strong{font-size:12px;letter-spacing:.2px;color:#ecf7ff}
    .wireToolbar small{font-size:10px;color:#97bacb}
    .wireToolbar .pushRight{flex:1}
    .wireToolbar button{background:#1b3b53;border:1px solid #55728a;border-radius:7px;padding:8px 10px;color:#e3f5ff;font-weight:750;font-size:12px}
    .wireToolbar button:hover:not(:disabled){background:#245574}
    .wireToolbar button:disabled{opacity:.4;cursor:not-allowed}
    .wireToolbar button[aria-pressed="true"]{background:#15546c;border-color:#59d2db;color:#eaffff}
    .wireCounter{font:750 11px ui-monospace,Consolas,monospace;min-width:68px;text-align:center;color:#d7edf9}
    .wireOverlay{position:absolute;inset:0;display:block;width:100%;height:100%;z-index:3;pointer-events:none;overflow:visible}
    .wireOverlay .wireHalo{fill:none;stroke:#091822;stroke-width:1.75;opacity:.82;stroke-linecap:round}
    .wireOverlay .wireLink{fill:none;stroke:#68e8ec;stroke-width:.72;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 1.2px #101e2a)}
    .wireOverlay .wireLink.offPhoto{stroke:#ffcf87;stroke-dasharray:1.5 1.4}
    .wireOverlay .wireBadge{fill:#0b3445;stroke:#b8f9ff;stroke-width:.36}
    .wireOverlay .wireBadge.end{fill:#164e40;stroke:#adf6cd}
    .wireOverlay .wireBadge.offPhoto{fill:#52391c;stroke:#ffd89c}
    .wireOverlay text{fill:#fff;font:800 3.25px ui-monospace,Consolas,monospace;text-anchor:middle;dominant-baseline:central}
    .wireOverlay .offPhotoText{font-size:2.1px;fill:#fff1cd;letter-spacing:.1px;paint-order:stroke;stroke:#332718;stroke-width:.85px;stroke-linejoin:round}
    .photoArea .hot.wireEndpoint{border-color:#d2fdff;box-shadow:0 0 0 2px #162e3a,0 0 12px #42dceacb;background:#39dde61b}
    .photoArea .hot.wireTarget{border-color:#b0f9c6;box-shadow:0 0 0 2px #162e3a,0 0 12px #8edcaad9;background:#8cffb01f}
    .photoPanel.wireOff .wireOverlay,.photoPanel.wireOff .wireStep{display:none}
    .photoPanel.wireOff .hot.wireEndpoint,.photoPanel.wireOff .hot.wireTarget{box-shadow:none}
    .wireStep{margin:12px 0 3px;background:#0d2535;border:1px solid #3b6675;border-radius:12px;padding:15px;box-shadow:0 6px 20px #08182570}
    .wireStepTop{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}
    .wireStepTop strong{font:800 12px ui-monospace,Consolas,monospace;color:#8dedf3}
    .wireStepTop span{font-size:10px;background:#43331f;border:1px solid #775731;color:#ffda9d;border-radius:7px;padding:5px 8px;font-weight:700}
    .wireTerminals{display:grid;grid-template-columns:minmax(0,1fr) 26px minmax(0,1fr);gap:9px;align-items:stretch}
    .wireTerm{border:1px solid #426173;background:#19374a;padding:11px 10px;border-radius:9px;min-width:0}
    .wireTerm small{display:block;font:800 10px ui-monospace,Consolas,monospace;color:#78d8e7;letter-spacing:1px;margin-bottom:6px}
    .wireTerm:last-child{border-color:#3e7268;background:#173d40}
    .wireTerm:last-child small{color:#9bedbb}
    .wireTerm strong{font-size:12px;line-height:1.5;font-weight:750;overflow-wrap:anywhere;display:block}
    .wireArrow{font-size:26px;color:#76dae3;align-self:center;text-align:center}
    .wireStepNote{color:#c0d4e2;font-size:11px;line-height:1.55;margin:11px 0 0}
    .wirePhotoStatus{font-size:11px;color:#eed0a3;line-height:1.5;margin:8px 0 0}
    .wireLegend{display:flex;gap:14px;flex-wrap:wrap;font-size:10px;color:#a9c0cf;margin:10px 0 0}
    .wireLegend i{display:inline-block;width:24px;vertical-align:middle;margin:0 5px 2px 0;border-top:3px solid #68e8ec}
    .wireLegend i.dashed{border-top-style:dashed;border-color:#ffcf87}
    .wire-mapping-head{color:#a0c1d3;font-size:11px;padding:0 2px 9px}
    .wireStep[hidden],.wireOverlay[hidden]{display:none!important}
    @media(max-width:480px){.wireToolbar{padding:9px;gap:6px}.wireToolbar button{padding:8px 9px}.wireToolbar .pushRight{flex-basis:8px}.wireTerminals{gap:6px;grid-template-columns:minmax(0,1fr) 20px minmax(0,1fr)}.wireTerm{padding:9px 8px}.wireTerm strong{font-size:11px}.wireStep{padding:11px}}
    @media print{.wireToolbar{display:none}.wireOverlay{print-color-adjust:exact}.wireStep{break-inside:avoid;background:#fff}.wireTerm strong,.wireStepTop strong,.wireStepNote,.wirePhotoStatus{color:#000!important}}
  `;
  document.head.appendChild(styles);

  const wrap = photo.closest('.photoWrap');
  const bar = document.createElement('div');
  bar.className = 'wireToolbar';
  bar.setAttribute('aria-label', 'Interactive connection map controls');
  bar.innerHTML = '<div><strong>Connection map</strong><br><small>One proposed link at a time</small></div>'+
    '<span class="pushRight"></span>'+
    '<button id="wireMapToggle" type="button" aria-pressed="true">Lines: on</button>'+
    '<button id="wirePrev" type="button" aria-label="Previous connection">←</button>'+
    '<span id="wireCounter" class="wireCounter" aria-live="polite">–</span>'+
    '<button id="wireNext" type="button" aria-label="Next connection">→</button>';
  wrap.insertBefore(bar,photo);
  const step = document.createElement('div');
  step.id = 'wireStep';
  step.className = 'wireStep';
  step.setAttribute('aria-live', 'polite');
  step.innerHTML = '<div class="wireStepTop"><strong id="wireRef">D12 CONNECTION</strong><span>DESIGN REVIEW · NOT RELEASED</span></div>'+
    '<div class="wireTerminals"><div class="wireTerm"><small>A · FROM</small><strong id="wireSource"></strong></div>'+
    '<div class="wireArrow" aria-hidden="true">→</div>'+
    '<div class="wireTerm"><small>B · TO</small><strong id="wireDestination"></strong></div></div>'+
    '<p id="wireComment" class="wireStepNote"></p><p id="wirePhotoStatus" class="wirePhotoStatus"></p>'+
    '<div class="wireLegend"><span><i></i>Both device positions visible</span><span><i class="dashed"></i>Off-photo / unidentified endpoint</span></div>';
  photo.insertAdjacentElement('afterend',step);
  const photoNote = document.querySelector('.photoNote');
  if (photoNote) photoNote.innerHTML = 'Click <strong>← / →</strong> to trace each proposed connection on the picture, or select its D12 row in the table. <strong>A/B are device locators, not terminal positions.</strong> Lines indicate electrical relationships only; never use them as cable routes. Door devices and unidentified terminals are not assigned invented positions.';
  const tableNote = netTable.closest('.section')?.querySelector('p.tiny');
  if (tableNote) tableNote.textContent='Select a net row to show its A → B connection on the cabinet photograph. The photo identifies devices, not physical terminal placements or cable paths.';

  const svgNs = 'http://www.w3.org/2000/svg';
  const newSvg = (tag,attr) => { const el=document.createElementNS(svgNs,tag); Object.entries(attr||{}).forEach(([k,v])=>el.setAttribute(k,String(v)));return el;};
  const overlay=newSvg('svg',{id:'wireOverlay',viewBox:'0 0 100 100',preserveAspectRatio:'none',class:'wireOverlay','aria-hidden':'true'});
  const defs=newSvg('defs');
  const mk=newSvg('marker',{id:'wireArrowHead',viewBox:'0 0 10 10',refX:'8',refY:'5',markerWidth:'5',markerHeight:'5',orient:'auto-start-reverse'});
  mk.appendChild(newSvg('path',{d:'M1 1 L9 5 L1 9 Z',fill:'#a7f3f4'}));defs.appendChild(mk);
  const mkOff=newSvg('marker',{id:'wireArrowOff',viewBox:'0 0 10 10',refX:'8',refY:'5',markerWidth:'5',markerHeight:'5',orient:'auto-start-reverse'});
  mkOff.appendChild(newSvg('path',{d:'M1 1 L9 5 L1 9 Z',fill:'#ffcf87'}));defs.appendChild(mkOff);
  overlay.appendChild(defs);
  photo.appendChild(overlay);

  // The two endpoints in each D12 row are intentionally mapped to DEVICE LOCATIONS,
  // not to inferred screws or terminal strips. 'door'/'unknown' are not photo locations.
  const ends = {
    ac:[['door','unknown'],['door','unknown'],['door','xlower'],['unknown','psu'],['unknown','door'],['unknown','door']],
    dc24:[['psu','unknown'],['psu','unknown'],['unknown','door'],['unknown','door'],['unknown','unknown']],
    enable:[['unknown','{K}'],['door','{K}'],['{K}','{POWER}'],['unknown','{POWER}']],
    demand:[['door','{W}'],['unknown','{SSR}'],['{SSR}','{W}']],
    power:[['door','{BREAKER}'],['{BREAKER}','{POWER}'],['{POWER}','{SSR}'],['{SSR}','door'],['door','door']],
    tc:[['door','door']]
  };
  const anchorLabel = name => name==='door'?'DOOR':name==='unknown'?'NOT MAPPED':'NOT SHOWN';
  const partPoint = id => {
    const b=parts[id]?.box;
    return b?{x:b[0]+b[2]/2,y:b[1]+b[3]/2,id}:null;
  };
  const limit = (v,a,b)=>Math.max(a,Math.min(v,b));
  const edgePoint = (kind,other)=>{
    const nearLeft = (other?.x??50) < 50;
    if(kind==='unknown' && other?.y < 44) return {x:limit(other.x+(!nearLeft?7:-7),12,89),y:4,external:kind};
    return {x:nearLeft?4:96,y:limit(other?.y??50,10,91),external:kind};
  };
  const outlineAnchor = (p,towards) => {
    if(!p||!p.id||!towards) return p;
    const box=parts[p.id].box;
    const hx=box[2]/2,hy=box[3]/2;
    const dx=towards.x-p.x,dy=towards.y-p.y;
    const factor=Math.min(Math.abs(hx/(dx||1e-4)),Math.abs(hy/(dy||1e-4)),1);
    return {x:p.x+dx*factor*.83,y:p.y+dy*factor*.83,id:p.id};
  };
  const addBadge=(p,letter,isOff)=>{
    overlay.appendChild(newSvg('circle',{cx:p.x,cy:p.y,r:3.2,class:'wireBadge '+(letter==='B'?'end ':'')+(isOff?'offPhoto':'')}));
    const txt=newSvg('text',{x:p.x,y:p.y+.11});txt.textContent=letter;overlay.appendChild(txt);
    if(isOff){const lab=newSvg('text',{x:limit(p.x,14,86),y:limit(p.y-5.1,7,94),class:'offPhotoText'});lab.textContent=anchorLabel(p.external);overlay.appendChild(lab)}
  };
  const selectPart=(id,clazz)=>{
    if(!parts[id])return;
    const element=photo.querySelector('.hot[data-part="'+id+'"]');
    if(element){element.classList.add(clazz);element.style.pointerEvents='auto';element.tabIndex=0;}
  };
  let selected=0;
  let mapOn=true;
  let rowList=[];
  function drawConnection(){
    overlay.replaceChildren(defs);
    photo.querySelectorAll('.hot').forEach(x=>x.classList.remove('wireEndpoint','wireTarget'));
    const mapping=(ends[layer]||[])[selected];
    const row=rowList[selected];
    const hasRow=!!(row&&mapping);
    step.hidden=!hasRow;
    document.getElementById('wirePrev').disabled=!hasRow||selected===0;
    document.getElementById('wireNext').disabled=!hasRow||selected===rowList.length-1;
    document.getElementById('wireCounter').textContent=hasRow?`${selected+1} / ${rowList.length}`:'–';
    for(const [idx,r] of [...netTable.querySelectorAll('tr')].entries())r.classList.toggle('selected',idx===selected&&hasRow);
    if(!hasRow)return;
    const [ref,from,to,note]=row;
    document.getElementById('wireRef').textContent=ref+' · '+interpolate(cdata[layer].kicker);
    document.getElementById('wireSource').textContent=from;
    document.getElementById('wireDestination').textContent=to;
    document.getElementById('wireComment').textContent=note;
    const [fromID,toID]=mapping.map(interpolate);
    let pointA=partPoint(fromID),pointB=partPoint(toID);
    if(!pointA&&!pointB){
      document.getElementById('wirePhotoStatus').textContent='Both endpoints are on the door, outside this photograph, or not physically identified. See the A → B references above; no fabricated photo path is drawn.';
      return;
    }
    if(!pointA) pointA=edgePoint(fromID,pointB);
    if(!pointB) pointB=edgePoint(toID,pointA);
    const both=!!parts[fromID]&&!!parts[toID];
    const start=outlineAnchor(pointA,pointB),finish=outlineAnchor(pointB,pointA);
    const cx=(start.x+finish.x)/2;
    const cy=(start.y+finish.y)/2 - (both ? 3 : 1);
    const path=`M ${start.x.toFixed(2)} ${start.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${finish.x.toFixed(2)} ${finish.y.toFixed(2)}`;
    const halo=newSvg('path',{d:path,class:'wireHalo'});overlay.appendChild(halo);
    const line=newSvg('path',{d:path,class:'wireLink '+(both?'':'offPhoto'),'marker-end':both?'url(#wireArrowHead)':'url(#wireArrowOff)'});
    overlay.appendChild(line);
    addBadge(start,'A',!parts[fromID]);addBadge(finish,'B',!parts[toID]);
    selectPart(fromID,'wireEndpoint');selectPart(toID,'wireTarget');
    document.getElementById('wirePhotoStatus').textContent=both
      ? 'Solid A → B links the two visible devices. It does NOT specify cable length, route, connector location or verified terminal placement.'
      : 'Dashed link ends at the photo boundary because a door-mounted or unmapped endpoint is not shown. Its location is NOT a suggested cable entry or route.';
  }
  function updateLayer(){
    rowList=(cdata[layer]?.nets||[]).map(r=>r.map(v=>v==null?v:interpolate(v)));
    selected=layer==='power'&&rowList.length>1?1:0;
    drawConnection();
  }
  const previousGoLayer=goLayer;
  goLayer=function(k){previousGoLayer(k);updateLayer();};
  document.getElementById('wirePrev').addEventListener('click',()=>{if(selected>0){selected--;drawConnection()}});
  document.getElementById('wireNext').addEventListener('click',()=>{if(selected+1<rowList.length){selected++;drawConnection()}});
  document.getElementById('wireMapToggle').addEventListener('click',()=>{
    mapOn=!mapOn;photoPanel.classList.toggle('wireOff',!mapOn);
    document.getElementById('wireMapToggle').setAttribute('aria-pressed',String(mapOn));
    document.getElementById('wireMapToggle').textContent=mapOn?'Lines: on':'Lines: off';
  });
  netTable.addEventListener('click',event=>{
    const tr=event.target.closest('tr');if(!tr)return;
    const idx=[...netTable.children].indexOf(tr);
    if(idx>=0&&idx<rowList.length){selected=idx;drawConnection()}
  });
  netTable.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    const tr=event.target.closest('tr');if(!tr)return;
    const idx=[...netTable.children].indexOf(tr);
    if(idx>=0&&idx<rowList.length){selected=idx;drawConnection()}
  });
  // Start with a genuine two-visible-device example: CH1 breaker → Finder contact.
  // The original cabinet overview remains available in the left-hand circuit menu.
  goLayer('power');
})();