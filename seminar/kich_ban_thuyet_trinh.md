# Kịch bản thuyết trình — Range Minimum Query

Sinh tự động từ speaker notes trong `slides/index.html` (nhấn **S** khi trình chiếu để xem cùng đồng hồ).
Mốc thời gian [mm:ss] là mục tiêu cho bản 40 phút; slide ghi **[30′ bỏ qua]** có thể lược khi chỉ có 30 phút.

## Slide 1 · Range Minimum Query từ O(n) xuống O(1)
*Mở đầu*

[0:00 – 0:40] Chào thầy/cô và các bạn. Nhóm em trình bày về Range Minimum Query — RMQ.

Câu hỏi xuyên suốt: với một mảng cố định và rất nhiều câu hỏi "phần tử nhỏ nhất trong đoạn [l, r]", ta tiền xử lý thế nào để trả lời nhanh — và trong thực tế, nên chọn cấu trúc nào.

Hình bên phải: mảng ví dụ dùng xuyên suốt A = [5, 2, 6, 3, 1, 7, 4, 8]; truy vấn (2, 7) có đáp án là vị trí 5, giá trị 1.

Phím tắt khi trình chiếu: S = speaker view, V = phát/dừng video, R = phát lại, [ ] = chỉnh tốc độ video, O = tổng quan slide.

## Slide 2 · Năm phần, đi từ bài toán đến thực tế
*Mở đầu — Lộ trình · 40 phút*

[0:40 – 1:20] Năm phần đúng theo yêu cầu seminar. Điểm khác so với các bài trình bày RMQ thông thường: (1) có chứng minh và phân tích cả thời gian lẫn bộ nhớ, (2) có tối ưu đến ⟨O(n), O(1)⟩ và cận dưới, (3) có benchmark tự đo trên máy nhóm, đối chiếu với số liệu công bố, (4) ứng dụng có đối chiếu lời giải khác và phản ví dụ.

Bản 30 phút: bỏ các slide đánh dấu [30′ bỏ qua] trong ghi chú.

## Slide 3 · Đặt vấn đề
*01 · Đặt vấn đề*

[1:20] Chuyển sang phần 1.

## Slide 4 · Cùng một mảng — rất nhiều câu hỏi “nhỏ nhất trong đoạn”
*01 · Đặt vấn đề — Động lực*

[1:25 – 2:30] Ba bối cảnh: chuỗi thời gian (ví dụ minh họa tự xây dựng), cây (LCA) và chuỗi (LCE). Hai bối cảnh sau là ứng dụng "thật": RMQ là thành phần trong thuật toán LCA và trong chỉ mục chuỗi (sẽ quay lại ở phần 5).

Thông điệp: dữ liệu tĩnh + nhiều truy vấn ⇒ tiền xử lý.

## Slide 5 · Quét từng đoạn: đúng, nhưng lặp lại công việc
*01 · Đặt vấn đề — Cách ngây thơ*

[2:30 – 3:00] Video tự chạy (≈17 s). Nhấn V để tạm dừng, R để phát lại.

Ý chính: một truy vấn đọc r − l + 1 phần tử ⇒ O(n) xấu nhất; q truy vấn ⇒ O(n·q). Với n = q = 10⁶ là khoảng 10¹² phép so sánh.

## Slide 6 · Range Minimum Query (RMQ)
*01 · Đặt vấn đề — Phát biểu bài toán*

[3:00 – 3:40] Định nghĩa chuẩn trong các paper: RMQ trả về chỉ số (argmin) — cần cho LCA và cho cấu trúc nén. Bài lập trình thường hỏi giá trị: lấy A[vị trí].

Quy ước khi trùng giá trị: chọn vị trí trái nhất, nhất quán ở mọi bước (xây bảng, cây Cartesian, ghép đáp án).

Ba trục biến thể quyết định cấu trúc dữ liệu — ta sẽ quay lại ở slide "chọn cấu trúc".

## Slide 7 · Ký hiệu ⟨tiền xử lý, truy vấn⟩ và tổng chi phí
*01 · Đặt vấn đề — Đo chi phí thế nào?*

