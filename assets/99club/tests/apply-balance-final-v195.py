from pathlib import Path

# PDF: keep the approved hierarchy, but move the beam below the instruction,
# make both pan cards symmetrical, and put TOTAL inside each pan.
p=Path('assets/99club/games-pdf.js')
t=p.read_text()
old="""    const fy=resultY+resultH+7,fh=y+h-fy-9;drawRoundRect(page,x+15,fy,w-30,fh,7,{fill:[245,250,249],stroke:[166,194,191],width:.75});page.text(x+25,fy+13,answers?'FINAL BALANCE - EXAMPLE SOLUTION':'FINAL BALANCE',5.2,{bold:true,color:[15,111,104]});page.text(x+25,fy+25,'Use A, B, C and D exactly once. Put two weights on each side, then add the totals.',5.0,{color:DARK});
    const centre=x+w/2,beamY=fy+45,beamHalf=Math.min(72,w*.18),panW=Math.min(126,w*.31),panH=Math.max(34,fh-58),panY=fy+52;page.line(centre-beamHalf,beamY,centre+beamHalf,beamY,{color:[100,132,135],width:2.6});rawPath(page,[`${pdfN(centre)} ${pdfN(page.height-(beamY+1))} m`,`${pdfN(centre-15)} ${pdfN(page.height-(fy+fh-8))} l`,`${pdfN(centre+15)} ${pdfN(page.height-(fy+fh-8))} l`,'h'],{fill:[100,132,135],stroke:[100,132,135],width:.5});drawCircle(page,centre,beamY,3.6,{fill:WHITE,stroke:[100,132,135],width:.8});
    function drawPan(px,side){const items=rows.map((r,i)=>({r,i})).filter(z=>f.solutionSides?.[z.i]===side),pcx=px+panW/2,anchor=side==='L'?centre-beamHalf:centre+beamHalf;page.line(anchor,beamY,pcx,panY,{color:[129,157,160],width:.7});drawRoundRect(page,px,panY,panW,panH,8,{fill:WHITE,stroke:[144,178,174],width:.8});page.text(px+8,panY+11,side==='L'?'LEFT':'RIGHT',4.3,{bold:true,color:MUTED});for(let j=0;j<2;j++){const sx=px+30+j*50,sy=panY+8;if(answers&&items[j])token(sx,sy,44,20,label(items[j].i),items[j].r.answer,true);else drawRoundRect(page,sx,sy,44,20,5,{fill:WHITE,stroke:[159,188,184],width:.65});}page.text(pcx,panY+panH+10,`TOTAL ${answers?formatNumber(f.target):'______'}`,5.2,{bold:true,color:INK,align:'center'});}
    drawPan(x+22,'L');drawPan(x+w-22-panW,'R');drawRoundRect(page,centre-18,panY+7,36,22,10,{fill:WHITE,stroke:[144,178,174],width:.7});diagramText(page,centre,panY+22,'=',8.5,{bold:true,color:[15,111,104]});
"""
new="""    const fy=resultY+resultH+7,fh=y+h-fy-9;drawRoundRect(page,x+15,fy,w-30,fh,7,{fill:[245,250,249],stroke:[166,194,191],width:.75});page.text(x+25,fy+13,answers?'FINAL BALANCE - EXAMPLE SOLUTION':'FINAL BALANCE',5.2,{bold:true,color:[15,111,104]});drawWrapped(page,x+25,fy+25,'Use A, B, C and D exactly once. Put two weights on each side, then make the totals match.',w-50,5.0,{color:DARK,maxLines:1,compact:true});
    const centre=x+w/2,beamY=fy+43,beamHalf=Math.min(78,w*.195),panW=Math.min(145,(w-92)/2),panY=fy+54,panH=Math.max(36,fh-62);page.line(centre-beamHalf,beamY,centre+beamHalf,beamY,{color:[100,132,135],width:2.8});rawPath(page,[`${pdfN(centre)} ${pdfN(page.height-(beamY+1))} m`,`${pdfN(centre-14)} ${pdfN(page.height-(fy+fh-7))} l`,`${pdfN(centre+14)} ${pdfN(page.height-(fy+fh-7))} l`,'h'],{fill:[100,132,135],stroke:[100,132,135],width:.5});drawCircle(page,centre,beamY,3.7,{fill:WHITE,stroke:[100,132,135],width:.8});
    function drawPan(px,side){
      const items=rows.map((r,i)=>({r,i})).filter(z=>f.solutionSides?.[z.i]===side),pcx=px+panW/2,anchor=side==='L'?centre-beamHalf:centre+beamHalf,totalBandH=14,totalLineY=panY+panH-totalBandH,slotGap=7,slotW=(panW-31-slotGap)/2,slotH=Math.min(20,Math.max(16,totalLineY-panY-17)),slotY=panY+13,slotStart=px+12;
      page.line(anchor,beamY,pcx,panY,{color:[129,157,160],width:.7});drawRoundRect(page,px,panY,panW,panH,8,{fill:WHITE,stroke:[144,178,174],width:.8});page.text(px+8,panY+10,side==='L'?'LEFT':'RIGHT',4.3,{bold:true,color:MUTED});
      for(let j=0;j<2;j++){const sx=slotStart+j*(slotW+slotGap);if(answers&&items[j])token(sx,slotY,slotW,slotH,label(items[j].i),items[j].r.answer,true);else drawRoundRect(page,sx,slotY,slotW,slotH,5,{fill:WHITE,stroke:[159,188,184],width:.65});}
      page.line(px+7,totalLineY,px+panW-7,totalLineY,{color:[207,220,222],width:.6});page.text(px+9,totalLineY+10,'TOTAL',4.4,{bold:true,color:MUTED});if(answers)page.text(px+panW-10,totalLineY+10,formatNumber(f.target),5.2,{bold:true,color:[15,111,104],align:'right'});else page.line(px+46,totalLineY+8,px+panW-10,totalLineY+8,{color:[110,134,137],width:.55});
    }
    drawPan(x+22,'L');drawPan(x+w-22-panW,'R');drawRoundRect(page,centre-18,panY+10,36,22,10,{fill:WHITE,stroke:[144,178,174],width:.7});diagramText(page,centre,panY+25,'=',8.5,{bold:true,color:[15,111,104]});
"""
if old not in t:
    raise SystemExit('PDF Balance Lab final block anchor missing')
