# Kịch bản trình bày RMQ

File này được sinh từ slide bằng `node tools/export_script.mjs`. Trong deck, bấm **N** để xem ghi chú của slide hiện tại.

Tổng thời gian khoảng 37 phút; bản rút gọn (phím T) khoảng 29 phút.

## Câu chuyện

### 1. Range Minimum Query (30 giây)

Giới thiệu nhóm. Cả buổi đi theo một câu chuyện: Pi tìm vé máy bay rẻ nhất. Mỗi thuật toán xuất hiện vì câu chuyện cần nó.

Phím tắt: → đi tiếp, A tự chạy, O tổng quan, N ghi chú, T bản rút gọn, F toàn màn hình.

### 2. Pi đi tìm vé rẻ (35 giây)

*Video manim, nói theo phụ đề.*

Để video chạy, nói theo phụ đề. Video dừng sau lượt tìm đầu tiên của Pi: đọc từng ngày trong khoảng, nhớ ngày rẻ nhất. Hai slide sau để người nghe tự thử thêm khoảng ngày và thấy các ô bị đọc lại.

Phím V tạm dừng, J/L lùi hoặc tới 5 giây, R phát lại, [ và ] đổi tốc độ. Rê chuột lên video để hiện thanh tua.

### 3. Thử đặt vé: mỗi người một khoảng ngày (40 giây)

- Pi: Bạn thử chọn hai ngày rồi bấm tìm xem.
- Pi: Hệ thống đọc từng ô trong khoảng, nhớ ô rẻ nhất.
- Pi: Người khác truy vấn khoảng khác: các ô cũ lại bị đọc thêm lần nữa.

Hệ thống đã thu thập giá vé thấp nhất mỗi ngày cho hành trình TP.HCM → Hà Nội. Người dùng chọn khoảng ngày có thể khởi hành, hệ thống trả về ngày rẻ nhất. Giá giả lập, đơn vị triệu đồng.

Nếu có thể, mời một người nghe chọn khoảng ngày và bấm. Bộ đếm ô đã đọc tăng dần: đó là chi phí.

### 4. Nhiều truy vấn, ô cũ bị đọc lại (35 giây)

- Pi: Ba người, ba khoảng chồng lên nhau.
- Pi: Sáu người đã đọc nhiều hơn cả mảng. Hàng nghìn người thì sao?
- Pi: Đây là yêu cầu của cả buổi hôm nay.

Chỉ ra phần chồng lấn giữa các thanh. Số ô đọc tăng theo số truy vấn, trong khi dữ liệu không đổi.

### 5. Giá vé có đổi không? (40 giây)

- Pi: Giá vé ngoài đời thay đổi liên tục. Phải tách hai tình huống.
- Pi: Bảng giá đã chốt: được phép chuẩn bị thật kỹ.
- Pi: Giá đổi liên tục: những gì tính trước có thể hết đúng.
- Pi: Vì vậy RMQ có nhiều lời giải. Đây là đường đi hôm nay.

Dữ liệu không đổi trong lúc truy vấn: hệ thống dùng bảng giá chốt tại một thời điểm, dẫn đến Sparse Table. Dữ liệu được cập nhật: phải sửa và vẫn trả lời nhanh, dẫn đến Segment Tree.

Lộ trình: định nghĩa và chi phí; duyệt, bảng mọi đoạn, chia khối, Segment Tree, Sparse Table; giải bài vé và so sánh CTDL; Fischer–Heun; benchmark 5 cấu trúc; ứng dụng thực tế.

## Bài toán

### 6. Định nghĩa RMQ (50 giây)

- Pi: Hai ngày cùng giá thì mình bay ngày sớm hơn: đó là quy tắc chọn bên trái.

Từ đây Pi thu gọn thành 8 ngày từ 3/11, giá theo trăm nghìn đồng: A = [7, 4, 9, 4, 6, 2, 2, 8]. Chỉ số bắt đầu từ 0 trong toàn bộ buổi.

Phân biệt min và argmin. Biết vị trí thì lấy được giá trị, chiều ngược lại thì không. RMQ(1,4) = 1 vì giá trị 4 xuất hiện ở vị trí 1 và 3, chọn trái. RMQ(3,6) = 5 là chỉ số trong mảng gốc, không phải thứ tự 2 trong đoạn con.

### 7. Chi phí: chuẩn bị và trả lời (40 giây)

