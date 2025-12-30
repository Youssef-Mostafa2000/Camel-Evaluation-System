#!/usr/bin/env python3
"""
CamelBeauty ML Models Download Script
Downloads all required ML models from Google Drive using gdown
"""

import os
import subprocess
import sys
from pathlib import Path


MODELS = [
    {
        "name": "Body Detection Model",
        "url": "https://drive.google.com/uc?id=1z-4wlAHLoPicz2opaVawf-uteLIbY9cs",
        "output": "models/body/best.pt",
    },
    {
        "name": "Face Detection Model",
        "url": "https://drive.google.com/uc?id=1Rk7fiatvsR1XurXL8BvEsyoMFINn6YGZ",
        "output": "models/face/best.pt",
    },
    {
        "name": "Beauty Scorer Model",
        "url": "https://drive.google.com/uc?id=1WDXhFo-wJYu1RzKNcRNY3ZEyKdvyXvAi",
        "output": "models/scorer/best_camel_beauty_all_data_model.pth",
    },
]


def print_header(text: str) -> None:
    print("=" * 60)
    print(text)
    print("=" * 60)


def get_file_size(path: str) -> str:
    size = os.path.getsize(path)
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.2f} {unit}"
        size /= 1024
    return f"{size:.2f} TB"


def install_gdown() -> bool:
    print("gdown not found. Installing...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "gdown"])
        return True
    except subprocess.CalledProcessError:
        print("Failed to install gdown")
        return False


def check_gdown() -> bool:
    try:
        import gdown
        return True
    except ImportError:
        return install_gdown()


def create_directories() -> None:
    print("\nCreating model directories...")
    for model in MODELS:
        directory = Path(model["output"]).parent
        directory.mkdir(parents=True, exist_ok=True)
        print(f"  Created: {directory}")


def download_model(model: dict) -> bool:
    import gdown

    print(f"\nDownloading {model['name']}...")
    print(f"  URL: {model['url']}")
    print(f"  Output: {model['output']}")

    try:
        gdown.download(model["url"], model["output"], quiet=False)

        if os.path.exists(model["output"]):
            size = get_file_size(model["output"])
            print(f"  [OK] Downloaded successfully ({size})")
            return True
        else:
            print(f"  [FAIL] File not found after download")
            return False
    except Exception as e:
        print(f"  [FAIL] Download error: {e}")
        return False


def print_summary(results: list[tuple[dict, bool]]) -> None:
    print("\n")
    print_header("Download Summary")

    success_count = 0
    total_size = 0

    for model, success in results:
        if success and os.path.exists(model["output"]):
            size = get_file_size(model["output"])
            total_size += os.path.getsize(model["output"])
            status = f"[OK] {size}"
            success_count += 1
        else:
            status = "[FAIL]"
        print(f"  {model['name']}: {status}")

    print(f"\nTotal: {success_count}/{len(results)} models downloaded")
    if total_size > 0:
        print(f"Total Size: {get_file_size_from_bytes(total_size)}")

    if success_count == len(results):
        print("\n[OK] All models downloaded successfully!")
        print("\nNext steps:")
        print("  1. Install dependencies: pip install -r requirements.txt")
        print("  2. Test setup: python -c 'from inference_utils import *; print(\"OK\")'")
        print("  3. Run Flask server: python app.py")
    else:
        print("\n[WARN] Some models failed to download.")
        print("Please check your internet connection and try again.")

    print("=" * 60)


def get_file_size_from_bytes(size: int) -> str:
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.2f} {unit}"
        size /= 1024
    return f"{size:.2f} TB"


def main() -> int:
    print_header("CamelBeauty ML Models Download Script")

    if not check_gdown():
        print("Cannot proceed without gdown. Exiting.")
        return 1

    create_directories()

    results = []
    for model in MODELS:
        success = download_model(model)
        results.append((model, success))
        if not success:
            print(f"\n[WARN] Failed to download {model['name']}")

    print_summary(results)

    failed = [r for r in results if not r[1]]
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
