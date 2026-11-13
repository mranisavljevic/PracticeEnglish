# Contract: Locale resource file

`src/locales/<code>.json` — flat JSON object of string → string.

- MUST contain `"meta.nativeName"` (display name in the language itself; `fr` → `"Français"`).
- MUST contain every key in `en.json`, and no others.
- Placeholders use `{name}`; the set per key MUST equal English's.
- Registered automatically by filename via `import.meta.glob`; the selector, detection (`navigator.languages` primary subtag) and `<html lang>` follow.
- UI contract: language selector `<select aria-label=t('lang.label')>` lists `English`, `Español`, `Français` (order = glob order); selecting sets `pe.lang` and `document.documentElement.lang`.
