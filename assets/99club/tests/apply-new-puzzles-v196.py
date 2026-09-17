from pathlib import Path

# ---- Printable/browser preview ----
p=Path('assets/99club/games-app.js')
t=p.read_text()
t=t.replace("{id:'algebra',label:'Algebra & relationships',description:'Unknowns, functions and balancing relationships.',engines:['symbols','functionmachine','balance']},", "{id:'algebra',label:'Algebra & relationships',description:'Unknowns, functions and balancing relationships.',engines:['symbols','functionmachine','balance','mobilebalance']},",1)
t=t.replace("{id:'logic',label:'Number logic & grids',description:'Compact number-grid puzzles with short rules and validated solutions.',engines:['sudoku','futoshiki','nonogram','numberpath']}", "{id:'logic',label:'Number logic & grids',description:'Compact logic puzzles with short rules and validated solutions.',engines:['sudoku','futoshiki','nonogram','numberpath','colourlogic']}",1)
anchor="""  function logicHead(a,index){return `<div class=\"tt99-game-activity-head\"><div><span>Activity ${index}</span><h3>${esc(a.title)}</h3></div><small>${esc(a.difficulty||'')}</small></div><p class=\"tt99-game-instruction\">${esc(a.instruction||'')}</p>`;}"""
if anchor not in t: raise SystemExit('logicHead anchor missing')
insert=r'''
  function renderColourLogic(a,answers,index,si,ai){
    const key=`<div class="tt99-cl-print-key">${(a.colors||[]).map(c=>`<span><b>${esc(c.id)}</b>${esc(c.name)}</span>`).join('')}</div>`,rules=`<ol class="tt99-cl-print-rules">${(a.clues||[]).map(c=>`<li>${esc(c.text)}</li>`).join('')}</ol>`;
    let body='';
    if(a.variant==='row'){
      body=`<div class="tt99-cl-print-row">${key}<div class="tt99-cl-paper-row" style="--cl-count:${a.solution.length}">${a.solution.map(v=>`<span>${answers?esc(v):''}</span>`).join('')}</div>${rules}</div>`;
    }else{
      body=`<div class="tt99-cl-paper-layout"><div><div class="tt99-cl-paper-grid" style="--cl-n:${a.size}">${a.solutionGrid.flat().map(v=>`<span>${answers?esc(v):''}</span>`).join('')}</div>${key}</div>${rules}</div>`;
    }
    return `<section class="tt99-game-activity tt99-colourlogic-print">${activityReplaceButton(si,ai)}${logicHead(a,index)}${body}</section>`;
  }

  function mobileShapeSvg(id,cx,cy,size){if(id==='circle')return `<circle class="s-circle" cx="${cx}" cy="${cy}" r="${size*.46}"/>`;if(id==='square')return `<rect class="s-square" x="${cx-size*.45}" y="${cy-size*.45}" width="${size*.9}" height="${size*.9}" rx="2"/>`;if(id==='triangle')return `<path class="s-triangle" d="M ${cx} ${cy-size*.52} L ${cx+size*.52} ${cy+size*.45} L ${cx-size*.52} ${cy+size*.45} Z"/>`;if(id==='diamond')return `<path class="s-diamond" d="M ${cx} ${cy-size*.55} L ${cx+size*.5} ${cy} L ${cx} ${cy+size*.55} L ${cx-size*.5} ${cy} Z"/>`;return `<path class="s-star" d="M ${cx} ${cy-size*.56} L ${cx+size*.16} ${cy-size*.18} L ${cx+size*.55} ${cy-size*.17} L ${cx+size*.25} ${cy+size*.08} L ${cx+size*.35} ${cy+size*.48} L ${cx} ${cy+size*.25} L ${cx-size*.35} ${cy+size*.48} L ${cx-size*.25} ${cy+size*.08} L ${cx-size*.55} ${cy-size*.17} L ${cx-size*.16} ${cy-size*.18} Z"/>`;}
  function mobileLeaves(n){return n.type==='group'?1:mobileLeaves(n.left)+mobileLeaves(n.right);}
  function mobileDepth(n){return n.type==='group'?1:1+Math.max(mobileDepth(n.left),mobileDepth(n.right));}
  function mobilePaperSvg(a){let parts=[];function rec(n,x0,x1,y){const cx=(x0+x1)/2;if(n.type==='group'){parts.push(`<line class="string" x1="${cx}" y1="${y-8}" x2="${cx}" y2="${y+7+n.count*19}"/>`);for(let i=0;i<n.count;i++)parts.push(mobileShapeSvg(n.shape,cx,y+15+i*19,14));return;}const ll=mobileLeaves(n.left),rr=mobileLeaves(n.right),split=x0+(x1-x0)*ll/(ll+rr),lc=(x0+split)/2,rc=(split+x1)/2;parts.push(`<line class="bar" x1="${lc}" y1="${y}" x2="${rc}" y2="${y}"/><circle class="pivot" cx="${cx}" cy="${y}" r="2.4"/><line class="string" x1="${lc}" y1="${y}" x2="${lc}" y2="${y+25}"/><line class="string" x1="${rc}" y1="${y}" x2="${rc}" y2="${y+25}"/>`);rec(n.left,x0,split,y+34);rec(n.right,split,x1,y+34);}rec(a.tree,12,488,34);return `<svg class="tt99-mobile-paper-svg" viewBox="0 0 500 ${Math.max(165,mobileDepth(a.tree)*58+50)}">${a.topTotal!=null?`<g class="top-total"><circle cx="250" cy="14" r="13"/><text x="250" y="18">${esc(a.topTotal)}</text><line x1="250" y1="27" x2="250" y2="34"/></g>`:`<line class="string" x1="250" y1="8" x2="250" y2="34"/>`}${parts.join('')}</svg>`;}
  function renderMobileBalance(a,answers,index,si,ai){
    const vals=(a.shapeIds||[]).map(id=>{const m=a.shapeMeta[id]||{label:id};const given=a.givens?.[id]!=null;return `<span><svg viewBox="0 0 40 40">${mobileShapeSvg(id,20,20,18)}</svg><b>${esc(m.label)}</b><em>${given||answers?esc(a.values[id]):'____'}</em></span>`;}).join('');
    return `<section class="tt99-game-activity tt99-mobilebalance-print">${activityReplaceButton(si,ai)}${arithmeticHead(a,index)}<div class="tt99-mobile-paper-wrap">${mobilePaperSvg(a)}<div class="tt99-mobile-paper-values">${vals}</div></div></section>`;
  }

'''
t=t.replace(anchor,insert+anchor,1)
old="""if(a.engineId==='functionmachine')return renderFunctionMachine(a,answers,index,si,ai);if(a.engineId==='balance')return renderBalance(a,answers,index,si,ai);return `<section class="tt99-game-activity">"""
new="""if(a.engineId==='functionmachine')return renderFunctionMachine(a,answers,index,si,ai);if(a.engineId==='balance')return renderBalance(a,answers,index,si,ai);if(a.engineId==='mobilebalance')return renderMobileBalance(a,answers,index,si,ai);if(a.engineId==='colourlogic')return renderColourLogic(a,answers,index,si,ai);return `<section class="tt99-game-activity">"""
if old not in t: raise SystemExit('renderArithmetic dispatch anchor missing')
t=t.replace(old,new,1)
p.write_text(t)

