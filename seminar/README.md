# Seminar RMQ — slide, video, benchmark

Bộ tài liệu cho buổi seminar **Range Minimum Query: từ O(n) xuống O(1)**, dài 40 phút (có lối rút gọn còn 30 phút).

## Trình chiếu

```bash
cd seminar/slides && ./present.sh        # mở http://localhost:8000/index.html
```

Deck chạy **offline hoàn toàn**: reveal.js, KaTeX, font và video đều nằm trong `slides/`. Có thể chép nguyên thư mục `slides/` sang máy khác để chiếu. Mở bằng Chrome, Edge hoặc Firefox bản mới.

| Phím | Tác dụng |
|---|---|
| → / Space, ← | slide / fragment tiếp theo, quay lại |
| **S** | speaker view: ghi chú, đồng hồ, slide kế tiếp |
| **V** | phát / tạm dừng video manim trên slide hiện tại (hoặc bấm vào video) |
| **R** | phát lại video từ đầu |
| **[** / **]** | giảm / tăng tốc độ video (0,5× → 2×) |
| **O** hoặc Esc | xem tổng quan các slide |
| **F** | toàn màn hình |
| Alt + click | phóng to một vùng |

- **Font:**
  - Tiêu đề dùng Source Serif 4, nội dung dùng Source Sans 3.
  - Toán dùng KaTeX (Computer Modern), code dùng Source Code Pro.
  - Muốn thử bộ font khác, thêm tham số vào URL: `?font=inter`, `?font=plex`, `?font=jakarta`, `?font=lexend` hoặc `?font=bevietnam`.
  - Trang `slides/font-specimen.html` so sánh các phương án.
- **Bản PDF dự phòng:** `slides/rmq_seminar.pdf`. Các slide có video hiển thị khung hình cuối của video.
- **Thông tin nhóm:** thay các chỗ `[Thành viên …]`, `[Tên giảng viên]`, `[dd/mm/2026]` ở slide đầu (`slides/index.html`).

## Nội dung

| Phần | Slide | Nội dung |
|---|---|---|
| 01 Đặt vấn đề | 3–7 | động lực, định nghĩa (argmin, tie-break), ⟨P, Q⟩, vì sao prefix-min không đủ |
| 02 Cơ sở | 8–15 | duyệt, bảng mọi đoạn, chia khối √n, Segment Tree, Sparse Table (chứng minh, phân tích, code) |
| 03 Áp dụng | 16–20 | demo tương tác Sparse Table, CSES 1647/1649, 6 câu hỏi chọn cấu trúc, bảng so sánh CTDL |
| 04 Tối ưu & độ phức tạp | 21–41 | chia khối, cây Cartesian, Fischer–Heun, Euler tour/±1 RMQ, RMQ tuyến tính bitmask, cận dưới, lịch sử, benchmark tự đo (6 biểu đồ + demo), đối chiếu số liệu công bố |
| 05 Ứng dụng & bài tập | 42–50 | mở rộng (lazy, cửa sổ trượt, offline, 2D, Disjoint ST, GPU), LCA, LCE/suffix array, truy hồi tài liệu, phản ví dụ path-min, bài tập 5 mức |
| Kết luận, tài liệu | 51–54 | 4 kết luận, 28 tài liệu tham khảo, hỏi đáp |
| Phụ lục | 55–59 | FAQ phản biện, lazy, 2D, offline / Disjoint ST, tái lập |

Kịch bản lời nói kèm mốc thời gian nằm trong `kich_ban_thuyet_trinh.md`, sinh từ speaker notes bằng `python3 tools/export_notes.py`. Báo cáo nghiên cứu đầy đủ (đã kiểm chứng trích dẫn, 43 bài tập) nằm ở `../reports/Paper và ứng dụng thuật toán RMQ.md`.

## Thư mục

```
seminar/
├── slides/        deck reveal.js: index.html, css/, js/, figures/*.svg, media/*.mp4, vendor/ (offline)
├── manim/         rmq_scenes.py (11 scene ManimGL), render_all.sh, env.sh, fonts/
├── benchmark/     rmq_bench.cpp, results_raw.csv, results_summary_*.csv, environment.json
├── figures/       make_figures.py (matplotlib → slides/figures)
└── tools/         export_notes.py, check_slide_code.py, make_bench_data.py
```

## Tái lập

```bash
# 1. Benchmark (~1 phút; tự kiểm tra tính đúng trước khi đo)
cd seminar/benchmark
g++ -O3 -DNDEBUG -std=c++17 -march=native -Wall -Wextra rmq_bench.cpp -o rmq_bench
taskset -c 2 ./rmq_bench all > results_raw.csv 2> run.log

# 2. Biểu đồ → slides/figures/*.svg và dữ liệu demo → slides/js/bench-data.js
#    (cần venv của dự án: /home/bao/Projects/RMQ/.venv)
python seminar/figures/make_figures.py
python seminar/tools/make_bench_data.py

# 3. Video manim (3b1b/manim = ManimGL 1.7.2) → slides/media/*.mp4
cd seminar/manim && ./render_all.sh --hd ../slides/media      # -l để xem nhanh 480p

# 4. Kiểm thử code trên slide
python3 seminar/tools/check_slide_code.py
```

Ghi chú môi trường (NixOS):
- `manim/env.sh` nạp venv và đặt `LD_LIBRARY_PATH` cho OpenGL/X11 (libglvnd, libX11…) để ManimGL chạy được.
- `manimpango` được build từ source trong `nix-shell -p pkg-config pango cairo …`.
- Phụ đề có công thức trong video dùng XeLaTeX (template `rmqvi` trong `rmq_scenes.py`): chữ Source Sans 3, toán Computer Modern.

Benchmark là microbenchmark trên một máy: i5-13500HX, GCC 15.3, ghim 1 P-core, median của 5 lần. Bộ nhớ đo là payload của các mảng phụ, không phải RSS. Không trộn các số này với số liệu trong paper.
