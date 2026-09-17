from pathlib import Path

# Engine: do not allocate all 4x4 binary states on every page load.
p=Path('assets/99club/games-new-puzzles-v196.js')
t=p.read_text()
old="const GRID_STATE_CACHE={3:bitStates(3),4:bitStates(4)};"
new="const GRID_STATE_CACHE={};\nfunction gridStates(n){return GRID_STATE_CACHE[n]||(GRID_STATE_CACHE[n]=bitStates(n));}"
if old not in t: raise SystemExit('grid cache anchor missing')
t=t.replace(old,new,1)
t=t.replace("const states=GRID_STATE_CACHE[n],all=gridPool(solution,n)","const states=gridStates(n),all=gridPool(solution,n)",1)
t=t.replace("const n=c.difficulty==='challenge'?4:3,states=GRID_STATE_CACHE[n];", "const n=c.difficulty==='challenge'?4:3,states=gridStates(n);",1)
# Count rules are grid-specific. If a row is explicitly requested, gracefully use a mixed row clue pool.
t=t.replace("picked=chooseUniqueRow(solution,c.difficulty,c.ruleStyle,rng)","picked=chooseUniqueRow(solution,c.difficulty,c.ruleStyle==='count'?'mixed':c.ruleStyle,rng)",1)
# If the user selects Count focus with Auto layout, give them the grid where count rules are meaningful.
t=t.replace("layout=c.layout==='auto'?(rng()<.5?'row':'grid'):c.layout;", "layout=c.layout==='auto'?(c.ruleStyle==='count'?'grid':(rng()<.5?'row':'grid')):c.layout;",1)
# Make Challenge's multiple-balance requirement visible in normalized settings, not just silently enforced by generation.
old="function normMobile(raw={}){return {difficulty:DIFFS.includes(raw.difficulty)?raw.difficulty:'standard',layout:['auto','simple','nested','multiple'].includes(raw.layout)?raw.layout:'auto',givenMode:['auto','shape','total'].includes(raw.givenMode)?raw.givenMode:'auto'};}"
new="function normMobile(raw={}){const difficulty=DIFFS.includes(raw.difficulty)?raw.difficulty:'standard';let layout=['auto','simple','nested','multiple'].includes(raw.layout)?raw.layout:'auto';if(difficulty==='challenge'&&layout!=='auto')layout='multiple';if(difficulty==='easy'&&layout==='multiple')layout='simple';return {difficulty,layout,givenMode:['auto','shape','total'].includes(raw.givenMode)?raw.givenMode:'auto'};}"
if old not in t: raise SystemExit('normMobile anchor missing')
t=t.replace(old,new,1)
p.write_text(t)

# PDF cleanup only; no visual change.
p=Path('assets/99club/games-pdf.js')
t=p.read_text()
old="function drawMobileShape(page,id,cx,cy,s){const stroke=[88,111,116],fill=answers_dummy=>null;"
new="function drawMobileShape(page,id,cx,cy,s){const stroke=[88,111,116];"
if old not in t: raise SystemExit('drawMobileShape cleanup anchor missing')
p.write_text(t.replace(old,new,1))

# Printable preview mobile needs explicit vector styling (paper remains identifiable in B&W because shapes differ).
p=Path('assets/99club/games-new-puzzles-v196.css')
t=p.read_text()
old=".tt99-mobile-paper-svg{width:100%;max-height:180px}.tt99-mobile-paper-values"
new=".tt99-mobile-paper-svg{width:100%;max-height:180px}.tt99-mobile-paper-svg .bar{stroke:#607e82;stroke-width:6;stroke-linecap:round}.tt99-mobile-paper-svg .string,.tt99-mobile-paper-svg .top-total line{stroke:#6f8b8e;stroke-width:1.8}.tt99-mobile-paper-svg .pivot{fill:#fff;stroke:#607e82;stroke-width:1.6}.tt99-mobile-paper-svg .top-total circle{fill:#fff;stroke:#607e82;stroke-width:1.7}.tt99-mobile-paper-svg .top-total text{fill:#294e53;text-anchor:middle;font:800 12px/1 sans-serif}.tt99-mobile-paper-svg .s-circle{fill:#668ba8}.tt99-mobile-paper-svg .s-square{fill:#c88946}.tt99-mobile-paper-svg .s-triangle{fill:#62987a}.tt99-mobile-paper-svg .s-diamond{fill:#a96d64}.tt99-mobile-paper-svg .s-star{fill:#856b99}.tt99-mobile-paper-values"
if old not in t: raise SystemExit('paper svg css anchor missing')
p.write_text(t.replace(old,new,1))

# Online mobile: keep the tilt subtle enough that recursive strings do not visually detach.
p=Path('assets/99club/games-play-new-puzzles-v196.js')
t=p.read_text()
t=t.replace("tilt=Math.max(-8,Math.min(8,(b-a)/m*14));","tilt=Math.max(-4,Math.min(4,(b-a)/m*8));",1)
p.write_text(t)
