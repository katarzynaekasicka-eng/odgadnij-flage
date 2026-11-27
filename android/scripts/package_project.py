#!/usr/bin/env python3
"""Create a complete portable Android Studio project without local keys or caches."""
from pathlib import Path
import argparse, zipfile
root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('output', type=Path)
args = parser.parse_args()
web_source = root.parent / 'index.html'
if not web_source.exists():
    web_source = root / 'game-source/index.html'
assert web_source.exists(), 'Missing complete game source'
excluded_dirs = {'.git', '.gradle', '.local', '.idea', 'build', 'game-source', 'tests'}
excluded_files = {'local.properties', 'keystore.properties', 'source-index.html'}
args.output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(args.output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for f in sorted(root.rglob('*')):
        rel = f.relative_to(root)
        if not f.is_file() or any(p in excluded_dirs for p in rel.parts):
            continue
        if f.name in excluded_files or f.suffix in {'.jks', '.keystore'}:
            continue
        archive.write(f, str(Path('OdgadnijFlage-Android') / rel))
    archive.write(web_source, 'OdgadnijFlage-Android/game-source/index.html')
with zipfile.ZipFile(args.output) as archive:
    assert archive.testzip() is None
    assert not any('.local/' in n or n.endswith(('.keystore', '.jks', 'local.properties', '/keystore.properties')) for n in archive.namelist())
print(args.output)