p.write_text(t.replace(old,new,1))

# Browser printable preview: same visual hierarchy. Totals remain inside each pan,
# with enough vertical separation between the instructions and the scale.
p=Path('assets/99club/games-balance-lab-v192.css')
t=p.read_text()
old=""".tt99-balance-print-final{margin-top:7px;padding:8px 10px 7px;border:1px solid #a6c2bf;border-radius:10px;background:#f5faf9;text-align:left}.tt99-balance-print-final>small{display:block;font-size:.57rem;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#0f6f68}.tt99-balance-print-final>p{margin:2px 0 6px;color:#4f6c70;font-size:.59rem}
.tt99-balance-paper-scale{display:grid;grid-template-columns:1fr 66px 1fr;gap:5px;align-items:end}.tt99-balance-paper-pan{position:relative;display:grid;gap:2px;padding:5px 7px 4px;border:1px solid #90b2ae;border-radius:9px;background:#fff;text-align:center}.tt99-balance-paper-pan>small{position:absolute;left:7px;top:4px;font-size:.45rem;font-weight:900;color:#71868a;text-transform:uppercase}.tt99-balance-paper-pan-slots{display:flex;justify-content:center;gap:7px;padding-top:10px}.tt99-balance-paper-pan-slots>span{display:grid;place-items:center;min-width:48px;height:22px;border:1px solid #a6c0bd;border-radius:6px;background:#fff;color:#657f82;font-size:.54rem}.tt99-balance-paper-pan-slots>span.filled{grid-template-columns:auto auto;gap:4px;background:#eaf6f3;color:#0f6f68}.tt99-balance-paper-pan-slots span b{font-size:.58rem}.tt99-balance-paper-pan-slots span em{font-size:.58rem;font-style:normal;font-weight:900}.tt99-balance-paper-pan>strong{font-size:.55rem;color:#385d61}
.tt99-balance-paper-centre{position:relative;height:55px;display:grid;align-items:end;justify-items:center}.tt99-balance-paper-centre .beam{position:absolute;top:10px;width:66px;height:4px;border-radius:99px;background:#648487}.tt99-balance-paper-centre .stand{font-size:1.8rem;line-height:1;color:#648487}.tt99-balance-paper-centre>b{position:absolute;bottom:16px;display:grid;place-items:center;width:36px;height:22px;border:1px solid #90b2ae;border-radius:12px;background:#fff;color:#0f6f68}
"""
new=""".tt99-balance-print-final{margin-top:7px;padding:8px 10px 8px;border:1px solid #a6c2bf;border-radius:10px;background:#f5faf9;text-align:left}.tt99-balance-print-final>small{display:block;font-size:.57rem;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#0f6f68}.tt99-balance-print-final>p{margin:2px 0 11px;color:#4f6c70;font-size:.59rem;line-height:1.3}
.tt99-balance-paper-scale{display:grid;grid-template-columns:minmax(0,1fr) 58px minmax(0,1fr);gap:7px;align-items:start}.tt99-balance-paper-pan{position:relative;display:grid;grid-template-rows:auto 1fr auto;min-height:70px;padding:6px 8px 6px;border:1px solid #90b2ae;border-radius:10px;background:#fff;text-align:center}.tt99-balance-paper-pan>small{display:block;text-align:left;font-size:.45rem;font-weight:900;color:#71868a;text-transform:uppercase}.tt99-balance-paper-pan-slots{display:flex;align-items:center;justify-content:center;gap:7px;padding:4px 0 5px}.tt99-balance-paper-pan-slots>span{display:grid;place-items:center;min-width:48px;height:22px;border:1px solid #a6c0bd;border-radius:6px;background:#fff;color:#657f82;font-size:.54rem}.tt99-balance-paper-pan-slots>span.filled{grid-template-columns:auto auto;gap:4px;background:#eaf6f3;color:#0f6f68}.tt99-balance-paper-pan-slots span b{font-size:.58rem}.tt99-balance-paper-pan-slots span em{font-size:.58rem;font-style:normal;font-weight:900}.tt99-balance-paper-pan>strong{display:block;padding-top:4px;border-top:1px solid #d0dfdd;text-align:left;font-size:.52rem;color:#385d61}
.tt99-balance-paper-centre{position:relative;height:70px;display:grid;align-items:end;justify-items:center}.tt99-balance-paper-centre .beam{position:absolute;top:5px;width:58px;height:4px;border-radius:99px;background:#648487}.tt99-balance-paper-centre .stand{font-size:1.9rem;line-height:1;color:#648487}.tt99-balance-paper-centre>b{position:absolute;bottom:20px;display:grid;place-items:center;width:36px;height:22px;border:1px solid #90b2ae;border-radius:12px;background:#fff;color:#0f6f68}
"""
if old not in t:
    raise SystemExit('CSS Balance Lab final block anchor missing')
p.write_text(t.replace(old,new,1))

# Cache-bust the updated printable CSS and PDF exporter.
p=Path('_pages/99-club-games.md')
t=p.read_text()
for old,new in [('games-balance-lab-v192.css?v=3','games-balance-lab-v192.css?v=4'),('games-pdf.js?v=25','games-pdf.js?v=26')]:
    if old not in t:
        raise SystemExit(f'cache anchor missing: {old}')
    t=t.replace(old,new,1)
p.write_text(t)