[3:40 – 4:20] Luôn báo cáo đủ ba con số và tổng T(q) — query O(1) chưa chắc tổng nhỏ nhất (phần benchmark sẽ cho thấy).

Câu hỏi hay gặp: "sao không dùng prefix-min?" — vì min không khả nghịch: phản ví dụ X, Y có cùng prefix-min nhưng min đoạn [2,2] khác nhau.

## Slide 8 · Cơ sở thuật toán
*02 · Cơ sở thuật toán*

[4:20] Phần 2.

## Slide 9 · Không tiền xử lý vs. lưu sẵn mọi đáp án
*02 · Cơ sở thuật toán — Hai thái cực*

[4:30 – 5:30] Hai thái cực của phổ đánh đổi. Lưu ý bảng mọi đoạn phải xây bằng quy hoạch động (mỗi ô O(1)); nếu quét lại từng đoạn sẽ thành O(n³).

Con số 2 TB: 5·10¹¹ ô × 4 byte. Dẫn sang các phương án trung gian.

## Slide 10 · Chia khối √n: tóm tắt từng khối
*02 · Cơ sở thuật toán — Phương án trung gian 1*

[5:30 – 6:10] [30′ bỏ qua] Khối kích thước b = √n. Truy vấn gồm tối đa hai mảnh lẻ (≤ 2b) và các khối trọn vẹn (≤ n/b) ⇒ O(b + n/b) nhỏ nhất khi b = √n.

Gieo ý: "tóm tắt từng khối" sẽ quay lại ở Fischer–Heun, nhưng khi đó dùng Sparse Table cho tầng trên và khối nhỏ cỡ log n.

## Slide 11 · Segment Tree: chia đôi đệ quy, hỗ trợ cập nhật
*02 · Cơ sở thuật toán — Phương án trung gian 2*

[6:10 – 7:00] Video ≈20 s: xây từ dưới lên, truy vấn [2, 7] tách thành 4 nút [2], [3,4], [5,6], [7] → min(2,3,1,4) = 1; cập nhật A[5] := 9 sửa đường lên gốc.

Segment Tree là lựa chọn mặc định khi có cập nhật. Dynamic RMQ có cận dưới Θ(log n / log log n) mỗi thao tác (sẽ nói ở phần 4), nên O(log n) đã rất gần tối ưu.

## Slide 12 · Sparse Table: chỉ lưu các đoạn dài lũy thừa của 2
*02 · Cơ sở thuật toán — Ý tưởng then chốt*

[7:00 – 8:00] Thay vì lưu n² đoạn, chỉ lưu các đoạn có độ dài 1, 2, 4, 8, … Mỗi đoạn dài 2^k là hợp của hai đoạn dài 2^(k−1) ⇒ quy hoạch động theo k.

Video ≈19 s chạy đúng mảng ví dụ. Số ô: hàng k có n − 2^k + 1 ô, tổng Θ(n log n).

## Slide 13 · Hai đoạn chồng lấn phủ kín [l, r]
*02 · Cơ sở thuật toán — Truy vấn O(1)*

[8:00 – 9:10] Video ≈17 s. Với L = 6 thì k = 2, hai đoạn [2,5] và [4,7] chồng lên [4,5]. Đây là chỗ nhiều nhóm hay nói lướt: tính đúng dựa trên tính LŨY ĐẲNG (idempotent) cùng tính kết hợp của min.

Dùng được: min, max, gcd, AND, OR. Không dùng được: tổng (10 + 18 = 28 ≠ 21), XOR, nhân ma trận.

## Slide 14 · Tính đúng, thời gian và bộ nhớ của Sparse Table
*02 · Cơ sở thuật toán — Chứng minh & phân tích*

[9:10 – 10:30] Chứng minh ngắn gọn, đủ chặt: hai đoạn nằm trong [l, r] và hợp của chúng không để hở vì 2·2^k > L.

