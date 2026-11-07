"""ManimGL (3b1b/manim) scenes for the RMQ seminar.

Light theme matching the web slides. Render one scene:
    source env.sh && manimgl rmq_scenes.py S03_SparseQuery -w --hd
Render all:  ./render_all.sh
"""
from pathlib import Path

import manimlib.utils.tex_file_writing as _tex_writing
import manimpango
from manimlib import *

HERE = Path(__file__).resolve().parent
for _f in sorted((HERE / "fonts").glob("*.ttf")):
    manimpango.register_font(str(_f))

FONT = "Source Sans 3"
MONO = "Source Code Pro"

# XeLaTeX template: Vietnamese text in Source Sans 3, math in Computer Modern (like KaTeX on the slides).
_VI_TEMPLATE = {
    "compiler": "xelatex",
    "preamble": "\n".join([
        r"\usepackage{amsmath}",
        r"\usepackage{amssymb}",
        r"\usepackage{fontspec}",
        r"\setmainfont{SourceSans3}[Path=" + (HERE / "fonts").as_posix() + r"/, Extension=.ttf, "
        r"UprightFont=*-Regular, BoldFont=*-Bold]",
        r"\usepackage{xcolor}",
    ]),
}
_default_template_config = _tex_writing.get_tex_template_config


def _template_config(name):
    return _VI_TEMPLATE if name.replace(" ", "_").lower() == "rmqvi" else _default_template_config(name)


_tex_writing.get_tex_template_config = _template_config

BG = "#FFFFFF"
INK = "#1C2330"
MUTED = "#5B6473"
LINE_C = "#C3C9D2"
CELL_C = "#F3F5F8"
SPARSE = "#0F4D92"
LINEAR = "#9A4D8E"
SEG = "#B64342"
SQRT = "#42949E"
AMBER = "#D99A00"
AMBER_FILL = "#FFF1BF"
GREEN = "#2B8A3E"
GREEN_FILL = "#D3F9D8"
BLUE = "#2F6FD6"
BLUE_FILL = "#DCE8FB"
ORANGE = "#E8590C"
ORANGE_FILL = "#FFE3D3"
RED = "#C92A2A"
VIOLET_FILL = "#F1E3EF"
BAR_FILL = "#DDE3EA"
BAR_STROKE = "#8A94A6"


def T(s, size=36, color=INK, weight="NORMAL", font=FONT):
    t = Text(str(s), font=font, font_size=size, weight=weight)
    t.set_fill(color, 1)
    t.set_stroke(width=0)
    return t


def TT(tex, size=36, color=INK, weight="NORMAL"):
    """Vietnamese text with inline $math$, rendered by XeLaTeX."""
    if weight == "BOLD":
        tex = r"\textbf{" + tex + "}"
    tex = r"\mbox{" + tex + "}"  # keep one line; Base.say() scales it down if too wide
    t = TexText(tex, font_size=size * 1.12, template="rmqvi")  # TeX glyphs run smaller than Pango's
    t.set_fill(color, 1)
    t.set_stroke(width=0)
    return t


def L(s, size=36, color=INK, weight="NORMAL"):
    """Label: LaTeX when it contains $math$, otherwise Pango text."""
    return TT(s, size, color, weight) if "$" in str(s) else T(s, size, color, weight)


def M(tex, size=40, color=INK):
    m = Tex(tex, font_size=size)
    m.set_fill(color, 1)
    return m


def make_cell(val, size=0.9, fs=40, fill=CELL_C, stroke=LINE_C, color=INK, font=FONT):
    box = RoundedRectangle(width=size, height=size, corner_radius=0.08)
    box.set_fill(fill, 1).set_stroke(stroke, 2.5)
    lab = T(val, fs, color, font=font).move_to(box)
    return VGroup(box, lab)


def make_row(vals, size=0.9, gap=0.08, fs=40):
    return VGroup(*[make_cell(v, size, fs) for v in vals]).arrange(RIGHT, buff=gap)


def index_labels(row, start=1, fs=24, side=DOWN, buff=0.12):
    return VGroup(*[T(i + start, fs, MUTED).next_to(c, side, buff=buff) for i, c in enumerate(row)])


def paint(cell, fill, stroke=None, width=4):
    """Animation that recolors a cell's box."""
    return cell[0].animate.set_fill(fill, 1).set_stroke(stroke or LINE_C, width)


def span_bar(row, l, r, color, y, label=None, fs=30, label_side=UP):
    """Bracket-like bar over cells l..r (1-based) at height y."""
    x1 = row[l - 1].get_left()[0] + 0.04
    x2 = row[r - 1].get_right()[0] - 0.04
    bar = VGroup(
        Line([x1, y, 0], [x2, y, 0]).set_stroke(color, 9),
        Line([x1, y - 0.16, 0], [x1, y + 0.16, 0]).set_stroke(color, 6),
        Line([x2, y - 0.16, 0], [x2, y + 0.16, 0]).set_stroke(color, 6),
    )
    if label is not None:
        bar.add(L(label, fs, color, weight="BOLD").next_to(bar[0], label_side, buff=0.1))
    return bar


def range_box(cells, color, buff=0.08, width=5):
    return SurroundingRectangle(VGroup(*cells), buff=buff).set_stroke(color, width).set_fill(opacity=0)


class Base(Scene):
    default_camera_config = dict(background_color=BG)
    caption_y = -3.45

    def setup(self):
        super().setup()
        self.caption = None

    def say(self, text, fs=34, color=INK, run_time=0.6):
        new = L(text, fs, color).move_to([0, self.caption_y, 0])
        if new.get_width() > FRAME_WIDTH - 0.8:
            new.set_width(FRAME_WIDTH - 0.8)
        if self.caption is None:
            self.play(FadeIn(new, shift=0.15 * UP), run_time=run_time)
        else:
            self.play(FadeOut(self.caption, shift=0.2 * UP), run_time=run_time * 0.4)
            self.play(FadeIn(new, shift=0.2 * UP), run_time=run_time * 0.6)
        self.caption = new


A = [5, 2, 6, 3, 1, 7, 4, 8]


