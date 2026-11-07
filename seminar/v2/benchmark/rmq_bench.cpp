// RMQ microbenchmark v2 for the seminar, C++17.
// Inclusive, zero-based intervals; every structure returns the minimum VALUE.
// Auxiliary memory = numeric payload of helper arrays, beyond the shared input A.
//
// Structures: Scan, Sqrt (block = floor(sqrt n)), Segment (iterative, bottom-up),
// Sparse (classic sparse table on values), FischerHeun (blocks of (log2 n)/4, sparse table
// over block minima, in-block answers shared per Cartesian-tree type: O(n) build, O(1) query).
//
// Experiments (CSV on stdout, progress on stderr):
//   scale   : n = 2^10..2^23, uniform random endpoints, ns/query + build + memory
//   length  : n = 2^22, fixed query length L, ns/query
//   breakeven: n = 2^20, q = 1..10^7, total time build + q queries
//   mixed   : n = 2^17, 2^17 operations, point-assign update ratio 0..99%
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <functional>
#include <iostream>
#include <limits>
#include <random>
#include <string>
#include <vector>

using Clock = std::chrono::steady_clock;
using u64 = std::uint64_t;
constexpr int INF = std::numeric_limits<int>::max();
volatile u64 sink = 0;

static inline int floor_log2(unsigned x) { return 31 - __builtin_clz(x); }
static double ms_since(Clock::time_point t0) {
    return std::chrono::duration<double, std::milli>(Clock::now() - t0).count();
}

struct Scan {
    static constexpr const char* name = "Scan";
    int* a = nullptr;
    int n = 0;
    void build(int* a_, int n_) { a = a_; n = n_; }
    int query(int l, int r) const {
        int ans = INF;
        for (int i = l; i <= r; ++i) ans = std::min(ans, a[i]);
        return ans;
    }
    void update(int p, int x) { a[p] = x; }
    std::size_t bytes() const { return 0; }
};

struct Sqrt {
    static constexpr const char* name = "Sqrt";
    int* a = nullptr;
    int n = 0, b = 1;
    std::vector<int> mn;
    void build(int* a_, int n_) {
        a = a_; n = n_;
        b = std::max(1, static_cast<int>(std::sqrt(static_cast<double>(n))));
        mn.assign((n + b - 1) / b, INF);
        for (int i = 0; i < n; ++i) mn[i / b] = std::min(mn[i / b], a[i]);
    }
    int query(int l, int r) const {
        const int lb = l / b, rb = r / b;
        int ans = INF;
        if (lb == rb) {
            for (int i = l; i <= r; ++i) ans = std::min(ans, a[i]);
            return ans;
        }
        for (int i = l; i < (lb + 1) * b; ++i) ans = std::min(ans, a[i]);
        for (int j = lb + 1; j < rb; ++j) ans = std::min(ans, mn[j]);
        for (int i = rb * b; i <= r; ++i) ans = std::min(ans, a[i]);
        return ans;
    }
    void update(int p, int x) {
        a[p] = x;
        const int id = p / b;
        int m = INF;
        for (int i = id * b; i < std::min((id + 1) * b, n); ++i) m = std::min(m, a[i]);
        mn[id] = m;
    }
    std::size_t bytes() const { return mn.size() * sizeof(int); }
};

struct Segment {
    static constexpr const char* name = "Segment";
    int n = 0;
    std::vector<int> t;
    void build(int* a, int n_) {
        n = n_;
        t.assign(2 * n, INF);
        std::copy(a, a + n, t.begin() + n);
        for (int i = n - 1; i >= 1; --i) t[i] = std::min(t[2 * i], t[2 * i + 1]);
    }
    int query(int l, int r) const {
        int ans = INF;
        for (l += n, r += n + 1; l < r; l >>= 1, r >>= 1) {
            if (l & 1) ans = std::min(ans, t[l++]);
            if (r & 1) ans = std::min(ans, t[--r]);
        }
        return ans;
    }
    void update(int p, int x) {
        for (t[p += n] = x; p > 1; p >>= 1) t[p >> 1] = std::min(t[p], t[p ^ 1]);
    }
    std::size_t bytes() const { return t.size() * sizeof(int); }
};