# ---- PDF renderer ----
p=Path('assets/99club/games-pdf.js')
t=p.read_text()
anchor="""  function drawNumberLogicActivity(page,a,answers,x,y,w,h,index){"""
if anchor not in t: raise SystemExit('PDF number logic anchor missing')
insert=r'''
  function drawColourLogic(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a),bodyY=top+24;
    drawWrapped(page,x+12,top,a.instruction,w-24,6.6,{color:MUTED,maxLines:1});
    const keyY=y+h-28,key=(a.colors||[]).map(c=>`${c.id}=${c.name}`).join('   ');fitText(page,x+w/2,keyY,key,w-34,5.6,{bold:true,color:MUTED,align:'center',compact:true});
    if(a.variant==='row'){
      const n=a.solution.length,cell=Math.min(48,(w-80)/n),gx=x+w/2-n*cell/2,gy=bodyY+8;for(let i=0;i<n;i++){drawRoundRect(page,gx+i*cell,gy,cell-5,cell-5,6,{fill:WHITE,stroke:[126,157,158],width:.8});page.text(gx+i*cell+(cell-5)/2,gy+12,String(i+1),4.8,{bold:true,color:MUTED,align:'center'});if(answers)diagramText(page,gx+i*cell+(cell-5)/2,gy+(cell-5)*.66,a.solution[i],9,{bold:true,color:TEAL});}
      let cy=gy+cell+4;for(let i=0;i<a.clues.length;i++){cy+=drawWrapped(page,x+24,cy,`${i+1}. ${a.clues[i].text}`,w-48,5.8,{color:DARK,maxLines:1,compact:true})+2;}
    }else{
      const n=a.size,cell=Math.min(35,(w*.42)/n,(h-92)/n),gw=n*cell,gx=x+18,gy=bodyY+5;for(let r=0;r<n;r++)for(let c=0;c<n;c++){page.rect(gx+c*cell,gy+r*cell,cell,cell,{fill:WHITE,stroke:[126,157,158],width:.7});if(answers)diagramText(page,gx+c*cell+cell/2,gy+r*cell+cell*.65,a.solutionGrid[r][c],8.5,{bold:true,color:TEAL});}let cy=gy,rx=gx+gw+17,rw=x+w-18-rx;for(let i=0;i<a.clues.length;i++){cy+=drawWrapped(page,rx,cy,`${i+1}. ${a.clues[i].text}`,rw,5.6,{color:DARK,maxLines:2,compact:true})+2;}
    }
  }

  function drawMobileShape(page,id,cx,cy,s){const stroke=[88,111,116],fill=answers_dummy=>null;if(id==='circle')return drawCircle(page,cx,cy,s*.46,{fill:[92,135,174],stroke,width:.55});if(id==='square')return page.rect(cx-s*.43,cy-s*.43,s*.86,s*.86,{fill:[219,139,54],stroke,width:.55});if(id==='triangle')return rawPath(page,[`${pdfN(cx)} ${pdfN(page.height-(cy-s*.5))} m`,`${pdfN(cx+s*.5)} ${pdfN(page.height-(cy+s*.43))} l`,`${pdfN(cx-s*.5)} ${pdfN(page.height-(cy+s*.43))} l`,'h'],{fill:[77,153,112],stroke,width:.55});if(id==='diamond')return rawPath(page,[`${pdfN(cx)} ${pdfN(page.height-(cy-s*.52))} m`,`${pdfN(cx+s*.48)} ${pdfN(page.height-cy)} l`,`${pdfN(cx)} ${pdfN(page.height-(cy+s*.52))} l`,`${pdfN(cx-s*.48)} ${pdfN(page.height-cy)} l`,'h'],{fill:[205,91,81],stroke,width:.55});return rawPath(page,[`${pdfN(cx)} ${pdfN(page.height-(cy-s*.52))} m`,`${pdfN(cx+s*.15)} ${pdfN(page.height-(cy-s*.16))} l`,`${pdfN(cx+s*.5)} ${pdfN(page.height-(cy-s*.15))} l`,`${pdfN(cx+s*.23)} ${pdfN(page.height-(cy+s*.07))} l`,`${pdfN(cx+s*.32)} ${pdfN(page.height-(cy+s*.43))} l`,`${pdfN(cx)} ${pdfN(page.height-(cy+s*.22))} l`,`${pdfN(cx-s*.32)} ${pdfN(page.height-(cy+s*.43))} l`,`${pdfN(cx-s*.23)} ${pdfN(page.height-(cy+s*.07))} l`,`${pdfN(cx-s*.5)} ${pdfN(page.height-(cy-s*.15))} l`,`${pdfN(cx-s*.15)} ${pdfN(page.height-(cy-s*.16))} l`,'h'],{fill:[137,93,181],stroke,width:.55});}
  function mobileLeavesPdf(n){return n.type==='group'?1:mobileLeavesPdf(n.left)+mobileLeavesPdf(n.right);}
  function mobileDepthPdf(n){return n.type==='group'?1:1+Math.max(mobileDepthPdf(n.left),mobileDepthPdf(n.right));}
  function drawMobileBalance(page,a,answers,x,y,w,h,index){
    const top=activityFrame(page,x,y,w,h,index,a);drawWrapped(page,x+12,top,a.instruction,w-24,6.5,{color:MUTED,maxLines:1});const bodyY=top+23,diagramW=w*.67,dx=x+9,dy=bodyY+3,depth=mobileDepthPdf(a.tree),scaleY=Math.min(45,(h-92)/Math.max(2,depth)),shapeS=Math.min(13,scaleY*.32);
    function rec(n,x0,x1,yy){const cx=(x0+x1)/2;if(n.type==='group'){page.line(cx,yy-6,cx,yy+8+n.count*scaleY*.42,{color:[105,132,135],width:.7});for(let i=0;i<n.count;i++)drawMobileShape(page,n.shape,cx,yy+12+i*scaleY*.42,shapeS);return;}const ll=mobileLeavesPdf(n.left),rr=mobileLeavesPdf(n.right),split=x0+(x1-x0)*ll/(ll+rr),lc=(x0+split)/2,rc=(split+x1)/2;page.line(lc,yy,rc,yy,{color:[84,111,116],width:2.2});drawCircle(page,cx,yy,2.2,{fill:WHITE,stroke:[84,111,116],width:.6});page.line(lc,yy,lc,yy+18,{color:[105,132,135],width:.7});page.line(rc,yy,rc,yy+18,{color:[105,132,135],width:.7});rec(n.left,x0,split,yy+scaleY);rec(n.right,split,x1,yy+scaleY);}const x0=dx+12,x1=dx+diagramW-12;if(a.topTotal!=null){drawCircle(page,(x0+x1)/2,dy+11,11,{fill:WHITE,stroke:[84,111,116],width:.8});diagramText(page,(x0+x1)/2,dy+15,String(a.topTotal),7.4,{bold:true,color:INK});page.line((x0+x1)/2,dy+22,(x0+x1)/2,dy+29,{color:[105,132,135],width:.7});}else page.line((x0+x1)/2,dy+8,(x0+x1)/2,dy+29,{color:[105,132,135],width:.7});rec(a.tree,x0,x1,dy+30);
    const sx=x+diagramW+18,sw=w-diagramW-27;page.text(sx,bodyY+8,'SHAPE VALUES',5.2,{bold:true,color:MUTED});let sy=bodyY+18;for(const id of a.shapeIds){const m=a.shapeMeta[id]||{label:id},given=a.givens?.[id]!=null;drawMobileShape(page,id,sx+10,sy+7,9);fitText(page,sx+24,sy+10,m.label,sw-24,5.5,{bold:true,color:DARK,compact:true});const shown=given||answers?formatNumber(a.values[id]):'________';page.text(sx+sw,sy+10,shown,5.8,{bold:answers&&!given,color:answers&&!given?TEAL:INK,align:'right'});sy+=26;}
  }

'''
t=t.replace(anchor,insert+anchor,1)
t=t.replace("if(a.engineId==='sumplete')return drawSumplete(page,a,answers,x,y,w,h,index);}","if(a.engineId==='sumplete')return drawSumplete(page,a,answers,x,y,w,h,index);if(a.engineId==='colourlogic')return drawColourLogic(page,a,answers,x,y,w,h,index);}",1)
t=t.replace("if(a.engineId==='balance')return drawBalance(page,a,answers,x,y,w,h,index);}","if(a.engineId==='balance')return drawBalance(page,a,answers,x,y,w,h,index);if(a.engineId==='mobilebalance')return drawMobileBalance(page,a,answers,x,y,w,h,index);}",1)
t=t.replace("'functionmachine','balance'].includes(a.engineId)","'functionmachine','balance','mobilebalance'].includes(a.engineId)",1)
t=t.replace("'nonogram','numberpath','sumplete'].includes(a.engineId)","'nonogram','numberpath','sumplete','colourlogic'].includes(a.engineId)",1)
p.write_text(t)