Phân tích: O(1) truy vấn chỉ đúng khi tính ⌊log₂⌋ trong O(1) — đừng dùng log2() số thực (lỗi làm tròn).

Bộ nhớ là điểm yếu: 80 MB ở n = 10⁶ — động lực cho phần tối ưu.

## Slide 15 · Sparse Table trong C++17 — 15 dòng
*02 · Cơ sở thuật toán — Cài đặt*

[10:30 – 11:30] Nhấn → để tô từng khối dòng: (1) cấu trúc, (2) xây bảng, (3) truy vấn.

__lg(x) của GCC = 31 − __builtin_clz(x). Mã trên được biên dịch và kiểm thử trong thư mục seminar/benchmark (self-test đối chiếu mọi đoạn).

## Slide 16 · Áp dụng giải bài toán
*03 · Áp dụng giải bài toán*

[11:30] Phần 3.

## Slide 17 · Sparse Table Explorer — chọn l, r hoặc bấm một ô
*03 · Áp dụng giải bài toán — Demo tương tác*

[11:40 – 13:00] Demo trực tiếp (chạy offline). Kéo thanh l, r: hàng A tô xanh dương đoạn 1, cam đoạn 2, tím phần giao; hai ô viền đậm trong hàng k là hai ô được tra; ô xanh lá là vị trí min.

Gợi ý: (2,7) → k = 2; thử (1,12) → k = 3, giao lớn; thử l = r → k = 0. Bấm một ô của bảng để xem đoạn mà ô đó đại diện. Sau khi kéo thanh trượt, bấm ra ngoài để phím mũi tên chuyển slide trở lại.

## Slide 18 · CSES 1647 · Static Range Minimum Queries
*03 · Áp dụng giải bài toán — Bài toán mẫu*

[13:00 – 14:10] Áp dụng trực tiếp: đọc mảng, xây bảng, trả lời. Đổi chỉ số 1-based của đề sang 0-based.

Biến thể cùng họ: VNOJ NKLINEUP (max − min trên đoạn) → hai Sparse Table cho max và min.

Thông điệp: thay đổi một điều kiện (có cập nhật) làm đổi hẳn cấu trúc phù hợp.

## Slide 19 · Sáu câu hỏi trước khi chọn cấu trúc dữ liệu
*03 · Áp dụng giải bài toán — Chọn cấu trúc theo điều kiện bài toán*

[14:10 – 15:20] Đi lần lượt 6 câu hỏi. Đây là phần "so sánh với CTDL khác theo điều kiện" mà nhiều nhóm bỏ sót.

Câu 1: dynamic → Segment Tree (Dima & Ceterchi 2015 có biến thể hai cây Fenwick giải được RMQ động — đừng nói tuyệt đối "Fenwick không làm được min").

Câu 2: cửa sổ trượt là trường hợp đặc biệt có lời giải O(n) riêng (sẽ có video ở phần 5).

Câu 3: offline — backup slide.

Câu 4–6: phụ thuộc số truy vấn, độ dài đoạn, bộ nhớ — chính là các trục benchmark ở phần 4.

## Slide 20 · Bảng tổng hợp: thời gian, cập nhật, bộ nhớ, phép toán
*03 · Áp dụng giải bài toán — So sánh với các cấu trúc dữ liệu khác*

[15:20 – 16:30] Đọc theo cột: không có dòng nào thắng mọi cột. Sparse Table: O(1) nhưng tốn n log n và không cập nhật. Fischer–Heun/bitmask: tối ưu cả tiền xử lý lẫn truy vấn — nội dung của phần 4.

Lưu ý thuật ngữ: "bộ nhớ O(n)" là O(n) word = O(n log n) bit; dòng cuối mới thực sự tính bằng bit.

## Slide 21 · Tối ưu hóa & phân tích độ phức tạp
*04 · Tối ưu & độ phức tạp*

[16:30] Phần 4 — phần trọng tâm về phân tích.

## Slide 22 · Có đạt được ⟨ O(n), O(1) ⟩ không?
*04 · Tối ưu & độ phức tạp — Mục tiêu*

