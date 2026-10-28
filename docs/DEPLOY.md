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
