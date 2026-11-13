# Data Model

Extends the existing catalogue (`specs/001-audio-practice-site/contracts/catalog.schema.json`).

## Entities

### Level (existing)
`{ id, title }`. `level-1`, `level-3`, `level-4` are now included so placeholders can be grouped; `level-2` unchanged.

### Book (existing, live)
`{ id, levelId, type, title, titleTranslations?, units[] }`. New live book: `level-4-student-book`, type `textbook`, title `English in Action 4: Student Book`, es `English in Action 4: Libro del estudiante`.

### Unit (existing)
`{ id: "unit-N", number: "N", title, tracks[] }`. Vol 4 units 1–5 and 7–14. Unit 6 omitted (no tracks). Rules: a unit has ≥1 track (enforced by the generator, not the schema).

### Track (existing)
`{ id: "track-N", label: "N", file: "level-4/sb/0NN.mp3" }`. Each Vol 4 track belongs to exactly one unit; track 1 belongs to none. Expected total: 76 tracks (77 files − intro).

### ComingSoonBook (new)
| Field | Type | Notes |
|---|---|---|
| id | `id` pattern | Same naming as live books, e.g. `level-1-student-book`; must not equal any live book id |
| levelId | `id` | Must reference an existing level |
| type | `textbook` \| `workbook` | |
| title | string | `English in Action N: Student Book` / `Workbook` |
| titleTranslations | map | `es` |

No `units`, `cover`, or tracks. Stored in the optional top-level `comingSoon` array.

## Placeholder set
`level-1-student-book`, `level-1-workbook`, `level-3-student-book`, `level-3-workbook`, `level-4-workbook`.

## State transition
Placeholder → live: fill that book's range column in `docs/UNITS-DRAFT.md`, run `npm run build:catalog`. The generator moves it from `comingSoon` to `books`. No other change.

## Validation rules (added)
- `comingSoon[].levelId` exists in `levels`; ids unique within `comingSoon` and not colliding with `books` ids.
- Old progress referring to a placeholder id is already ignored by `loadProgress` (not in `books`).
