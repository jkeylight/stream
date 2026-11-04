#!/usr/bin/env python3
"""
StreamArmor / AntiSpamDownloader
Standalone background engine with Clipboard Watcher, Playwright Sandboxed Browser,
Anti-Popup Radar (kills 20-tab cascades), and Payload Armor.

Can be bundled to standalone Windows .exe with:
  pyinstaller --onefile --name="AntiSpamDownloader" app.py
"""

import os
import re
import sys
import time
from pathlib import Path

# Optional imports for desktop clipboard & playwright automation
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None

try:
    import pyperclip
except ImportError:
    pyperclip = None

try:
    import requests
except ImportError:
    requests = None

# Regular expression matching known aggressive or spammy file hosts
SPAMMY_HOSTS_REGEX = re.compile(
    r'https?://(torupload\.com|rapidgator\.net|uploaded\.net|katfile\.com|turbobit\.net|mega\.nz|1fichier\.com)/file[a-zA-Z0-9_\-/]*',
    re.IGNORECASE
)

# Strict list of prohibited executable extensions pushed by malvertising PPI networks
MALICIOUS_EXTENSIONS = {
    '.exe', '.msi', '.bat', '.cmd', '.scr', '.vbs', '.apk', '.js', '.wsf', '.hta', '.pif'
}

# Known safe archive and media extensions
PERMITTED_STREAM_EXTENSIONS = [
    '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
    '.mp4', '.mkv', '.avi', '.webm', '.mov', '.mp3'
]

DOWNLOADS_DIR = Path.cwd() / "downloads"


def safe_intercept_engine(target_url, timeout_sec=180):
    """
    Launches a controlled browser to isolate data and wipe out malicious popup loops.
    Neutralizes document-wide anywhere-click hijacking.
    """
    if not sync_playwright:
        print("[ERROR] Playwright is not installed. Run: pip install playwright && playwright install chromium")
        return None

    print(f"\n[!] Target link intercepted: {target_url}")
    print("[*] Instantiating isolated sandboxed browser context (clean profile)...")

    session_dir = Path.cwd() / "secure_sandbox_session"
    session_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser_context = p.chromium.launch_persistent_context(
            user_data_dir=str(session_dir),
            headless=False,  # Displayed so user can solve visible captchas safely
            args=["--disable-popup-blocking=false", "--mute-audio"]
        )

        page = browser_context.pages[0] if browser_context.pages else browser_context.new_page()
        captured_download_url = None

        # ANTI-ADWARE RADAR: Instantly drops unauthorized window spawns (the 20-tab cascade)
        def kill_popup(popup_page):
            print("[x] Intercepted and terminated an aggressive advertising tab / pop-under.")
            try:
                popup_page.close()
            except Exception:
                pass

        page.on("popup", kill_popup)

        # STREAM CAPTURE ENGINE: Monitors raw network traffic for file payloads
        def inspect_network_traffic(response):
            nonlocal captured_download_url
            url = response.url
            disposition = response.headers.get("content-disposition", "").lower()
            content_type = response.headers.get("content-type", "").lower()

            # Watch for binary files, media streams, or archive headers
            is_attachment = "attachment" in disposition
            is_media_mime = any(m in content_type for m in ["video/", "application/zip", "application/x-rar", "application/octet-stream"])
            is_safe_ext = any(url.lower().split("?")[0].endswith(ext) for ext in PERMITTED_STREAM_EXTENSIONS)

            if is_attachment or (is_media_mime and is_safe_ext):
                if not captured_download_url:
                    captured_download_url = url
                    print(f"\n[+] Direct file stream asset caught from network: {url}")

        page.on("response", inspect_network_traffic)

        print(f"[*] Navigating safely to target: {target_url}")
        try:
            page.goto(target_url, timeout=45000)
        except Exception as e:
            print(f"[*] Initial load notice: {e}")

        print("\n" + "=" * 62)
        print(" ACTION REQUIRED: Interact with the browser window to")
        print(" solve any visible captcha and click the generate link.")
        print(" All malicious popups and redirects will be destroyed.")
        print("=" * 62 + "\n")

        start = time.time()
        while not captured_download_url:
            page.wait_for_timeout(500)
            if time.time() - start > timeout_sec:
                print("[-] System Timeout: No valid direct data stream detected within window.")
                browser_context.close()
                return None

        browser_context.close()
        return captured_download_url


