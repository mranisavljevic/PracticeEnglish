# Quickstart: Validating Scan Audio Icon

## Prerequisites
- Node 22, `npm install`.
- Fonts: `pip install fonttools brotli`, then `scripts/subset-font.sh` (reads `~/Desktop/Commissioner/static/`).
- OCR assets: `npx tsx scripts/copy-ocr-assets.ts`.
- Fixtures: convert sample photos (`~/Downloads/*_sample.HEIC`) with `sips -s format png`; commit only badge crops in `tests/fixtures/badges/`, keep full pages in gitignored `tests/fixtures/private/`. E2E clip needs local `ffmpeg` (see `tests/fixtures/badges/README.md`).

## Automated
```bash
npm run check        # typecheck + lint + unit/component tests + catalog validation
npm run test:e2e     # Playwright 390×844; scan.spec.ts uses Chromium fake camera video of a badge
```
Expected: all green; `scan` unit tests cover number→track resolve, nearest-badge/ambiguity, 2-frame stability; component tests cover button visibility (mock `mediaDevices`/`pointer: coarse`), overlay states, and the navigation/back chain; en/es key parity passes.

## Manual (real phone over HTTPS, e.g. `npm run dev -- --host` behind a tunnel or the deployed preview)
1. Select a Level 2 book → unit list shows **Scan audio icon** (also on a unit's track list). Desktop browser: no button. (US3)
2. Tap it, grant camera, aim at a printed badge (try textbook purple and workbook grey, and a page with several badges): number appears within ~5 s; re-aim updates it; nothing opens until **Open**. (US1, SC-001)
3. Tap **Open** → player for that track; back → that unit's track list; browser back behaves the same. Home shows **Continue** for the scanned track. (FR-006, FR-013)
4. Scan a badge not in this book → "not found" message, no navigation. Cover the camera → tips after ~5 s, never a wrong open. (SC-003)
5. Deny camera permission → translated message and **Choose manually** returns to the list. (FR-009)
6. DevTools Network: no requests to third-party hosts (fonts, OCR); camera indicator turns off after closing. (FR-010, FR-015)
7. Fonts: all text including buttons and language selector renders in Commissioner; throttle to Slow 3G → text visible immediately, swaps after load; EN/ES show no missing-glyph boxes; fonts total ≤ ~100 KB. (US4, SC-007)