# --------------------------------------------------------------------- 1
class S01_ProblemScan(Base):
    def construct(self):
        unit, base_y, gap = 0.5, -2.35, 1.35
        x0 = -gap * 3.5 - 1.55
        header = T("A = [5, 2, 6, 3, 1, 7, 4, 8]", 44, font=MONO).to_edge(UP, buff=0.35)
        bars, vals, idxs = VGroup(), VGroup(), VGroup()
        for i, v in enumerate(A):
            x = x0 + i * gap
            b = Rectangle(width=0.95, height=v * unit)
            b.set_fill(BAR_FILL, 1).set_stroke(BAR_STROKE, 2)
            b.move_to([x, base_y + v * unit / 2, 0])
            bars.add(b)
            vals.add(T(v, 38).next_to(b, UP, buff=0.1))
            idxs.add(T(i + 1, 28, MUTED).move_to([x, base_y - 0.35, 0]))
        axis = Line([x0 - 0.8, base_y, 0], [x0 + 7 * gap + 0.8, base_y, 0]).set_stroke(LINE_C, 3)
        self.play(FadeIn(header, shift=0.2 * DOWN))
        self.play(ShowCreation(axis), LaggedStart(*[GrowFromEdge(b, DOWN) for b in bars], lag_ratio=0.1),
                  run_time=1.4)
        self.play(LaggedStart(*[FadeIn(v) for v in vals], lag_ratio=0.08), FadeIn(idxs), run_time=0.8)

        self.say(r"Truy vấn $\mathrm{RMQ}(2,7)$: phần tử nhỏ nhất trong $A[2..7]$ là bao nhiêu?")
        l, r = 2, 7
        left = bars[l - 1].get_left()[0] - 0.18
        right = bars[r - 1].get_right()[0] + 0.18
        hl = Rectangle(width=right - left, height=4.7)
        hl.set_fill(AMBER_FILL, 0.75).set_stroke(AMBER, 3)
        hl.move_to([(left + right) / 2, base_y + 2.35, 0])
        hl_label = T("đoạn [2, 7]", 30, AMBER, weight="BOLD").next_to(hl, UP, buff=0.08)
        hl.set_fill(opacity=0).set_stroke(opacity=0)
        self.add(hl)
        self.bring_to_back(hl)
        self.play(hl.animate.set_fill(AMBER_FILL, 0.75).set_stroke(AMBER, 3, opacity=1), FadeIn(hl_label))

        panel_x = 5.35
        cur_title = T("min hiện tại", 30, MUTED).move_to([panel_x, 1.5, 0])
        pointer = Triangle(start_angle=PI / 2).set_fill(ORANGE, 1).set_stroke(width=0).scale(0.16)
        pointer.move_to([bars[l - 1].get_x(), base_y - 0.8, 0])
        best = l - 1
        cur_val = T(A[best], 64, ORANGE, weight="BOLD").move_to([panel_x, 0.6, 0])
        counter = T("đã đọc: 1", 28, MUTED).move_to([panel_x, -0.4, 0])
        self.play(FadeIn(pointer), FadeIn(cur_title), FadeIn(cur_val), FadeIn(counter),
                  bars[best].animate.set_fill(ORANGE_FILL, 1).set_stroke(ORANGE, 4))
        for i in range(l, r):
            new_counter = T(f"đã đọc: {i - l + 2}", 28, MUTED).move_to(counter)
            anims = [pointer.animate.move_to([bars[i].get_x(), base_y - 0.8, 0]),
                     Transform(counter, new_counter)]
            self.play(*anims, run_time=0.45)
            if A[i] < A[best]:
                new_val = T(A[i], 64, ORANGE, weight="BOLD").move_to(cur_val)
                self.play(bars[best].animate.set_fill(BAR_FILL, 1).set_stroke(BAR_STROKE, 2),
                          bars[i].animate.set_fill(ORANGE_FILL, 1).set_stroke(ORANGE, 4),
                          Transform(cur_val, new_val), run_time=0.45)
                best = i
            else:
                self.play(Indicate(bars[i], color=MUTED, scale_factor=1.04), run_time=0.35)
        self.play(bars[best].animate.set_fill(GREEN_FILL, 1).set_stroke(GREEN, 5),
                  cur_val.animate.set_fill(GREEN), FadeOut(pointer))
        self.say(r"Đáp án: $\min = 1$ tại vị trí 5 — phải đọc cả 6 phần tử", color=GREEN)
        self.wait(0.6)
        self.say(r"Một truy vấn: $O(r-l+1)\le O(n)$ \quad$\Rightarrow$\quad $q$ truy vấn: $O(n\cdot q)$")
        self.wait(0.6)
        cost = VGroup(
            TT(r"$n=10^6,\ q=10^6$", 34),
            TT(r"$\approx 10^{12}$ phép so sánh", 34, RED, weight="BOLD"),
        ).arrange(DOWN, buff=0.25).move_to([panel_x, -1.6, 0])
        self.play(FadeIn(cost, shift=0.2 * UP))
        self.say("Ý tưởng: tiền xử lý một lần để mỗi truy vấn trả lời nhanh", color=SPARSE)
        self.wait(1.5)


# --------------------------------------------------------------------- 2
class S02_SparseBuild(Base):
    def construct(self):
        n = len(A)
        levels = [A]
        for k in range(1, 4):
            prev = levels[-1]
            levels.append([min(prev[i], prev[i + 2 ** (k - 1)]) for i in range(n - 2 ** k + 1)])
        size, step, x0 = 0.84, 1.02, -2.6
        ys = [1.75, 0.45, -0.85, -2.15]

        formula = M(r"st[k][i]=\min\big(st[k-1][i],\ st[k-1][i+2^{k-1}]\big)", 44)
        formula.to_edge(UP, buff=0.3)
        self.play(Write(formula), run_time=1.2)

        def pos(k, i):  # i is 1-based column
            return np.array([x0 + (i - 1) * step, ys[k], 0])

        cols = VGroup(*[T(f"i={i}", 22, MUTED).move_to(pos(0, i) + 0.68 * UP) for i in range(1, n + 1)])
        labels = VGroup()
        for k in range(4):
            lab = VGroup(TT(f"$k={k}$", 34, SPARSE),
                         T(f"độ dài {2 ** k}", 24, MUTED)).arrange(DOWN, buff=0.06)
            lab.move_to(pos(k, 1) + 2.0 * LEFT)
            labels.add(lab)
        cells = {}
        row0 = VGroup()
        for i in range(1, n + 1):
            c = make_cell(A[i - 1], size, 38).move_to(pos(0, i))
            cells[(0, i)] = c
            row0.add(c)
        self.play(FadeIn(labels[0]), FadeIn(cols),
                  LaggedStart(*[FadeIn(c, shift=0.2 * DOWN) for c in row0], lag_ratio=0.08))
        self.say(r"Hàng $k=0$ chính là mảng $A$: đoạn độ dài 1")

        for k in range(1, 4):
            half = 2 ** (k - 1)
            self.play(FadeIn(labels[k]), run_time=0.4)
            count = n - 2 ** k + 1
            for i in range(1, count + 1):
                a, b = cells[(k - 1, i)], cells[(k - 1, i + half)]
                v = levels[k][i - 1]
                c = make_cell(v, size, 38).set_fill(opacity=1).move_to(pos(k, i))
                c[0].set_fill(BLUE_FILL if k % 2 else VIOLET_FILL, 1)
                cells[(k, i)] = c
                slow = i == 1 and k <= 2
                if slow:
                    arr1 = Arrow(a.get_bottom(), c.get_top(), buff=0.05, thickness=3).set_color(BLUE)
                    arr2 = Arrow(b.get_bottom(), c.get_top(), buff=0.05, thickness=3).set_color(ORANGE)
                    src = a if a[1].text == str(v) or v == levels[k - 1][i - 1] else b
                    self.play(a[0].animate.set_stroke(BLUE, 6), b[0].animate.set_stroke(ORANGE, 6),
                              GrowArrow(arr1), GrowArrow(arr2), run_time=0.6)
                    self.play(TransformFromCopy(src[1], c[1]), FadeIn(c[0]), run_time=0.7)
                    if k == 1:
                        self.say(r"$st[1][1]=\min(st[0][1],\,st[0][2])=\min(5,2)=2$")
                    else:
                        self.say(r"$st[2][1]=\min(st[1][1],\,st[1][3])=\min(2,3)=2$ — ghép hai nửa dài 2")
                    self.wait(0.5)
                    self.play(FadeOut(arr1), FadeOut(arr2), a[0].animate.set_stroke(LINE_C, 2.5),
                              b[0].animate.set_stroke(LINE_C, 2.5), run_time=0.4)
                else:
                    self.play(FadeIn(c, shift=0.15 * DOWN), run_time=0.22)
        self.wait(0.3)

        # Interpret one cell as a range of A
        target = cells[(2, 2)]
        cover = range_box([cells[(0, i)] for i in range(2, 6)], AMBER, width=6)
        self.play(target[0].animate.set_stroke(AMBER, 7), ShowCreation(cover))
        self.say(r"$st[2][2]=\min A[2..5]=\min(2,6,3,1)=1$", color=AMBER)
        self.wait(1.0)
        self.play(FadeOut(cover), target[0].animate.set_stroke(LINE_C, 2.5))
        self.say(r"Mỗi ô $O(1)$, có $\approx n\log_2 n$ ô \quad$\Rightarrow$\quad xây $O(n\log n)$, bộ nhớ $O(n\log n)$", color=SPARSE)
        self.wait(2.0)


