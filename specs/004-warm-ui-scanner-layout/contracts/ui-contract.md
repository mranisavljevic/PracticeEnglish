# UI Contract: Scanner Overlay

DOM structure of `ScanOverlay` (class names are the test hooks):

```text
div.scan[role=dialog][aria-modal][aria-labelledby=scan-title]
├── header.scan__header
│   ├── h2#scan-title.scan__title
│   └── p.scan__instructions          (omitted when error)
├── div.scan__viewport                (hidden when error)
│   ├── video.scan__video
│   └── div.scan__reticle[aria-hidden]
└── div.scan__panel
    ├── div.scan__status[aria-live=polite]
    └── div.scan__actions             (Open?, Cancel | Choose manually)
```

Guarantees:
- Order top to bottom: header, viewport, panel.
- Status text is only rendered inside `.scan__status`, never in the header.
- `.scan__panel` bottom padding ≥ 24px + `env(safe-area-inset-bottom)`.
- `.scan__viewport` height ≤ 50dvh and shrinks before the header or panel.
- Existing behavior preserved: Escape closes, Tab trapped, focus restored, `aria-live` announcements, buttons ≥ 48px.

Note: `<video>` stays mounted in every state because `useScanner` owns `videoRef`; in the error state `.scan__viewport` is hidden with the `hidden` attribute rather than removed.
