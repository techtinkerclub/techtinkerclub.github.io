# Decision annotations and training equipment — v0.8.0

Decision points are current-step objects: select a player, add Decision point, drag the diamond, edit question and options. Choose Draw preview and click waypoints; Finish preview ends drawing. A demonstrated choice has no duplicate line; alternative runs are dotted, alternative passes dash-dot. They never alter possession, timings, or playback. Decisions toggle affects diagram/export; the slow replay displays them by default. Printed coaching sheets and read-only presentations include written options. The saved object has structured options for future branching; no automatic branch playback or pause is implemented.

Tackle donut: add from Equipment, position at start, select optional intercepting player and stop percentage, Choose rolling target and click on pitch. The generated step uses a straight roll and a planned stop, followed by a down-pad step. The player approaches the selected stop position and changes to a schematic tackle pose at contact. Reset upright to clear the pose. This is not collision detection, simulated impact physics or a live-player tackle. Qualified coach controls equipment and age-appropriate progression.

The default palette includes four player types, equipment, Tackle, Decision point and Text marker. Game phases provides guided set pieces. Manual ruck, maul, scrum and legacy bag-player shortcuts remain in Advanced for standalone phases and older drill compatibility.


## Playable decision branches · v0.13.0 (17 November 2026)

Visual Decision point objects remain available and only annotate possible choices with diagram lines. The new Add playable decision action creates two **real animation timelines** after a shared step.

Classic Studio and its read-only presentation player use the shared branching module. Outcome A and B have independent editable frame suffixes, while all steps up to and including the fork are shared. A viewer opening the read-only link can select A or B. Video output plays chapters labelled A and B, resetting the shared setup for each; movie settings can choose the selected outcome alone. Printed sheets contain one coaching card and individual, clearly labelled chapters for both sequences.

The implementation supports one two-way fork per drill (not nested branches or automatic player decisions). The animation engine does not make tactical judgements; the coach authors both paths. Older drills and annotation-only decision markers remain compatible.

Example seed-132: five defenders step forward together on a signal. One outcome closes a channel for the coach carrying (controlled touch only). The other closes a channel after a backward pass to an attacking runner and illustrates a two-defender tackle. Do not have U10 children tackle an adult coach in live contact.
