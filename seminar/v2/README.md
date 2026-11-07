# Seminar RMQ, bản 2: câu chuyện tấm vé rẻ nhất

Deck trình bày Range Minimum Query theo phong cách video giải thích toán học: nền đen, nhân vật π dẫn chuyện, video dựng bằng manim và các ví dụ tương tác chạy thật. Mỗi slide có lời dẫn của Pi và giải thích đủ để người xem lại sau seminar hiểu được mà không cần người trình bày.

## Trình chiếu

Mở trực tiếp `deck/dist/index.html` bằng Chrome, Edge hoặc Firefox, hoặc chạy `./present.sh` rồi vào `http://localhost:8000`. Deck chạy offline hoàn toàn: font, công thức và script nằm trong một file HTML, video nằm trong `deck/dist/media/`. Muốn chép sang máy khác thì chép cả thư mục `deck/dist/`.

| Phím | Tác dụng |
|---|---|
| → hoặc Space, ← | bước hoặc slide tiếp theo, quay lại |
| A | tự chạy, dành cho người xem lại một mình |
| T | bản rút gọn: bỏ qua các slide "có thể lướt" |
| O hoặc Esc | tổng quan, nhảy đến slide bất kỳ, xem thời lượng |
| N | ghi chú cho người trình bày |
| F | toàn màn hình |
| V (hoặc K), J, L, R, [ và ] | video: dừng hoặc phát, lùi 5 giây, tới 5 giây, phát lại, đổi tốc độ. Rê chuột lên video để hiện thanh tua |

Tên thành viên, MSSV, GVHD và ngày trình bày nằm ở slide đầu, `deck/src/slides/00_story.html`. Sửa xong chạy lại `node deck/build.mjs`.

## Cấu trúc nội dung

| Phần | Nội dung |
|---|---|
| Câu chuyện | Pi tìm vé rẻ nhất, người dùng hỏi nhiều khoảng ngày, chuyển sang góc nhìn lập trình viên, giá vé có đổi không |
| Bài toán | định nghĩa, chi phí tiền xử lý và truy vấn, vì sao prefix-min không đủ |
| Cơ sở thuật toán | quét, bảng mọi đoạn, chia khối √n, Segment Tree, Sparse Table (xây, truy vấn, chứng minh, code) |
| Áp dụng | giải bài vé, khi giá đổi, CSES 1647 và 1649, quy trình chọn cấu trúc, bảng so sánh |
| Tối ưu | chia khối, cây Cartesian, chứng minh RMQ = LCA, số Catalan, mã loại bằng ngăn xếp, bảng dùng chung, vì sao b = ¼·log₂n, Euler và ±1 RMQ |
| Benchmark | phương pháp đo, 5 cấu trúc theo n, độ dài đoạn, số truy vấn, tỉ lệ cập nhật, đối chiếu paper |
| Thực tế | chuỗi thời gian (OM³), DNA (Suffix Array + LCP), tìm kiếm tài liệu (Muthukrishnan), LCA, erosion, mở rộng |
| Kết | bài tập, bốn điều mang về, tài liệu tham khảo, hỏi đáp |

Đã bỏ khỏi deck theo yêu cầu: RMQ bitmask, offline RMQ với Arpa's trick, Sqrt Tree, cận dưới cell-probe, RMQ song song, GPU, ray tracing. Kịch bản lời nói đầy đủ nằm trong `kich_ban.md`.

## Thư mục

```
seminar/v2/
├── deck/
│   ├── src/         slides/*.html, deck.css, engine.js, widgets.js, pi.js, bench-data.js
│   ├── build.mjs    pre-render KaTeX, inline font/CSS/JS
│   └── dist/        index.html (chiếu offline), artifact.html (bản publish), media/*.mp4
├── manim/           scenes.py (9 cảnh ManimGL), pi_shape.py, env.sh, render_all.sh
├── benchmark/       rmq_bench.cpp, results_raw.csv, summarize.py, environment.json
├── tools/           audit.mjs, interact.mjs, check_code.py, export_script.mjs
└── kich_ban.md      kịch bản, sinh từ slide
```

Thư mục `seminar/` cũ (`seminar/slides`, `seminar/manim`, `seminar/benchmark`) được giữ nguyên, không bị sửa.

## Tái lập

```bash
cd seminar/v2

# Benchmark: khoảng 1,5 phút, tự kiểm tra tính đúng trước khi đo
cd benchmark
g++ -O3 -DNDEBUG -std=c++17 -march=native -Wall -Wextra rmq_bench.cpp -o rmq_bench
taskset -c 2 ./rmq_bench all > results_raw.csv 2> run.log
python3 summarize.py            # sinh deck/src/bench-data.js
cd ..

# Video: 3b1b/manim (ManimGL 1.7.2), khoảng 5 phút. Render 60 fps rồi kéo dài còn 0,5x tốc độ,
# nên video chậm mà vẫn mượt 30 fps. Đặt SLOW=1 để giữ tốc độ gốc.
./manim/render_all.sh --hd      # ghi vào deck/dist/media

# Deck và kịch bản
node deck/build.mjs
node tools/export_script.mjs

# Kiểm tra
python3 tools/check_code.py     # biên dịch code trên slide, so với duyệt trâu
node tools/interact.mjs         # bấm nút, kéo thanh trượt, phát video, so đáp án với duyệt trâu
node tools/audit.mjs /tmp/audit --shots   # đi qua mọi bước trong Chrome, báo lỗi JS và tràn bố cục
```

`build.mjs` lấy KaTeX và font từ `seminar/slides/node_modules`. `manim/env.sh` tự dò thư viện OpenGL, X11, Pango trong Nix store, nên không còn hỏng sau khi dọn store như `seminar/manim/env.sh`.

## Benchmark

Cài đặt Fischer–Heun trong `benchmark/rmq_bench.cpp` đúng với cấu trúc trình bày trên slide: khối ⌊¼·log₂n⌋, Sparse Table trên đại diện, bảng đáp án dùng chung theo chuỗi push/pop của ngăn xếp. Bản cũ đo cấu trúc bitmask nên toàn bộ số liệu đã được đo lại trên cùng máy: i5-13500HX, GCC 15.3, ghim một P-core, trung vị 5 lần. Bộ nhớ là kích thước các mảng phụ, không phải RSS. Đây là microbenchmark trên một laptop, không gộp với số liệu của các paper.