- Pi: Bảng giá có trước. Truy vấn đến sau, không biết trước.
- Pi: Giai đoạn một: làm việc một lần, lưu thứ có ích.
- Pi: Giai đoạn hai: mỗi truy vấn chỉ dùng những gì đã lưu.
- Pi: Tổng chi phí: chuẩn bị cộng $q$ lần trả lời.
- Pi: Lưu gì thì vừa đủ? Thử hai cách cực đoan trước.

Mô hình trong bài giảng của Sebastian Wild. Hai điều kiện: mảng tĩnh, truy vấn chưa biết trước. Ký hiệu một lời giải là ⟨P(n), Q(n)⟩, bộ nhớ phụ là S(n).

Một cấu trúc xây rất lâu chưa chắc đáng dùng nếu chỉ truy vấn vài lần, nên không thể chỉ nhìn tốc độ của một truy vấn. Công thức này quay lại ở phần benchmark.

## Cơ sở thuật toán

### 8. Hai thái cực: quét và bảng mọi đoạn (55 giây)

- Pi: Bảng $M[l][r]$: mỗi ô là đáp án một đoạn.
- Pi: Mở rộng đoạn thêm một phần tử: chỉ cần một phép so sánh.
- Pi: Nhưng số ô tăng theo bình phương.
- Pi: Một bên không lưu gì, một bên lưu tất cả.

Nếu mỗi ô lại quét đoạn thì tốn O(n³). Thêm một phần tử mới, cực tiểu chỉ có hai khả năng: vẫn là cực tiểu cũ, hoặc chính phần tử mới. Nhờ quy hoạch động, mỗi ô O(1), cả bảng O(n²).

Mảng n phần tử có n(n+1)/2 đoạn: n = 8 là 36 ô, n = 10^6 là khoảng 5·10^11 ô. Rê chuột trên bảng để thấy đoạn tương ứng.

### 9. Chia khối √n (50 giây, có thể lướt)

- Pi: Kéo $b$: khối nhỏ thì đọc nhiều min, khối lớn thì quét nhiều biên.

Đoạn truy vấn tách thành hai phần biên phải quét và các khối trọn vẹn chỉ đọc min đã lưu. Cân bằng b ≈ n/b cho b ≈ √n. Ví dụ mảng 16 phần tử, truy vấn [2,13]: cột thấp nhất ở b = 4.

Khi sửa một phần tử, chỉ khối chứa nó phải quét lại: O(√n). Bộ nhớ phụ O(√n).

### 10. Segment Tree (video) (59 giây)

*Video manim, nói theo phụ đề.*

Ba ý: xây từ dưới lên O(n); đoạn truy vấn ghép từ tối đa 2 nút mỗi tầng; sửa một phần tử chỉ chạm đường lên gốc.

### 11. Sparse Table: ý tưởng (55 giây)

- Pi: Hàng đầu: đoạn dài 1, đáp án là chính nó.
- Pi: Rê chuột vào một ô để xem nó đại diện cho đoạn nào.
- Pi: $st[2][3]=5$: đoạn bắt đầu tại 3, dài 4, nhỏ nhất ở vị trí 5.
- Pi: Bỏ rất nhiều đoạn. Đoạn dài 6 thì sao? Lát nữa sẽ rõ.

Vì lưu vị trí nên hàng đầu là st[0][i] = i, không phải A[i]. Khoảng log₂ n hàng, mỗi hàng tối đa n ô. Đây là chỗ người nghe hay nhầm: chỉ số thứ hai là vị trí bắt đầu.

### 12. Sparse Table: xây bảng (video) (74 giây)

*Video manim, nói theo phụ đề.*

Đoạn dài 8 tách thành hai đoạn dài 4, đoạn dài 4 tách thành hai đoạn dài 2. Nửa phải bắt đầu tại i + 2^(k−1). Dừng ở st[2][1] để nói về quy tắc chọn bên trái.

### 13. Sparse Table: truy vấn (video) (67 giây)

*Video manim, nói theo phụ đề.*

Ý quan trọng nhất của phần cơ sở: hai khối chồng lấn phủ kín đoạn truy vấn. Phần cuối video cho thấy vì sao mẹo này không dùng được với phép cộng.

### 14. Vì sao hai khối luôn đủ (50 giây)

- Pi: Kéo $L$ từ 1 đến 32: không bao giờ có ô đỏ.
- Pi: Khối không dài hơn đoạn, nên không lấy nhầm phần tử ngoài.
- Pi: Hai khối đủ dài để gặp nhau ở giữa.
- Pi: Phần chung xét hai lần không đổi min. Không dùng được cho phép cộng.

