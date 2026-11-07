#!/usr/bin/env python3
"""Generate the π narrator's outline once, so the Manim scenes and the web deck draw the same character.

Coordinates are SVG-like: 220 x 250 box, y grows downward.
"""
import json
from pathlib import Path

import numpy as np

# The two ends of the bar are the arms: they rotate around a shoulder hidden inside the bar.
BODY = [
    # middle of the bar
    ([(66, 55), (110, 50), (156, 52)], [26, 27, 27]),
    # left leg
    ([(86, 54), (80, 110), (65, 172), (45, 234)], [24, 26, 27, 25]),
    # right leg, curling out at the foot
    ([(146, 54), (146, 110), (150, 172), (160, 218), (176, 238)], [24, 26, 27, 26, 22]),
]
ARM_L = ([(15, 116), (19, 90), (36, 68), (62, 57), (80, 54)], [11, 15, 20, 24, 25])
ARM_R = ([(142, 51), (170, 55), (190, 63), (205, 72)], [27, 26, 25, 24])
SHOULDER_L, SHOULDER_R = (76, 54), (146, 52)


def catmull(points, per=14):
    p = np.array([points[0], *points, points[-1]], float)
    out = []
    for i in range(1, len(p) - 2):
        for t in np.linspace(0, 1, per, endpoint=False):
            out.append(0.5 * (2 * p[i] + (p[i + 1] - p[i - 1]) * t
                              + (2 * p[i - 1] - 5 * p[i] + 4 * p[i + 1] - p[i + 2]) * t * t
                              + (3 * p[i] - p[i - 1] - 3 * p[i + 1] + p[i + 2]) * t ** 3))
    out.append(p[-2])
    return np.array(out)


def outline(points, widths):
    c = catmull(points)
    w = np.interp(np.linspace(0, 1, len(c)), np.linspace(0, 1, len(widths)), widths)
    tan = np.gradient(c, axis=0)
    tan /= np.linalg.norm(tan, axis=1, keepdims=True)
    nor = np.stack([-tan[:, 1], tan[:, 0]], axis=1)
    left, right = c + nor * w[:, None] / 2, c - nor * w[:, None] / 2


    a_end = np.arctan2(nor[-1][1], nor[-1][0])
    a_start = np.arctan2(-nor[0][1], -nor[0][0])
    poly = [*left,
            *[c[-1] + w[-1] / 2 * np.array([np.cos(a_end - t), np.sin(a_end - t)]) for t in np.linspace(0, np.pi, 8)[1:-1]],
            *right[::-1],
            *[c[0] + w[0] / 2 * np.array([np.cos(a_start - t), np.sin(a_start - t)]) for t in np.linspace(0, np.pi, 8)[1:-1]]]
    return np.round(np.array(poly), 1).tolist()


shape = {
    "body": [outline(*s) for s in BODY],
    "armL": outline(*ARM_L), "armR": outline(*ARM_R),
    "shoulderL": SHOULDER_L, "shoulderR": SHOULDER_R,
    "eyes": [{"cx": 96, "cy": 30, "rx": 24, "ry": 26}, {"cx": 140, "cy": 28, "rx": 25, "ry": 27}],
    "pupil": 10,
    "mouth": {"cx": 120, "cy": 52},
    "moods": {  # half-width, top bulge, bottom bulge (y down)
        "neutral": [11, -2.5, 3.0], "happy": [14, 2.0, 10.0], "think": [10, -2.5, 2.5],
        "surprised": [7, -7.0, 7.0], "worried": [11, -8.0, -2.0], "talk": [9, -4.0, 6.0],
    },
}
Path(__file__).with_name("pi_shape.json").write_text(json.dumps(shape))
print([len(p) for p in shape["body"]], len(shape["armL"]), len(shape["armR"]))