[16:40 – 17:30] Biểu đồ mô hình (bỏ hằng số) tại n = 10⁶: trục x chi phí tiền xử lý, trục y chi phí một truy vấn. Góc dưới-trái là lý tưởng. Mũi tên: từ Sparse Table sang ⟨O(n), O(1)⟩.

Mẹo kinh điển: (n / log n) · log(n / log n) = O(n) ⇒ Sparse Table trên n / log n phần tử chỉ tốn O(n).

## Slide 23 · Tầng trên: Sparse Table trên min của các khối
*04 · Tối ưu & độ phức tạp — Bước 1 · Chia khối hai tầng*

[17:30 – 18:20] Video ≈15 s. Truy vấn [3, 14] = hậu tố khối 1 (min 6) + khối 2–3 qua Sparse Table (min 2) + tiền tố khối 4 (min 1) ⇒ 1.

Tầng trên đã O(n). Nút thắt: các truy vấn nằm trong một khối (hoặc phần hậu tố/tiền tố) phải O(1) mà không tốn n log n.

## Slide 24 · Đáp án RMQ chỉ phụ thuộc “hình dạng” của mảng
*04 · Tối ưu & độ phức tạp — Bước 2 · Cây Cartesian*

[18:20 – 19:40] Video ≈34 s: dựng cây bằng ngăn xếp, rồi minh họa RMQ(3,7) = LCA = vị trí 5 và RMQ(1,4) = vị trí 2.

Ý then chốt: RMQ chỉ quan tâm thứ tự tương đối ⇒ mọi thông tin cần thiết nằm trong hình dạng cây Cartesian.

Lịch sử chính xác: ⟨O(n), O(1)⟩ đầu tiên là Gabow–Bentley–Tarjan (STOC 1984): quy RMQ về LCA trên cây Cartesian + LCA O(1) của Harel–Tarjan (1984).

## Slide 25 · Khối cùng hình dạng cây ⇒ dùng chung bảng tra
*04 · Tối ưu & độ phức tạp — Bước 3 · Fischer & Heun (CPM 2006)*

[19:40 – 20:50] Video ≈19 s. Hai khối [5,2,6,3] và [9,1,7,4] giá trị khác nhau nhưng cùng hình dạng cây ⇒ bảng argmin giống hệt.

Không phân loại theo hoán vị (b! loại) mà theo hình dạng cây (Catalan, ≤ 4^b). Loại khối tính trong O(b) bằng ngăn xếp/số ballot (Fischer & Heun).

## Slide 26 · Fischer–Heun đạt ⟨ O(n), O(1) ⟩ — tính chi tiết
*04 · Tối ưu & độ phức tạp — Phân tích độ phức tạp*

[20:50 – 22:00] Ba thành phần chi phí; với b = ¼·log₂ n: 4^b = √n nên bảng trong khối chỉ o(n); tầng trên (n/b)·log n = 4n.

Kết luận: tiền xử lý O(n), truy vấn O(1), bộ nhớ O(n) word — tối ưu tiệm cận. Nhưng "tối ưu tiệm cận" ≠ "nhanh nhất trên máy thật" → phần benchmark.

## Slide 27 · Euler tour biến LCA thành ±1 RMQ
*04 · Tối ưu & độ phức tạp — Chiều ngược lại · LCA → RMQ*

[22:00 – 23:00] Video ≈27 s. Euler tour dài 2n − 1; LCA(4,5) = E[4] = 2; LCA(5,6) = E[7] = 1.

RMQ ↔ LCA là quy dẫn hai chiều, tuyến tính. Bender & Farach-Colton tự nói họ không đề xuất thuật toán mới — đó là bản tuần tự hóa của thuật toán PRAM nhóm Berkman–Vishkin. Fischer & Heun 2006 giải trực tiếp RMQ tổng quát, không cần đi qua LCA.

## Slide 28 · Khối = 1 từ máy 64 bit, truy vấn trong khối = 1 lệnh ctz
*04 · Tối ưu & độ phức tạp — Bản thực dụng · RMQ tuyến tính bằng bitmask*

