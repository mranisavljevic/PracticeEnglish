# Translation Contract

- File: `src/locales/<code>.json`, flat `{ "key": "text" }`, UTF-8. `<code>` is a BCP-47 primary subtag (`en`, `es`).
- Interpolation: `{name}` placeholders, e.g. `"continue.title": "Continue: {track}"`.
- Registration: none. Locales are auto-discovered from `src/locales/*.json`; adding a language is only adding a file. Each file MUST contain `"meta.nativeName"` (shown in the switcher, e.g. "Español").
- Invariants (tested): every `en.json` key exists in every locale; placeholders match across locales; no component contains literal user-facing text.
- Runtime: missing key ⇒ English value ⇒ (dev only) console warning.
- Required key groups: `app.*`, `nav.*`, `home.*`, `book.*`, `unit.*`, `player.*` (play, pause, replay, next, previous, speed, loading), `error.*` (audioFailed, offline, notFound, retry), `credit.*` (source, noEndorsement), `lang.*`.
