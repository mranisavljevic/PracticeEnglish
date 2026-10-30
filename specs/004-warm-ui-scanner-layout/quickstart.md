# Quickstart: Validate Warm UI & Scanner Layout

## Prerequisites

`npm install`; Node ≥ 22.12.

## Automated

```bash
npm run check          # typecheck, lint, vitest, catalog validation
npm run test:e2e       # includes scan.spec.ts at 360x640
```

Expected: all pass, including new tests for zone order, error-state layout, token contrast, button clearance ≥ 16px, and viewport height ≥ 15% smaller than before.

## Manual

1. `npm run dev`, open at a phone-sized viewport (360×640).
2. Home, book, unit and track pages: background is cream, no stark white patches, blue unchanged.
3. Open the scanner: title + instructions at top, smaller camera in the middle, status + buttons at the bottom with visible space under the buttons.
4. Block camera permission: title at top, error text at bottom, "Choose manually" reachable.
5. Switch to Spanish and repeat step 3; text wraps without pushing buttons off-screen.
6. Rotate to landscape: everything stays visible; the viewport shrinks first.
7. Scan a real audio icon: the track is detected as before.

See [ui-contract.md](./contracts/ui-contract.md) and [data-model.md](./data-model.md).
