"""Bundle the existing observer with its Python runtime; end users need no Python."""
import os
from pathlib import Path
import subprocess
import sys

args = [sys.executable, '-m', 'PyInstaller', '--noconfirm', '--clean', '--onedir', '--console',
        '--name', 'mirrorville-observer', '--distpath', 'output/desktop-helper',
        '--workpath', 'output/desktop-helper-build', '--specpath', 'output/desktop-helper-build']
# Conda puts these dependencies outside DLLs; the bundle must remain independent of PATH.
for name in ('sqlite3.dll', 'ffi.dll', 'libmpdec-4.dll'):
    library = Path(sys.prefix) / 'Library' / 'bin' / name
    if library.is_file():
        args.extend(['--add-binary', str(library) + os.pathsep + '.'])
args.append('desktop/native_host.py')
env = dict(os.environ, PYTHONPATH='')
raise SystemExit(subprocess.call(args, env=env))
