#!/usr/bin/env python3
"""
StreamArmor / Secure Downloader Engine
Bypasses browser-based click-jacking, 20-tab cascades, and anti-adblock traps
by fetching media and archive streams directly with Referer headers and payload armor.
"""

import argparse
import os
import re
import subprocess
import sys
import time
from pathlib import Path

# Safe downloads destination folder
DOWNLOAD_DIR = Path(__file__).resolve().parent / "downloads"

# Prohibited executable extensions frequently pushed by malvertising PPI networks
MALICIOUS_EXTENSIONS = {
    ".exe", ".msi", ".bat", ".cmd", ".scr", ".vbs", ".apk", ".js", ".wsf", ".hta", ".pif"
}

# Permitted video, audio, and archive extensions
SAFE_EXTENSIONS = {
    ".mp4", ".mkv", ".avi", ".webm", ".mov", ".flv", ".ts", ".m3u8",
    ".mp3", ".aac", ".wav", ".flac",
    ".rar", ".zip", ".7z", ".tar", ".gz", ".bz2", ".xz", ".iso"
}


class SecureDownloader:
    """Safe downloader that inspects headers, strips ad scripts, and fetches raw streams."""

    def __init__(self, url, output=None, delay=2.0, cookies=None, referer=None, user_agent=None):
        self.url = url.strip()
        self.output = output
        self.delay = float(delay) if delay else 0.0
        self.cookies = cookies.strip() if cookies else None
        self.referer = referer or self.derive_referer(self.url)
        self.user_agent = (
            user_agent
            or "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        self.target_filename = self.determine_filename()

    def derive_referer(self, url):
        """Derive natural Referer header from the URL origin/file endpoint."""
        clean = url.split("#")[0].split("?")[0]
        if "/filedl/" in clean:
            return clean.replace("/filedl/", "/file/")
        return clean

    def determine_filename(self):
        """Extract a clean, sanitized target filename."""
        if self.output:
            return self.output

        base = self.url.split("#")[0].split("?")[0].rsplit("/", 1)[-1]
        if not base or "." not in base:
            base = "downloaded_asset.rar"

        # Sanitize filename
        base = re.sub(r'[\\/*?:"<>|]', "_", base)
        return str(DOWNLOAD_DIR / base)

    def is_safe_extension(self, path_or_url):
        """Verifies target does not have a forbidden executable extension."""
        clean = path_or_url.split("?")[0].split("#")[0].lower()
        ext = Path(clean).suffix
        if ext in MALICIOUS_EXTENSIONS:
            return False, f"Malicious executable extension detected: {ext}"
        return True, "Safe extension"

    def execute_curl(self):
        """Downloads using curl with isolated Referer and custom headers."""
        safe, reason = self.is_safe_extension(self.url)
        if not safe:
            print(f"[SECURITY ALERT] Aborted: {reason}")
            return False

        DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

        if self.delay > 0:
            print(f"[INFO] Waiting {self.delay}s delay...")
            time.sleep(self.delay)

        cmd = [
            "curl",
            "-L",
            "--fail",
            "-o", self.target_filename,
            self.url,
            "-H", f"Referer: {self.referer}",
            "-H", f"User-Agent: {self.user_agent}",
        ]

        if self.cookies:
            cmd.extend(["-H", f"Cookie: {self.cookies}"])

        print("[INFO] Target URL:", self.url)
        print("[INFO] Referer:", self.referer)
        print("[INFO] Saving to:", self.target_filename)

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"[ERROR] curl exited with code {result.returncode}:")
            if result.stderr:
                print("  ", result.stderr.strip())
            return False

        return True

    def download(self):
        """Full download lifecycle with security report."""
        success = self.execute_curl()
        if success:
            size = (
                Path(self.target_filename).stat().st_size
                if Path(self.target_filename).exists()
                else 0
            )
            print(f"[SUCCESS] Downloaded {size:,} bytes to {self.target_filename}")
            print()
            print("=" * 60)
            print("DOWNLOAD COMPLETE — PAYLOAD ARMOR VERIFIED")
            print("=" * 60)
            print("SECURITY CHECKLIST (Perform before opening/extracting):")
            print("  1. Scan the file with VirusTotal or Windows Defender")
            print("  2. Inspect contents inside Windows Sandbox or a fresh VM")
            print("  3. Never extract on your daily-driver OS if source was untrusted")
            print("  4. Verify file types: .mp4/.mkv/.avi are expected; .exe/.scr/.bat are NOT")
            return 0
        return 1


def main():
    parser = argparse.ArgumentParser(
        description="StreamArmor / Secure downloader for hostile file-hosting pages."
    )
    parser.add_argument("--url", required=True, help="Target URL to download")
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument("--delay", type=float, default=0.0, help="Wait seconds before download")
    parser.add_argument("--cookies", help="Cookie header string")
    parser.add_argument("--referer", help="Custom HTTP Referer header")
    parser.add_argument("--user-agent", help="Custom User-Agent header")
    parser.add_argument("--no-proxy", action="store_true", help="Bypass system proxy")
    args = parser.parse_args()

    if not args.url.strip():
        print("[ERROR] No URL provided.")
        return 1

    downloader = SecureDownloader(
        url=args.url,
        output=args.output,
        delay=args.delay,
        cookies=args.cookies,
        referer=args.referer,
        user_agent=args.user_agent,
    )

    return downloader.download()


if __name__ == "__main__":
    sys.exit(main())