[23:00 – 24:20] Video ≈37 s (có thể tăng tốc bằng phím ]). Cùng ý tưởng hai tầng như Fischer–Heun nhưng phần trong khối thay bảng tra Catalan bằng mặt nạ bit: mask[r] chính là nhánh phải (ngăn xếp) của cây Cartesian của tiền tố khối.

Truy vấn (l, r) trong khối: bỏ các bit < l rồi lấy bit 1 thấp nhất. Mô hình word-RAM: w ≥ log n, nên khối 64 phần tử ứng với b = Θ(log n).

Trung thực về nguồn: không có paper bình duyệt mô tả đúng kỹ thuật mask này — nguồn là blog Codeforces.

## Slide 29 · Phần lõi: dựng mask và truy vấn trong khối
*04 · Tối ưu & độ phức tạp — Cài đặt RMQ tuyến tính*

[24:20 – 25:10] [30′ bỏ qua] Ba khối dòng: dựng mask O(n) khấu hao; truy vấn trong khối là một AND + một ctz; truy vấn tổng quát ghép 3 ứng viên.

Chứng minh tính đúng (cột phải) — đủ chặt để trả lời phản biện. Đây chính là cài đặt "Linear" trong benchmark.

## Slide 30 · Cần ít nhất bao nhiêu bit? Có nhanh hơn được không?
*04 · Tối ưu & độ phức tạp — Giới hạn dưới & bộ nhớ nén*

[25:10 – 26:30] Ba mô hình, ba loại cận dưới:

(1) Encoding: không truy cập A khi truy vấn. Số hình dạng cây = Catalan ≈ 4ⁿ/n^1.5 ⇒ cần 2n − Θ(log n) bit; đạt 2n + o(n). Lưu ý: bài ESCAPE 2007 từng tuyên bố cận dưới 2n − o(n) cho mô hình có A — đã bị chính tác giả rút lại.

(2) Indexing: có A, chỉ thêm n/c bit thì phải trả giá Ω(c) thời gian — chặt.

(3) Động: Θ(log n / log log n) (từ bài toán marked ancestor). Đừng trích Pătraşcu–Demaine Ω(log n) cho min — đó là cho phép cộng trên nhóm.

## Slide 31 · Các mốc chính (đã kiểm chứng nguồn)
*04 · Tối ưu & độ phức tạp — Lịch sử · 45 năm của một bài toán “đơn giản”*

[26:30 – 27:20] [30′ rút gọn: chỉ nói 1984, 2000, 2006–11] Đính chính phổ biến: Bender & Farach-Colton KHÔNG phải người đầu tiên đạt ⟨O(n), O(1)⟩ — đó là Gabow–Bentley–Tarjan 1984 (dựa trên LCA của Harel–Tarjan). Encoding 2n + o(n) bit không truy cập A đầu tiên là Fischer, LATIN 2010 (bản tạp chí SICOMP 2011).

2026: hướng mới là GPU (GPU-RMQ, arXiv 2026) và RMQ 2D dạng mã hóa (ESA 2026).

## Slide 32 · Thời gian và bộ nhớ: lý thuyết đặt cạnh số đo
*04 · Tối ưu & độ phức tạp — Phân tích tổng thể · n = 2²⁰ ≈ 10⁶*

[27:20 – 28:20] Nối lý thuyết với thực tế bằng số đo ở n = 2²⁰. Bộ nhớ: Sparse Table 76 byte/phần tử — có ⌊log₂n⌋ + 1 = 21 tầng nhưng chỉ lưu ô hợp lệ, tổng ≈ 19n ô × 4 byte; RMQ tuyến tính ≈ 8,8 byte/phần tử (mask 64 bit + bảng Sparse Table nhỏ trên min các khối).

Chuyển sang phần benchmark chi tiết.

## Slide 33 · Đo thế nào để kết luận có căn cứ?
*04 · Tối ưu & độ phức tạp — Benchmark tự đo · Phương pháp*

