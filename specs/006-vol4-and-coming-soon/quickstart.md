# Quickstart: validating Vol 4 & Coming Soon

Prerequisites: `npm install`; `audio-source/` present locally.

## Automated

```sh
npm run build:catalog      # regenerate catalog.json from docs/UNITS-DRAFT.md
npm run check              # typecheck, lint, vitest, catalogue validation
npm run test:e2e           # Playwright (mobile viewport)
```

Expected: all pass; `build:catalog` reports the new book count (3 live books: Vol 2 SB, Vol 2 WB, Vol 4 SB).

## Manual (US1 — Volume 4)

1. `npm run dev:audio:real` and `VITE_AUDIO_BASE_URL=http://localhost:5174` in `.env.local`; `npm run dev`.
2. Home shows "English in Action 4: Student Book" as a normal link. Open it: units 1–5 and 7–14 (13 units; unit 6 absent because tracks 28–34 do not exist).
3. Unit 1 lists tracks 2–6; unit 5 lists 24–27; unit 7 starts at 35; unit 14 ends at 84. Track 1 appears nowhere.
4. Play a track; reload; Continue card returns to it.
5. Scan a Vol 4 track icon (or use the scan test fixture): resolves to the correct unit/track.

## Manual (US2 — placeholders)

1. Home shows five greyed tiles with a "Coming soon" badge: Vol 1 SB/WB, Vol 3 SB/WB, Vol 4 WB. Click/tap/Tab: nothing happens, no tab stop.
2. Switch to Spanish: "Próximamente" and translated titles.
3. Screen reader (or accessibility tree): each tile reads title + "Coming soon".
4. Visit `/b/level-1-student-book` directly: friendly "isn't available yet" page with a link home.

## Manual (US3 — release)

Fill the Level 3 "SB tracks" column in `docs/UNITS-DRAFT.md`, run `npm run build:catalog`: Vol 3 SB becomes live, the other four stay greyed. Revert afterwards.

## Regression (SC-005)

Vol 2 SB/WB unit and track lists identical to before (`git diff` on `catalog.json` shows only additions for level 4 and `comingSoon`).
