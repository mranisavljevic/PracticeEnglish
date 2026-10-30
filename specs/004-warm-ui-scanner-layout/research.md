# Research: Warm Background & Scanner Layout Refresh

## 1. Warm palette

**Decision**: `--bg: #faf6ee` (cream), `--surface: #f3ece0` (sand, replaces gray `#f3f4f6`), `--border: #d9d0bd`. Blue `--accent #1d4ed8`, `--fg`, `--muted`, `--danger` unchanged. `--accent-fg: #ffffff` stays (white text on blue buttons, not a background). Secondary buttons and the language select already use `var(--bg)`, so they inherit the change. `.card--continue` (`#eff6ff`) and `.badge` (`#dbeafe`) are blue tints, not white, and stay.

**Rationale**: Measured contrast on `#faf6ee`: fg 16.5:1, muted 7.0:1, accent 6.2:1, danger 6.0:1. On `#f3ece0`: 15.1 / 6.4 / 5.7 / 5.5. All exceed 4.5:1. The tone is close to white, matching the "slightly warmer" assumption.

**Alternatives**: stronger beige such as `#f5f0e1` (more tinted than requested); per-component overrides (more code than changing tokens).

## 2. Scanner layout approach

**Decision**: Make `.scan` a column flex of three zones: `scan__header` (title + instructions, top), `scan__viewport` (flex: 1, holds `<video>` and reticle, capped at about 50dvh), `scan__panel` (status + actions, bottom). The video moves from full-bleed absolute into the viewport box with `object-fit: cover` and rounded corners. Backdrop stays `#000`.

**Rationale**: Flex with a shrinking viewport satisfies "the viewport shrinks first" on short and landscape screens. The video previously filled 100% of the height; the ~50dvh cap far exceeds the required 15% reduction (SC-004). Use `dvh` with a `vh` fallback for mobile browser chrome.

**Alternatives**: fixed pixel height (breaks on small or landscape screens); keep full-bleed video under an opaque panel (does not reduce the camera view).

## 3. Bottom padding and safe areas

**Decision**: Panel padding `calc(1.5rem + env(safe-area-inset-bottom))`; add `viewport-fit=cover` to the viewport meta in `index.html` (currently absent) so the inset is non-zero on notched devices.

**Rationale**: 24px exceeds the 16px requirement (SC-003); the inset covers the home indicator.

## 4. Scan accuracy

**Decision**: No change to `src/scan/*`. Frames are grabbed from the whole video element (`camera.ts`), independent of its CSS size. The reticle is positioned relative to the viewport box (centered) so it stays inside the visible camera area (FR-009).

**Rationale**: Detection does not depend on reticle geometry or element size, so layout changes cannot regress accuracy. With `object-fit: cover` in a shorter box the visible area is a crop of the frame; icons just outside it may still be read, which is acceptable.

## 5. Error state

**Decision**: Title always shown; instructions hidden when `status === 'error'` (as today); viewport zone hidden (not unmounted) in error since there is no camera; error text in the status area; "Choose manually" in the footer.

**Rationale**: Matches User Story 2, scenario 3.
