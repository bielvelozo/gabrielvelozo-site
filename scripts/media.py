import shutil
import sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
site = root / "site"
dev = root.parent
old = dev / "shopify-portfolio" / "site"

COPY = ["arara3", "dewlane2", "nocte3", "tour", "personalizer", "cart", "speed", "erp"]
VIDEOS = ["arara3", "dewlane2", "nocte3"]

PROOFS = {
    "p-nocte-engraving": dev / "nocte-shopify-theme/vitrine/03-product-engraving.jpg",
    "p-arara-product": dev / "arara-shopify-theme/vitrine/02-product-desktop.jpg",
    "p-dewlane-product": dev / "dewlane-shopify-theme/vitrine/03-product-desktop.jpg",
    "c-dewlane-routine": dev / "dewlane-shopify-theme/vitrine/02-routine-desktop.jpg",
    "c-nocte-gift": dev / "nocte-shopify-theme/vitrine/04-cart-drawer.jpg",
}
PHONE = {"c-arara-cart": dev / "arara-shopify-theme/vitrine/05-cart-mobile.jpg"}


def webp(img, dest, width):
    h = round(img.height * width / img.width)
    img.resize((width, h), Image.LANCZOS).save(dest, "WEBP", quality=80, method=6)


def main():
    (site / "img").mkdir(parents=True, exist_ok=True)
    (site / "video").mkdir(parents=True, exist_ok=True)
    for name in COPY:
        for w in (640, 1280):
            shutil.copyfile(old / "img" / f"{name}-{w}.webp", site / "img" / f"{name}-{w}.webp")
    for name in VIDEOS:
        shutil.copyfile(old / "video" / f"{name}.mp4", site / "video" / f"{name}.mp4")
    for name, src in PROOFS.items():
        img = Image.open(src).convert("RGB")
        for w in (720, 1280):
            webp(img, site / "img" / f"{name}-{w}.webp", w)
    for name, src in PHONE.items():
        img = Image.open(src).convert("RGB")
        for w in (360, 720):
            webp(img, site / "img" / f"{name}-{w}.webp", w)
    for f in sorted((site / "img").iterdir()):
        print(f.name, f.stat().st_size, Image.open(f).size)


if __name__ == "__main__":
    sys.exit(main())
