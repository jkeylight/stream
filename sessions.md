# StreamArmor — Session History & Project Documentation

**Project Name**: StreamArmor — Universal Anti-Hijack Media & Safe Stream Downloader  
**User / Operator**: `Jkeylight@gmail.com`  
**Runtime Environment**: Node.js v22 (Express + Vite + React 19 + TypeScript + Tailwind CSS v4) & Python 3.10.12  
**Date**: November 4, 2026  
**Status**: Production Ready — Verified & Compiled  

---

## 1. Executive Summary & Problem Addressed

StreamArmor was engineered to resolve the adversarial trap created by aggressive, spammy file-hosting and video-streaming websites (such as `torupload.com`, `rapidgator.net`, `uploaded.net`, `katfile.com`, etc.).

### The Core Threat Model
Hostile file hosts operate on an ad-fraud and malvertising business model designed around a malicious catch-22:
1. **Adblocker Active**: An anti-adblock detection script trips on missing tracking elements (e.g. Google DoubleClick or `gettoken.php`), locking the interface behind a modal claiming *"Ad Block Detected — Disable to proceed"*.
2. **Adblocker Disabled**: Disabling the blocker arms a document-wide event listener attached to `document.body` (`mousedown` / `click`). The first click anywhere on the page fires `window.open()` in rapid succession, spawning **20+ cascading pop-under and affiliate redirect tabs**.
3. **Malware / PPI Payload Disguise**: Instead of serving the promised media (`.mp4`, `.mkv`, `.rar`), pay-per-install (PPI) networks route the download button to dangerous executable wrappers (`.exe`, `.scr`, `.msi`, `.bat`, `.apk`) or password-protected decoy archives.
4. **Access Control & Session Tokens (403 / 407)**: Direct file endpoints frequently enforce server-side header verification (`Referer`, `User-Agent`, cookies, or temporary IP-bound tokens), rejecting direct tool downloads with `403 Forbidden` or `407 Proxy Authentication Required`.

### StreamArmor's Resolution Philosophy
- **Zero In-Page JavaScript**: Fetch media streams like a machine without executing malicious browser scripts.
- **Anti-Popup Radar**: In headless browser environments, intercept and terminate popup windows at the instant of creation (`page.on('popup', kill_popup)`), depriving ad networks of impression metrics.
- **Payload Armor**: Deep-inspect both file extension and server response `Content-Type` headers in-flight. Connection is terminated immediately if executable binaries are detected.
- **Header Synthesis**: Natural Referer and User-Agent spoofing to bypass 403 token and anti-leech blocks.

---

## 2. Completed Architecture & Deliverables

### A. Full-Stack Backend (`server.ts`)
- **`POST /api/probe`**:
  - Safe server-side link inspection using non-browser HTTP HEAD/GET probes.
  - Follows redirect hops up to 5 times.
  - Gathers status codes (200, 403, 407, 302), server headers, true filename, and Content-Disposition.
  - Runs **Payload Armor Threat Assessment**: categorizes targets into `clean_media`, `clean_archive`, `malicious_executable`, or `gated_page`.
  - Halts dangerous executable lures (`.exe`, `.scr`, `.bat`, `.apk`, `.msi`) before dispatching remote requests.
- **`GET /api/stream-download`**:
  - Direct proxy streaming engine. Fetches raw binary chunks from CDN servers using the target Referer and User-Agent.
  - Inspects MIME types in real-time, aborting if an executable wrapper is pushed.
  - Pipes clean chunks directly to the user's browser download manager with `Content-Disposition: attachment`.
- **`POST /api/generate-tools`**:
  - Generates ready-to-run terminal commands for `yt-dlp` (`--no-proxy`, `--referer`), `curl`, `wget`, `aria2c` (8 multi-connection threads), and PowerShell.
  - Generates tailored uBlock Origin filter rules (`||domain^$popup`, `||domain##+js(nobab)`, `||domain##+js(acis)`).
  - Generates safe DevTools console extraction snippets.
- **`GET /api/scripts`**:
  - Serves source code, metadata, file sizes, and line counts for the entire standalone Python suite.
- **`POST /api/run-test`**:
  - Executes `python3 python-toolkit/test_basic.py` asynchronously on the server and returns real stdout, stderr, and exit codes.
- **`GET /api/download-bundle`**:
  - Dynamically packages `python-toolkit/` into `streamarmor-python-toolkit.zip` using Python's standard `zipfile` module.
- **`POST /api/hash-check`**:
  - Generates SHA-256 and MD5 checksums for strings or remote URLs with direct lookup links to VirusTotal.

### B. Python Desktop & Automation Suite (`/python-toolkit`)
- **`downloader.py`**:
  - Class-based engine (`SecureDownloader`) with full argument parsing (`--url`, `--output`, `--delay`, `--cookies`, `--referer`, `--user-agent`, `--no-proxy`).
  - Native curl subprocess executor and fallback streaming engine.
- **`app.py`**:
  - Standalone desktop daemon with `pyperclip` **Clipboard Watcher**.
  - Auto-detects hostile domains (`torupload.com`, `rapidgator.net`, `katfile.com`, etc.) when copied to the clipboard.
  - Instantiates an isolated Playwright Chromium context.
  - Kills pop-under windows via `page.on("popup", kill_popup)`.
  - Sniffs network responses for raw attachments and media streams.
  - Enforces Payload Armor to prevent executable delivery.
  - Compilable to a standalone `.exe` using PyInstaller.
