from pathlib import Path

guide=Path('assets/99club/games-help-guides.js')
s=guide.read_text(encoding='utf-8')
s=s.replace('printable game help guide library v1.1.0','printable game help guide library v1.2.0',1)

old="""    {id:'brokencalc',title:'Broken Calculator',category:'arithmetic',goal:'Make each target using only the calculator keys that still work.',rules:['Only the printed working digits and operation keys may be pressed.','You may usually press a working key more than once unless the puzzle says otherwise.','Your final displayed value must equal the target.'],example:['Working keys include 2, 3, + and ×. Target: 12.','One route is 3 × 2 × 2.','Pressing 3 × 2 × 2 = gives 12 using only the listed working keys.'],strategy:['Factor the target into numbers you can build with the available keys.','If a useful digit is broken, make that value from working digits first.'],tip:'Write a candidate key sequence before checking it.',watch:'A correct numerical result does not count if your method used a broken key.'},"""
new="""    {id:'brokencalc',title:'Broken Calculator',category:'arithmetic',goal:'Make each target using only the calculator keys that still work.',rules:['Only the printed working digits and operation keys may be pressed.','You may press a working key more than once.','Normal order of operations applies: multiplication and division before addition and subtraction.','Your final displayed value must equal the target.'],example:['Working keys include 2, 5, 7, + and ×. Target: 17.','Enter 7 + 2 × 5.','Multiplication is worked out first, so 7 + 10 = 17.'],strategy:['Factor the target or work backwards from it using only the available keys.','When an expression mixes operations, calculate multiplication and division before addition and subtraction.'],tip:'Estimate a candidate expression before pressing =, especially when it mixes +/− with ×/÷.',watch:'The calculator follows normal order of operations. It does not work strictly from left to right.'},"""
if old not in s:
    raise SystemExit('Broken Calculator guide anchor not found')
s=s.replace(old,new,1)

anchor="    {id:'alphametics-placeholder',title:'',category:'logic',hidden:true}"
additions="""    {id:'colourlogic',title:'Colour Logic',category:'logic',goal:'Use all the clues to work out the only colour arrangement that fits.',rules:['In a colour row, use each listed colour exactly once.','Read every position, order, neighbour and distance clue carefully; all clues must be true at the same time.','In a colour grid, follow the printed row, column, diagonal, corner or adjacency rules for that puzzle.'],example:['Suppose Red is immediately left of Blue, Green is at one end, and Red is not at an end.','Place Green at an end first, then test the possible Red–Blue neighbouring pair.','Keep only the arrangement that also satisfies every remaining clue.'],strategy:['Start with the strongest clues: exact positions, ends and immediately-next-to relationships.','Treat linked colours as a block when a clue fixes their relative positions, then use the weaker clues to eliminate the remaining possibilities.'],tip:'After placing a colour, re-read every clue that mentions it; one placement often unlocks another.',watch:'A placement that satisfies one clue is not enough. The finished row or grid must satisfy every clue together.'},
    {id:'mobilebalance',title:'Mobile Balance',category:'algebra',goal:'Work out the value of each shape so every hanging bar is balanced.',rules:['The suspension point is in the middle of each bar, so the total weight on the left equals the total weight on the right.','Repeated copies of a shape each have the same value, so three stars weigh three times one star.','For a nested mobile, the whole lower branch acts as one combined weight on the bar above it.','If a number appears in the top circle, it is the total weight of the whole mobile.'],example:['A lower bar has two circles balancing one triangle. If each circle is 6, the triangle must be 12.','That lower branch therefore weighs 12 + 12 = 24 altogether.','Use 24 as the hanging weight of that whole branch when solving the bar above it.'],strategy:['Start at the lowest bar where enough values are known to compare both sides directly.','Once a lower bar is solved, add the weights in that whole branch and carry that total upwards.'],tip:'In online play, enter a value and watch the bar respond: the heavier side drops and the lighter side rises.',watch:'Do not compare only the nearest shape on a nested branch. Everything hanging below that attachment point contributes to its total weight.'},
    {id:'alphametics-placeholder',title:'',category:'logic',hidden:true}"""
if anchor not in s:
    raise SystemExit('Guide insertion anchor not found')
s=s.replace(anchor,additions,1)

s=s.replace("p.innerHTML=p.innerHTML.replace(/\\b32 current one-player games\\b/,'33 current one-player games');","p.innerHTML=p.innerHTML.replace(/\\b\\d+ current one-player games\\b/,`${visibleGuides.length} current one-player games`);",1)
s=s.replace("window.TT99GameHelpGuides={version:'1.1.0'","window.TT99GameHelpGuides={version:'1.2.0'",1)
guide.write_text(s,encoding='utf-8')

page=Path('_pages/99-club-games-help.md')
p=page.read_text(encoding='utf-8')
p=p.replace('covers all <strong>33 current one-player games</strong>','covers all <strong>35 current one-player games</strong>',1)
p=p.replace('aria-label="33 game guides">33','aria-label="35 game guides">35',1)
p=p.replace('/assets/99club/games-help-guides.js?v=1.1.0','/assets/99club/games-help-guides.js?v=1.2.0',1)
page.write_text(p,encoding='utf-8')