# --------------------------------------------------------------------- 3
class S03_SparseQuery(Base):
    def construct(self):
        row = make_row(A, 1.0, 0.1, 42).move_to([0, -0.1, 0])
        idx = index_labels(row, fs=26)
        title = TT(r"Truy vấn $(l,r)=(2,7)$", 44, weight="BOLD").to_edge(UP, buff=0.3)
        self.play(FadeIn(title), LaggedStart(*[FadeIn(c) for c in row], lag_ratio=0.05), FadeIn(idx))
        calc = M(r"L=r-l+1=6,\qquad k=\lfloor\log_2 6\rfloor=2,\qquad 2^k=4", 40).next_to(title, DOWN, buff=0.3)
        self.play(Write(calc), run_time=1.2)
        self.say(r"Lấy hai đoạn dài $2^k$: một đoạn bắt đầu tại $l$, một đoạn kết thúc tại $r$")

        top = span_bar(row, 4, 7, ORANGE, row.get_top()[1] + 0.45, r"$st[2][4]=1$ \ (đoạn $[4,7]$)", 30)
        bottom = span_bar(row, 2, 5, BLUE, idx.get_bottom()[1] - 0.35, r"$st[2][2]=1$ \ (đoạn $[2,5]$)", 30,
                          label_side=DOWN)
        self.play(ShowCreation(bottom[:3]), FadeIn(bottom[3]),
                  *[paint(row[i - 1], BLUE_FILL, BLUE, 3) for i in (2, 3)], run_time=0.9)
        self.play(ShowCreation(top[:3]), FadeIn(top[3]),
                  *[paint(row[i - 1], ORANGE_FILL, ORANGE, 3) for i in (6, 7)], run_time=0.9)
        self.play(*[paint(row[i - 1], VIOLET_FILL, LINEAR, 5) for i in (4, 5)], run_time=0.6)
        self.say(r"Hai đoạn phủ kín $[2,7]$ vì $2^k\le L<2^{k+1}$; phần giao $[4,5]$ bị xét hai lần")
        self.wait(0.8)
        ans = VGroup(M(r"\min(1,\,1)=1", 52, GREEN), T("✓", 52, GREEN)).arrange(RIGHT, buff=0.3)
        ans.move_to([4.6, -2.25, 0])
        self.play(Write(ans))
        self.say(r"$\min(x,x)=x$ (lũy đẳng) $\Rightarrow$ chồng lấn vô hại $\Rightarrow$ truy vấn $O(1)$", color=GREEN)
        self.wait(1.5)

        # Contrast with sum
        self.play(*[FadeOut(m) for m in (row, idx, top, bottom, ans, calc)], run_time=0.6)
        B = [1, 2, 3, 4, 5, 6]
        row2 = make_row(B, 1.0, 0.1, 42).move_to([0, -0.1, 0])
        idx2 = index_labels(row2, fs=26)
        title2 = TT(r"Nếu thay min bằng TỔNG: $B=[1,2,3,4,5,6]$, đoạn $[1,6]$", 40, weight="BOLD")
        title2.to_edge(UP, buff=0.3)
        self.play(ReplacementTransform(title, title2), FadeIn(row2), FadeIn(idx2))
        top2 = span_bar(row2, 3, 6, ORANGE, row2.get_top()[1] + 0.45, r"$3+4+5+6=18$", 30)
        bot2 = span_bar(row2, 1, 4, BLUE, idx2.get_bottom()[1] - 0.35, r"$1+2+3+4=10$", 30, label_side=DOWN)
        self.play(ShowCreation(bot2[:3]), FadeIn(bot2[3]), ShowCreation(top2[:3]), FadeIn(top2[3]),
                  *[paint(row2[i - 1], VIOLET_FILL, LINEAR, 5) for i in (3, 4)])
        wrong = VGroup(M(r"10+18=28\neq 21", 52, RED), T("✗", 52, RED)).arrange(RIGHT, buff=0.3)
        wrong.move_to([4.4, -2.25, 0])
        self.play(Write(wrong))
        self.say(r"Tổng: phần giao $3+4$ bị cộng hai lần $\Rightarrow$ SAI. Dùng được: min, max, gcd, AND, OR", color=RED)
        self.wait(2.2)


# --------------------------------------------------------------------- 4
class S04_SegmentTree(Base):
    def construct(self):
        y = {0: -1.85, 1: -0.45, 2: 0.95, 3: 2.35}
        xs0 = [-5.25 + j * 1.5 for j in range(8)]
        ranges = {0: [(i, i) for i in range(1, 9)], 1: [(1, 2), (3, 4), (5, 6), (7, 8)],
                  2: [(1, 4), (5, 8)], 3: [(1, 8)]}
        vals = {0: A[:]}
        for lv in (1, 2, 3):
            vals[lv] = [min(vals[lv - 1][2 * j], vals[lv - 1][2 * j + 1]) for j in range(len(ranges[lv]))]
        xs = {0: xs0}
        for lv in (1, 2, 3):
            xs[lv] = [(xs[lv - 1][2 * j] + xs[lv - 1][2 * j + 1]) / 2 for j in range(len(ranges[lv]))]

        def make_node(lv, j):
            box = RoundedRectangle(width=1.18, height=0.98, corner_radius=0.14)
            box.set_fill(BG, 1).set_stroke(SEG, 3)
            v = T(vals[lv][j], 36, weight="BOLD").move_to(box.get_center() + 0.14 * UP)
            l, r = ranges[lv][j]
            rg = T(f"[{l},{r}]" if l != r else f"[{l}]", 20, MUTED).move_to(box.get_center() + 0.26 * DOWN)
            return VGroup(box, v, rg).move_to([xs[lv][j], y[lv], 0])

        nodes = {lv: VGroup(*[make_node(lv, j) for j in range(len(ranges[lv]))]) for lv in range(4)}
        edges = VGroup()
        edge_of = {}
        for lv in (1, 2, 3):
            for j in range(len(ranges[lv])):
                for c in (2 * j, 2 * j + 1):
                    e = Line(nodes[lv - 1][c].get_top(), nodes[lv][j].get_bottom()).set_stroke(LINE_C, 3)
                    edges.add(e)
                    edge_of[(lv - 1, c)] = e
        self.play(LaggedStart(*[FadeIn(nd, shift=0.2 * UP) for nd in nodes[0]], lag_ratio=0.08))
        self.say("Lá = phần tử của mảng; mỗi nút trong lưu min của hai con")
        for lv in (1, 2, 3):
            lv_edges = [edge_of[(lv - 1, c)] for c in range(len(nodes[lv - 1]))]
            self.play(*[ShowCreation(e) for e in lv_edges], run_time=0.5)
            self.play(LaggedStart(*[FadeIn(nd, shift=0.15 * UP) for nd in nodes[lv]], lag_ratio=0.15),
                      run_time=0.7)
        self.say(r"Xây từ dưới lên: $n-1$ nút trong $\Rightarrow O(n)$")
        self.wait(0.5)

        # Query [2, 7]
        self.say(r"Truy vấn $[2,7]$: tách thành các nút phủ đúng đoạn")
        x1 = nodes[0][1].get_left()[0]
        x2 = nodes[0][6].get_right()[0]
        yb = nodes[0].get_bottom()[1] - 0.25
        qbar = VGroup(Line([x1, yb, 0], [x2, yb, 0]).set_stroke(AMBER, 9),
                      T("đoạn [2, 7]", 28, AMBER, weight="BOLD").move_to([x2 + 1.05, yb, 0]))
        self.play(ShowCreation(qbar[0]), FadeIn(qbar[1]))
        canon = [(0, 1), (1, 1), (1, 2), (0, 6)]
        for lv, j in canon:
            self.play(nodes[lv][j][0].animate.set_fill(AMBER_FILL, 1).set_stroke(AMBER, 6), run_time=0.45)
        res = M(r"\min(2,\,3,\,1,\,4)=1", 46, GREEN).move_to([4.3, 3.35, 0])
        self.play(Write(res))
        self.say(r"Mỗi tầng chọn $\le 2$ nút $\Rightarrow \le 2\log_2 n$ nút $\Rightarrow$ truy vấn $O(\log n)$", color=GREEN)
        self.wait(1.0)
        self.play(*[nodes[lv][j][0].animate.set_fill(BG, 1).set_stroke(SEG, 3) for lv, j in canon],
                  FadeOut(qbar), FadeOut(res))

        # Point update A[5] := 9
        self.say(r"Cập nhật $A[5]:=9$ — chỉ sửa các nút trên đường lên gốc", color=SEG)
        path = [(0, 4, 9), (1, 2, 7), (2, 1, 4), (3, 0, 2)]
        for step, (lv, j, nv) in enumerate(path):
            nd = nodes[lv][j]
            new_v = T(nv, 36, SEG, weight="BOLD").move_to(nd[1])
            anims = [nd[0].animate.set_fill(ORANGE_FILL, 1).set_stroke(SEG, 6), Transform(nd[1], new_v)]
            if lv > 0:
                anims.append(edge_of[path[step - 1][0], path[step - 1][1]].animate.set_stroke(SEG, 7))
            self.play(*anims, run_time=0.7)
        self.say(r"$\log_2 n+1$ nút $\Rightarrow$ cập nhật $O(\log n)$. Sparse Table phải xây lại $O(n\log n)$", color=SEG)
        self.wait(2.0)


