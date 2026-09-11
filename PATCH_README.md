# 99 Club Studio v1.28.0 patch

Apply this overlay directly over the accepted **v1.27.0** repository.

## Main changes

- Adds five compact numeric-logic engines: Kakuro / Cross Sums, Futoshiki, Arithmetic Cages, Nonograms and Number Paths.
- Reorganises the Games library into highlighted accordion categories with category select/clear, global Clear all, and a Selected games tray.
- Adds optional Games-pack personalisation: pack title, school name, class/year label, date and locally processed school logo.
- Parks Arithmetic Domino Chain from the selectable one-player library while retaining the experimental engine for possible future cut-and-match use.
- Keeps per-game Configure / Done settings and selective activity replacement.
- Retains separate pupil, answer and combined PDF downloads.

After deployment, hard-refresh `/tools/99-club/games/` once because the Games assets are cache-bumped.
