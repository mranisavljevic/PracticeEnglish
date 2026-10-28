# Data Model: Scan Audio Icon

No persisted data is added. The catalog (`Book → Unit → Track`) is unchanged. All types below are in-memory.

## BadgeCandidate
| Field | Type | Notes |
|---|---|---|
| `box` | `{x,y,w,h}` | In frame pixels |
| `distance` | `number` | Badge center → frame center, normalized by frame diagonal |
| `crop` | `ImageData` | Numeral region prepared for OCR |

Rules: kept only if filled-rectangle checks pass (research D2); sorted by `distance`.

## Selection (result of `pickBadge(candidates)`)
`{ kind: 'badge', candidate } | { kind: 'ambiguous' } | { kind: 'tooSmall' } | { kind: 'none' }`
Ambiguous when runner-up distance ≤ 1.15 × best.

## Reading
`{ number: string, confidence: number }` — digits only, 1–4 characters, confidence ≥ 70 to count.

## ScanResult
`{ number: string; match?: { unitId: string; trackId: string } }`
`match` is set by `resolve(book, number)`; absent ⇒ "not found in this book". Track `label` equals the printed number for numbered tracks.

## Scanner state machine (`useScanner`)
```
starting → scanning ⇄ detected(result)        (confirm → closed + navigate)
              │            └→ notFound(number)
              ├→ tips (no reading ≥ ~5 s, or ambiguous / tooSmall)
starting → error(denied | unavailable)         (offers "choose manually")
any → closed (stream stopped, worker terminated)
```
Transitions to `detected`/`notFound` require the same number in 2 consecutive frames; a new stable different number replaces the displayed one.
