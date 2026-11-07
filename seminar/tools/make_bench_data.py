"""Tạo slides/js/bench-data.js (dữ liệu cho demo “điểm hòa vốn”) từ benchmark/results_summary_all.csv.

Chạy sau make_figures.py:  python seminar/tools/make_bench_data.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "benchmark" / "results_summary_all.csv"
OUT = ROOT / "slides" / "js" / "bench-data.js"
ALGOS = ["Scan", "Sqrt", "Segment", "Linear", "Sparse"]
N = 1 << 20


def main() -> None:
    rows = list(csv.DictReader(SRC.open()))
    be = [r for r in rows if r["exp"] == "breakeven"]
    scale = {r["algo"]: r for r in rows if r["exp"] == "scale" and int(r["n"]) == N}
    out = {"n": N, "qs": sorted({int(r["q"]) for r in be}), "algos": {}}
    for a in ALGOS:
        out["algos"][a] = {
            "measured": {str(int(r["q"])): round(float(r["total"]), 4) for r in be if r["algo"] == a},
            "build_ms": round(float(scale[a]["build"]), 4),
            "ns_per_query": round(float(scale[a]["ns"]), 3),
        }
    OUT.write_text("// Generated from seminar/benchmark/results_summary_all.csv by tools/make_bench_data.py\n"
                   "window.BENCH = " + json.dumps(out) + ";\n")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
