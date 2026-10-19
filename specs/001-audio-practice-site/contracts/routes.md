# URL Contract

Language-neutral, shareable, resolved client-side (Netlify rewrites `/* → /index.html 200`).

| Path | Screen | Notes |
|---|---|---|
| `/` | Home: Continue card (if valid progress) + books grouped by level | |
| `/b/:bookId` | Unit list for a book | Unknown id ⇒ NotFound |
| `/b/:bookId/u/:unitId` | Track list for a unit (numbers as printed) | |
| `/b/:bookId/u/:unitId/t/:trackId` | Player for a track | Visiting records progress; audio does not autoplay on direct load (browser policy) — one tap plays |
| `*` | NotFound with link Home | Translated |

- Back navigation = browser history / visible Back control to the parent path.
- Continue = link to the saved track path.
- Audio URL = `${VITE_AUDIO_BASE_URL}/${track.file}` (default `https://audio.practiceenglish.net`).
