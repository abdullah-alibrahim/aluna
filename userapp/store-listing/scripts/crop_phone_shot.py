#!/usr/bin/env python3
"""Crop phone UI (cream/content region) from a Cursor browser screenshot into 780×1688 raw."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image

TARGET = (780, 1688)


def crop_phone(src: Path, dest: Path) -> None:
    im = Image.open(src).convert("RGB")
    arr = np.array(im)
    # App cream background ~249,245,236
    cream = (
        (np.abs(arr[:, :, 0].astype(int) - 249) < 14)
        & (np.abs(arr[:, :, 1].astype(int) - 245) < 14)
        & (np.abs(arr[:, :, 2].astype(int) - 236) < 22)
    )
    ys, xs = np.where(cream)
    if len(xs) < 1000:
        # fallback: left TARGET region
        phone = im.crop((0, 0, min(TARGET[0], im.width), min(TARGET[1], im.height)))
    else:
        x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())
        # Prefer exact 780×1688 from top-left of cream region if large enough
        if x1 - x0 + 1 >= TARGET[0] and y1 - y0 + 1 >= TARGET[1]:
            phone = im.crop((x0, y0, x0 + TARGET[0], y0 + TARGET[1]))
        else:
            phone = im.crop((x0, y0, x1 + 1, y1 + 1)).resize(TARGET, Image.Resampling.LANCZOS)

    if phone.size != TARGET:
        phone = phone.resize(TARGET, Image.Resampling.LANCZOS)

    dest.parent.mkdir(parents=True, exist_ok=True)
    phone.save(dest, "PNG", optimize=True)
    print("wrote", dest, phone.size)


if __name__ == "__main__":
    crop_phone(Path(sys.argv[1]), Path(sys.argv[2]))
