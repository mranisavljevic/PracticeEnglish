# Persisted State Contract

All access via `src/storage/safeStorage.ts` (try/catch; failures behave as "nothing stored").

| Key | Value | Written when | Read behavior |
|---|---|---|---|
| `pe.lang` | locale code string | Student picks a language | Valid only if registered; else detect from browser, else `en` |
| `pe.progress` | `{"v":1,"bookId":"…","unitId":"…","trackId":"…"}` | Track page opened / play pressed | Parsed + validated against catalogue; wrong version, bad JSON or unknown ids ⇒ ignored (no error shown) |

Never stored: playback position, playback speed, any personal data.
