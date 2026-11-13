# Data Model: French Translation

## Locale
| Field | Source | Rule |
|---|---|---|
| code | file name `src/locales/fr.json` → `fr` | lowercase primary subtag; matches `navigator.languages` primary subtag |
| nativeName | key `meta.nativeName` | `"Français"`, non-empty |
| strings | all other keys | flat `Record<string,string>` |

## Translation string
- **Key set**: identical to `en.json` (60 keys), no extras (FR-010; enforced by `tests/unit/locale-parity.test.ts`).
- **Placeholders**: `{name}` tokens must match English per key (same set, order may differ for French word order).
- **Register**: formal "vous" only (FR-011).
- **Fallback**: missing key → English text (existing `createTranslator`); parity test prevents this in practice.

## Persistence
`localStorage['pe.lang']` ∈ registered codes (`en`, `es`, `fr`). No migration; existing values remain valid.