Ba ý ứng với ba điều kiện. Tính lũy đẳng min(x,x) = x đúng cho min, max, gcd, AND, OR, nhưng không đúng cho tổng.

Phân biệt: lúc xây bảng ghép hai nửa bằng nhau không giao nhau; lúc truy vấn ghép hai khối bám hai đầu và có thể chồng lấn.

### 15. Sparse Table trong C++ (45 giây)

- Pi: Xây theo $k$ tăng dần nên hai ô nhỏ hơn luôn có sẵn.

Viết min(p, q) sẽ chọn chỉ số nhỏ hơn kể cả khi giá trị lớn hơn. lg[x] = lg[x/2] + 1 vì mỗi lần chia đôi phần nguyên của log₂ giảm đúng 1. q truy vấn tốn O(n log n + q).

Code đã biên dịch và kiểm thử bằng duyệt trâu trong tools/check_code.py. Mảng 7 4 9 4 6 2 2 8: truy vấn (1,6) trả 5, (1,4) trả 1, (2,2) trả 2, (6,7) trả 6.

## Áp dụng

### 16. Khi giá vé thay đổi (45 giây)

- Pi: Đổi giá một ngày: phải kiểm tra lại bao nhiêu ô?

Ví dụ: A[5] từ 2 thành 10 thì đoạn [3,6] thành [4, 6, 10, 2], RMQ(3,6) đổi từ 5 sang 6. Những gì đã tính trước có thể hết đúng.

Sparse Table không bắt buộc xây lại toàn bộ O(n log n), chỉ cần tính lại các ô có đoạn chứa vị trí đó, nhưng số ô này là Θ(n) ở giữa mảng. Segment Tree chỉ sửa log₂ n + 1 nút.

### 17. Chọn cấu trúc nào? (45 giây)

- Pi: Bấm một tình huống, hoặc tự trả lời từng câu.
- Pi: Bài vé: bảng giá chốt, rất nhiều truy vấn, đủ RAM: Sparse Table.

Bốn câu hỏi này là kết luận thực dụng của cả phần. Fischer–Heun được giải thích ở phần tiếp theo. Ngưỡng cụ thể lấy từ benchmark.

### 18. Bảng so sánh các CTDL (40 giây)

- Pi: Dòng màu cam: xây $O(n)$ mà truy vấn $O(1)$. Làm sao được?

Không đọc hết bảng; đây là bảng để tra lại sau buổi. Bảng mọi đoạn: O(n²) xây, O(1) truy vấn, O(n²) bộ nhớ, chỉ hợp n rất nhỏ. Succinct (Fischer & Heun 2011) chỉ trả về vị trí và không lưu giá trị của mảng. Bộ nhớ Fischer–Heun tính theo word.

Dẫn sang phần tối ưu qua dòng Fischer–Heun.

## Tối ưu

### 19. Có thể bỏ log n không? (50 giây)

- Pi: Bảng to vì mỗi vị trí xuất hiện ở khoảng $\log n$ tầng.
- Pi: Mỗi khối chỉ cử một đại diện vào bảng.
- Pi: Số ô còn ít hơn cả độ dài mảng gốc!
- Pi: Tầng trên đã tuyến tính.

Ví dụ dùng b = 16 = log₂ n cho dễ tính, nên m = 65.536 / 16 = 4.096. Bài toán thật chọn b = ¼ log₂ n, giải thích sau. Số phần tử giảm khoảng log n lần, vừa đủ bù cho khoảng log n tầng.

b = Θ(log n) nghĩa là b tăng cùng bậc với log n, chỉ khác hệ số hằng: tồn tại c₁, c₂ > 0 sao cho c₁ log n ≤ b ≤ c₂ log n khi n đủ lớn. Kỹ thuật dùng lại thuật toán đã biết trên đầu vào nhỏ hơn gọi là bootstrapping.

### 20. Chia khối và ghép ba phần (video) (62 giây)

*Video manim, nói theo phụ đề.*

RMQ(7,12): đuôi khối 1, khối 2 trọn vẹn, đầu khối 3. Lỗi hay gặp: lấy min cả khối biên, trong khi cực tiểu đó nằm ngoài đoạn truy vấn.

### 21. Bên trong khối thì sao? (40 giây)

- Pi: Quét thì đơn giản, nhưng chưa đạt mục tiêu.
- Pi: Bảng riêng cho từng khối: lại về $O(n\log n)$.
- Pi: Sparse Table từng khối: rất gần, nhưng chưa tới.
- Pi: Có 16.384 khối, nhưng chúng có thật sự khác nhau không?