// Flat sparse table: level k stores min of [i, i + 2^k) for every valid i.
struct SparseCore {
    std::vector<int> st;
    std::vector<std::size_t> off;
    void build(const int* a, int n) {
        const int K = floor_log2(static_cast<unsigned>(n)) + 1;
        off.assign(K, 0);
        std::size_t total = 0;
        for (int k = 0; k < K; ++k) { off[k] = total; total += n - (1 << k) + 1; }
        st.resize(total);
        std::copy(a, a + n, st.begin());
        for (int k = 1; k < K; ++k) {
            const int* prev = st.data() + off[k - 1];
            int* cur = st.data() + off[k];
            const int half = 1 << (k - 1), len = n - (1 << k) + 1;
            for (int i = 0; i < len; ++i) cur[i] = std::min(prev[i], prev[i + half]);
        }
    }
    int query(int l, int r) const {
        const int k = floor_log2(static_cast<unsigned>(r - l + 1));
        const int* row = st.data() + off[k];
        return std::min(row[l], row[r - (1 << k) + 1]);
    }
};

struct Sparse {
    static constexpr const char* name = "Sparse";
    SparseCore core;
    void build(int* a, int n) { core.build(a, n); }
    int query(int l, int r) const { return core.query(l, r); }
    std::size_t bytes() const { return core.st.size() * sizeof(int); }
};

// Fischer-Heun 2006. A block's type is the push/pop sequence of the stack that builds its
// Cartesian tree (bit 1 = push, bit 0 = pop); blocks of one type share one answer table.
// A table is filled the first time its type appears. Missing elements of the last block
// count as +infinity, so they only ever push and the code stays well defined.
struct FischerHeun {
    static constexpr const char* name = "FischerHeun";
    const int* a = nullptr;
    int n = 0, b = 1;
    std::vector<std::uint16_t> row_of;  // block -> table row
    std::vector<std::uint8_t> table;    // row * b * b + u * b + v -> relative argmin
    SparseCore blocks;
    void build(int* a_, int n_) {
        a = a_; n = n_;
        b = std::max(1, floor_log2(static_cast<unsigned>(n)) / 4);
        const int nb = (n + b - 1) / b;
        row_of.resize(nb);
        table.clear();
        std::vector<int> row_by_code(std::size_t{1} << (2 * b), -1);
        std::vector<int> bmin(nb), stack(b), vals(b);
        int rows = 0;
        for (int t = 0; t < nb; ++t) {
            const int s = t * b;
            unsigned code = 0;
            int top = 0, m = INF;
            for (int j = 0; j < b; ++j) {
                const int v = s + j < n ? a[s + j] : INF;
                vals[j] = v;
                m = std::min(m, v);
                while (top && stack[top - 1] > v) { --top; code <<= 1; }
                stack[top++] = v;
                code = (code << 1) | 1u;
            }
            bmin[t] = m;
            int& row = row_by_code[code];
            if (row < 0) {
                row = rows++;
                table.resize(static_cast<std::size_t>(rows) * b * b);
                std::uint8_t* tab = table.data() + static_cast<std::size_t>(row) * b * b;
                for (int u = 0; u < b; ++u) {
                    int pos = u;
                    tab[u * b + u] = static_cast<std::uint8_t>(u);
                    for (int v = u + 1; v < b; ++v) {
                        if (vals[v] < vals[pos]) pos = v;
                        tab[u * b + v] = static_cast<std::uint8_t>(pos);
                    }
                }
            }
            row_of[t] = static_cast<std::uint16_t>(row);
        }
        blocks.build(bmin.data(), nb);
    }
    int in_block(int t, int u, int v) const {
        const std::size_t base = static_cast<std::size_t>(row_of[t]) * b * b;
        return a[t * b + table[base + u * b + v]];
    }
    int query(int l, int r) const {
        const int bl = l / b, br = r / b;
        if (bl == br) return in_block(bl, l - bl * b, r - bl * b);
        int ans = std::min(in_block(bl, l - bl * b, b - 1), in_block(br, 0, r - br * b));
        if (bl + 1 < br) ans = std::min(ans, blocks.query(bl + 1, br - 1));
        return ans;
    }
    std::size_t bytes() const {
        return row_of.size() * sizeof(std::uint16_t) + table.size() + blocks.st.size() * sizeof(int);
    }
};

