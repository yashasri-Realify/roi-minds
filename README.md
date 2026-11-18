# Realify for ROI Minds

A static site (no build step). Lives outside the realify-app repo, so deleting this folder removes everything.

- `index.html` is the page. `v/` has the 11 films (`.webm`) and their posters (`.jpg`). `samples/` has two PDFs and their previews. `assets/` has the Realify logo.
- Preview locally: `python3 -m http.server 8765` in this folder, then open http://127.0.0.1:8765
- Deploy to Vercel: `npx vercel` in this folder (framework "Other", no build command, output directory `.`).
- Re-render films after editing `film/engine.js` or `film/film.html`: `node tools/render.mjs [A1 B2 ...]` (uses Playwright and its bundled ffmpeg from `apps/realifyai`).
- Re-render the sample PDFs: `node tools/render_samples.mjs`.

All figures in the films, samples and calculators are illustrative. The ROI Minds figures at the top of the page come from roiminds.com.
