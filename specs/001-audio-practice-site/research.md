# Research: PracticeEnglish Audio Site

All Technical Context unknowns resolved. Reference project: `~/Dev/comk` (Vite ^7, plain JS, Netlify, no `netlify.toml`).

## D1. Build tooling: Vite + React + TypeScript on Netlify
- **Decision**: Vite 7 `react-ts` template; Netlify builds with `npm run build`, publishes `dist/`, with a `netlify.toml` (SPA fallback `/* → /index.html 200`, long-cache headers for hashed assets).
- **Rationale**: Owner already uses Vite + Netlify (`comk`); constitution mandates TypeScript + React.
- **Alternatives**: Next.js/Astro (SSR/SSG not needed, more weight); Vanilla JS as in comk (violates constitution).

## D2. Audio hosting: dedicated Firebase Hosting site on `audio.practiceenglish.net`
- **Decision**: Create a separate Firebase Hosting site (Spark/free plan) in an existing Firebase project, serve it at `audio.practiceenglish.net`, deploy files from git-ignored `audio-source/`. Long `Cache-Control` (immutable, versioned filenames). `<audio>` uses plain URLs; no CORS needed.
- **Rationale**: Owner already uses Firebase; Hosting is a CDN with HTTP range support (streaming/seek), free tier is sufficient to start (≈10 GB stored; ≈360 MB/day transfer — monitor), requires no billing account, and a subdomain of the owned domain satisfies FR-019 ("own domain"). Keeps audio out of git and Netlify bandwidth. Moving later is a one-variable change (`VITE_AUDIO_BASE_URL`).
- **Caveat**: Firebase Storage's default bucket now requires the paid Blaze plan; if the free transfer cap is hit, upgrade to Blaze (pay-as-you-go, cheap at this scale) or move to Cloudflare R2 (zero egress fees) without code changes.
- **Alternatives**: Audio in the Netlify deploy (bloats repo/deploys, spends Netlify bandwidth); Netlify proxy rewrite to Firebase (double hop, still counts Netlify bandwidth); Firebase Storage (needs Blaze, extra CORS/rules setup); Cloudflare R2 (strong option, but new account/tooling for owner).
- **Open item for owner (not blocking)**: confirm which Firebase project hosts the site and that DNS for `practiceenglish.net` can add a subdomain record.

## D3. Routing
- **Decision**: `react-router-dom` with paths `/:lang?`-free structure: `/`, `/b/:bookId`, `/b/:bookId/u/:unitId`, `/b/:bookId/u/:unitId/t/:trackId`. Language is state, not in URL (so links are language-neutral and shared links open in the recipient's language).
- **Rationale**: FR-005; Netlify SPA rewrite handles deep links.
- **Alternatives**: Hash routing (ugly shareable links); lang-prefixed URLs (SEO-oriented, unneeded, adds complexity).

## D4. Internationalization
- **Decision**: Custom typed lookup. `src/locales/<code>.json` flat keys with `{placeholder}` interpolation; locales are auto-discovered with `import.meta.glob` in `src/i18n/index.ts` (`code` from file name, `nativeName` from `meta.nativeName`). Detection: saved `pe.lang` → first supported of `navigator.languages` (match on primary subtag) → `en`. Missing key → English value. `<html lang>` updated.
- **Rationale**: ~dozens of strings, no plurals beyond trivial; avoids i18next (~40 KB). Meets FR-007–FR-010 and constitution V.
- **Alternatives**: react-i18next / FormatJS (powerful, heavier than needed; revisit if plural/gender rules appear).
- **Catalogue text**: book/unit titles stay as printed (English, `title`); optional `titleTranslations` shown as secondary text only — never replaces the printed title (FR-017).

## D5. Content model
- **Decision**: Single `catalog.json` validated by JSON Schema (Ajv) in `npm run check`; hierarchy level → book → unit → track with stable string IDs; track `label` is the printed number as a string ("12a"); `file` is a path relative to the audio base URL. The validation script also verifies each referenced file exists in `audio-source/`.
- **Rationale**: FR-016, FR-017, constitution III (explicit hierarchy; no parsing display text).
- **Alternatives**: Generating catalogue from file names (fragile; breaks "12a" labels); CMS (overkill).

## D6. Persistence
- **Decision**: `localStorage` keys `pe.lang` (string) and `pe.progress` (`{v:1, bookId, unitId, trackId}`); no position. On load, progress is validated against the catalogue and dropped silently if stale. All access try/catch.
- **Rationale**: FR-010–012; constitution III v2.0.0.

## D7. Player behavior
- **Decision**: Native `<audio>` with custom accessible controls: play/pause, replay, prev/next, speed toggle (0.75×/1×, reset to 1× on track change), loading and error states. `ended` → stop, show Replay/Next. Single `<audio>` element ⇒ one track at a time. `preload="metadata"`; progress saved on track *selection/play*, not on time updates.
- **Rationale**: FR-004, FR-014; spec clarifications.

## D8. Offline / errors
- **Decision**: Online only. Listen to `online`/`offline` events and `<audio>` `error`; show translated notices. No service worker.
- **Rationale**: Spec clarification (no offline mode).

## D9. Testing & quality gates
- **Decision**: Vitest + Testing Library (unit/component), Playwright (Chromium + WebKit emulation, 390×844 mobile) for e2e; locale-parity unit test; `npm run check` = `tsc --noEmit` + ESLint + Vitest + catalogue validation.
- **Rationale**: Constitution IV and quality gates.

## D10. Git initialization
- **Decision**: Task T001 in tasks.md: `git init` (default branch `main`), add `.gitignore` (node_modules, dist, audio-source/, .env*, .firebase, .DS_Store), commit existing `.specify/`, `.claude/`, `specs/` as the initial commit. Spec Kit scripts currently run without git (`BRANCH` is taken from the specs directory name); feature branch `001-audio-practice-site` is created after the initial commit. Remote (GitHub) is optional and the owner's call.
- **Rationale**: Explicit owner request: git setup is the first task.

## D11. Content/legal operations
- **Decision**: Footer credit + non-endorsement text (translated); README documents takedown: delete from `audio-source/`, redeploy audio site, remove catalogue entries, redeploy app.
- **Rationale**: Constitution content constraints; FR-018/019.
