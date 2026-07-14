from PIL import Image
import sys

SRC = "images/cartoon.png"
DST = "images/pineapple.png"

LOW, HIGH = 12, 26  # luminance ramp: below LOW -> transparent, above HIGH -> opaque

im = Image.open(SRC).convert("RGB")
w, h = im.size
px = im.load()

out = Image.new("RGBA", (w, h))
opx = out.load()

for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        lum = (r + g + b) / 3
        if lum <= LOW:
            a = 0
        elif lum >= HIGH:
            a = 255
        else:
            t = (lum - LOW) / (HIGH - LOW)
            a = int(round(t * 255))
        opx[x, y] = (r, g, b, a)

bbox = out.getbbox()
pad = 14
if bbox:
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(w, right + pad)
    bottom = min(h, bottom + pad)
    out = out.crop((left, top, right, bottom))

out.save(DST, "PNG", optimize=True)
print("saved", DST, out.size)
