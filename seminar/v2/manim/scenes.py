"""ManimGL (3b1b/manim) scenes for the RMQ seminar, v2.

Black background, π narrator, one colour per data structure. Indices start at 0 and RMQ returns the
leftmost position of the minimum, matching the slides.

    source env.sh && manimgl scenes.py M03_SparseQuery -w --hd
    ./render_all.sh            # every scene, 1080p, into ../deck/dist/media
"""
import json
import os
import re
from pathlib import Path

import manimpango
from manimlib import *

HERE = Path(__file__).resolve().parent
FONT_DIR = HERE.parent.parent / "manim" / "fonts"
for _f in sorted(FONT_DIR.glob("*.ttf")):
    manimpango.register_font(str(_f))

FONT = "Be Vietnam Pro"
SERIF = "Source Serif 4"
MONO = "Source Code Pro"

BG = "#000000"
FPS = int(os.environ.get("RMQ_FPS", "30"))  # render_all.sh renders at 60 and stretches to half speed
INK = "#EAF0F6"
MUTED = "#8C98A8"
FAINT = "#3B4654"
CELL = "#11161C"
PI_BLUE = "#2FA8FF"
QUERY = "#FFE14D"
ANS = "#7EE06A"
SPARSE = "#22D3C5"
SEG = "#FF5FA2"
SQRT = "#A78BFA"
FH = "#FFB13D"
RED = "#FF5C5C"
BUBBLE_LINE = "#FFFFFF"
EYE_LINE = None
# RMQ_THEME=light renders the same scenes for the deck's light theme (render_all.sh adds a _light suffix)
if os.environ.get("RMQ_THEME", "dark") == "light":
    BG, INK, MUTED, FAINT, CELL = "#FAFAF7", "#17202B", "#5F6B7B", "#C3CBD5", "#FFFFFF"
    QUERY, ANS, SPARSE, SEG, SQRT, FH, RED = "#B08600", "#2B8A3E", "#0B8F86", "#D6336C", "#7048E8", "#D9480F", "#D9363E"
    BUBBLE_LINE, EYE_LINE = INK, INK


