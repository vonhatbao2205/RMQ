# Range Minimum Query: tài liệu đọc kèm seminar

**Truy vấn giá trị nhỏ nhất trên đoạn**

Nhóm trình bày: Phạm Lê Huy Hoàng (24120182), Võ Nhất Bảo (24120166), Nguyễn Đức Lãm (24120083)
Giảng viên hướng dẫn: Nguyễn Hải Đăng · Ngày trình bày: 03/11/2026

Slide tương tác (có video và ví dụ chạy được): https://claude.ai/artifact/D2zM8e8EH2WekCsjhHiAAW

Tài liệu này viết lại toàn bộ nội dung của buổi seminar ở dạng đọc được một mình, không cần người trình bày. Mỗi thuật toán đi theo cùng một trình tự: ý tưởng, ví dụ tính tay, lý do đúng, chi phí, lỗi hay gặp. Nội dung lấy từ slide, tài liệu nghiên cứu của nhóm và các nguồn ở mục [Tài liệu tham khảo](#9-tài-liệu-tham-khảo).

Người đọc chỉ cần biết mảng, vòng lặp, đệ quy, cây nhị phân và ký hiệu $O(\cdot)$.

---

## Mục lục

1. [Câu chuyện mở đầu](#1-câu-chuyện-mở-đầu)
2. [Bài toán](#2-bài-toán)
3. [Cơ sở thuật toán](#3-cơ-sở-thuật-toán)
4. [Áp dụng vào bài toán thật](#4-áp-dụng-vào-bài-toán-thật)
5. [Tối ưu: xây O(n), hỏi O(1) với Fischer–Heun](#5-tối-ưu-xây-on-hỏi-o1-với-fischerheun)
6. [Benchmark](#6-benchmark)
7. [RMQ trong thực tế](#7-rmq-trong-thực-tế)
8. [Tổng kết, luyện tập và câu hỏi thường gặp](#8-tổng-kết-luyện-tập-và-câu-hỏi-thường-gặp)
9. [Tài liệu tham khảo](#9-tài-liệu-tham-khảo)

---

## Quy ước dùng trong toàn bộ tài liệu

- Chỉ số mảng bắt đầu từ 0.
- $\mathrm{RMQ}(l, r)$ trả về **vị trí** của phần tử nhỏ nhất trong đoạn $A[l..r]$ (gồm cả hai đầu), không phải giá trị.
- Nếu có nhiều phần tử cùng nhỏ nhất, chọn **vị trí bên trái nhất**.
- Mảng ví dụ xuyên suốt là giá vé 8 ngày, đơn vị trăm nghìn đồng, chỉ số $i$ ứng với ngày $(3+i)/11$:

| $i$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| Ngày | 3/11 | 4/11 | 5/11 | 6/11 | 7/11 | 8/11 | 9/11 | 10/11 |
| $A[i]$ | 7 | 4 | 9 | 4 | 6 | 2 | 2 | 8 |

- Hàm `better(p, q)` chọn chỉ số "tốt hơn" giữa hai ứng viên: giá trị nhỏ hơn thắng, bằng nhau thì chỉ số nhỏ hơn thắng. Mọi cấu trúc trong tài liệu dùng chung hàm này để quy tắc chọn trái luôn nhất quán.

```cpp
int better(int p, int q) {           // A là mảng gốc
    if (A[p] != A[q]) return A[p] < A[q] ? p : q;
    return min(p, q);                // bằng nhau: chọn bên trái
}
```

---

## 1. Câu chuyện mở đầu

Nhân vật Pi muốn bay từ TP.HCM ra Hà Nội. Một hệ thống đã thu thập giá vé thấp nhất của từng ngày. Pi chọn một khoảng ngày có thể đi, và hệ thống phải trả về ngày rẻ nhất trong khoảng đó.

Cách tự nhiên nhất là đọc từng ô giá trong khoảng và nhớ ô rẻ nhất. Với một người hỏi, cách này ổn. Nhưng hệ thống có rất nhiều người dùng, mỗi người hỏi một khoảng khác nhau, và các khoảng thường chồng lên nhau. Cùng một ô giá bị đọc đi đọc lại, trong khi bảng giá không hề thay đổi. Chỉ sáu người hỏi là tổng số ô đã đọc đã vượt độ dài cả mảng. Với hàng nghìn người, phần lớn công sức là đọc lại những gì đã đọc.

Câu hỏi của cả buổi là: **dữ liệu đã có sẵn, có thể làm thêm một ít việc trước để mọi câu hỏi sau đều trả lời nhanh không?**

Với lập trình viên, bảng giá chỉ là một mảng, mỗi câu hỏi là một đoạn $[l, r]$. Cách quét:

```cpp
int pos = l;
for (int i = l + 1; i <= r; ++i)
    if (A[i] < A[pos]) pos = i;      // dấu < giữ vị trí cũ khi bằng nhau
```

Đoạn dài $L$ cần $L-1$ phép so sánh, tệ nhất $O(n)$. Với $n = q = 10^5$ (100 nghìn ngày, 100 nghìn câu hỏi) là khoảng $10^{10}$ phép so sánh, quá chậm. Bài toán này có tên là **Range Minimum Query (RMQ)**.

Ngoài đời giá vé thay đổi liên tục, nên phải tách hai tình huống ngay từ đầu:

| Tình huống | Đặc điểm | Hướng giải |
|---|---|---|
| Bảng giá đã chốt (RMQ tĩnh) | Dữ liệu không đổi trong lúc hỏi, được phép chuẩn bị kỹ | Sparse Table, Fischer–Heun |
| Giá đổi xen kẽ câu hỏi (RMQ động) | Những gì tính trước có thể hết đúng | Segment Tree, chia khối |

---

## 2. Bài toán

### 2.1 Định nghĩa

Cho mảng $A[0..n-1]$. Với mỗi truy vấn $(l, r)$, $0 \le l \le r < n$:

$$\mathrm{RMQ}_A(l, r) = \arg\min_{l \le k \le r} A[k]$$

(lấy $k$ nhỏ nhất nếu có nhiều vị trí cùng đạt min).

Ví dụ trên mảng giá vé:

| Truy vấn | Đoạn | Đáp án | Giải thích |
|---|---|---|---|
| $\mathrm{RMQ}(1, 4)$ | [4, 9, 4, 6] | 1 | Số 4 xuất hiện ở vị trí 1 và 3, chọn bên trái |
| $\mathrm{RMQ}(3, 6)$ | [4, 6, 2, 2] | 5 | Trả **chỉ số trong mảng gốc** (5), không phải thứ tự trong đoạn con (2) |
| $\mathrm{RMQ}(1, 6)$ | [4, 9, 4, 6, 2, 2] | 5 | Min là 2, xuất hiện đầu tiên ở vị trí 5 |
| $\mathrm{RMQ}(0, 7)$ | cả mảng | 5 | Hai số 2 ở vị trí 5 và 6, chọn 5 |
| $\mathrm{RMQ}(6, 6)$ | [2] | 6 | Đoạn một phần tử |

**Vì sao trả vị trí mà không trả giá trị?** Biết vị trí thì lấy được giá trị ($A[k]$), chiều ngược lại thì không. Trong câu chuyện, Pi cần biết *ngày nào* rẻ nhất chứ không chỉ giá. Nhiều ứng dụng ở mục 7 (LCA, LCP, tìm tài liệu) cũng cần vị trí.

**Vì sao chọn bên trái?** Hai ngày cùng giá thì bay ngày sớm hơn. Về kỹ thuật, một quy tắc cố định giúp mọi cấu trúc cho cùng một đáp án, kiểm thử được bằng cách so với duyệt trâu.

### 2.2 Mô hình chi phí: chuẩn bị và trả lời

Bài giảng của Sebastian Wild [18] đặt bài toán theo hai giai đoạn:

1. **Tiền xử lý:** nhận toàn bộ mảng, phân tích và lưu thông tin hỗ trợ.
2. **Truy vấn:** sau đó mới nhận từng cặp $(l, r)$, chỉ dùng những gì đã lưu để trả lời.

Hai điều kiện: mảng không đổi, và **không biết trước** sẽ bị hỏi những đoạn nào. Mảng thì có đầy đủ từ đầu, chỉ các câu hỏi là đến sau.

Một lời giải được ký hiệu là $\langle P(n), Q(n) \rangle$:

- $P(n)$: thời gian tiền xử lý.
- $Q(n)$: thời gian trả lời một truy vấn.
- $S(n)$: bộ nhớ phụ (không tính mảng đầu vào).

Với $q$ truy vấn, tổng thời gian là

$$T(n, q) = P(n) + q \cdot Q(n)$$

Công thức này giải thích vì sao **không được chỉ nhìn tốc độ một truy vấn**: một cấu trúc xây rất lâu chưa chắc đáng dùng nếu chỉ hỏi vài lần. Mục 6.5 dùng đúng công thức này để tìm điểm hòa vốn giữa các cấu trúc.

### 2.3 Vì sao mẹo tổng tiền tố không dùng được cho min

Với **tổng** đoạn có một mẹo rất gọn: tính trước $S[i] = A[0] + \dots + A[i]$, rồi

$$\mathrm{sum}(l, r) = S[r] - S[l-1]$$

Ví dụ $A = [3, 5, 2, 7]$, $S = [3, 8, 10, 17]$: tổng $A[2..3] = S[3] - S[1] = 17 - 8 = 9 = 2 + 7$. Phép trừ "gỡ" được phần đứng trước $l$.

Thử làm tương tự với min, tức lưu prefix-min $P[i] = \min(A[0..i])$. Xét hai mảng:

| | Mảng | Prefix-min | $\min$ của đoạn $[1, 2]$ |
|---|---|---|---|
| $X$ | [1, 5, 4] | [1, 1, 1] | 4 |
| $Y$ | [1, 2, 4] | [1, 1, 1] | 2 |

Hai mảng có **cùng** prefix-min nhưng đáp án khác nhau. Số 1 ở đầu che mất mọi thứ phía sau. Nếu chỉ có prefix-min thì không thuật toán nào phân biệt được $X$ và $Y$, vì thông tin về các phần tử lớn hơn cực tiểu trước đó đã mất. Lý do gốc: phép cộng có phép ngược (phép trừ), còn min thì không có. Vì vậy RMQ cần những ý tưởng khác.

---

## 3. Cơ sở thuật toán

### 3.1 Hai thái cực: quét và bảng mọi đoạn

**Thái cực 1: không chuẩn bị gì, hỏi đến đâu quét đến đó.**
$\langle O(1), O(n) \rangle$, bộ nhớ phụ $O(1)$. Việc đọc mảng đầu vào vẫn tốn $O(n)$, nhưng không xây thêm cấu trúc nào.

**Thái cực 2: chuẩn bị mọi thứ.**
Lưu đáp án cho mọi đoạn trong bảng $M[l][r] = \mathrm{RMQ}(l, r)$, hỏi thì tra trong $O(1)$. Mảng $n$ phần tử có $\frac{n(n+1)}{2}$ đoạn: $n = 8$ là 36 ô, $n = 10^6$ là khoảng $5 \cdot 10^{11}$ ô.

Nếu mỗi ô lại quét đoạn của nó thì tốn $O(n^3)$. Dùng quy hoạch động sẽ nhanh hơn: biết cực tiểu của $A[l..r-1]$ rồi, khi thêm $A[r]$ thì cực tiểu mới chỉ có hai khả năng, hoặc vẫn là cực tiểu cũ, hoặc chính là phần tử mới. Do đó

$$M[l][l] = l, \qquad M[l][r] = \mathrm{better}(M[l][r-1],\ r)$$

Ví dụ cố định $l = 1$:

| Đoạn | Thêm | $M[1][r]$ | Diễn giải |
|---|---|---|---|
| [1, 1] | 4 | 1 | Chỉ có số 4 |
| [1, 2] | 9 | 1 | Giữ số 4 |
| [1, 3] | 4 | 1 | Bằng nhau, giữ vị trí bên trái |
| [1, 4] | 6 | 1 | Vẫn giữ vị trí 1 |
| [1, 5] | 2 | 5 | Cập nhật sang vị trí 5 |
| [1, 6] | 2 | 5 | Bằng nhau, giữ vị trí 5 |

Mỗi ô chỉ tốn một lần so sánh, nên xây $O(n^2)$, hỏi $O(1)$, bộ nhớ $O(n^2)$.

Một bên không lưu gì và hỏi chậm, một bên lưu tất cả và tốn bộ nhớ bình phương. Các phần tiếp theo tìm điểm cân bằng ở giữa: lưu ít thông tin hơn bảng mọi đoạn mà vẫn trả lời nhanh hơn quét.

### 3.2 Chia khối $\sqrt{n}$

Chia mảng thành các khối liên tiếp, mỗi khối $b$ phần tử, và lưu sẵn min của từng khối. Một đoạn hỏi bất kỳ được tách thành:

- phần **biên trái** và **biên phải** (lẻ khối): quét trực tiếp, tối đa $2b$ phần tử;
- các **khối trọn vẹn** ở giữa: chỉ đọc min đã lưu, tối đa $n/b$ khối.

Chi phí một truy vấn là $O(b + n/b)$, nhỏ nhất khi $b \approx n/b$, tức $b \approx \sqrt{n}$. Ta được $\langle O(n), O(\sqrt{n}) \rangle$, bộ nhớ phụ $O(\sqrt{n})$.

Ví dụ: mảng 16 phần tử, hỏi đoạn [2, 13]. Khối nhỏ thì phải đọc nhiều min khối, khối lớn thì phải quét nhiều phần tử biên. Tổng số ô phải đọc thấp nhất ở $b = 4 = \sqrt{16}$.

Ưu điểm lớn của chia khối là **sửa được**. Đổi một phần tử thì chỉ khối chứa nó phải tính lại min, mất $O(\sqrt{n})$. Cấu trúc rất đơn giản và gần như không tốn bộ nhớ.

### 3.3 Segment Tree

Segment Tree là cây nhị phân, mỗi nút đại diện một đoạn liên tiếp và lưu min (hoặc vị trí min) của đoạn đó. Gốc đại diện cả mảng, hai con chia đôi đoạn của cha, lá là từng phần tử.

```
                 [0,7]: 2
          /                  \
     [0,3]: 4              [4,7]: 2
     /      \              /      \
 [0,1]:4  [2,3]:4     [4,5]:2   [6,7]:2
  /  \     /  \        /  \      /  \
 7    4   9    4      6    2    2    8
```

**Xây:** từ lá lên gốc, mỗi nút lấy min của hai con, tổng $O(n)$. Có khoảng $2n$ nút.

**Truy vấn:** đi từ gốc xuống. Nếu đoạn của nút nằm trọn trong đoạn hỏi thì lấy luôn giá trị của nút. Nếu rời nhau thì bỏ qua. Còn lại thì xuống hai con. Đoạn hỏi được ghép từ các nút "trọn vẹn".

Ví dụ hỏi [1, 6]: được ghép từ 4 nút [1], [2, 3], [4, 5], [6] có min lần lượt 4, 4, 2, 2, nên đáp án là 2 ở vị trí 5.

**Vì sao mỗi tầng có tối đa 2 nút được chọn?** Các nút được chọn ở một tầng phải nằm sát hai đầu của đoạn hỏi. Nếu có hai nút được chọn kề nhau và cùng cha, thì đoạn của cha cũng nằm trọn trong đoạn hỏi, nên thuật toán đã chọn cha ở tầng trên chứ không đi xuống. Cây cao $\log_2 n$ tầng, nên một truy vấn dùng tối đa khoảng $2\log_2 n$ nút: $Q(n) = O(\log n)$.

**Cập nhật:** đổi $A[i]$ thì chỉ các nút trên đường từ lá $i$ lên gốc thay đổi, tức $\log_2 n + 1$ nút. Ví dụ đổi $A[5]$ chỉ chạm 4 nút: [5], [4, 5], [4, 7], [0, 7].

Tổng kết: xây $O(n)$, hỏi $O(\log n)$, sửa $O(\log n)$, bộ nhớ $O(n)$. Đây là công cụ chuẩn cho RMQ động. Cái giá là mỗi truy vấn tốn $\log n$ chứ không phải hằng số.

### 3.4 Sparse Table

#### Ý tưởng: chỉ lưu các đoạn có độ dài lũy thừa của 2

Bảng mọi đoạn quá lớn. Ý tưởng là chỉ lưu đáp án cho các đoạn có độ dài 1, 2, 4, 8, …:

$$st[k][i] = \mathrm{RMQ}(i,\ i + 2^k - 1)$$

- $k$: số mũ của độ dài (đoạn dài $2^k$).
- $i$: vị trí **bắt đầu** của đoạn. Đây là chỗ người mới hay nhầm.
- Giá trị trong ô: **chỉ số** của phần tử nhỏ nhất.

Vì ô lưu vị trí nên hàng đầu là $st[0][i] = i$, không phải $A[i]$. Ví dụ $st[2][3] = 5$ nghĩa là "đoạn bắt đầu tại 3, dài 4, tức [3, 6], nhỏ nhất ở vị trí 5".

Bảng đầy đủ cho mảng giá vé (dấu "—" là đoạn vượt quá cuối mảng):

| $k$ / độ dài | $i$=0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| 0 / 1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| 1 / 2 | 1 | 1 | 3 | 3 | 5 | 5 | 6 | — |
| 2 / 4 | 1 | 1 | 5 | 5 | 5 | — | — | — |
| 3 / 8 | 5 | — | — | — | — | — | — | — |

Chỉ có $8 + 7 + 5 + 1 = 21$ ô thay vì 36. Tổng quát có $\lfloor \log_2 n \rfloor + 1$ tầng, mỗi tầng tối đa $n$ ô, tức $O(n \log n)$ ô thay vì $O(n^2)$.

#### Xây bảng: ghép hai nửa

Một đoạn dài $2^k$ tách đúng thành hai nửa dài $2^{k-1}$ không giao nhau. Nửa phải bắt đầu tại $i + 2^{k-1}$:

$$st[k][i] = \mathrm{better}\big(st[k-1][i],\ st[k-1][i + 2^{k-1}]\big)$$

Xây theo $k$ tăng dần thì hai ô nhỏ hơn luôn có sẵn. Ví dụ:

- $st[2][1] = \mathrm{RMQ}(1, 4)$: hai nửa [1, 2] (min ở 1, giá trị 4) và [3, 4] (min ở 3, giá trị 4). Bằng nhau nên chọn trái: $st[2][1] = 1$.
- $st[2][3] = \mathrm{RMQ}(3, 6)$: hai nửa [3, 4] (vị trí 3, giá trị 4) và [5, 6] (vị trí 5, giá trị 2), nên $st[2][3] = 5$.

#### Truy vấn: hai khối chồng lấn

Đoạn dài 6 không được lưu, vậy hỏi $\mathrm{RMQ}(1, 6)$ thế nào? Đặt

$$L = r - l + 1, \qquad k = \lfloor \log_2 L \rfloor$$

tức $2^k$ là lũy thừa của 2 lớn nhất không vượt quá $L$. Lấy hai khối cùng dài $2^k$: một khối **bắt đầu tại $l$**, một khối **kết thúc tại $r$**:

$$\mathrm{RMQ}(l, r) = \mathrm{better}\big(st[k][l],\ st[k][r - 2^k + 1]\big)$$

Ví dụ $\mathrm{RMQ}(1, 6)$: $L = 6$, $k = 2$. Hai khối là [1, 4] và [3, 6], $st[2][1] = 1$ (giá trị 4) và $st[2][3] = 5$ (giá trị 2), nên đáp án là 5.

Một ví dụ khác, $\mathrm{RMQ}(2, 6)$: $L = 5$, $k = 2$, hai khối [2, 5] và [3, 6] đều cho vị trí 5.

#### Vì sao hai khối luôn đủ

Từ cách chọn $k$ ta có $2^k \le L < 2^{k+1}$. Từ đó suy ra ba điều:

1. **Không lấy nhầm phần tử ngoài đoạn.** Mỗi khối dài $2^k \le L$, khối trái bắt đầu tại $l$ và khối phải kết thúc tại $r$, nên cả hai nằm trọn trong $[l, r]$.
2. **Không bỏ sót phần tử nào.** Hai khối cộng lại dài $2 \cdot 2^k > L$, nên chúng gặp nhau hoặc chồng lên nhau ở giữa, phủ kín đoạn.
3. **Phần chồng lấn không làm sai kết quả.** Phần tử ở giữa có thể được xét hai lần, nhưng $\min(x, x) = x$. Tính chất này gọi là **lũy đẳng**.

Vì cực tiểu của cả đoạn nằm trong ít nhất một khối, chỉ cần so sánh cực tiểu của hai khối là xong.

**Mẹo này không dùng được cho phép cộng.** Với $B = [1, 2, 3, 4, 5, 6]$, tổng của khối [0, 3] là 10 và của [2, 5] là 18. Cộng lại được 28, trong khi tổng thật là 21, vì hai số 3 và 4 bị đếm hai lần. Các phép lũy đẳng khác dùng được nguyên công thức: max, gcd, AND, OR. Phép không lũy đẳng thì dùng **Disjoint Sparse Table** (mục 7.7).

Cần phân biệt hai cách ghép:

| Lúc nào | Ghép những đoạn nào |
|---|---|
| Xây bảng | Hai nửa bằng nhau, **không** giao nhau, nửa phải bắt đầu tại $i + 2^{k-1}$ |
| Trả lời truy vấn | Hai khối bám hai đầu, **có thể** chồng lấn, khối phải kết thúc đúng tại $r$ |

#### Cài đặt C++

Code dưới đây đã được biên dịch và kiểm thử bằng cách so với duyệt trâu trên mọi đoạn (`tools/check_code.py`).

```cpp
struct SparseTable {
    vector<long long> a; vector<int> lg; vector<vector<int>> st;
    int better(int p, int q) const {              // giá trị nhỏ hơn; bằng nhau lấy bên trái
        if (a[p] != a[q]) return a[p] < a[q] ? p : q;
        return min(p, q);
    }
    explicit SparseTable(const vector<long long>& v) : a(v) {
        int n = a.size();
        lg.assign(n + 1, 0);
        for (int x = 2; x <= n; ++x) lg[x] = lg[x / 2] + 1;
        st.assign(lg[n] + 1, vector<int>(n));
        iota(st[0].begin(), st[0].end(), 0);      // st[0][i] = i
        for (int k = 1; k <= lg[n]; ++k)
            for (int i = 0; i + (1 << k) <= n; ++i)
                st[k][i] = better(st[k-1][i], st[k-1][i + (1 << (k-1))]);
    }
    int rmq(int l, int r) const {                 // O(1), trả về vị trí
        int k = lg[r - l + 1];
        return better(st[k][l], st[k][r - (1 << k) + 1]);
    }
};
```

Với mảng `7 4 9 4 6 2 2 8`: `rmq(1,6)` trả 5, `rmq(1,4)` trả 1, `rmq(2,2)` trả 2, `rmq(6,7)` trả 6.

Bảng `lg[x]` lưu sẵn $\lfloor \log_2 x \rfloor$, theo công thức `lg[x] = lg[x/2] + 1`: mỗi lần chia đôi thì phần nguyên của $\log_2$ giảm đúng 1.

| $x$ | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| `lg[x]` | 0 | 1 | 1 | 2 | 2 | 2 | 2 | 3 |

**Lỗi hay gặp**

- Viết `min(p, q)` thay cho `better(p, q)`: vì `st` lưu chỉ số, `min` sẽ chọn chỉ số nhỏ hơn kể cả khi giá trị ở đó lớn hơn.
- Viết `2^k` trong C++: đó là phép XOR, phải viết `1 << k`.
- Dùng `log2()` số thực: có thể sai do làm tròn. Dùng bảng `lg[]` hoặc `__builtin_clz`.
- Nhầm chỉ số thứ hai là vị trí kết thúc: $st[k][i]$ là đoạn **bắt đầu** tại $i$.

**Chi phí:** $P(n) = O(n \log n)$, $Q(n) = O(1)$ (tra hai ô và một lần so sánh), $S(n) = O(n \log n)$. Với $q$ truy vấn, tổng là $O(n \log n + q)$.

| Cách | Tiền xử lý | Một truy vấn | Bộ nhớ phụ |
|---|---|---|---|
| Quét từng đoạn | $O(1)$ | $O(n)$ tệ nhất | $O(1)$ |
| Bảng mọi đoạn (DP) | $O(n^2)$ | $O(1)$ | $O(n^2)$ |
| Chia khối $\sqrt n$ | $O(n)$ | $O(\sqrt n)$ | $O(\sqrt n)$ |
| Segment Tree | $O(n)$ | $O(\log n)$ | $O(n)$ |
| Sparse Table | $O(n \log n)$ | $O(1)$ | $O(n \log n)$ |

---

## 4. Áp dụng vào bài toán thật

### 4.1 Trở lại bài toán của Pi

Bảng giá đã chốt, nên xây Sparse Table một lần. Sau đó ai hỏi khoảng nào cũng chỉ cần tra hai ô. Với khoảng (1, 6), tức 4/11 đến 9/11: $k = 2$, $st[2][1] = 1$, $st[2][3] = 5$, kết quả là vị trí 5, tức **ngày 8/11, giá 200 nghìn**. Ngày 9/11 cùng giá, nhưng quy tắc chọn trái cho ngày sớm hơn.

### 4.2 Khi giá vé thay đổi

Nếu $A[5]$ đổi từ 2 thành 10, đoạn [3, 6] thành [4, 6, 10, 2] và $\mathrm{RMQ}(3, 6)$ đổi từ 5 sang 6. Những gì đã tính trước có thể hết đúng.

Sparse Table không bắt buộc phải xây lại toàn bộ trong $O(n \log n)$. Chỉ cần tính lại các ô có đoạn chứa vị trí bị sửa, nhưng với vị trí ở giữa mảng thì số ô này là $\Theta(n)$. Segment Tree chỉ sửa $\log_2 n + 1$ nút. Có cập nhật thì Segment Tree là công cụ đúng.

### 4.3 Hai bài CSES chỉ khác nhau một chữ "cập nhật"

Cả hai bài có $n, q \le 2 \cdot 10^5$. Ngưỡng thực tế là khoảng $10^8$ phép toán đơn giản mỗi giây.

**CSES 1647, Static Range Minimum Queries (mảng tĩnh):**

| Cách | Số phép toán ước lượng | Kết luận |
|---|---|---|
| Duyệt | $n \cdot q = 4 \cdot 10^{10}$ | Quá chậm |
| Segment Tree | $n + 2q \log_2 n \approx 7 \cdot 10^6$ | Đạt |
| Sparse Table | $n \log_2 n + 2q \approx 4 \cdot 10^6$ | Đạt, code ngắn |

**CSES 1649, Dynamic Range Minimum Queries (thêm thao tác gán $A[k] := u$ xen kẽ truy vấn):**

| Cách | Mỗi thao tác sửa | Kết luận |
|---|---|---|
| Sparse Table | $O(n)$, tệ nhất khoảng $4 \cdot 10^{10}$ tổng cộng | Quá chậm |
| Segment Tree | $O(\log n)$ | Đúng công cụ |

Bài học: tính số phép toán từ giới hạn đề bài để loại sớm cách quá chậm. Chỉ cần thêm thao tác cập nhật là lựa chọn đảo ngược.

### 4.4 Bốn câu hỏi để chọn cấu trúc

Trả lời lần lượt, dừng ở câu đầu tiên trả lời "có":

| # | Câu hỏi | Nếu có thì dùng | Vì sao |
|---|---|---|---|
| 1 | Mảng có thay đổi xen kẽ truy vấn? | **Segment Tree** | Xây $O(n)$, hỏi và sửa $O(\log n)$; sửa chỉ chạm đường lên gốc |
| 2 | Cửa sổ cùng độ dài, trượt tuần tự? | **Deque đơn điệu** | $O(n)$ cho mọi cửa sổ, một lượt quét trả lời hết (mục 7.8) |
| 3 | Rất ít truy vấn, hoặc đoạn rất ngắn? | **Duyệt trực tiếp** | Không xây gì; đoạn ngắn thì quét là nhanh nhất (mục 6.4) |
| 4 | $n$ rất lớn, hoặc RAM eo hẹp? | **Fischer–Heun** | Xây $O(n)$, hỏi $O(1)$, bảng nhỏ hơn nhiều lần (mục 5) |
| — | Còn lại | **Sparse Table** | Xây $O(n \log n)$, hỏi $O(1)$, nhanh nhất, code khoảng 20 dòng |

Các ví dụ tình huống:

- Vé máy bay giá đã chốt: Sparse Table.
- Giá đổi liên tục: Segment Tree.
- Chuyến đi đúng 3 ngày (cửa sổ cố định): Deque.
- Chỉ tra vài lần: Duyệt.
- $10^9$ phần tử, ít RAM: Fischer–Heun.

### 4.5 Bảng so sánh các cấu trúc dữ liệu

| Cấu trúc | Xây | Truy vấn | Sửa | Bộ nhớ | Hợp khi |
|---|---|---|---|---|---|
| Duyệt | — | $O(n)$ | $O(1)$ | $O(1)$ | Ít truy vấn, đoạn ngắn |
| Bảng mọi đoạn | $O(n^2)$ | $O(1)$ | — | $O(n^2)$ | $n$ rất nhỏ |
| Chia khối $\sqrt n$ | $O(n)$ | $O(\sqrt n)$ | $O(\sqrt n)$ | $O(\sqrt n)$ | Đơn giản, ít bộ nhớ |
| Segment Tree | $O(n)$ | $O(\log n)$ | $O(\log n)$ | $O(n)$ | Có cập nhật |
| Fenwick hai cây | $O(n)$ | $O(\log n)$ | $O(\log n)$* | $O(n)$ | Có cập nhật |
| Sparse Table | $O(n \log n)$ | $O(1)$ | $O(n)$ | $O(n \log n)$ | Tĩnh, nhiều query |
| Disjoint Sparse Table | $O(n \log n)$ | $O(1)$ | — | $O(n \log n)$ | Phép không lũy đẳng |
| **Fischer–Heun** | $O(n)$ | $O(1)$ | — | $O(n)$ | Tĩnh, $n$ lớn |
| Succinct RMQ | $O(n)$ | $O(1)$ | — | $2n + o(n)$ bit | Bộ nhớ cực ít |
| Deque đơn điệu | $O(n)$ cho mọi cửa sổ | — | — | $O(k)$ | Cửa sổ trượt |

\* Khấu hao (*amortized*), theo Dima & Ceterchi (2015) [11]: tính trung bình trên cả chuỗi thao tác. Một lần cập nhật riêng lẻ có thể tốn hơn $O(\log n)$, nhưng $m$ lần cộng lại không quá $O(m \log n)$. Nguyên nhân là min không có phép trừ: giảm một giá trị thì chỉ cần lấy min dọc đường lên, còn tăng một giá trị đang là min của một nút thì phải tính lại nút đó. Segment Tree thì bảo đảm $O(\log n)$ cho **mọi** lần cập nhật (tệ nhất).

Một số ghi chú:

- Succinct RMQ (Fischer & Heun 2011 [7]) chỉ trả về vị trí và không cần giữ giá trị của mảng.
- Bộ nhớ của Fischer–Heun tính theo **word**, tức $O(n)$ số nguyên. Đó là $O(n \log n)$ bit, khác với $2n + o(n)$ bit của succinct.

Dòng Fischer–Heun là câu hỏi dẫn sang phần tiếp theo: **làm sao xây $O(n)$ mà vẫn hỏi $O(1)$?**

---

## 5. Tối ưu: xây O(n), hỏi O(1) với Fischer–Heun

### 5.1 Có thể bỏ $\log n$ không? Chia khối và cử đại diện

Sparse Table to vì mỗi vị trí xuất hiện ở khoảng $\log n$ tầng. Ý tưởng là **giảm số phần tử trước khi xây Sparse Table**:

1. Chia mảng thành các khối dài $b$.
2. Mỗi khối cử một đại diện: lưu $V[t]$ là giá trị nhỏ nhất của khối $t$, và $G[t]$ là chỉ số gốc đạt giá trị đó.
3. Xây Sparse Table trên mảng đại diện $V$, có $n/b$ phần tử.

Sparse Table trên $V$ tốn $O\!\left(\frac{n}{b} \log \frac{n}{b}\right)$. Nếu chọn $b = \Theta(\log n)$ thì chi phí này là $O(n)$: số phần tử giảm khoảng $\log n$ lần, vừa đủ bù cho khoảng $\log n$ tầng. Ví dụ $n = 65.536$, $b = 16 = \log_2 n$ (cho dễ tính) thì còn $65.536/16 = 4.096$ đại diện. Số ô của Sparse Table trên đại diện còn ít hơn cả độ dài mảng gốc.

Ở đây, $b = \Theta(\log n)$ nghĩa là $b$ tăng cùng bậc với $\log n$, chỉ khác hệ số hằng. Kỹ thuật dùng lại một thuật toán đã biết trên đầu vào nhỏ hơn gọi là *bootstrapping*. Giá trị cụ thể $b = \frac14 \log_2 n$ được giải thích ở mục 5.10.

### 5.2 Ghép ba phần

Ví dụ 16 phần tử, chọn $b = 4$ để minh họa:

| Khối $t$ | Chỉ số gốc | Phần tử | Min $V[t]$ | Vị trí $G[t]$ |
|---|---|---|---|---|
| 0 | [0, 3] | [2, 7, 5, 8] | 2 | 0 |
| 1 | [4, 7] | [9, 4, 1, 6] | 1 | 6 |
| 2 | [8, 11] | [8, 5, 3, 7] | 3 | 10 |
| 3 | [12, 15] | [10, 2, 0, 4] | 0 | 14 |

Tức $V = [2, 1, 3, 0]$ và $G = [0, 6, 10, 14]$. Sparse Table trên $V$ trả về **chỉ số khối**, rồi đổi sang chỉ số gốc bằng $G$. Không được lấy min trực tiếp trên $G$: chỉ số nhỏ hơn không có nghĩa là giá trị nhỏ hơn.

Hỏi $\mathrm{RMQ}(7, 12)$, tức đoạn [6, 8, 5, 3, 7, 10]. Đoạn này tách thành tối đa ba phần:

| Phần | Đoạn gốc | Nội dung | Cách giải |
|---|---|---|---|
| Đuôi khối trái (khối 1) | [7, 7] | [6] | RMQ **bên trong** khối |
| Các khối trọn vẹn (khối 2) | [8, 11] | [8, 5, 3, 7] | Sparse Table trên $V$ |
| Đầu khối phải (khối 3) | [12, 12] | [10] | RMQ **bên trong** khối |

Ba ứng viên là $A[7] = 6$, $A[10] = 3$ và $A[12] = 10$, nên $\mathrm{RMQ}(7, 12) = 10$.

**Lỗi hay gặp:** lấy min của cả khối biên. Khối 1 có min 1 ở vị trí 6, khối 3 có min 0 ở vị trí 14, cả hai đều **nằm ngoài** đoạn hỏi. Lấy min cả khối sẽ trả lời sai.

Hai trường hợp đặc biệt:

- Hai đầu cùng khối: chỉ tra một đoạn nội khối.
- Hai đầu ở hai khối kề nhau: không có phần giữa.

Phần giữa đã giải xong. Việc còn lại là **RMQ bên trong một khối**.

### 5.3 Bên trong khối thì sao?

| Cách xử lý trong khối | Chi phí | Vấn đề |
|---|---|---|
| Quét mỗi lần hỏi | $O(b) = O(\log n)$ mỗi truy vấn | Chưa đạt hỏi $O(1)$ |
| Bảng mọi đoạn cho từng khối | $\frac{n}{b} \cdot O(b^2) = O(n \log n)$ | Quay lại $O(n \log n)$ |
| Sparse Table cho từng khối | $\frac{n}{b} \cdot O(b \log b) = O(n \log\log n)$ | Rất gần, nhưng chưa tới |

Ví dụ $n = 65.536$, $b = 4$: có 16.384 khối. Mỗi Sparse Table nhỏ có 3 tầng thay vì 17, tổng $16.384 \times 4 \times 3 = 196.608$ ô.

**Điểm mấu chốt:** tổng chi phí đang tỉ lệ với **số khối**. Muốn giảm tiếp, phải làm chi phí phụ thuộc vào **số loại khối**. Liệu 16.384 khối kia có thật sự khác nhau không? Câu trả lời đến từ cây Cartesian.

### 5.4 Cây Cartesian

Cây Cartesian của một mảng (Vuillemin 1980 [1]) được dựng đệ quy như sau:

1. Tìm vị trí nhỏ nhất của đoạn (chọn trái nếu bằng nhau), lấy nó làm gốc.
2. Các phần tử bên trái vị trí đó dựng thành cây con trái.
3. Các phần tử bên phải dựng thành cây con phải.

Ví dụ khối [9, 4, 1, 6]: min là 1 (vị trí tương đối 2), nên 1 làm gốc. Bên trái [9, 4] có gốc 4, và 9 là con trái của 4. Bên phải [6] là con phải của gốc.

```
        1
       / \
      4   6
     /
    9
```

Cây có hai tính chất:

- **Duyệt giữa** (trái, gốc, phải) cho lại đúng thứ tự chỉ số của mảng.
- **Tính chất heap:** cha không lớn hơn con. Gốc của mỗi cây con là phần tử nhỏ nhất của đoạn mà cây con đó đại diện.

Dựng theo định nghĩa đệ quy có thể tốn $O(b^2)$ với mảng tăng dần. Dựng bằng **ngăn xếp đơn điệu** thì chỉ $O(b)$: quét trái sang phải, với mỗi phần tử mới thì pop mọi phần tử lớn hơn nó khỏi ngăn xếp, rồi push nó vào (mục 5.8).

### 5.5 RMQ = LCA

**LCA** (Lowest Common Ancestor) của hai nút là tổ tiên chung sâu nhất của chúng.

**Định lý.** Trong cây Cartesian của $A$, $\mathrm{RMQ}(l, r) = \mathrm{LCA}(l, r)$.

**Chứng minh.** Gọi $m = \mathrm{LCA}(l, r)$.

*Bước 1: $l \le m \le r$.* Giả sử $m < l$. Khi đó $l$ và $r$ đều nằm bên phải $m$ theo thứ tự chỉ số, nên theo tính chất duyệt giữa, cả hai nằm trong cây con phải của $m$. Vậy con phải của $m$ là một tổ tiên chung sâu hơn $m$, mâu thuẫn. Trường hợp $m > r$ chứng minh tương tự. Vậy LCA không thể nằm ngoài đoạn.

*Bước 2: $A[m]$ nhỏ nhất trong $[l, r]$.* Mỗi cây con ứng với một đoạn chỉ số liên tiếp. Cây con gốc $m$ chứa cả $l$ và $r$, nên chứa toàn bộ $[l, r]$. Theo tính chất heap, gốc $m$ là cực tiểu của đoạn mà nó đại diện, nên $A[m] \le A[k]$ với mọi $k \in [l, r]$. Kết hợp với bước 1, $m$ chính là vị trí nhỏ nhất của đoạn.

Khi có giá trị trùng nhau, chỉ cần giữ quy tắc chọn trái lúc dựng cây là kết quả vẫn khớp.

**Hệ quả quan trọng:** đáp án RMQ chỉ phụ thuộc vào **hình dạng** cây, không phụ thuộc giá trị cụ thể.

### 5.6 Khác giá trị, cùng đáp án

**Định lý.** Hai mảng cùng độ dài có đáp án RMQ giống nhau trên **mọi** đoạn khi và chỉ khi chúng có cùng hình dạng cây Cartesian.

Ví dụ nhỏ: [2, 1, 3] và [3, 1, 2] cùng có gốc ở giữa, một con trái và một con phải, nên cùng mọi đáp án.

Ba khối [9, 4, 1, 6], [8, 5, 3, 7] và [10, 2, 0, 4] có giá trị hoàn toàn khác nhau nhưng cùng hình dạng cây, nên mọi truy vấn nội khối có cùng đáp án **tương đối**:

| Đoạn tương đối | Trên [9,4,1,6] | Trên [8,5,3,7] | Trên [10,2,0,4] | Vị trí trả về |
|---|---|---|---|---|
| [0, 1] | [9, 4] | [8, 5] | [10, 2] | 1 |
| [0, 3] | cả khối | cả khối | cả khối | 2 |
| [2, 3] | [1, 6] | [3, 7] | [0, 4] | 2 |

Ta có thể dùng **một bảng đáp án chung** cho cả ba khối.

### 5.7 Đếm số loại khối: số Catalan

Số hình dạng cây nhị phân có $b$ nút là **số Catalan**:

$$C_b = \frac{1}{b+1}\binom{2b}{b}$$

Các giá trị đầu tiên là $C_1 = 1$, $C_2 = 2$, $C_3 = 5$, $C_4 = 14$. Giá trị có vô số khả năng, nhưng **về mặt RMQ, khối dài 4 chỉ có 14 kiểu**.

Để dùng hình dạng làm chỉ số bảng, ta mã hóa cây: duyệt preorder, mỗi nút ghi 2 bit (có con trái?, có con phải?).

- Cây của [9, 4, 1, 6]: gốc 1 có hai con (`11`); nút 4 chỉ có con trái (`10`); nút 9 là lá (`00`); nút 6 là lá (`00`). Mã là `11 10 00 00`.
- Cây của [2, 7, 5, 8]: gốc 2 chỉ có con phải (`01`); nút 5 có hai con (`11`); nút 7 và 8 là lá. Mã là `01 11 00 00`, khác loại.

Mỗi cây có mã dài $2b$ bit, nên có tối đa $2^{2b} = 4^b$ mã. Không phải mã nào cũng là cây hợp lệ, nên $4^b$ chỉ là **chặn trên**. Chặn này đủ dùng: $C_b \approx \frac{4^b}{b^{3/2}\sqrt{\pi}}$ cũng tăng theo $4^b$.

### 5.8 Nhận diện loại khối bằng ngăn xếp

Cần tính mã loại của mỗi khối trong $O(b)$. Cách gọn nhất là chạy thuật toán dựng cây Cartesian bằng ngăn xếp và ghi lại chuỗi thao tác. Quét từ trái sang phải; với mỗi phần tử mới, mỗi lần **pop** một phần tử lớn hơn nó thì ghi `0`, cuối cùng **push** nó vào thì ghi `1`.

| Khối | Diễn biến | Chuỗi thao tác |
|---|---|---|
| [9, 4, 1, 6] | 9: push · 4: pop 9, push · 1: pop 4, push · 6: push | `1 01 01 1` |
| [8, 5, 3, 7] | giống hệt | `1 01 01 1` |
| [10, 2, 0, 4] | giống hệt | `1 01 01 1` |
| [2, 7, 5, 8] | 2: push · 7: push · 5: pop 7, push · 8: push | `1 1 01 1` |

Hai khối khác loại tách nhau ngay ở phần tử thứ hai: một khối pop rồi push, khối kia chỉ push.

Chuỗi push/pop mô tả đúng quá trình dựng cây, nên hai khối cùng chuỗi thì cùng hình dạng. Mỗi phần tử được push một lần và pop tối đa một lần, nên chuỗi dài tối đa $2b$ bit và tính trong $O(b)$.

Có hai việc khác nhau cần phân biệt:

- **Mã hóa hình dạng:** dãy bit preorder ở mục 5.7.
- **Tính ra mã:** bằng ngăn xếp như trên.

Bản gốc của Fischer–Heun dùng *ballot numbers* để đánh số các loại liên tiếp từ 0 đến $C_b - 1$. Bản benchmark của nhóm dùng thẳng chuỗi push/pop làm mã.

### 5.9 Bảng đáp án dùng chung

Ta lưu $T[\text{type}][u][v]$ là vị trí **tương đối** của min trên đoạn $[u, v]$ của mọi khối thuộc loại `type`. Mỗi khối chỉ cần lưu mã loại của mình. Với loại `11 10 00 00`:

| $[u, v]$ | [0,1] | [0,2] | [0,3] | [1,2] | [1,3] | [2,3] |
|---|---|---|---|---|---|---|
| $T[\text{type}][u][v]$ | 1 | 2 | 2 | 2 | 2 | 2 |

và $T[\text{type}][u][u] = u$.

Đổi về chỉ số gốc: khối $t$ bắt đầu tại $s = t \cdot b$, nên vị trí gốc là $s + p$. Ví dụ hỏi đoạn gốc [4, 5] nằm trong khối 1, $s = 4$, đoạn tương đối [0, 1]. Bảng trả $p = 1$, nên vị trí gốc là $4 + 1 = 5$. Đúng, vì $A[4..5] = [9, 4]$.

```
inBlock(t, u, v):
    p = T[type[t]][u][v]
    return t * b + p
```

**Tiết kiệm được bao nhiêu?** Một bảng cho khối dài 4 có $4 + 3 + 2 + 1 = 10$ ô.

- 16.384 khối, mỗi khối một bảng: 163.840 ô.
- Dùng chung theo loại: tối đa 14 loại, tức 140 ô (chặn trên đơn giản là $4^4 = 256$ loại, 2.560 ô).

### 5.10 Vì sao chọn $b = \frac14 \log_2 n$

Phải cân bằng hai yêu cầu:

- Khối đủ **lớn** để mảng đại diện nhỏ.
- Khối đủ **nhỏ** để số loại $4^b$ không bùng nổ.

Chọn $b = \frac14 \log_2 n$:

$$4^b = 4^{\frac14 \log_2 n} = 2^{\frac12 \log_2 n} = \sqrt{n}$$

Số khối thì nhiều, nhưng số loại chỉ tối đa $\sqrt{n}$. Ví dụ $n = 65.536 = 2^{16}$: $b = 4$, có 16.384 khối nhưng tối đa 256 mã và thực tế chỉ 14 loại. Khi cài đặt dùng $b = \max\!\big(1, \lfloor \frac14 \log_2 n \rfloor\big)$.

**Chứng minh tiền xử lý $O(n)$.** Có ba khoản:

1. Tính min và mã loại của mọi khối: $\frac{n}{b} \cdot O(b) = O(n)$ (dùng ngăn xếp, không dựng đệ quy).
2. Sparse Table trên đại diện: $O\!\left(\frac{n}{b} \log \frac{n}{b}\right) = O(n)$, vì $b = \Theta(\log n)$.
3. Bảng tra chung: tối đa $4^b$ loại, mỗi loại $O(b^2)$ đoạn, mỗi đoạn tính trong $O(b)$, tổng $O(4^b b^3) = O(\sqrt{n} \log^3 n) = o(n)$.

Bước 3 dùng tính chất: một lũy thừa cố định của $\log n$ luôn tăng chậm hơn $\sqrt{n}$. Cộng lại:

$$P(n) = O\!\left(n + \frac{n}{b}\log\frac{n}{b} + 4^b b^3\right) = O(n)$$

Xây bảng mỗi loại bằng DP thì giảm $b^3$ xuống $b^2$, nhưng chặn đơn giản đã đủ. Hệ số $\frac14$ nằm trong **số mũ** của $4^b$, nên đổi hệ số là đổi cả bậc tăng trưởng:

- Mọi $0 < c < \frac12$ đều cho bảng tra $o(n)$.
- $c = \frac12$ cho $4^b = n$ loại, bảng tra không còn tuyến tính.

**Truy vấn và bộ nhớ.** Một truy vấn khác khối cần hai lần tra bảng nội khối, tối đa một truy vấn Sparse Table trên đại diện, và ghép tối đa ba ứng viên, nên $Q(n) = O(1)$. Bộ nhớ là

$$S(n) = O\!\left(n + \frac{n}{b}\log\frac{n}{b} + 4^b b^2\right) = O(n) \text{ word}$$

Trong mô hình word-RAM, mã loại dài $2b = O(\log n)$ bit vừa một word, nên dùng trực tiếp làm chỉ số bảng trong $O(1)$.

### 5.11 Toàn bộ một truy vấn

Cấu trúc gồm bốn thành phần:

- các khối;
- mảng đại diện $V$ và $G$ cùng Sparse Table trên $V$ (`macro`);
- mã loại `type[t]` của từng khối;
- bảng tra chung $T$.

```
rmq(l, r):
    a = l / b;  c = r / b                       // khối chứa hai đầu (chia nguyên)
    nếu a == c: return inBlock(a, l % b, r % b) // cùng khối: tra một lần
    left  = inBlock(a, l % b, b - 1)            // đuôi khối trái
    right = inBlock(c, 0, r % b)                // đầu khối phải
    ans = better(left, right)
    nếu a + 1 <= c - 1:                         // có khối trọn vẹn ở giữa
        t = macro.rmq(a + 1, c - 1)             // Sparse Table trên V
        ans = better(ans, G[t])
    return ans
```

Chạy lại $\mathrm{RMQ}(7, 12)$ với $b = 4$:

| Bước | Tính | Kết quả |
|---|---|---|
| Khối hai đầu | $a = 7/4 = 1$, $c = 12/4 = 3$ | |
| Đuôi khối 1 | $T[\text{type}_1][3][3] = 3$ | vị trí 7, giá trị 6 |
| Đầu khối 3 | $T[\text{type}_3][0][0] = 0$ | vị trí 12, giá trị 10 |
| Khối giữa | `macro.rmq(2, 2)` = 2, $G[2] = 10$ | vị trí 10, giá trị 3 |
| Ghép | so 6, 10, 3 | $\mathrm{RMQ}(7, 12) = 10$ |

Không có vòng lặp nào theo độ dài đoạn, nên truy vấn là $O(1)$.

Khi cài đặt cần chú ý:

- Khối cuối có thể thiếu phần tử: đệm bằng giá trị lớn hơn mọi giá trị thật.
- Quy tắc chọn trái phải nhất quán ở cả ba chỗ: lúc dựng cây, trong bảng nội khối và ở bước ghép.

### 5.12 Con đường thứ hai: Euler tour và ±1 RMQ

Bender & Farach-Colton (2000) [5] trình bày lại một con đường khác, dựa trên Berkman & Vishkin (1993) [4]:

1. Dựng cây Cartesian của $A$: RMQ trên mảng trở thành LCA trên cây.
2. Duyệt Euler trên cây, ghi lại các nút đi qua và độ sâu của chúng. LCA trở thành RMQ trên mảng độ sâu (cách làm chi tiết ở mục 7.4).
3. Mảng độ sâu Euler có tính chất **±1**: hai phần tử kề nhau luôn chênh đúng 1, vì đi qua một cạnh thì độ sâu tăng hoặc giảm đúng 1.

Với mảng ±1, trừ phần tử đầu khỏi mỗi khối là được một mẫu chuẩn. Ví dụ [7, 8, 7, 6] − 7 = [0, 1, 0, −1] và [12, 13, 12, 11] − 12 = [0, 1, 0, −1], cùng loại. Một khối dài $b$ được xác định bởi $b-1$ bit tăng/giảm, nên chỉ có $2^{b-1}$ loại. Bài báo chọn $b \approx \frac12 \log_2 N$.

Mẹo này **không** áp dụng trực tiếp cho mảng thường: [1, 4, 2] và [2, 4, 1] cùng mẫu "tăng rồi giảm" nhưng đáp án khác nhau.

Đây không phải lập luận vòng. ±1 RMQ được giải trực tiếp trước, rồi dùng nó để giải LCA, rồi dùng LCA để giải RMQ tổng quát.

So sánh hai con đường: cùng $\langle O(n), O(1) \rangle$, nhưng hằng số khác nhau. Theo Bảng 1 của Fischer & Heun (2006) [6], bộ nhớ là $9n + O(\sqrt{n} \log^2 n)$ word ở con đường Euler so với $4n + O(\sqrt{n} \log n)$ word ở con đường trực tiếp. Fischer–Heun xử lý RMQ trực tiếp bằng cây Cartesian của từng khối, không cần Euler tour, nên ít bộ nhớ hơn.

### 5.13 Lịch sử các mốc chính

| Năm | Tác giả | Đóng góp |
|---|---|---|
| 1980 | Vuillemin [1] | Cây Cartesian |
| 1984 | Gabow, Bentley, Tarjan [2] · Harel, Tarjan [3] | Xây $O(n)$, hỏi $O(1)$ lần đầu tiên (quy RMQ về LCA) |
| 1993 | Berkman, Vishkin [4] | Euler tour và ±1 RMQ |
| 2000 | Bender, Farach-Colton [5] | Bản trình bày đơn giản |
| 2006 | Fischer, Heun [6] | RMQ trực tiếp, kèm thực nghiệm |
| 2011 | Fischer, Heun [7] | Chỉ $2n + o(n)$ bit, không cần giữ mảng gốc |
| 2017 | Baumstark et al. [9] | Nhanh hơn tới 3 lần trong thực nghiệm |

Câu hỏi hay gặp là ai đạt kết quả tối ưu đầu tiên. Câu trả lời là Gabow, Bentley, Tarjan năm 1984, không phải Bender, Farach-Colton năm 2000. Phần còn lại của lịch sử là làm kết quả đó **đơn giản** và **nhanh thật sự**.

---

## 6. Benchmark

### 6.1 Đo như thế nào

Nhóm cài đặt và so sánh năm cấu trúc trong C++ (mã nguồn và CSV ở `seminar/v2/benchmark`):

| Cấu trúc | Cài đặt |
|---|---|
| Duyệt | Quét trực tiếp |
| Chia khối $\sqrt{n}$ | Min từng khối, quét biên |
| Segment Tree | Bản lặp từ dưới lên, $2n$ ô |
| Sparse Table | Bản cổ điển, mảng phẳng |
| Fischer–Heun | $b = \lfloor \frac14 \log_2 n \rfloor$, bảng chung theo loại, Sparse Table trên đại diện |

Mọi cấu trúc phải trả lời đúng hết trước khi đo: tự kiểm tra trên hơn 36 triệu đoạn, và checksum đáp án khớp nhau trên mọi lượt đo.

- **Dữ liệu:** số nguyên ngẫu nhiên từ 0 đến $10^9$.
- **Môi trường:** ghim một P-core; L1d 48 KiB, L2 1,25 MiB, L3 24 MiB; biên dịch `-O3 -march=native`; đổi thứ tự chạy giữa các lần.
- **Bộ nhớ:** chỉ tính kích thước mảng phụ, chưa tính mảng đầu vào.

Đây là microbenchmark trên **một máy laptop**, không cô lập hoàn toàn. Kết quả cho thấy xu hướng, không nên gộp với số liệu của các paper.

### 6.2 Thời gian một truy vấn theo $n$

Truy vấn ngẫu nhiên:

| $n$ | Duyệt | Chia khối | Segment Tree | Fischer–Heun | Sparse Table |
|---|---|---|---|---|---|
| $2^{16}$ | 876 ns | 55 ns | 74 ns | 4,8 ns | 2,6 ns |
| $2^{20}$ | 19,8 µs | 107 ns | 96 ns | 11,3 ns | 6,4 ns |
| $2^{23}$ | 283 µs | 451 ns | 121 ns | 32,7 ns | 13,3 ns |

Nhận xét:

- Duyệt tăng tuyến tính và nhanh chóng vượt khỏi thang đo.
- Segment Tree tăng chậm theo $\log n$.
- **$O(1)$ vẫn chậm dần khi $n$ tăng.** Sparse Table từ 2,6 ns lên 13,3 ns vì bảng 76–88 byte mỗi phần tử không còn vừa cache. Fischer–Heun tra nhiều bảng hơn nên chậm hơn Sparse Table một chút.
- Big-O không mô tả cache; hằng số và bộ nhớ ảnh hưởng ngược lại đến tốc độ.

### 6.3 Cái giá của $O(1)$

Với $n = 2^{20}$:

| Cấu trúc | Xây | Bộ nhớ phụ | Một truy vấn |
|---|---|---|---|
| Sparse Table | 29 ms | 76 byte/phần tử | 6,4 ns |
| Fischer–Heun | 5,8 ms | 13,8 byte/phần tử | 11,3 ns |
| Segment Tree | 1,07 ms | 8 byte/phần tử | 96 ns |
| Chia khối | 1,44 ms | gần 0 | 107 ns |
| Duyệt | — | 0 | khoảng 20 µs |

Sparse Table hỏi nhanh nhất nhưng xây lâu gấp 5 lần và tốn bộ nhớ gấp 5,5 lần Fischer–Heun. Không có gì miễn phí.

### 6.4 Đoạn ngắn: duyệt thắng

Cố định $n = 2^{22}$ và thay đổi độ dài đoạn $L$, thời gian một truy vấn là:

| $L$ | 1 | 16 | 64 | 256 | 1.024 | 65.536 | $2^{20}$ |
|---|---|---|---|---|---|---|---|
| Duyệt | 4,5 ns | 5,6 ns | 8,5 ns | 25 ns | 85 ns | 4,2 µs | 65 µs |
| Segment Tree | 7,5 ns | 20 ns | 28 ns | 37 ns | 44 ns | 69 ns | 77 ns |
| Fischer–Heun | 13 ns | 21 ns | 20 ns | 20 ns | 20 ns | 22 ns | 24 ns |
| Sparse Table | 7,4 ns | 7,4 ns | 7,4 ns | 7,3 ns | 7,3 ns | 7,8 ns | 4,7 ns |

Với đoạn vài chục phần tử, vòng lặp đơn giản thắng cả cấu trúc $O(1)$, vì dữ liệu nằm liền nhau trong cache và không có nhánh khó đoán. Paper Fischer–Heun 2006 cũng thấy quét trực tiếp rất nhanh với đoạn tới khoảng 100 phần tử trên máy của họ.

Ý nghĩa thực tế: nên biết đoạn hỏi thường dài bao nhiêu. Có thể dùng thuật toán lai: đoạn ngắn thì quét, đoạn dài thì tra bảng. Tuy vậy, kết quả này **không** phủ nhận chi phí $O(n)$ tệ nhất của duyệt.

### 6.5 Bao nhiêu truy vấn thì đáng xây?

Tổng thời gian $T(q) = P + q \cdot Q$. Cấu trúc $A$ xây lâu hơn nhưng hỏi nhanh hơn $B$ sẽ thắng khi $q$ vượt **điểm hòa vốn**:

$$q^* = \frac{P_A - P_B}{Q_B - Q_A}$$

Tính từ số đo với $n = 2^{20}$:

- Rất ít truy vấn: **Duyệt** thắng vì không phải xây gì.
- Từ $q \approx 59.000$: **Fischer–Heun** vượt Segment Tree.
- Từ $q \approx 9,4$ triệu: **Sparse Table** vượt Fischer–Heun.

Nói cách khác, ở $n = 2^{20}$ Segment Tree thắng đến khoảng $6 \cdot 10^4$ truy vấn, Fischer–Heun thắng đến khoảng $9 \cdot 10^6$, sau đó mới đến lượt Sparse Table.

### 6.6 Khi có cập nhật

Với $n = 2^{17}$ và 131.072 thao tác xen kẽ hỏi và sửa, tổng thời gian là:

| Tỉ lệ cập nhật | 0% | 50% | 75% | 99% |
|---|---|---|---|---|
| Chia khối | 8,0 ms | 5,6 ms | 4,1 ms | 2,7 ms |
| Segment Tree | 11,0 ms | 6,4 ms | 3,8 ms | 1,3 ms |

Về bậc thì $\log n$ tốt hơn $\sqrt n$, nhưng phép quét trong chia khối có hằng số rất nhỏ. Ở kích thước này chia khối thắng khi ít cập nhật, Segment Tree thắng khi cập nhật nhiều. Ở $n$ lớn hơn, chia khối chậm đi nhanh hơn nhiều. Sparse Table và Fischer–Heun không tham gia vì được thiết kế cho mảng tĩnh.

### 6.7 Các nghiên cứu khác đo được gì

| Nguồn | Kết quả chính |
|---|---|
| Fischer & Heun 2006 [6] | $n = 10^7$, $10^6$ truy vấn: hỏi nhanh gấp khoảng 2 lần Berkman–Vishkin; bản quét biên $O(\log n)$ còn nhỉnh hơn bản $O(1)$ |
| Dima & Ceterchi 2015 [11] | $10^7$ thao tác: Fenwick hai cây cập nhật 0,672 s so với 1,274 s, truy vấn 0,551 s so với 2,397 s của Segment Tree |
| Baumstark et al. 2017 [9] | RMQ tiết kiệm bộ nhớ, nhanh hơn tới 3 lần |
| Kowalski & Grabowski 2018 [10] | $n = 10^9$: Sparse Table theo khối xây 0,6 s thay vì 436,6 s của Sparse Table đầy đủ |

Mỗi dòng là số của tác giả trên máy của họ, không so sánh trực tiếp với nhau hay với số đo của nhóm. Tuy vậy, xu hướng giống với số đo của nhóm.

### 6.8 Bốn kết luận từ benchmark

1. **Đừng chỉ nhìn cột truy vấn.** Chi phí xây và số truy vấn quyết định ai thắng.
2. **Bộ nhớ ảnh hưởng ngược lại đến tốc độ.** Bảng to rơi khỏi cache thì $O(1)$ cũng chậm dần.
3. **Không có cấu trúc nào thắng mọi hoàn cảnh.** Số truy vấn, độ dài đoạn, tỉ lệ cập nhật và bộ nhớ đều có thể đổi người thắng.
4. **Big-O chưa phải tất cả.** Hằng số, cache, rẽ nhánh và SIMD không nằm trong Big-O.

---

## 7. RMQ trong thực tế

RMQ xuất hiện theo hai kiểu:

- **Trực tiếp:** RMQ là phép toán cốt lõi của bài toán.
- **Quy đổi:** bài toán đưa được về RMQ.

Cần nói chính xác: RMQ là phép toán nền tảng xuất hiện trong các bài toán dưới đây. Điều đó **không** có nghĩa mọi hệ thống chứng khoán, tìm kiếm hay xử lý ảnh đều chạy Sparse Table hay Fischer–Heun; hệ thống thật có thể dùng cách khác. Tài liệu này không khẳng định Google Search hay Elasticsearch dùng các thuật toán này, vì không có bằng chứng triển khai.

### 7.1 Chuỗi thời gian: biểu đồ giá

Các câu hỏi quen thuộc: giá thấp nhất từ 9 giờ đến 11 giờ là bao nhiêu? CPU có từng dưới 10% trong khoảng đó không? Đó chính là RMQ (min và max).

Khi vẽ một chuỗi hàng triệu điểm lên màn hình vài nghìn điểm ảnh, mỗi cột điểm ảnh đại diện cho một đoạn dữ liệu. Nếu chỉ lấy mẫu một điểm mỗi cột, các đỉnh nhọn sẽ biến mất. Cách đúng là hỏi **min và max** của đoạn mà cột đó đại diện, rồi vẽ đoạn thẳng đứng nối hai giá trị. Như vậy hình dạng vẫn đúng ở mọi mức zoom vì cực trị luôn được giữ. Slide có một biểu đồ chạy RMQ thật trong trình duyệt để minh họa.

Dữ liệu tĩnh thì dùng Sparse Table. Dữ liệu cập nhật liên tục thì dùng Segment Tree hoặc cấu trúc tổng hợp nhiều cấp. Hệ thống OM³ (SIGMOD 2023 [12]) dùng cây min–max nhiều cấp của riêng nó, không phải Sparse Table. Tác giả báo cáo độ trễ dưới 300 ms trên trình duyệt, với dữ liệu từ hàng triệu đến hàng tỷ bản ghi.

### 7.2 DNA: Suffix Array + LCP + RMQ

Bài toán: so sánh nhanh hai vị trí trong một chuỗi DNA, xem chúng có chung bao nhiêu ký tự kể từ đó (LCE, *longest common extension*).

Xét chuỗi `GATTACAGATTAC` (thêm `$` làm ký tự kết thúc, nhỏ hơn mọi ký tự khác).

1. Liệt kê mọi **hậu tố** của chuỗi.
2. **Sắp xếp** chúng theo thứ tự từ điển. Mảng **SA** (*suffix array*) lưu vị trí bắt đầu của từng hậu tố theo thứ tự đã sắp.
3. Mảng **LCP**: $LCP[k]$ là số ký tự chung giữa hậu tố hạng $k$ và hậu tố ngay trên nó (hạng $k-1$).

| Hạng | SA | Hậu tố | LCP |
|---|---|---|---|
| 0 | 13 | `$` | 0 |
| 1 | 11 | `AC$` | 0 |
| 2 | 4 | `ACAGATTAC$` | 2 |
| 3 | 6 | `AGATTAC$` | 1 |
| 4 | 8 | `ATTAC$` | 1 |
| 5 | 1 | `ATTACAGATTAC$` | 5 |
| 6 | 12 | `C$` | 0 |
| 7 | 5 | `CAGATTAC$` | 1 |
| 8 | 7 | `GATTAC$` | 0 |
| 9 | 0 | `GATTACAGATTAC$` | 6 |
| 10 | 10 | `TAC$` | 0 |
| 11 | 3 | `TACAGATTAC$` | 3 |
| 12 | 9 | `TTAC$` | 1 |
| 13 | 2 | `TTACAGATTAC$` | 4 |

- **Hai dòng kề nhau** (hạng 8 và 9) có $LCP[9] = 6$: đoạn lặp `GATTAC` dài 6.
- **Hai dòng cách xa** hạng $p < q$:
  $$\mathrm{LCP}(p, q) = \min\big(LCP[p+1], \dots, LCP[q]\big)$$
  Đây chính là RMQ trên mảng LCP. Ví dụ hạng 3 (`AGATTAC$`) và hạng 5 (`ATTACAGATTAC$`): $\min(LCP[4], LCP[5]) = \min(1, 5) = 1$, phần chung là `A`.

**Vì sao lấy min lại đúng?** Các hậu tố đã sắp xếp, nên những chuỗi có cùng tiền tố nằm liền nhau. Tiền tố chung của hai đầu phải "đi qua" mọi cặp kề nhau ở giữa, và cặp yếu nhất quyết định. Đoạn RMQ là $[p+1, q]$ chứ không phải $[p, q]$, vì $LCP[p]$ so hạng $p$ với hạng $p-1$, nằm ngoài khoảng đang xét.

Sau tiền xử lý, mỗi truy vấn tốn $O(1)$ thay vì so từng ký tự. Chi phí toàn bộ còn phải cộng việc xây suffix array và mảng LCP.

Công cụ kmacs (Leimeister & Morgenstern, Bioinformatics 2014 [13]) trình bày cách dùng RMQ trên mảng LCP để so sánh trình tự và có tùy chọn RMQ. Tuy vậy, tác giả dùng so từng ký tự làm mặc định vì nhanh hơn trong thử nghiệm của họ, giống kết luận "đoạn ngắn thì duyệt thắng" ở mục 6.4. Tổng quan năm 2026 trên Genome Research [14] tiếp tục dùng các cấu trúc này cho dữ liệu genomic lớn.

### 7.3 Tìm kiếm tài liệu (Document Listing)

Bài toán: có nhiều tài liệu, cho một mẫu chuỗi, liệt kê **các tài liệu khác nhau** chứa mẫu. Một mẫu có thể khớp rất nhiều lần, nhưng chỉ xuất hiện trong vài tài liệu. Ta muốn thời gian tỉ lệ với **số tài liệu**, không phải số lần khớp.

Thuật toán của Muthukrishnan (2002) [15] dùng ba thành phần:

- Suffix array của tất cả tài liệu ghép lại. Các vị trí khớp mẫu tạo thành một khoảng liên tiếp $[l, r]$ trong SA.
- $DA[i]$: tài liệu chứa vị trí $i$.
- $C[i]$: vị trí xuất hiện **trước đó** của cùng tài liệu đó trong mảng, hoặc $-1$ nếu chưa có.

Ví dụ $DA = [D1, D3, D2, D1, D2, D3, D1, D2]$ và mẫu khớp 6 lần ở khoảng $[2, 7]$, nhưng chỉ trong 3 tài liệu:

| Vị trí | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| $DA$ | D1 | D3 | D2 | D1 | D2 | D3 | D1 | D2 |
| $C$ | −1 | −1 | −1 | 0 | 2 | 1 | 3 | 4 |

**Ý tưởng:** vị trí $i$ trong $[l, r]$ là lần **đầu tiên** tài liệu $DA[i]$ xuất hiện trong khoảng khi và chỉ khi $C[i] < l$. Gọi đệ quy:

```
list(a, b):                       // liệt kê trong [a, b] ⊆ [l, r]
    nếu a > b: return
    k = RMQ_C(a, b)               // vị trí có C nhỏ nhất
    nếu C[k] >= l: return         // không còn lần xuất hiện đầu tiên nào: dừng nhánh
    báo DA[k]
    list(a, k - 1); list(k + 1, b)
```

Chạy với $l = 2$:

| Lần gọi | RMQ trên $C$ | $C[k]$ | Kết quả |
|---|---|---|---|
| [2, 7] | $k = 2$ | −1 < 2 | báo **D2** |
| [3, 7] | $k = 3$ | 0 < 2 | báo **D1** |
| [4, 7] | $k = 5$ | 1 < 2 | báo **D3** |
| [4, 4] | $k = 4$ | 2 ≥ 2 | dừng |
| [6, 7] | $k = 6$ | 3 ≥ 2 | dừng |

Thuật toán tìm được 3 tài liệu, chỉ với 5 lần gọi RMQ. Mỗi tài liệu được báo đúng một lần, và mỗi lần báo sinh tối đa hai lần gọi "dừng". Vì vậy số lần gọi RMQ là $O(\text{số tài liệu})$, mỗi lần $O(1)$.

RMQ nằm thực sự bên trong các thuật toán truy xuất tài liệu (Gagie et al. 2017 [16]; đánh giá thực nghiệm ở Baumstark et al. 2017 [9]). Phiên bản thi đấu của bài này là liệt kê các giá trị phân biệt trong $a[l..r]$ bằng mảng `prev[i]`.

### 7.4 Cây: LCA quy về RMQ

Mục 5.5 đi từ RMQ sang LCA. Chiều ngược lại cũng đúng: **LCA trên cây quy về RMQ** qua Euler tour.

1. Duyệt DFS từ gốc. Mỗi khi đến một nút, kể cả lúc quay về từ nút con, ghi nút đó vào mảng $E$ và độ sâu của nó vào mảng $D$. Cây $n$ nút cho Euler tour dài $2n - 1$.
2. Ghi lại $\text{first}[u]$, vị trí đầu tiên $u$ xuất hiện trong $E$.
3. Với $\text{first}[u] \le \text{first}[v]$:
   $$\mathrm{LCA}(u, v) = E\big[\mathrm{RMQ}_D(\text{first}[u], \text{first}[v])\big]$$

Ví dụ cây có gốc 1, các con 2 và 3; 2 có con 4 và 5; 3 có con 6 và 7.

| Chỉ số | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| $E$ | 1 | 2 | 4 | 2 | 5 | 2 | 1 | 3 | 6 | 3 | 7 | 3 | 1 |
| $D$ | 0 | 1 | 2 | 1 | 2 | 1 | 0 | 1 | 2 | 1 | 2 | 1 | 0 |

Ví dụ $\mathrm{LCA}(4, 6)$: $\text{first}[4] = 2$, $\text{first}[6] = 8$. Min của $D[2..8]$ là 0 tại chỉ số 6, nên $\mathrm{LCA} = E[6] = 1$.

**Vì sao đúng?** Trên đường DFS đi từ $u$ sang $v$, ta phải leo lên tới LCA rồi mới xuống nhánh của $v$. Không bao giờ leo cao hơn LCA, nên nút nông nhất trong đoạn chính là LCA. Các nhánh phụ ghé qua trên đường đều sâu hơn LCA nên không ảnh hưởng.

Khoảng cách giữa hai nút:

$$\mathrm{dist}(u, v) = \text{depth}[u] + \text{depth}[v] - 2 \cdot \text{depth}[\mathrm{LCA}(u, v)]$$

Ví dụ $\mathrm{dist}(4, 6) = 2 + 2 - 0 = 4$ cạnh.

Ứng dụng: tìm tổ tiên chung của hai loài trong cây phân loại, phần tử cha chung trong hệ thống tài liệu phân cấp. Đây là ứng dụng gián tiếp, vì LCA còn có cách khác như **binary lifting** ($O(n \log n)$ xây, $O(\log n)$ hỏi). Binary lifting có lợi khi cần thêm tổ tiên thứ $k$. Mối liên hệ RMQ–LCA cũng được dùng trong các nghiên cứu về cây nén [9].

### 7.5 Phản ví dụ: dùng RMQ sai chỗ

Đã có Euler tour rồi, liệu có thể lấy min **trọng số** trên đường đi giữa hai nút bằng cách RMQ trên trọng số không? **Không.**

Xét cây có gốc 1; 2 và 3 là con của 1; 4 và 5 là con của 2. Trọng số các nút là $w_4 = 7$, $w_2 = 8$, $w_1 = 10$, $w_3 = 6$, $w_5 = -100$.

- Đường đi $4 \to 2 \to 1 \to 3$ có min đúng là **6**.
- Euler tour là $[1, 2, 4, 2, 5, 2, 1, 3, 1]$. Đoạn từ lần đầu gặp 4 tới lần đầu gặp 3 là $[4, 2, 5, 2, 1, 3]$. Đoạn này **đi lạc qua nút 5**, nằm ngoài đường đi, nên trả về −100. Sai.

Với LCA thì đúng, vì LCA chỉ cần nút **nông nhất** trong đoạn, mà các nhánh phụ luôn sâu hơn LCA. Trọng số tùy ý không có tính chất đó. RMQ đúng với độ sâu, không đúng với trọng số bất kỳ.

| Min trên đường đi | Chi phí mỗi truy vấn |
|---|---|
| Binary lifting kèm min (trọng số tĩnh) | $O(\log n)$ |
| HLD + Segment Tree (có cập nhật) | $O(\log^2 n)$ |

### 7.6 RMQ hai chiều và xử lý ảnh

**RMQ hai chiều.** Pi giờ muốn chọn cả ngày lẫn giờ bay, nên bảng giá thành ma trận: hàng là khung giờ, cột là ngày bay. Câu hỏi là tìm ô rẻ nhất trong một hình chữ nhật:

$$\min_{r_1 \le i \le r_2,\ c_1 \le j \le c_2} M[i][j]$$

|  | 3/11 | 4/11 | 5/11 | 6/11 | 7/11 | 8/11 | 9/11 | 10/11 |
|---|---|---|---|---|---|---|---|---|
| 6h | 9 | 6 | 12 | 7 | 8 | 5 | 3 | 10 |
| 9h | 8 | **4** | **11** | **5** | **9** | **3** | 6 | 9 |
| 12h | 7 | **7** | **10** | **6** | **6** | **4** | 5 | 11 |
| 15h | 11 | **5** | **9** | **8** | **7** | ***2*** | 4 | 8 |
| 18h | 10 | **8** | **13** | **4** | **10** | **6** | 3 | 12 |
| 21h | 8 | 6 | 11 | 9 | 8 | 7 | 2 | 9 |

Min theo từng cột của bảng chính là mảng giá vé $A = [7, 4, 9, 4, 6, 2, 2, 8]$ ở đầu tài liệu: bài một chiều là bảng này nhìn từ trên xuống. Khung in đậm (9h–18h, 4/11–8/11) có $4 \times 5 = 20$ ô, rẻ nhất là 2 lúc 15h ngày 8/11.

Các cách giải:

- **Quét:** đọc mọi ô trong khung, tệ nhất $O(nm)$ mỗi truy vấn.
- **Mỗi hàng một Sparse Table:** hỏi bằng cách lấy min của từng hàng, tốn $O(n)$ mỗi truy vấn.
- **Sparse Table 2D:** lưu min của mọi hình chữ nhật có hai cạnh là lũy thừa của 2, tức $O(nm \log n \log m)$ ô. Mỗi truy vấn tra 4 hình chữ nhật chồng lấn bám bốn góc. Đây đúng là ý tưởng một chiều áp dụng cho cả hai chiều, và lại dựa trên tính lũy đẳng của min.

**Xử lý ảnh: erosion.** Ảnh xám là một ma trận số. Phép **erosion** cho mỗi điểm ảnh lấy giá trị nhỏ nhất trong cửa sổ $(2r+1) \times (2r+1)$ quanh nó, tức là một RMQ hai chiều.

- Các chấm sáng nhỏ biến mất.
- Cửa sổ càng lớn thì vùng sáng càng co lại.

Slide có minh họa chạy thật trong trình duyệt bằng Sparse Table 2D.

Lưu ý: erosion có cửa sổ **cố định** là trường hợp đặc biệt, nên các thuật toán chuyên dụng kiểu sliding-window minimum (Gil & Kimmel, IEEE TPAMI 2002 [17]) thường phù hợp hơn RMQ 2D tổng quát. Các cấu trúc 2D tiết kiệm bộ nhớ hơn được nghiên cứu ở Amir, Fischer, Lewenstein (2007) [8].

### 7.7 Khi đề bài đổi một chút

Một ý tưởng cốt lõi có nhiều biến thể:

| Trường hợp | Công cụ | Ví dụ trên $A = [7,4,9,4,6,2,2,8]$ |
|---|---|---|
| Mảng tĩnh | Sparse Table | $\mathrm{RMQ}(1,6) = 5$ từ hai khối [1, 4] và [3, 6] |
| Sửa một phần tử | Segment Tree | $A[5] := 10$ thì $\mathrm{RMQ}(3,6)$ đổi từ 5 sang 6 |
| Sửa cả đoạn | Lazy Segment Tree | Cộng 3 vào [4, 6] thì min $A[2..7]$ thành 4 |
| Cửa sổ trượt | Deque đơn điệu | Cửa sổ dài 3 cho min 4, 4, 4, 2, 2, 2 |
| Phép tổng, phép không lũy đẳng | Disjoint Sparse Table | |
| Ma trận | Sparse Table 2D | |
| Bộ nhớ cực ít | Succinct RMQ | |

Một số ghi chú:

- max, gcd, AND, OR vẫn dùng được Sparse Table thường vì đều lũy đẳng.
- **Disjoint Sparse Table** chia đoạn hỏi thành hai phần **không giao nhau** quanh một điểm giữa, nên đúng với mọi phép kết hợp, kể cả phép cộng (xem bên dưới).
- **Succinct RMQ** chỉ dùng $2n + o(n)$ bit, trả về vị trí mà không cần giữ mảng gốc [7].

#### Disjoint Sparse Table

Sparse Table thường ghép hai khối **chồng lấn**, nên chỉ đúng với phép lũy đẳng. Disjoint Sparse Table ghép hai phần **không giao nhau**, nên đúng với mọi phép có tính kết hợp. Phép không cần lũy đẳng, không cần phép ngược, không cần giao hoán.

**Cấu trúc.** Ở tầng $k$, chia mảng thành các khối dài $2^k$, mỗi khối có điểm giữa $mid$. Với mỗi $i$ ở nửa trái, lưu kết quả của đoạn $[i, mid-1]$; với mỗi $i$ ở nửa phải, lưu kết quả của đoạn $[mid, i]$. Xây $O(n \log n)$, bộ nhớ $O(n \log n)$.

**Truy vấn** $[l, r]$ với $l < r$: tìm tầng nhỏ nhất mà $l$ và $r$ cùng khối nhưng khác nửa. Khi đó $[l, r] = [l, mid-1] \cup [mid, r]$, cả hai phần đã lưu sẵn, nên chỉ cần đúng một phép toán. Tầng đó là $k = (\text{bit cao nhất khác nhau của } l, r) + 1$, trong C++ là `32 - __builtin_clz(l ^ r)`.

Ví dụ phép cộng trên $A = [7, 4, 9, 4, 6, 2, 2, 8]$. Tầng 3 (một khối, $mid = 4$) lưu $[24, 17, 13, 4 \mid 6, 8, 10, 18]$: bên trái là tổng từ $i$ tới 3, bên phải là tổng từ 4 tới $i$.

- $\mathrm{sum}(1, 6)$: $1 \oplus 6 = 111_2$, nên $k = 3$, kết quả $17 + 10 = 27$.
- $\mathrm{sum}(4, 6)$: $4 \oplus 6 = 010_2$, nên $k = 2$. Khối [4, 7] có $mid = 6$, kết quả $8 + 2 = 10$.

```cpp
struct DisjointSparseTable {          // phép cộng; đổi + và phần tử đệm 0 cho phép khác
    int LOG = 0; vector<long long> a; vector<vector<long long>> t;
    explicit DisjointSparseTable(const vector<long long>& v) : a(v) {
        int n = 1; while (n < (int)v.size()) n <<= 1, ++LOG;   // làm tròn lên lũy thừa 2
        a.resize(n, 0);                                         // đệm bằng phần tử trung hòa
        t.assign(LOG + 1, vector<long long>(n));
        for (int k = 1; k <= LOG; ++k) {
            int half = 1 << (k - 1);
            for (int mid = half; mid < n; mid += 2 * half) {
                t[k][mid - 1] = a[mid - 1];                     // nửa trái: từ i tới mid-1
                for (int i = mid - 2; i >= mid - half; --i) t[k][i] = a[i] + t[k][i + 1];
                t[k][mid] = a[mid];                             // nửa phải: từ mid tới i
                for (int i = mid + 1; i < mid + half; ++i) t[k][i] = t[k][i - 1] + a[i];
            }
        }
    }
    long long query(int l, int r) const {                       // O(1), đúng một phép cộng
        if (l == r) return a[l];
        int k = 32 - __builtin_clz(l ^ r);
        return t[k][l] + t[k][r];
    }
};
```

Code đã được kiểm thử bằng cách so với cộng trực tiếp trên 298.200 đoạn. Riêng phép cộng thì tổng tiền tố đã đủ ($O(n)$ bộ nhớ, hỏi $O(1)$). Disjoint Sparse Table có ích khi phép vừa không lũy đẳng vừa không có phép ngược:

- tích modulo hợp số, hoặc mảng có số 0;
- nhân ma trận (không giao hoán, DST vẫn đúng vì luôn ghép trái trước, phải sau);
- hợp các hàm;
- tổng đoạn con lớn nhất.

Cấu trúc này không hỗ trợ cập nhật.

### 7.8 Cửa sổ trượt với deque đơn điệu

Bài toán: với mọi cửa sổ dài $k$ trượt từ trái sang phải, tìm min của từng cửa sổ. Không cần cấu trúc RMQ tổng quát, chỉ cần một **deque** giữ các chỉ số "còn hy vọng" làm min. Giá trị trong deque luôn tăng dần từ đầu đến cuối.

```
với i = 0 .. n-1:
    trong khi deque không rỗng và A[cuối deque] > A[i]: bỏ cuối deque
    thêm i vào cuối deque
    nếu đầu deque <= i - k: bỏ đầu deque          // đã ra khỏi cửa sổ
    nếu i >= k - 1: min cửa sổ [i-k+1, i] là A[đầu deque]
```

Một phần tử bị phần tử mới hơn và nhỏ hơn "đè" thì không bao giờ còn là min nữa, vì phần tử mới ở lâu hơn trong cửa sổ. Mỗi chỉ số vào và ra deque tối đa một lần, nên tổng là $O(n)$ cho mọi cửa sổ, tức trung bình $O(1)$ mỗi cửa sổ.

Ví dụ $A = [7, 4, 9, 4, 6, 2, 2, 8]$ với $k = 3$ cho min 4, 4, 4, 2, 2, 2. Chuyến đi đúng 3 ngày thì nên khởi hành ngày nào?

Giới hạn: deque chỉ dùng được khi cửa sổ trượt **tuần tự** và cùng độ dài. Với đoạn bất kỳ, vẫn cần cấu trúc RMQ.

---

## 8. Tổng kết, luyện tập và câu hỏi thường gặp

### 8.1 Bốn điều mang về

1. **Xử lý trước để trả lời nhanh.** Mọi lời giải là một cách cân bằng $T = P + q \cdot Q$ và bộ nhớ. Không cần đọc lại từng ngày nếu chịu chuẩn bị trước.
2. **Hai khối chồng lấn là đủ.** Nhờ tính lũy đẳng của min, Sparse Table hỏi $O(1)$ với khoảng 20 dòng code.
3. **Hình dạng cây quyết định đáp án.** Rất nhiều khối thực ra chỉ là một loại, nên Fischer–Heun dùng chung bảng tra và đạt xây $O(n)$, hỏi $O(1)$.
4. **Đo trước khi chọn.** Không có cấu trúc nào thắng mọi lúc: số truy vấn, độ dài đoạn, tỉ lệ cập nhật và bộ nhớ đều có thể đổi người thắng.

Và Pi đã có vé: **ngày 8/11, giá 200 nghìn**, tức $A[5] = 2$.

### 8.2 Lộ trình luyện tập

| Mức | Bài | Công cụ |
|---|---|---|
| 1 · Trực tiếp | [CSES 1647](https://cses.fi/problemset/task/1647), [CSES 1649](https://cses.fi/problemset/task/1649), [VNOJ NKLINEUP](https://oj.vnoi.info/problem/nklineup) | Sparse Table, Segment Tree |
| 2 · Họ hàng | [VNOJ MINK](https://oj.vnoi.info/problem/mink), [CSES 1645](https://cses.fi/problemset/task/1645), [VNOJ QMAX2](https://oj.vnoi.info/problem/qmax2) | Deque, ngăn xếp, lazy |
| 3 · Kết hợp | [CF 689D](https://codeforces.com/problemset/problem/689/D), [CF 1454F](https://codeforces.com/problemset/problem/1454/F), [CF 475D](https://codeforces.com/problemset/problem/475/D) | Sparse Table + chặt nhị phân (475D dùng gcd) |
| 4 · Trên cây | [CSES 1688](https://cses.fi/problemset/task/1688), [CSES 1135](https://cses.fi/problemset/task/1135), [VNOJ LUBENICA](https://oj.vnoi.info/problem/lubenica) | Euler + RMQ (LUBENICA là bài min trên đường đi, xem mục 7.5) |
| 5 · Chuỗi | [ABC213 F](https://atcoder.jp/contests/abc213/tasks/abc213_f), [CF 1073G](https://codeforces.com/problemset/problem/1073/G) | Suffix Array + LCP + RMQ |

Đọc thêm: [VNOI Wiki RMQ](https://wiki.vnoi.info/algo/data-structures/rmq) · [LCA](https://wiki.vnoi.info/algo/data-structures/lca) · [deque min-max](https://wiki.vnoi.info/algo/data-structures/deque-min-max)

### 8.3 Câu hỏi thường gặp

**Hỏi $O(1)$ mà vẫn phải tính log?**
Tính sẵn bảng `lg[]` trong $O(n)$, hoặc dùng `__builtin_clz` (đếm số bit 0 đứng đầu). Tránh `log2()` số thực vì có thể sai do làm tròn.

**Sparse Table khi có cập nhật?**
Không phải xây lại hết, nhưng tệ nhất phải sửa $\Theta(n)$ ô. Có cập nhật thì dùng Segment Tree.

**Giá trị trùng nhau thì sao?**
So sánh cặp (giá trị, vị trí), chọn bên trái. Quy tắc phải nhất quán ở mọi chỗ so sánh.

**Fischer–Heun hơn Sparse Table ở đâu?**
Xây và bộ nhớ $O(n)$ thay vì $O(n \log n)$. Đổi lại code dài hơn và mỗi truy vấn tra nhiều bảng hơn (mục 6.3).

**$O(n)$ bộ nhớ có phải là ít nhất?**
$O(n)$ word nghĩa là $O(n \log n)$ bit. Kết quả succinct $2n + o(n)$ bit [7] là một cấu trúc riêng, chỉ trả vị trí.

**Ai đạt xây $O(n)$, hỏi $O(1)$ đầu tiên?**
Gabow, Bentley, Tarjan năm 1984. Bender & Farach-Colton 2000 là bản đơn giản hóa.

**Euler tour dài bao nhiêu?**
$2n - 1$ phần tử với cây $n$ nút.

**Dựng cây Cartesian tốn bao nhiêu?**
Bằng ngăn xếp đơn điệu thì $O(n)$. Dựng đệ quy theo định nghĩa có thể tốn $O(n^2)$ với mảng tăng dần.

---

## 9. Tài liệu tham khảo

**Lý thuyết**

1. J. Vuillemin. A unifying look at data structures. *CACM* 23(4), 1980.
2. H. N. Gabow, J. L. Bentley, R. E. Tarjan. Scaling and related techniques for geometry problems. *STOC* 1984.
3. D. Harel, R. E. Tarjan. Fast algorithms for finding nearest common ancestors. *SIAM J. Comput.* 13(2), 1984.
4. O. Berkman, U. Vishkin. Recursive star-tree parallel data structure. *SIAM J. Comput.* 22(2), 1993.
5. M. A. Bender, M. Farach-Colton. The LCA problem revisited. *LATIN* 2000.
6. J. Fischer, V. Heun. Theoretical and practical improvements on the RMQ-problem, with applications to LCA and LCE. *CPM* 2006.
7. J. Fischer, V. Heun. Space-efficient preprocessing schemes for range minimum queries on static arrays. *SIAM J. Comput.* 40(2), 2011.
8. A. Amir, J. Fischer, M. Lewenstein. Two-dimensional range minimum queries. *CPM* 2007.

**Thực nghiệm**

9. N. Baumstark, S. Gog, T. Heuer, J. Labeit. Practical range minimum queries revisited. *SEA* 2017. https://doi.org/10.4230/LIPIcs.SEA.2017.12
10. T. Kowalski, S. Grabowski. Faster range minimum queries. *Softw. Pract. Exp.* 48, 2018.
11. M. Dima, R. Ceterchi. Efficient range minimum queries using binary indexed trees. *Olympiads in Informatics* 9, 2015.

**Ứng dụng**

12. Y. Wang et al. OM³: An ordered multi-level min-max representation for interactive progressive visualization of time series. *SIGMOD* 2023. https://doi.org/10.1145/3589290
13. C.-A. Leimeister, B. Morgenstern. kmacs: the k-mismatch average common substring approach to alignment-free sequence comparison. *Bioinformatics* 30(14), 2014. https://doi.org/10.1093/bioinformatics/btu331
14. R. Varki, C. Boucher. Building genomic data structures from compressed representations using prefix-free parsing. *Genome Research* 36(6), 2026.
15. S. Muthukrishnan. Efficient algorithms for document retrieval problems. *SODA* 2002.
16. T. Gagie et al. Document retrieval on repetitive string collections. *Inf. Retrieval J.* 20, 2017. https://doi.org/10.1007/s10791-017-9297-7
17. J. Gil, R. Kimmel. Efficient dilation, erosion, opening, and closing algorithms. *IEEE TPAMI* 24(12), 2002. https://doi.org/10.1109/TPAMI.2002.1114852

**Học liệu**

18. S. Wild. COMP526 Unit 9: Range-minimum queries (video). Stanford CS166: RMQ. Erik Demaine, MIT 6.851: Static Trees. cp-algorithms.

Video trong slide được dựng bằng [3b1b/manim](https://github.com/3b1b/manim). Nhân vật π được vẽ lại, lấy cảm hứng từ phong cách video giải thích toán học.
