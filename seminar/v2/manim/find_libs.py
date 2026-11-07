#!/usr/bin/env python3
"""Print an LD_LIBRARY_PATH of Nix-store libs that this Python can actually load.

Store paths change after garbage collection, and the store also holds 32-bit builds
and builds against a newer glibc, so each candidate is tried in a subprocess.
"""
import glob
import subprocess
import sys

SONAMES = """libGL.so.1 libX11.so.6 libXext.so.6 libXi.so.6 libXrandr.so.2 libXcursor.so.1 libXinerama.so.1
libXxf86vm.so.1 libXrender.so.1 libXfixes.so.3 libxkbcommon.so.0 libpangocairo-1.0.so.0 libpango-1.0.so.0
libpangoft2-1.0.so.0 libcairo.so.2 libglib-2.0.so.0 libgobject-2.0.so.0 libfontconfig.so.1 libfreetype.so.6
libharfbuzz.so.0""".split()


def loads(path):
    code = f"import ctypes; ctypes.CDLL({path!r})"
    return subprocess.run([sys.executable, "-I", "-c", code], capture_output=True).returncode == 0


dirs = []
for so in SONAMES:
    for path in sorted(glob.glob(f"/nix/store/*/lib/{so}")):
        if loads(path):
            d = path.rsplit("/", 1)[0]
            if d not in dirs:
                dirs.append(d)
            break
    else:
        print(f"missing {so}", file=sys.stderr)
print(":".join(dirs))
