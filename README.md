# PracticeEnglish

A mobile-first site for playing the *English in Action* audio: pick a book, unit and track number and listen. English and Spanish interface, remembers your last track on the device (no account).

## Develop
```bash
npm install
cp .env.example .env.local     # VITE_AUDIO_BASE_URL=http://localhost:5174
npm run dev:audio              # serves tests/fixtures/audio (or set AUDIO_ROOT=audio-source) on :5174
npm run dev
```
- `npm run check` — typecheck, lint, unit/component tests, catalogue validation.
- `npm run test:e2e` — Playwright (Chromium + WebKit, 390×844). First run: `npx playwright install chromium webkit`.

## Content
- Catalogue: `src/content/catalog.json` (level → book → unit → track; track `label` is verbatim, e.g. "12a"). Validated by `npm run validate:catalog`.
- MVP scope: only Level 2 is in the catalogue; Levels 1, 3 and 4 are hidden (`HIDDEN_LEVELS` in `scripts/build-catalog.ts`) until their unit ranges are filled in. Tracks to leave out (e.g. title reads) go in `OMITTED` in the same file.
- Real audio lives in git-ignored `audio-source/`; every file must be listed in `docs/SOURCES.md` or validation fails.

## Scan audio icon

On touch devices with a camera, the Book and Unit pages offer **Scan audio icon**: aim at a printed badge, confirm the detected number, and the track opens. Recognition runs on the device (tesseract.js); nothing is uploaded.

- OCR assets are self-hosted in `public/ocr/`. Refresh them with `npm run copy:ocr` (downloads the fast English model once).
- The typeface (Commissioner 400/600/700) is self-hosted in `public/fonts/`. Regenerate with `scripts/subset-font.sh` (needs `python3 -m pip install fonttools brotli`; set `FONT_SRC` to the folder holding the downloaded font and its `OFL.txt`).
- The scan e2e test feeds a recorded badge clip to Chromium as a fake camera; see `tests/fixtures/badges/README.md`. Full-page publisher photos belong in the gitignored `tests/fixtures/private/`.

## Analytics

Anonymous, cookieless usage counts (visits, language, phone or desktop, which tracks start and how, errors) go to a first-party Netlify Function and are stored as Netlify Blobs. The client sends nothing unless `VITE_ANALYTICS_ENDPOINT` is set (Production only) and honours Do Not Track and Global Privacy Control. Setup and env vars: [docs/DEPLOY.md](docs/DEPLOY.md). Read the numbers with `ANALYTICS_REPORT_TOKEN=… npm run report -- --from 2026-10-01 --to 2026-10-29`.

## Adding a language
Add `src/locales/<code>.json` with every key from `en.json` plus `"meta.nativeName"`. No code changes; a test checks parity.

## Deploy
See [docs/DEPLOY.md](docs/DEPLOY.md). Measured load times (SC-004/SC-005): _not yet measured_.

## Takedown
On a rights-holder request: delete the file from `audio-source/`, redeploy audio (`scripts/deploy-audio.sh`), remove the catalogue entries and `docs/SOURCES.md` row, redeploy the app.

## Privacy and legal
No cookies and no third-party analytics. Progress and language are kept only in the browser's localStorage. Anonymous usage counts (see Analytics) hold no IP, user-agent or persistent identifier, and the footer says so. Netlify and Firebase keep ordinary server logs. Audio and books belong to the publisher of *English in Action*; this site is not affiliated with or endorsed by the publisher.
