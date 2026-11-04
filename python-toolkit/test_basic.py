#!/usr/bin/env python3
"""
Test suite for StreamArmor / Secure Downloader.
Verifies CLI flags, imports, class structure, and Payload Armor safety filters.
"""

import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
DOWNLOADER = PROJECT_DIR / "downloader.py"


def test_imports():
    """Verify that downloader.py exports the SecureDownloader class."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("downloader", str(DOWNLOADER))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    assert hasattr(mod, "SecureDownloader"), "SecureDownloader class missing in downloader.py"
    print("[PASS] test_imports: SecureDownloader exported correctly")
    return mod


def test_help():
    """Verify that downloader.py responds to --help with all flags."""
    result = subprocess.run([sys.executable, str(DOWNLOADER), "--help"], capture_output=True, text=True)
    assert result.returncode == 0, f"--help failed: {result.stderr}"
    assert "--url" in result.stdout, "--url missing from --help"
    assert "--output" in result.stdout, "--output missing from --help"
    assert "--delay" in result.stdout, "--delay missing from --help"
    assert "--cookies" in result.stdout, "--cookies missing from --help"
    print("[PASS] test_help: CLI arguments verified")


def test_missing_url():
    """Verify that running downloader.py without --url exits with an error."""
    result = subprocess.run([sys.executable, str(DOWNLOADER)], capture_output=True, text=True)
    assert result.returncode != 0, "downloader.py should fail when --url is omitted"
    print("[PASS] test_missing_url: Validation triggers on empty input")


def test_payload_armor(mod):
    """Verify that Payload Armor catches dangerous executables and permits safe media."""
    instance = mod.SecureDownloader(url="https://example.com/test.mp4")

    # Safe test cases
    assert instance.is_safe_extension("https://cdn.example.com/video.mp4")[0] is True
    assert instance.is_safe_extension("https://cdn.example.com/archive.rar")[0] is True
    assert instance.is_safe_extension("https://cdn.example.com/bundle.zip")[0] is True
    assert instance.is_safe_extension("https://cdn.example.com/stream.m3u8")[0] is True

    # Dangerous test cases that MUST be blocked
    assert instance.is_safe_extension("https://badsite.com/installer.exe")[0] is False
    assert instance.is_safe_extension("https://badsite.com/payload.scr")[0] is False
    assert instance.is_safe_extension("https://badsite.com/script.bat")[0] is False
    assert instance.is_safe_extension("https://badsite.com/malware.apk")[0] is False
    assert instance.is_safe_extension("https://badsite.com/update.msi")[0] is False
    print("[PASS] test_payload_armor: Blocked dangerous executable extensions (.exe, .scr, .bat, .apk, .msi)")


if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING STREAMARMOR BASIC TEST SUITE")
    print("=" * 60)
    mod = test_imports()
    test_help()
    test_missing_url()
    test_payload_armor(mod)
    print("=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY (4/4)")
    print("=" * 60)
