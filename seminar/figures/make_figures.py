"""Benchmark figures for the RMQ seminar slides (house style: scientific-figure-making).

Reads ../benchmark/results_raw.csv, writes SVG (+PNG backup) into ../slides/figures/.
Run:  python make_figures.py
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402
from matplotlib import font_manager  # noqa: E402
from matplotlib.ticker import FixedLocator, FuncFormatter, NullLocator  # noqa: E402

HERE = Path(__file__).resolve().parent
RAW = HERE.parent / "benchmark" / "results_raw.csv"
OUT = HERE.parent / "slides" / "figures"
FONT_DIR = HERE.parent / "manim" / "fonts"

PALETTE = {
    "blue_main": "#0F4D92",
    "blue_secondary": "#3775BA",
    "green_1": "#DDF3DE", "green_2": "#AADCA9", "green_3": "#8BCF8B",
    "red_1": "#F6CFCB", "red_2": "#E9A6A1", "red_strong": "#B64342",
    "neutral": "#CFCECE", "highlight": "#FFD700",
    "teal": "#42949E", "violet": "#9A4D8E",
    "gray_dark": "#4D4D4D", "gray_mid": "#767676",
}

# One fixed color per algorithm, shared with the slides and the manim scenes.
ALGO = {
    "Scan":    dict(color=PALETTE["gray_mid"],   marker="o", label="Duyệt trực tiếp"),
    "Sqrt":    dict(color=PALETTE["teal"],       marker="s", label="Chia khối √n"),
    "Segment": dict(color=PALETTE["red_strong"], marker="^", label="Segment Tree"),
    "Sparse":  dict(color=PALETTE["blue_main"],  marker="D", label="Sparse Table"),
    "Linear":  dict(color=PALETTE["violet"],     marker="P", label="RMQ tuyến tính (bitmask)"),
}
ORDER = ["Scan", "Sqrt", "Segment", "Linear", "Sparse"]


@dataclass(frozen=True)
class FigureStyle:
    font_size: int = 24
    axes_linewidth: float = 2.5


def apply_publication_style(style: FigureStyle = FigureStyle()) -> None:
    for ttf in sorted(FONT_DIR.glob("SourceSans3-*.ttf")):
        font_manager.fontManager.addfont(str(ttf))
    plt.rcParams.update({
        "font.family": ["Source Sans 3", "DejaVu Sans", "sans-serif"],
        "mathtext.fontset": "cm",   # math in Computer Modern, like KaTeX on the slides
        "font.size": style.font_size,
        "axes.titlesize": style.font_size + 2,
        "axes.labelsize": style.font_size,
        "xtick.labelsize": style.font_size - 2,
        "ytick.labelsize": style.font_size - 2,
        "legend.fontsize": style.font_size - 3,
        "axes.spines.right": False,
        "axes.spines.top": False,
        "axes.linewidth": style.axes_linewidth,
        "xtick.major.width": style.axes_linewidth,
        "ytick.major.width": style.axes_linewidth,
        "xtick.major.size": 7,
        "ytick.major.size": 7,
        "xtick.minor.size": 0,
        "ytick.minor.size": 0,
        "legend.frameon": False,
        "axes.unicode_minus": False,
        # Text as paths: SVG inside <img> cannot use the page's web fonts.
        "svg.fonttype": "path",
        "figure.facecolor": "white",
        "axes.facecolor": "white",
    })


def finalize_figure(fig, name: str, pad: float = 1.0, layout: bool = True) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    if layout:
        fig.tight_layout(pad=pad)
    fig.savefig(OUT / f"{name}.svg")
    fig.savefig(OUT / f"{name}.png", dpi=200)
    plt.close(fig)
    print("saved", OUT / f"{name}.svg")


def load() -> pd.DataFrame:
    d = pd.read_csv(RAW)
    g = d.groupby(["exp", "n", "q", "len", "update_pct", "algo"])
    s = g.agg(
        build=("build_ms", "median"),
        ops=("ops_ms", "median"),
        ns=("ns_per_op", "median"),
        ns_q1=("ns_per_op", lambda x: x.quantile(0.25)),
        ns_q3=("ns_per_op", lambda x: x.quantile(0.75)),
        mem=("aux_bytes", "first"),
    ).reset_index()
    tot = d.assign(total=d.build_ms + d.ops_ms).groupby(
        ["exp", "n", "q", "len", "update_pct", "algo"]).total
    s["total"] = tot.median().values
    s["total_q1"] = tot.quantile(0.25).values
    s["total_q3"] = tot.quantile(0.75).values
    return s


def pow2_axis(ax, lo: int, hi: int, step: int = 2) -> None:
    ax.set_xscale("log", base=2)
    ticks = [2 ** k for k in range(lo, hi + 1, step)]
    ax.xaxis.set_major_locator(FixedLocator(ticks))
    ax.xaxis.set_minor_locator(NullLocator())
    ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"$2^{{{int(round(np.log2(v)))}}}$"))


def plain_log_y(ax) -> None:
    ax.set_yscale("log")
    ax.yaxis.set_major_formatter(FuncFormatter(
        lambda v, _: f"{v:g}" if v >= 0.01 else f"{v:.0e}"))


def direct_labels(ax, ends: dict[str, tuple[float, float]], dx: float = 1.12,
                  nudge: dict[str, float] | None = None) -> None:
    nudge = nudge or {}
    for algo, (x, y) in ends.items():
        ax.annotate(ALGO[algo]["label"], (x, y), xytext=(x * dx, y * nudge.get(algo, 1.0)),
                    color=ALGO[algo]["color"], fontsize=plt.rcParams["legend.fontsize"],
                    fontweight="semibold", va="center", ha="left", annotation_clip=False)


# ---------------------------------------------------------------- figures
def fig_query_vs_n(s: pd.DataFrame) -> None:
    x = s[s.exp == "scale"]
    fig, ax = plt.subplots(figsize=(14, 6.6))
    ends = {}
    for algo in ORDER:
        r = x[x.algo == algo].sort_values("n")
        st = ALGO[algo]
        ax.fill_between(r.n, r.ns_q1, r.ns_q3, color=st["color"], alpha=0.15, lw=0)
        ax.plot(r.n, r.ns, color=st["color"], marker=st["marker"], ms=9, lw=3)
        ends[algo] = (r.n.iloc[-1], r.ns.iloc[-1])
    pow2_axis(ax, 10, 23)
    plain_log_y(ax)
    ax.set_ylim(0.6, 6e5)
    ax.set_xlim(2 ** 9.7, 2 ** 23.3)
    ax.set_xlabel("Kích thước mảng n")
    ax.set_ylabel("Thời gian / truy vấn (ns, log)")
    # Sparse table footprint 4·n·(log n + 1) bytes passes the 24 MiB L3 at n = 2^19.
    ax.axvline(2 ** 19, color=PALETTE["gray_dark"], ls="--", lw=1.8)
    ax.text(2 ** 19 * 0.93, 2e5, "bảng Sparse Table\nvượt L3 = 24 MiB", ha="right", va="center",
            fontsize=17, color=PALETTE["gray_dark"])
    direct_labels(ax, ends, nudge={"Linear": 1.25, "Sparse": 0.7, "Segment": 0.85, "Sqrt": 1.25})
    ax.set_title("Truy vấn ngẫu nhiên: ns/truy vấn theo n (median, dải = IQR, 5 lần)", loc="left")
    fig.subplots_adjust(right=0.78)
    finalize_figure(fig, "bench_query_vs_n")


def fig_build_memory(s: pd.DataFrame) -> None:
    x = s[s.exp == "scale"]
    fig, axes = plt.subplots(1, 2, figsize=(15, 6.4))
    ax = axes[0]
    for algo in ["Sqrt", "Segment", "Linear", "Sparse"]:
        r = x[x.algo == algo].sort_values("n")
        st = ALGO[algo]
        ax.plot(r.n, r.build, color=st["color"], marker=st["marker"], ms=8, lw=3, label=st["label"])
    pow2_axis(ax, 10, 23, step=3)
    plain_log_y(ax)
    ax.set_xlabel("n")
    ax.set_ylabel("Thời gian xây (ms, log)")
    ax.set_title("(a) Tiền xử lý", loc="left")
    fig.legend(*ax.get_legend_handles_labels(), loc="upper center", ncol=4, bbox_to_anchor=(0.5, 1.0))

    ax = axes[1]
    for algo in ["Sqrt", "Segment", "Linear", "Sparse"]:
        r = x[x.algo == algo].sort_values("n")
        st = ALGO[algo]
        ax.plot(r.n, r.mem / r.n, color=st["color"], marker=st["marker"], ms=8, lw=3)
    pow2_axis(ax, 10, 23, step=3)
    ax.set_ylim(-13, 95)
    ax.set_xlabel("n")
    ax.set_ylabel("Bộ nhớ phụ (byte / phần tử)")
    ax.set_title("(b) Bộ nhớ phụ ngoài mảng A", loc="left")
    ax.text(2 ** 15, 30, "Sparse Table: 4·(⌊log₂n⌋+1)", color=ALGO["Sparse"]["color"], ha="left",
            va="bottom", fontsize=18, fontweight="semibold")
    ax.text(2 ** 10, 13, "RMQ tuyến tính ≈ 8,2–9  ·  Segment Tree = 8", color=ALGO["Linear"]["color"],
            ha="left", va="bottom", fontsize=18, fontweight="semibold")
    ax.text(2 ** 10, -12.5, "Chia khối √n ≈ 0", color=ALGO["Sqrt"]["color"], ha="left", va="bottom",
            fontsize=18, fontweight="semibold")
    fig.tight_layout(pad=1.0, rect=(0, 0, 1, 0.9))
    finalize_figure(fig, "bench_build_memory", layout=False)


def fig_query_length(s: pd.DataFrame) -> None:
    x = s[s.exp == "length"]
    fig, ax = plt.subplots(figsize=(14, 6.6))
    ends = {}
    for algo in ORDER:
        r = x[x.algo == algo].sort_values("len")
        st = ALGO[algo]
        ax.fill_between(r.len, r.ns_q1, r.ns_q3, color=st["color"], alpha=0.15, lw=0)
        ax.plot(r.len, r.ns, color=st["color"], marker=st["marker"], ms=9, lw=3)
        ends[algo] = (r.len.iloc[-1], r.ns.iloc[-1])
    ax.set_xscale("log", base=2)
    ticks = [1, 4, 16, 64, 256, 1024, 4096, 16384, 65536, 262144, 1 << 20]
    ax.xaxis.set_major_locator(FixedLocator(ticks))
    ax.xaxis.set_minor_locator(NullLocator())
    ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"$2^{{{int(round(np.log2(v)))}}}$"))
    plain_log_y(ax)
    ax.set_ylim(3, 2e5)
    ax.axvspan(0.8, 128 * 1.3, color=PALETTE["highlight"], alpha=0.18, lw=0)
    ax.text(1.0, 9e4, "L ≤ 128: duyệt thẳng\nnhanh nhất", fontsize=18, color=PALETTE["gray_dark"],
            va="top")
    ax.set_xlabel("Độ dài đoạn truy vấn L = r − l + 1   (n = 2²² ≈ 4,2 triệu)")
    ax.set_ylabel("ns / truy vấn (log)")
    direct_labels(ax, ends, nudge={"Sparse": 0.75, "Linear": 1.15, "Segment": 1.3, "Sqrt": 1.1})
    ax.set_title("Độ dài đoạn quyết định lựa chọn (median, dải = IQR)", loc="left")
    fig.subplots_adjust(right=0.78)
    finalize_figure(fig, "bench_query_length")


def crossover(sa: pd.Series, sb: pd.Series) -> float:
    """q* = (p_a - p_b) / (t_b - t_a) from build (ms) and ns/query medians."""
    return (sa.build - sb.build) * 1e6 / (sb.ns - sa.ns)


def fig_breakeven(s: pd.DataFrame) -> dict[str, float]:
    x = s[s.exp == "breakeven"]
    sc = s[(s.exp == "scale") & (s.n == 1 << 20)].set_index("algo")
    q_seg_lin = crossover(sc.loc["Linear"], sc.loc["Segment"])
    q_lin_sp = crossover(sc.loc["Sparse"], sc.loc["Linear"])
    fig, ax = plt.subplots(figsize=(14, 6.8))
    for algo in ORDER:
        r = x[x.algo == algo].sort_values("q")
        st = ALGO[algo]
        ax.plot(r.q, r.total, color=st["color"], marker=st["marker"], ms=10, lw=3, label=st["label"])
    ax.set_xscale("log")
    plain_log_y(ax)
    ax.set_xlim(0.6, 3e7)
    ax.set_ylim(0.04, 3000)
    ax.xaxis.set_major_locator(FixedLocator([1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7]))
    ax.xaxis.set_minor_locator(NullLocator())
    ax.xaxis.set_major_formatter(FuncFormatter(
        lambda v, _: "1" if v == 1 else f"$10^{{{int(round(np.log10(v)))}}}$"))
    for qv in (q_seg_lin, q_lin_sp):
        ax.axvline(qv, color=PALETTE["gray_dark"], ls="--", lw=1.8)
    ax.text(q_seg_lin * 0.85, 1500, f"q* ≈ {q_seg_lin / 1e3:.0f} nghìn", ha="right", fontsize=17,
            color=PALETTE["gray_dark"])
    ax.text(q_lin_sp * 1.15, 1500, f"q* ≈ {q_lin_sp / 1e6:.1f} triệu".replace(".", ","), ha="left",
            fontsize=17, color=PALETTE["gray_dark"])
    ax.set_xlabel("Số truy vấn q   (n = 2²⁰ ≈ 1 triệu, đoạn ngẫu nhiên)")
    ax.set_ylabel("Tổng thời gian build + q truy vấn (ms, log)")
    ax.legend(loc="upper left", ncol=2, bbox_to_anchor=(0.0, 0.97))
    ax.set_title("Điểm hòa vốn: không có cấu trúc thắng ở mọi q", loc="left")
    finalize_figure(fig, "bench_breakeven")
    return {"segment_linear": q_seg_lin, "linear_sparse": q_lin_sp}


def fig_mixed(s: pd.DataFrame) -> None:
    x = s[s.exp == "mixed"]
    fig, ax = plt.subplots(figsize=(14, 6.4))
    for algo in ["Scan", "Sqrt", "Segment"]:
        r = x[x.algo == algo].sort_values("update_pct")
        st = ALGO[algo]
        ax.plot(r.update_pct, r.ops, color=st["color"], marker=st["marker"], ms=10, lw=3, label=st["label"])
    plain_log_y(ax)
    ax.set_xlim(-3, 102)
    ax.set_ylim(0.35, 400)
    ax.xaxis.set_major_locator(FixedLocator([0, 10, 25, 50, 75, 90, 99]))
    ax.set_xlabel("Tỉ lệ cập nhật điểm trong 131 072 thao tác (%)   (n = 2¹⁷)")
    ax.set_ylabel("Thời gian toàn lô (ms, log)")
    ax.legend(loc="lower left")
    ax.set_title("Có cập nhật: Segment Tree vượt chia khối khi tỉ lệ cập nhật ≳ 67%", loc="left")
    finalize_figure(fig, "bench_mixed")


def fig_tradeoff() -> None:
    """Theoretical cost model at n = 10^6 (operations, constants dropped)."""
    n = 1e6
    lg = np.log2(n)
    pts = {
        "Duyệt trực tiếp": (1, n / 3, PALETTE["gray_mid"], "o"),
        "Bảng mọi đoạn": (n * n / 2, 1, PALETTE["red_2"], "X"),
        "Chia khối √n": (n, 2 * np.sqrt(n), PALETTE["teal"], "s"),
        "Segment Tree": (2 * n, 2 * lg, PALETTE["red_strong"], "^"),
        "Sparse Table": (n * lg, 2, PALETTE["blue_main"], "D"),
        "Fischer–Heun / tuyến tính": (n, 3, PALETTE["violet"], "P"),
    }
    fig, ax = plt.subplots(figsize=(13, 6.6))
    ax.set_xscale("log")
    ax.set_yscale("log")
    offs = {
        "Duyệt trực tiếp": (2.2, 1.0, "left"),
        "Bảng mọi đoạn": (1.0, 4.5, "center"),
        "Chia khối √n": (1.8, 1.0, "left"),
        "Segment Tree": (1.8, 1.0, "left"),
        "Sparse Table": (1.0, 4.5, "center"),
        "Fischer–Heun / tuyến tính": (0.55, 0.62, "right"),
    }
    for name, (px, qy, c, m) in pts.items():
        ax.scatter([px], [qy], s=420, color=c, marker=m, zorder=3, edgecolor="black", linewidth=1.5)
        fx, fy, ha = offs[name]
        ax.annotate(name, (px, qy), xytext=(px * fx, qy * fy), ha=ha, va="center", fontsize=19,
                    color=c if c != PALETTE["red_2"] else PALETTE["red_strong"], fontweight="semibold")
    ax.annotate("", xy=(n * 1.05, 3), xytext=(n * lg * 0.9, 2),
                arrowprops=dict(arrowstyle="->", lw=2.5, color=PALETTE["violet"]))
    ax.set_xlim(0.3, 3e13)
    ax.set_ylim(0.6, 2e6)
    ax.set_xlabel("Chi phí tiền xử lý (số phép toán, log)")
    ax.set_ylabel("Chi phí 1 truy vấn (log)")
    ax.set_title("Phổ đánh đổi ⟨tiền xử lý, truy vấn⟩ tại n = 10⁶ (mô hình, bỏ hằng số)", loc="left")
    plain_log_y(ax)
    ax.xaxis.set_major_formatter(FuncFormatter(
        lambda v, _: "1" if v == 1 else f"$10^{{{int(round(np.log10(v)))}}}$"))
    ax.yaxis.set_major_formatter(FuncFormatter(
        lambda v, _: "1" if v == 1 else f"$10^{{{int(round(np.log10(v)))}}}$"))
    ax.text(1.0, 1.0, "lý tưởng: góc dưới-trái", transform=ax.transAxes, ha="right", va="top",
            fontsize=16, color=PALETTE["gray_dark"])
    finalize_figure(fig, "theory_tradeoff")


def summary_table(s: pd.DataFrame, cross: dict[str, float]) -> None:
    sc = s[s.exp == "scale"]
    rows = []
    for n in (1 << 16, 1 << 20, 1 << 23):
        for algo in ORDER:
            r = sc[(sc.n == n) & (sc.algo == algo)].iloc[0]
            rows.append(dict(n=n, algo=algo, build_ms=round(r.build, 3), ns_per_query=round(r.ns, 1),
                             aux_bytes_per_elem=round(r.mem / n, 2)))
    t = pd.DataFrame(rows)
    t.to_csv(HERE.parent / "benchmark" / "results_summary_scale.csv", index=False)
    s.to_csv(HERE.parent / "benchmark" / "results_summary_all.csv", index=False)
    print(t.to_string(index=False))
    print({k: round(v) for k, v in cross.items()})


def main() -> None:
    apply_publication_style()
    s = load()
    fig_query_vs_n(s)
    fig_build_memory(s)
    fig_query_length(s)
    cross = fig_breakeven(s)
    fig_mixed(s)
    fig_tradeoff()
    summary_table(s, cross)


if __name__ == "__main__":
    main()