Chi phí: quét O(b) = O(log n); bảng mọi đoạn (n/b)·O(b²) = O(n log n); Sparse Table từng khối (n/b)·O(b log b) = O(n log log n). Với n = 65.536, b = 4: mỗi bảng nhỏ có 3 tầng thay vì 17, tổng 16.384 × 4 × 3 = 196.608 ô.

Điểm mấu chốt: tổng chi phí đang tính theo số khối. Muốn giảm tiếp phải làm chi phí phụ thuộc vào số LOẠI khối.

### 22. Cây Cartesian (video) (91 giây)

*Video manim, nói theo phụ đề.*

Dựng cây theo định nghĩa đệ quy: lấy min làm gốc, hai bên làm tiếp. Hai tính chất: duyệt giữa cho thứ tự chỉ số; cha không lớn hơn con. Rồi minh họa LCA trên hai đoạn.

### 23. Chứng minh RMQ = LCA (55 giây)

- Pi: Gõ $l$, $r$: thanh tím luôn chứa trọn đoạn truy vấn.
- Pi: LCA không thể nằm ngoài đoạn.
- Pi: Gốc cây con là phần tử nhỏ nhất của đoạn nó đại diện.
- Pi: Đáp án chỉ phụ thuộc hình dạng cây. Đây là chìa khóa.

Bước 1: gọi m = LCA(l, r). Nếu m < l thì l, r đều ở cây con phải của m, nên con phải đó là tổ tiên chung sâu hơn, mâu thuẫn. m > r tương tự. Vậy l ≤ m ≤ r.

Bước 2: mỗi cây con ứng với một đoạn chỉ số liên tiếp. Cây con gốc m chứa l và r nên chứa cả [l, r], mà gốc là cực tiểu của đoạn nó đại diện. Vậy A[m] ≤ A[k] với mọi k trong [l, r].

Giá trị trùng nhau: giữ quy tắc chọn trái khi dựng cây. Phép ghép các khối vẫn cần giá trị để so sánh.

### 24. Khác giá trị, cùng đáp án (video) (46 giây)

*Video manim, nói theo phụ đề.*

Định lý: hai mảng cùng độ dài có đáp án RMQ giống nhau trên mọi đoạn khi và chỉ khi chúng có cùng hình dạng cây Cartesian chuẩn. Ví dụ nhỏ: [2,1,3] và [3,1,2].

### 25. Đếm số loại khối: Catalan (55 giây)

- Pi: Giá trị có vô số khả năng, nhưng về RMQ chỉ có 14 kiểu.
- Pi: Ba khối ban nãy rơi vào cùng một ô.
- Pi: Khác hình dạng thì khác ô, khác đáp án.
- Pi: Chỉ cần biết: số loại không quá $4^b$.

Số hình dạng cây nhị phân b nút là số Catalan C_b = (1/(b+1))·C(2b, b). Mã 11 10 00 00: duyệt preorder, mỗi nút 2 bit (có con trái? có con phải?): gốc có hai con, con trái có một con trái, hai nút còn lại là lá.

Mỗi cây có mã 2b bit nên tối đa 2^(2b) = 4^b mã. Không phải mã nào cũng hợp lệ, nên đây là chặn trên.

### 26. Bảng đáp án dùng chung (45 giây)

- Pi: Bấm một ô: cả ba khối có đáp án ở cùng vị trí tương đối.

T[type][u][v] là vị trí tương đối; đổi về chỉ số gốc bằng s + p với s = t·b. Mỗi khối chỉ lưu mã loại.

Một bảng cho khối dài 4 có 4 + 3 + 2 + 1 = 10 ô. 16.384 khối mỗi khối một bảng: 163.840 ô. Dùng chung, tối đa 14 loại: 140 ô (chặn trên đơn giản 4^b = 256 loại, tức 2.560 ô).

### 27. Vì sao chọn b = ¼ log₂ n (50 giây)

- Pi: Kéo hệ số: nó nằm trong số mũ của $4^b$, nên đổi cả bậc tăng trưởng.
- Pi: Với $\tfrac14$, cả ba khoản đều tuyến tính. Xong: xây $O(n)$, truy vấn $O(1)$.

Ba khoản: tính mã và min các khối O(n); Sparse Table trên đại diện O((n/b) log(n/b)) = O(n); bảng tra 4^b·b³. Với b = ¼ log₂ n thì 4^b = √n loại, bảng tra O(√n log³ n) = o(n).