# --------------------------------------------------------------------- 5
class S05_BlockDecomposition(Base):
    def construct(self):
        A16 = [7, 4, 9, 6, 3, 8, 5, 10, 2, 11, 6, 9, 5, 1, 8, 12]
        b = 4
        blocks = VGroup()
        for k in range(4):
            blocks.add(make_row(A16[k * b:(k + 1) * b], 0.68, 0.05, 30))
        blocks.arrange(RIGHT, buff=0.42).move_to([0, 1.3, 0])
        cells = [c for blk in blocks for c in blk]
        idx = VGroup(*[T(i + 1, 22, MUTED).next_to(c, DOWN, buff=0.2) for i, c in enumerate(cells)])
        frames = VGroup(*[SurroundingRectangle(blk, buff=0.1).set_stroke(LINEAR, 3) for blk in blocks])
        names = VGroup(*[T(f"khối {k + 1}", 26, LINEAR, weight="BOLD").next_to(frames[k], UP, buff=0.3)
                         for k in range(4)])
        self.play(LaggedStart(*[FadeIn(c) for c in cells], lag_ratio=0.03), FadeIn(idx))
        self.say(r"Chia mảng thành các khối kích thước $b$ (ở đây $b=4$)")
        self.play(ShowCreation(frames), FadeIn(names))

        mins = [min(A16[k * b:(k + 1) * b]) for k in range(4)]
        mrow = VGroup(*[make_cell(m, 0.8, 34, fill=VIOLET_FILL, stroke=LINEAR).move_to(
            [frames[k].get_x(), -0.9, 0]) for k, m in enumerate(mins)])
        arrows = VGroup(*[Arrow(idx[k * b + 1].get_bottom() + 0.38 * RIGHT, mrow[k].get_top(), buff=0.08, thickness=3)
                         .set_color(LINEAR) for k in range(4)])
        mlabel = T("M", 40, LINEAR, weight="BOLD").next_to(mrow, LEFT, buff=0.5)
        self.play(LaggedStart(*[GrowArrow(a) for a in arrows], lag_ratio=0.1),
                  LaggedStart(*[FadeIn(c) for c in mrow], lag_ratio=0.1), FadeIn(mlabel))
        st_note = TT(r"Sparse Table trên $M$: $\frac{n}{b}\log\frac{n}{b}$ ô", 32, SPARSE).next_to(mrow, DOWN, buff=0.35)
        self.say(r"Tầng trên: $M$ = min từng khối ($n/b$ phần tử) + Sparse Table trên $M$")
        self.play(FadeIn(st_note))
        self.wait(0.5)

        # Query [3, 14]
        self.say(r"Truy vấn $[3,14]$ = hậu tố khối 1 + các khối giữa + tiền tố khối 4")
        q = range_box(cells[2:14], AMBER, buff=0.16, width=6)
        self.play(ShowCreation(q))
        suf = range_box(cells[2:4], BLUE, width=6)
        mid = range_box(list(mrow[1:3]), LINEAR, width=7)
        pre = range_box(cells[12:14], ORANGE, width=6)
        lab_s = TT(r"$\min = 6$", 32, BLUE).next_to(suf, UP, buff=0.85)
        lab_m = TT(r"Sparse Table: $\min(3,2)=2$", 32, LINEAR, weight="BOLD").next_to(mid, RIGHT, buff=0.3)
        lab_m.shift(0.6 * DOWN)
        lab_p = TT(r"$\min = 1$", 32, ORANGE).next_to(pre, UP, buff=0.85)
        self.play(FadeOut(st_note), ShowCreation(suf), FadeIn(lab_s))
        self.play(ShowCreation(mid), FadeIn(lab_m))
        self.play(ShowCreation(pre), FadeIn(lab_p))
        ans = M(r"\min(6,\,2,\,1)=1", 48, GREEN).move_to([-4.2, -2.35, 0])
        self.play(Write(ans), paint(cells[13], GREEN_FILL, GREEN, 6))
        self.say(r"Chọn $b=\Theta(\log n)$: tầng trên $O(n)$. Còn lại: truy vấn TRONG một khối, làm sao $O(1)$?",
                 color=LINEAR)
        self.wait(2.2)


# --------------------------------------------------------------------- 6
def cartesian(vals):
    """Return parent list and final stack (right spine) of the Cartesian tree (min, leftmost ties)."""
    n = len(vals)
    parent = [-1] * n
    stack = []
    for i, v in enumerate(vals):
        last = -1
        while stack and vals[stack[-1]] > v:
            last = stack.pop()
        if last != -1:
            parent[last] = i
        if stack:
            parent[i] = stack[-1]
        stack.append(i)
    return parent, stack


def depths(parent):
    d = []
    for i in range(len(parent)):
        k, p = 0, parent[i]
        while p != -1:
            k, p = k + 1, parent[p]
        d.append(k)
    return d


