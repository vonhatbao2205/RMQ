"""Summarize the accompanying RMQ benchmark and create a seminar figure.
Run from this directory after generating rmq_benchmark_raw.csv.
Requires Python 3, numpy, matplotlib.
"""
import csv
import statistics
from collections import defaultdict
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parent
rows = list(csv.DictReader((root / 'rmq_benchmark_raw.csv').open()))
groups = defaultdict(list)
keys = ['mode', 'n', 'operations', 'pattern', 'update_percent', 'algorithm']
for row in rows:
    groups[tuple(row[k] for k in keys)].append(row)
summary = []
for key, samples in groups.items():
    build = sorted(float(r['build_ms']) for r in samples)
    ops = sorted(float(r['operations_ms']) for r in samples)
    total = sorted(float(r['build_ms']) + float(r['operations_ms']) for r in samples)
    summary.append(dict(zip(keys, key), build_ms=statistics.median(build),
                        operations_ms=statistics.median(ops), q1_ms=ops[1], q3_ms=ops[3],
                        total_ms=statistics.median(total), aux_bytes=int(samples[0]['aux_bytes'])))
with (root / 'rmq_benchmark_summary.csv').open('w') as f:
    writer = csv.DictWriter(f, fieldnames=list(summary[0]))
    writer.writeheader()
    writer.writerows(summary)

def get(mode, n, pattern, ratio, algo):
    return next(r for r in summary if (r['mode'], int(r['n']), r['pattern'],
                int(r['update_percent']), r['algorithm']) == (mode, n, pattern, ratio, algo))

algorithms = ['Scan', 'Sqrt', 'Segment', 'Sparse']
labels = {'Scan': 'Duyệt trực tiếp', 'Sqrt': 'Chia khối', 'Segment': 'Segment Tree lặp', 'Sparse': 'Sparse Table'}
out = ['### 17.2 Kết quả static, n=200.000; q=20.000\n',
       'Hai đầu mút ngẫu nhiên, lấy median 5 lần. Đơn vị thời gian **ms cho cả 20.000 query**; tổng là median của build+query trong từng lần, không phải cộng hai median.\n',
       '| Thuật toán | Build (ms) | Query (ms) | Tổng (ms) | Bộ nhớ phụ (MiB) |',
       '|---|---:|---:|---:|---:|']
for algo in algorithms:
    r = get('static', 200000, 'uniform_endpoints', 0, algo)
    out.append(f"| {labels[algo]} | {r['build_ms']:.3f} | {r['operations_ms']:.3f} | {r['total_ms']:.3f} | {r['aux_bytes']/2**20:.4f} |")
out += ['\nIQR thời gian query (Q1–Q3), cùng đơn vị ms:\n',
        '| Thuật toán | Đoạn ngẫu nhiên | Đoạn dài 16 |', '|---|---:|---:|']
for algo in algorithms:
    a = get('static', 200000, 'uniform_endpoints', 0, algo)
    b = get('static', 200000, 'length16', 0, algo)
    out.append(f"| {labels[algo]} | {a['q1_ms']:.3f}–{a['q3_ms']:.3f} | {b['q1_ms']:.3f}–{b['q3_ms']:.3f} |")
out += ['\nChuyển sang đoạn dài đúng 16, giữ n và q:\n',
        '| Thuật toán | Build (ms) | Query (ms) | Tổng (ms) |', '|---|---:|---:|---:|']
for algo in algorithms:
    r = get('static', 200000, 'length16', 0, algo)
    out.append(f"| {labels[algo]} | {r['build_ms']:.3f} | {r['operations_ms']:.3f} | {r['total_ms']:.3f} |")

st = get('static', 200000, 'uniform_endpoints', 0, 'Sparse')
seg = get('static', 200000, 'uniform_endpoints', 0, 'Segment')
sq = get('static', 200000, 'uniform_endpoints', 0, 'Sqrt')
cross_seg = (st['build_ms'] - seg['build_ms']) / ((seg['operations_ms'] - st['operations_ms']) / 20000)
cross_sq = (st['build_ms'] - sq['build_ms']) / ((sq['operations_ms'] - st['operations_ms']) / 20000)
out += [f'''
### 17.3 Đánh giá kết quả static

1. Sparse Table có median thời gian query thấp nhất ở phân bố hai đầu mút ngẫu nhiên, nhưng **không có tổng build+query thấp nhất** tại q=20.000: chia khối thắng trong phép đo này. Đừng chỉ trích cột query để kết luận cho cả chương trình.
2. Với đoạn dài 16, scan có median query thấp nhất. Chênh lệch với Sparse Table dưới 0,1 ms cho cả lô; thời gian nhỏ và môi trường chia sẻ khiến kết luận tốc độ tuyệt đối cần thận trọng.
3. Chia khối có median query thấp hơn Segment Tree tại kích thước này dù bậc tệ nhất xấu hơn. Locality/vectorization/branch prediction là các giải thích khả dĩ, **chưa được xác minh bằng hardware counters** trong thí nghiệm này.
4. Dùng mô hình điểm hòa vốn từ các median trên, Sparse Table so với Segment Tree cần khoảng **{cross_seg:,.0f} query**, so với chia khối khoảng **{cross_sq:,.0f} query** để bù phần build, nếu giữ nguyên phân bố và tốc độ/query. Đây là ước lượng, chưa đo trực tiếp tại các q đó.
5. Cột build của scan làm tròn thành 0,000 ms vì chỉ gắn tham chiếu input. Nó không có nghĩa đọc dữ liệu đầu vào không tốn thời gian.
6. Bộ nhớ Sparse Table đo ở đây khác ví dụ cấp phát hình chữ nhật ở mục 6: benchmark chỉ lưu các ô hợp lệ và dùng bit builtin thay mảng lg.

### 17.4 Kết quả mixed, n=100.000; 20.000 thao tác

Đơn vị ms cho toàn lô thao tác, **không gồm build**. Tỉ lệ cập nhật là phần trăm của 20.000 thao tác, nên số query giảm khi tỉ lệ update tăng.

| Tỉ lệ update | Scan | Chia khối | Segment Tree |
|---|---:|---:|---:|''']
for ratio in [0, 10, 50, 90]:
    a = [get('mixed', 100000, 'uniform_endpoints', ratio, x)['operations_ms'] for x in algorithms[:3]]
    out.append(f'| {ratio}% | {a[0]:.3f} | {a[1]:.3f} | {a[2]:.3f} |')
