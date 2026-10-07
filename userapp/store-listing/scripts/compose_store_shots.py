#!/usr/bin/env python3
"""Compose professional App Store / Play Store marketing screenshots from raw device captures."""
from __future__ import annotations

import os
from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "raw"
OUT = ROOT / "screenshots"
OUT_IOS = OUT / "ios"
OUT_ANDROID = OUT / "android"

CREAM = (249, 245, 235)
GOLD = (181, 148, 81)
GOLD_DARK = (154, 122, 63)
INK = (20, 17, 10)
MUTED = (112, 98, 86)
WHITE = (255, 255, 255)

# App Store preferred 6.9" class
IOS_SIZE = (1320, 2868)
# Google Play phone
ANDROID_SIZE = (1080, 1920)

# Flat names requested for listing pack
SCENES = [
    ("01-home", "صالونك بضغطة", "اكتشفي صالونات مدينتك واحجزي فوراً"),
    ("02-discover", "اختاري بسهولة", "صفّي حسب التصنيف والمدينة والمفضلة"),
    ("03-booking", "احجزي موعدك", "خدمة · مختص · وقت — بثلاث خطوات"),
    ("04-cash", "ادفعي نقداً", "بدون بطاقات · بالليرة السورية"),
    ("05-group", "حجز جماعي", "احجزي لكِ ولصديقاتك في نفس الموعد"),
]


def ar(text: str) -> str:
    return get_display(arabic_reshaper.reshape(text))


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/GeezaPro.ttc",
    ):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def gradient(size: tuple[int, int], top=CREAM, bottom=(232, 212, 168)) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, top)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(h - 1, 1)
        col = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=col)
    return img


def rounded_device_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def place_phone(
    canvas: Image.Image,
    shot: Image.Image,
    *,
    top: int,
    max_h: int,
    bezel: int = 18,
    radius: int = 70,
    bezel_color=INK,
) -> None:
    """Scale screenshot into a floating phone frame, centered."""
    cw, ch = canvas.size
    avail_w = int(cw * 0.78)
    scale = min(avail_w / shot.width, max_h / shot.height)
    pw = int(shot.width * scale)
    ph = int(shot.height * scale)
    phone = shot.resize((pw, ph), Image.Resampling.LANCZOS)

    frame_w, frame_h = pw + bezel * 2, ph + bezel * 2
    frame = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    fd.rounded_rectangle((0, 0, frame_w - 1, frame_h - 1), radius=radius, fill=bezel_color + (255,))
    inner = Image.new("RGBA", (pw, ph), (0, 0, 0, 0))
    inner.paste(phone.convert("RGBA"), (0, 0))
    inner.putalpha(rounded_device_mask((pw, ph), max(8, radius - 10)))
    frame.paste(inner, (bezel, bezel), inner)

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    x0 = (cw - frame_w) // 2
    y0 = top
    sd.rounded_rectangle(
        (x0 + 18, y0 + 28, x0 + frame_w + 18, y0 + frame_h + 28),
        radius=radius,
        fill=(20, 17, 10, 45),
    )
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(frame, (x0, y0))


def compose(
    scene_id: str,
    title: str,
    subtitle: str,
    raw_path: Path,
    out_size: tuple[int, int],
    out_path: Path,
    platform: str,
) -> None:
    shot = Image.open(raw_path).convert("RGB")
    canvas = gradient(out_size).convert("RGBA")
    d = ImageDraw.Draw(canvas)
    w, h = out_size

    d.text((w // 2, int(h * 0.055)), ar("ألونا"), font=font(int(h * 0.035)), fill=GOLD_DARK, anchor="mm")
    d.text((w // 2, int(h * 0.105)), ar(title), font=font(int(h * 0.042)), fill=INK, anchor="mm")
    d.text((w // 2, int(h * 0.145)), ar(subtitle), font=font(int(h * 0.022)), fill=MUTED, anchor="mm")

    phone_top = int(h * 0.175)
    phone_max_h = int(h * 0.72)
    bezel_color = INK if platform == "ios" else (32, 33, 36)
    place_phone(canvas, shot, top=phone_top, max_h=phone_max_h, bezel_color=bezel_color)

    d.text((w // 2, int(h * 0.955)), ar("حجز صالونات · سوريا · نقداً"), font=font(int(h * 0.018)), fill=MUTED, anchor="mm")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out_path, "PNG", optimize=True)
    print("wrote", out_path)


def find_raw(scene_id: str, platform: str) -> Path | None:
    for ext in (".png", ".jpg", ".jpeg"):
        p = RAW / platform / f"{scene_id}{ext}"
        if p.exists():
            return p
        p2 = RAW / f"{scene_id}{ext}"
        if p2.exists():
            return p2
    return None


def main() -> None:
    for scene_id, title, subtitle in SCENES:
        ios_raw = find_raw(scene_id, "ios") or find_raw(scene_id, "android")
        and_raw = find_raw(scene_id, "android") or ios_raw
        if not ios_raw:
            print("skip missing raw", scene_id)
            continue

        # App Store framed (1320×2868) → flat 01-home.png
        compose(scene_id, title, subtitle, ios_raw, IOS_SIZE, OUT / f"{scene_id}.png", "ios")
        compose(scene_id, title, subtitle, ios_raw, IOS_SIZE, OUT_IOS / f"{scene_id}.png", "ios")

        # Play framed (1080×1920) → flat 01-home-play.png
        compose(scene_id, title, subtitle, and_raw, ANDROID_SIZE, OUT / f"{scene_id}-play.png", "android")
        compose(scene_id, title, subtitle, and_raw, ANDROID_SIZE, OUT_ANDROID / f"{scene_id}.png", "android")


if __name__ == "__main__":
    main()
