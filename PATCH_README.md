# v1.24.2 printer-friendly Crossword patch

Apply directly over **99 Club Studio v1.24.1**.

This patch replaces the newspaper-style blocked Crossword presentation with the accepted classroom freeform criss-cross design:
- only answer cells are drawn;
- no black squares;
- no large enclosing crossword square;
- thin printer-friendly cell outlines;
- exact occupied footprint for better scaling;
- same footprint in pupil and teacher-answer PDFs.

The existing three PDF download choices remain unchanged: pupil sheets, answer key, and combined pupil + answers.

After deploying, hard-refresh `/tools/99-club/games/`.