[28:20 – 29:00] Nêu rõ phạm vi để giảng viên tin số liệu: cùng dữ liệu, ghim CPU, median + IQR, kiểm tra tính đúng trước khi đo, checksum chống trình biên dịch loại bỏ code.

Hạn chế: laptop, không cô lập CPU hoàn toàn; ns/truy vấn là thông lượng (các truy vấn độc lập nối tiếp nhau, CPU có thể chồng lấp độ trễ bộ nhớ).

## Slide 34 · Big-O dự đoán đúng xu hướng — bộ nhớ đệm quyết định hằng số
*04 · Tối ưu & độ phức tạp — Benchmark tự đo · Truy vấn theo n*

[29:00 – 29:50] Thang log hai trục; dải mờ là IQR. Ba nhận xét:

1) Sparse Table nhanh nhất về truy vấn, nhưng nhảy bậc khi bảng không còn nằm trong L3 (24 MiB) — tác động của phân cấp bộ nhớ, không có trong Big-O.

2) Bitmask O(1) nhưng hằng số lớn hơn: truy cập mask[r] rồi mới truy cập A ở vị trí phụ thuộc.

3) Với n nhỏ, duyệt tuyến tính vector hóa rất nhanh. Nhận xét về cache là giải thích khả dĩ — chưa đo bằng hardware counter.

## Slide 35 · Cái giá của O(1): thời gian xây và bộ nhớ
*04 · Tối ưu & độ phức tạp — Benchmark tự đo · Tiền xử lý & bộ nhớ*

[29:50 – 30:30] [30′ bỏ qua] (a) Thời gian build: Sparse Table tăng theo n log n và nhảy ở 2¹⁹ (bảng vượt L3, page fault). RMQ tuyến tính build chậm hơn Segment Tree vì vòng pop của ngăn xếp rẽ nhánh khó đoán trên dữ liệu ngẫu nhiên.

(b) Bộ nhớ: Sparse Table 4·(⌊log₂n⌋+1) byte/phần tử, tăng tuyến tính theo log n; các cấu trúc tuyến tính gần như hằng.

## Slide 36 · Đoạn ngắn: duyệt thẳng thắng mọi cấu trúc
*04 · Tối ưu & độ phức tạp — Benchmark tự đo · Độ dài đoạn*

[30:30 – 31:10] [30′ bỏ qua] n cố định 2²² ≈ 4,2 triệu, thay độ dài đoạn. Workload quyết định: nếu bài toán chỉ hỏi đoạn ngắn (vd. cửa sổ nhỏ), duyệt là lựa chọn hợp lý. Segment Tree tăng theo log L vì số nút phải ghép tỉ lệ với log độ dài đoạn.

## Slide 37 · Query O(1) chưa chắc tổng thời gian nhỏ nhất
*04 · Tối ưu & độ phức tạp — Benchmark tự đo · Điểm hòa vốn*

[31:10 – 32:00] n = 2²⁰. Đường nằm ngang = chi phí build; độ dốc = chi phí mỗi truy vấn. q* tính từ median build và ns/truy vấn — hai điểm cắt đo trực tiếp khớp mô hình (ở q = 10⁵ Linear 11,0 ms ≈ Segment 11,4 ms; ở 10⁷ Sparse 130 ms < Linear 193 ms).

Kết luận: lựa chọn phụ thuộc q — không thể đọc từ Big-O.

## Slide 38 · Kéo q và xem cấu trúc nào thắng
*04 · Tối ưu & độ phức tạp — Demo tương tác · Số đo thật, n = 2²⁰*

[32:00 – 32:40] [30′ bỏ qua] Kéo từ q = 1 đến 10⁷ để khán giả thấy "người thắng" đổi từ duyệt → Segment Tree → RMQ tuyến tính → Sparse Table. Số liệu nhúng từ CSV benchmark (results_summary_all.csv).

## Slide 39 · Có cập nhật: cấu trúc tĩnh bị loại, Segment Tree lên ngôi
*04 · Tối ưu & độ phức tạp — Benchmark tự đo · Có cập nhật*

