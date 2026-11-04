# torupload-safe-downloader

Secure downloader for hostile file-hosting pages (e.g. torupload.com).

## What it does

1. Launches a headless Chromium browser with JavaScript DISABLED for the target origin.
2. Navigates to the file page (no clicks, no script execution).
3. Captures raw file URLs from network traffic.
4. Downloads the file via curl with the correct Referer header.

## What it does NOT do

- Run the page JavaScript
- Click anything on the page
- Solve CAPTCHAs or bypass anti-adblock
- Automate the click-hijack payload
- Circumvent session-bound tokens or IP locks

## Usage

    python downloader.py --url "https://torupload.com/file/3imuvta60y53"
    python downloader.py --url "https://torupload.com/file/3imuvta60y53" --delay 3.0
    python downloader.py --url "https://torupload.com/file/3imuvta60y53" --cookies "session=abc"
    python downloader.py --url "https://example.com/direct/file.rar" --output my_file.rar

## Security checklist (before extracting)

1. Scan the file with VirusTotal or Windows Defender
2. Inspect contents inside Windows Sandbox or a fresh VM
3. Never extract on your daily-driver OS
4. Verify file types: .mp4/.mkv/.avi are expected; .exe/.scr/.bat/.lnk are NOT

## Installation

    pip install -r requirements.txt
    playwright install chromium
