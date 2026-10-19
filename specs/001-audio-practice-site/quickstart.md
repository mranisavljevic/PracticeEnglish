# Quickstart / Validation Guide

Prerequisites: Node 22+, npm; for audio deploy: Firebase CLI logged in.

## 0. Repo setup (first task)
```bash
git init -b main && git add -A && git commit -m "Initial commit: Spec Kit scaffolding and spec"
```

## 1. Run locally
```bash
npm install
cp .env.example .env.local        # VITE_AUDIO_BASE_URL=http://localhost:5174 (local audio) or the Firebase URL
npm run dev
```

## 2. Quality gate
```bash
npm run check        # tsc --noEmit, eslint, vitest, catalogue validation
npm run test:e2e     # Playwright, 390×844 viewport
```

## 3. End-to-end validation scenarios (map to spec stories)
1. **US1**: At 390 px width: Home → pick book → unit → track number → audio plays; Back returns one level; ≤4 taps to play (SC-001).
2. **US2**: Set browser language to Spanish → UI Spanish; switch to English → persists after reload; English book titles still visible; remove one key from `es.json` → English text shown, parity test fails.
3. **US3**: Play a track, reload → Continue card names it; tap → track page, player at 0:00; edit catalogue to remove that track → no Continue, no error.
4. **US4**: No horizontal scroll at 360 px and 1280 px; keyboard-only operation; track ends → stops, Replay/Next visible; speed resets to 1× on next track; offline (DevTools) → translated notice.
5. **Edge**: direct link `/b/…/u/…/t/…` opens and records progress; labels like "12a" render verbatim; storage blocked → app fully works.

## 4. Deploy
- App: connect repo to Netlify (build `npm run build`, publish `dist`), add `practiceenglish.net`, set env `VITE_AUDIO_BASE_URL=https://audio.practiceenglish.net`.
- Audio: `scripts/deploy-audio.sh` (Firebase Hosting site mapped to `audio.practiceenglish.net`).
- Takedown: delete file from `audio-source/`, redeploy audio, remove catalogue entries, redeploy app.

Contracts: [catalog.schema.json](./contracts/catalog.schema.json), [routes.md](./contracts/routes.md), [locale-file.md](./contracts/locale-file.md), [local-storage.md](./contracts/local-storage.md). Entities: [data-model.md](./data-model.md).
