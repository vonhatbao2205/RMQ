"""Xuất kịch bản thuyết trình (speaker notes) từ slides/index.html ra Markdown.

Chạy:  python3 seminar/tools/export_notes.py
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "slides" / "index.html"
OUT = ROOT / "kich_ban_thuyet_trinh.md"


def plain(fragment: str) -> str:
    text = re.sub(r"<[^>]+>", " ", fragment)
    text = html.unescape(text)
    text = re.sub(r"\\\((.*?)\\\)", r"\1", text)          # inline math → raw TeX
    text = text.replace("\\langle", "⟨").replace("\\rangle", "⟩").replace("\\log", "log")
    return re.sub(r"\s+", " ", text).strip()


def main() -> None:
    src = SRC.read_text(encoding="utf-8")
    body = src.split('<div class="slides">', 1)[1]
    sections = re.findall(r"<section\b([^>]*)>(.*?)</section>", body, re.S)
    lines = [
        "# Kịch bản thuyết trình — Range Minimum Query",
        "",
        "Sinh tự động từ speaker notes trong `slides/index.html` (nhấn **S** khi trình chiếu để xem cùng đồng hồ).",
        "Mốc thời gian [mm:ss] là mục tiêu cho bản 40 phút; slide ghi **[30′ bỏ qua]** có thể lược khi chỉ có 30 phút.",
        "",
    ]
    for idx, (attrs, inner) in enumerate(sections, start=1):
        sec = re.search(r'data-section="([^"]*)"', attrs)
        kicker = re.search(r'<div class="kicker"[^>]*>(.*?)</div>', inner, re.S)
        title = re.search(r"<h[12][^>]*>(.*?)</h[12]>", inner, re.S)
        notes = re.search(r'<aside class="notes">(.*?)</aside>', inner, re.S)
        head = plain(title.group(1)) if title else plain(kicker.group(1)) if kicker else "(slide)"
        lines.append(f"## Slide {idx} · {head}")
        meta = [plain(sec.group(1))] if sec and sec.group(1) else []
        if kicker:
            meta.append(plain(kicker.group(1)))
        if meta:
            lines.append(f"*{' — '.join(meta)}*")
        lines.append("")
        if notes:
            for para in html.unescape(notes.group(1)).strip().splitlines():
                para = para.strip()
                if para:
                    lines.append(para)
                    lines.append("")
        else:
            lines.append("_(không có ghi chú)_\n")
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {OUT} ({len(sections)} slides)")


if __name__ == "__main__":
    main()