def download_data_stream(url, output_folder=DOWNLOADS_DIR):
    """Downloads the file with rigorous extension filtering and header verification."""
    if not requests:
        print("[ERROR] requests library not installed. Run: pip install requests")
        return False

    output_folder.mkdir(parents=True, exist_ok=True)

    # 1. Pre-check URL string for suspicious executable suffixes
    url_clean = url.split("?")[0].split("#")[0].lower()
    if any(url_clean.endswith(ext) for ext in MALICIOUS_EXTENSIONS):
        print("\n[CRITICAL SECURITY ALERT] Blocked a dangerous executable payload attempt!")
        print(f"[!] Server tried to push executable payload: {url_clean}")
        return False

    # Extract clean target name
    raw_name = url.split("/")[-1].split("?")[0] or "downloaded_stream.zip"
    filename = re.sub(r'[\\/*?:"<>|]', "_", raw_name)
    target_path = output_folder / filename

    print(f"[*] Starting clean stream engine. Inspecting server response headers...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": url.split("#")[0].split("?")[0]
    }

    try:
        with requests.get(url, headers=headers, stream=True, timeout=60) as r:
            r.raise_for_status()

            # 2. Verify Content-Type returned directly by server backend
            content_type = r.headers.get('content-type', '').lower()
            dangerous_mimes = [
                'application/x-msdownload',
                'application/x-executable',
                'application/vnd.android.package-archive',
                'application/x-msdos-program'
            ]
            if any(bad_type in content_type for bad_type in dangerous_mimes):
                print("\n[CRITICAL SECURITY ALERT] Dropped connection: Server MIME type indicates an executable wrapper!")
                return False

            total_size = int(r.headers.get('content-length', 0))
            downloaded = 0

            print(f"[*] Saving to: {target_path} ({total_size / (1024*1024):.2f} MB)")

            # 3. Stream data safely to disk
            with open(target_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=16384):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = int(50 * downloaded / total_size)
                            sys.stdout.write(
                                f"\rProgress: [{'=' * percent}{' ' * (50-percent)}] {downloaded / (1024*1024):.2f} MB / {total_size / (1024*1024):.2f} MB"
                            )
                            sys.stdout.flush()

            print(f"\n[SUCCESS] Asset file '{filename}' saved cleanly without ad interference.")
            print("\nSECURITY CHECKLIST (verify before opening):")
            print("  1. Submit hash to VirusTotal")
            print("  2. Open archives inside Windows Sandbox")
            print("  3. Never run disguised .exe or .scr installers")
            return True

    except Exception as e:
        print(f"\n[-] Download stream aborted: {e}")
        return False


def clipboard_monitor_loop():
    """Background listener waiting for suspicious target URLs."""
    if not pyperclip:
        print("[ERROR] pyperclip is required for clipboard monitoring. Run: pip install pyperclip")
        return

    print("=" * 64)
    print("      STREAMARMOR: CROSS-SITE AD-IMMUNE DOWNLOADER ENGINE     ")
    print("   Copy any hostile link to your clipboard to activate radar  ")
    print("=" * 64)
    print("Monitoring clipboard... (Press Ctrl+C to exit)\n")

    last_clipboard_item = ""
    while True:
        try:
            current_clipboard = pyperclip.paste().strip()
            if current_clipboard and current_clipboard != last_clipboard_item:
                last_clipboard_item = current_clipboard

                # Check if copied URL matches hostile file host pattern
                if SPAMMY_HOSTS_REGEX.search(current_clipboard):
                    print(f"\n[RADAR ACTIVATED] Intercepted URL from clipboard: {current_clipboard}")
                    direct_url = safe_intercept_engine(current_clipboard)
                    if direct_url:
                        download_data_stream(direct_url)

        except KeyboardInterrupt:
            print("\n[INFO] Exiting StreamArmor background engine.")
            break
        except Exception as e:
            print(f"[-] Processing exception encountered: {e}")

        time.sleep(1)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--url":
        target = sys.argv[2]
        direct = safe_intercept_engine(target)
        if direct:
            download_data_stream(direct)
    else:
        clipboard_monitor_loop()
