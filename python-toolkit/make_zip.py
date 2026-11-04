#!/usr/bin/env python3
import os
import sys
import zipfile
from pathlib import Path

def create_bundle(output_path):
    toolkit_dir = Path(__file__).resolve().parent
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file in toolkit_dir.glob('*'):
            if file.is_file() and not file.name.endswith('.zip') and file.name != 'make_zip.py':
                zipf.write(file, arcname=file.name)

    print("SUCCESS")
    return 0

if __name__ == '__main__':
    dest = sys.argv[1] if len(sys.argv) > 1 else 'streamarmor-toolkit.zip'
    sys.exit(create_bundle(dest))