[32:40 – 33:20] n = 2¹⁷, 131 072 thao tác, thay tỉ lệ gán điểm 0 → 99%. Kết quả này nhất quán với số đo trước đó của nhóm trên máy khác (EPYC): Segment Tree vượt chia khối khi cập nhật chiếm đa số.

Scan giảm thời gian khi tỉ lệ cập nhật tăng chỉ vì ít truy vấn hơn, không phải vì nó nhanh lên.

## Slide 40 · Nghiên cứu khác đo được gì? (số của tác giả, máy của họ)
*04 · Tối ưu & độ phức tạp — Đối chiếu số liệu đã công bố*

[33:20 – 34:00] [30′ bỏ qua] Chỉ đối chiếu XU HƯỚNG, không ghép số vào cùng bảng xếp hạng (khác máy, năm, cài đặt). Dima & Ceterchi tuyên bố nhanh hơn Sparse Table trong abstract nhưng thực tế không đo Sparse Table — cần nói rõ khi bị hỏi.

## Slide 41 · Bốn kết luận có căn cứ
*04 · Tối ưu & độ phức tạp — Bài học từ benchmark*

[34:00 – 34:30] Tóm tắt phần 4, chuyển sang ứng dụng.

## Slide 42 · Ứng dụng thực tiễn & bài tập
*05 · Ứng dụng & bài tập*

[34:30] Phần 5.

## Slide 43 · Khi bài toán thay đổi một chút
*05 · Ứng dụng & bài tập — Mở rộng thuật toán*

[34:40 – 35:30] [30′ rút gọn] Sáu hướng mở rộng — chi tiết lazy, 2D, offline, Disjoint Sparse Table nằm ở phụ lục để trả lời câu hỏi.

2D: indexing đã gần như giải xong (Brodal–Davoodi–Rao: O(N) bit, O(1)); encoding thì không có cấu trúc kiểu cây Cartesian — số mẫu đáp án quá lớn.

## Slide 44 · Min của mọi cửa sổ độ dài k trong O(n)
*05 · Ứng dụng & bài tập — Trường hợp đặc biệt · cửa sổ trượt*

[35:30 – 36:10] Video ≈22 s; kết quả 2, 2, 1, 1, 1, 4. Đây là "họ hàng" của RMQ: cùng câu hỏi min trên đoạn nhưng các đoạn trượt có thứ tự ⇒ có lời giải O(n) riêng. Bài tập: VNOJ MINK, LeetCode 239.

## Slide 45 · LCA và khoảng cách trên cây: so sánh các lời giải
*05 · Ứng dụng & bài tập — Ứng dụng 1 · Cây*

[36:10 – 36:50] So sánh lời giải, không chỉ một cách. Binary lifting thuận tiện hơn khi cần tổ tiên thứ k hoặc gộp thông tin dọc đường; Euler + RMQ cho O(1) mỗi truy vấn.

Ứng dụng thật: suy luận nhân đôi gen dùng LCA-mapping (Zmasek & Eddy 2001) — họ cần một "oracle LCA"; Euler + RMQ là cách cài đặt chuẩn.

## Slide 46 · Suffix array + LCP + RMQ = LCE trong O(1)
*05 · Ứng dụng & bài tập — Ứng dụng 2 · Xử lý chuỗi & tin sinh học*

[36:50 – 37:40] Video ≈24 s: SA của "banana" = [6,4,2,1,5,3], LCP = [0,1,3,0,0,2]. LCE(2,4) = 3 ("ana"), LCE(1,3) = 0.

Phản biện thực nghiệm: Ilie, Navarro & Tinta đo LCE qua RMQ ≈ 1,3–1,6 µs/cặp, so trực tiếp từng ký tự 0,07–0,31 µs trên dữ liệu của họ — lại là bài học "đo theo workload".

## Slide 47 · Liệt kê tài liệu chứa mẫu P (Muthukrishnan 2002)
*05 · Ứng dụng & bài tập — Ứng dụng 3 · Truy hồi tài liệu*

