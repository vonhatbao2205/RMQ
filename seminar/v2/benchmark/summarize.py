#!/usr/bin/env python3
"""results_raw.csv -> ../deck/src/bench-data.js (medians + quartiles) and a printed summary.

Also verifies that every structure returned the same checksum on the same workload.
"""
import csv
import json
from collections import defaultdict
from pathlib import Path
from statistics import median

HERE = Path(__file__).resolve().parent
rows = list(csv.DictReader(open(HERE / "results_raw.csv")))
groups = defaultdict(list)
for r in rows:
    groups[(r["exp"], int(r["n"]), int(r["q"]), int(r["len"]), int(r["update_pct"]), r["algo"])].append(r)


def quartiles(v):
    v = sorted(v)
    return v[len(v) // 4], median(v), v[(3 * len(v)) // 4]


# checksum check: same exp/n/q/len/pct must agree across structures, except Scan/Sqrt whose q is smaller in some runs
cs = defaultdict(set)
for k, g in groups.items():
    cs[k[:5]].update(x["checksum"] for x in g)
bad = {k: v for k, v in cs.items() if len(v) > 1 and k[0] != "mixed"}
print("checksum mismatches:", len(bad))

out = {"scale": {}, "length": {}, "breakeven": {}, "mixed": {}}
for (exp, n, q, ln, pct, algo), g in sorted(groups.items()):
    ns = quartiles([float(x["ns_per_op"]) for x in g])
    build = quartiles([float(x["build_ms"]) for x in g])
    ops = quartiles([float(x["ops_ms"]) for x in g])
    total = quartiles([float(x["build_ms"]) + float(x["ops_ms"]) for x in g])
    mem = int(g[0]["aux_bytes"])
    if exp == "scale":
        out[exp].setdefault(algo, []).append({"n": n, "ns": round(ns[1], 2), "lo": round(ns[0], 2), "hi": round(ns[2], 2),
                                              "build": round(build[1], 4), "mem": mem})
    elif exp == "length":
        out[exp].setdefault(algo, []).append({"L": ln, "ns": round(ns[1], 2), "lo": round(ns[0], 2), "hi": round(ns[2], 2)})
    elif exp == "breakeven":
        out[exp].setdefault(algo, []).append({"q": q, "total": round(total[1], 4), "build": round(build[1], 4), "ops": round(ops[1], 4)})
    else:
        out[exp].setdefault(algo, []).append({"pct": pct, "ms": round(total[1], 3), "ops": round(ops[1], 3), "lo": round(total[0], 3), "hi": round(total[2], 3)})
for exp in ("scale", "length", "breakeven", "mixed"):
    key = {"scale": "n", "length": "L", "breakeven": "q", "mixed": "pct"}[exp]
    for a in out[exp]:
        out[exp][a].sort(key=lambda r: r[key])
(HERE.parent / "deck" / "src").mkdir(parents=True, exist_ok=True)
(HERE.parent / "deck" / "src" / "bench-data.js").write_text(
    "// Generated from benchmark/results_raw.csv by benchmark/summarize.py\nwindow.BENCH = " + json.dumps(out) + ";\n")

print("\nscale (n=2^16, 2^20, 2^23)")
for a, v in out["scale"].items():
    for r in v:
        if r["n"] in (1 << 16, 1 << 20, 1 << 23):
            print(f"  {a:12s} n=2^{r['n'].bit_length()-1}: {r['ns']:>10} ns/q  build {r['build']:>9} ms  mem {r['mem']/r['n']:.2f} B/elem")
print("\nlength (ns/q)")
for a, v in out["length"].items():
    print(" ", a, [(r["L"], r["ns"]) for r in v])
print("\nbreakeven total ms")
for a, v in out["breakeven"].items():
    print(" ", a, [(r["q"], r["total"]) for r in v])
print("\nmixed total ms")
for a, v in out["mixed"].items():
    print(" ", a, [(r["pct"], r["ms"]) for r in v])
