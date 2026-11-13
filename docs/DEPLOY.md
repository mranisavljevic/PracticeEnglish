# First deploy

Two hosts: the app on Netlify (`practiceenglish.net`) and the audio on Firebase Hosting (`audio.practiceenglish.net`).

## 1. App on Netlify
1. Netlify → Add new site → Import from Git → pick `mranisavljevic/PracticeEnglish`. Build command `npm run build`, publish dir `dist` (also set in `netlify.toml`).
2. Site settings → Environment variables: `VITE_AUDIO_BASE_URL=https://audio.practiceenglish.net`.
3. Domain management → Add `practiceenglish.net`; add the DNS records Netlify shows at your registrar.

## 2. Audio on Firebase (Spark plan)
1. Create a project at console.firebase.google.com, then Build → Hosting → Get started.
2. `npm i -g firebase-tools && firebase login`.
3. The project id goes in `.firebaserc` at the repo root (`firebase.json` is there too; Firebase requires the hosting folder `audio-source/` to sit inside the project directory).
4. Hosting → Add custom domain → `audio.practiceenglish.net`; add the exact A/TXT records Firebase displays at your registrar and wait for the certificate.
5. Put the audio in `audio-source/` (see `docs/SOURCES.md`), then run `scripts/deploy-audio.sh`.

## 3. Verify
- Both `https://practiceenglish.net` and `https://audio.practiceenglish.net` show a valid HTTPS certificate.
- `curl -I -H "Range: bytes=0-99" https://audio.practiceenglish.net/<a real file path>` returns `206`.
- Open the live site, pick a track, tap Play: audio starts.

## 4. Roll back / take a file down
- Remove the file from `audio-source/`, run `scripts/deploy-audio.sh`, delete its entries from `src/content/catalog.json` and its row from `docs/SOURCES.md`, push (Netlify redeploys).
- To roll back the app: Netlify → Deploys → pick a previous deploy → Publish deploy. For audio: Firebase console → Hosting → release history → Rollback.

## 5. Usage analytics (optional)
Google Analytics 4, loaded only after the visitor accepts the consent banner and never when the browser sends Do Not Track or Global Privacy Control. The app sends five events (`visit`, `track_started`, `resume_used`, `language_changed`, `error`); no personal data is deliberately collected.
1. In Google Analytics, create a separate web data stream for PracticeEnglish: Enhanced measurement off, Google signals off, event data retention 2 months. Register event-scoped custom dimensions `app`, `ui_lang`, `device_class`, `source`, `error_type`, `level`, `book_type`, `unit`, `track`.
2. Site settings → Environment variables: `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX` — scope it to the **Production** context only. When unset (dev, tests, deploy previews) the client loads nothing from Google. Optional `VITE_CONSENT_PROMPT=off` treats consent as granted and hides the banner.
3. Redeploy, then confirm in GA DebugView that only the five events arrive.
