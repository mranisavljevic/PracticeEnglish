# Badge fixtures

Cropped photos of audio-icon badges used by `tests/unit/badge-detect.test.ts` and the scan e2e test.
Full-page photos are publisher material and stay in the gitignored `tests/fixtures/private/`.

- `textbook-15.png`, `workbook-13/14/15.png`: single-badge crops (purple textbook, dark-grey workbook).
- `text-only.png`: plain text, no badge.
- `multi.png`: three workbook badges tiled with text between.
- `badge.y4m`: 2-frame clip fed to Chromium as a fake camera (`--use-file-for-fake-video-capture`).

Regenerate the clip with either (ffmpeg is a local prerequisite, not an npm dependency):

```sh
ffmpeg -loop 1 -i tests/fixtures/badges/textbook-15.png -t 2 -r 10 \
  -vf "scale=640:360:force_original_aspect_ratio=decrease,pad=640:360:(ow-iw)/2:(oh-ih)/2" \
  -pix_fmt yuv420p tests/fixtures/badges/badge.y4m
python3 tests/fixtures/badges/make-badge-video.py   # same result using Pillow only
```
