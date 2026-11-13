# Research: French Translation

## Decision 1: Add locale via resource file only
- **Decision**: Create `src/locales/fr.json`; no code changes.
- **Rationale**: `src/i18n/index.ts` globs `../locales/*.json`; `getLocales`, `isSupported`, `detectLanguage`, the switcher and `<html lang>` all derive from it. Matches constitution II and README "Adding a language".
- **Alternatives**: Hand-registering locales in code (rejected: contradicts constitution II, adds code).

## Decision 2: Regional French variants
- **Decision**: Rely on existing primary-subtag matching (`fr-CA` → `fr`).
- **Rationale**: `detectLanguage` splits on `-`; already satisfies FR-004. Verified by new unit tests rather than code.
- **Alternatives**: Per-region locales (rejected: spec says standard international French).

## Decision 3: Formal register and typography
- **Decision**: "vous" throughout; use `…` and `×` as in English; non-breaking space (U+00A0) before `:`, `?`, `!`, `;`, and inside « » if used; typographic apostrophe `’` is NOT required — use straight `'` to match existing files and avoid mixed styles.
- **Rationale**: Clarification session answer; French typographic conventions in the spec edge cases. Note `unit.heading` "Unité {number} : {title}" and `consent.title` "…PracticeEnglish ?" need NBSP.
- **Alternatives**: Plain spaces (rejected: line breaks before punctuation).

## Decision 4: Titles untranslated
- **Decision**: Book/track titles come from the catalog and stay English; `app.name` stays "PracticeEnglish"; "English in Action" kept verbatim in `credit.source` and `app.tagline`.
- **Rationale**: FR-005 and constitution II.

## Decision 5: Verifying "vous" and length
- **Decision**: Add a unit test that rejects tu-forms (`\b(tu|ton|ta|tes|toi|te)\b` in fr values) and a Playwright 360px check in French. Full-width layout already wraps (Spanish is similarly long).
- **Rationale**: FR-011, FR-008 need automation per constitution IV.
- **Alternatives**: Manual review only (rejected: regressions).

## Decision 6: Existing tests that assume `fr` is unsupported
- **Decision**: `tests/unit/i18n-detect.test.ts` uses `fr` as the "unsupported" example in three places; switch those to `de`, and add French cases.
- **Rationale**: Would otherwise fail once `fr.json` exists.

## Decision 7: Translation review
- **Decision**: Draft `fr.json` here (machine-assisted); the spec requires French-speaker review before release — tracked as a release checklist item, not a code task.