class S06_CartesianTree(Base):
    def construct(self):
        n = len(A)
        col = lambda i: -5.6 + i * 1.3  # noqa: E731  (0-based)
        top, dy, rad = 2.75, 0.95, 0.36

        def pos(i, d):
            return np.array([col(i), top - d * dy, 0])

        arr = VGroup(*[make_cell(v, 0.8, 34).move_to([col(i), -2.25, 0]) for i, v in enumerate(A)])
        arr_idx = VGroup(*[T(i + 1, 22, MUTED).next_to(c, DOWN, buff=0.08) for i, c in enumerate(arr)])
        self.play(FadeIn(arr), FadeIn(arr_idx))
        self.say("Cây Cartesian: gốc = phần tử nhỏ nhất, cây con trái/phải dựng đệ quy hai bên")

        panel = VGroup(T("ngăn xếp", 28, MUTED), T("= nhánh phải", 24, MUTED)).arrange(DOWN, buff=0.05)
        panel.move_to([5.55, 2.7, 0])
        self.play(FadeIn(panel))
        stack_box = VGroup()

        nodes, edges = {}, VGroup()
        for i in range(n):
            parent, stack = cartesian(A[:i + 1])
            d = depths(parent)
            new = VGroup(Circle(radius=rad).set_fill(BG, 1).set_stroke(INK, 3),
                         T(A[i], 32, weight="BOLD")).move_to(pos(i, d[i]))
            new_edges = VGroup(*[
                Line(pos(parent[j], d[parent[j]]), pos(j, d[j]), buff=rad).set_stroke(LINE_C, 4)
                for j in range(i + 1) if parent[j] != -1])
            popped = [A[j] for j in cartesian(A[:i])[1] if j not in stack] if i else []
            new_stack = VGroup(*[make_cell(A[j], 0.62, 28, fill=ORANGE_FILL, stroke=ORANGE)
                                 for j in stack]).arrange(UP, buff=0.06)
            new_stack.move_to([5.55, 0.2, 0]).align_to(np.array([0, -0.9, 0]), DOWN)
            anims = [nd.animate.move_to(pos(j, d[j])) for j, nd in nodes.items()]
            anims += [FadeIn(new, scale=0.6), FadeOut(edges), FadeIn(new_edges),
                      ReplacementTransform(stack_box, new_stack) if len(stack_box) else FadeIn(new_stack),
                      paint(arr[i], AMBER_FILL, AMBER, 5)]
            if i:
                anims.append(paint(arr[i - 1], CELL_C, LINE_C, 2.5))
            msg = f"$i={i + 1}$, $A[i]={A[i]}$" + (f": pop {', '.join(map(str, popped))} (lớn hơn {A[i]})" if popped
                                                    else ": không pop") + " rồi push"
            self.play(*anims, run_time=0.9)
            self.say(msg, fs=32, run_time=0.4)
            nodes[i] = new
            edges = new_edges
            stack_box = new_stack
            for j, nd in nodes.items():
                nd[0].set_stroke(ORANGE if j in stack else INK, 5 if j in stack else 3)
            self.bring_to_back(edges)
            self.wait(0.35)
        self.play(paint(arr[n - 1], CELL_C, LINE_C, 2.5), FadeOut(stack_box), FadeOut(panel))
        for nd in nodes.values():
            nd[0].set_stroke(INK, 3)
        guides = VGroup(*[DashedLine(nodes[i].get_bottom(), arr[i].get_top()).set_stroke(LINE_C, 2)
                          for i in range(n)])
        self.play(ShowCreation(guides))
        self.say("Duyệt giữa (in-order) = thứ tự chỉ số; cha luôn nhỏ hơn con (min-heap)")
        self.wait(1.0)
        self.play(FadeOut(guides))

        parent, _ = cartesian(A)

        def path_up(i):
            p = [i]
            while parent[p[-1]] != -1:
                p.append(parent[p[-1]])
            return p

        def show_query(l, r, color_note):
            pl, pr = path_up(l - 1), path_up(r - 1)
            lca = next(x for x in pl if x in pr)
            seg = range_box(list(arr[l - 1:r]), AMBER, width=5)
            self.play(ShowCreation(seg), nodes[l - 1][0].animate.set_fill(AMBER_FILL, 1),
                      nodes[r - 1][0].animate.set_fill(AMBER_FILL, 1))
            hl = VGroup()
            for path in (pl, pr):
                for a, b in zip(path, path[1:]):
                    if a == lca:
                        break
                    hl.add(Line(nodes[b].get_center(), nodes[a].get_center(), buff=rad)
                           .set_stroke(AMBER, 9))
            self.play(ShowCreation(hl), run_time=0.8)
            self.play(nodes[lca][0].animate.set_fill(GREEN_FILL, 1).set_stroke(GREEN, 7),
                      paint(arr[lca], GREEN_FILL, GREEN, 6))
            self.say(r"$\mathrm{RMQ}(%d,%d)=\mathrm{LCA}(%d,%d)$ = vị trí %d $\Rightarrow \min = %d$"
                     % (l, r, l, r, lca + 1, A[lca]),
                     color=GREEN)
            self.wait(1.2)
            self.play(FadeOut(seg), FadeOut(hl), nodes[l - 1][0].animate.set_fill(BG, 1),
                      nodes[r - 1][0].animate.set_fill(BG, 1),
                      nodes[lca][0].animate.set_fill(BG, 1).set_stroke(INK, 3),
                      paint(arr[lca], CELL_C, LINE_C, 2.5))

        show_query(3, 7, AMBER)
        show_query(1, 4, AMBER)
        self.say(r"Xây bằng ngăn xếp: mỗi phần tử push/pop $\le 1$ lần $\Rightarrow O(n)$. \quad RMQ $\equiv$ LCA", color=SPARSE)
        self.wait(2.0)