# ---- Page wiring ----
for filename in ['_pages/99-club-games.md','_pages/99-club-games-play.md']:
    p=Path(filename);t=p.read_text()
    css_anchor='<link rel="stylesheet" href="/assets/99club/games-balance-lab-v192.css'
    idx=t.find(css_anchor)
    if idx<0: raise SystemExit(f'CSS anchor missing in {filename}')
    line_end=t.find('\n',idx)+1
    t=t[:line_end]+'<link rel="stylesheet" href="/assets/99club/games-new-puzzles-v196.css?v=1">\n'+t[line_end:]
    js_anchor='<script src="/assets/99club/games-arithmetic.js?v=6"></script>'
    if js_anchor not in t: raise SystemExit(f'arithmetic script anchor missing in {filename}')
    t=t.replace(js_anchor,js_anchor+'\n<script src="/assets/99club/games-new-puzzles-v196.js?v=1"></script>',1)
    if filename.endswith('games-play.md'):
        lib='<script src="/assets/99club/games-play-library-v4.js?v=6"></script>'
        if lib not in t: raise SystemExit('play library anchor missing')
        t=t.replace(lib,'<script src="/assets/99club/games-play-new-puzzles-v196.js?v=1"></script>\n'+lib,1)
    else:
        t=t.replace('games-pdf.js?v=26','games-pdf.js?v=27',1)
        t=t.replace('games-app.js?v=26','games-app.js?v=27',1)
    p.write_text(t)
