#!/usr/bin/env python3
"""Compile the C++ shown on the Sparse Table slide and test it against brute force and the slide's examples."""
import html
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
src = (HERE.parent / "deck/src/slides/02_foundation.html").read_text(encoding="utf8")
block = next(b for b in re.findall(r"<pre class=\"code[^>]*>(.*?)</pre>", src, re.S) if "SparseTable" in b)
code = html.unescape(re.sub(r"<[^>]+>", "", block))
main = r"""
#include <cassert>
int main() {
    SparseTable t({7, 4, 9, 4, 6, 2, 2, 8});
    assert(t.rmq(1, 6) == 5); assert(t.rmq(1, 4) == 1); assert(t.rmq(2, 2) == 2); assert(t.rmq(6, 7) == 6);
    assert(t.rmq(3, 6) == 5); assert(t.rmq(0, 7) == 5); assert(t.rmq(2, 6) == 5);
    mt19937 rng(7);
    long long checked = 0;
    for (int n = 1; n <= 200; ++n) {
        vector<long long> a(n);
        for (auto& x : a) x = rng() % 9;
        SparseTable s(a);
        for (int l = 0; l < n; ++l) {
            int best = l;
            for (int r = l; r < n; ++r) {
                if (a[r] < a[best]) best = r;
                assert(s.rmq(l, r) == best);
                ++checked;
            }
        }
    }
    printf("ok, %lld intervals\n", checked);
}
"""
full = "#include <bits/stdc++.h>\nusing namespace std;\n" + code + main
with tempfile.TemporaryDirectory() as d:
    p = Path(d) / "t.cpp"
    p.write_text(full, encoding="utf8")
    subprocess.run(["g++", "-std=c++17", "-O2", "-Wall", "-Wextra", str(p), "-o", str(Path(d) / "t")], check=True)
    sys.exit(subprocess.run([str(Path(d) / "t")]).returncode)