# --------------------------------------------------------------------- 7
class S07_SameShapeBlocks(Base):
    def construct(self):
        B1, B2 = [5, 2, 6, 3], [9, 1, 7, 4]
        centers = [np.array([-3.6, 0, 0]), np.array([3.6, 0, 0])]
        rows, trees, tables = VGroup(), [], []
        for blk, cx in zip((B1, B2), centers):
            row = make_row(blk, 0.78, 0.06, 34).move_to(cx + 2.95 * UP)
            rows.add(row)
        self.play(FadeIn(rows))
        self.say(r"Hai khối có giá trị khác nhau: $[5,2,6,3]$ và $[9,1,7,4]$")

        for blk, cx, row in zip((B1, B2), centers, rows):
            parent, _ = cartesian(blk)
            d = depths(parent)
            pos = [np.array([row[i].get_x(), 1.85 - d[i] * 0.72, 0]) for i in range(4)]
            nodes = VGroup(*[VGroup(Circle(radius=0.28).set_fill(BG, 1).set_stroke(LINEAR, 4),
                                    T(blk[i], 26, weight="BOLD")).move_to(pos[i]) for i in range(4)])
            ed = VGroup(*[Line(pos[parent[i]], pos[i], buff=0.28).set_stroke(LINEAR, 4)
                          for i in range(4) if parent[i] != -1])
            trees.append(VGroup(ed, nodes))
        self.play(*[FadeIn(t, shift=0.2 * DOWN) for t in trees])
        ghost = trees[0][0].copy().set_stroke(AMBER, 8, opacity=0.8)
        self.say("Cây Cartesian của hai khối có CÙNG HÌNH DẠNG", color=LINEAR)
        self.play(ghost.animate.move_to(trees[1][0]), run_time=1.2)
        self.play(FadeOut(ghost))

        def table(blk, cx):
            g = VGroup()
            cs = 0.5
            for l in range(4):
                for r in range(4):
                    p = cx + np.array([(r - 1.5) * cs, -0.75 - l * cs, 0])
                    if r >= l:
                        seg = blk[l:r + 1]
                        am = l + seg.index(min(seg)) + 1
                        c = make_cell(am, cs - 0.04, 24, fill=GREEN_FILL, stroke=GREEN).move_to(p)
                    else:
                        c = Square(side_length=cs - 0.04).set_fill(CELL_C, 1).set_stroke(width=0).move_to(p)
                    g.add(c)
            hdr_r = VGroup(*[T(f"r={r + 1}", 18, MUTED).move_to(cx + np.array([(r - 1.5) * cs, -0.38, 0]))
                             for r in range(4)])
            hdr_l = VGroup(*[T(f"l={l + 1}", 18, MUTED).move_to(cx + np.array([-1.5 * cs - 0.55, -0.75 - l * cs, 0]))
                             for l in range(4)])
            return VGroup(g, hdr_r, hdr_l)

        tabs = [table(B1, centers[0]), table(B2, centers[1])]
        self.say(r"Bảng vị trí min cho mọi $(l,r)$ trong khối: GIỐNG HỆT nhau")
        self.play(*[FadeIn(t) for t in tabs], run_time=1.0)
        eq = T("=", 64, GREEN, weight="BOLD").move_to([0, -1.5, 0])
        self.play(FadeIn(eq, scale=1.5))
        self.say(r"$\Rightarrow$ Các khối cùng hình dạng cây DÙNG CHUNG một bảng tra (Fischer \& Heun, 2006)",
                 color=GREEN)
        self.wait(1.6)

        self.play(*[FadeOut(m) for m in (rows, *trees, *tabs, eq)], run_time=0.6)
        bs = list(range(1, 9))
        cat = [1, 2, 5, 14, 42, 132, 429, 1430]
        fac = [1, 2, 6, 24, 120, 720, 5040, 40320]
        head = VGroup(TT(r"$b$", 34), TT(r"Catalan $C_b$", 32, LINEAR, weight="BOLD"),
                      TT(r"hoán vị $b!$", 32, RED, weight="BOLD"))
        grid = VGroup()
        for r_i, vals_ in enumerate((bs, cat, fac)):
            row = VGroup(*[T(v, 32, [INK, LINEAR, RED][r_i]) for v in vals_]).arrange(RIGHT, buff=0)
            for k, t in enumerate(row):
                t.move_to([-2.2 + k * 1.15, 2.75 - r_i * 0.75, 0])
            grid.add(row)
        for r_i, h in enumerate(head):
            h.move_to([-3.0, 2.75 - r_i * 0.75, 0]).align_to(np.array([-3.0, 0, 0]), RIGHT)
        head[0].shift(0 * LEFT)
        self.play(FadeIn(head), LaggedStart(*[FadeIn(r) for r in grid], lag_ratio=0.3))
        self.say(r"Số loại khối = số Catalan $C_b<4^b$, nhỏ hơn rất nhiều so với $b!$")
        formula = VGroup(
            VGroup(M(r"b=\tfrac14\log_2 n\ \Rightarrow\ 4^b=\sqrt n", 44, INK),
                   T("loại khối", 38, INK)).arrange(RIGHT, buff=0.25),
            VGroup(T("bảng tra:", 38, LINEAR), M(r"O(\sqrt n\cdot b^2)=o(n)", 44, LINEAR)).arrange(RIGHT, buff=0.25),
            M(r"\Rightarrow\ \langle O(n),\,O(1)\rangle", 52, GREEN),
        ).arrange(DOWN, buff=0.35).move_to([0, -1.05, 0])
        for f in formula:
            self.play(Write(f), run_time=1.0)
        self.say(r"Tiền xử lý $O(n)$, truy vấn $O(1)$: tối ưu tiệm cận cho RMQ tĩnh", color=GREEN)
        self.wait(2.0)


# --------------------------------------------------------------------- 8
class S08_BitmaskRMQ(Base):
    def construct(self):
        n = len(A)
        colx = lambda i: -3.0 + i * 1.0  # noqa: E731  (0-based)
        blk = VGroup(*[make_cell(v, 0.84, 36).move_to([colx(i), 2.7, 0]) for i, v in enumerate(A)])
        bidx = VGroup(*[T(i + 1, 22, MUTED).next_to(c, DOWN, buff=0.06) for i, c in enumerate(blk)])
        title = T("một khối 8 phần tử (thực tế: w = 64 bit)", 26, MUTED).next_to(blk, UP, buff=0.12)
        self.play(FadeIn(blk), FadeIn(bidx), FadeIn(title))
        self.say("Quét khối từ trái sang, giữ ngăn xếp đơn điệu tăng (pop phần tử lớn hơn)")

        rows_y = [1.45 - i * 0.5 for i in range(n)]
        row_labels = VGroup(*[T(f"mask[{i + 1}]", 22, MUTED, font=MONO).move_to([colx(0) - 1.35, rows_y[i], 0])
                              for i in range(n)])
        stack_title = T("ngăn xếp", 26, MUTED).move_to([5.55, 0.3, 0])
        self.play(FadeIn(stack_title))
        stack, sboxes, mask_rows = [], [], []
        for i, v in enumerate(A):
            popped = []
            while stack and A[stack[-1]] > v:
                popped.append(stack.pop())
            stack.append(i)
            anims = [paint(blk[i], AMBER_FILL, AMBER, 5)]
            if i:
                anims.append(paint(blk[i - 1], CELL_C, LINE_C, 2.5))
            gone = sboxes[len(stack) - 1:]
            sboxes = sboxes[:len(stack) - 1]
            anims += [FadeOut(b, shift=0.4 * RIGHT) for b in gone]
            nb = make_cell(v, 0.6, 26, fill=VIOLET_FILL, stroke=LINEAR).move_to(
                [5.55, -1.9 + (len(stack) - 1) * 0.66, 0])
            sboxes.append(nb)
            anims.append(FadeIn(nb, shift=0.3 * DOWN))
            bits = VGroup()
            for j in range(n):
                on = j in stack
                if j <= i:
                    c = make_cell(1 if on else 0, 0.42, 22,
                                  fill=LINEAR if on else CELL_C, stroke=LINEAR if on else LINE_C,
                                  color=BG if on else MUTED, font=MONO)
                else:
                    c = make_cell("·", 0.42, 22, fill=BG, stroke=LINE_C, color=LINE_C)
                bits.add(c.move_to([colx(j), rows_y[i], 0]))
            mask_rows.append(bits)
            anims += [FadeIn(row_labels[i]), LaggedStart(*[FadeIn(c) for c in bits], lag_ratio=0.03)]
            msg = f"$A[{i + 1}]={v}$: " + (f"pop {', '.join(str(A[j]) for j in popped)}; " if popped else "") + \
                "ngăn xếp $= [" + ", ".join(str(A[j]) for j in stack) + "]$"
            self.play(*anims, run_time=0.8)
            self.say(msg, fs=32, run_time=0.35)
            self.wait(0.25)
        self.play(paint(blk[n - 1], CELL_C, LINE_C, 2.5))
        self.say(r"$\mathit{mask}[r]$: bit $j=1\Leftrightarrow j$ còn trong ngăn xếp sau khi xét $r$ — 1 từ máy / phần tử")
        self.wait(0.8)

        res_slot = np.array([5.55, 1.15, 0])
        prev = None
        for (l, r) in ((3, 7), (6, 7), (1, 4)):
            row = mask_rows[r - 1]
            frame = SurroundingRectangle(VGroup(row_labels[r - 1], row), buff=0.06).set_stroke(AMBER, 5)
            q = range_box(list(blk[l - 1:r]), AMBER, width=5)
            dim = [row[j] for j in range(l - 1)]
            p = next(j for j in range(l - 1, r) if A[j] == min(A[l - 1:r]))
            anims = [ShowCreation(frame), ShowCreation(q)]
            if prev:
                anims += [FadeOut(m) for m in prev]
            self.say(r"Truy vấn $(%d,%d)$: lấy $\mathit{mask}[%d]$, xóa các bit $<%d$, chọn bit 1 thấp nhất" % (l, r, r, l))
            self.play(*anims)
            if dim:
                self.play(*[d.animate.set_opacity(0.15) for d in dim], run_time=0.5)
            self.play(row[p][0].animate.set_fill(GREEN, 1).set_stroke(GREEN, 5),
                      paint(blk[p], GREEN_FILL, GREEN, 6), run_time=0.6)
            res = TT(f"$\\min = A[{p + 1}] = {A[p]}$", 30, GREEN).move_to(res_slot)
            self.play(FadeIn(res))
            self.wait(0.9)
            restore = [d.animate.set_opacity(1) for d in dim]
            self.play(*restore, row[p][0].animate.set_fill(LINEAR, 1).set_stroke(LINEAR, 2.5),
                      paint(blk[p], CELL_C, LINE_C, 2.5), run_time=0.4)
            prev = [frame, q, res]
        self.play(*[FadeOut(m) for m in prev])
        code = T("p = l + ctz(mask[r] >> l)", 32, LINEAR, font=MONO).move_to([0.5, -2.75, 0])
        self.play(FadeIn(code))
        self.say(r"Một phép AND/dịch bit + 1 lệnh đếm bit 0 cuối (ctz) $\Rightarrow O(1)$ trong khối", color=LINEAR)
        self.wait(1.2)
        self.say(r"Kết hợp tầng trên (Sparse Table trên min các khối) $\Rightarrow \langle O(n),O(1)\rangle$ thực dụng",
                 color=GREEN)
        self.wait(2.0)


