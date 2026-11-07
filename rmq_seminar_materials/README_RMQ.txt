# RMQ seminar research and benchmark

Ngày thực hiện: 31/10/2026.

Mở rmq_seminar_research_vi.md để đọc tài liệu tiếng Việt, nguồn video/paper,
khung seminar 30 và 40 phút, ví dụ, chứng minh và phân tích benchmark.

Tệp kèm theo:
- rmq_benchmark.cpp: benchmark min-value tự viết (không phải argmin).
- rmq_benchmark_raw.csv: 220 lượt chạy; 5 lần cho mỗi cấu hình.
- rmq_benchmark_summary.csv: 44 cấu hình, median/IQR và bộ nhớ payload.
- rmq_benchmark.png: biểu đồ có thể dùng cho slide.
- benchmark_environment.json: máy, compiler, cờ biên dịch và cách tính bộ nhớ.
- rmq_benchmark_run.log: xác nhận kiểm tra tính đúng đắn và case đã chạy.
- summarize_benchmark.py: tổng hợp CSV và tạo biểu đồ; cần numpy, matplotlib.

Cách chạy lại trên Linux:

    g++ -O3 -DNDEBUG -std=c++17 -march=native -Wall -Wextra rmq_benchmark.cpp -o rmq_benchmark
    ./rmq_benchmark > rmq_benchmark_raw.csv 2> rmq_benchmark_run.log
    python3 summarize_benchmark.py

Có thể ghim một CPU được phép bằng taskset. Biên dịch trên chính máy sẽ chạy.
Kết quả thay đổi theo máy/compiler/tải hệ thống. Đây là microbenchmark trên
một môi trường ảo hóa, không đo I/O hoặc toàn bộ ứng dụng suffix array/LCA.
Bộ nhớ là phần mảng số phụ ngoài input A, không phải RSS hay peak build.

Không đánh đồng số đo tự chạy với kết quả trong paper. Các thí nghiệm chưa
chạy (Fischer–Heun, succinct, 2D, dữ liệu LCP thật...) được ghi rõ trong báo cáo.

Benchmark kiểm tra 915.200 khoảng nhỏ và mixed operations, đối chiếu từng
query của các case static với scan trước khi đo; mọi checksum timed khớp.
Mã demo trong báo cáo được biên dịch và kiểm tra 3.784 đoạn bổ sung.
