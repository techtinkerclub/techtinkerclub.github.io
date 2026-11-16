# Rugby Coaching Studio — v0.2.1

Standalone web application for grassroots rugby coaches. No build step or npm dependencies.

## Structure
- index.html — editor, dialogs and application shell
- assets/studio.css — visual styles and responsive layout
- js/model.js — vector objects, common utilities and sample drill
- js/app.js — editor, scenes, playback, coaching cards, persistence and library UI
- js/resources.js — international resource directory
- data/drills.json — versioned catalogue of 54 coaching activity records

## Development
Serve the repository root with a static HTTP server and navigate to /rugby/. ES modules and JSON loading require HTTP(S), not opening index.html from the filesystem. No changes to the parent Jekyll site are required.

## Data and access
Built-in records are editable adaptations, not official governing-body reproductions. Check the applicable RFU age-grade rules and contact guidance before use. Each record can include instructions, safety, progression, coaching questions, notes, source links and frames. User edits are stored in browser localStorage; use JSON export/import to transfer data or back it up.

This repository and GitHub Pages site are public: the noindex tag is not authentication. Do not store personal or identifiable player information here. Shared coach-only accounts/storage are not implemented in this release.