# --------------------------------------------------------------------- 9
class S09_EulerTourLCA(Base):
    def construct(self):
        P = {1: (0, 3.0), 2: (-2.6, 1.95), 3: (2.6, 1.95), 4: (-3.9, 0.9), 5: (-1.3, 0.9),
             6: (1.3, 0.9), 7: (3.9, 0.9)}
        depth = {1: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 2}
        P = {k: np.array([x - 0.6, y, 0]) for k, (x, y) in P.items()}
        par = {2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 3}
        rad = 0.36
        edges = VGroup(*[Line(P[par[c]], P[c], buff=rad).set_stroke(LINE_C, 4) for c in par])
        nodes = {k: VGroup(Circle(radius=rad).set_fill(BG, 1).set_stroke(INK, 3),
                           T(k, 32, weight="BOLD")).move_to(P[k]) for k in P}
        dlabels = VGroup(*[T(f"độ sâu {d}", 24, MUTED).move_to([5.9, y, 0])
                           for d, y in ((0, 3.0), (1, 1.95), (2, 0.9))])
        self.play(ShowCreation(edges), *[FadeIn(nd) for nd in nodes.values()], FadeIn(dlabels))
        self.say(r"Duyệt DFS, ghi lại nút mỗi khi đi xuống hoặc quay về $\Rightarrow$ Euler tour $E$")

        E = [1, 2, 4, 2, 5, 2, 1, 3, 6, 3, 7, 3, 1]
        D = [depth[v] for v in E]
        cs, gap = 0.7, 0.07
        x0 = -(len(E) - 1) * (cs + gap) / 2
        ey, dy_, iy = -0.75, -1.55, -2.18
        lab_E = T("E", 34, SPARSE, weight="BOLD").move_to([x0 - 0.85, ey, 0])
        lab_D = T("D", 34, ORANGE, weight="BOLD").move_to([x0 - 0.85, dy_, 0])
        self.play(FadeIn(lab_E), FadeIn(lab_D))
        dot = Dot(P[1], radius=0.13).set_fill(ORANGE, 1)
        self.play(FadeIn(dot, scale=0.5))
        ecells, dcells, icells = VGroup(), VGroup(), VGroup()
        for t, (v, d) in enumerate(zip(E, D)):
            x = x0 + t * (cs + gap)
            ec = make_cell(v, cs, 30, fill=BLUE_FILL, stroke=SPARSE).move_to([x, ey, 0])
            dc = make_cell(d, cs, 30, fill=ORANGE_FILL, stroke=ORANGE).move_to([x, dy_, 0])
            ic = T(t + 1, 20, MUTED).move_to([x, iy, 0])
            anims = [] if t == 0 else [dot.animate.move_to(P[v])]
            self.play(*anims, TransformFromCopy(nodes[v][1], ec[1]), FadeIn(ec[0]), FadeIn(dc), FadeIn(ic),
                      run_time=0.42)
            ecells.add(ec)
            dcells.add(dc)
            icells.add(ic)
        self.play(FadeOut(dot))
        self.say(r"Độ dài $2n-1=13$. \quad $\mathit{first}[u]$ = lần xuất hiện đầu tiên của $u$ trong $E$")
        self.wait(0.6)

        def query(u, v):
            fu, fv = E.index(u) + 1, E.index(v) + 1
            lo, hi = min(fu, fv), max(fu, fv)
            seg = D[lo - 1:hi]
            m = lo + seg.index(min(seg))
            self.say(r"$\mathrm{LCA}(%d,%d)$: $\mathit{first}[%d]=%d$, $\mathit{first}[%d]=%d\Rightarrow$ RMQ trên $D[%d..%d]$"
                     % (u, v, u, fu, v, fv, lo, hi))
            box = range_box(list(dcells[lo - 1:hi]), AMBER, width=6)
            self.play(nodes[u][0].animate.set_fill(AMBER_FILL, 1), nodes[v][0].animate.set_fill(AMBER_FILL, 1),
                      paint(ecells[fu - 1], AMBER_FILL, AMBER, 5), paint(ecells[fv - 1], AMBER_FILL, AMBER, 5))
            self.play(ShowCreation(box))
            self.play(paint(dcells[m - 1], GREEN_FILL, GREEN, 6), run_time=0.6)
            self.play(paint(ecells[m - 1], GREEN_FILL, GREEN, 6),
                      nodes[E[m - 1]][0].animate.set_fill(GREEN_FILL, 1).set_stroke(GREEN, 7), run_time=0.6)
            self.say(r"$\min D=%d$ tại vị trí %d $\Rightarrow \mathrm{LCA}(%d,%d)=E[%d]=%d$" % (min(seg), m, u, v, m, E[m - 1]),
                     color=GREEN)
            self.wait(1.3)
            self.play(FadeOut(box), nodes[u][0].animate.set_fill(BG, 1), nodes[v][0].animate.set_fill(BG, 1),
                      nodes[E[m - 1]][0].animate.set_fill(BG, 1).set_stroke(INK, 3),
                      paint(ecells[fu - 1], BLUE_FILL, SPARSE, 2.5), paint(ecells[fv - 1], BLUE_FILL, SPARSE, 2.5),
                      paint(ecells[m - 1], BLUE_FILL, SPARSE, 2.5), paint(dcells[m - 1], ORANGE_FILL, ORANGE, 2.5))

        query(4, 5)
        query(5, 6)
        self.say(r"$D$ kề nhau chênh đúng $\pm1\Rightarrow$ bài toán $\pm1$ RMQ (Bender \& Farach-Colton, 2000)", color=ORANGE)
        self.wait(2.0)


