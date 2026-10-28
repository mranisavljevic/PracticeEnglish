#!/usr/bin/env bash
# Subsets Commissioner (400/600/700) to Latin + Latin-1 + punctuation and writes woff2 to public/fonts/.
# Needs fonttools and brotli: python3 -m pip install fonttools brotli
# FONT_SRC points at the folder with the downloaded OFL font (default ~/Desktop/Commissioner).
set -euo pipefail

SRC="${FONT_SRC:-$HOME/Desktop/Commissioner}"
OUT="public/fonts"
UNICODES='U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+20AC'

mkdir -p "$OUT"
for weight in Regular SemiBold Bold; do
  python3 -m fontTools.subset "$SRC/static/Commissioner-$weight.ttf" \
    --unicodes="$UNICODES" --flavor=woff2 --layout-features=kern,liga \
    --output-file="$OUT/Commissioner-$weight.woff2"
done
cp "$SRC/OFL.txt" "$OUT/OFL.txt"
ls -l "$OUT"
