from pathlib import Path

guide=Path('assets/99club/games-help-guides.js')
s=guide.read_text(encoding='utf-8')
s=s.replace('printable game help guide library v1.2.0','printable game help guide library v1.2.1',1)
anchor="    {id:'colourlogic',title:'Colour Logic'"
if anchor not in s:
    raise SystemExit('Colour Logic guide anchor not found')
insert="""    {id:'cornersum',title:'Corner Sum Grid',category:'arithmetic',goal:'Place the digits 1–9 exactly once so every four-cell corner sum matches its circle total.',rules:['Use each digit from 1 to 9 exactly once in the 3×3 grid.','Each circle gives the total of the four cells surrounding that corner/intersection.','A cell can contribute to more than one circle, so the overlapping sums must all work together.'],example:['A circle totals 20 and three of its four cells are 3, 5 and 4.','The missing cell must be 20 − 3 − 5 − 4 = 8.','Before writing 8, check that 8 is not already used and that the crossing circle can still be satisfied.'],strategy:['Start with a circle that has only one blank, then subtract the known cells from its target.','Compare overlapping circles: a value fixed by one sum immediately becomes a clue in another.','Keep track of which digits 1–9 remain unused.'],tip:'When two circles overlap heavily, compare what is different between them instead of recalculating all four cells each time.',watch:'A number can make one circle correct but still be impossible because it repeats a digit or breaks an overlapping circle.'},
    {id:'linkedsum',title:'Linked Sum Grid',category:'arithmetic',goal:'Place the digits 1–9 exactly once so every four-cell circle and every linked A/B/C group total is correct.',rules:['Use each digit from 1 to 9 exactly once in the 3×3 grid.','Each circle is the sum of its four surrounding cells.','The labelled A, B and C groups also have their own printed totals.','All circle and group totals must be true at the same time.'],example:['Suppose group A totals 15 and two known cells in that group are 4 and 6.','The remaining group cell must be 15 − 4 − 6 = 5.','That 5 must also fit any circle that contains the same cell and must not duplicate another digit.'],strategy:['Start with whichever circle or labelled group has the fewest blanks.','Every solved cell belongs to several constraints, so immediately re-check its crossing circle or group.','Use the 1–9 no-repeat rule as an extra constraint when two totals leave more than one possibility.'],tip:'Treat the puzzle as a network of overlapping sums rather than three separate group questions.',watch:'Do not satisfy an A/B/C total in isolation; the same cells may also belong to one or two circle sums.'},
"""
s=s.replace(anchor,insert+anchor,1)
s=s.replace("window.TT99GameHelpGuides={version:'1.2.0'","window.TT99GameHelpGuides={version:'1.2.1'",1)
guide.write_text(s,encoding='utf-8')

page=Path('_pages/99-club-games-help.md')
p=page.read_text(encoding='utf-8')
p=p.replace('covers all <strong>35 current one-player games</strong>','covers all <strong>37 current one-player games</strong>',1)
p=p.replace('aria-label="35 game guides">35','aria-label="37 game guides">37',1)
p=p.replace('/assets/99club/games-help-guides.js?v=1.2.0','/assets/99club/games-help-guides.js?v=1.2.1',1)
page.write_text(p,encoding='utf-8')
