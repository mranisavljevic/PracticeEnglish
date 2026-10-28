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

## Adding a language
Add `src/locales/<code>.json` with every key from `en.json` plus `"meta.nativeName"`. No code changes; a test checks parity.

## Deploy
See [docs/DEPLOY.md](docs/DEPLOY.md). Measured load times (SC-004/SC-005): _not yet measured_.

## Takedown
On a rights-holder request: delete the file from `audio-source/`, redeploy audio (`scripts/deploy-audio.sh`), remove the catalogue entries and `docs/SOURCES.md` row, redeploy the app.

## Privacy and legal
No analytics or cookies; progress and language are kept only in the browser's localStorage. Netlify and Firebase keep ordinary server logs. Audio and books belong to the publisher of *English in Action*; this site is not affiliated with or endorsed by the publisher.