out += ['''
Ở các case 50% và 90% update, Segment Tree có median thấp hơn chia khối. Khi update chiếm nhiều hơn, chia khối phải quét lại khối nhiều lần; Segment Tree chỉ đi dọc tổ tiên. Thời gian scan cũng giảm vì lô có ít truy vấn quét dài hơn, không phải vì scan đã có truy vấn O(log n).

### 17.5 Biểu đồ và tái lập

![RMQ benchmark: median và IQR](rmq_benchmark.png)

Biểu đồ dùng thang log cho static để thấy các thuật toán ở nhiều bậc thời gian; không đọc khoảng cách trên thang log như chênh lệch tuyến tính. Mixed dùng thang tuyến tính. Nguồn số liệu là CSV tự chạy kèm gói này, không phải figure của paper.

```bash
g++ -O3 -DNDEBUG -std=c++17 -march=native -Wall -Wextra rmq_benchmark.cpp -o rmq_benchmark
./rmq_benchmark > rmq_benchmark_raw.csv 2> rmq_benchmark_run.log
python3 summarize_benchmark.py
```

Muốn ghim CPU trên Linux, chọn một CPU được phép trên máy nhóm rồi dùng `taskset -c CPU_ID ./rmq_benchmark`. Kết quả sẽ khác theo CPU/compiler/tải hệ thống. Không chạy `-march=native` rồi chuyển binary sang máy khác có tập lệnh khác; hãy biên dịch trên máy đích.
''']
report = root / 'rmq_seminar_research_vi.md'
content = report.read_text()
begin, end = '<!-- BENCHMARK_TABLES_BEGIN -->', '<!-- BENCHMARK_TABLES_END -->'
block = begin + '\n' + '\n'.join(out) + '\n' + end
if '<!-- BENCHMARK_TABLES -->' in content:
    content = content.replace('<!-- BENCHMARK_TABLES -->', block)
else:
    before, rest = content.split(begin, 1)
    _, after = rest.split(end, 1)
    content = before + block + after
report.write_text(content)

plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10})
fig, axes = plt.subplots(2, 2, figsize=(13, 8), constrained_layout=True)
colors = dict(zip(algorithms, ['#64748b', '#0d9488', '#c2410c', '#4338ca']))
sizes = [1000, 10000, 100000, 200000]
for ax, pattern, title in [(axes[0, 0], 'uniform_endpoints', 'Static: hai đầu mút ngẫu nhiên'),
                           (axes[0, 1], 'length16', 'Static: mọi đoạn dài 16')]:
    for algo in algorithms:
        rs = [get('static', n, pattern, 0, algo) for n in sizes]
        y = np.array([r['operations_ms'] for r in rs])
        err = np.array([[r['operations_ms']-r['q1_ms'] for r in rs],
                        [r['q3_ms']-r['operations_ms'] for r in rs]])
        ax.errorbar(sizes, y, yerr=err, marker='o', capsize=3, label=labels[algo], color=colors[algo])
    ax.set(xscale='log', yscale='log', xlabel='n', ylabel='ms / 20.000 query', title=title)
    ax.grid(alpha=.2)
ax = axes[1, 0]
for algo in algorithms:
    y = [get('static', n, 'uniform_endpoints', 0, algo)['total_ms'] for n in sizes]
    ax.plot(sizes, y, marker='o', label=labels[algo], color=colors[algo])
ax.set(xscale='log', yscale='log', xlabel='n', ylabel='ms, build + 20.000 query', title='Static: tổng thời gian, median')
ax.grid(alpha=.2)
ax = axes[1, 1]
for algo in algorithms[:3]:
    ratios = [0, 10, 50, 90]
    rs = [get('mixed', 100000, 'uniform_endpoints', r, algo) for r in ratios]
    y = np.array([r['operations_ms'] for r in rs])
    err = np.array([[r['operations_ms']-r['q1_ms'] for r in rs],
                    [r['q3_ms']-r['operations_ms'] for r in rs]])
    ax.errorbar(ratios, y, yerr=err, marker='o', capsize=3, label=labels[algo], color=colors[algo])
ax.set(xlabel='Tỉ lệ cập nhật (%)', ylabel='ms / 20.000 thao tác', title='Mixed: n=100.000, không gồm build')
ax.grid(alpha=.2)
handles, legend_labels = axes[0, 0].get_legend_handles_labels()
fig.legend(handles, legend_labels, loc='outside lower center', ncol=4, frameon=False)
fig.suptitle('RMQ microbenchmark tự chạy — median 5 lần; error bar = IQR\nAMD EPYC 9V74 (ảo hóa), GCC 13.3, -O3 -march=native, 1 thread', fontsize=13)
fig.savefig(root / 'rmq_benchmark.png', dpi=170)
print(f'Summarized {len(rows)} runs into {len(summary)} groups; report and figure written.')