Mọi 0 < c < 1/2 đều cho bảng tra o(n); c = 1/4 là lựa chọn của Fischer–Heun. Truy vấn: hai lần tra bảng, một truy vấn Sparse Table, ghép ba ứng viên. Bộ nhớ O(n) word; mã loại dài 2b = O(log n) bit vừa một word. Dùng b³ là chặn đơn giản; xây bảng bằng DP thì b², paper dùng Catalan cho chặn chặt hơn.

### 28. Bước xây để lại gì (40 giây, có thể lướt)

- Pi: Bước xây để lại ba thứ: $V$, $G$ cho phần giữa, $T$ cho hai đầu.
- Pi: Truy vấn chỉ gọi ba hàm này, hàm nào cũng $O(1)$.

Ô tím là min của từng khối: giá trị đưa vào V, chỉ số đưa vào G. macro chỉ trả về số thứ tự khối, nên cần G để ra vị trí thật. V có n/b phần tử nên Sparse Table trên V tốn O((n/b) log(n/b)) = O(n).

u, v trong inBlock là vị trí tương đối, từ 0 đến b − 1; T cũng lưu vị trí tương đối nên cộng k·b để ra vị trí trong A. Mỗi khối chỉ lưu mã loại type_k, tính một lần lúc xây. better so A[p] với A[q].

### 29. Toàn bộ một truy vấn (50 giây, có thể lướt)

- Pi: Áp vào $\mathrm{RMQ}(7, 12)$ với $V$, $G$, $T$ vừa có.
- Pi: Tìm hai khối chứa hai đầu đoạn.
- Pi: Đuôi khối trái: tra bảng dùng chung.
- Pi: Đầu khối phải: cũng vậy.
- Pi: Phần giữa: Sparse Table trên đại diện.
- Pi: Ba ứng viên, một đáp án.

Hai trường hợp đặc biệt: cùng khối thì tra một lần; hai khối kề nhau thì không có phần giữa. Khi cài đặt, khối cuối có thể thiếu phần tử: đệm bằng giá trị lớn hơn mọi giá trị thật. Quy tắc chọn trái phải nhất quán ở cây, bảng nội khối và bước ghép.

### 30. Con đường thứ hai: Euler + ±1 (50 giây, có thể lướt)

- Pi: Mảng độ sâu Euler có hai số kề nhau luôn chênh đúng 1.
- Pi: Cùng $O(n)$ và $O(1)$, nhưng hằng số khác nhau. Chạy thật thì sao?

Bender & Farach-Colton (2000). Đi qua một cạnh thì độ sâu đổi đúng ±1. Trừ phần tử đầu khỏi khối: [7,8,7,6] − 7 = [0,1,0,−1] và [12,13,12,11] − 12 = [0,1,0,−1], cùng loại. Chỉ cần mã b − 1 bit, có 2^(b−1) loại, chọn b ≈ ½ log₂ N. Không áp dụng trực tiếp cho mảng thường: [1,4,2] và [2,4,1] cùng "tăng rồi giảm" nhưng khác đáp án.

Bộ nhớ theo Bảng 1 của Fischer & Heun (2006): 9n + O(√n log² n) so với 4n + O(√n log n) word. Không có lập luận vòng: ±1 RMQ được giải trực tiếp trước, dùng nó giải LCA, rồi dùng LCA giải RMQ tổng quát. Paper năm 2000 là bản trình bày lại đơn giản.

### 31. Lịch sử các mốc chính (25 giây, có thể lướt)

- Pi: Kết quả tối ưu có từ 1984. Phần còn lại là làm nó đơn giản và nhanh thật sự.

Câu hỏi hay gặp: ai đạt kết quả đầu tiên? Gabow–Bentley–Tarjan 1984 (quy RMQ về LCA của Harel–Tarjan), không phải Bender–Farach-Colton 2000. Cấu trúc 2011 không cần giữ mảng gốc để trả về vị trí.

## Benchmark

### 32. Đo như thế nào (40 giây)

- Pi: Cùng dữ liệu, cùng bộ truy vấn, và phải trả lời đúng hết trước khi đo.

Fischer–Heun ở đây cài đặt đúng cấu trúc vừa trình bày: b = ⌊¼ log₂ n⌋, bảng chung theo loại, Sparse Table trên đại diện. Segment Tree lặp từ dưới lên, 2n ô. Sparse Table bản cổ điển, mảng phẳng.