def reading_time(text):
    """Extra seconds so a caption can be read before the picture moves on."""
    plain = "".join(p for i, p in enumerate(str(text).split("$")) if i % 2 == 0)
    return max(0.3, 0.038 * (len(plain) + 6 * str(text).count("$") // 2) - 0.4)


def dim(color, alpha=0.22):
    """A dark tint of a colour, used as a cell fill on black."""
    return interpolate_color(BG, color, alpha)


def T(s, size=30, color=INK, weight="NORMAL", font=FONT):
    t = Text(str(s), font=font, font_size=size, weight=weight)
    t.set_fill(color, 1).set_stroke(width=0)
    return t


_SYMBOLS = [("\\mathrm{", "{"), ("\\log", " log"), ("\\min", " min"), ("\\pm", "±"), ("\\times", "×"),
            ("\\approx", "≈"), ("\\le", "≤"), ("\\ge", "≥"), ("\\Rightarrow", "⇒"), ("\\,", " ")]


def _math_markup(m):
    """Small subset of TeX -> Pango markup, so captions use one font: italic variables, real superscripts."""
    m = m.replace("&", "&amp;").replace("<", " &lt; ").replace(">", " &gt; ")
    for a, b in _SYMBOLS:
        m = m.replace(a, b)
    m = m.replace("-", "−")
    m = re.sub(r"(?<![A-Za-z&])([A-NP-Za-z])(?![A-Za-z;])", r"<i>\1</i>", m)
    m = re.sub(r"\^\{([^}]*)\}", r"<sup>\1</sup>", m)
    m = re.sub(r"\^(<i>\w</i>|\w)", r"<sup>\1</sup>", m)
    m = re.sub(r"_\{([^}]*)\}", r"<sub>\1</sub>", m)
    m = re.sub(r"_(<i>\w</i>|\w)", r"<sub>\1</sub>", m)
    m = m.replace("{", "").replace("}", "").replace("=", " = ")
    return re.sub(r" +", " ", m).replace("( ", "(").strip()


def markup(text):
    parts = str(text).split("$")
    return "".join(_math_markup(p) if i % 2 else p.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                   for i, p in enumerate(parts))


class Markup(MarkupText):
    """ManimGL 1.7.2 calls validate_markup_string without defining it; ManimPango has the validator."""

    def validate_markup_string(self, markup_str):
        error = manimpango.MarkupUtils.validate(markup_str)
        if error:
            raise ValueError(f"Invalid Pango markup {markup_str!r}: {error}")


def MT(text, size=30, color=INK, weight="NORMAL", font=FONT):
    t = Markup(text, font=font, font_size=size, weight=weight, use_labelled_svg=True,
               path_string_config=dict(use_simple_quadratic_approx=True))
    t.set_fill(color, 1).set_stroke(width=0)
    return t


def L(s, size=30, color=INK, weight="NORMAL"):
    return MT(markup(s), size, color, weight) if "$" in str(s) else T(s, size, color, weight)


def M(tex, size=40, color=INK):
    return Tex(tex, font_size=size).set_fill(color, 1)


def cell(val, size=0.9, fs=38, fill=CELL, stroke=FAINT, color=INK, font=MONO, sub=None):
    box = RoundedRectangle(width=size, height=size, corner_radius=0.07)
    box.set_fill(fill, 1).set_stroke(stroke, 2.5)
    lab = T(val, fs, color, font=font).move_to(box)
    g = VGroup(box, lab)
    if sub is not None:
        lab.shift(0.09 * UP)
        g.add(T(sub, fs * 0.5, MUTED).move_to(box.get_center() + 0.28 * size * DOWN))
    return g


def row(vals, size=0.9, gap=0.08, fs=38):
    return VGroup(*[cell(v, size, fs) for v in vals]).arrange(RIGHT, buff=gap)


def indices(r, fs=20, side=DOWN, buff=0.1, start=0):
    return VGroup(*[T(i + start, fs, MUTED).next_to(c, side, buff=buff) for i, c in enumerate(r)])


def paint(c, color, width=4, alpha=0.3):
    return c[0].animate.set_fill(dim(color, alpha), 1).set_stroke(color, width)


def unpaint(c):
    return c[0].animate.set_fill(CELL, 1).set_stroke(FAINT, 2.5)


def span(r, a, b, color, y, label=None, fs=26, side=UP):
    """Horizontal bracket over cells a..b at height y."""
    x1, x2 = r[a].get_left()[0] + 0.03, r[b].get_right()[0] - 0.03
    bar = VGroup(Line([x1, y, 0], [x2, y, 0]).set_stroke(color, 7),
                 Line([x1, y - 0.13, 0], [x1, y + 0.13, 0]).set_stroke(color, 5),
                 Line([x2, y - 0.13, 0], [x2, y + 0.13, 0]).set_stroke(color, 5))
    if label is not None:
        bar.add(L(label, fs, color).next_to(bar[0], side, buff=0.1))
    return bar


def box_around(cells, color, buff=0.07, width=5):
    return SurroundingRectangle(VGroup(*cells), buff=buff).set_stroke(color, width).set_fill(opacity=0)


# ------------------------------------------------------------------ π
SHAPE = json.loads((HERE / "pi_shape.json").read_text())


def _mouth_points(mood):
    w, top, bot = SHAPE["moods"][mood]
    xs = np.linspace(-1, 1, 16)
    up = [(x * w, top * (1 - x * x)) for x in xs]
    lo = [(x * w, bot * (1 - x * x)) for x in xs[::-1][1:-1]]
    return up + lo


class Pi(VGroup):
    """The narrator: same outline as the web deck, drawn from pi_shape.json."""

    def __init__(self, height=1.6, mood="neutral"):
        super().__init__()
        self.u = u = height / 250
        self.to_xy = lambda x, y: np.array([(x - 110) * u, (125 - y) * u, 0])
        shape = lambda poly: VMobject().set_points_as_corners([self.to_xy(*p) for p in [*poly, poly[0]]]) \
            .set_fill(PI_BLUE, 1).set_stroke(width=0)
        self.body = VGroup(*[shape(poly) for poly in SHAPE["body"]])
        self.arm_l, self.arm_r = shape(SHAPE["armL"]), shape(SHAPE["armR"])
        # invisible markers that move and scale with π, so arms always turn around the shoulders
        self.shoulder_l = Dot(self.to_xy(*SHAPE["shoulderL"]), radius=0.001).set_opacity(0)
        self.shoulder_r = Dot(self.to_xy(*SHAPE["shoulderR"]), radius=0.001).set_opacity(0)
        self.whites, self.pupils = VGroup(), VGroup()
        for e in SHAPE["eyes"]:
            white = Ellipse(width=2 * e["rx"] * u, height=2 * e["ry"] * u).set_fill("#FFFFFF", 1)
            white.set_stroke(EYE_LINE, 2.5) if EYE_LINE else white.set_stroke(width=0)
            self.whites.add(white.move_to(self.to_xy(e["cx"], e["cy"])))
            self.pupils.add(Circle(radius=SHAPE["pupil"] * u).set_fill("#000000", 1).set_stroke(width=0)
                            .move_to(self.to_xy(e["cx"] + 3, e["cy"] + 4)))
        self.mood = mood
        self.mouth = VMobject().set_fill("#06233B", 1).set_stroke(width=0)
        self._set_mouth(mood)
        self.add(self.arm_l, self.arm_r, self.body, self.whites, self.pupils, self.mouth, self.shoulder_l, self.shoulder_r)

    def _set_mouth(self, mood):
        m = SHAPE["mouth"]
        pts = [self.to_xy(m["cx"] + x, m["cy"] + y) for x, y in _mouth_points(mood)]
        self.mouth.set_points_as_corners([*pts, pts[0]])

    def change(self, mood, look=None):
        # keep size and place: rebuild the mouth relative to the eyes' current position
        center_old, h = self.get_center(), self.body.get_height()
        ref = Pi(self.u * 250, mood)
        ref.scale(h / ref.body.get_height())
        ref.shift(self.body.get_center() - ref.body.get_center())
        self.mouth.become(ref.mouth)
        self.mood = mood
        if look is not None:
            self.look_at(look)
        return self

    def gesture(self, both=False, up=0.75):
        """Raise the arm(s) and bring them back down: used whenever π speaks."""
        anims = [Rotate(self.arm_r, up, about_point=self.shoulder_r.get_center(), rate_func=there_and_back)]
        if both:
            anims.append(Rotate(self.arm_l, -up * 0.7, about_point=self.shoulder_l.get_center(), rate_func=there_and_back))
        return anims

    def look_at(self, point):
        for white, pupil in zip(self.whites, self.pupils):
            d = np.array(point) - white.get_center()
            d = d / (np.linalg.norm(d) + 1e-6)
            reach = white.get_width() * 0.2
            pupil.move_to(white.get_center() + d * reach)
        return self


def bubble(pi, lines, size=30, side=RIGHT, color=INK):
    """Speech bubble with a tail pointing at π's head."""
    text = VGroup(*[L(s, size, color) for s in lines]).arrange(DOWN, aligned_edge=LEFT, buff=0.14)
    box = RoundedRectangle(width=text.get_width() + 0.6, height=text.get_height() + 0.45, corner_radius=0.18)
    box.set_fill(BG, 1).set_stroke(BUBBLE_LINE, 2.5)
    head = pi.whites.get_top() + 0.1 * UP
    sgn = 1 if side is RIGHT else -1
    box.next_to(head, UR if side is RIGHT else UL, buff=0.22).shift(0.25 * sgn * RIGHT)
    text.move_to(box)
    b1 = box.get_corner(DL if side is RIGHT else DR) + sgn * 0.42 * RIGHT
    b2 = b1 + sgn * 0.34 * RIGHT
    tip = head + sgn * 0.12 * RIGHT
    cover = Polygon(b1 + 0.05 * UP, b2 + 0.05 * UP, b2 + 0.03 * DOWN, b1 + 0.03 * DOWN).set_fill(BG, 1).set_stroke(width=0)
    edges = VMobject().set_points_as_corners([b1, tip, b2]).set_stroke(BUBBLE_LINE, 2.5).set_fill(opacity=0)
    gap = Polygon(b1, tip, b2).set_fill(BG, 1).set_stroke(width=0)
    return VGroup(box, gap, cover, edges, text)


class Base(Scene):
    default_camera_config = dict(background_color=BG, fps=FPS)
    heading = ""

    def setup(self):
        super().setup()
        self.caption = None
        self.pi = Pi(1.55).move_to([-6.15, -3.05, 0])
        if self.heading:
            self.head = T(self.heading, 30, INK, font=SERIF, weight="BOLD").to_corner(UL, buff=0.32)
            self.add(self.head)
        self.add(self.pi)

    def say(self, text, mood=None, color=INK, fs=30, look=None, run_time=0.5):
        new = L(text, fs, color)
        if new.get_width() > 11.6:
            new.set_width(11.6)
        new.move_to([-5.15 + new.get_width() / 2, -3.3, 0])
        anims = []
        if mood or look is not None:
            target = self.pi.generate_target()
            if mood:
                target.change(mood)
            if look is not None:
                target.look_at(look)
            anims.append(MoveToTarget(self.pi))
        if self.caption is not None:
            anims.append(FadeOut(self.caption, shift=0.15 * UP))
        anims.append(FadeIn(new, shift=0.15 * UP))
        self.play(*anims, run_time=run_time)
        self.caption = new
        self.n_said = getattr(self, "n_said", 0) + 1
        self.play(*self.pi.gesture(both=self.n_said % 3 == 0), run_time=0.9)
        self.wait(max(0.1, reading_time(text) - 0.9))

    def blink(self, pi=None):
        pi = pi or self.pi
        eyes = VGroup(pi.whites, pi.pupils)
        center = eyes.get_center()
        self.play(eyes.animate.stretch(0.08, 1, about_point=center), rate_func=there_and_back, run_time=0.22)

    def done(self, wait=2.2):
        self.wait(wait / 2)
        self.blink()
        self.wait(wait / 2)


A = [7, 4, 9, 4, 6, 2, 2, 8]


def better(arr, p, q):
    if arr[p] != arr[q]:
        return p if arr[p] < arr[q] else q
    return min(p, q)


# ------------------------------------------------------------------ opening story
PRICES = [1.25, 1.10, 1.45, 0.98, 1.35, 0.89, 1.18, 1.05, 0.92, 1.30, 1.15, 0.99, 1.40, 0.87]


def vnd(p):
    return f"{p:.2f}".replace(".", ",")


def day_card(d, price):
    box = RoundedRectangle(width=0.86, height=1.05, corner_radius=0.08).set_fill(CELL, 1).set_stroke(FAINT, 2)
    date = T(f"{d}/11", 15, MUTED).move_to(box.get_center() + 0.27 * UP)
    pr = T(vnd(price), 25, INK, font=MONO).move_to(box.get_center() + 0.1 * DOWN)
    return VGroup(box, date, pr)


class M01_Story(Scene):
    default_camera_config = dict(background_color=BG, fps=FPS)

    def construct(self):
        pi = Pi(3.1, "happy").move_to([-4.6, -0.9, 0])
        pi.look_at([3, 2, 0])
        self.play(FadeIn(pi, shift=0.5 * UP), run_time=0.7)

        hcm, hn = np.array([0.8, -2.0, 0]), np.array([4.4, 2.4, 0])
        route = DashedVMobject(ArcBetweenPoints(hcm, hn, angle=-TAU / 6).set_stroke(MUTED, 3), num_dashes=26)
        d1, d2 = Dot(hcm, radius=0.1).set_fill(SPARSE, 1), Dot(hn, radius=0.1).set_fill(SEG, 1)
        lab1 = T("TP.HCM", 28).next_to(d1, DOWN, buff=0.15)
        lab2 = T("Hà Nội", 28).next_to(d2, UP, buff=0.15)
        arc_path = ArcBetweenPoints(hcm, hn, angle=-TAU / 6)
        base = Polygon([0.24, 0, 0], [-0.16, 0.14, 0], [-0.07, 0, 0], [-0.16, -0.14, 0]).set_fill(INK, 1).set_stroke(width=0)

        def fly(m, a):
            a = min(max(a, 0.0), 1.0)
            p = arc_path.point_from_proportion(a)
            p0, p1 = arc_path.point_from_proportion(max(0, a - 0.004)), arc_path.point_from_proportion(min(1, a + 0.004))
            m.become(base.copy().rotate(angle_of_vector(p1 - p0), about_point=ORIGIN).shift(p))

        plane = base.copy()
        fly(plane, 0)
        self.play(FadeIn(d1), FadeIn(d2), FadeIn(lab1), FadeIn(lab2), ShowCreation(route), run_time=0.9)
        talk = bubble(pi, ["Mình muốn bay từ TP.HCM ra Hà Nội."], 28)
        self.play(FadeIn(talk, shift=0.1 * UP), run_time=0.4)
        self.play(*pi.gesture(up=0.7), run_time=1.0)
        self.add(plane)
        self.play(UpdateFromAlphaFunc(plane, fly), rate_func=smooth, run_time=1.8)
        self.wait(0.4)
        talk2 = bubble(pi, ["Ngày nào cũng được, miễn rẻ nhất."], 28)
        self.play(FadeOut(talk), FadeIn(talk2), run_time=0.4)
        self.play(*pi.gesture(both=True, up=0.6), run_time=1.0)
        self.wait(1.2)
        self.play(*[FadeOut(m) for m in (talk2, route, d1, d2, lab1, lab2, plane)], run_time=0.5)

        # the price calendar
        small = Pi(1.55, "think").move_to([-6.15, -3.05, 0])
        cards = VGroup(*[day_card(i + 1, p) for i, p in enumerate(PRICES)]).arrange(RIGHT, buff=0.08)
        cards.move_to([0, 1.5, 0])
        title = T("Giá vé TP.HCM → Hà Nội", 34, font=SERIF, weight="BOLD").to_corner(UL, buff=0.38)
        unit = T("giá giả lập, đơn vị: triệu đồng", 22, MUTED).next_to(title, RIGHT, buff=0.35)
        self.play(Transform(pi, small), FadeIn(title), FadeIn(unit),
                  LaggedStart(*[FadeIn(c, shift=0.2 * UP) for c in cards], lag_ratio=0.05), run_time=1.3)
        self.pi = pi
        caption = None

        def say(text, mood=None, color=INK, look=None):
            nonlocal caption
            new = L(text, 30, color)
            if new.get_width() > 11.6:
                new.set_width(11.6)
            new.move_to([-5.15 + new.get_width() / 2, -3.3, 0])
            anims = [FadeIn(new, shift=0.15 * UP)]
            if caption is not None:
                anims.append(FadeOut(caption, shift=0.15 * UP))
            if mood or look is not None:
                tg = pi.generate_target()
                if mood:
                    tg.change(mood)
                if look is not None:
                    tg.look_at(look)
                anims.append(MoveToTarget(pi))
            self.play(*anims, run_time=0.45)
            caption = new
            self.play(*pi.gesture(both=mood in ("happy", "surprised")), run_time=0.9)
            self.wait(max(0.1, reading_time(text) - 0.9))

        def scan(lo, hi, who, color, y, speed=0.2):
            """Pointer walks through days lo..hi (1-based), keeps the cheapest."""
            nonlocal caption
            x1, x2 = cards[lo - 1].get_left()[0], cards[hi - 1].get_right()[0]
            br = VGroup(Line([x1, y, 0], [x2, y, 0]).set_stroke(color, 6),
                        T(who, 22, color).move_to([(x1 + x2) / 2, y - 0.25, 0]))
            self.play(ShowCreation(br[0]), FadeIn(br[1]), run_time=0.4)
            arrow = Triangle(start_angle=-PI / 2).scale(0.12).set_fill(color, 1).set_stroke(width=0)
            arrow.next_to(cards[lo - 1], UP, buff=0.08)
            self.add(arrow)
            best = lo - 1
            self.play(cards[best][0].animate.set_fill(dim(ANS, 0.35), 1).set_stroke(ANS, 3), run_time=speed)
            for i in range(lo, hi):
                self.play(arrow.animate.next_to(cards[i], UP, buff=0.08), run_time=speed)
                if PRICES[i] < PRICES[best]:
                    self.play(cards[best][0].animate.set_fill(CELL, 1).set_stroke(FAINT, 2),
                              cards[i][0].animate.set_fill(dim(ANS, 0.35), 1).set_stroke(ANS, 3), run_time=speed)
                    best = i
            self.remove(arrow)
            return br, best

        say("Pi rảnh từ 3/11 đến 10/11: đọc từng ngày.", "think")
        scan(3, 10, "Pi: đọc 8 ngày", QUERY, 0.62, 0.17)
        say("Rẻ nhất: 6/11, giá 0,89 triệu. Xong!", "happy", ANS)
        self.wait(1.0)
        # stops here: the next slides let the audience run the other people's queries themselves
        eyes = VGroup(pi.whites, pi.pupils)
        self.play(eyes.animate.stretch(0.08, 1, about_point=eyes.get_center()), rate_func=there_and_back, run_time=0.22)
        self.wait(1.2)


# ------------------------------------------------------------------ Sparse Table: build
class M02_SparseBuild(Base):
    heading = "Sparse Table · xây bảng"

    def construct(self):
        n = len(A)
        step, size, x0 = 1.02, 0.86, -2.55
        ys = [1.78, 0.64, -0.5, -1.64]

        def pos(k, i):
            return np.array([x0 + i * step, ys[k], 0])

        formula = M(r"st[k][i]=\mathrm{better}\big(st[k-1][i],\ st[k-1][i+2^{k-1}]\big)", 36, SPARSE)
        # centred over the table columns, on the heading's line, clear of the deck's top-right buttons
        formula.move_to([x0 + (n - 1) * step / 2, self.head.get_center()[1], 0])
        arr = VGroup(*[T(v, 30, INK, font=MONO).move_to(pos(0, i) + 0.86 * UP) for i, v in enumerate(A)])
        idx = VGroup(*[T(f"i={i}", 18, MUTED).move_to(pos(0, i) + 1.2 * UP) for i in range(n)])
        arr_l = T("A", 28, MUTED, font=MONO).move_to(pos(0, 0) + 0.86 * UP + 1.3 * LEFT)
        self.play(FadeIn(arr), FadeIn(idx), FadeIn(arr_l), run_time=0.6)
        self.say("Mỗi ô: vị trí nhỏ nhất của một đoạn dài 1, 2, 4, 8.", "talk")

        labels = VGroup()
        for k in range(4):
            lab = VGroup(L(f"$k={k}$", 26, SPARSE), T(f"dài {2 ** k}", 18, MUTED)).arrange(DOWN, buff=0.04)
            labels.add(lab.move_to(pos(k, 0) + 1.3 * LEFT))

        table = {}
        row0 = VGroup()
        for i in range(n):
            c = cell(i, size, 32, sub=f"A={A[i]}").move_to(pos(0, i))
            table[(0, i)] = (c, i)
            row0.add(c)
        self.play(FadeIn(labels[0]), LaggedStart(*[FadeIn(c, shift=0.15 * DOWN) for c in row0], lag_ratio=0.06), run_time=0.8)
        self.say(r"Hàng $k=0$: đoạn dài 1, đáp án là chính nó.")
        self.wait(0.8)
        self.play(FadeIn(formula), run_time=0.6)

        slow = {(1, 0): r"$st[1][0]$: $4<7$, chọn vị trí 1.",
                (2, 1): r"$st[2][1]$: hai nửa cùng là 4, chọn bên trái.",
                (2, 3): r"$st[2][3]$: $2<4$, chọn vị trí 5.",
                (3, 0): r"$st[3][0]$: cả mảng, min ở vị trí 5."}
        for k in range(1, 4):
            half = 2 ** (k - 1)
            self.play(FadeIn(labels[k]), run_time=0.3)
            for i in range(n - 2 ** k + 1):
                (ca, pa), (cb, pb) = table[(k - 1, i)], table[(k - 1, i + half)]
                p = better(A, pa, pb)
                c = cell(p, size, 32, sub=f"A={A[p]}").move_to(pos(k, i))
                c[0].set_fill(dim(SPARSE, 0.14), 1).set_stroke(SPARSE, 2)
                table[(k, i)] = (c, p)
                if (k, i) in slow:
                    a1 = Arrow(ca.get_bottom(), c.get_top(), buff=0.04, thickness=2.5).set_color(QUERY)
                    a2 = Arrow(cb.get_bottom(), c.get_top(), buff=0.04, thickness=2.5).set_color(SEG)
                    self.say(slow[(k, i)])
                    self.play(ca[0].animate.set_stroke(QUERY, 5), cb[0].animate.set_stroke(SEG, 5),
                              GrowArrow(a1), GrowArrow(a2), run_time=0.5)
                    self.play(FadeIn(c, scale=0.8), run_time=0.45)
                    self.wait(1.5)
                    self.play(FadeOut(a1), FadeOut(a2), ca[0].animate.set_stroke(SPARSE if k > 1 else FAINT, 2),
                              cb[0].animate.set_stroke(SPARSE if k > 1 else FAINT, 2), run_time=0.3)
                else:
                    self.play(FadeIn(c, shift=0.12 * DOWN), run_time=0.18)
        self.wait(0.3)
        c, _ = table[(2, 3)]
        cover = box_around([table[(0, i)][0] for i in range(3, 7)], QUERY, width=5)
        self.play(c[0].animate.set_stroke(QUERY, 6), ShowCreation(cover), run_time=0.6)
        self.say(r"$st[2][3]=5$: đoạn từ 3, dài 4, min ở vị trí 5.", "happy", QUERY)
        self.wait(2.0)
        self.play(FadeOut(cover), c[0].animate.set_stroke(SPARSE, 2), run_time=0.3)
        self.say(r"$\log_2 n$ tầng, mỗi tầng $n$ ô: xây $O(n\log n)$.", None, SPARSE)
        self.done()


# ------------------------------------------------------------------ Sparse Table: query
class M03_SparseQuery(Base):
    heading = "Sparse Table · trả lời truy vấn"

    def construct(self):
        r = row(A, 1.0, 0.1, 40).move_to([0, 0.35, 0])
        idx = indices(r, 22)
        self.play(LaggedStart(*[FadeIn(c) for c in r], lag_ratio=0.05), FadeIn(idx), run_time=0.7)
        self.say(r"Truy vấn $[1,6]$, dài 6. Bảng không có độ dài 6!", "think")
        q = box_around(list(r[1:7]), QUERY, buff=0.1, width=4)
        self.play(ShowCreation(q), run_time=0.5)
        self.wait(1.2)
        calc = M(r"L=6,\quad k=\lfloor\log_2 6\rfloor=2,\quad 2^k=4", 40, INK).move_to([0, 2.9, 0])
        self.say(r"Lũy thừa của 2 lớn nhất không vượt quá 6 là 4.", "talk")
        self.play(Write(calc), run_time=0.9)
        self.wait(0.8)
        top = span(r, 1, 4, SPARSE, 1.25, r"$st[2][1]=1$, giá trị 4")
        bot = span(r, 3, 6, SEG, -0.72, r"$st[2][3]=5$, giá trị 2", side=DOWN)
        self.say("Một khối bám đầu trái, một khối bám đầu phải.")
        self.play(ShowCreation(top[:3]), FadeIn(top[3]), *[paint(r[i], SPARSE) for i in (1, 2)], run_time=0.7)
        self.wait(0.5)
        self.play(ShowCreation(bot[:3]), FadeIn(bot[3]), *[paint(r[i], SEG) for i in (5, 6)], run_time=0.7)
        self.play(*[paint(r[i], SQRT, 5) for i in (3, 4)], run_time=0.5)
        self.say("Phủ kín đoạn. Phần giao xét hai lần cũng không sao.")
        self.wait(1.8)
        ans = M(r"\mathrm{better}(1,5)=5", 44, ANS).move_to([0, -1.85, 0])
        self.play(Write(ans), paint(r[5], ANS, 6, 0.4), run_time=0.8)
        self.say(r"Hai lần tra bảng: $\mathrm{RMQ}(1,6)=5$. Truy vấn $O(1)$.", "happy", ANS)
        self.wait(2.0)

        self.play(*[FadeOut(m) for m in (r, idx, top, bot, ans, calc, q)], run_time=0.5)
        B = [1, 2, 3, 4, 5, 6]
        r2 = row(B, 1.0, 0.1, 40).move_to([0, 0.35, 0])
        idx2 = indices(r2, 22)
        ask = T("Đổi phép min thành phép cộng thì sao?", 34, font=SERIF, weight="BOLD").move_to([0, 2.9, 0])
        self.say("Thử với tổng cả mảng.", "think")
        self.play(FadeIn(ask), FadeIn(r2), FadeIn(idx2), run_time=0.6)
        top2 = span(r2, 0, 3, SPARSE, 1.25, r"$1+2+3+4=10$")
        bot2 = span(r2, 2, 5, SEG, -0.72, r"$3+4+5+6=18$", side=DOWN)
        self.play(ShowCreation(top2[:3]), FadeIn(top2[3]), ShowCreation(bot2[:3]), FadeIn(bot2[3]),
                  *[paint(r2[i], RED, 5) for i in (2, 3)], run_time=0.9)
        wrong = M(r"10+18=28\ \neq\ 21", 46, RED).move_to([0, -1.85, 0])
        self.play(Write(wrong), run_time=0.7)
        self.say("Sai: 3 và 4 bị cộng hai lần.", "worried", RED)
        self.wait(2.2)
        self.say(r"Min không sợ chồng lấn vì $\min(x,x)=x$.", "happy", SPARSE)
        self.done()


# ------------------------------------------------------------------ Segment Tree
class M04_SegmentTree(Base):
    heading = "Segment Tree · khi giá vé thay đổi"

    def construct(self):
        vals = A[:]
        y = {0: -1.7, 1: -0.4, 2: 0.9, 3: 2.2}
        xs = {0: [-5.25 + j * 1.5 for j in range(8)]}
        ranges = {0: [(i, i) for i in range(8)], 1: [(0, 1), (2, 3), (4, 5), (6, 7)], 2: [(0, 3), (4, 7)], 3: [(0, 7)]}
        for lv in (1, 2, 3):
            xs[lv] = [(xs[lv - 1][2 * j] + xs[lv - 1][2 * j + 1]) / 2 for j in range(len(ranges[lv]))]

        def value(lv, j):
            a, b = ranges[lv][j]
            return min(vals[a:b + 1])

        def node(lv, j):
            box = RoundedRectangle(width=1.16, height=0.92, corner_radius=0.13).set_fill(CELL, 1).set_stroke(SEG, 2.5)
            v = T(value(lv, j), 32, font=MONO).move_to(box.get_center() + 0.13 * UP)
            a, b = ranges[lv][j]
            rg = T(f"[{a},{b}]" if a != b else f"[{a}]", 17, MUTED).move_to(box.get_center() + 0.27 * DOWN)
            return VGroup(box, v, rg).move_to([xs[lv][j], y[lv], 0])

        nodes = {lv: VGroup(*[node(lv, j) for j in range(len(ranges[lv]))]) for lv in range(4)}
        edge = {}
        for lv in (1, 2, 3):
            for j in range(len(ranges[lv])):
                for c in (2 * j, 2 * j + 1):
                    edge[(lv - 1, c)] = Line(nodes[lv - 1][c].get_top(), nodes[lv][j].get_bottom()).set_stroke(FAINT, 3)
        self.play(LaggedStart(*[FadeIn(nd, shift=0.2 * UP) for nd in nodes[0]], lag_ratio=0.07), run_time=0.8)
        self.say("Lá là mảng. Mỗi nút cha lưu min của hai con.", "talk")
        for lv in (1, 2, 3):
            self.play(*[ShowCreation(edge[(lv - 1, c)]) for c in range(len(nodes[lv - 1]))], run_time=0.35)
            self.play(LaggedStart(*[FadeIn(nd, shift=0.12 * UP) for nd in nodes[lv]], lag_ratio=0.15), run_time=0.5)
        self.say(r"Xây từ dưới lên, $n-1$ nút trong: $O(n)$.")
        self.wait(1.0)

        self.say(r"Truy vấn $[1,6]$: chọn các nút phủ vừa khít đoạn.", "think")
        x1, x2 = nodes[0][1].get_left()[0], nodes[0][6].get_right()[0]
        yb = nodes[0].get_bottom()[1] - 0.2
        qbar = Line([x1, yb, 0], [x2, yb, 0]).set_stroke(QUERY, 7)
        self.play(ShowCreation(qbar), run_time=0.4)
        canon = [(0, 1), (1, 1), (1, 2), (0, 6)]
        for lv, j in canon:
            self.play(paint(nodes[lv][j], QUERY, 5), run_time=0.4)
        res = M(r"\min(4,\ 4,\ 2,\ 2)=2", 42, ANS).move_to([4.6, 2.55, 0])
        self.play(Write(res), run_time=0.7)
        self.say(r"Mỗi tầng tối đa 2 nút: truy vấn $O(\log n)$.", "happy", ANS)
        self.wait(1.6)
        self.play(*[nodes[lv][j][0].animate.set_fill(CELL, 1).set_stroke(SEG, 2.5) for lv, j in canon],
                  FadeOut(qbar), FadeOut(res), run_time=0.4)

        self.say(r"Đổi $A[5]$ từ 2 thành 10: chỉ sửa đường lên gốc.", "surprised", SEG)
        vals[5] = 10
        path = [(0, 5), (1, 2), (2, 1), (3, 0)]
        for s, (lv, j) in enumerate(path):
            nd = nodes[lv][j]
            nv = T(value(lv, j), 32, INK, font=MONO).move_to(nd[1])
            anims = [paint(nd, SEG, 5), Transform(nd[1], nv)]
            if s:
                anims.append(edge[path[s - 1]].animate.set_stroke(SEG, 6))
            self.play(*anims, run_time=0.6)
        self.say(r"Chỉ 4 nút đổi: cập nhật $O(\log n)$.", "happy", SEG)
        self.wait(2.0)
        self.say(r"Đổi lại, truy vấn $O(\log n)$ thay vì $O(1)$.")
        self.done()


# ------------------------------------------------------------------ blocks + sparse table on top
class M05_Blocks(Base):
    heading = "Fischer–Heun · tầng trên: chia khối"

    def construct(self):
        A16 = [2, 7, 5, 8, 9, 4, 1, 6, 8, 5, 3, 7, 10, 2, 0, 4]
        b = 4
        blocks = VGroup(*[row(A16[k * b:(k + 1) * b], 0.68, 0.05, 28) for k in range(4)])
        blocks.arrange(RIGHT, buff=0.34).move_to([0, 2.2, 0])
        cells = [c for blk in blocks for c in blk]
        idx = VGroup(*[T(i, 17, MUTED).next_to(c, DOWN, buff=0.08) for i, c in enumerate(cells)])
        self.play(LaggedStart(*[FadeIn(c) for c in cells], lag_ratio=0.03), FadeIn(idx), run_time=0.8)
        self.say("Chia mảng thành các khối dài 4.", "talk")
        frames = VGroup(*[SurroundingRectangle(blk, buff=0.08).set_stroke(FH, 2.5) for blk in blocks])
        names = VGroup(*[T(f"khối {k}", 20, FH).next_to(frames[k], UP, buff=0.08) for k in range(4)])
        self.play(ShowCreation(frames), FadeIn(names), run_time=0.6)
        self.wait(0.6)

        mins = [min(A16[k * b:(k + 1) * b]) for k in range(4)]
        G = [k * b + A16[k * b:(k + 1) * b].index(mins[k]) for k in range(4)]
        vrow = VGroup(*[cell(m, 0.8, 32, fill=dim(FH, 0.18), stroke=FH).move_to([frames[k].get_x(), 0.0, 0]) for k, m in enumerate(mins)])
        grow = VGroup(*[T(f"vị trí {g}", 18, MUTED).next_to(vrow[k], DOWN, buff=0.08) for k, g in enumerate(G)])
        arrows = VGroup(*[Arrow(idx[k * b + 1].get_bottom() + 0.36 * RIGHT, vrow[k].get_top(), buff=0.06, thickness=2.5).set_color(FH) for k in range(4)])
        vl = L(r"$V$", 34, FH).next_to(vrow, LEFT, buff=0.45)
        self.say("Mỗi khối gửi một đại diện: min và vị trí của nó.")
        self.play(LaggedStart(*[GrowArrow(a) for a in arrows], lag_ratio=0.1), LaggedStart(*[FadeIn(c) for c in vrow], lag_ratio=0.1),
                  FadeIn(grow), FadeIn(vl), run_time=1.0)
        self.wait(1.2)
        st = L(r"Sparse Table chỉ xây trên $V$", 30, SPARSE).next_to(vrow, RIGHT, buff=0.5)
        st.shift(0.05 * DOWN)
        if st.get_right()[0] > 6.9:
            st.set_width(6.9 - st.get_left()[0])
        self.play(FadeIn(st, shift=0.2 * LEFT), run_time=0.5)
        self.say("Bảng nhỏ đi rất nhiều.", "happy", SPARSE)
        self.wait(1.6)

        self.say(r"Truy vấn $\mathrm{RMQ}(7,12)$: cắt ngang các khối.", "think")
        q = box_around(cells[7:13], QUERY, buff=0.12, width=5)
        self.play(ShowCreation(q), FadeOut(st), run_time=0.5)
        self.wait(1.0)
        self.say(r"Không lấy min cả khối được: số 1 nằm ngoài đoạn!", "surprised", RED)
        self.play(paint(cells[6], RED, 5), paint(cells[14], RED, 5), run_time=0.5)
        self.wait(1.8)
        self.play(unpaint(cells[6]), unpaint(cells[14]), run_time=0.3)

        self.say("Tách ba phần: đuôi trái, khối giữa, đầu phải.", "talk")
        p1 = box_around(cells[7:8], SPARSE, width=5)
        p2 = box_around(cells[8:12], SQRT, width=5)
        p3 = box_around(cells[12:13], SEG, width=5)
        self.play(ShowCreation(p1), run_time=0.35)
        self.play(ShowCreation(p2), run_time=0.35)
        self.play(ShowCreation(p3), run_time=0.35)
        la = VGroup(L(r"$A[7]=6$", 28, SPARSE), L("giữa: 3 tại vị trí 10", 28, SQRT), L(r"$A[12]=10$", 28, SEG))
        la.arrange(RIGHT, buff=0.7).move_to([0, -1.25, 0])
        for l_ in la:
            self.play(FadeIn(l_, shift=0.1 * UP), run_time=0.4)
        self.wait(1.2)
        ans = M(r"\min(6,\ 3,\ 10)=3\ \ \Rightarrow\ \ \mathrm{RMQ}(7,12)=10", 38, ANS).move_to([0.3, -2.1, 0])
        self.play(Write(ans), paint(cells[10], ANS, 6, 0.4), run_time=0.8)
        self.say("Phần giữa đã $O(1)$. Còn hai mẩu biên trong khối?", "think", FH)
        self.done(2.6)


# ------------------------------------------------------------------ Cartesian tree
class M06_CartesianTree(Base):
    heading = "Cây Cartesian"

    def construct(self):
        n = len(A)
        col = lambda i: -4.55 + i * 1.3  # noqa: E731
        top, dy, rad = 2.45, 0.86, 0.34

        def pos(i, d):
            return np.array([col(i), top - d * dy, 0])

        arr = VGroup(*[cell(v, 0.78, 30).move_to([col(i), -1.72, 0]) for i, v in enumerate(A)])
        arr_i = VGroup(*[T(i, 18, MUTED).next_to(c, DOWN, buff=0.06) for i, c in enumerate(arr)])
        self.play(FadeIn(arr), FadeIn(arr_i), run_time=0.6)
        self.say("Phần tử nhỏ nhất làm gốc, hai bên làm tiếp như vậy.", "talk")

        nodes, parent_of, depth = {}, {}, {}
        edges = VGroup()
        steps = []

        def plan(lo, hi, par, d):
            if lo > hi:
                return
            seg = A[lo:hi + 1]
            m = lo + seg.index(min(seg))
            steps.append((lo, hi, m, par, d))
            plan(lo, m - 1, m, d + 1)
            plan(m + 1, hi, m, d + 1)

        plan(0, n - 1, -1, 0)
        for s, (lo, hi, m, par, d) in enumerate(steps):
            box = box_around(list(arr[lo:hi + 1]), QUERY, buff=0.05, width=4)
            nd = VGroup(Circle(radius=rad).set_fill(CELL, 1).set_stroke(INK, 2.5),
                        T(A[m], 26, font=MONO)).move_to(pos(m, d))
            lab = T(f"[{m}]", 15, MUTED).next_to(nd, RIGHT, buff=0.04)
            nd.add(lab)
            anims = [ShowCreation(box)]
            if s < 4:
                self.play(*anims, run_time=0.3)
                msg = {0: "Cả mảng: min là 2, lấy vị trí 5 (bên trái).",
                       1: r"Bên trái $[0,4]$: min là 4, vị trí 1.",
                       2: r"$[0,0]$: một phần tử, thành lá.",
                       3: r"$[2,4]$: min là 4, vị trí 3."}[s]
                self.say(msg)
            else:
                self.play(*anims, run_time=0.18)
            new = [FadeIn(nd, scale=0.6), paint(arr[m], ANS, 4, 0.25)]
            if par != -1:
                e = Line(nodes[par].get_center(), nd.get_center(), buff=rad).set_stroke(MUTED, 3)
                edges.add(e)
                self.add(e)
                new.append(ShowCreation(e))
            self.play(*new, run_time=0.45 if s < 4 else 0.3)
            nodes[m], parent_of[m], depth[m] = nd, par, d
            if s < 4:
                self.wait(0.7)
            self.play(FadeOut(box), unpaint(arr[m]), run_time=0.15)
        self.bring_to_front(*nodes.values())
        self.wait(0.4)

        guides = VGroup(*[DashedLine(nodes[i].get_bottom(), arr[i].get_top()).set_stroke(MUTED, 1.5) for i in range(n)])
        self.say("Chiếu xuống: đúng thứ tự của mảng.", "happy")
        self.play(ShowCreation(guides), run_time=0.8)
        self.wait(1.4)
        self.say("Và cha luôn không lớn hơn con.")
        self.wait(1.8)
        self.play(FadeOut(guides), run_time=0.3)

        def up(i):
            p = [i]
            while parent_of[p[-1]] != -1:
                p.append(parent_of[p[-1]])
            return p

        def show(l, r):
            pl, pr = up(l), up(r)
            lca = next(x for x in pl if x in pr)
            seg = box_around(list(arr[l:r + 1]), QUERY, buff=0.05, width=4)
            self.say(rf"Truy vấn $[{l},{r}]$: đi từ hai nút lên đến khi gặp nhau.", "think", QUERY)
            self.play(ShowCreation(seg), nodes[l][0].animate.set_fill(dim(QUERY, 0.35), 1),
                      nodes[r][0].animate.set_fill(dim(QUERY, 0.35), 1), run_time=0.5)
            hl = VGroup()
            for path in (pl, pr):
                for a, b in zip(path, path[1:]):
                    if a == lca:
                        break
                    hl.add(Line(nodes[a].get_center(), nodes[b].get_center(), buff=rad).set_stroke(QUERY, 7))
            if len(hl):
                self.play(ShowCreation(hl), run_time=0.6)
            self.play(nodes[lca][0].animate.set_fill(dim(ANS, 0.5), 1).set_stroke(ANS, 5), paint(arr[lca], ANS, 5, 0.4), run_time=0.5)
            self.say(rf"Gặp nhau tại vị trí {lca}: đúng là $\mathrm{{RMQ}}({l},{r})$.", "happy", ANS)
            self.wait(1.8)
            self.play(FadeOut(seg), FadeOut(hl), nodes[l][0].animate.set_fill(CELL, 1), nodes[r][0].animate.set_fill(CELL, 1),
                      nodes[lca][0].animate.set_fill(CELL, 1).set_stroke(INK, 2.5), unpaint(arr[lca]), run_time=0.35)

        show(2, 4)
        show(4, 7)
        self.say("RMQ chính là LCA trên cây Cartesian.", None, SPARSE)
        self.done()


# ------------------------------------------------------------------ same shape blocks
def cart_parent(vals):
    parent = [-1] * len(vals)
    st = []
    for i, v in enumerate(vals):
        last = -1
        while st and vals[st[-1]] > v:
            last = st.pop()
        if last != -1:
            parent[last] = i
        if st:
            parent[i] = st[-1]
        st.append(i)
    return parent


def cart_depth(parent):
    out = []
    for i in range(len(parent)):
        k, p = 0, parent[i]
        while p != -1:
            k, p = k + 1, parent[p]
        out.append(k)
    return out


def rmq_rel(vals, u, v):
    seg = vals[u:v + 1]
    return u + seg.index(min(seg))


class M07_SameShape(Base):
    heading = "Khác giá trị, cùng đáp án"

    def construct(self):
        blocks = [[9, 4, 1, 6], [8, 5, 3, 7], [10, 2, 0, 4]]
        centers = [-4.4, 0, 4.4]
        rows_, trees = VGroup(), []
        for blk, cx in zip(blocks, centers):
            rows_.add(row(blk, 0.72, 0.05, 30).move_to([cx, 2.95, 0]))
        self.play(LaggedStart(*[FadeIn(r_) for r_ in rows_], lag_ratio=0.2), run_time=0.8)
        self.say("Ba khối, số hoàn toàn khác nhau.", "talk")
        self.wait(0.8)
        for blk, r_ in zip(blocks, rows_):
            par = cart_parent(blk)
            d = cart_depth(par)
            P = [np.array([r_[i].get_x(), 2.05 - d[i] * 0.62, 0]) for i in range(4)]
            ed = VGroup(*[Line(P[par[i]], P[i], buff=0.24).set_stroke(FH, 3) for i in range(4) if par[i] != -1])
            ns = VGroup(*[VGroup(Circle(radius=0.24).set_fill(CELL, 1).set_stroke(FH, 3), T(blk[i], 21, font=MONO)).move_to(P[i]) for i in range(4)])
            trees.append(VGroup(ed, ns))
        self.say("Nhưng cây Cartesian cùng một hình dạng.", "surprised", FH)
        self.play(*[FadeIn(t, shift=0.15 * DOWN) for t in trees], run_time=0.8)
        ghost = trees[0][0].copy().set_stroke(QUERY, 6)
        self.play(ghost.animate.move_to(trees[1][0]), run_time=0.6)
        self.play(ghost.animate.move_to(trees[2][0]), run_time=0.6)
        self.play(FadeOut(ghost), run_time=0.2)
        self.wait(0.5)

        def table(blk, cx):
            g = VGroup()
            cs = 0.44
            y0 = -0.5
            for u in range(4):
                for v in range(4):
                    p = np.array([cx + (v - 1.5) * cs, y0 - u * cs, 0])
                    if v >= u:
                        g.add(cell(rmq_rel(blk, u, v), cs - 0.03, 19, fill=dim(ANS, 0.16), stroke=ANS).move_to(p))
            hv = VGroup(*[T(v, 15, MUTED).move_to([cx + (v - 1.5) * cs, y0 + 0.33, 0]) for v in range(4)])
            hu = VGroup(*[T(u, 15, MUTED).move_to([cx - 1.5 * cs - 0.36, y0 - u * cs, 0]) for u in range(4)])
            return VGroup(g, hv, hu)

        tabs = [table(b_, cx) for b_, cx in zip(blocks, centers)]
        self.say("Bảng đáp án mọi đoạn: giống hệt nhau.", "happy", ANS)
        self.play(*[FadeIn(t) for t in tabs], run_time=0.9)
        eqs = VGroup(T("=", 54, ANS, weight="BOLD").move_to([-2.2, -1.15, 0]), T("=", 54, ANS, weight="BOLD").move_to([2.2, -1.15, 0]))
        self.play(FadeIn(eqs, scale=1.4), run_time=0.5)
        self.wait(1.8)
        self.say("Chỉ cần một bảng dùng chung.", "happy", ANS)
        self.wait(1.8)
        self.play(FadeOut(tabs[1]), FadeOut(tabs[2]), FadeOut(eqs),
                  tabs[0].animate.move_to([0, -1.25, 0]), run_time=0.7)
        arrows = VGroup(*[Arrow(trees[i].get_bottom(), tabs[0].get_top() + (i - 1) * 0.6 * RIGHT, buff=0.1, thickness=2.5).set_color(FH) for i in range(3)])
        self.play(*[GrowArrow(a) for a in arrows], run_time=0.6)
        self.wait(1.0)
        self.say("Cùng hình dạng cây ⇔ cùng mọi đáp án.", None, SPARSE)
        self.done()


# ------------------------------------------------------------------ Euler tour
class M08_EulerTour(Base):
    heading = "LCA → RMQ · duyệt Euler"

    def construct(self):
        P = {1: (0, 2.9), 2: (-2.6, 1.95), 3: (2.6, 1.95), 4: (-3.9, 1.0), 5: (-1.3, 1.0), 6: (1.3, 1.0), 7: (3.9, 1.0)}
        P = {k: np.array([x, y, 0]) for k, (x, y) in P.items()}
        depth = {1: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 2}
        par = {2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 3}
        rad = 0.34
        edges = VGroup(*[Line(P[par[c]], P[c], buff=rad).set_stroke(FAINT, 3) for c in par])
        nodes = {k: VGroup(Circle(radius=rad).set_fill(CELL, 1).set_stroke(INK, 2.5), T(k, 28, font=MONO)).move_to(P[k]) for k in P}
        dl = VGroup(*[T(f"độ sâu {d}", 20, MUTED).move_to([5.7, y, 0]) for d, y in ((0, 2.9), (1, 1.95), (2, 1.0))])
        self.play(ShowCreation(edges), *[FadeIn(nd) for nd in nodes.values()], FadeIn(dl), run_time=0.8)
        self.say("Đi vòng quanh cây, ghi nút và độ sâu.", "talk")
        E = [1, 2, 4, 2, 5, 2, 1, 3, 6, 3, 7, 3, 1]
        D = [depth[v] for v in E]
        cs, gap = 0.72, 0.06
        x0 = -(len(E) - 1) * (cs + gap) / 2 + 0.3
        ey, dy_, iy = -0.2, -1.0, -1.55
        lab_e = T("E", 28, SPARSE, font=MONO).move_to([x0 - 0.75, ey, 0])
        lab_d = T("D", 28, FH, font=MONO).move_to([x0 - 0.75, dy_, 0])
        dot = Dot(P[1], radius=0.12).set_fill(QUERY, 1)
        self.play(FadeIn(lab_e), FadeIn(lab_d), FadeIn(dot, scale=0.5), run_time=0.4)
        ecs, dcs = VGroup(), VGroup()
        for t, (v, d) in enumerate(zip(E, D)):
            x = x0 + t * (cs + gap)
            ec = cell(v, cs, 26, fill=dim(SPARSE, 0.14), stroke=SPARSE).move_to([x, ey, 0])
            dc = cell(d, cs, 26, fill=dim(FH, 0.14), stroke=FH).move_to([x, dy_, 0])
            ic = T(t, 15, MUTED).move_to([x, iy, 0])
            anims = [FadeIn(ec), FadeIn(dc), FadeIn(ic)]
            if t:
                anims.append(dot.animate.move_to(P[v]))
            self.play(*anims, run_time=0.33)
            ecs.add(ec)
            dcs.add(dc)
        self.play(FadeOut(dot), run_time=0.2)
        self.say(r"Dài $2n-1=13$; độ sâu kề nhau chênh $\pm 1$.", "happy", FH)
        self.wait(1.8)

        def query(u, v):
            fu, fv = E.index(u), E.index(v)
            lo, hi = min(fu, fv), max(fu, fv)
            seg = D[lo:hi + 1]
            m = lo + seg.index(min(seg))
            self.say(rf"$\mathrm{{LCA}}({u},{v})$: tìm min trên $D[{lo}..{hi}]$.", "think", QUERY)
            box = box_around(list(dcs[lo:hi + 1]), QUERY, width=5)
            self.play(nodes[u][0].animate.set_fill(dim(QUERY, 0.4), 1), nodes[v][0].animate.set_fill(dim(QUERY, 0.4), 1),
                      paint(ecs[fu], QUERY), paint(ecs[fv], QUERY), run_time=0.5)
            self.play(ShowCreation(box), run_time=0.4)
            self.wait(0.9)
            self.play(paint(dcs[m], ANS, 5, 0.45), run_time=0.4)
            self.play(paint(ecs[m], ANS, 5, 0.45), nodes[E[m]][0].animate.set_fill(dim(ANS, 0.5), 1).set_stroke(ANS, 5), run_time=0.5)
            self.say(rf"Min tại vị trí {m}: $\mathrm{{LCA}}({u},{v})={E[m]}$.", "happy", ANS)
            self.wait(2.0)
            self.play(FadeOut(box), nodes[u][0].animate.set_fill(CELL, 1), nodes[v][0].animate.set_fill(CELL, 1),
                      nodes[E[m]][0].animate.set_fill(CELL, 1).set_stroke(INK, 2.5),
                      ecs[fu][0].animate.set_fill(dim(SPARSE, 0.14), 1).set_stroke(SPARSE, 2.5),
                      ecs[fv][0].animate.set_fill(dim(SPARSE, 0.14), 1).set_stroke(SPARSE, 2.5),
                      ecs[m][0].animate.set_fill(dim(SPARSE, 0.14), 1).set_stroke(SPARSE, 2.5),
                      dcs[m][0].animate.set_fill(dim(FH, 0.14), 1).set_stroke(FH, 2.5), run_time=0.35)

        query(4, 5)
        query(4, 6)
        self.say("Giữa hai nút, DFS qua LCA nhưng không lên cao hơn.", None, SPARSE)
        self.done(2.8)


# ------------------------------------------------------------------ sliding window
class M09_SlidingWindow(Base):
    heading = "Mở rộng · cửa sổ trượt với deque"

    def construct(self):
        k, n = 3, len(A)
        r = row(A, 0.92, 0.08, 36).move_to([0, 2.15, 0])
        idx = indices(r, 19)
        self.play(FadeIn(r), FadeIn(idx), run_time=0.5)
        self.say("Chuyến đi 3 ngày: min của mọi cửa sổ dài 3.", "talk")
        l1 = T("deque", 26, SQRT).move_to([-5.55, 0.25, 0])
        l2 = T("kết quả", 26, ANS).move_to([-5.55, -1.15, 0])
        self.play(FadeIn(l1), FadeIn(l2), run_time=0.3)
        x0 = -4.2
        dq, boxes, win, outs = [], [], None, VGroup()

        def dcell(i):
            g = VGroup(cell(A[i], 0.84, 32, fill=dim(SQRT, 0.2), stroke=SQRT), T(f"i={i}", 16, MUTED))
            g[1].next_to(g[0], DOWN, buff=0.05)
            return g

        for i in range(n):
            anims = []
            while dq and A[dq[-1]] > A[i]:
                dq.pop()
                anims.append(FadeOut(boxes.pop(), shift=0.35 * DOWN))
            dq.append(i)
            nb = dcell(i).move_to([x0 + (len(dq) - 1) * 1.05, 0.15, 0])
            boxes.append(nb)
            anims.append(FadeIn(nb, shift=0.25 * LEFT))
            if dq[0] <= i - k:
                dq.pop(0)
                anims.append(FadeOut(boxes.pop(0), shift=0.35 * LEFT))
            nw = box_around(list(r[max(0, i - k + 1):i + 1]), QUERY, buff=0.08, width=5)
            anims.append(ReplacementTransform(win, nw) if win is not None else ShowCreation(nw))
            win = nw
            self.play(*anims, run_time=0.55)
            mv = [b.animate.move_to([x0 + j * 1.05, 0.15, 0]) for j, b in enumerate(boxes)]
            self.play(*mv, run_time=0.25)
            if i >= k - 1:
                oc = cell(A[dq[0]], 0.84, 32, fill=dim(ANS, 0.25), stroke=ANS).move_to([x0 + (i - k + 1) * 1.05, -1.15, 0])
                ghost = boxes[0][0].copy()
                self.play(ghost.animate.move_to(oc), run_time=0.35)
                self.remove(ghost)
                self.add(oc)
                outs.add(oc)
            if i in (1, 5):
                msg = {1: "Deque tăng dần: phần tử đầu là min.",
                       5: "Số 2 đẩy các số lớn hơn ra khỏi deque."}[i]
                self.say(msg, "happy" if i == 5 else None)
                self.wait(1.3)
            self.wait(0.2)
        self.say(r"Mỗi vị trí vào, ra tối đa một lần: $O(n)$.", "happy", ANS)
        self.wait(1.8)
        self.say("Chỉ dùng khi cửa sổ trượt tuần tự.", None, SQRT)
        self.done()
