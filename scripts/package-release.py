"""Create a portable KinArc source + built-web archive, without local secrets/models."""
from pathlib import Path
import sys
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else root.parent / 'KinArc-complete-web.zip'
exclude = {'.git', 'node_modules', '.venv', 'models', '.firebase', '.openai', 'ios', 'test-results', 'playwright-report', '__pycache__'}
out.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(out, 'w', ZIP_DEFLATED, compresslevel=6) as archive:
    for path in sorted(root.rglob('*')):
        rel = path.relative_to(root)
        if not path.is_file() or any(part in exclude for part in rel.parts):
            continue
        if path.name == '.DS_Store' or path.suffix in {'.zip', '.log', '.pyc', '.pem', '.key'}:
            continue
        if path.name.startswith('.env') and path.name != '.env.example':
            continue
        archive.write(path, Path(root.name) / rel)
with ZipFile(out) as archive:
    assert archive.testzip() is None, 'Archive integrity check failed'
    for required in ['src/index.html', 'dist/index.html', 'public/fonts/manrope-latin.woff2', 'package-lock.json', 'README.md']:
        assert root.name + '/' + required in archive.namelist(), required
    print(f'{out}\n{len(archive.namelist())} files · {out.stat().st_size / 1024 / 1024:.1f} MB · integrity verified')