Môi trường: ghim một P-core, L1d 48 KiB, L2 1,25 MiB, L3 24 MiB, -O3 -march=native, laptop không cô lập hoàn toàn. Checksum đáp án khớp trên mọi lượt đo; đổi thứ tự chạy giữa các lần. Bộ nhớ là kích thước mảng phụ, chưa tính mảng đầu vào. Dữ liệu: số nguyên ngẫu nhiên 0 đến 10^9.

Đây là microbenchmark trên một máy: cho thấy xu hướng, không gộp với số liệu của các paper. Mã nguồn và CSV trong seminar/v2/benchmark.

### 33. Thời gian truy vấn theo n (45 giây)

- Pi: Thang log: mỗi vạch gấp 10 lần. $O(1)$ vẫn chậm dần khi bảng rơi khỏi cache.

n = 2^23: Duyệt khoảng 283 µs mỗi truy vấn; Sparse Table 13,3 ns (2,6 ns ở 2^16) vì bảng 88 byte mỗi phần tử rơi khỏi cache; Fischer–Heun 32,7 ns vì tra nhiều bảng hơn; Segment Tree 121 ns, tăng chậm theo log n. Đường gạch đứng: n ứng với kích thước L1, L2, L3 khi mảng 4 byte mỗi phần tử. Rê chuột để đọc từng giá trị.

### 34. Cái giá của O(1) (35 giây)

- Pi: Không có gì miễn phí.

n = 2^20. Sparse Table: xây 29 ms, 76 byte mỗi phần tử, 6,4 ns mỗi truy vấn. Fischer–Heun: 5,8 ms, 13,8 byte, 11,3 ns. Segment Tree: 1,07 ms, 8 byte, 96 ns. Duyệt khoảng 20 µs mỗi truy vấn, vượt khỏi thang đo.

### 35. Đoạn ngắn: duyệt thắng (35 giây)

- Pi: Đoạn vài chục phần tử: vòng lặp đơn giản thắng cả cấu trúc $O(1)$.

n = 2^22. Fischer–Heun cũng phẳng, khoảng 13–24 ns. Segment Tree từ 7,5 lên 77 ns. Paper Fischer–Heun 2006 cũng thấy quét trực tiếp rất nhanh với đoạn tới khoảng 100 phần tử trên máy của họ. Không dùng kết quả này để phủ nhận O(n) tệ nhất của duyệt.

Ý nghĩa thực tế: nên biết đoạn truy vấn thường dài bao nhiêu. Thuật toán lai: đoạn ngắn thì quét, đoạn dài thì tra bảng.

### 36. Bao nhiêu truy vấn thì đáng? (55 giây)

- Pi: Kéo $q$: ít truy vấn thì cấu trúc xây nhanh thắng.

Tổng thời gian T(q) = P + q·Q, n = 2^20. Điểm hòa vốn q* = (P_A − P_B)/(Q_B − Q_A), tính từ số đo: Fischer–Heun vượt Segment Tree ở q ≈ 59.000; Sparse Table vượt Fischer–Heun ở q ≈ 9,4 triệu. Rất ít truy vấn thì Duyệt thắng. Đường Duyệt và Chia khối dừng sớm vì quá chậm để đo tiếp.

### 37. Khi có cập nhật (35 giây)

- Pi: Về bậc thì $\log n$ tốt hơn $\sqrt n$, nhưng hằng số của phép quét rất nhỏ.

n = 2^17, 131.072 thao tác. Tổng thời gian: 0% cập nhật: chia khối 8,0 ms, Segment 11,0 ms; 50%: 5,6 và 6,4 ms; 75%: 4,1 và 3,8 ms; 99%: 2,7 và 1,3 ms. Sparse Table và Fischer–Heun không tham gia vì được thiết kế cho mảng tĩnh. Ở n lớn hơn, chia khối chậm đi nhanh hơn nhiều.

### 38. Các nghiên cứu khác đo được gì (30 giây, có thể lướt)

- Pi: Số khác nhau theo máy, nhưng xu hướng giống số đo của nhóm.

Fischer & Heun 2006: n = 10^7, 10^6 truy vấn, Athlon XP3000; bản quét biên O(log n) còn nhỉnh hơn bản O(1); quét thẳng nhanh với đoạn tới khoảng 100 phần tử. Dima & Ceterchi 2015, 10^7 thao tác: cập nhật 0,672 s so với 1,274 s; truy vấn 0,551 s so với 2,397 s. Kowalski & Grabowski 2018: Sparse Table theo khối xây 0,6 s, Sparse Table đầy đủ 436,6 s.

Mỗi dòng là số của tác giả trên máy của họ, không so sánh trực tiếp với nhau hay với số đo của nhóm.

