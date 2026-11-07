"""Biên dịch và kiểm thử các đoạn C++ hiển thị trên slide (so với duyệt trực tiếp).

Chạy:  python3 seminar/tools/check_slide_code.py      (cần g++)
"""
import html
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SLIDES = Path(__file__).resolve().parent.parent / "slides" / "index.html"

HARNESS = r"""
#include <bits/stdc++.h>
using namespace std;
#include "block0.cpp"
struct LinearRMQ {
    int n; vector<int> a; vector<uint64_t> mask; SparseTable top;
    static vector<int> mins(const vector<int>& v) {
        vector<int> m((v.size() + 63) / 64, INT_MAX);
        for (size_t i = 0; i < v.size(); ++i) m[i / 64] = min(m[i / 64], v[i]);
        return m;
    }
    LinearRMQ(const vector<int>& v) : n(v.size()), a(v), mask(v.size()), top(mins(v)) {
#include "build.inc"
    }
#include "query.inc"
};
int main() {
    mt19937 rng(7); long long checked = 0;
    for (int n = 1; n <= 400; ++n) for (int rep = 0; rep < 3; ++rep) {
        vector<int> a(n); for (auto& x : a) x = int(rng() % (rep == 0 ? 4 : 1000)) - 2;
        SparseTable st(a); LinearRMQ lin(a);
        for (int l = 0; l < n; ++l) { int m = INT_MAX; for (int r = l; r < n; ++r) {
            m = min(m, a[r]);
            if (st.query(l, r) != m || lin.query(l, r) != m) { printf("FAIL n=%d l=%d r=%d\n", n, l, r); return 1; }
            ++checked; } }
    }
    printf("slide code OK: %lld intervals checked against brute force\n", checked);
}
"""


def main() -> int:
    src = SLIDES.read_text(encoding="utf-8")
    blocks = [html.unescape(b) for b in re.findall(r'<code class="language-cpp"[^>]*>(.*?)</code>', src, re.S)]
    sparse, cses, linear = blocks[0], blocks[1], blocks[2]
    lines = linear.strip("\n").splitlines()
    k = next(i for i, line in enumerate(lines) if line.startswith("int inBlock"))
    query = "\n".join(lines[k:]).replace("int inBlock(int l, int r) {", "int inBlock(int l, int r) const {") \
                                .replace("int query(int l, int r) {", "int query(int l, int r) const {")
    with tempfile.TemporaryDirectory() as d:
        dd = Path(d)
        (dd / "block0.cpp").write_text(sparse)
        (dd / "build.inc").write_text("\n".join(lines[:k]) + "\n")
        (dd / "query.inc").write_text(query + "\n")
        (dd / "test.cpp").write_text(HARNESS)
        (dd / "cses.cpp").write_text("#include <bits/stdc++.h>\nusing namespace std;\n" + sparse + cses)
        for f in ("test.cpp", "cses.cpp"):
            r = subprocess.run(["g++", "-O2", "-std=c++17", "-Wall", "-Wextra", f, "-o", f[:-4]], cwd=dd,
                               capture_output=True, text=True)
            if r.returncode:
                print(r.stderr)
                return 1
        sample = subprocess.run([str(dd / "cses")], input="8 3\n5 2 6 3 1 7 4 8\n2 7\n1 4\n6 8\n",
                                capture_output=True, text=True).stdout.split()
        assert sample == ["1", "2", "4"], sample
        print("CSES sample OK:", " ".join(sample))
        return subprocess.run([str(dd / "test")]).returncode


if __name__ == "__main__":
    sys.exit(main())
