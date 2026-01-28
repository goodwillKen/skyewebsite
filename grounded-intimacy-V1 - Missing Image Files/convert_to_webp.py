import os
import csv
from pathlib import Path
from PIL import Image

# 1. SET THIS TO YOUR IMAGES ROOT FOLDER
IMAGES_ROOT = Path(
    r"C:\\Users\\angel\\OneDrive - powerauto.com.au\\Documents\\SkyeWebsite\\grounded-intimacy-V1"
)

# 2. WHERE TO WRITE THE CONVERSION MAP
MAP_CSV = IMAGES_ROOT.parent / "image_conversion_map.csv"

# File extensions we will convert
SOURCE_EXTS = {".png", ".jpg", ".jpeg", ".JPG", ".JPEG", ".PNG"}

def convert_image(src_path: Path) -> tuple | None:
    """
    Convert one image to WEBP next to the original.
    Returns mapping info (old, new, w, h, old_size, new_size) or None on failure.
    """
    try:
        # Skip if already WEBP
        if src_path.suffix.lower() == ".webp":
            return None

        if src_path.suffix not in SOURCE_EXTS:
            return None

        dst_path = src_path.with_suffix(".webp")

        # Open and convert
        with Image.open(src_path) as im:
            im.load()
            width, height = im.size

            # Convert to RGB or RGBA as needed
            if im.mode in ("P", "LA"):
                im = im.convert("RGBA")
            elif im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGB")

            # Save as WEBP with reasonable quality
            # quality can be tweaked; 80 is a good starting point
            im.save(dst_path, "WEBP", quality=80, method=6)

        old_size = src_path.stat().st_size
        new_size = dst_path.stat().st_size

        return (
            str(src_path),
            str(dst_path),
            width,
            height,
            old_size,
            new_size,
        )

    except Exception as e:
        print(f"Error converting {src_path}: {e}")
        return None

def main():
    mappings = []

    print(f"Scanning {IMAGES_ROOT} for images...")
    for root, dirs, files in os.walk(IMAGES_ROOT):
        for name in files:
            src = Path(root) / name
            info = convert_image(src)
            if info:
                mappings.append(info)
                print(f"Converted: {src} -> {info[1]}")

    if mappings:
        print(f"\nWriting conversion map to {MAP_CSV}")
        with MAP_CSV.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(
                [
                    "old_path",
                    "new_path",
                    "width",
                    "height",
                    "original_size_bytes",
                    "webp_size_bytes",
                ]
            )
            writer.writerows(mappings)
    else:
        print("No images converted (either none found or already WEBP).")

if __name__ == "__main__":
    main()
