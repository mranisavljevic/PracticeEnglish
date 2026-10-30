# Data Model

No persisted or catalog data changes. The only "entities" are design tokens and UI state.

## Design tokens (`:root` in `src/styles/base.css`)

| Token | Before | After | Notes |
|-------|--------|-------|-------|
| `--bg` | `#ffffff` | `#faf6ee` | page, secondary buttons, selects |
| `--surface` | `#f3f4f6` | `#f3ece0` | cards |
| `--border` | `#d1d5db` | `#d9d0bd` | |
| `--accent`, `--fg`, `--muted`, `--danger`, `--accent-fg` | | unchanged | |

Validation: every fg/bg pair in research.md must be ≥ 4.5:1.

## Scanner UI state (existing `useScanner` state, unchanged)

`starting | scanning (hint?) | detected | notFound | error (kind)` mapped to zones:

| State | Header | Viewport | Status area |
|-------|--------|----------|-------------|
| starting | title + instructions | shown | loading text |
| scanning | title + instructions | shown | hint (if any) |
| detected | title + instructions | shown | "Track N" |
| notFound | title + instructions | shown | not-found text |
| error | title only | hidden | error text |