[37:40 – 38:20] [30′ bỏ qua] Ứng dụng "thật" và đẹp nhất: RMQ trên mảng "lần xuất hiện trước" L. Đệ quy chỉ thăm số nút tỉ lệ số tài liệu cần báo ⇒ tối ưu. Sadakane (2007) làm bản nén dùng RMQ không cần truy cập L. Nguồn tổng quan: Navarro, ACM Computing Surveys 2014.

## Slide 48 · RMQ trong các lĩnh vực khác
*05 · Ứng dụng & bài tập — Ứng dụng khác · phân biệt “dùng thật” và “họ hàng”*

[38:20 – 38:50] [30′ bỏ qua] Phân loại trung thực: "dùng thật" là RMQ trên đoạn tùy ý; "họ hàng" là min/max cửa sổ cố định giải bằng kỹ thuật riêng.

Không đưa ví dụ "giá cổ phiếu" như ứng dụng có nguồn — chỉ là minh họa.

## Slide 49 · Euler tour + RMQ cho LCA, nhưng KHÔNG cho min trên đường đi
*05 · Ứng dụng & bài tập — Phản ví dụ · dùng RMQ sai chỗ*

[38:50 – 39:20] Phản ví dụ quan trọng cho phần hỏi đáp: đoạn Euler giữa hai đỉnh chứa cả các nhánh rẽ ra ngoài đường đi. Bài tập minh họa: SPOJ DISQUERY, VNOJ LUBENICA.

## Slide 50 · Lộ trình luyện tập (đã kiểm tra đường dẫn)
*05 · Ứng dụng & bài tập — Bài tập ứng dụng · từ dễ đến khó*

[39:20 – 39:40] Lộ trình: mỗi mức thêm một kỹ thuật. Danh sách đầy đủ 43 bài có trong báo cáo nghiên cứu (reports/). Lưu ý: VNOJ LQDDIV và CF 870B không phải bài RMQ (đã loại).

## Slide 51 · Bốn điều mang về
*Kết luận — Kết luận*

[39:40 – 40:00] Bốn thông điệp. Cảm ơn và mời câu hỏi.

## Slide 52 · Các công trình nền tảng
*Tài liệu tham khảo — Tài liệu tham khảo (1/2) · Lý thuyết*

Danh mục đã đối chiếu DOI qua Crossref (xem báo cáo nghiên cứu để có DOI và link bản mở).

## Slide 53 · Thực nghiệm và ứng dụng
*Tài liệu tham khảo — Tài liệu tham khảo (2/2) · Thực nghiệm, ứng dụng, học liệu*

Nguồn video gợi ý xem lại: COMP526 Unit 9 (Sebastian Wild) — RMQ, Sparse Table, Cartesian tree, Exhaustive tabulation, LCE.

## Slide 54 · Hỏi & Đáp
*Hỏi đáp — Cảm ơn thầy cô và các bạn*

Các slide phụ lục phía sau dùng để trả lời câu hỏi: FAQ phản biện, lazy, 2D, offline, Disjoint Sparse Table, tái lập benchmark.

## Slide 55 · Chuẩn bị trả lời
*Phụ lục — Phụ lục A · Câu hỏi phản biện thường gặp*

Slide dự phòng cho hỏi đáp.

## Slide 56 · Lazy Segment Tree: cộng / gán cả đoạn
*Phụ lục — Phụ lục B · Cập nhật đoạn*

Bài tập: VNOJ QMAX2, CF 52C Circular RMQ.

## Slide 57 · Ma trận: hình chữ nhật nhỏ nhất
*Phụ lục — Phụ lục C · RMQ hai chiều*

Không mang nguyên kết quả 2n bit của 1D sang 2D.

## Slide 58 · Khi biết trước truy vấn, hoặc phép toán không lũy đẳng
*Phụ lục — Phụ lục D · Ngoại tuyến & Disjoint Sparse Table*

Dự phòng.

## Slide 59 · Chạy lại benchmark, hình và video
*Phụ lục — Phụ lục E · Tái lập kết quả*

Dự phòng.
