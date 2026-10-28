# Remaining work

## 1. Fill in the unit track ranges (T067b)

MVP ships **Level 2 only** (ranges done, track 1 of each book omitted as a title read). Levels 1, 3 and 4 are hidden via `HIDDEN_LEVELS` in `scripts/build-catalog.ts`. For each level you finish below, remove it from that set and run `npm run build:catalog`.

- [ ] For Levels 1, 3 and 4, open each book and fill the blank "SB tracks" and "WB tracks" columns in `docs/UNITS-DRAFT.md` (ranges like `1-8, 10`)
- [ ] Check the gaps in `docs/AUDIO-GAPS-AND-DUPLICATES.txt` against the printed books:
  - [ ] Level 1 Student Book: tracks 18–19
  - [ ] Level 4 Student Book: tracks 28–34
- [ ] Check each book's last printed track number (a gap past the highest file can't be detected)
- [ ] Confirm the filename numbers match the track numbers printed in the books
- [ ] Confirm each Workbook uses the same unit numbering as its Student Book
- [ ] If a gap is a real missing recording: find the audio, add it to `audio-source/` and a row in `docs/SOURCES.md`
- [ ] Run `npm run build:catalog`, then `npm run validate:catalog` (or ask Claude to finish T067b)

## 2. Check the app by eye (T065)

- [ ] Start the real audio: `npm run dev:audio:real`
- [ ] Put `VITE_AUDIO_BASE_URL=http://localhost:5174` in `.env.local`, then run `npm run dev`
- [ ] Go through `specs/001-audio-practice-site/quickstart.md` scenarios 1–5 at each width:
  - [ ] 390px
  - [ ] 360px
  - [ ] 1280px
- [ ] Confirm a track actually plays with sound

## 3. First deploy (T069), following `docs/DEPLOY.md`

- [ ] Create the Netlify site from the repo; set `VITE_AUDIO_BASE_URL=https://audio.practiceenglish.net`
- [ ] Add `practiceenglish.net` and its DNS records at your registrar
- [ ] Create the Firebase project and Hosting site (Spark plan)
- [ ] Put the Firebase project id in `firebase/.firebaserc` (replace the placeholder)
- [ ] Add `audio.practiceenglish.net` and its DNS records
- [ ] Run `scripts/deploy-audio.sh`
- [ ] Verify HTTPS is valid on both hosts
- [ ] Verify `curl -I -H "Range: bytes=0-99" https://audio.practiceenglish.net/level-1/sb/001.mp3` returns `206`
- [ ] Play a track on the live site
- [ ] Measure in Chrome DevTools (Fast 3G, cache disabled):
  - [ ] Home screen shows selectable books in under 3 s
  - [ ] Audio plays within 3 s of tapping play
- [ ] Record the measured times in the README (replace "not yet measured")
- [ ] Tell Claude about any step that failed so `docs/DEPLOY.md` can be corrected

## 4. Optional

- [ ] Have a Spanish speaker review `src/locales/es.json` and the Spanish book titles
- [ ] Translate unit titles (currently English only)
- [ ] Trim the bundle (about 107 KB gzipped vs ~100 KB target)
- [ ] Merge `001-audio-practice-site` into `main`
