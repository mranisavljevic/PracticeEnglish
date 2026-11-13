# Contract: catalogue `comingSoon` and UI behaviour

## Catalogue schema change (`catalog.schema.json`)

Add to the root `properties` (root stays `additionalProperties: false`; `required` unchanged, so old catalogues remain valid):

```json
"comingSoon": {
  "type": "array",
  "items": {
    "type": "object",
    "required": ["id", "levelId", "type", "title"],
    "additionalProperties": false,
    "properties": {
      "id": { "$ref": "#/$defs/id" },
      "levelId": { "$ref": "#/$defs/id" },
      "type": { "enum": ["textbook", "workbook"] },
      "title": { "type": "string", "minLength": 1 },
      "titleTranslations": { "$ref": "#/$defs/translations" }
    }
  }
}
```

Additional rules (in `scripts/catalog-rules.ts`): `levelId` exists; `comingSoon` ids unique and disjoint from `books` ids.

## TypeScript API (`src/content/catalog.ts`)

- `Catalog.comingSoon?: ComingSoonBook[]`
- `getComingSoon(id): ComingSoonBook | undefined`
- `getBook(id)` never returns a placeholder.
- `booksByLevel()` returns `{ level, books, comingSoon }[]`, keeping levels that have either, in level order.

## UI contract

| Surface | Behaviour |
|---|---|
| Home | Per level: live books first, then placeholder tiles. A tile is not a link, has no tab stop, shows book title, translated title (es), and a visible "Coming soon" badge. Activating it does nothing. |
| `/b/<placeholder-id>` | Shows the title and "This book isn't available yet" with a link home. No 404 error styling, no ScanButton. |
| `/b/<placeholder-id>/u/…` | Existing NotFound. |
| Resume / scan / analytics | Unaffected; placeholders are not in `books`. |

## Strings (en / es)

| Key | en | es |
|---|---|---|
| `book.comingSoon` | Coming soon | Próximamente |
| `book.unavailable` | This book isn't available yet. Check back soon. | Este libro aún no está disponible. Vuelve pronto. |

## Generator contract (`npm run build:catalog`)

- Book is live iff its range column in `docs/UNITS-DRAFT.md` is non-empty; otherwise it goes to `comingSoon`.
- Units with zero existing tracks are omitted; `OMITTED` tracks excluded (`4/sb: [1]`).
- Output must pass `validateCatalog` and `npm run validate:catalog`.
