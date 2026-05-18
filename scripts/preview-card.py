#!/usr/bin/env python3
"""
preview-card.py — composite a homepage app card background for review.

Applies the same visual treatment as index.astro:
  - Primary image: full-bleed, scaled and rotated per grid index formula
  - Secondary image: bottom-right corner (default) or full-bleed override
  - Studio grey gradient overlay
  - Title and optional summary text

Usage:
  python3 scripts/preview-card.py --img1 PATH --img2 PATH --title TEXT [options]
  task card-preview IMG1=path IMG2=path TITLE="App Name"
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("error: Pillow is required — pip install Pillow", file=sys.stderr)
    sys.exit(1)


def parse_args():
    p = argparse.ArgumentParser(
        description="Composite a card background preview",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("--img1", metavar="PATH", required=True, help="Primary background image")
    p.add_argument("--img2", metavar="PATH", help="Secondary background image")
    p.add_argument("--title", metavar="TEXT", required=True, help="Card title (uppercase in output)")
    p.add_argument("--summary", metavar="TEXT", default="", help="Short summary line")
    p.add_argument(
        "--index", metavar="INT", type=int, default=0,
        help="Grid slot index — drives rotation/scale formula from index.astro (default 0)",
    )
    p.add_argument("--width", metavar="PX", type=int, default=640, help="Card width (default 640)")
    p.add_argument("--height", metavar="PX", type=int, default=420, help="Card height (default 420)")
    # Secondary image overrides
    p.add_argument("--scale2", metavar="FLOAT", type=float, help="Secondary image scale multiplier (e.g. 1.3)")
    p.add_argument("--rotation2", metavar="DEG", type=float, help="Secondary image rotation in degrees")
    p.add_argument("--fullbleed2", action="store_true", help="Secondary image covers full card instead of bottom-right corner")
    p.add_argument("--out", metavar="PATH", default="/tmp/card-preview.png", help="Output PNG path (default /tmp/card-preview.png)")
    return p.parse_args()


def rotation_for_index(idx: int) -> float:
    """Matches the formula in index.astro."""
    direction = 1 if idx % 2 == 0 else -1
    return direction * (5 + (idx * 3) % 7)


def scale_for_index(idx: int) -> float:
    """Matches the formula in index.astro."""
    return 1.25 + (idx % 3) * 0.05


def load_desaturated(path: str, opacity: float, saturation: float) -> Image.Image:
    src = Image.open(path).convert("RGBA")
    rgb = src.convert("RGB")
    gray = rgb.convert("L").convert("RGB")
    rgb = Image.blend(rgb, gray, 1.0 - saturation)
    rgba = rgb.convert("RGBA")
    r, g, b, a = rgba.split()
    a = a.point(lambda x: int(x * opacity))
    rgba.putalpha(a)
    return rgba


def paste_full_bleed(canvas: Image.Image, img: Image.Image, scale: float, rotation: float) -> Image.Image:
    W, H = canvas.size
    sw = int(W * scale * 1.5)
    sh = int(H * scale * 1.5)
    resized = img.resize((sw, sh), Image.LANCZOS)
    rotated = resized.rotate(-rotation, expand=True, resample=Image.BICUBIC)
    ox = (rotated.width - W) // 2
    oy = (rotated.height - H) // 2
    crop = rotated.crop((ox, oy, ox + W, oy + H))
    canvas.paste(crop, (0, 0), crop)
    return canvas


def paste_secondary_default(canvas: Image.Image, img: Image.Image, rotation: float) -> Image.Image:
    """Bottom-right corner, 75% width/height, offset 20%/15%."""
    W, H = canvas.size
    sw = int(W * 0.75)
    sh = int(H * 0.75)
    resized = img.resize((sw, sh), Image.LANCZOS)
    rotated = resized.rotate(-rotation, expand=True, resample=Image.BICUBIC)
    x = W - sw + int(W * 0.15)
    y = H - sh + int(H * 0.20)
    canvas.paste(rotated, (x, y), rotated)
    return canvas


def paste_secondary_fullbleed(canvas: Image.Image, img: Image.Image, scale: float, rotation: float) -> Image.Image:
    W, H = canvas.size
    sw = int(W * scale)
    sh = int(H * scale)
    resized = img.resize((sw, sh), Image.LANCZOS)
    rotated = resized.rotate(-rotation, expand=True, resample=Image.BICUBIC)
    ox = (rotated.width - W) // 2
    oy = (rotated.height - H) // 2
    crop = rotated.crop((ox, oy, ox + W, oy + H))
    canvas.paste(crop, (0, 0), crop)
    return canvas


def add_gradient(canvas: Image.Image) -> Image.Image:
    W, H = canvas.size
    grad = Image.new("RGBA", (W, H))
    draw = ImageDraw.Draw(grad)
    for x in range(W):
        for y in range(H):
            t = (x / W + y / H) / 2
            alpha = int(210 - t * 108)  # 0.82 → 0.40 opacity range
            draw.point((x, y), fill=(74, 70, 65, alpha))
    return Image.alpha_composite(canvas, grad)


FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]
FONT_BODY_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
]


def load_font(candidates, size):
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


def main():
    args = parse_args()
    W, H = args.width, args.height
    ACCENT = (176, 38, 255)

    rotation = rotation_for_index(args.index)
    scale = scale_for_index(args.index)

    canvas = Image.new("RGBA", (W, H), (74, 70, 65, 255))

    # Primary image
    img1 = load_desaturated(args.img1, opacity=0.35, saturation=0.50)
    canvas = paste_full_bleed(canvas, img1, scale=scale, rotation=rotation)

    # Secondary image
    if args.img2:
        img2 = load_desaturated(args.img2, opacity=0.25, saturation=0.50)
        rot2 = args.rotation2 if args.rotation2 is not None else -rotation * 1.4
        if args.fullbleed2:
            sc2 = args.scale2 if args.scale2 is not None else 1.0
            canvas = paste_secondary_fullbleed(canvas, img2, scale=sc2, rotation=rot2)
        else:
            canvas = paste_secondary_default(canvas, img2, rotation=rot2)

    canvas = add_gradient(canvas)

    # Foreground
    draw = ImageDraw.Draw(canvas)
    draw.rectangle([24, 24, 60, 60], outline=ACCENT + (102,), width=1)

    ft = load_font(FONT_CANDIDATES, 32)
    fb = load_font(FONT_BODY_CANDIDATES, 14)
    draw.text((24, 80), args.title.upper(), font=ft, fill=(245, 240, 232, 255))
    if args.summary:
        draw.text((24, 126), args.summary, font=fb, fill=(200, 192, 184, 200))

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out)
    print(f"saved: {out}")


if __name__ == "__main__":
    main()
