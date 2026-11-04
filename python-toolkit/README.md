# StreamArmor: Universal Anti-Hijack Media & File Downloader

StreamArmor neutralizes the malicious mechanics found on aggressive file-hosting pages (such as `torupload.com`, `rapidgator.net`, etc.) without executing CAPTCHA bypasses or click-fraud scripts.

## The Problem StreamArmor Solves

Hostile file pages trap users with a catch-22:
- **Adblock ON**: The page detects missing ad units and blocks download behind an "Ad Block Detected" overlay wall.
- **Adblock OFF**: The page arms document-wide click-jacking listeners (`document.body.addEventListener('click', ...)`). Clicking anywhere spawns 20+ tabs via `window.open()`, redirects to scam landers, or forces disguised malware payloads (`.exe`, `.scr`, `.apk`).

## How StreamArmor Fixes This Safely

1. **Zero Browser Execution of Ad Scripts**: Fetches raw media streams (`.mp4`, `.mkv`, `.m3u8`) and archives (`.rar`, `.zip`) directly via CDN or clean HTTP requests with natural `Referer` and `User-Agent` headers.
2. **Headless Anti-Popup Radar**: If an interactive browser is needed (to solve a visible captcha manually), Playwright destroys every popup window the millisecond it tries to spawn (`page.on('popup', kill_popup)`).
3. **Payload Armor Shield**: Inspects both file extension and server `Content-Type` headers before writing any bytes to disk. If an executable wrapper is detected (`.exe`, `.msi`, `.bat`, `.scr`, `.apk`), the connection is instantly severed.
4. **Pre-Extraction Security Checklist**:
   - Verify SHA-256 hash against VirusTotal.
   - Inspect archive contents inside Windows Sandbox or an isolated VM.
   - Never run disguised executable wrappers or downloaders.

## Quick Start

### 1. Web Interface
Use the web application to probe URLs, inspect server headers, download clean files directly through the streaming proxy, and generate `yt-dlp` / `curl` commands.

### 2. Standalone Python CLI
```bash
python downloader.py --url "https://torupload.com/file/3imuvta60y53"
```

### 3. Desktop Tkinter GUI
```bash
python gui.py
```

### 4. Background Clipboard Radar (compilable to .exe)
```bash
python app.py
```
To bundle as a single standalone executable:
```bash
pyinstaller --onefile --name="AntiSpamDownloader" app.py
```