- **`gui.py`**:
  - Cross-platform Tkinter GUI application with URL input, delay controller, cookies configuration, live log view, and one-click Downloads folder launcher.
- **`test_basic.py`**:
  - Automated test suite validating:
    - `test_imports`: verifies `SecureDownloader` class export.
    - `test_help`: verifies CLI help flags.
    - `test_missing_url`: verifies non-zero exit on empty input.
    - `test_payload_armor`: verifies blocking of `.exe`, `.scr`, `.bat`, `.apk`, `.msi` and permission of `.mp4`, `.mkv`, `.rar`, `.zip`.
    - **Result: 4/4 Tests Passing**.
- **`make_zip.py`**:
  - Portable script to package the toolkit into a distribution ZIP.
- **`run.bat`**:
  - One-click Windows runner that checks Python 3.10+, installs dependencies from `requirements.txt`, and launches GUI or CLI.
- **`requirements.txt`**:
  - `playwright>=1.40.0`, `requests>=2.31.0`, `pyperclip>=1.8.2`, `beautifulsoup4>=4.12.0`, `pyinstaller>=6.3.0`.
- **`README.md`**:
  - Comprehensive technical manual and build guide.

### C. Web Frontend (`/src`)
- **Header (`Header.tsx`)**:
  - Strict Top Bar Contract: Wordmark brand, 5 single-line navigation links, user identity badge (`Jkeylight@gmail.com`), and primary action button.
- **Stream Radar (`StreamRadar.tsx`)**:
  - Interactive URL inspector with preset examples (Direct MP4, Clean RAR Archive, TorUpload Hostile Page, 403 Token Link, and Malicious EXE Lure).
  - Collapsible Advanced Header Drawer (Referer, Cookies, User-Agent).
  - Payload Armor verdict banners (Clean Media, Clean Archive, Critical Executable Blocked, Gated Page).
  - Metric strips with tabular numerals (`tabular-nums`).
  - Terminal commands generator with tabbed syntax viewer.
- **Live Downloader & Batch Queue (`LiveStreamer.tsx`)**:
  - Real-time proxy streaming downloader with native browser download triggers.
  - Batch URL Radar: queue multiple links, run parallel probing, and view results in a high-density tabular grid.
  - Cryptographic hash calculator (SHA-256 / MD5) with VirusTotal lookup.
- **Python Hub (`ScriptHub.tsx`)**:
  - In-app syntax-highlighted code explorer for all 7 scripts.
  - Live server test runner button with terminal output feed.
  - 1-Click ZIP bundle download.
  - PyInstaller step-by-step compilation recipe.
- **Hostile Deconstruction (`HostileDeconstruction.tsx`)**:
  - Deep-dive analysis of the 5 monetization mechanics (CPM impression mill, affiliate redirect hubs, PPI malware distribution, notification phishing, and premium extortion).
  - Interactive click-jacking disarmer sandbox.
- **DevTools Manual Guide (`DevToolsGuide.tsx`)**:
  - Step-by-step instructions for extracting media URLs manually when desktop tools are unavailable.
  - Ready-to-copy uBlock Origin anti-popunder filters.
- **Security Checklist Modal (`SecurityChecklistModal.tsx`)**:
  - Pre-extraction safety protocols for `.rar` and `.zip` archives.

---

## 3. Recommended High-Value Features to Add

1. **Automated CAPTCHA Prompt Bridge**:
   - For file hosts that require numeric or image CAPTCHAs (like the 4-digit code on TorUpload), integrate an OCR reader (or display the cropped CAPTCHA image directly in the Web UI so the user can type the 4 digits without ever visiting the hostile page).
2. **Dynamic Proxy / VPN Rotator**:
   - Support routing probe and stream requests through SOCKS5 / HTTP proxies with automatic rotation to prevent IP rate-limiting on free host tiers.
3. **HLS (.m3u8) Stream Stitcher & Converter**:
   - For video hosts that split videos into segmented `.ts` chunks, integrate an in-browser or backend `ffmpeg` transcode pipeline that downloads all segments and outputs a single `.mp4` file.
4. **Browser Extension / Bookmarklet ("StreamArmor Sniffer")**:
   - A lightweight browser extension or 1-line bookmarklet that grabs the current page's cookies, session tokens, and video `<video src>` / Network request URLs, passing them directly to the StreamArmor API with one click.
5. **Scheduled Queue & Bandwidth Governor**:
   - For hosts that throttle free speeds, allow queuing 20+ files with scheduled off-peak downloading, speed limiting, and auto-retry on dropped connections.
6. **VirusTotal API Auto-Scan Key Integration**:
   - Optional user configuration of a free VirusTotal API key to automatically query file hashes in the background upon probe completion.

---

## 4. Operator Profile & Environment Verification

- **Authenticated User**: `Jkeylight@gmail.com`
- **Assigned Role**: Lead Security Operator & Stream Analyst
- **Active Protocol**: StreamArmor v2.4 Universal Shield
- **Test Suite Status**: 100% Passed (4/4 test cases)
- **TypeScript & Lint Status**: 0 Errors
