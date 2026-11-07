# Cartesian tree đưa RMQ về O(1) và 2n bit

Bài toán Range Minimum Query (RMQ) tĩnh một chiều đã có lời giải tối ưu về bậc, tức tiền xử lý O(n) và truy vấn O(1), **từ năm 1984**. Lời giải này của Gabow, Bentley và Tarjan: họ quy RMQ về LCA trên Cartesian tree (Vuillemin 1980), rồi dùng thuật toán LCA tuyến tính của Harel và Tarjan ([Fischer & Heun, SICOMP 2011](https://ae.iti.kit.edu/1810.php); [Liu & Yu, STOC 2020](https://arxiv.org/abs/2004.05738)). Bốn thập kỷ sau đó không thay đổi bậc thời gian mà thay đổi ba thứ khác. Thứ nhất là độ đơn giản: nhóm Berkman–Vishkin làm năm 1989–1993, rồi Bender & Farach-Colton năm 2000, và chính hai tác giả này viết rằng họ *không* trình bày thuật toán mới ([preprint Bender & Farach-Colton](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf)). Thứ hai là tính trực tiếp: Fischer & Heun (2006) bỏ đường vòng qua Euler tour. Thứ ba là bộ nhớ: từ O(n) word (khoảng n log n bit) xuống 4n+o(n) bit (Sadakane 2007), rồi 2n+o(n) bit mà không cần đọc mảng. **Encoding 2n+o(n) đầu tiên là Fischer, LATIN 2010, không phải ESCAPE 2007** ([Brodal, Davoodi & Rao, ESA 2010](https://cs.au.dk/~gerth/papers/esa10.pdf)). Các cận dưới hiện đã gần khít. Encoding cần 2n − Θ(log n) bit, và nếu truy vấn chạy trong thời gian hằng thì phần dư n/polylog n là bắt buộc. Indexing dùng n/c bit phụ thì phải trả Ω(c) thời gian. RMQ động không thể nhanh hơn Θ(log n/log log n) cho mỗi thao tác ([Alstrup, Husfeldt & Rauhe, BRICS RS-98-7](https://www.brics.dk/RS/98/7/BRICS-RS-98-7.pdf)). Trên máy thật, Big-O không chọn được người thắng. Benchmark tự chạy trên i5-13500HX ở n = 2^20 cho thấy:

| Cấu trúc | Truy vấn | Xây | Bộ nhớ phụ |
|---|---:|---:|---:|
| Sparse Table | ≈9,8 ns | 31 ms | 76 byte/phần tử |
| Block-bitmask O(n)/O(1) | ≈18 ns | 8 ms | 8,8 byte/phần tử |

Block-bitmask là kỹ thuật của cộng đồng lập trình thi đấu và chưa có paper bình duyệt nào mô tả. Khi số truy vấn tăng từ 1 đến 10^7, cấu trúc nhanh nhất về tổng thời gian lần lượt là Scan, Segment Tree, block-bitmask rồi Sparse Table. Các cài đặt succinct khoảng 2,1 bit/phần tử trả lời mỗi truy vấn trong 1–3 µs ([Ferrada & Navarro](https://www.dcc.uchile.cl/~gnavarro/ps/jda16.pdf)). Vì vậy seminar 30–40 phút nên kể câu chuyện ba lớp: lý thuyết đã đóng, kỹ thuật vẫn mở, ứng dụng nằm ở chuỗi và cây. Người trình bày cũng cần tránh khoảng hai mươi lỗi trích dẫn và diễn giải phổ biến được liệt kê ở mục 11.

## 1. Phát biểu bài toán: trả về vị trí, chọn bên trái khi hòa, đếm bộ nhớ bằng bit hay word

Cho mảng tĩnh A[1..n] trên một tập có thứ tự toàn phần. Truy vấn RMQ_A(i, j), với 1 ≤ i ≤ j ≤ n, trả về **chỉ số** của phần tử nhỏ nhất trong A[i..j]; giá trị chỉ là A[RMQ_A(i, j)]. Văn liệu cố định quy ước hòa bằng thứ tự A[i] ≺ A[j] khi A[i] < A[j], hoặc A[i] = A[j] và i < j. Quy ước này làm Cartesian tree trở thành "canonical" và đáp án là duy nhất: luôn lấy vị trí cực tiểu trái nhất ([Fischer, luận án LMU 2007, Def. 3.1](https://edoc.ub.uni-muenchen.de/7505/1/Fischer_Johannes.pdf)). Liu và Yu dùng cùng quy ước khi chứng minh cận dưới ([Liu & Yu, arXiv:2004.05738](https://arxiv.org/abs/2004.05738)). Thư viện thi đấu thường làm khác: KACTL trả **giá trị** trên nửa khoảng [a, b) bằng một Sparse Table ghi nguồn là "Folklore" ([KACTL RMQ.h](https://github.com/kth-competitive-programming/kactl/blob/main/content/data-structures/RMQ.h)). Vì vậy slide đầu tiên phải ghi rõ ba điều: đoạn đóng hay nửa mở, chỉ số từ 0 hay từ 1, trả min hay argmin. Chi phí được ký hiệu ⟨f(n), g(n)⟩, với f(n) là tiền xử lý và g(n) là truy vấn, theo cách viết của Bender & Farach-Colton. Họ mở bài bằng chính hai cách cực đoan. Không tiền xử lý thì mỗi truy vấn quét O(n). Lập bảng mọi đoạn bằng quy hoạch động thì được ⟨O(n²), O(1)⟩ ([Bender & Farach-Colton, preprint 2000](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf)).

Câu hỏi đầu tiên khán giả hay đặt ra là: tại sao không dùng prefix-min như prefix-sum? Lý do là min không có phép nghịch đảo tương tự phép trừ. Hai mảng [1, 5, 4] và [1, 2, 4] có cùng prefix-min [1, 1, 1], nhưng min của đoạn [2, 2] lần lượt là 5 và 2 (ví dụ tự xây dựng). Phản ví dụ này dẫn tự nhiên đến các lời giải nằm giữa hai cực trị, và đến điều kiện lũy đẳng ở mục 3.

Mọi kết quả kinh điển đều ngầm định một mô hình máy. Fischer và Heun nêu thẳng rằng họ làm việc trên word-RAM, "where it is assumed that we can do arithmetic and logical operations on w-bit wide words in O(1) time, and w = Ω(lg n)". Đây cũng là mô hình của mọi lược đồ LCA và RMQ mà họ trích dẫn ([Fischer & Heun, SICOMP 2011, preprint](https://ae.iti.kit.edu/1810.php)). Harel và Tarjan cần máy RAM chi phí đều với ít nhất Ω(log n) bit mỗi word. Trên pointer machine, họ chứng minh mọi thuật toán cần Ω(log log n) cho mỗi truy vấn LCA ([Harel & Tarjan, SIAM J. Comput. 1984](https://doi.org/10.1137/0213024)). Liu và Yu giải thích vì sao giả định w = Ω(log n) là chuẩn: đáp án là một chỉ số, nên cần log n bit để viết ra. Mô hình cell-probe mà họ dùng để chứng minh cận dưới chỉ đếm số lần truy cập bộ nhớ ([Liu & Yu](https://arxiv.org/abs/2004.05738)).

Hệ quả là "O(n) bộ nhớ" trong các paper cổ điển có nghĩa là **O(n) word = O(n log n) bit**. Fischer–Heun phê phán chính điểm này: các lời giải từ Gabow et al. trở đi tốn "O(n lg n) bits, as they store O(n) words occupying ⌈lg n⌉ bits each" ([Fischer & Heun, SICOMP 2011](https://ae.iti.kit.edu/1810.php)). Từ đó có hai mô hình bộ nhớ cần phân biệt. Lược đồ **systematic (indexing)** giữ nguyên A và đọc A khi truy vấn, nên chỉ đếm số bit *thêm vào* A. Lược đồ **non-systematic (encoding)** bỏ A đi và phải tự trả lời mà không cần A. Hai thuật ngữ này Fischer–Heun lấy theo Gál và Miltersen ([Fischer & Heun, SICOMP 2011, §1.1](https://ae.iti.kit.edu/1810.php)). Encoding không chỉ là bài tập lý thuyết. RMQ thường chạy trên mảng LCP được lưu dạng nén, nơi đọc một phần tử tốn Ω(lg^ε n), nên một lược đồ systematic sẽ mất tính O(1) ([Fischer & Heun, SICOMP 2011](https://ae.iti.kit.edu/1810.php)).

Ví dụ xuyên suốt cho seminar (tự xây dựng, đã kiểm bằng script) là A = [5, 2, 6, 3, 1, 7, 4, 8] với chỉ số 1..8. Khi đó RMQ(2, 7) = 5 (giá trị 1), RMQ(1, 4) = 2 (giá trị 2) và RMQ(6, 8) = 7 (giá trị 4). Một phép tính bộ nhớ đơn giản giúp khán giả cảm nhận khoảng cách giữa hai đơn vị. Với n = 10^6, một word 32 bit mỗi phần tử là 4 MB, còn 2n bit chỉ là 250.000 byte. Tuy nhiên 2n bit đó chỉ mã hóa *vị trí* cực tiểu, không lưu lại các giá trị; muốn trả về giá trị thì vẫn phải giữ A. Cuối cùng, "RMQ" là cả một họ bài toán: tĩnh, động (có cập nhật), offline (biết trước mọi truy vấn), cửa sổ trượt (độ rộng cố định) và hai chiều. Mỗi biến thể có giới hạn tối ưu riêng, được xét ở mục 6.

## 2. Lịch sử: truy vấn O(1) có từ 1984, phần còn lại là đơn giản hóa và nén

Lời giải ⟨O(n), O(1)⟩ đầu tiên thuộc về **Gabow, Bentley và Tarjan (STOC 1984)**. Fischer và Heun viết rằng "it was noted already a quarter of a century ago [Gabow et al. 1984] that a scheme of size O(n) words suffices to answer RMQs in optimal constant time". Cách làm là quy RMQ thành LCA trên Cartesian tree của Vuillemin (1980), rồi dùng một lược đồ LCA tuyến tính đã có từ trước của Harel–Tarjan ([Fischer & Heun, SICOMP 2011](https://ae.iti.kit.edu/1810.php)). Fischer gọi đó là "the historically first such scheme" ([Fischer, arXiv:0812.2775](https://arxiv.org/abs/0812.2775)). Liu–Yu cũng ghi lời giải cổ điển O(n) bộ nhớ, O(1) truy vấn là của "Gabow, Bentley, Tarjan [GBT84] and Harel, Tarjan [HT84]" ([Liu & Yu](https://arxiv.org/abs/2004.05738)).

Luận án của Fischer bổ sung hai chi tiết. GBT cũng là người đầu tiên nối Euler tour của cây với RMQ trên mảng độ sâu, khiến hai bài toán trở thành "linearly equivalent". Nhưng vì chưa giải trực tiếp được RMQ, họ không dùng RMQ để cải thiện LCA. Bước đó thuộc về Berkman và Vishkin (1993), những người nhận ra Euler tour sinh ra trường hợp ±1RMQ và giải trực tiếp trường hợp này ([Fischer, luận án, §3.3.1](https://edoc.ub.uni-muenchen.de/7505/1/Fischer_Johannes.pdf)). Người trình bày cần biết rằng bộ ghi chú chưa đọc được toàn văn GBT 1984. Mọi chi tiết về GBT ở đây dựa trên cách Fischer và Fischer–Heun mô tả lại.

Thuật toán LCA → ±1RMQ có hai dòng ghi công, và cả hai đều dẫn về nhóm Vishkin năm 1989. Bender & Farach-Colton viết: "Our point is not to present a new algorithm. Indeed, we have already noted that this algorithm has appeared as a PRAM algorithm before". Họ gọi thuật toán của mình là "a sequentialization" của thuật toán PRAM trong bài "Highly parallelizable problems" (STOC 1989). Preprint của họ chỉ trích ba tài liệu và không nhắc đến GBT hay Vuillemin ([Bender & Farach-Colton, preprint](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf)). Fischer thì ghi công cho "Berkman–Vishkin algorithm" và nói ông theo cách trình bày của Bender et al. (2005), "who rediscovered and simplified the algorithm" ([Fischer, luận án, §3.4.1](https://edoc.ub.uni-muenchen.de/7505/1/Fischer_Johannes.pdf)). Cách nói an toàn trên slide là "Berkman, Vishkin và cộng sự (1989–1993)". Danh sách tác giả của bài STOC 1989 vẫn **chưa ngã ngũ**. Crossref và danh mục tham khảo của Brodal–Davoodi–Rao ghi bốn người (Berkman, Galil, Schieber, Vishkin), còn Bender & Farach-Colton ghi năm người, thêm D. Breslauer ([DOI 10.1145/73007.73036](https://doi.org/10.1145/73007.73036)).

Nhánh succinct diễn ra theo hai bước rất dễ bị trộn lẫn. Trước 2007, mọi lược đồ O(1) đều dùng O(n lg n) bit. Encoding duy nhất là của **Sadakane (J. Discrete Algorithms 2007) với 4n + o(n) bit**, xây trên dãy ngoặc cân bằng của Cartesian tree cộng thêm n lá "giả", và cần O(n lg n) bit trong lúc xây ([Fischer & Heun, SICOMP 2011, §1.1.2](https://ae.iti.kit.edu/1810.php)). **Fischer & Heun (ESCAPE 2007)** đạt 2n + o(n) bit, nhưng đó là lược đồ *systematic*: bảng của Brodal–Davoodi–Rao ghi kích thước "2n+o(n)+|A|" và đánh dấu nó đọc A ([Brodal, Davoodi & Rao, ESA 2010](https://cs.au.dk/~gerth/papers/esa10.pdf)). Bài ESCAPE còn tuyên bố một cận dưới 2n − o(n) bit cho phần bộ nhớ thêm, trong "min-probe model". Về sau, chính Fischer–Heun viết trong chú thích 3 của bài SICOMP rằng cận dưới đó "turned out to be wrong, as was kindly pointed out to the authors by S. Srinivasa Rao (personal communication, November 2007)". Brodal–Davoodi–Rao bác bỏ nó bằng Định lý 2 của họ ([Fischer & Heun, SICOMP 2011](https://ae.iti.kit.edu/1810.php); [Brodal, Davoodi & Rao](https://cs.au.dk/~gerth/papers/esa10.pdf)).

Encoding 2n + o(n) bit đầu tiên, không đọc A, là **Fischer, LATIN 2010** (bản arXiv tháng 12/2008). Nó dựa trên một cấu trúc mới tên "2d-Min-Heap" thay cho Cartesian tree, và xây trong thời gian tuyến tính với chỉ n + o(n) bit phụ ([Fischer, arXiv:0812.2775](https://arxiv.org/abs/0812.2775)). Bản tạp chí **Fischer & Heun, SICOMP 40(2), 2011** hợp nhất các bài CPM 2006, ESCAPE 2007, DCC 2008 và LATIN 2010. Kết quả của nó gồm:

| Kết quả trong SICOMP 2011 | Bộ nhớ | Truy vấn |
|---|---|---|
| Encoding (Thm 5.8) | 2n + O(n lg lg n/lg n) bit | O(1) |
| Encoding ghép với ±1rmq của Sadakane–Navarro (Cor. 5.9) | 2n + O(n/polylg n) bit | O(1) |
| Systematic | 2n/c(n) − Θ(n lg lg n/(c(n) lg n)) bit trên A | O(c(n)) |

Mọi cấu trúc trong bài "can be constructed in linear time and almost in-place" ([Fischer & Heun, SICOMP 2011](https://ae.iti.kit.edu/1810.php)). Vì vậy câu của Ferrada–Navarro, rằng SICOMP 2011 là cấu trúc 2n + o(n) bit đầu tiên không đọc A, nhất quán với dòng thời gian này ([Ferrada & Navarro, preprint](https://www.dcc.uchile.cl/~gnavarro/ps/jda16.pdf)). Còn cách trích gộp "[FH07, FH11]" của Liu–Yu không có nghĩa là ESCAPE 2007 đã là encoding.

Sau 2011, lý thuyết chỉ còn tinh chỉnh hằng số và các số hạng bậc thấp. Davoodi, Navarro, Raman và Rao (2014) đạt cùng mức 2n + o(n) "in a more natural way", mã hóa mảng ngẫu nhiên trong 1,919n + o(n) bit kỳ vọng, và giải range top-2 trong 3,272n + o(n) bit ([Phil. Trans. R. Soc. A](https://doi.org/10.1098/rsta.2013.0131)). Munro và Wild đạt mức tối ưu trung bình 1,736n + o(n) bit cho RMQ ngẫu nhiên ([arXiv:1903.02533](https://arxiv.org/abs/1903.02533)). Hypersuccinct trees (ESA 2021) giữ cả 2n + o(n) trong trường hợp tệ nhất lẫn 1,736n + o(n) trung bình, với truy vấn hằng ([arXiv:2104.13457](https://arxiv.org/abs/2104.13457)). Theo Liu–Yu, cận trên tốt nhất hiện nay là 2n + n/(log n/t)^{Ω(t)} + Õ(n^{3/4}) bit với truy vấn O(t) ([Liu & Yu](https://arxiv.org/abs/2004.05738)).

| Năm | Kết quả | ⟨Tiền xử lý, truy vấn⟩ | Bộ nhớ / mô hình | Nguồn |
|---|---|---|---|---|
| 1980 | Vuillemin định nghĩa Cartesian tree | — | — | [CACM 23(4)](https://doi.org/10.1145/358841.358852) |
| 1984 | Harel–Tarjan: LCA trên cây tĩnh; Ω(log log n) trên pointer machine | ⟨O(n), O(1)⟩ | O(n) word, RAM | [SICOMP 13(2)](https://doi.org/10.1137/0213024) |
| 1984 | Gabow–Bentley–Tarjan: RMQ → LCA qua Cartesian tree, **RMQ O(n)/O(1) đầu tiên** | ⟨O(n), O(1)⟩ | O(n) word | [STOC'84](https://doi.org/10.1145/800057.808675) |
| 1988 | Schieber–Vishkin: LCA đơn giản hơn, song song hóa được trên EREW PRAM | ⟨O(n), O(1)⟩ | O(n) word | [SICOMP 17(6)](https://doi.org/10.1137/0217079) |
| 1989–1993 | Nhóm STOC'89 và Berkman–Vishkin (recursive star-tree): LCA → ±1RMQ | ⟨O(n), O(1)⟩; PRAM O(α(n)) | O(n) word | [SICOMP 22(2)](https://doi.org/10.1137/0222017) |
| 2000 | Bender–Farach-Colton: tuần tự hóa, khối ½ log n | ⟨O(n), O(1)⟩ | O(n) word | [LATIN 2000](https://doi.org/10.1007/10719839_9) |
| 2006 | Fischer–Heun CPM: RMQ trực tiếp, không qua Euler tour | ⟨O(n), O(1)⟩ | O(n) word | [CPM 2006](https://doi.org/10.1007/11780441_5) |
| 2007 | Sadakane: encoding đầu tiên | ⟨O(n), O(1)⟩ | 4n+o(n) bit, không đọc A | [JDA 5(1)](https://doi.org/10.1016/j.jda.2006.03.011) |
| 2007 | Fischer–Heun ESCAPE: systematic; cận dưới 2n−o(n) **đã bị rút lại** | ⟨O(n), O(1)⟩ | 2n+o(n) bit + \|A\| | [ESCAPE 2007](https://doi.org/10.1007/978-3-540-74450-4_41) |
| 2010 | Fischer LATIN: **encoding 2n+o(n) đầu tiên** (2d-Min-Heap) | ⟨O(n), O(1)⟩ | 2n+o(n) bit | [arXiv:0812.2775](https://arxiv.org/abs/0812.2775) |
| 2010/2012 | Brodal–Davoodi–Rao: cận dưới indexing Ω(c) với n/c bit, khít ở 1D | — | indexing | [ESA 2010](https://cs.au.dk/~gerth/papers/esa10.pdf) |
| 2011 | Fischer–Heun SICOMP: bản hợp nhất | ⟨O(n), O(1)⟩ | 2n+O(n lg lg n/lg n) bit | [SICOMP 40(2)](https://doi.org/10.1137/090779759) |
| 2014 | Davoodi–Navarro–Raman–Rao; Navarro–Sadakane (range min-max tree) | ⟨O(n), O(1)⟩ | 2n+o(n); 1,919n kỳ vọng | [Phil. Trans. A](https://doi.org/10.1098/rsta.2013.0131); [TALG 10(3)](https://doi.org/10.1145/2601073) |
| 2016/2017 | Ferrada–Navarro: cài đặt BP khoảng 2,1 bit/phần tử | 1–3 µs/truy vấn | encoding thực tế | [JDA 43](https://doi.org/10.1016/j.jda.2016.09.002) |
| 2019 | Munro–Wild: tối ưu trung bình | O(1) | 1,736n+o(n) bit trung bình | [arXiv:1903.02533](https://arxiv.org/abs/1903.02533) |
| 2020 | Liu–Yu: cận dưới đầu tiên cho succinct RMQ | — | phần dư ≥ n/(log n)^{Õ(t²)} | [STOC 2020](https://doi.org/10.1145/3357713.3384260) |
| 2024–2026 | RTXRMQ, GPU-RMQ trên GPU; Bille et al. (RMQ động trên ultra-wide word RAM); Liu (cận dưới tốt hơn, "to appear" ở SODA 2027) | — | — | [FGCS 157](https://doi.org/10.1016/j.future.2024.03.040); [arXiv:2604.01811](https://arxiv.org/abs/2604.01811); [arXiv:2411.16281](https://arxiv.org/abs/2411.16281); [arXiv:2111.02318](https://arxiv.org/abs/2111.02318) |

Câu ghi công an toàn cho slide: "RMQ O(1) với tiền xử lý tuyến tính đã có từ 1984 (Gabow–Bentley–Tarjan kết hợp Harel–Tarjan). Berkman–Vishkin và cộng sự (1989–1993) cùng Bender–Farach-Colton (2000) làm nó đơn giản. Fischer–Heun (2006–2011) làm nó trực tiếp và succinct."

## 3. Nền tảng lý thuyết: ba ý tưởng ghép thành lời giải O(n)/O(1)

### Sparse Table chồng hai đoạn được vì min lũy đẳng

Sparse Table lưu M[i, k] = argmin A[i..i+2^k−1]. Bảng được điền bằng quy hoạch động, lấy M[i, k] từ M[i, k−1] và M[i+2^{k−1}, k−1], trong O(n log n). Với L = j − i + 1 và k = ⌊log₂ L⌋, truy vấn so sánh M[i, k] với M[j − 2^k + 1, k]. Hai đoạn dài 2^k này nằm trong [i, j] và phủ kín nó vì 2^k ≤ L < 2^{k+1}, nên ta được ⟨O(n log n), O(1)⟩ ([Bender & Farach-Colton](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf)).

Có hai chi tiết đáng nói trên lớp. Thứ nhất, bước tính ⌊log₂ L⌋ chính là phép "finding the most significant bit of a word". Bender & Farach-Colton nhấn mạnh phải có một phép như vậy vì cận Ω(log log n) của Harel–Tarjan trên pointer machine, và phép này có lời giải tra bảng rất nhanh ([Bender & Farach-Colton](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf)). Trong C++, đó là `31 - __builtin_clz(L)` hoặc một mảng lg tiền tính; không dùng `log2()` số thực. Thứ hai, mỗi truy vấn chỉ gồm "four memory accesses (two to A and two to M), a comparison, and a log-calculation on integers which corresponds to counting leading zero bits". Đây là lý do Sparse Table rất nhanh trên máy thật ([Baumstark et al., SEA 2017](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.SEA.2017.12)).

Hai đoạn chồng lên nhau là hợp lệ vì min **lũy đẳng**: min(x, x) = x. Với tổng thì không được. cp-algorithms ghi rõ rằng với cách này "it is not possible to answer range sum queries", và chỉ sang Disjoint Sparse Table hoặc Sqrt Tree cho phép toán kết hợp bất kỳ ([cp-algorithms: Sparse Table](https://cp-algorithms.com/data_structures/sparse-table.html)). Với mảng ví dụ, các tầng là [5,2,6,3,1,7,4,8], [2,2,3,1,1,4,4], [2,1,1,1,1] và [1]. Truy vấn [2,7] dài 6 nên k = 2; ta ghép hai đoạn [2,5] và [4,7], cả hai đều có min là 1 (tự tính, đã kiểm).

### Cartesian tree: hình dạng cây quyết định mọi đáp án

Cartesian tree của A có gốc là phần tử nhỏ nhất, còn hai cây con là Cartesian tree của mảng con bên trái và bên phải. Đây là định nghĩa của Vuillemin (1980) ([Fischer, luận án](https://edoc.ub.uni-muenchen.de/7505/1/Fischer_Johannes.pdf); [Vuillemin, CACM 1980](https://doi.org/10.1145/358841.358852)). Định nghĩa đệ quy gợi ý chi phí O(n²), nhưng cây xây được trong O(n). Khi thêm phần tử i+1, ta leo ngược đường phải nhất (thực chất là một stack) cho đến vị trí mà i+1 thuộc về. "Each comparison either adds an element to the rightmost path or removes one, and each node can only join the rightmost path and leave it once", nên tổng chi phí là O(n) ([Bender & Farach-Colton](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf)). Fischer ghi công thuật toán xây này cho Gabow et al. 1984 ([Fischer, luận án, §3.2](https://edoc.ub.uni-muenchen.de/7505/1/Fischer_Johannes.pdf)).

Bổ đề then chốt là RMQ_A(i, j) = LCA_C(i, j). Theo Bender & Farach-Colton, LCA k "is the first node that separates i and j … it is between them because it splits them, and it is minimal because it is the first element to do so" ([Bender & Farach-Colton, Lemma 7](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf)). Với mảng ví dụ, gốc là vị trí 5 (giá trị 1). Cây con trái có gốc 2, với con trái 1 và con phải 4; nút 4 lại có con trái 3. Cây con phải có gốc 7, với hai con 6 và 8. Nút 2 và nút 7 nằm ở hai phía của gốc nên LCA của chúng là 5 = RMQ(2,7). Nút 1 và nút 4 cùng nằm dưới nút 2 nên LCA là 2 = RMQ(1,4) (tự tính, đã kiểm). Ý nghĩa sâu hơn là mọi đáp án RMQ chỉ phụ thuộc vào hình dạng cây, không phụ thuộc vào giá trị cụ thể. Đây là hạt giống của cả cận dưới 2n bit (mục 4) lẫn kỹ thuật phân loại khối ở dưới đây.

### Hai phép quy dẫn RMQ ↔ LCA

Chiều LCA → RMQ dùng Euler tour. DFS ghi lại một nút mỗi lần đi qua một cạnh; mỗi cạnh trong n−1 cạnh được đi hai lần, nên ta có E[1..2n−1]. Gọi L[i] là độ sâu của E[i] và R[u] là lần xuất hiện đầu tiên của u. Khi đó LCA_T(u, v) = E[RMQ_L(R[u], R[v])], vì LCA là "the shallowest node encountered between the visits to u and to v during a depth first search traversal" ([Bender & Farach-Colton, Lemma 3, Observation 4](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf)). Chi phí chuyển đổi là ⟨f(2n−1) + O(n), g(2n−1) + O(1)⟩. Hai phần tử liên tiếp của L chênh nhau đúng ±1, "because, for any two adjacent elements in an Euler tour, one is always the parent of the other" ([Bender & Farach-Colton](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf)).

Chiều RMQ → LCA chính là Cartesian tree ở trên. Cả hai chiều đều tuyến tính nên hai bài toán "linearly equivalent". Cái giá phải trả là "the doubling of the input" khi đi từ A sang mảng độ sâu dài 2n−1 ([Fischer, luận án, §3.4.1](https://edoc.ub.uni-muenchen.de/7505/1/Fischer_Johannes.pdf)). Lấy ví dụ cây 0→{1,2}, 1→{3,4}, 2→{5} (chỉ số từ 0; ví dụ tự dựng, đã kiểm bằng script). Ta có E = [0,1,3,1,4,1,0,2,5,2,0] và D = [0,1,2,1,2,1,0,1,2,1,0]. Suy ra LCA(3,4) = E[argmin D[2..4]] = 1 và LCA(4,5) = E[argmin D[4..8]] = 0.

Pipeline đầy đủ của Bender–Farach-Colton cho RMQ tổng quát là: mảng → Cartesian tree → mảng độ sâu của Euler tour → ±1RMQ. Đây không phải lập luận vòng, vì ±1RMQ được giải độc lập.

### Chia khối và tra bảng: ±1RMQ và lối tắt trực tiếp của Fischer–Heun

Bender & Farach-Colton chia mảng ±1 thành các khối kích thước (log n)/2. Họ lập mảng A′[1..2n/log n] chứa cực tiểu của từng khối và chạy Sparse Table trên A′. Một truy vấn tách thành ba phần: hậu tố của khối chứa i, các khối ở giữa, và tiền tố của khối chứa j. Trừ mỗi phần tử cho phần tử đầu khối ("normalization") không làm đổi đáp án, nên mỗi khối được đặc tả bằng một vector ±1 dài ½ log n − 1. Có 2^{(½ log n)−1} = O(√n) loại như vậy; mỗi loại lưu O(log² n) đáp án nội khối, tổng cộng O(√n log² n) = o(n) ([Bender & Farach-Colton, Observation 5, Lemma 6](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf)).

Fischer & Heun bỏ đường vòng qua Euler tour bằng cách phân loại trực tiếp các khối của mảng *tổng quát* theo hình dạng Cartesian tree. Bổ đề 3.1 của họ phát biểu: với hai khối cùng kích thước s, rmq_{B_x}(i, j) = rmq_{B_y}(i, j) với mọi i ≤ j **khi và chỉ khi** hai khối có cùng canonical Cartesian tree. Vì vậy chỉ cần C_s = C(2s, s)/(s+1) loại ([Fischer & Heun, SICOMP 2011, §3.2](https://ae.iti.kit.edu/1810.php)). Họ chọn khối s = (lg n)/4. Chú thích của họ nói mọi s = lg n/(2+δ) với δ > 0 hằng đều dùng được, và họ chọn δ = 2 cho gọn. Hằng số nhỏ hơn ½ là vì số Catalan tăng như 4^s chứ không như 2^s: C_s < 4^s = 2^{(lg n)/2} = √n ([Fischer & Heun, §3.1](https://ae.iti.kit.edu/1810.php)).

Loại của mỗi khối được tính trong O(s) mà không cần dựng cây. Algorithm 1 của họ mô phỏng việc xây Cartesian tree bằng stack, và mỗi lần pop thì cộng dồn một **ballot number** C_{pq}. Các số này thỏa C_{00} = 1, C_{pq} = C_{p(q−1)} + C_{(p−1)q} khi 0 ≤ p ≤ q ≠ 0, và có dạng đóng C_{pq} = ((q−p+1)/(q+1))·C(p+q, p), nên C_{ss} = C_s. Kết quả là một số trong [0, C_s − 1] ([Fischer & Heun, Alg. 1, Lemma 3.2](https://ae.iti.kit.edu/1810.php)). Luận án ghi công ballot number cho Knuth ([Fischer, luận án, §3.5.1](https://edoc.ub.uni-muenchen.de/7505/1/Fischer_Johannes.pdf)). Bảng tra có tối đa C_s ≤ 4^s/s^{3/2} hàng. Nhờ mẹo của Alstrup et al. (một vector s bit cho mỗi vị trí bắt đầu), bảng chỉ còn O(√n lg n) = o(n/lg n) bit. Truy vấn ngoài khối dùng lược đồ hai tầng của Sadakane, với super-block gồm s′ = s² phần tử ([Fischer & Heun, §3.3–3.4](https://ae.iti.kit.edu/1810.php)).

Theo luận án, bản cài đặt ứng với bài CPM 2006 là "a straightforward combination of the Berkman-Vishkin algorithm with our new preprocessing scheme for short queries", dùng khối s = log n/4. Nó không cần dựng Cartesian tree trung gian, "thereby also avoiding the input doubling" ([Fischer, luận án, §3.8](https://edoc.ub.uni-muenchen.de/7505/1/Fischer_Johannes.pdf)). Stanford CS166 dạy Cartesian tree và giao bài CPM 2006 làm bài đọc ([Stanford CS166, RMQ Part II](https://web.stanford.edu/class/cs166/lectures/01/)). Nhiều bài giảng mã hóa chuỗi push/pop thành một số 2s bit thay cho ballot number. Đó là cách đơn giản hóa để dạy, không phải phương pháp của paper; bộ ghi chú chưa kiểm cách mã hóa cụ thể của CS166.

Câu nên nói trên sân khấu: "Không lưu đáp án cho từng khối; chỉ lưu một lần cho mỗi *kiểu* khối, và kiểu khối chính là hình dạng Cartesian tree." Phép tính hai dòng, 2^{½ log n} = √n cho ±1RMQ và 4^{¼ log n} = √n cho Fischer–Heun, giải thích vì sao hằng số ½ biến thành ¼.

### Áp dụng: từ công thức đến bài nộp

Bài CSES 1647 Static Range Minimum Queries dùng Sparse Table với tổng chi phí O(n log n + q) ([CSES 1647](https://cses.fi/problemset/task/1647)). Bài CSES 1688 Company Queries II dùng Euler tour cộng Sparse Table trên mảng độ sâu: xây O(n log n), mỗi LCA O(1) ([CSES 1688](https://cses.fi/problemset/task/1688)). Bài CSES 1135 Distance Queries tính khoảng cách bằng depth[u] + depth[v] − 2·depth[LCA(u,v)] ([CSES 1135](https://cses.fi/problemset/task/1135)). Có một cảnh báo nên đưa lên slide. Euler-tour RMQ cho ra LCA, nhưng **không** cho min/max trọng số trên đường đi. Các bài như SPOJ DISQUERY và VNOJ LUBENICA cần binary lifting kèm bảng min/max, hoặc HLD ([SPOJ DISQUERY](https://www.spoj.com/problems/DISQUERY/); [VNOJ LUBENICA](https://oj.vnoi.info/problem/lubenica)).

## 4. Tối ưu đến giới hạn: bốn cận dưới và kỹ thuật block-bitmask

### Bốn mô hình cho bốn cận dưới khác nhau

| Mô hình | Cận dưới | Cận trên khớp | Nguồn |
|---|---|---|---|
| Encoding (không đọc A) | log₂ C_n = 2n − Θ(log n) bit; viết chính xác là 2n − 1,5 log n + … | 2n + o(n) bit, O(1) | [Fischer & Heun](https://ae.iti.kit.edu/1810.php); [Liu](https://arxiv.org/abs/2111.02318) |
| Indexing (đọc A) | O(n/c) bit phụ ⇒ Ω(c) thời gian truy vấn, ở mọi số chiều | O(n/c) bit, O(c) truy vấn, xây O(n) (khít ở 1D) | [Brodal, Davoodi & Rao](https://cs.au.dk/~gerth/papers/esa10.pdf) |
| Succinct, cell-probe, w ≥ Ω(log n) | 2n + r bit với truy vấn t ⇒ r ≥ n/w^{O(t² log² t)} | 2n + n/(log n/t)^{Ω(t)} + Õ(n^{3/4}) | [Liu & Yu](https://arxiv.org/abs/2004.05738) |
| Động, cell-probe, w = Θ(log n) | Ω(log n/log log n) mỗi thao tác khi update polylog | Θ(log n/log log n) | [AHR 1998](https://www.brics.dk/RS/98/7/BRICS-RS-98-7.pdf); [BDR WADS 2011](https://cs.au.dk/~gerth/papers/wads11.pdf) |

Cận encoding là lập luận đẹp nhất để đưa lên lớp. Fischer–Heun viết: "any scheme for RMQs allows to reconstruct the Cartesian Tree by iteratively querying the scheme for the minimum". Vì mọi cây nhị phân đều là Cartesian tree của một mảng nào đó, "any scheme must use at least lg(C(2n,n)/(n+1)) = 2n − Θ(lg n) bits" ([Fischer & Heun, §1.1.2](https://ae.iti.kit.edu/1810.php)). Liu–Yu phát biểu cùng ý: thông tin duy nhất cần để trả lời mọi RMQ là Cartesian tree ([Liu & Yu](https://arxiv.org/abs/2004.05738)). Dùng công thức Stirling C_s = 4^s/(√π·s^{3/2})·(1 + O(1/s)) ([Fischer & Heun, §3.4](https://ae.iti.kit.edu/1810.php)), ta có log₂ C_n ≈ 2n − 1,5 log₂ n − 0,83. Với n = 1000, công thức này cho 1984,23 bit, còn giá trị chính xác là 1984,22 bit (tự tính bằng script). Cận mới của Liu cũng viết tường minh số hạng −1,5 log n ([arXiv:2111.02318](https://arxiv.org/abs/2111.02318)). Trên mảng ngẫu nhiên, lượng thông tin kỳ vọng chỉ khoảng 1,736n bit, và Munro–Wild đạt đúng mức này trung bình ([arXiv:1903.02533](https://arxiv.org/abs/1903.02533)).

Cận indexing của Brodal–Davoodi–Rao có chứng minh bằng nguyên lý chuồng bồ câu, trong mô hình cell-probe không đồng nhất. Xét các mảng 0/1 có đúng một số 0 trong mỗi khối kích thước c; có c^{n/c} mảng như vậy. Nhưng chỉ có 2^{n/c} chỉ mục n/c bit khác nhau. Vì vậy một chỉ mục phải dùng chung cho (c/2)^{n/c} mảng, và khi đó có truy vấn trên một khối cần Ω(c) lần đọc A. Cận trên khớp với nó chia A thành n/c khối, xây một encoding O(n/c) bit trên các cực tiểu khối, và quét O(1) khối ([Brodal, Davoodi & Rao, §2.1, Thm 2](https://cs.au.dk/~gerth/papers/esa10.pdf)). Fischer–Heun dẫn kết quả này để khẳng định rằng đánh đổi 2n/c(n) bit của họ "is optimal" ([Fischer & Heun](https://ae.iti.kit.edu/1810.php)). Bài học cho khán giả: khi được đọc A, bộ nhớ phụ có thể thấp hơn 2n bit rất nhiều. Cận 2n chỉ áp dụng khi không có A, và nhầm lẫn giữa hai mô hình này chính là nguyên nhân của cận dưới bị rút lại ở ESCAPE 2007.

Cận cell-probe cho succinct RMQ là của Liu–Yu (STOC 2020), được mô tả là "the first lower bound for this problem". Định lý 1 phát biểu: mọi cấu trúc dùng 2n + r bit với truy vấn t phải có r ≥ n/w^{O(t² log² t)}, trong mô hình cell-probe với w ≥ Ω(log n). Hệ quả là truy vấn hằng đòi hỏi bộ nhớ 2n + n/poly log n ([Liu & Yu](https://arxiv.org/abs/2004.05738); [STOC DOI](https://doi.org/10.1145/3357713.3384260)). Kỹ thuật chứng minh lấy cảm hứng từ cận succinct-rank của Pătraşcu–Viola. Phương pháp cell sampling chuẩn thất bại ở đây, vì đáp án của các truy vấn ngẫu nhiên gần như không xác định được dữ liệu vào ([Liu & Yu, §1.2–1.3](https://arxiv.org/abs/2004.05738)). Liu (arXiv 2111.02318, v3) cải thiện số mũ xuống O(t log² t), "leaving only a polylogarithmic gap in query time from the known upper bound". Bài được ghi là "to appear" ở SODA 2027, tức **chưa xuất bản** tính đến 31/10/2026 ([arXiv:2111.02318](https://arxiv.org/abs/2111.02318)).

Với RMQ động, cận dưới đúng là của **Alstrup–Husfeldt–Rauhe (FOCS 1998)**. Với word size b, họ chứng minh t_q = Ω(log n/log(t_u·b·log n)); "for logarithmic word size the bound implies a lower bound of Θ(log n/log log n) per operation". Mệnh đề 2 của họ cho "priority searching", tức max(x) = max{p(y) | y ≤ x} với insert và delete: "Every data structure for priority searching requires time Ω(log n/log log n) per operation" ([BRICS RS-98-7](https://www.brics.dk/RS/98/7/BRICS-RS-98-7.pdf)). Priority searching chính là RMQ động bị giới hạn ở truy vấn tiền tố, với max thay cho min; xóa một điểm tương đương gán giá trị +∞. Bài tập của Demaine và Pătraşcu ghi chú thêm: "For no good reason, dynamic RMQ is usually called 'priority range searching'" ([MIT 6.897 ps9](https://courses.csail.mit.edu/6.897/spring05/psets/ps9.pdf)). Bille et al. xác nhận rằng trên word RAM "a tight Θ(log n/log log n) time bound on the operations is known" ([arXiv:2411.16281](https://arxiv.org/abs/2411.16281)).

**Không trích cận Ω(log n) của Pătraşcu–Demaine cho RMQ động.** Cận đó dành cho tổng tiền tố trên một *nhóm* (có phép trừ) ([Pătraşcu & Demaine, arXiv:cs/0502041](https://arxiv.org/abs/cs/0502041)), mà min thì không có phép nghịch đảo. Trong mô hình semigroup (chỉ được gộp giá trị bằng min), Brodal–Davoodi–Rao ghi nhận rằng truy vấn thời gian log n buộc update tốn Ω(log n), và ngược lại. Họ trích Pătraşcu–Demaine cho kết luận này, nhưng đây là mô hình đại số chứ không phải word-RAM ([Brodal, Davoodi & Rao, WADS 2011](https://cs.au.dk/~gerth/papers/wads11.pdf)). Thông điệp cho lớp học là Segment Tree O(log n) tối ưu *nếu chỉ được gộp bằng min*. Muốn nhanh hơn thì phải dùng sức mạnh của RAM: chỉ số, tra bảng, phép toán bit.

### Block-bitmask: O(1) bằng một lệnh ctz

Kỹ thuật RMQ O(n)/O(1) được cài đặt nhiều nhất trong lập trình thi đấu không đến từ paper nào. Bộ ghi chú **không tìm thấy paper bình duyệt nào** mô tả chính xác kỹ thuật "một mask stack-cực-tiểu cho mỗi vị trí, cộng clz/ctz". Nguồn viết sớm nhất tìm được là một bình luận của jcg ngày 24/11/2019 trên blog Codeforces "Enumerating all Binary Trees to build O(n)/O(1) RMQ". Ông mô tả nó như một cách thay cho phương pháp Cartesian tree trong khối: tìm "the smallest active bit b in mask[r] such that b ≥ l. If there is none active bit satisfying this condition the answer will be r" ([Codeforces 71706, comment 560384](https://codeforces.com/blog/entry/71706?#comment-560384)). Bài hướng dẫn chuẩn là của brunomont (blog 78931, 16/6/2020). Ông cảm ơn tfg đã chỉ cho thuật toán và nói "The only source I could find was a comment from jcg" ([Codeforces 78931](https://codeforces.com/blog/entry/78931)). Khi một bình luận gọi nó là "The Fischer-Heun Structure", brunomont trả lời rằng đây là "not the same algorithm": nó dùng chung ý chia khối Θ(log n) và dựng Sparse Table trên các khối, nhưng "small queries are handled in a different way" ([Codeforces 78931](https://codeforces.com/blog/entry/78931)). Biến thể reset theo từng khối được allvik66 viết (blog 92310, 28/6/2021), dùng khối ⌈log₂ n⌉ và một bảng quy hoạch động để tìm bit bật đầu tiên thay cho intrinsic ([Codeforces 92310](https://codeforces.com/blog/entry/92310)).

Thuật toán dùng khối w = 64 phần tử. Trong mỗi khối, ta duyệt từ trái sang phải và duy trì một stack cực tiểu dưới dạng một word. Bit j của mask[i] bật khi vị trí (đầu khối + j) còn trên stack sau khi đẩy i. Đoạn mã dưới đây lấy từ benchmark tự chạy, sửa để trả về chỉ số ([rmq_bench.cpp](/home/bao/Projects/RMQ/seminar/benchmark/rmq_bench.cpp)):

```cpp
// Xây trong khối [s, e): pop đỉnh stack (bit cao nhất) khi lớn hơn chặt phần tử mới
for (int i = s; i < e; ++i) {
    while (cur && a[s + 63 - __builtin_clzll(cur)] > a[i])
        cur ^= 1ULL << (63 - __builtin_clzll(cur));
    cur |= 1ULL << (i - s);
    mask[i] = cur;
}
// Truy vấn l, r cùng khối: bit bật thấp nhất >= l là vị trí min trái nhất
int in_block(int l, int r) {
    uint64_t m = mask[r] & (~0ULL << (l & 63));   // dịch trong [0, 63], không UB
    return (l & ~63) + __builtin_ctzll(m);
}
```

Tính đúng có thể chứng minh trong ba câu. Các bit bật của mask[r] là đúng những vị trí p ≤ r trong khối thỏa A[p] ≤ A[k] với mọi k ∈ (p, r], vì điều kiện pop là *lớn hơn chặt*. Gọi m là vị trí min trái nhất của [l, r]: m nằm trên stack vì A[m] ≤ mọi phần tử sau nó. Mọi p ∈ [l, m) đều có A[p] > A[m] nên đã bị pop; vậy bit bật thấp nhất ≥ l chính là m. Truy vấn qua nhiều khối ghép ba ứng viên: hậu tố khối trái, tiền tố khối phải, và Sparse Table trên các cực tiểu khối ở giữa. Khi so sánh các ứng viên phải dùng ≤ theo thứ tự chỉ số thì mới giữ được quy ước trái nhất. Ví dụ tự dựng (đã kiểm bằng script) coi A = [5,2,6,3,1,7,4,8] là một khối 8 bit. Các mask lần lượt là 00000001, 00000010, 00000110, 00001010, 00010000, 00110000, 01010000, 11010000. Truy vấn [5, 6] (chỉ số 0) lấy mask[6] & (~0 << 5) = 01000000, ctz = 6, nên đáp án là A[6] = 4. Truy vấn [2, 3] cho ctz = 3, tức A[3] = 3.

Độ phức tạp cần nói trung thực. Phần xây gồm n lần push và tối đa n lần pop, mỗi lần O(1) nhờ clz, nên khấu hao O(n). Phần Sparse Table trên n/64 khối có (n/64)·log₂(n/64) ô. brunomont lập luận rằng chi phí này là O(n) khi b = Θ(log n), và trong phần bình luận ông thừa nhận nó giả định phép bit O(1) và word size ≥ log n ([Codeforces 78931](https://codeforces.com/blog/entry/78931)). Với w = 64 cố định, (n/64)·log₂(n/64) ≤ n đúng cho mọi n ≤ 2^70, nên trên thực tế bảng khối không bao giờ lớn hơn mảng. Về tiệm cận, chi phí này là Θ(n log n/w), tức chỉ O(n) dưới giả định word-RAM w = Θ(log n). Muốn tuyến tính thật sự thì thay Sparse Table đỉnh bằng một tầng nữa cùng cấu trúc; phương án nhiều tầng của allvik66 còn hỗ trợ update với tiền xử lý f(n) = f(⌈n/⌈log₂ n⌉⌉) + n ([Codeforces 92310](https://codeforces.com/blog/entry/92310)).

Bản của brunomont không reset mask ở biên khối mà dùng cửa sổ trượt b vị trí. Code đăng lên dùng b = 30 với mask kiểu `int`, còn benchmark của ông dùng b = 64. Ông cũng lưu ý cách này không dùng được cho gcd vì nó "requires the answer to always be a value in the array" ([Codeforces 78931](https://codeforces.com/blog/entry/78931)). Bộ nhớ bị mask chi phối: 64 bit cho mỗi phần tử. Benchmark tự chạy đo được 8,6–9,0 byte phụ mỗi phần tử ([benchmark tự chạy](/home/bao/Projects/RMQ/seminar/benchmark/results_summary_scale.csv)). Không thư viện nào trong số đã kiểm ship kỹ thuật này. SDSL-lite có các RMQ Cartesian-tree/BP 2n–4n bit và một Sparse Table nén; KACTL có Sparse Table thường; AtCoder Library không có module RMQ, chỉ có `segtree` và `fenwicktree` ([SDSL rmq_succinct_sct.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/rmq_succinct_sct.hpp); [KACTL RMQ.h](https://github.com/kth-competitive-programming/kactl/blob/main/content/data-structures/RMQ.h); [ac-library](https://github.com/atcoder/ac-library/tree/master/atcoder)).

### Succinct ngoài đời: 2,1 bit mỗi phần tử, đổi lấy micro giây

Ferrada và Navarro thay DFUDS bằng biểu diễn BP của Cartesian tree đã qua ánh xạ đường trái nhất. Công thức truy vấn còn rất gọn: rmq_A(i, j) = rank1(rmq_D(select1(i+1) − 1, select1(j+1))), trong đó ±1-RMQ phải trả cực tiểu *phải nhất*. Phần ±1-RMQ chạy trên một range min-max tree đơn giản hóa, nên "not formally constant time" ([Ferrada & Navarro, preprint JDA](https://www.dcc.uchile.cl/~gnavarro/ps/jda16.pdf)). Kết quả của họ: "our structure uses 2.1n bits of space and answers RMQs in 1–3 microseconds", nhanh hơn SDSL 3–6 lần, nhanh gấp đôi thư viện Succinct, và nhanh hơn bản Fischer–Heun do chính họ cài 2–4 lần ([Ferrada & Navarro](https://www.dcc.uchile.cl/~gnavarro/ps/jda16.pdf)).

Baumstark, Gog, Heuer và Labeit tái thiết kế cấu trúc đó với bốn cải tiến:

1. Một phép select biết độ sâu: select1(i, BP) = 2i − depth(v) − 1.
2. Đảo mảng để mô phỏng ánh xạ phải nhất, rồi chọn cây nào nông hơn.
3. Với đoạn ngắn hơn log n, quét thay vì gọi select lần hai.
4. Thay rmM-tree bằng đệ quy trên mảng excess của cực tiểu khối, dừng bằng một Sparse Table sau Λ = 2 tầng (khối s = 1024).

Kết quả là nhanh hơn "up to a factor of three" với khoảng 2,16 bit mỗi phần tử ([Baumstark et al., PDF](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf)). Bài học thiết kế giống hệt kỹ thuật block-bitmask: một Sparse Table nhỏ ở tầng đỉnh vừa rẻ vừa nhanh. SDSL-lite hiện thực hóa văn liệu này thành mã nguồn. `rmq_succinct_sct` dùng 2n + o(n) bit. `rmq_succinct_sada` dùng 4n + o(n) bit, ghi nguồn là Sadakane. `rmq_support_sparse_table` ghi nguồn là bài "The LCA Problem Revisited" và cần mảng gốc ([SDSL rmq_succinct_sada.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/rmq_succinct_sada.hpp); [SDSL rmq_support_sparse_table.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/rmq_support_sparse_table.hpp)).

## 5. Bằng chứng benchmark: số liệu công bố và số liệu tự chạy để tách riêng

### Số liệu đã công bố gắn với máy, năm và workload cụ thể

| Nguồn | Môi trường | Workload | Kết quả then chốt |
|---|---|---|---|
| brunomont, CF 78931 (2020) | Máy không nêu, -O2, trung bình 10 lần | n = 10^6..10^7; build + 10^6 truy vấn | n = 10^7: build 140 ms (bitmask), 515 ms (Sparse), 39 ms (Segment lặp); 10^6 truy vấn: 113 / 28 / 303 ms |
| Ferrada–Navarro, JDA 2017 | Ghi chú không trích được CPU | n = 10^4..10^10, đoạn dài 10.000, khối 512 | ≤ 2,1 bit/phần tử; 1–3 µs; build 60–70 ns/phần tử, so với 110–130 ns của SDSL |
| Baumstark et al., SEA 2017 | 1 core Xeon E5-4640, GCC 4.8.4 | random, inc-δ, dec-δ; LCP Pizza&Chili | 2,16–2,17 bit/phần tử ở n = 10^6..10^9; nhanh hơn tới 3× |
| Kowalski–Grabowski, SPE 2018 | i7-4790 3,6 GHz, gcc 7.2.0 32-bit -O3 -mavx2, Windows 10 | n = 1G, 1M truy vấn mỗi độ rộng | ST: build 436,6 s, 404,94 bit/phần tử; BbST (k = 512): 0,6 s, 34,63 bit (gồm 32 bit của A); SDSL-REC: 62,6 s, 2,16 bit |
| Ilie–Navarro–Tinta, JDA 2010 | UltraSPARC IIIi 1593 MHz, gcc 3.4.3 -O3 | 10^6 cặp LCE | RMQ hằng: 1,34–1,63 µs; RMQ log: 1,11–1,28 µs; so ký tự trực tiếp: 0,07–0,29 µs |
| Dima–Ceterchi, OI 2015 | Xeon-Haswell 3,5 GHz, gcc 4.8 | n = 10^5; 10M update + 10M truy vấn | Truy vấn: 0,551 s (hai BIT) so với 2,397 s (Segment); update: 0,672 so với 1,274 s |
| Alzamel et al., IWOCA 2017 | i5-4690 3,5 GHz, g++ 5.4.0 -O3 | n = 10^6, 10^8, 10^9; q từ √n đến 128√n | Contraction cộng ST-RMQ_CON tốt nhất; ở n = 10^9 nhanh gấp 2 ON-RMQ_CON khi q tăng |
| Meneses et al. (RTXRMQ), FGCS 2024 | RTX 6000 Ada; HRMQ chạy trên 2× EPYC 9654 (192 core) | lô q = 2^26 truy vấn | Đoạn nhỏ: tới 5× nhanh hơn HRMQ, 2,3× nhanh hơn GPU-LCA; khoảng 5 ns/RMQ với đoạn lớn; 4,5 GB ở n = 2^26 |
| Kreis et al. (GPU-RMQ), arXiv 2026 | RTX 4090; CPU Threadripper 3990X | tới 2^33 phần tử | Throughput tới ~8× LCA, ~17× RTXRMQ, ~4800× HRMQ (preprint) |

Nguồn của từng dòng: [brunomont](https://codeforces.com/blog/entry/78931); [Ferrada & Navarro](https://www.dcc.uchile.cl/~gnavarro/ps/jda16.pdf); [Baumstark et al.](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf); [Kowalski & Grabowski](https://arxiv.org/abs/1711.10385); [Ilie et al.](https://users.dcc.uchile.cl/~gnavarro/ps/jda10.pdf); [Dima & Ceterchi](https://ioinformatics.org/journal/v9_2015_39_44.pdf); [Alzamel et al.](https://arxiv.org/abs/1705.04589); [RTXRMQ](https://arxiv.org/abs/2306.03282); [GPU-RMQ](https://arxiv.org/abs/2604.01811).

Bảng trên cho ba bài học chung, mỗi bài học đều có trường hợp ngoại lệ đáng nói.

**Bài học thứ nhất: Sparse Table thắng về độ trễ, nhưng phải trả bằng thời gian xây và bộ nhớ.** Kowalski–Grabowski gọi full Sparse Table là "unbeatable for relatively narrow queries (of width up to a few thousands), yet the required space is around 320–400n bits" ([Kowalski & Grabowski](https://arxiv.org/abs/1711.10385)). BbST, một Sparse Table trên cực tiểu khối 512 phần tử kèm phép đọc phỏng đoán và quét, xây nhanh hơn SDSL-SCT khoảng 40 lần. Theo họ, "in the construction time for SDSL-SCT over 1G elements we can build BbST and answer from about 100M to 400M queries" ([Kowalski & Grabowski](https://arxiv.org/abs/1711.10385)).

**Bài học thứ hai: hằng số O(1) có thể thua một vòng lặp ngây thơ.** Trên phần cứng thập niên 2000, LCE dựa trên RMQ hằng thời gian tốn 1,3–1,6 µs mỗi cặp, còn so trực tiếp từng ký tự chỉ 0,07–0,31 µs. Ilie et al. kết luận "DirectComp is roughly 6 times faster". Các phương pháp RMQ cần hơn 24n byte và hết bộ nhớ trên file lớn hơn 160 MB, trong khi DirectComp chỉ cần chính văn bản. Ghép DirectComp vào Landau–Vishkin cho phiên bản nhanh hơn bản gốc 13–20 lần ([Ilie, Navarro & Tinta](https://users.dcc.uchile.cl/~gnavarro/ps/jda10.pdf)).

**Bài học thứ ba: đọc paper phải đọc cả bảng số, không chỉ tóm tắt.** Abstract của Dima–Ceterchi nói cấu trúc hai BIT "outperforming in speed … the Sparse Table Algorithm", nhưng Bảng 1 của chính bài chỉ so với Segment Tree ([Dima & Ceterchi](https://ioinformatics.org/journal/v9_2015_39_44.pdf)). Tương tự, abstract CPM 2006 của Fischer–Heun nói phương pháp mới "almost twice as fast in practice", và các biến thể chậm hơn về tiệm cận "perform even better at today's common problem sizes". Nhưng ghi chú chỉ có câu chữ này qua bản tóm tắt của trang Springer; toàn văn và bảng số **chưa được đọc** ([Springer DOI](https://doi.org/10.1007/11780441_5)).

Số liệu GPU là throughput của một lô 2^26 truy vấn, không phải độ trễ, nên không so trực tiếp được với ns/truy vấn trên CPU. Theo phần thiết lập mà một ghi chú đọc từ arXiv, HRMQ là cấu trúc Ferrada–Navarro được song song hóa theo truy vấn bằng OpenMP; một ghi chú khác chưa xác nhận điều này ([RTXRMQ](https://arxiv.org/abs/2306.03282)). GPU-RMQ là preprint chưa có nơi bình duyệt ([arXiv:2604.01811](https://arxiv.org/abs/2604.01811)).

### Benchmark tự chạy trên i5-13500HX: cấu trúc thắng đổi theo q, L và n

Benchmark tự chạy dùng i5-13500HX, ghim vào P-core số 2 (tối đa 4,7 GHz, governor powersave, laptop không cách ly), L3 24 MiB, RAM 15 GiB, GCC 15.3.0 với `-O3 -DNDEBUG -std=c++17 -march=native` ([environment.json](/home/bao/Projects/RMQ/seminar/benchmark/environment.json)). Benchmark có năm cài đặt tự viết, tất cả trả về **giá trị** min:

- Scan;
- Sqrt (khối ⌊√n⌋);
- Segment Tree lặp bottom-up;
- Sparse Table phẳng chỉ lưu các ô hợp lệ;
- Linear, tức block-bitmask với w = 64 và reset theo khối.

Mảng gồm số nguyên ngẫu nhiên đều trong [0, 10^9] với seed cố định. Đầu mút truy vấn được sinh ngẫu nhiên đều rồi sắp lại cho l ≤ r. Mỗi case lặp 5 lần với thứ tự thuật toán luân phiên, và báo median. Bộ nhớ chỉ tính payload số của các mảng phụ ngoài A. Trước khi đo, self-test kiểm 36.360.800 khoảng tĩnh trên mảng nhỏ có giá trị âm và trùng nhau, cộng thêm phép thử mixed ngẫu nhiên ([run.log](/home/bao/Projects/RMQ/seminar/benchmark/run.log); [rmq_bench.cpp](/home/bao/Projects/RMQ/seminar/benchmark/rmq_bench.cpp)). Đây là số liệu **benchmark tự chạy**, không được đặt chung bảng với số liệu paper.

| n | Cấu trúc | Build (ms) | ns/truy vấn | Byte phụ/phần tử |
|---|---|---:|---:|---:|
| 2^16 | Scan | 0 | 936,6 | 0 |
| 2^16 | Sqrt | 0,093 | 56,1 | 0,02 |
| 2^16 | Segment | 0,057 | 78,9 | 8,0 |
| 2^16 | Linear (block-bitmask) | 0,506 | 4,1 | 8,56 |
| 2^16 | Sparse | 0,400 | 3,0 | 60,0 |
| 2^20 | Scan | 0 | 21.402,3 | 0 |
| 2^20 | Sqrt | 1,413 | 107,3 | ≈0 |
| 2^20 | Segment | 1,068 | 101,2 | 8,0 |
| 2^20 | Linear (block-bitmask) | 7,990 | 18,2 | 8,81 |
| 2^20 | Sparse | 31,409 | 9,8 | 76,0 |
| 2^23 | Scan | 0 | 330.228,9 | 0 |
| 2^23 | Sqrt | 11,335 | 501,4 | ≈0 |
| 2^23 | Segment | 21,535 | 124,3 | 8,0 |
| 2^23 | Linear (block-bitmask) | 77,151 | 37,8 | 9,0 |
| 2^23 | Sparse | 297,342 | 14,2 | 88,0 |

Nguồn: [results_summary_scale.csv](/home/bao/Projects/RMQ/seminar/benchmark/results_summary_scale.csv), benchmark tự chạy.

So với Sparse Table, block-bitmask đổi chất lượng lấy số lượng theo một tỉ lệ khá ổn định. Ở n = 2^20, nó xây nhanh hơn 3,9 lần, tốn ít bộ nhớ hơn 8,6 lần, nhưng truy vấn chậm hơn 1,9 lần. Ở n = 2^23, ba tỉ lệ tương ứng là 3,85 lần, 9,8 lần và 2,7 lần. Riêng ở n ≤ 2^16, block-bitmask lại xây chậm hơn (0,506 so với 0,400 ms). Thời gian xây Sparse Table tăng vọt 8,4 lần khi n chỉ tăng gấp đôi, từ 2^18 (1,7 ms, bảng 17,8 MB) lên 2^19 (14,3 ms, bảng 37,7 MB). Mốc này trùng với lúc bảng vượt L3 24 MiB. Đây là **giả thuyết** chưa được kiểm bằng hardware counter. Segment Tree xây nhanh nhất ở mọi n, nhưng truy vấn tăng chậm theo log n, từ 45,8 ns ở 2^10 lên 124 ns ở 2^23. Sqrt bám theo √n, từ 42 ns lên 501 ns ([benchmark tự chạy](/home/bao/Projects/RMQ/seminar/benchmark/results_summary_all.csv)). Các kết quả này cùng chiều với số đo của brunomont (truy vấn chậm hơn khoảng 4 lần, build nhanh hơn khoảng 3,7 lần ở n = 10^7), nhưng hai bộ số đến từ máy, cờ biên dịch và cài đặt khác nhau, nên chỉ nói "cùng chiều" chứ không gộp vào một bảng.

Thí nghiệm hòa vốn giữ n = 2^20 và tính tổng thời gian build cộng q truy vấn (đơn vị ms, median của 5 lần; "—" là trường hợp không đo):

| q | Scan | Sqrt | Segment | Linear | Sparse | Nhanh nhất |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 0,087 | 1,397 | 0,854 | 7,642 | 30,010 | Scan |
| 10 | 0,392 | 1,385 | 0,837 | 7,742 | 30,201 | Scan |
| 100 | 2,285 | 1,419 | 0,913 | 7,690 | 29,972 | Segment |
| 10^3 | 21,175 | 1,564 | 1,135 | 7,996 | 30,519 | Segment |
| 10^4 | 219,639 | 2,522 | 2,100 | 8,265 | 30,929 | Segment |
| 10^5 | — | 12,274 | 11,500 | 11,042 | 32,532 | Linear (sát Segment) |
| 10^6 | — | 108,351 | 106,347 | 26,493 | 41,435 | Linear |
| 10^7 | — | — | 1.036,818 | 193,130 | 130,463 | Sparse |

Nguồn: [results_summary_all.csv](/home/bao/Projects/RMQ/seminar/benchmark/results_summary_all.csv), benchmark tự chạy.

Ở q = 10^5, IQR của Linear (10,90–11,20 ms) và của Segment (11,42–11,61 ms) không chồng nhau, nhưng chênh lệch chỉ khoảng 4%, nên coi như hòa. Điểm hòa vốn giữa Linear và Sparse, nội suy từ hai mốc 10^6 và 10^7, là (31,9 − 7,8) ms chia cho (18,5 − 9,9) ns, khoảng **2,8 triệu truy vấn**. Con số này là ước lượng, chưa đo trực tiếp. Từ đây rút ra một kết luận không có trong sách giáo khoa: ở n = 2^20, Sparse Table chỉ đáng dựng khi số truy vấn lên đến hàng triệu.

Thí nghiệm theo độ dài đoạn giữ n = 2^22 và cố định độ dài L (ns/truy vấn, median):

| L | Scan | Sqrt | Segment | Linear | Sparse |
|---:|---:|---:|---:|---:|---:|
| 1 | 6,1 | 9,9 | 8,1 | 18,2 | 8,6 |
| 4 | 5,7 | 10,3 | 14,1 | 19,1 | 8,5 |
| 32 | 7,7 | 12,1 | 26,5 | 23,1 | 8,4 |
| 64 | 11,9 | 17,7 | 36,3 | 28,4 | 9,6 |
| 256 | 38,2 | 44,1 | 49,2 | 41,8 | 10,5 |
| 1024 | 115,4 | 120,6 | 51,9 | 40,3 | 9,4 |
| 16384 | 6.300,3 | 209,5 | 66,8 | 35,8 | 9,2 |
| 2^20 | 85.385,2 | 273,9 | 92,2 | 36,6 | 7,6 |

Nguồn: [results_summary_all.csv](/home/bao/Projects/RMQ/seminar/benchmark/results_summary_all.csv), benchmark tự chạy. Sqrt được đo với 2^18 truy vấn; Scan được đo với ít truy vấn hơn khi L lớn.

Scan nhanh nhất cho mọi đoạn dài tới 32. Sparse Table gần như phẳng, 7,6–10,5 ns, trên mọi độ dài. Một chi tiết bất ngờ là block-bitmask ở L = 1, khi truy vấn nằm gọn trong một khối, vẫn tốn 18 ns, gấp đôi Sparse Table. Giả thuyết hợp lý là nó cần hai lần đọc bộ nhớ phụ thuộc nhau: đọc mask[r] trong mảng mask 32 MiB, rồi mới đọc A. Trong khi đó Sparse Table ở tầng 0 chỉ cần một lần đọc. Giả thuyết này chưa được kiểm bằng counter.

Thí nghiệm mixed giữ n = 2^17 và chạy 2^17 thao tác gán điểm xen kẽ truy vấn. Không đo Sparse và Linear vì hai cấu trúc này không hỗ trợ update. Kết quả (ns/thao tác, không tính build):

| Tỉ lệ update | Scan | Sqrt | Segment |
|---:|---:|---:|---:|
| 0% | 1.862,9 | 61,7 | 82,7 |
| 10% | 1.633,3 | 58,4 | 76,2 |
| 50% | 924,9 | 44,0 | 49,1 |
| 75% | 449,1 | 30,7 | 28,1 |
| 90% | 183,1 | 23,6 | 16,9 |
| 99% | 19,2 | 19,3 | 9,6 |

Nguồn: [results_summary_all.csv](/home/bao/Projects/RMQ/seminar/benchmark/results_summary_all.csv), benchmark tự chạy.

Ở n = 2^17, Sqrt thắng tới 50% update, Segment Tree thắng từ 75% trở lên. Kết quả này khác với lần chạy cũ trong ghi chú trước: lần đó dùng AMD EPYC 9V74 và g++ 13.3 với n = 10^5, và Segment thắng ngay từ 50%. Hai lần chạy cùng xác nhận một điều: điểm giao giữa O(√n) và O(log n) phụ thuộc vào máy và vào n. Ở n = 2^23, Segment Tree truy vấn nhanh hơn Sqrt 4 lần, nên "O(√n) nhanh hơn O(log n)" chỉ đúng với n nhỏ.

## 6. Mở rộng: mỗi biến thể có một trần riêng

### Hai chiều không có Cartesian tree

Trên ma trận m×n (N = mn, m ≤ n), một truy vấn hỏi argmin trên một hình chữ nhật. Trong mô hình **indexing**, bài toán coi như đã giải xong: Brodal–Davoodi–Rao đạt tiền xử lý O(N), truy vấn O(1) với O(N) bit phụ, cùng cận dưới Ω(c) cho N/c bit ở mọi số chiều ([Brodal, Davoodi & Rao, ESA 2010](https://cs.au.dk/~gerth/papers/esa10.pdf)). Trong mô hình **encoding**, 2D khác hẳn 1D. Demaine–Landau–Weimann chứng minh "no Cartesian tree exists for the two-dimensional version" ([DOI 10.1007/s00453-012-9683-x](https://doi.org/10.1007/s00453-012-9683-x)). Brodal–Davoodi–Rao phát biểu chính xác hơn: số ma trận n×n có tập đáp án 2D-RMQ khác nhau là Ω(((n/4)!)^{n/4}), nên cần Ω(N log m) bit ([Brodal, Davoodi & Rao](https://cs.au.dk/~gerth/papers/esa10.pdf)). Brodal–Brodnik–Davoodi đạt O(mn log m) bit nhưng "do not consider query time" ([DOI 10.1007/978-3-642-40450-4_20](https://doi.org/10.1007/978-3-642-40450-4_20)). Encoding gần tối ưu đầu tiên có truy vấn nhanh là của Gawrychowski–Górkiewicz–Satti (ESA 2026): O(κmn(log m + log log n)) bit với truy vấn O(log^{1/κ} n), κ ∈ [1, log log n] ([arXiv:2607.04509](https://arxiv.org/abs/2607.04509)). Với m = 2, Golin et al. chứng minh entropy hiệu dụng đúng bằng 5n − O(log n) bit, so với 2n cho một hàng ([arXiv:1109.2885](https://arxiv.org/abs/1109.2885)).

| Kết quả 2D | Truy vấn | Bộ nhớ (bit) | Mô hình | Nguồn |
|---|---|---|---|---|
| Amir–Fischer–Lewenstein, CPM 2007 | O(1) | O(kN log N) + \|A\|, tiền xử lý O(N log^{[k+1]} N) | indexing | [DOI](https://doi.org/10.1007/978-3-540-73437-6_29) |
| Yuan–Atallah, SODA 2010 | O(1) | O(N log N) + \|A\|, tiền xử lý O(N), mọi số chiều cố định | indexing | [DOI](https://doi.org/10.1137/1.9781611973075.14) |
| Brodal–Davoodi–Rao, ESA 2010 | O(1) / O(c log² c) | O(N) / O(N/c) bit phụ | indexing | [ESA 2010](https://cs.au.dk/~gerth/papers/esa10.pdf) |
| Brodal–Davoodi–Rao, ESA 2010 | O(1) | O(N·min{m, log n}); cận dưới Ω(N log m) | encoding | [ESA 2010](https://cs.au.dk/~gerth/papers/esa10.pdf) |
| Brodal–Brodnik–Davoodi, ESA 2013 | không xét | O(N log m), khớp cận dưới | encoding | [DOI](https://doi.org/10.1007/978-3-642-40450-4_20) |
| Gawrychowski–Górkiewicz–Satti, ESA 2026 | O(log^{1/κ} n) | O(κN(log m + log log n)) | encoding | [arXiv:2607.04509](https://arxiv.org/abs/2607.04509) |

Sparse Table 2D trong lập trình thi đấu (st[a][b][i][j], mỗi truy vấn đọc 4 ô) tốn O(nm log n log m) bộ nhớ. Truy vấn chỉ là O(1) khi log được tiền tính, và bài gốc trên Codeforces có bình luận báo lỗi chỉ số ([Codeforces 45485](https://codeforces.com/blog/entry/45485)). VNOI Wiki có mục "Sparse Table 2D" kèm bài CodeChef CHSQARR ([VNOI Wiki RMQ](https://wiki.vnoi.info/algo/data-structures/rmq)).

### RMQ động và ranh giới Θ(log n/log log n)

Trong thực hành, Segment Tree có lazy propagation xử lý cập nhật và truy vấn đoạn trong O(log n) ([cp-algorithms: Segment Tree](https://cp-algorithms.com/data_structures/segment_tree.html)). Về lý thuyết, cận đúng là Θ(log n/log log n), như mục 4 đã nêu. Cận trên đến từ path minima động của Brodal–Davoodi–Rao. Trong mô hình so sánh, truy vấn tốn Θ(log n/log log n) và update tốn Θ(log n) khấu hao; trên RAM, update giảm xuống O(log n/log log n) khấu hao, với O(n) bộ nhớ ([Brodal, Davoodi & Rao, WADS 2011](https://cs.au.dk/~gerth/papers/wads11.pdf)). Trong mô hình so sánh, Brodal–Chaudhuri–Radhakrishnan cho thấy: muốn truy vấn trong thời gian polylog thì mỗi update phải tốn Ω(log n) phép so sánh ([DOI 10.1007/3-540-61422-2_116](https://doi.org/10.1007/3-540-61422-2_116)).

Navarro–Sadakane đưa ra phiên bản succinct động, 2n + O(n log log n/log n) bit với O(log n/log log n) cho hầu hết các phép toán ([TALG, DOI 10.1145/2601073](https://doi.org/10.1145/2601073)). Héliou, Léonard, Mouchard và Salson (TCS 656, **2016**) đề xuất một cách không dùng Cartesian tree, dựa trên các bit vector phân cấp đánh dấu cực tiểu cục bộ ([HAL hal-01255499](https://hal.science/hal-01255499v2)). Trên ultra-wide word RAM, Bille et al. đạt O(log log log n) mỗi thao tác. Điều này cho thấy cận dưới phụ thuộc vào mô hình máy ([arXiv:2411.16281](https://arxiv.org/abs/2411.16281)).

### Offline: biết trước truy vấn thì không cần cấu trúc O(1)

Arpa's trick gom truy vấn theo đầu mút phải và quét i từ trái sang phải với một stack cực tiểu. Khi một phần tử bị pop, cha DSU của nó được đặt là i. Truy vấn (L, i) được trả lời bằng giá trị tại find(L), với chi phí trung bình O(α(n)) mỗi truy vấn. cp-algorithms ghi rằng thuật toán "existed already before" khi AmirReza Poorakhavan phổ biến nó ([cp-algorithms: DSU](https://cp-algorithms.com/data_structures/disjoint_set_union.html)); bài blog gốc của Arpa **chưa tìm được**. Ví dụ tự dựng (đã kiểm bằng script): với A = [4,2,5,1,3], truy vấn (2,3) trả 2 và truy vấn (1,5) trả 1, đường find của truy vấn sau là 1 → 2 → 4. Cùng bộ máy đó là offline LCA của Tarjan ([cp-algorithms: Tarjan offline LCA](https://cp-algorithms.com/graph/lca_tarjan.html); [Tarjan, J. ACM 1979](https://doi.org/10.1145/322154.322161)).

Với q = o(n), Alzamel et al. thu gọn A về tối đa 4q − 1 phần tử trong n + O(q) thời gian. Ý tưởng là nếu không truy vấn nào bắt đầu hay kết thúc ở i hoặc i+1, thì max(A[i], A[i+1]) không bao giờ là đáp án. Sau đó họ chạy Sparse Table "in place" theo từng nhóm độ dài, được n + O(q log q) thời gian và O(q) bộ nhớ ([arXiv:1705.04589](https://arxiv.org/abs/1705.04589)). Về lý thuyết, bộ nhớ là O(q) word cộng O(n) bit, vì có mượn bit để đánh dấu ([Kowalski & Grabowski](https://arxiv.org/abs/1711.10385)).

### Cửa sổ trượt: một trường hợp đặc biệt rẻ hơn hẳn

Với độ rộng w cố định, monotonic deque cho tổng O(n) và trả lời ngay, không có độ trễ ([cp-algorithms: Minimum queue](https://cp-algorithms.com/data_structures/stack_queue_modification.html)). Van Herk (Pattern Recognition Letters 1992) và Gil–Werman (**IEEE TPAMI 15(5), 1993**) độc lập tìm ra cách chia tín hiệu thành khối độ dài w, tính prefix-min và suffix-min trong mỗi khối; mỗi cửa sổ khi đó là min(h[x], g[x+w−1]) ([Gil & Werman, DOI 10.1109/34.211471](https://doi.org/10.1109/34.211471); [van Herk, DOI](https://doi.org/10.1016/0167-8655(92)90069-C); [Gil & Kimmel 2002, PDF](https://www.cs.technion.ac.il/wp-content/ron-kimmel/papers/EfficientMorphology_KimmelGil_PAMI_2002.pdf)). Ví dụ tự dựng (đã kiểm bằng script): với A = [4,2,12,3,8,7,1,5,9] và w = 3, ta có g = [4,2,2,3,3,3,1,1,1] và h = [2,2,12,3,7,7,1,5,9], nên cửa sổ A[2..4] có min là min(h[2], g[4]) = 2. Lemire so sánh số phép so sánh của các phương pháp như sau:

| Thuật toán | Số so sánh/phần tử, tệ nhất (cả max và min) | Độ trễ | Bộ đệm |
|---|---|---|---|
| Ngây thơ | 2w − 2 | 0 | O(1) |
| van Herk 1992 / Gil–Werman 1993 | 6 − 8/w | w | 4w + O(1) |
| Gil–Kimmel 2002 | 3 + 2 log w/w + O(1/w) | w | 6w + O(1) |
| Lemire 2006 | 3 | 0 | 2w + O(1) |

Nguồn: [Lemire, arXiv cs/0610046](https://arxiv.org/abs/cs/0610046). Lemire cũng chứng minh cần ít nhất 2 phép so sánh mỗi phần tử khi không có độ trễ.

### Phép toán không lũy đẳng, nén, song song và GPU

Với một semigroup tổng quát như phép +, các mảnh tiền tính phải *rời nhau*. Yao xác định đánh đổi gần như chính xác "T ≈ α(S, n)" ([Yao, STOC 1982](https://doi.org/10.1145/800070.802185)). Alon–Schieber chứng minh Θ(nλ(k, n)) tiền xử lý là cần và đủ để trả lời mỗi truy vấn trong k bước ([arXiv:2406.06321](https://arxiv.org/abs/2406.06321)). Brodal–Davoodi–Rao ghi nhận rằng ngay cả min, nếu chỉ được gộp như semigroup với bộ nhớ tuyến tính, cũng cần Ω(α(n)) phép toán ([WADS 2011](https://cs.au.dk/~gerth/papers/wads11.pdf)). RMQ O(n)/O(1) trên word-RAM thoát được cận này vì nó trả về chỉ số bằng tra bảng và phép bit, không bằng phép gộp min. Disjoint Sparse Table (O(n log n), một phép gộp cho mỗi monoid) và Sqrt Tree (O(n log log n), truy vấn O(1), có update) là các điểm thực dụng trên đường đánh đổi đó ([Codeforces 79108](https://codeforces.com/blog/entry/79108); [cp-algorithms: Sqrt Tree](https://cp-algorithms.com/data_structures/sqrt-tree.html)). Với truy vấn phần tử thứ k trên đoạn, Jørgensen–Larsen chứng minh S word bộ nhớ đòi hỏi Ω(log n/log(Sw/n)) thời gian ([SODA 2011](https://doi.org/10.1137/1.9781611973082.63)).

Về nén, Gawrychowski–Jo–Mozes–Weimann trả lời RMQ trong O(log n) với bộ nhớ tuyến tính theo kích thước một grammar SLP, hoặc theo kích thước nén top-tree của Cartesian tree. Phương án thứ hai "can be exponentially better", không bao giờ tệ hơn quá một thừa số O(σ), và có thể tệ hơn Ω(σ) ([arXiv:1902.04427](https://arxiv.org/abs/1902.04427)). Bản SPIRE 2018 của công trình này chỉ có ba tác giả (Jo, Mozes, Weimann); Gawrychowski chỉ có tên ở bản TCS 2020 ([DOI 10.1007/978-3-030-00479-8_17](https://doi.org/10.1007/978-3-030-00479-8_17)).

Về song song, recursive star-tree của Berkman–Vishkin cho O(α(n)) thời gian với số bộ xử lý tối ưu trên CRCW PRAM. Nó chạy được trong thời gian hằng nếu cho phép một số rất ít bộ xử lý cùng ghi vào các bit khác nhau của một word ([SICOMP 22(2)](https://doi.org/10.1137/0222017)). Trên GPU, Euler-tour LCA của Polak et al. là baseline mạnh ([IPDPS 2021](https://doi.org/10.1109/IPDPS49936.2021.00032)). RTXRMQ biến mỗi phần tử thành một tam giác sao cho "the closest hit of a ray launched from a point given by the query parameters corresponds to the result of that query" ([arXiv:2306.03282](https://arxiv.org/abs/2306.03282)). GPU-RMQ (preprint 2026) dùng một hệ phân cấp các bản tóm tắt cực tiểu cộng với quét song song ([arXiv:2604.01811](https://arxiv.org/abs/2604.01811)).

## 7. So sánh cấu trúc dữ liệu: chọn theo workload, không theo Big-O

| Cấu trúc | Tiền xử lý | Truy vấn | Bộ nhớ phụ | Cập nhật | Nên chọn khi | Nguồn |
|---|---|---|---|---|---|---|
| Scan | — | O(L) | 0 | O(1) | q ≤ vài chục, hoặc đoạn ≤ 32 | benchmark tự chạy |
| Chia khối √n | O(n) | O(√n) | O(√n) word | O(√n) | n vừa phải, cập nhật vừa phải | benchmark tự chạy |
| Segment Tree (lazy) | O(n) | O(log n) | 2n word | O(log n), cả cập nhật đoạn | có cập nhật; q vừa phải | [cp-algorithms](https://cp-algorithms.com/data_structures/segment_tree.html) |
| Hai BIT (Dima–Ceterchi) | O(n) | O(log n) | 2n word | O(log n) (tác giả gọi là "amortized") | động, hằng số nhỏ | [OI 2015](https://ioinformatics.org/journal/v9_2015_39_44.pdf) |
| Sparse Table | O(n log n) | O(1), 4 lần đọc | n log n word | không | tĩnh, q rất lớn, cần độ trễ thấp | [B–FC](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf) |
| Disjoint Sparse Table | O(n log n) | O(1) cho mọi monoid | n log n | không | tổng, tích ma trận trên mảng tĩnh | [CF 79108](https://codeforces.com/blog/entry/79108) |
| Sqrt Tree | O(n log log n) | O(1) | O(n log log n) | có | phép kết hợp bất kỳ, có cập nhật | [cp-algorithms](https://cp-algorithms.com/data_structures/sqrt-tree.html) |
| ±1RMQ / Fischer–Heun | O(n) | O(1) | O(n) word | không | lý thuyết, LCA tối ưu | [FH SICOMP](https://ae.iti.kit.edu/1810.php) |
| Block-bitmask (w = 64) | O(n + (n/64) log(n/64)) | O(1) | ≈64 bit/phần tử | không (bản nhiều tầng thì có) | tĩnh, n lớn, cần xây nhanh | [CF 78931](https://codeforces.com/blog/entry/78931) |
| BbST (k = 512) | 0,6 s ở n = 1G | trung bình O(1) với đoạn rộng; tệ nhất O(k) | ≈2,6 bit + A | không | n khổng lồ, đoạn rộng | [K&G](https://arxiv.org/abs/1711.10385) |
| Succinct 2n+o(n) | O(n) | O(1) lý thuyết; 1–3 µs thực tế | ≈2,1–2,2 bit | không (bản động của Navarro–Sadakane thì có) | bộ nhớ là ràng buộc; LCP nén | [F&N](https://www.dcc.uchile.cl/~gnavarro/ps/jda16.pdf) |
| Monotonic deque | — | O(1) khấu hao mỗi cửa sổ | O(w) | — | cửa sổ trượt độ rộng cố định | [cp-algorithms](https://cp-algorithms.com/data_structures/stack_queue_modification.html) |
| Arpa's trick | — | O(α(n)) trung bình | O(n) | — | biết trước mọi truy vấn | [cp-algorithms DSU](https://cp-algorithms.com/data_structures/disjoint_set_union.html) |
| Binary lifting (LCA) | O(n log n) | O(log n) | n log n | — | cần tổ tiên thứ k hoặc aggregate trên đường đi | [VNOI LCA](https://wiki.vnoi.info/algo/data-structures/lca-binlift) |

Bảng này thay câu hỏi "cấu trúc nào tốt nhất" bằng ba câu hỏi phải hỏi trước. Mảng có thay đổi không? Bao nhiêu truy vấn sẽ chia sẻ chi phí xây? Đoạn truy vấn thường dài bao nhiêu? Benchmark tự chạy cho thấy câu trả lời đổi ba lần trên cùng một máy chỉ vì q thay đổi. Kowalski–Grabowski cho thấy thứ hạng đổi theo độ rộng đoạn ([Kowalski & Grabowski](https://arxiv.org/abs/1711.10385)). Ilie et al. cho thấy với LCE, cấu trúc tốt nhất có khi là không dùng cấu trúc nào ([Ilie et al.](https://users.dcc.uchile.cl/~gnavarro/ps/jda10.pdf)).

## 8. Ứng dụng: thành phần thật, họ hàng gần và phép so sánh

Ứng dụng chuỗi là ứng dụng vững chắc nhất. Dựng suffix array (Manber–Myers) và mảng LCP (Kasai et al.), đặt RMQ lên LCP, thì độ dài tiền tố chung của **bất kỳ** hai hậu tố, tức truy vấn LCE, có trong O(1). Với rank r1 < r2, LCE(i, j) = min LCP[r1+1..r2] ([Manber & Myers, DOI](https://doi.org/10.1137/0222058); [Kasai et al., DOI](https://doi.org/10.1007/3-540-48194-x_17)). Ilie et al. nói LCE "appears as a subproblem in many fundamental string problems", và hai cách O(1) đã biết là LCA trên cây hậu tố hoặc RMQ trên mảng ([Ilie, Navarro & Tinta](https://www.dcc.uchile.cl/~gnavarro/ps/jda10.pdf)). Ví dụ tự dựng (đã kiểm bằng script): với S = `banana$`, SA = [6,5,3,1,0,4,2] và LCP = [–,0,1,3,0,0,2]. Khi đó LCE(5,1) = min(1,3) = 1, LCE(3,1) = 3 ("ana") và LCE(1,4) = 0.

LCE là bước nhảy trong Landau–Vishkin k-mismatch và k-differences, cho O(nk) sau tiền xử lý tuyến tính ([Landau & Vishkin 1986](https://doi.org/10.1016/0304-3975(86)90178-7); [Landau & Vishkin 1989](https://doi.org/10.1016/0196-6774(89)90010-2)). LCE cũng là bước lõi của thuật toán tìm runs tuyến tính: nếu trả lời được O(n) truy vấn LCE trong tổng O(f(n)) thì tìm được mọi runs trong O(n + f(n)) ([Bannai et al., SICOMP 2017](https://doi.org/10.1137/15M1011032); [Ellert & Fischer, arXiv:2102.08670](https://arxiv.org/abs/2102.08670)).

Compressed suffix tree là nơi RMQ trở thành cách viết lại toàn bộ cấu trúc. Fischer–Mäkinen–Navarro "totally gets rid of the suffix tree topology and expresses all the suffix tree operations using range minimum queries and a novel primitive called next/previous smaller value" ([TCS 2009, DOI](https://doi.org/10.1016/j.tcs.2009.09.012); [trang tóm tắt](https://users.dcc.uchile.cl/~gnavarro/abstracts/tcs09.html)). Trong SDSL-lite, `cst_sct3::lca(v, w)` tính trực tiếp `rmq(v.i+1, w.j)` ([cst_sct3.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/cst_sct3.hpp)). Suffix tree trong không gian chặn bởi số runs của BWT, của Gagie–Navarro–Prezza, cũng dựa trên RMQ, PSV và NSV trên LCP ([arXiv:1809.02792](https://arxiv.org/abs/1809.02792)).

Document listing là ví dụ RMQ "nguyên chất" đẹp nhất cho slide. Muthukrishnan (SODA 2002) đặt RMQ trên mảng predecessor L[i] = max{j < i : C[j] = C[i]} của document array C. Thuật toán tìm p = rmq_L(i, j); nếu L[p] < sp thì C[p] là một màu mới cần báo, rồi đệ quy hai bên; nếu không thì dừng. Kết quả là O(m + docc) thời gian, tức tối ưu ([Navarro, ACM CSUR 2014, §4](https://arxiv.org/abs/1304.6023)). Sadakane làm nó succinct bằng một RMQ không đọc L cộng với một bitmap ([Navarro 2014, §5](https://arxiv.org/abs/1304.6023); [Sadakane, JDA 2007](https://doi.org/10.1016/j.jda.2006.03.011)). Với khán giả lập trình thi đấu, đây chính là bài "liệt kê các giá trị khác nhau trong a[l..r] trong O(số giá trị khác nhau)" bằng prev[i].

| Lĩnh vực | Mảng chạy RMQ | Nhãn | Ghi chú | Nguồn |
|---|---|---|---|---|
| LCE, Landau–Vishkin, runs | LCP | Thật | Lõi của nhiều thuật toán chuỗi | [Ilie et al.](https://www.dcc.uchile.cl/~gnavarro/ps/jda10.pdf) |
| Compressed suffix tree | LCP + PSV/NSV | Thật | Có trong mã SDSL-lite | [cst_sct3.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/cst_sct3.hpp) |
| Document listing | Mảng predecessor | Thật | Muthukrishnan 2002; chưa tìm được DOI | [Navarro 2014](https://arxiv.org/abs/1304.6023) |
| Phát sinh loài (LCA mapping) | Euler tour của cây loài | Thật, nhưng cần LCA | Cài đặt LCA cụ thể của Zmasek–Eddy chưa được kiểm | [Zmasek & Eddy 2001](https://doi.org/10.1093/bioinformatics/17.9.821) |
| XML keyword search (SLCA) | Nhãn Dewey | **Không phải RMQ** | LCA = tiền tố chung của nhãn Dewey | [Xu & Papakonstantinou](https://cseweb.ucsd.edu/classes/wi19/cse232B-a/papers/xu-lca.pdf) |
| git merge-base | DAG commit | Chỉ là so sánh | Có thể có nhiều "best common ancestor" | [git docs](https://git-scm.com/docs/git-merge-base) |
| Histogram lớn nhất | Chiều cao cột | Họ hàng hoặc thật | Giải bằng stack O(n) hoặc chia để trị bằng RMQ | [LeetCode 84](https://leetcode.com/problems/largest-rectangle-in-histogram/) |
| Hình thái học ảnh xám | Hàng, cột ảnh | Họ hàng (cửa sổ cố định) | Leptonica trích Gil–Werman | [Leptonica docs](https://v1.metacpan.org/pod/Image::Leptonica::Func::graymorphlow) |
| Chuỗi thời gian streaming | Tín hiệu | Họ hàng | Module movstat của GSL trích Lemire | [Lemire](https://arxiv.org/abs/cs/0610046) |
| OLAP | Measure của data cube | Thật (range-MAX) | Dùng cây phân cấp, không dùng Sparse Table | [Ho et al. 1997](https://doi.org/10.1145/253260.253274) |
| Minimap2 chaining | — | Thật, theo một preprint | GPU-RMQ nói chaining chiếm tới 35% thời gian chạy | [arXiv:2604.01811](https://arxiv.org/abs/2604.01811) |

Bảng này nhằm ngăn việc nói quá về ứng dụng. Bộ ghi chú đã kiểm `andi`: công cụ này cài đặt enhanced suffix array nhưng không có RMQ tường minh ([andi esa.c](https://github.com/evolbioinf/andi/blob/master/src/esa.c)). Việc MUMmer, BWA hay Bowtie có dùng RMQ hay không thì **chưa được kiểm**. Ví dụ "giá cổ phiếu thấp nhất trong khoảng" chỉ nên dùng như minh họa, vì ghi chú không tìm thấy nguồn có thẩm quyền nào.

## 9. Bài tập phân cấp năm mức cho sinh viên Việt Nam

Mọi bài dưới đây đã được kiểm là tồn tại với đúng tên đề. Rating Codeforces lấy qua API ngày 31/10/2026 và có thể thay đổi ([Codeforces API](https://codeforces.com/api/problemset.problems); [CSES](https://cses.fi/problemset/)). Hai bài từng được đề xuất nhưng **không phải bài RMQ** và cần bỏ khỏi danh sách: VNOJ LQDDIV (meet-in-the-middle, N ≤ 32) và Codeforces 870B (rating 1200, chỉ có tag greedy).

| Mức | Bài | Kỹ thuật, độ phức tạp |
|---|---|---|
| 1 | [CSES 1647 Static Range Minimum Queries](https://cses.fi/problemset/task/1647) | Sparse Table, O(n log n + q) |
| 1 | [SPOJ RMQSQ](https://www.spoj.com/problems/RMQSQ/) | Sparse Table; Segment Tree cũng qua |
| 1 | [Library Checker Static RMQ](https://judge.yosupo.jp/problem/staticrmq) | Sparse Table hoặc O(n)/O(1) để tăng tốc (ràng buộc chưa kiểm) |
| 1 | [VNOJ NKLINEUP](https://oj.vnoi.info/problem/nklineup) | Hai Sparse Table cho max và min, O(N log N + Q) |
| 1 | [CodeChef FRMQ](https://www.codechef.com/problems/FRMQ) | Sparse Table (chi tiết đề chưa kiểm) |
| 1 | [CSES 1649 Dynamic Range Minimum Queries](https://cses.fi/problemset/task/1649) | Segment Tree, O(log n) mỗi thao tác |
| 1 | [AtCoder Practice2 J](https://atcoder.jp/contests/practice2/tasks/practice2_j) | ACL segtree với max_right |
| 2 | [CSES 1645 Nearest Smaller Values](https://cses.fi/problemset/task/1645) | Monotonic stack O(n) (nguyên thủy ANSV) |
| 2 | [VNOJ MINK](https://oj.vnoi.info/problem/mink) | Deque O(N) cho mỗi test |
| 2 | [LeetCode 239](https://leetcode.com/problems/sliding-window-maximum/) | Deque O(n) |
| 2 | [LeetCode 84](https://leetcode.com/problems/largest-rectangle-in-histogram/) | Stack O(n), hoặc chia để trị bằng RMQ |
| 2 | [VNOJ QBRECT](https://oj.vnoi.info/problem/qbrect) | Histogram theo từng hàng + stack (nội dung đề chưa kiểm) |
| 2 | [VNOJ QMAX](https://oj.vnoi.info/problem/qmax) | Offline: mảng hiệu rồi Sparse Table |
| 2 | [VNOJ QMAX2](https://oj.vnoi.info/problem/qmax2) | Lazy Segment Tree |
| 2 | [CF 52C Circular RMQ (2200)](https://codeforces.com/problemset/problem/52/C) | Lazy Segment Tree, tách đoạn vòng thành hai |
| 3 | [CF 5C (1900)](https://codeforces.com/problemset/problem/5/C) | Prefix balance + RMQ + tìm kiếm nhị phân |
| 3 | [CF 514D (2000)](https://codeforces.com/problemset/problem/514/D) | Hai con trỏ + m Sparse Table |
| 3 | [CF 359D (2000)](https://codeforces.com/problemset/problem/359/D) | Sparse Table min và gcd + tìm kiếm nhị phân |
| 3 | [CF 475D CGCDSSQ (2000)](https://codeforces.com/problemset/problem/475/D) | Sparse Table gcd + các điểm đổi gcd |
| 3 | [CF 487B Strip (2000)](https://codeforces.com/problemset/problem/487/B) | DP + kiểm max−min + hai con trỏ |
| 3 | [CF 689D (2100)](https://codeforces.com/problemset/problem/689/D) | Hai Sparse Table + tìm kiếm nhị phân |
| 3 | [CF 1454F (2100)](https://codeforces.com/problemset/problem/1454/F) | Sparse Table + tìm kiếm nhị phân |
| 3 | [VNOJ AVLBIT](https://oj.vnoi.info/problem/avlbit) | Tag RMQ (đề chưa đọc) |
| 4 | [CSES 1688](https://cses.fi/problemset/task/1688), [CSES 1135](https://cses.fi/problemset/task/1135) | Euler tour + Sparse Table |
| 4 | [SPOJ LCA](https://www.spoj.com/problems/LCA/), [ABC014 D](https://atcoder.jp/contests/abc014/tasks/abc014_4) | LCA; độ dài chu trình = dist(a, b) + 1 |
| 4 | [CF 832D (1900)](https://codeforces.com/problemset/problem/832/D), [CF 191C (1900)](https://codeforces.com/problemset/problem/191/C), [CF 1328E (1900)](https://codeforces.com/problemset/problem/1328/E) | Khoảng cách qua LCA; hiệu trên cây; tin/tout |
| 4 | [SPOJ DISQUERY](https://www.spoj.com/problems/DISQUERY/), [VNOJ LUBENICA](https://oj.vnoi.info/problem/lubenica) | Binary lifting kèm min/max; **Euler-tour RMQ thôi là không đủ** |
| 4 | [VNOJ UPGRANET](https://oj.vnoi.info/problem/upgranet), [CF 609E (2100)](https://codeforces.com/problemset/problem/609/E) | MST + max trên đường đi |
| 4 | [CF 519E (2100)](https://codeforces.com/problemset/problem/519/E), [VNOJ HBTLCA](https://oj.vnoi.info/problem/hbtlca), [CF 916E (2400)](https://codeforces.com/problemset/problem/916/E) | Tổ tiên thứ k; LCA khi đổi gốc; Euler tour + lazy |
| 5 | [ABC213 F](https://atcoder.jp/contests/abc213/tasks/abc213_f), [CF 123D (2300)](https://codeforces.com/problemset/problem/123/D) | SA + LCP + monotonic stack |
| 5 | [CF 1073G (2600)](https://codeforces.com/problemset/problem/1073/G) | SA + LCP + **RMQ**: LCP của các hậu tố bất kỳ |
| 5 | [CF 803G (2300)](https://codeforces.com/problemset/problem/803/G) | Sparse Table trên khối gốc + Segment Tree nén tọa độ |
| 5 | [CF 1988E (2300)](https://codeforces.com/problemset/problem/1988/E), [CF 1730E (2700)](https://codeforces.com/problemset/problem/1730/E) | Đóng góp qua nearest smaller / Cartesian tree; thử thách |

Nguồn của danh sách: [ghi chú VNOI Wiki RMQ](https://wiki.vnoi.info/algo/data-structures/rmq) và [VNOI Wiki LCA binary lifting](https://wiki.vnoi.info/algo/data-structures/lca-binlift).

Lộ trình bài về nhà nên thêm đúng một kỹ thuật ở mỗi bước:

1. CSES 1647.
2. NKLINEUP.
3. MINK hoặc LeetCode 239 (họ hàng dùng deque).
4. CSES 1645 và LeetCode 84 (họ hàng dùng stack, tức ANSV).
5. CF 689D hoặc 1454F (RMQ kết hợp tìm kiếm nhị phân).
6. CSES 1688 và 1135 (Euler tour + RMQ cho LCA).
7. DISQUERY hoặc LUBENICA, để thấy giới hạn của Euler-tour RMQ.
8. ABC213F và CF 1073G (ứng dụng chuỗi).

Mỗi bài nên đi kèm bài đọc VNOI Wiki tương ứng: "Range Minimum Query (RMQ) - Sparse Table" của Lê Minh Hoàng, "Bài toán RMQ và bài toán LCA" (bản dịch TopCoder), "Các phương pháp giải bài toán LCA", "Mảng hậu tố (Suffix Array)" và "Hàng đợi hai đầu (deque) và Bài toán tìm max-min trong đoạn tịnh tiến" ([VNOI RMQ](https://wiki.vnoi.info/algo/data-structures/rmq); [VNOI RMQ–LCA](https://wiki.vnoi.info/translate/topcoder/Range-Minimum-Query-and-Lowest-Common-Ancestor); [VNOI LCA](https://wiki.vnoi.info/algo/data-structures/lca); [VNOI SA](https://wiki.vnoi.info/algo/string/suffix-array); [VNOI deque](https://wiki.vnoi.info/algo/data-structures/deque-min-max)). Các URL đoán `/algo/data-structures/sparse-table`, `/algo/graph-theory/lca` và `/algo/data-structures/lca-euler-tour` đều trả về 404, không dùng.

## 10. Kịch bản 30–40 phút bám năm yêu cầu của seminar

| Phút | Yêu cầu | Nội dung | Ví dụ / bằng chứng | Cảnh báo khi nói |
|---|---|---|---|---|
| 0–3 | (1) Phát biểu | RMQ trả vị trí, trái nhất khi hòa; tĩnh và động | A = [5,2,6,3,1,7,4,8] | Ví dụ cảm biến hay cổ phiếu chỉ là minh họa |
| 3–7 | (2) Cơ sở | Scan, bảng mọi đoạn, phản ví dụ prefix-min; word-RAM; word và bit; systematic và encoding | ⟨O(n²), O(1)⟩ | "O(n) bộ nhớ" nghĩa là O(n) word |
| 7–13 | (2)+(3) | Sparse Table, lũy đẳng, clz; giải CSES 1647 | Bảng các tầng; phản ví dụ với tổng | Không dùng `log2()` số thực |
| 13–19 | (2)+(3) | Cartesian tree dựng bằng stack, RMQ ↔ LCA, Euler tour 2n−1; slide lịch sử 1984 | Cây ví dụ; mảng E và D | Ghi công đúng: GBT 1984, không phải B–FC 2000 |
| 19–26 | (4) Tối ưu | Chia khối: ±1 (½ log n) → Fischer–Heun (¼ log n, Catalan, ballot) → block-bitmask (ctz) | Bảng mask 8 bit | Bitmask không phải Fischer–Heun; O(n) cần w = Θ(log n) |
| 26–29 | (4) Giới hạn | Cận dưới: 2n bit, Ω(c), Liu–Yu, log n/log log n | log₂ C_n ≈ 2n − 1,5 log n | Cận 2n−o(n) của ESCAPE 2007 đã bị rút lại |
| 29–33 | (4) Benchmark | 1 slide số liệu paper, 2 slide số liệu tự chạy | Bảng hòa vốn; bảng theo độ dài | Không trộn hai nguồn số liệu |
| 33–37 | (5) Ứng dụng | LCA, LCE với banana, document listing; phân biệt họ hàng | SA/LCP banana | XML SLCA và git không phải RMQ |
| 37–40 | (5) Bài tập | Năm mức, bản đồ mở rộng, ba thông điệp | Bảng mục 9 | — |

Để rút xuống 30 phút: gộp phần cận dưới vào một slide 1 phút (chỉ giữ lập luận Catalan), giữ một slide benchmark tự chạy (bảng hòa vốn), và chuyển 2D, offline, GPU sang slide dự phòng cho phần hỏi đáp. Khán giả là giảng viên nên câu hỏi phản biện sẽ đến từ ba hướng, và mỗi hướng đã có câu trả lời ở trên.

- **"Ai giải RMQ O(1) đầu tiên?"** Trả lời bằng mục 2.
- **"Block-bitmask có thật sự O(n) không?"** Trả lời bằng phân tích w = Θ(log n) ở mục 4.
- **"Vì sao không dùng Fischer–Heun trong thực tế?"** Trả lời bằng bảng hòa vốn ở mục 5 và bằng chứng của Ilie et al.

## 11. Đính chính: lỗi trích dẫn phổ biến và những chỗ ghi chú cũ cần sửa

| Cách nói sai hoặc thiếu | Cách nói đúng theo bộ ghi chú đã kiểm | Nguồn |
|---|---|---|
| "Bender & Farach-Colton (2000) hoặc Fischer–Heun (2006) là người đầu tiên đạt O(n)/O(1)" | Gabow–Bentley–Tarjan (STOC 1984) kết hợp LCA của Harel–Tarjan (1984) | [FH SICOMP](https://ae.iti.kit.edu/1810.php); [Liu & Yu](https://arxiv.org/abs/2004.05738) |
| "Bender & Farach-Colton phát minh thuật toán ±1RMQ" | Họ tự nói đó là tuần tự hóa một thuật toán PRAM của nhóm STOC 1989 | [preprint B–FC](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf) |
| "Harel–Tarjan giải RMQ" | Bài của Harel–Tarjan là về LCA | [SICOMP 13(2)](https://doi.org/10.1137/0213024) |
| "ESCAPE 2007 là encoding 2n+o(n) đầu tiên" | ESCAPE là systematic (2n+o(n)+\|A\|); encoding đầu tiên là Fischer, LATIN 2010 (arXiv 12/2008); bản hợp nhất là SICOMP 2011 | [BDR ESA 2010](https://cs.au.dk/~gerth/papers/esa10.pdf); [arXiv:0812.2775](https://arxiv.org/abs/0812.2775) |
| "Cần ít nhất 2n − o(n) bit phụ ngay cả khi được đọc A" | Cận này đã bị rút lại (chú thích 3 của SICOMP; S. Srinivasa Rao, 11/2007); indexing chỉ cần O(n/c) bit với truy vấn O(c) | [FH SICOMP](https://ae.iti.kit.edu/1810.php); [BDR](https://cs.au.dk/~gerth/papers/esa10.pdf) |
| "Pătraşcu–Demaine cho cận Ω(log n) của RMQ động" | Cận đúng là Θ(log n/log log n), từ Alstrup–Husfeldt–Rauhe (FOCS 1998, tr. **534–543**) | [BRICS RS-98-7](https://www.brics.dk/RS/98/7/BRICS-RS-98-7.pdf) |
| Gil & Werman đăng ở Pattern Recognition Letters | Gil–Werman đăng ở **IEEE TPAMI 15(5):504–507, 1993**; PRL 13(7) năm 1992 là bài của van Herk | [DOI 10.1109/34.211471](https://doi.org/10.1109/34.211471) |
| Golin et al. "Encoding 2D Range Maximum Queries" có sáu tác giả | Bản ISAAC 2011 có năm tác giả theo Crossref (Golin, Iacono, Krizanc, Raman, Rao); bản arXiv và TCS 2016 có sáu, thêm Shende | [DOI ISAAC](https://doi.org/10.1007/978-3-642-25591-5_20); [DOI TCS](https://doi.org/10.1016/j.tcs.2015.10.012) |
| Héliou et al. "Efficient dynamic range minimum query" năm 2017 | TCS 656:108–117, **2016** (Crossref và HAL) | [DOI](https://doi.org/10.1016/j.tcs.2016.07.002) |
| "Highly parallelizable problems" (STOC 1989) có tác giả chắc chắn | Crossref và BDR ghi 4 tác giả; Bender–Farach-Colton ghi 5 (thêm Breslauer). **Chưa giải quyết**, cần tự kiểm DBLP | [DOI](https://doi.org/10.1145/73007.73036) |
| "Compressed RMQ" (SPIRE 2018) có Gawrychowski | Bản SPIRE chỉ có 3 tác giả; Gawrychowski có tên ở bản TCS 2020 | [DOI](https://doi.org/10.1007/978-3-030-00479-8_17) |
| "Block-bitmask chính là Fischer–Heun" | Hai thuật toán chỉ chung ý chia khối; xử lý trong khối khác hẳn; nguồn gốc là cộng đồng thi đấu (jcg 2019, brunomont 2020) | [CF 78931](https://codeforces.com/blog/entry/78931) |
| "Hai BIT nhanh hơn Sparse Table" (Dima–Ceterchi) | Bài chỉ đo so với Segment Tree | [OI 2015](https://ioinformatics.org/journal/v9_2015_39_44.pdf) |
| "RMQ O(1) luôn là cách nhanh nhất để tính LCE" | So ký tự trực tiếp nhanh hơn khoảng 6 lần trong thí nghiệm của Ilie et al. | [Ilie et al.](https://users.dcc.uchile.cl/~gnavarro/ps/jda10.pdf) |
| "Kết quả của Liu ở SODA 2027 đã xuất bản" | Mới "to appear"; GPU-RMQ là preprint | [arXiv:2111.02318](https://arxiv.org/abs/2111.02318) |
| "XML keyword search và git merge-base dùng RMQ" | SLCA dùng nhãn Dewey; merge-base chạy trên DAG, chỉ là phép so sánh | [Xu & Papakonstantinou](https://cseweb.ucsd.edu/classes/wi19/cse232B-a/papers/xu-lca.pdf); [git docs](https://git-scm.com/docs/git-merge-base) |

Ghi chú cũ ([rmq_seminar_research_vi.md](/home/bao/Projects/RMQ/rmq_seminar_research_vi.md)) vẫn dùng được làm nền: phần Sparse Table, phép quy dẫn, ví dụ LCA/LCE, chương trình C++ minh họa và cảnh báo về path-min đều nhất quán với bộ ghi chú mới. Tuy vậy, có các điểm cần sửa hoặc bổ sung sau:

| Điểm trong ghi chú cũ | Đánh giá theo bộ ghi chú mới |
|---|---|
| Không nói ai đạt O(n)/O(1) đầu tiên; đặt Fischer–Heun 2006 làm "paper trọng tâm" | Bổ sung slide lịch sử: GBT 1984 cộng Harel–Tarjan. Fischer–Heun là bước làm trực tiếp, không phải bước đầu tiên |
| P3: "O(1) với 2n+o(n) bit" (SICOMP 2011) | Đúng, nhưng nên ghi chính xác 2n + O(n lg lg n/lg n), nêu rằng LATIN 2010 có trước, và rằng cận dưới 2n−o(n) của ESCAPE 2007 đã bị rút lại |
| P2 trỏ đến "bản toàn văn tác giả lưu tại AMiner" và hướng dẫn đọc theo §2–§5 | Bộ ghi chú mới không tìm được bản mở của CPM 2006 (bản Stanford cần đăng nhập). Link AMiner và nội dung từng mục **chưa được kiểm lại** |
| URL KIT `/english/1809.php`, `/english/1810.php` | Bộ ghi chú mới đọc bản preprint tại [ae.iti.kit.edu/1810.php](https://ae.iti.kit.edu/1810.php) |
| Scribe notes MIT 6.851 L15 và video COMP526 | Ghi chú mới không lấy được bản scribe MIT ở một URL khác và chưa kiểm COMP526, nên không dùng làm nguồn cho tên và năm công trình |
| PDF Dima–Ceterchi ở `/oi/pdf/` | Bản đã đọc nằm ở [ioinformatics.org/journal/v9_2015_39_44.pdf](https://ioinformatics.org/journal/v9_2015_39_44.pdf); bổ sung rằng claim về Sparse Table không có số liệu đỡ |
| Alzamel et al.: "O(min(n,q)) bộ nhớ phụ" | Đúng ra là O(q) word cộng O(n) bit (do mượn bit), thời gian n + O(q log q) cho ST-RMQ_CON |
| Benchmark cũ: AMD EPYC 9V74, g++ 13.3, n ≤ 200.000, không có block-bitmask | Đã được thay bằng benchmark tự chạy trên i5-13500HX với n tới 2^23, có block-bitmask, thí nghiệm hòa vốn theo q và theo độ dài. Kết luận "Segment thắng Sqrt từ 50% update" đổi thành "từ 75%" ở n = 2^17 |
| Bảng so sánh chưa có block-bitmask, BbST, Disjoint Sparse Table hay Sqrt Tree; chưa có cận dưới | Bổ sung ở mục 4 và mục 7 |
| 2D: "không mang nguyên 2n bit sang 2D" | Đúng và nay đã có chứng minh: không tồn tại Cartesian tree 2D, encoding cần Ω(N log m) bit |

## Kết luận

Điều đáng mang về từ văn liệu RMQ không phải là một thuật toán cụ thể mà là sự dịch chuyển của câu hỏi. Năm 1984, câu hỏi là "có đạt được O(1) không", và câu trả lời là có. Từ 2007, câu hỏi là "cần bao nhiêu bit", và Catalan cho đáp số 2n. Từ 2020, câu hỏi là "phần dư nhỏ nhất bao nhiêu với truy vấn t", và Liu–Yu cho thấy phần dư phải là n/polylog n. Song song với đó, phần thực hành chạy theo một trục khác hẳn: số lần truy cập bộ nhớ, cache và số truy vấn dùng chung chi phí xây. Trên trục này, cấu trúc tối ưu tiệm cận của Fischer–Heun gần như vắng mặt trong thư viện. Người thắng thực tế là Sparse Table, một biến thể khối hóa (BbST, block-bitmask), hoặc một encoding 2,1 bit khi bộ nhớ là ràng buộc. Seminar sẽ có chiều sâu nếu cho khán giả thấy hai trục này cùng lúc, bằng cùng một ví dụ mảng 8 phần tử và một bảng hòa vốn đo trên chính máy của người trình bày.

Hệ quả cho giảng dạy ở Việt Nam là RMQ nên được dạy như một bài học về mô hình, không chỉ về cấu trúc dữ liệu. Cùng một câu hỏi "min trên đoạn" có đáp án tối ưu khác nhau trong word-RAM, cell-probe, semigroup, indexing và encoding, và từng đáp án đều đã được chứng minh. Hai lỗ hổng còn mở rất hợp làm đề tài cho sinh viên. Thứ nhất, chưa có paper bình duyệt nào phân tích và đo đạc kỹ thuật block-bitmask, dù đây là cấu trúc O(n)/O(1) dễ cài nhất. Thứ hai, ghi chú không tìm thấy nghiên cứu công bố nào về Sparse Table tối ưu cho cache hoặc SIMD có số liệu cụ thể. Benchmark tự chạy trong báo cáo này có thể là điểm khởi đầu, miễn là có thêm hardware counter để biến các giả thuyết về cache thành kết luận.

## Phụ lục: Thư mục tham khảo hợp nhất đã kiểm chứng

Ký hiệu trạng thái: **✓C** nghĩa là metadata (tác giả, tên, nơi đăng, năm, trang) đã đối chiếu với bản ghi DOI trên Crossref; **✓P** nghĩa là đọc từ PDF gốc hoặc trang chính thức; **UNVERIFIED** đánh dấu trường chưa xác nhận. DBLP không truy vấn được trong cả hai đợt nghiên cứu (trang chống bot, HTTP 429).

### Lịch sử và nền tảng

| Tác giả | Tên | Nơi đăng, năm | DOI / URL | Trạng thái |
|---|---|---|---|---|
| J. Vuillemin | A unifying look at data structures | CACM 23(4):229–239, 1980 | [10.1145/358841.358852](https://doi.org/10.1145/358841.358852) | ✓C; toàn văn chưa đọc |
| H. N. Gabow, J. L. Bentley, R. E. Tarjan | Scaling and related techniques for geometry problems | STOC 1984, pp. 135–143 | [10.1145/800057.808675](https://doi.org/10.1145/800057.808675) | ✓C; toàn văn chưa đọc |
| D. Harel, R. E. Tarjan | Fast Algorithms for Finding Nearest Common Ancestors | SIAM J. Comput. 13(2):338–355, 1984 | [10.1137/0213024](https://doi.org/10.1137/0213024) | ✓C; tiền thân FOCS'80 UNVERIFIED |
| B. Schieber, U. Vishkin | On Finding Lowest Common Ancestors: Simplification and Parallelization | SIAM J. Comput. 17(6):1253–1262, 1988 | [10.1137/0217079](https://doi.org/10.1137/0217079) | ✓C |
| O. Berkman, Z. Galil, B. Schieber, U. Vishkin (± D. Breslauer) | Highly parallelizable problems | STOC 1989, pp. 309–319 | [10.1145/73007.73036](https://doi.org/10.1145/73007.73036) | Danh sách tác giả **UNVERIFIED (mâu thuẫn)** |
| O. Berkman, U. Vishkin | Recursive *-tree parallel data-structure / Recursive Star-Tree Parallel Data Structure | FOCS 1989, pp. 196–202; SIAM J. Comput. 22(2):221–242, 1993 | [10.1109/SFCS.1989.63478](https://doi.org/10.1109/SFCS.1989.63478); [10.1137/0222017](https://doi.org/10.1137/0222017) | ✓C |
| O. Berkman, B. Schieber, U. Vishkin | Optimal Doubly Logarithmic Parallel Algorithms Based on Finding All Nearest Smaller Values | J. Algorithms 14(3):344–370, 1993 | [10.1006/jagm.1993.1018](https://doi.org/10.1006/jagm.1993.1018) | ✓C; cận cụ thể UNVERIFIED |
| M. A. Bender, M. Farach-Colton | The LCA Problem Revisited | LATIN 2000, LNCS 1776, pp. 88–94 | [10.1007/10719839_9](https://doi.org/10.1007/10719839_9); [preprint](https://www3.cs.stonybrook.edu/~bender/newpub/BenderFa00-lca.pdf) | ✓C, ✓P (preprint có thể khác bản LNCS) |
| M. A. Bender, M. Farach-Colton, G. Pemmasani, S. Skiena, P. Sumazin | Lowest common ancestors in trees and directed acyclic graphs | J. Algorithms 57(2):75–94, 2005 | [10.1016/j.jalgor.2005.08.001](https://doi.org/10.1016/j.jalgor.2005.08.001) | ✓C; nội dung chưa đọc |
| S. Alstrup, C. Gavoille, H. Kaplan, T. Rauhe | Nearest Common Ancestors: A Survey and a New Algorithm for a Distributed Environment | SPAA 2002, pp. 258–264; Theory Comput. Syst. 37(3):441–456, 2004 | [10.1145/564870.564914](https://doi.org/10.1145/564870.564914); [10.1007/s00224-004-1155-5](https://doi.org/10.1007/s00224-004-1155-5) | ✓C |
| J. Fischer, V. Heun | Theoretical and Practical Improvements on the RMQ-Problem, with Applications to LCA and LCE | CPM 2006, LNCS 4009, pp. 36–48 | [10.1007/11780441_5](https://doi.org/10.1007/11780441_5) | ✓C; toàn văn chưa đọc |
| J. Fischer, V. Heun | A New Succinct Representation of RMQ-Information and Improvements in the Enhanced Suffix Array | ESCAPE 2007, LNCS 4614, pp. 459–470 | [10.1007/978-3-540-74450-4_41](https://doi.org/10.1007/978-3-540-74450-4_41) | ✓C; toàn văn chưa đọc |
| J. Fischer | Data Structures for Efficient String Algorithms (luận án tiến sĩ, LMU München) | 2007 | [PDF](https://edoc.ub.uni-muenchen.de/7505/1/Fischer_Johannes.pdf) | ✓P |
| J. Fischer, V. Heun, H. M. Stühler | Practical Entropy-Bounded Schemes for O(1)-Range Minimum Queries | DCC 2008, pp. 272–281 | [10.1109/DCC.2008.45](https://doi.org/10.1109/DCC.2008.45) | ✓C |
| J. Fischer | Optimal Succinctness for Range Minimum Queries | LATIN 2010, LNCS 6034, pp. 158–169 | [10.1007/978-3-642-12200-2_16](https://doi.org/10.1007/978-3-642-12200-2_16); [arXiv:0812.2775](https://arxiv.org/abs/0812.2775) | ✓C, ✓P |
| J. Fischer, V. Heun | Space-Efficient Preprocessing Schemes for Range Minimum Queries on Static Arrays | SIAM J. Comput. 40(2):465–492, 2011 | [10.1137/090779759](https://doi.org/10.1137/090779759); [preprint KIT](https://ae.iti.kit.edu/1810.php) | ✓C, ✓P |
| K. Sadakane | Space-Efficient Data Structures for Flexible Text Retrieval Systems | ISAAC 2002, pp. 14–24 | [10.1007/3-540-36136-7_2](https://doi.org/10.1007/3-540-36136-7_2) | Số tập LNCS và việc bản này đã có RMQ 4n hay chưa: UNVERIFIED |
| K. Sadakane | Succinct data structures for flexible text retrieval systems | J. Discrete Algorithms 5(1):12–22, 2007 | [10.1016/j.jda.2006.03.011](https://doi.org/10.1016/j.jda.2006.03.011) | ✓C |
| K. Sadakane | Compressed Suffix Trees with Full Functionality | Theory Comput. Syst. 41(4):589–607, 2007 | [10.1007/s00224-006-1198-x](https://doi.org/10.1007/s00224-006-1198-x) | ✓C |
| G. Navarro, K. Sadakane | Fully Functional Static and Dynamic Succinct Trees | ACM TALG 10(3), Art. 16, 2014; SODA 2010, pp. 134–149 | [10.1145/2601073](https://doi.org/10.1145/2601073); [10.1137/1.9781611973075.13](https://doi.org/10.1137/1.9781611973075.13) | ✓C |
| P. Davoodi, G. Navarro, R. Raman, S. S. Rao | Encoding range minima and range top-2 queries | Phil. Trans. R. Soc. A 372: 20130131, 2014 | [10.1098/rsta.2013.0131](https://doi.org/10.1098/rsta.2013.0131) | ✓C |
| P. Davoodi, R. Raman, S. R. Satti | Succinct Representations of Binary Trees for Range Minimum Queries | COCOON 2012, pp. 396–407 | [10.1007/978-3-642-32241-9_34](https://doi.org/10.1007/978-3-642-32241-9_34) | ✓C; bản tạp chí 2017 UNVERIFIED |
| J. I. Munro, S. Wild | (RMQ tối ưu trung bình 1,736n bit) | arXiv 2019 | [arXiv:1903.02533](https://arxiv.org/abs/1903.02533) | Nơi đăng UNVERIFIED |
| J. I. Munro, P. K. Nicholson, L. Seelbach Benkner, S. Wild | Hypersuccinct Trees | ESA 2021 (LIPIcs) | [10.4230/LIPIcs.ESA.2021.70](https://doi.org/10.4230/LIPIcs.ESA.2021.70) | DOI lấy từ metadata arXiv |
| S. Durocher; S. Durocher, R. Singh | A Simple Linear-Space Data Structure for Constant-Time Range Minimum Query | LNCS 2013, pp. 48–60; TCS 2019, pp. 51–61 | [10.1007/978-3-642-40273-9_5](https://doi.org/10.1007/978-3-642-40273-9_5); [10.1016/j.tcs.2018.10.019](https://doi.org/10.1016/j.tcs.2018.10.019) | ✓C; nội dung chưa đọc |

### Cận dưới, động, semigroup, offline

| Tác giả | Tên | Nơi đăng, năm | DOI / URL | Trạng thái |
|---|---|---|---|---|
| G. S. Brodal, P. Davoodi, S. S. Rao | On Space Efficient Two Dimensional Range Minimum Data Structures | ESA 2010, LNCS 6347, pp. 171–182; Algorithmica 63(4):815–830, 2012 | [10.1007/978-3-642-15781-3_15](https://doi.org/10.1007/978-3-642-15781-3_15); [10.1007/s00453-011-9499-0](https://doi.org/10.1007/s00453-011-9499-0) | ✓C, ✓P (bản ESA) |
| M. Liu, H. Yu | Lower bound for succinct range minimum query | STOC 2020, pp. 1402–1415 | [10.1145/3357713.3384260](https://doi.org/10.1145/3357713.3384260) | ✓C, ✓P |
| M. Liu | Nearly Tight Lower Bound for Range Minimum Query via Probe-by-Probe Information Accounting | "To appear" ở SODA 2027 | [arXiv:2111.02318](https://arxiv.org/abs/2111.02318) | Chưa xuất bản |
| S. Alstrup, T. Husfeldt, T. Rauhe | Marked ancestor problems | FOCS 1998, pp. 534–543 | [10.1109/SFCS.1998.743504](https://doi.org/10.1109/SFCS.1998.743504); [BRICS RS-98-7](https://www.brics.dk/RS/98/7/BRICS-RS-98-7.pdf) | ✓C, ✓P |
| M. Pătraşcu, E. D. Demaine | Logarithmic Lower Bounds in the Cell-Probe Model | SIAM J. Comput. 35(4):932–963, 2006 | [10.1137/S0097539705447256](https://doi.org/10.1137/S0097539705447256) | ✓C |
| G. S. Brodal, P. Davoodi, S. S. Rao | Path Minima Queries in Dynamic Weighted Trees | WADS 2011, pp. 290–301 | [10.1007/978-3-642-22300-6_25](https://doi.org/10.1007/978-3-642-22300-6_25) | ✓C; LNCS 6844 UNVERIFIED |
| G. S. Brodal, S. Chaudhuri, J. Radhakrishnan | The Randomized Complexity of Maintaining the Minimum | SWAT 1996, LNCS 1097, pp. 4–15 | [10.1007/3-540-61422-2_116](https://doi.org/10.1007/3-540-61422-2_116) | ✓C |
| P. Bille, I. L. Gørtz, T. Stordalen, M. Pérez López | Dynamic Range Minimum Queries on the Ultra-Wide Word RAM | SOFSEM 2025 | [arXiv:2411.16281](https://arxiv.org/abs/2411.16281) | DOI hội nghị UNVERIFIED |
| A. Héliou, M. Léonard, L. Mouchard, M. Salson | Efficient dynamic range minimum query | TCS 656:108–117, 2016 | [10.1016/j.tcs.2016.07.002](https://doi.org/10.1016/j.tcs.2016.07.002) | ✓C |
| A. C. Yao | Space-time tradeoff for answering range queries | STOC 1982, pp. 128–136 | [10.1145/800070.802185](https://doi.org/10.1145/800070.802185) | ✓C |
| N. Alon, B. Schieber | Optimal Preprocessing for Answering On-Line Product Queries | TR Tel Aviv 1987; arXiv 2024 | [arXiv:2406.06321](https://arxiv.org/abs/2406.06321) | Số TR UNVERIFIED |
| A. G. Jørgensen, K. G. Larsen | Range Selection and Median: Tight Cell Probe Lower Bounds and Adaptive Data Structures | SODA 2011, pp. 805–813 | [10.1137/1.9781611973082.63](https://doi.org/10.1137/1.9781611973082.63) | ✓C |
| R. E. Tarjan | Applications of Path Compression on Balanced Trees | J. ACM 26(4):690–715, 1979 | [10.1145/322154.322161](https://doi.org/10.1145/322154.322161) | ✓C |
| H. N. Gabow, R. E. Tarjan | A linear-time algorithm for a special case of disjoint set union | STOC 1983, pp. 246–251; JCSS 30(2):209–221, 1985 | [10.1145/800061.808753](https://doi.org/10.1145/800061.808753); [10.1016/0022-0000(85)90014-5](https://doi.org/10.1016/0022-0000(85)90014-5) | ✓C; việc áp dụng cho offline LCA UNVERIFIED |
| M. Alzamel, P. Charalampopoulos, C. S. Iliopoulos, S. P. Pissis | How to Answer a Small Batch of RMQs or LCA Queries in Practice | IWOCA 2017, LNCS 10765 (2018), pp. 343–355 | [10.1007/978-3-319-78825-8_28](https://doi.org/10.1007/978-3-319-78825-8_28) | ✓C |

### Hai chiều, nén, cửa sổ trượt

| Tác giả | Tên | Nơi đăng, năm | DOI / URL | Trạng thái |
|---|---|---|---|---|
| A. Amir, J. Fischer, M. Lewenstein | Two-Dimensional Range Minimum Queries | CPM 2007, pp. 286–294 | [10.1007/978-3-540-73437-6_29](https://doi.org/10.1007/978-3-540-73437-6_29) | ✓C; LNCS 4580 UNVERIFIED |
| H. Yuan, M. J. Atallah | Data Structures for Range Minimum Queries in Multidimensional Arrays | SODA 2010, pp. 150–160 | [10.1137/1.9781611973075.14](https://doi.org/10.1137/1.9781611973075.14) | ✓C |
| E. D. Demaine, G. M. Landau, O. Weimann | On Cartesian Trees and Range Minimum Queries | ICALP 2009, pp. 341–353; Algorithmica 68(3):610–625, 2014 | [10.1007/978-3-642-02927-1_29](https://doi.org/10.1007/978-3-642-02927-1_29); [10.1007/s00453-012-9683-x](https://doi.org/10.1007/s00453-012-9683-x) | ✓C |
| M. J. Golin, J. Iacono, D. Krizanc, R. Raman, S. S. Rao (ISAAC); thêm S. M. Shende (TCS) | Encoding 2D Range Maximum Queries | ISAAC 2011, pp. 180–189; TCS 609:316–327, 2016 | [10.1007/978-3-642-25591-5_20](https://doi.org/10.1007/978-3-642-25591-5_20); [10.1016/j.tcs.2015.10.012](https://doi.org/10.1016/j.tcs.2015.10.012) | ✓C; danh sách tác giả hai bản khác nhau |
| G. S. Brodal, A. Brodnik, P. Davoodi | The Encoding Complexity of Two Dimensional Range Minimum Data Structures | ESA 2013, pp. 229–240 | [10.1007/978-3-642-40450-4_20](https://doi.org/10.1007/978-3-642-40450-4_20) | ✓C |
| G. S. Brodal, P. Davoodi, M. Lewenstein, R. Raman, S. S. Rao | Two Dimensional Range Minimum Queries and Fibonacci Lattices | ESA 2012, pp. 217–228; TCS 638:33–43, 2016 | [10.1007/978-3-642-33090-2_20](https://doi.org/10.1007/978-3-642-33090-2_20); [10.1016/j.tcs.2016.02.016](https://doi.org/10.1016/j.tcs.2016.02.016) | ✓C |
| P. Gawrychowski, A. Górkiewicz, S. R. Satti | Near-Optimal and Efficient Encoding for Two-Dimensional Range Minimum Queries | ESA 2026, LIPIcs Art. 51 | [10.4230/LIPIcs.ESA.2026.51](https://doi.org/10.4230/LIPIcs.ESA.2026.51) | ✓P (PDF LIPIcs, chưa đối chiếu Crossref) |
| S. Jo, S. R. Satti | Encodings for Range Minimum Queries over Bounded Alphabets | CPM 2025; TCS 1070:115824, 2026 | [10.4230/LIPIcs.CPM.2025.25](https://doi.org/10.4230/LIPIcs.CPM.2025.25); [10.1016/j.tcs.2026.115824](https://doi.org/10.1016/j.tcs.2026.115824) | ✓C (bản TCS) |
| S. Jo, R. Lingala, S. R. Satti | Encoding Two-Dimensional Range Top-k Queries | Algorithmica 83:3379–3402, 2021 | [10.1007/s00453-021-00856-1](https://doi.org/10.1007/s00453-021-00856-1) | ✓C |
| B. Chazelle, B. Rosenberg | Computing partial sums in multidimensional arrays | SoCG 1989, pp. 131–139 | [10.1145/73833.73848](https://doi.org/10.1145/73833.73848) | ✓C |
| S. Jo, S. Mozes, O. Weimann | Compressed Range Minimum Queries | SPIRE 2018, pp. 206–217 | [10.1007/978-3-030-00479-8_17](https://doi.org/10.1007/978-3-030-00479-8_17) | ✓C; LNCS 11147 UNVERIFIED |
| P. Gawrychowski, S. Jo, S. Mozes, O. Weimann | Compressed range minimum queries | TCS 812:39–48, 2020 | [10.1016/j.tcs.2019.07.002](https://doi.org/10.1016/j.tcs.2019.07.002) | ✓C |
| M. van Herk | A fast algorithm for local minimum and maximum filters on rectangular and octagonal kernels | Pattern Recognition Letters 13(7):517–521, 1992 | [10.1016/0167-8655(92)90069-C](https://doi.org/10.1016/0167-8655(92)90069-C) | ✓C; số issue UNVERIFIED |
| J. Gil, M. Werman | Computing 2-D min, median, and max filters | IEEE TPAMI 15(5):504–507, 1993 | [10.1109/34.211471](https://doi.org/10.1109/34.211471) | ✓C; số issue lấy theo trích dẫn của Leptonica |
| J. Y. Gil, R. Kimmel | Efficient dilation, erosion, opening, and closing algorithms | IEEE TPAMI 24(12):1606–1617, 2002 | [10.1109/TPAMI.2002.1114852](https://doi.org/10.1109/TPAMI.2002.1114852) | ✓C |
| D. Lemire | Streaming Maximum-Minimum Filter Using No More than Three Comparisons per Element | Nordic J. Computing 13(4):328–339, 2006 | [arXiv cs/0610046](https://arxiv.org/abs/cs/0610046) | Không có DOI |

### Kỹ thuật, benchmark, song song và GPU

| Tác giả | Tên | Nơi đăng, năm | DOI / URL | Trạng thái |
|---|---|---|---|---|
| H. Ferrada, G. Navarro | Improved Range Minimum Queries | DCC 2016, pp. 516–525; J. Discrete Algorithms 43:72–80, 2017 | [10.1109/DCC.2016.42](https://doi.org/10.1109/DCC.2016.42); [10.1016/j.jda.2016.09.002](https://doi.org/10.1016/j.jda.2016.09.002) | ✓C, ✓P |
| N. Baumstark, S. Gog, T. Heuer, J. Labeit | Practical Range Minimum Queries Revisited | SEA 2017, LIPIcs 75, Art. 12 | [10.4230/LIPIcs.SEA.2017.12](https://doi.org/10.4230/LIPIcs.SEA.2017.12) | ✓P (DROPS) |
| T. M. Kowalski, S. Grabowski | Faster range minimum queries | Software: Practice and Experience 48:2043–2060, 2018 | [10.1002/spe.2597](https://doi.org/10.1002/spe.2597); [arXiv:1711.10385](https://arxiv.org/abs/1711.10385) | ✓C, ✓P |
| L. Ilie, G. Navarro, L. Tinta | The longest common extension problem revisited and applications to approximate string searching | J. Discrete Algorithms 8(4):418–428, 2010 | [10.1016/j.jda.2010.08.004](https://doi.org/10.1016/j.jda.2010.08.004) | ✓C, ✓P |
| M. Dima, R. Ceterchi | Efficient Range Minimum Queries using Binary Indexed Trees | Olympiads in Informatics 9:39–44, 2015 | [10.15388/ioi.2015.04](https://doi.org/10.15388/ioi.2015.04); [PDF](https://ioinformatics.org/journal/v9_2015_39_44.pdf) | ✓P |
| E. Meneses, C. A. Navarro, H. Ferrada, F. A. Quezada | Accelerating range minimum queries with ray tracing cores | Future Generation Computer Systems 157:98–111, 2024 | [10.1016/j.future.2024.03.040](https://doi.org/10.1016/j.future.2024.03.040) | ✓C |
| L. Kreis, Henneberg, Henkys, Schuhknecht, Schmidt | GPU-RMQ: Accelerating Range Minimum Queries on Modern GPUs | arXiv, 2/4/2026 | [arXiv:2604.01811](https://arxiv.org/abs/2604.01811) | Preprint; tên riêng các đồng tác giả chưa đầy đủ trong ghi chú |
| A. Polak, A. Siwiec, M. Stobierski | Euler Meets GPU: Practical Graph Algorithms with Theoretical Guarantees | IPDPS 2021, pp. 233–244 | [10.1109/IPDPS49936.2021.00032](https://doi.org/10.1109/IPDPS49936.2021.00032) | ✓C |
| S. Gog, T. Beller, A. Moffat, M. Petri | From Theory to Practice: Plug and Play with Succinct Data Structures | SEA 2014, pp. 326–337 | [10.1007/978-3-319-07959-2_28](https://doi.org/10.1007/978-3-319-07959-2_28) | ✓C |
| brunomont; jcg; allvik66; gepardo; ramchandra | Các bài blog Codeforces 78931, 71706, 92310, 57046, 79108 | 2018–2021 | [78931](https://codeforces.com/blog/entry/78931); [71706](https://codeforces.com/blog/entry/71706?#comment-560384); [92310](https://codeforces.com/blog/entry/92310); [57046](https://codeforces.com/blog/entry/57046); [79108](https://codeforces.com/blog/entry/79108) | Nguồn cộng đồng, không bình duyệt |

### Ứng dụng

| Tác giả | Tên | Nơi đăng, năm | DOI / URL | Trạng thái |
|---|---|---|---|---|
| U. Manber, G. Myers | Suffix Arrays: A New Method for On-Line String Searches | SIAM J. Comput. 22(5):935–948, 1993 | [10.1137/0222058](https://doi.org/10.1137/0222058) | ✓C |
| T. Kasai, G. Lee, H. Arimura, S. Arikawa, K. Park | Linear-Time Longest-Common-Prefix Computation in Suffix Arrays and Its Applications | CPM 2001, pp. 181–192 | [10.1007/3-540-48194-x_17](https://doi.org/10.1007/3-540-48194-x_17) | ✓C; LNCS 2089 UNVERIFIED |
| M. I. Abouelhoda, S. Kurtz, E. Ohlebusch | Replacing suffix trees with enhanced suffix arrays | J. Discrete Algorithms 2:53–86, 2004 | [10.1016/S1570-8667(03)00065-0](https://doi.org/10.1016/S1570-8667(03)00065-0) | ✓C |
| G. M. Landau, U. Vishkin | Efficient string matching with k mismatches; Fast parallel and serial approximate string matching | TCS 43:239–249, 1986; J. Algorithms 10(2):157–169, 1989 | [10.1016/0304-3975(86)90178-7](https://doi.org/10.1016/0304-3975(86)90178-7); [10.1016/0196-6774(89)90010-2](https://doi.org/10.1016/0196-6774(89)90010-2) | ✓C |
| J. Fischer, V. Mäkinen, G. Navarro | Faster entropy-bounded compressed suffix trees | TCS 410(51):5354–5364, 2009 | [10.1016/j.tcs.2009.09.012](https://doi.org/10.1016/j.tcs.2009.09.012) | ✓C |
| E. Ohlebusch, J. Fischer, S. Gog | CST++ | SPIRE 2010, LNCS 6393, pp. 322–333 | [10.1007/978-3-642-16321-0_34](https://doi.org/10.1007/978-3-642-16321-0_34) | ✓C |
| T. Gagie, G. Navarro, N. Prezza | Fully Functional Suffix Trees and Optimal Text Searching in BWT-Runs Bounded Space | J. ACM 67(1):1–54, 2020 | [10.1145/3375890](https://doi.org/10.1145/3375890) | ✓C, ✓P (arXiv) |
| H. Bannai, T. I, S. Inenaga, Y. Nakashima, M. Takeda, K. Tsuruta | The "Runs" Theorem | SIAM J. Comput. 46(5):1501–1514, 2017 | [10.1137/15M1011032](https://doi.org/10.1137/15M1011032) | ✓C |
| R. Kolpakov, G. Kucherov; M. G. Main, R. J. Lorentz | Finding maximal repetitions in a word in linear time; An O(n log n) algorithm for finding all repetitions in a string | FOCS 1999, pp. 596–604; J. Algorithms 5(3):422–432, 1984 | [10.1109/SFFCS.1999.814634](https://doi.org/10.1109/SFFCS.1999.814634); [10.1016/0196-6774(84)90021-X](https://doi.org/10.1016/0196-6774(84)90021-X) | ✓C; cơ chế LCE bên trong chưa đọc |
| S. Muthukrishnan | Efficient algorithms for document retrieval problems | SODA 2002, pp. 657–666 | (không tìm được DOI) | Nội dung lấy theo khảo sát của Navarro |
| G. Navarro | Spaces, Trees, and Colors: The Algorithmic Landscape of Document Retrieval on Sequences | ACM Computing Surveys 46(4), Art. 52, 2014 | [10.1145/2535933](https://doi.org/10.1145/2535933); [arXiv:1304.6023](https://arxiv.org/abs/1304.6023) | ✓C, ✓P |
| C. M. Zmasek, S. R. Eddy | A simple algorithm to infer gene duplication and speciation events on a gene tree | Bioinformatics 17(9):821–828, 2001 | [10.1093/bioinformatics/17.9.821](https://doi.org/10.1093/bioinformatics/17.9.821) | ✓C; cài đặt LCA UNVERIFIED |
| Y. Xu, Y. Papakonstantinou | Efficient keyword search for smallest LCAs in XML databases | SIGMOD 2005, pp. 527–538 | [10.1145/1066157.1066217](https://doi.org/10.1145/1066157.1066217) | ✓C, ✓P |
| C.-T. Ho, R. Agrawal, N. Megiddo, R. Srikant | Range queries in OLAP data cubes | SIGMOD 1997, pp. 73–88 | [10.1145/253260.253274](https://doi.org/10.1145/253260.253274) | ✓C (một trang IBM ghi sai tác giả) |
| M. Crochemore, L. Ilie; J. Kärkkäinen, D. Kempa, S. J. Puglisi | Computing Longest Previous Factor in linear time and applications; Linear Time Lempel-Ziv Factorization: Simple, Fast, Small | IPL 106(2):75–80, 2008; CPM 2013, pp. 189–200 | [10.1016/j.ipl.2007.10.006](https://doi.org/10.1016/j.ipl.2007.10.006); [10.1007/978-3-642-38905-4_19](https://doi.org/10.1007/978-3-642-38905-4_19) | ✓C; cơ chế PSV/NSV bên trong UNVERIFIED |
| B. Chazelle | Computing on a free tree via complexity-preserving mappings | Algorithmica 2:337–361, 1987 | [10.1007/BF01840366](https://doi.org/10.1007/BF01840366) | ✓C; các cận chưa đọc |

Benchmark tự chạy (không phải tài liệu công bố): mã nguồn [rmq_bench.cpp](/home/bao/Projects/RMQ/seminar/benchmark/rmq_bench.cpp), môi trường [environment.json](/home/bao/Projects/RMQ/seminar/benchmark/environment.json), số liệu [results_summary_all.csv](/home/bao/Projects/RMQ/seminar/benchmark/results_summary_all.csv) và [results_summary_scale.csv](/home/bao/Projects/RMQ/seminar/benchmark/results_summary_scale.csv). Chạy ngày 31/10/2026 trên i5-13500HX với GCC 15.3.0.
