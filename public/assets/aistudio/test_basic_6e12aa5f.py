import subprocess
import sys
from pathlib import Path
PROJECT_DIR = Path(__file__).resolve().parent.parent
DOWNLOADER = PROJECT_DIR / 'downloader.py'

def test_help():
    result = subprocess.run([sys.executable, str(DOWNLOADER), '--help'], capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    assert '--url' in result.stdout
    print('[PASS] test_help')

def test_missing_url():
    result = subprocess.run([sys.executable, str(DOWNLOADER)], capture_output=True, text=True)
    assert result.returncode != 0
    print('[PASS] test_missing_url')

def test_imports():
    import importlib.util
    spec = importlib.util.spec_from_file_location('downloader', str(DOWNLOADER))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    assert hasattr(mod, 'SecureDownloader')
    print('[PASS] test_imports')

if __name__ == '__main__':
    test_imports()
    test_help()
    test_missing_url()
    print('All tests passed.')