# --------------------------------------------------------------------- 10
class S10_SlidingWindow(Base):
    def construct(self):
        k = 3
        n = len(A)
        row = make_row(A, 0.95, 0.1, 40).move_to([0, 2.1, 0])
        idx = index_labels(row, fs=24)
        self.play(FadeIn(row), FadeIn(idx))
        self.say(r"Min của mọi cửa sổ độ dài $k=3$ — deque lưu chỉ số, giá trị tăng dần")
        dq_label = T("deque", 32, LINEAR, weight="BOLD").move_to([-5.6, 0.15, 0])
        out_label = T("kết quả", 32, GREEN, weight="BOLD").move_to([-5.6, -1.55, 0])
        self.play(FadeIn(dq_label), FadeIn(out_label))
        win = None
        dq, boxes, outs = [], [], VGroup()
        dq_x0 = -4.1

        def dq_cell(i):
            g = VGroup(make_cell(A[i], 0.85, 36, fill=VIOLET_FILL, stroke=LINEAR),
                       T(f"i={i + 1}", 20, MUTED))
            g[1].next_to(g[0], DOWN, buff=0.06)
            return g

        for i in range(n):
            anims = []
            msg = []
            popped_back = []
            while dq and A[dq[-1]] > A[i]:
                popped_back.append(dq.pop())
                anims.append(FadeOut(boxes.pop(), shift=0.4 * DOWN))
            if popped_back:
                msg.append("bỏ cuối " + ", ".join(str(A[j]) for j in popped_back))
            dq.append(i)
            nb = dq_cell(i).move_to([dq_x0 + (len(dq) - 1) * 1.1, 0.0, 0])
            boxes.append(nb)
            anims.append(FadeIn(nb, shift=0.3 * LEFT))
            if dq[0] <= i - k:
                dq.pop(0)
                anims.append(FadeOut(boxes.pop(0), shift=0.4 * LEFT))
                msg.append("bỏ đầu (hết hạn)")
            new_win = range_box(list(row[max(0, i - k + 1):i + 1]), AMBER, buff=0.1, width=6)
            anims.append(ReplacementTransform(win, new_win) if win is not None else ShowCreation(new_win))
            win = new_win
            self.play(*anims, run_time=0.7)
            moves = [b.animate.move_to([dq_x0 + j * 1.1, 0.0, 0]) for j, b in enumerate(boxes)]
            if moves:
                self.play(*moves, run_time=0.35)
            if i >= k - 1:
                oc = make_cell(A[dq[0]], 0.85, 36, fill=GREEN_FILL, stroke=GREEN)
                oc.move_to([dq_x0 + (i - k + 1) * 1.1, -1.55, 0])
                self.play(TransformFromCopy(boxes[0][0], oc), run_time=0.5)
                outs.add(oc)
                msg.append(f"$\\min={A[dq[0]]}$")
            self.say(f"$i={i + 1}$: " + ("; ".join(msg) if msg else "thêm vào cuối"), fs=32, run_time=0.35)
            self.wait(0.25)
        self.say(r"Mỗi chỉ số vào/ra deque $\le 1$ lần $\Rightarrow O(n)$ cho cả $n-k+1$ cửa sổ", color=GREEN)
        self.wait(2.0)


# --------------------------------------------------------------------- 11
class S11_LCPBanana(Base):
    def construct(self):
        S = "banana"
        n = len(S)
        word = VGroup(*[make_cell(ch, 0.72, 34, font=MONO) for ch in S]).arrange(RIGHT, buff=0.05)
        word.move_to([0, 3.15, 0])
        widx = VGroup(*[T(i + 1, 20, MUTED).next_to(c, DOWN, buff=0.05) for i, c in enumerate(word)])
        self.play(FadeIn(word), FadeIn(widx))
        self.say(r"Liệt kê các hậu tố của $S$ = “banana”")
        y0, dy, cw = 1.75, 0.62, 0.42
        x_text = -1.9

        def suffix_mob(i):
            chars = VGroup(*[T(ch, 34, font=MONO) for ch in S[i:]])
            for j, c in enumerate(chars):
                c.move_to([x_text + j * cw, 0, 0])
            tag = T(i + 1, 28, SPARSE, weight="BOLD").move_to([x_text - 1.1, 0, 0])
            return VGroup(tag, chars)

        rows = [suffix_mob(i) for i in range(n)]
        for i, r in enumerate(rows):
            r.shift((y0 - i * dy) * UP)
        hdr = VGroup(T("SA", 26, SPARSE, weight="BOLD").move_to([x_text - 1.1, y0 + 0.6, 0]),
                     T("hậu tố", 26, MUTED).move_to([x_text + 0.6, y0 + 0.6, 0]))
        self.play(FadeIn(hdr[1]), LaggedStart(*[FadeIn(r) for r in rows], lag_ratio=0.12))
        order = sorted(range(n), key=lambda i: S[i:])
        self.say(r"Sắp xếp theo thứ tự từ điển $\Rightarrow$ mảng hậu tố SA")
        self.play(*[rows[i].animate.move_to(rows[i].get_center() + ((y0 - order.index(i) * dy) - (y0 - i * dy)) * UP)
                    for i in range(n)], FadeIn(hdr[0]), run_time=1.4)
        ranks = VGroup(*[T(r + 1, 26, MUTED).move_to([x_text - 2.2, y0 - r * dy, 0]) for r in range(n)])
        rank_h = T("rank", 26, MUTED).move_to([x_text - 2.2, y0 + 0.6, 0])
        self.play(FadeIn(ranks), FadeIn(rank_h))

        def lcp(a, b):
            k = 0
            while a + k < n and b + k < n and S[a + k] == S[b + k]:
                k += 1
            return k

        L = [0] + [lcp(order[r - 1], order[r]) for r in range(1, n)]
        lx = 3.6
        lcp_h = T("LCP", 26, ORANGE, weight="BOLD").move_to([lx, y0 + 0.6, 0])
        lcells = VGroup(*[make_cell(v, 0.52, 26, fill=ORANGE_FILL, stroke=ORANGE).move_to([lx, y0 - r * dy, 0])
                          for r, v in enumerate(L)])
        self.say(r"$\mathrm{LCP}[t]$ = độ dài tiền tố chung của hậu tố hạng $t-1$ và hạng $t$")
        self.play(FadeIn(lcp_h), LaggedStart(*[FadeIn(c) for c in lcells], lag_ratio=0.12))
        self.wait(0.6)

        def query(i, j):
            ri, rj = order.index(i - 1) + 1, order.index(j - 1) + 1
            lo, hi = min(ri, rj), max(ri, rj)
            seg = L[lo:hi]
            val = min(seg)
            self.say(r"$\mathrm{LCE}(%d,%d)$: rank %d và %d $\Rightarrow \min \mathrm{LCP}[%d..%d]=%d$" % (i, j, ri, rj, lo + 1, hi, val))
            hl_rows = [rows[i - 1], rows[j - 1]]
            self.play(*[r[0].animate.set_fill(AMBER) for r in hl_rows])
            box = range_box(list(lcells[lo:hi]), AMBER, width=6)
            self.play(ShowCreation(box))
            pref = VGroup(*[c for r in hl_rows for c in r[1][:val]])
            anims = [paint(lcells[lo + seg.index(val)], GREEN_FILL, GREEN, 6)]
            if len(pref):
                anims.append(pref.animate.set_fill(GREEN))
            self.play(*anims)
            note = (f"tiền tố chung “{S[i - 1:i - 1 + val]}” dài {val}" if val else "không có tiền tố chung")
            self.say(r"$\mathrm{LCE}(%d,%d)=%d$: %s" % (i, j, val, note), color=GREEN)
            self.wait(1.2)
            restore = [r[0].animate.set_fill(SPARSE) for r in hl_rows]
            if len(pref):
                restore.append(pref.animate.set_fill(INK))
            self.play(FadeOut(box), paint(lcells[lo + seg.index(val)], ORANGE_FILL, ORANGE, 2.5), *restore)

        query(2, 4)
        query(1, 3)
        self.say(r"$\mathrm{LCE}(i,j)=\min \mathrm{LCP}[\mathrm{rank}_i+1..\mathrm{rank}_j]$ — một truy vấn RMQ, $O(1)$ sau tiền xử lý", color=SPARSE)
        self.wait(2.0)