struct Query { int l, r; };

static std::vector<int> make_array(int n, u64 seed) {
    std::mt19937_64 rng(seed);
    std::uniform_int_distribution<int> d(0, 1'000'000'000);
    std::vector<int> a(n);
    for (int& x : a) x = d(rng);
    return a;
}

static std::vector<Query> uniform_queries(int n, int q, u64 seed) {
    std::mt19937_64 rng(seed);
    std::uniform_int_distribution<int> d(0, n - 1);
    std::vector<Query> qs(q);
    for (auto& x : qs) {
        int l = d(rng), r = d(rng);
        if (l > r) std::swap(l, r);
        x = {l, r};
    }
    return qs;
}

static std::vector<Query> fixed_length_queries(int n, int q, int len, u64 seed) {
    std::mt19937_64 rng(seed);
    std::uniform_int_distribution<int> d(0, n - len);
    std::vector<Query> qs(q);
    for (auto& x : qs) { const int l = d(rng); x = {l, l + len - 1}; }
    return qs;
}

struct Timing { double build_ms, ops_ms; std::size_t bytes; u64 checksum; };

template <class S>
static Timing run_static(std::vector<int>& a, const std::vector<Query>& qs, int q) {
    S s;
    auto t0 = Clock::now();
    s.build(a.data(), static_cast<int>(a.size()));
    const double build = ms_since(t0);
    u64 sum = 0;
    t0 = Clock::now();
    for (int i = 0; i < q; ++i) sum += static_cast<u64>(s.query(qs[i].l, qs[i].r));
    const double ops = ms_since(t0);
    sink += sum;
    return {build, ops, s.bytes(), sum};
}

static void emit(const char* exp, int n, long long q, int len, int upd, const char* algo,
                 int rep, const Timing& t) {
    std::printf("%s,%d,%lld,%d,%d,%s,%d,%.6f,%.6f,%.4f,%zu,%llu\n", exp, n, q, len, upd, algo,
                rep, t.build_ms, t.ops_ms, q > 0 ? t.ops_ms * 1e6 / q : 0.0, t.bytes,
                static_cast<unsigned long long>(t.checksum));
    std::fflush(stdout);
}

// ---------------- correctness ----------------
template <class S>
static bool check_static(std::vector<int> a) {
    S s;
    s.build(a.data(), static_cast<int>(a.size()));
    const int n = static_cast<int>(a.size());
    for (int l = 0; l < n; ++l) {
        int m = INF;
        for (int r = l; r < n; ++r) {
            m = std::min(m, a[r]);
            if (s.query(l, r) != m) return false;
        }
    }
    return true;
}

static void self_test() {
    std::mt19937_64 rng(2026);
    long long intervals = 0;
    for (int n = 1; n <= 300; ++n) {
        for (int range : {3, 1000}) {
            std::uniform_int_distribution<int> d(-range, range);
            std::vector<int> a(n);
            for (int& x : a) x = d(rng);
            const bool ok = check_static<Sqrt>(a) && check_static<Segment>(a) &&
                            check_static<Sparse>(a) && check_static<FischerHeun>(a);
            if (!ok) { std::fprintf(stderr, "self-test FAILED n=%d\n", n); std::exit(1); }
            intervals += 4LL * n * (n + 1) / 2;
        }
    }
    // mixed: Sqrt / Segment against Scan
    for (int trial = 0; trial < 50; ++trial) {
        const int n = 1 + static_cast<int>(rng() % 500);
        std::vector<int> a = make_array(n, rng()), b = a, c = a;
        Scan s0; Sqrt s1; Segment s2;
        s0.build(a.data(), n); s1.build(b.data(), n); s2.build(c.data(), n);
        for (int op = 0; op < 2000; ++op) {
            const int i = static_cast<int>(rng() % n), j = static_cast<int>(rng() % n);
            if (rng() % 2) {
                const int v = static_cast<int>(rng() % 1000);
                s0.update(i, v); s1.update(i, v); s2.update(i, v);
            } else {
                const int l = std::min(i, j), r = std::max(i, j);
                const int want = s0.query(l, r);
                if (s1.query(l, r) != want || s2.query(l, r) != want) {
                    std::fprintf(stderr, "mixed self-test FAILED\n"); std::exit(1);
                }
            }
        }
    }
    std::fprintf(stderr, "self_test ok: %lld static intervals checked, mixed ok\n", intervals);
}

// ---------------- experiments ----------------
constexpr int REPS = 5;

template <class F>
static void rotate_run(int rep, std::array<F, 5>& fs, int count) {
    for (int k = 0; k < count; ++k) fs[(k + rep) % count]();
}

static void exp_scale() {
    for (int lg = 10; lg <= 23; ++lg) {
        const int n = 1 << lg;
        std::vector<int> a = make_array(n, 1000 + lg);
        const int qfast = 1 << 20;
        const int qsqrt = 1 << 17;
        const int qscan = std::clamp((1 << 30) / n * 3, 64, 1 << 18);
        auto qs = uniform_queries(n, qfast, 2000 + lg);
        for (int rep = 0; rep < REPS; ++rep) {
            std::array<std::function<void()>, 5> fs = {
                [&] { emit("scale", n, qscan, 0, 0, "Scan", rep, run_static<Scan>(a, qs, qscan)); },
                [&] { emit("scale", n, qsqrt, 0, 0, "Sqrt", rep, run_static<Sqrt>(a, qs, qsqrt)); },
                [&] { emit("scale", n, qfast, 0, 0, "Segment", rep, run_static<Segment>(a, qs, qfast)); },
                [&] { emit("scale", n, qfast, 0, 0, "Sparse", rep, run_static<Sparse>(a, qs, qfast)); },
                [&] { emit("scale", n, qfast, 0, 0, "FischerHeun", rep, run_static<FischerHeun>(a, qs, qfast)); },
            };
            rotate_run(rep, fs, 5);
        }
        std::fprintf(stderr, "scale n=2^%d done\n", lg);
    }
}

static void exp_length() {
    const int n = 1 << 22;
    std::vector<int> a = make_array(n, 77);
    for (int len : {1, 2, 4, 8, 16, 32, 64, 128, 256, 1024, 4096, 16384, 65536, 262144, 1 << 20}) {
        const int qfast = 1 << 20;
        const int qsqrt = 1 << 18;
        const int qscan = std::clamp((1 << 30) / len, 64, 1 << 20);
        auto qs = fixed_length_queries(n, qfast, len, 3000 + len);
        for (int rep = 0; rep < REPS; ++rep) {
            std::array<std::function<void()>, 5> fs = {
                [&] { emit("length", n, qscan, len, 0, "Scan", rep, run_static<Scan>(a, qs, qscan)); },
                [&] { emit("length", n, qsqrt, len, 0, "Sqrt", rep, run_static<Sqrt>(a, qs, qsqrt)); },
                [&] { emit("length", n, qfast, len, 0, "Segment", rep, run_static<Segment>(a, qs, qfast)); },
                [&] { emit("length", n, qfast, len, 0, "Sparse", rep, run_static<Sparse>(a, qs, qfast)); },
                [&] { emit("length", n, qfast, len, 0, "FischerHeun", rep, run_static<FischerHeun>(a, qs, qfast)); },
            };
            rotate_run(rep, fs, 5);
        }
        std::fprintf(stderr, "length L=%d done\n", len);
    }
}

static void exp_breakeven() {
    const int n = 1 << 20;
    std::vector<int> a = make_array(n, 99);
    const int qmax = 10'000'000;
    auto qs = uniform_queries(n, qmax, 4242);
    for (int q : {1, 10, 100, 1000, 10'000, 100'000, 1'000'000, 10'000'000}) {
        for (int rep = 0; rep < REPS; ++rep) {
            std::array<std::function<void()>, 5> fs = {
                [&] { if (q <= 10'000) emit("breakeven", n, q, 0, 0, "Scan", rep, run_static<Scan>(a, qs, q)); },
                [&] { if (q <= 1'000'000) emit("breakeven", n, q, 0, 0, "Sqrt", rep, run_static<Sqrt>(a, qs, q)); },
                [&] { emit("breakeven", n, q, 0, 0, "Segment", rep, run_static<Segment>(a, qs, q)); },
                [&] { emit("breakeven", n, q, 0, 0, "Sparse", rep, run_static<Sparse>(a, qs, q)); },
                [&] { emit("breakeven", n, q, 0, 0, "FischerHeun", rep, run_static<FischerHeun>(a, qs, q)); },
            };
            rotate_run(rep, fs, 5);
        }
        std::fprintf(stderr, "breakeven q=%d done\n", q);
    }
}

template <class S>
static Timing run_mixed(const std::vector<int>& base, const std::vector<Query>& qs,
                        const std::vector<char>& is_update, const std::vector<int>& vals) {
    std::vector<int> a = base;  // private copy, not timed
    S s;
    auto t0 = Clock::now();
    s.build(a.data(), static_cast<int>(a.size()));
    const double build = ms_since(t0);
    u64 sum = 0;
    t0 = Clock::now();
    for (std::size_t i = 0; i < qs.size(); ++i) {
        if (is_update[i]) s.update(qs[i].l, vals[i]);
        else sum += static_cast<u64>(s.query(qs[i].l, qs[i].r));
    }
    const double ops = ms_since(t0);
    sink += sum;
    return {build, ops, s.bytes(), sum};
}

static void exp_mixed() {
    const int n = 1 << 17, ops = 1 << 17;
    std::vector<int> base = make_array(n, 555);
    for (int pct : {0, 1, 5, 10, 25, 50, 75, 90, 99}) {
        std::mt19937_64 rng(6000 + pct);
        auto qs = uniform_queries(n, ops, 7000 + pct);
        std::vector<char> upd(ops, 0);
        std::vector<int> vals(ops, 0);
        const int nupd = static_cast<int>(static_cast<long long>(ops) * pct / 100);
        for (int i = 0; i < nupd; ++i) upd[i] = 1;
        std::shuffle(upd.begin(), upd.end(), rng);
        for (int& v : vals) v = static_cast<int>(rng() % 1'000'000'001ULL);
        for (int rep = 0; rep < REPS; ++rep) {
            std::array<std::function<void()>, 5> fs = {
                [&] { emit("mixed", n, ops, 0, pct, "Scan", rep, run_mixed<Scan>(base, qs, upd, vals)); },
                [&] { emit("mixed", n, ops, 0, pct, "Sqrt", rep, run_mixed<Sqrt>(base, qs, upd, vals)); },
                [&] { emit("mixed", n, ops, 0, pct, "Segment", rep, run_mixed<Segment>(base, qs, upd, vals)); },
                [] {}, [] {},
            };
            rotate_run(rep, fs, 3);
        }
        std::fprintf(stderr, "mixed update=%d%% done\n", pct);
    }
}

int main(int argc, char** argv) {
    self_test();
    const std::string which = argc > 1 ? argv[1] : "all";
    std::printf("exp,n,q,len,update_pct,algo,rep,build_ms,ops_ms,ns_per_op,aux_bytes,checksum\n");
    if (which == "all" || which == "scale") exp_scale();
    if (which == "all" || which == "length") exp_length();
    if (which == "all" || which == "breakeven") exp_breakeven();
    if (which == "all" || which == "mixed") exp_mixed();
    std::fprintf(stderr, "sink=%llu\n", static_cast<unsigned long long>(sink));
}
