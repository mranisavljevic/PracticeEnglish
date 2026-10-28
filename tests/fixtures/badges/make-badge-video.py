"""Writes badge.y4m (a looping 2-frame clip of textbook-15.png) without needing ffmpeg.

Usage (needs Pillow): python3 tests/fixtures/badges/make-badge-video.py
"""
from pathlib import Path
from PIL import Image

here = Path(__file__).parent
W, H = 640, 360
src = Image.open(here / "textbook-15.png").convert("RGB").resize((640, 320))
frame = Image.new("RGB", (W, H), src.getpixel((5, 5)))
frame.paste(src, (0, 20))
y, cb, cr = frame.convert("YCbCr").split()
cb = cb.resize((W // 2, H // 2), Image.BILINEAR)
cr = cr.resize((W // 2, H // 2), Image.BILINEAR)
with open(here / "badge.y4m", "wb") as out:
    out.write(f"YUV4MPEG2 W{W} H{H} F10:1 Ip A1:1 C420jpeg\n".encode())
    for _ in range(2):
        out.write(b"FRAME\n" + y.tobytes() + cb.tobytes() + cr.tobytes())
