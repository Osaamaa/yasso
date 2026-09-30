"""Prepare Yasso's static gallery without modifying any source media.

Requires Pillow only when re-running this optional authoring utility.
The finished website itself has no Python or build dependency.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil

from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "site" / "media"
# These two source selfies are stored sideways in the pixel data, without EXIF
# orientation. Correct the presentation copies; leave archived bytes untouched.
ROTATE_COUNTERCLOCKWISE = {
    "WhatsApp Image 2026-09-30 at 9.07.24 PM.jpeg",
    "WhatsApp Image 2026-09-30 at 9.07.31 PM (3).jpeg",
}


def natural_key(path: Path) -> tuple:
    """Sort the timestamp first and its unnumbered image before (1), (2), ..."""
    match = re.fullmatch(
        r"WhatsApp Image (\d{4}-\d{2}-\d{2}) at (\d+)\.(\d+)\.(\d+) (AM|PM)(?: \((\d+)\))?\.jpeg",
        path.name,
        flags=re.IGNORECASE,
    )
    if not match:
        return (path.name, 0, 0, 0, 0)
    day, hour, minute, second, period, version = match.groups()
    hour_24 = int(hour) % 12 + (12 if period.upper() == "PM" else 0)
    return (day, hour_24, int(minute), int(second), int(version or 0))


def sha256(path: Path) -> str:
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--contact-sheet", type=Path)
    args = parser.parse_args()
    photos = sorted(ROOT.glob("WhatsApp Image *.jpeg"), key=natural_key)
    videos = sorted(ROOT.glob("WhatsApp Video *.mp4"))
    if len(photos) != 21 or len(videos) != 1:
        raise SystemExit(f"Expected 21 JPEGs and 1 MP4; found {len(photos)} JPEGs and {len(videos)} MP4s.")

    (MEDIA / "originals").mkdir(parents=True, exist_ok=True)
    (MEDIA / "thumbs").mkdir(parents=True, exist_ok=True)
    (MEDIA / "full").mkdir(parents=True, exist_ok=True)
    mapping = {"photos": [], "videos": []}
    previews = []
    for number, source in enumerate(photos, 1):
        stem = f"photo-{number:02}"
        original = MEDIA / "originals" / f"{stem}.jpeg"
        shutil.copy2(source, original)
        digest = sha256(source)
        if sha256(original) != digest:
            raise RuntimeError(f"Original copy verification failed: {source.name}")

        with Image.open(source) as opened:
            photo = ImageOps.exif_transpose(opened).convert("RGB")
            full_path = f"media/originals/{stem}.jpeg"
            if source.name in ROTATE_COUNTERCLOCKWISE:
                photo = photo.transpose(Image.Transpose.ROTATE_90)
                photo.save(MEDIA / "full" / f"{stem}.jpeg", "JPEG", quality=94, optimize=True, progressive=True)
                full_path = f"media/full/{stem}.jpeg"
            source_width, source_height = photo.size
            display = photo.copy()
            display.thumbnail((1440, 1440), Image.Resampling.LANCZOS)
            display.save(MEDIA / f"{stem}.webp", "WEBP", quality=83, method=6)
            thumb = photo.copy()
            thumb.thumbnail((240, 240), Image.Resampling.LANCZOS)
            thumb.save(MEDIA / "thumbs" / f"{stem}.webp", "WEBP", quality=74, method=6)
            previews.append((number, thumb.copy()))
            mapping["photos"].append({
                "source": source.name,
                "src": f"media/{stem}.webp",
                "thumb": f"media/thumbs/{stem}.webp",
                "full": full_path,
                "preservedOriginal": f"media/originals/{stem}.jpeg",
                "width": display.width,
                "height": display.height,
                "originalWidth": source_width,
                "originalHeight": source_height,
                "sha256": digest,
            })

    video = videos[0]
    video_target = MEDIA / "video-01.mp4"
    shutil.copy2(video, video_target)
    digest = sha256(video)
    if sha256(video_target) != digest:
        raise RuntimeError("Video copy verification failed.")
    mapping["videos"].append({"source": video.name, "src": "media/video-01.mp4", "sha256": digest})
    (MEDIA / "source-map.json").write_text(json.dumps(mapping, indent=2) + "\n", encoding="utf-8")

    if args.contact_sheet:
        tile_width, tile_height = 252, 272
        sheet = Image.new("RGB", (tile_width * 5, tile_height * 5), "#0a1426")
        draw = ImageDraw.Draw(sheet)
        for index, (number, thumbnail) in enumerate(previews):
            x, y = (index % 5) * tile_width, (index // 5) * tile_height
            sheet.paste(thumbnail, (x + (tile_width - thumbnail.width) // 2, y + 26 + (240 - thumbnail.height) // 2))
            draw.text((x + 12, y + 8), f"PHOTO {number:02}", fill="white")
        sheet.save(args.contact_sheet)

    originals_bytes = sum(p.stat().st_size for p in (MEDIA / "originals").glob("*.jpeg"))
    displays_bytes = sum(p.stat().st_size for p in MEDIA.glob("*.webp"))
    thumbs_bytes = sum(p.stat().st_size for p in (MEDIA / "thumbs").glob("*.webp"))
    print(json.dumps({
        "photos": len(photos), "videos": len(videos), "originals_bytes": originals_bytes,
        "display_bytes": displays_bytes, "thumbnail_bytes": thumbs_bytes,
        "video_bytes": video_target.stat().st_size,
        "contact_sheet": str(args.contact_sheet) if args.contact_sheet else None,
        "all_original_copies_sha256_verified": True,
    }, indent=2))


if __name__ == "__main__":
    main()