### 39. Bốn kết luận từ benchmark (30 giây)

- Pi: Đừng chỉ nhìn cột truy vấn.
- Pi: Bộ nhớ ảnh hưởng ngược lại đến tốc độ.
- Pi: Không có cấu trúc nào thắng mọi hoàn cảnh.
- Pi: Giờ xem RMQ được dùng ở đâu ngoài đời.

Với n = 2^20: Segment Tree thắng đến q ≈ 6·10^4, Fischer–Heun đến q ≈ 9·10^6, rồi mới đến Sparse Table. Sparse Table tốn 76–88 byte mỗi phần tử, Fischer–Heun 14–16 byte. Hằng số, cache, rẽ nhánh và SIMD không nằm trong Big-O.

## Thực tế

### 40. RMQ xuất hiện ở đâu? (30 giây)

- Pi: Trực tiếp: RMQ là phép toán cốt lõi. Quy đổi: bài toán đưa được về RMQ.

Cần nói chính xác: RMQ là phép toán nền tảng xuất hiện trong các bài toán này. Không kết luận rằng mọi hệ thống chứng khoán, tìm kiếm hay xử lý ảnh đều chạy Sparse Table hay Fischer–Heun; hệ thống thật có thể dùng cách khác. Không khẳng định Google Search hay Elasticsearch dùng các thuật toán này khi không có bằng chứng triển khai.

### 41. Chuỗi thời gian: biểu đồ giá (50 giây)

- Pi: Biểu đồ này chạy RMQ thật ngay trong trình duyệt.
- Pi: Chọn một khoảng: chấm xanh là giá thấp nhất, chấm đỏ là cao nhất.
- Pi: Zoom vào: hình dạng vẫn đúng vì cực trị luôn được giữ.

Mỗi cột điểm ảnh truy vấn min và max của đoạn nó đại diện, nên đường vẽ không mất đỉnh. Câu hỏi quen thuộc: giá thấp nhất từ 9 giờ đến 11 giờ? CPU có từng dưới 10%? Dữ liệu tĩnh thì Sparse Table, cập nhật liên tục thì Segment Tree hoặc cấu trúc tổng hợp nhiều cấp.

OM³ (SIGMOD 2023) dùng cây min–max nhiều cấp của riêng nó, không phải Sparse Table; tác giả báo cáo độ trễ trong 300 ms trên trình duyệt, với dữ liệu từ hàng triệu đến hàng tỷ bản ghi.

### 42. DNA: Suffix Array + LCP + RMQ (60 giây)

- Pi: Liệt kê mọi hậu tố của chuỗi DNA.
- Pi: Sắp xếp: các hậu tố giống nhau gom lại cạnh nhau.
- Pi: Mỗi dòng nhớ nó giống dòng trên bao nhiêu ký tự.
- Pi: Hai dòng kề nhau: đoạn lặp GATTAC, dài 6.
- Pi: Hai dòng cách xa: lấy min các ô ở giữa. Đó là RMQ.

Vì sao đúng: các hậu tố đã sắp xếp nên chuỗi có cùng tiền tố nằm liền nhau; tiền tố chung của hai đầu phải đi qua mọi cặp ở giữa, cặp yếu nhất quyết định. Sau tiền xử lý, mỗi truy vấn O(1) thay vì so từng ký tự. Chi phí toàn bộ còn phải cộng việc xây suffix array và LCP.

kmacs (Leimeister & Morgenstern, Bioinformatics 2014) trình bày cách dùng RMQ trên mảng LCP để so sánh trình tự và có tùy chọn RMQ, nhưng tác giả dùng so từng ký tự làm mặc định vì nhanh hơn trong thử nghiệm của họ. Tổng quan năm 2026 trên Genome Research tiếp tục dùng các cấu trúc này cho dữ liệu genomic lớn.

### 43. Cây: LCA quy về RMQ (video) (67 giây, có thể lướt)

*Video manim, nói theo phụ đề.*

Ứng dụng trên cây: tổ tiên chung của hai loài trong cây phân loại, phần tử cha chung trong hệ thống tài liệu phân cấp. Đây là ứng dụng gián tiếp vì LCA còn có cách khác như binary lifting.

### 44. RMQ hai chiều (40 giây, có thể lướt)

- Pi: Giờ mình chọn cả ngày lẫn giờ bay: bảng giá thành ma trận.
- Pi: Kéo chuột chọn một khung: khung càng to, càng nhiều ô phải đọc.

