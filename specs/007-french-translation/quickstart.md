# Quickstart: Validate French

Prereqs: `npm install`.

1. **Automated**: `npm run check` — parity (keys/placeholders/nativeName), French detection, formal-register tests pass.
2. **E2E**: `npm run test:e2e -- language responsive` — French device journey, persistence after reload, no overflow at 360px.
3. **Manual**: `npm run dev`; open with browser language `fr-CA` (or pick "Français") and walk home → book → unit → track → play; trigger offline and `/nope`; confirm no English/Spanish UI text, titles still English, `document.documentElement.lang === 'fr'`.
4. **Release gate**: French speaker reviews `src/locales/fr.json` (see spec Assumptions).
