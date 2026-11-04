#!/usr/bin/env python3
"""Simple downloader: fetch a URL via curl with Referer header."""
import argparse
import subprocess
import sys
from pathlib import Path

DOWNLOAD_DIR = Path(__file__).resolve().parent / "downloads"

def main():
    parser = argparse.ArgumentParser(
        description="Secure downloader for file-hosting pages."
    )
    parser.add_argument("--url", required=True, help="Target URL to download")
    parser.add_argument("--output", "-o", help="Output file path")
    args = parser.parse_args()

    url = args.url.strip()
    if not url:
        print("[ERROR] No URL provided.")
        return 1

    if not args.output:
        base = url.split("#")[0].split("?")[0].rsplit("/", 1)[-1]
        if not base or "." not in base:
            base = "downloaded.rar"
        output = str(DOWNLOAD_DIR / base)
    else:
        output = args.output

    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

    cmd = [
        "curl", "-L", "--fail", "-o", output, url,
        "-H", f"Referer: {url}",
        "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    ]

    print("[INFO] Downloading:", url)
    print("[INFO] Saving to:", output)

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("[ERROR] curl failed (exit %d):" % result.returncode)
        if result.stderr:
            print("        ", result.stderr.strip())
        if result.stdout:
            print("        ", result.stdout.strip())
        return 1

    size = Path(output).stat().st_size if Path(output).exists() else 0
    print("[SUCCESS] Downloaded %d bytes to %s" % (size, output))
    print()
    print("=" * 60)
    print("DOWNLOAD COMPLETE")
    print("=" * 60)
    print()
    print("SECURITY CHECKLIST (do this before extracting):")
    print("  1. Scan the file with VirusTotal or Windows Defender")
    print("  2. Inspect contents inside Windows Sandbox or a fresh VM")
    print("  3. Never extract on your daily-driver OS")
    print("  4. Verify file types: .mp4/.mkv/.avi are expected; .exe/.scr/.bat/.lnk are NOT")
    return 0

if __name__ == "__main__":
    sys.exit(main())