Min theo từng cột của bảng chính là mảng A = [7, 4, 9, 4, 6, 2, 2, 8] ở đầu buổi: bài một chiều là bảng này nhìn từ trên xuống. Khung mặc định 9h–18h, 4/11–8/11 có 20 ô, rẻ nhất 2 trăm nghìn lúc 15h ngày 8/11.

Có thể kéo chuột trên bảng để chọn khung bất kỳ, hoặc bấm các nút thử nhanh. Cách đơn giản nhất ở giữa: một Sparse Table cho mỗi hàng, truy vấn bằng cách lấy min của từng hàng, tốn O(n).

### 45. Xử lý ảnh: erosion (50 giây, có thể lướt)

- Pi: Ảnh xám là một ma trận số. Rê chuột lên ảnh để xem từng ô.
- Pi: Mỗi điểm lấy min trong cửa sổ quanh nó: chấm sáng nhỏ biến mất.
- Pi: Cửa sổ lớn hơn: vùng sáng co lại.

Ô bên phải phóng to cửa sổ quanh điểm đang xét, mỗi ô là một số độ sáng; khung vàng là cửa sổ, ô viền xanh là min. Min đó thành điểm viền xanh ở ảnh bên phải. Rê chuột trên ảnh gốc: ảnh bên phải chỉ tính tới điểm đang trỏ (theo thứ tự từng hàng), phần chưa tính hiện ảnh gốc mờ. Nút "Quét từng điểm" chạy hết ảnh trong 6 giây; sang bước 1 nút này tự chạy.

Sparse Table 2D lưu các hình chữ nhật có cạnh lũy thừa của 2: O(HW log H log W) ô; mỗi truy vấn tra 4 ô. Toàn bộ chạy thật trong trình duyệt.

Lưu ý: erosion có cửa sổ cố định là trường hợp đặc biệt; thuật toán chuyên dụng như sliding-window minimum (Gil & Kimmel, IEEE TPAMI 2002) thường phù hợp hơn RMQ 2D tổng quát.

### 46. Khi đề bài đổi một chút (40 giây, có thể lướt)

- Pi: Một ý tưởng cốt lõi, nhiều biến thể.

Ví dụ trên A = [7,4,9,4,6,2,2,8]: RMQ(1,6) = 5 từ hai khối [1,4] và [3,6]; A[5] := 10 thì RMQ(3,6) đổi từ 5 sang 6; cộng 3 vào [4,6] thì min A[2..7] thành 4; cửa sổ dài 3 cho 4, 4, 4, 2, 2, 2.

max, gcd, AND, OR vẫn dùng Sparse Table. Disjoint Sparse Table dùng các đoạn không giao nhau nên đúng với mọi phép kết hợp. Succinct dùng 2n + o(n) bit, chỉ trả vị trí; chỉ giới thiệu một câu.

## Kết

### 47. Lộ trình luyện tập (15 giây)

- Pi: Bắt đầu từ hai bài CSES ở mức 1.

Chỉ nêu lộ trình, không đọc từng bài. Mức 3 có CF 475D dùng Sparse Table cho gcd. Mức 4 có VNOJ LUBENICA: min trên đường đi giữa hai đỉnh, cần binary lifting vì Euler tour + RMQ không cho min trên đường đi.

### 48. Tài liệu tham khảo (10 giây)

Không đọc. Slide này để người xem tra cứu sau.

### 49. Cảm ơn (15 giây)

Câu hỏi hay gặp. Truy vấn O(1) mà vẫn tính log? Tính sẵn bảng lg[] hoặc dùng __builtin_clz, tránh log2() số thực. Sparse Table khi có cập nhật? Hỏng tới Θ(n) ô, dùng Segment Tree. Giá trị trùng nhau? So cặp (giá trị, vị trí), chọn bên trái. Fischer–Heun hơn ở đâu? Xây và bộ nhớ O(n), đổi lại code dài hơn. Ai đạt xây O(n), truy vấn O(1) đầu tiên? Gabow, Bentley, Tarjan, năm 1984. Euler tour dài bao nhiêu? 2n − 1 phần tử.

Thêm: O(n) bộ nhớ là O(n) word, tức O(n log n) bit; 2n + o(n) bit là kết quả succinct riêng, chỉ trả vị trí. Bender và Farach-Colton 2000 là bản đơn giản hóa. Stack đơn điệu dựng cây Cartesian trong O(n); dựng đệ quy có thể O(n²) với mảng tăng dần. Có thể bấm O để nhảy nhanh tới slide liên quan.
