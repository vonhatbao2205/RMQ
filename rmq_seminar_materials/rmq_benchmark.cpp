// Reproducible educational RMQ microbenchmark, C++17.
// Inclusive, zero-based intervals; returns minimum VALUE, not argmin.
// Auxiliary memory counts numeric vector payload beyond the common input A.
#include <algorithm>
#include <cassert>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <iostream>
#include <limits>
#include <numeric>
#include <random>
#include <stdexcept>
#include <string>
#include <vector>
using Clock = std::chrono::steady_clock;
constexpr int INF = std::numeric_limits<int>::max();
volatile std::uint64_t sink = 0;

struct Scan {
    std::vector<int>& a;
    explicit Scan(std::vector<int>& a_) : a(a_) {}
    int query(int l, int r) const {
        int ans = INF;
        for (int i = l; i <= r; ++i) ans = std::min(ans, a[i]);
        return ans;
    }
    void update(int p, int x) { a[p] = x; }
    std::size_t bytes() const { return 0; }
};

struct Sqrt {
    std::vector<int>& a;
    int b;
    std::vector<int> mn;
    explicit Sqrt(std::vector<int>& a_) : a(a_) {
        b = std::max(1, static_cast<int>(std::sqrt(a.size())));
        mn.assign((a.size() + b - 1) / b, INF);
        for (int i = 0; i < static_cast<int>(a.size()); ++i)
            mn[i / b] = std::min(mn[i / b], a[i]);
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
        mn[id] = INF;
        for (int i = id * b; i < std::min((id + 1) * b, static_cast<int>(a.size())); ++i)
            mn[id] = std::min(mn[id], a[i]);
    }
    std::size_t bytes() const { return mn.size() * sizeof(int); }
};

struct Segment {
    int base = 1;
    std::vector<int> t;
    explicit Segment(std::vector<int>& a) {
        while (base < static_cast<int>(a.size())) base *= 2;
        t.assign(2 * base, INF);
        std::copy(a.begin(), a.end(), t.begin() + base);
        for (int p = base - 1; p; --p) t[p] = std::min(t[p * 2], t[p * 2 + 1]);
    }
    int query(int l, int r) const {
        int ans = INF;
        for (l += base, r += base + 1; l < r; l /= 2, r /= 2) {
            if (l & 1) ans = std::min(ans, t[l++]);
            if (r & 1) ans = std::min(ans, t[--r]);
        }
        return ans;
    }
    void update(int p, int x) {
        t[p += base] = x;
        while (p > 1) { p /= 2; t[p] = std::min(t[p * 2], t[p * 2 + 1]); }
    }
    std::size_t bytes() const { return t.size() * sizeof(int); }
};

struct Sparse {
    std::vector<std::vector<int>> st;
    explicit Sparse(std::vector<int>& a) {
        const int n = static_cast<int>(a.size());
        const int levels = 32 - __builtin_clz(static_cast<unsigned>(n));
        st.resize(levels);
        st[0] = a;
        for (int k = 1; k < levels; ++k) {
            const int len = 1 << k;
            st[k].resize(n - len + 1);
            for (int i = 0; i + len <= n; ++i)
                st[k][i] = std::min(st[k - 1][i], st[k - 1][i + len / 2]);
        }
    }
    int query(int l, int r) const {
        const int k = 31 - __builtin_clz(static_cast<unsigned>(r - l + 1));
        return std::min(st[k][l], st[k][r - (1 << k) + 1]);
    }
    std::size_t bytes() const {
        std::size_t ans = 0;
        for (const auto& row : st) ans += row.size() * sizeof(int);
        return ans;
    }
};

struct Op { bool update; int l, r; }; // r holds assigned value for an update

std::vector<int> make_array(int n, std::uint32_t seed) {
    std::mt19937 gen(seed);
    std::vector<int> a(n);
    for (int& x : a) x = 1 + static_cast<int>(gen() % 1000000000u);
    return a;
}

std::vector<Op> make_queries(int n, int q, bool short_queries, std::uint32_t seed) {
    std::mt19937 gen(seed);
    std::vector<Op> ops;
    for (int i = 0; i < q; ++i) {
        int l, r;
        if (short_queries) {
            l = static_cast<int>(gen() % (n - 15)); r = l + 15;
        } else {
            l = static_cast<int>(gen() % n); r = static_cast<int>(gen() % n);
            if (l > r) std::swap(l, r);
        }
        ops.push_back({false, l, r});
    }
    return ops;
}

std::vector<Op> make_mixed(int n, int count, int percent, std::uint32_t seed) {
    auto ops = make_queries(n, count, false, seed);
    std::mt19937 gen(seed + 1);
    std::vector<int> order(count);
    std::iota(order.begin(), order.end(), 0);
    std::shuffle(order.begin(), order.end(), gen);
    for (int i = 0; i < count * percent / 100; ++i) {
        int p = order[i];
        ops[p] = {true, static_cast<int>(gen() % n), 1 + static_cast<int>(gen() % 1000000000u)};
    }
    return ops;
}

template<class DS>
std::uint64_t consume(DS& ds, const std::vector<Op>& ops) {
    std::uint64_t sum = 0;
    for (std::size_t i = 0; i < ops.size(); ++i) {
        const auto& op = ops[i];
        // Sparse is only instantiated for static consume via a separate function below.
        if (op.update) ds.update(op.l, op.r);
        else sum += static_cast<std::uint64_t>(ds.query(op.l, op.r)) * (i + 1);
    }
    return sum;
}

template<>
std::uint64_t consume(Sparse& ds, const std::vector<Op>& ops) {
    std::uint64_t sum = 0;
    for (std::size_t i = 0; i < ops.size(); ++i) {
        if (ops[i].update) throw std::runtime_error("Sparse does not support updates");
        sum += static_cast<std::uint64_t>(ds.query(ops[i].l, ops[i].r)) * (i + 1);
    }
    return sum;
}

template<class DS>
void validate_static(const std::vector<int>& input, const std::vector<Op>& ops,
                     const std::vector<int>& expected) {
    auto a = input; DS ds(a);
    for (std::size_t i = 0; i < ops.size(); ++i)
        if (ds.query(ops[i].l, ops[i].r) != expected[i]) throw std::runtime_error("static mismatch");
}

void self_test() {
    std::mt19937 gen(712367);
    std::uint64_t checked = 0;
    for (int n = 1; n <= 64; ++n) for (int sample = 0; sample < 20; ++sample) {
        std::vector<int> a(n);
        for (int& x : a) x = static_cast<int>(gen() % 21) - 10;
        Scan scan(a); Sqrt sq(a); Segment seg(a); Sparse st(a);
        for (int l = 0; l < n; ++l) for (int r = l; r < n; ++r) {
            int want = scan.query(l, r);
            if (sq.query(l, r) != want || seg.query(l, r) != want || st.query(l, r) != want)
                throw std::runtime_error("self test mismatch");
            ++checked;
        }
        auto x = a, y = a, z = a;
        Scan ns(x); Sqrt qs(y); Segment ss(z);
        for (int it = 0; it < 100; ++it) {
            if (gen() & 1) {
                int p = gen() % n, v = static_cast<int>(gen() % 21) - 10;
                ns.update(p, v); qs.update(p, v); ss.update(p, v);
            } else {
                int l = gen() % n, r = gen() % n;
                if (l > r) std::swap(l, r);
                if (ns.query(l, r) != qs.query(l, r) || ns.query(l, r) != ss.query(l, r))
                    throw std::runtime_error("dynamic test mismatch");
            }
        }
    }
    std::cerr << "self_test_static_intervals=" << checked << ", mixed tests passed\n";
}

template<class DS>
void run(const std::string& mode, int n, const std::string& pattern, int ratio,
         const std::string& name, int rep, const std::vector<int>& input,
         const std::vector<Op>& ops, std::uint64_t expected) {
    auto a = input; // Common input copy is outside the build timer for every structure.
    auto begin = Clock::now();
    DS ds(a);
    auto built = Clock::now();
    if (mode == "static") {
        std::uint64_t warm = 0;
        for (int i = 0; i < std::min<int>(512, ops.size()); ++i) warm += ds.query(ops[i].l, ops[i].r);
        sink = warm;
    }
    auto start = Clock::now();
    auto checksum = consume(ds, ops);
    auto end = Clock::now();
    sink = checksum;
    if (checksum != expected) throw std::runtime_error("benchmark checksum mismatch");
    double build_ms = std::chrono::duration<double, std::milli>(built - begin).count();
    double query_ms = std::chrono::duration<double, std::milli>(end - start).count();
    std::cout << mode << ',' << n << ',' << ops.size() << ',' << pattern << ',' << ratio << ','
              << name << ',' << rep << ',' << build_ms << ',' << query_ms << ','
              << ds.bytes() << ',' << checksum << '\n';
}

int main() {
    self_test();
    std::cout.precision(10);
    std::cout << "mode,n,operations,pattern,update_percent,algorithm,rep,build_ms,operations_ms,aux_bytes,checksum\n";
    constexpr int reps = 5, q = 20000;
    for (int n : {1000, 10000, 100000, 200000}) {
        auto input = make_array(n, 20261031u + n);
        for (bool short_q : {false, true}) {
            std::string pattern = short_q ? "length16" : "uniform_endpoints";
            auto ops = make_queries(n, q, short_q, 99173u + n);
            auto temp = input; Scan oracle(temp);
            std::vector<int> expected_values;
            for (const auto& op : ops) expected_values.push_back(oracle.query(op.l, op.r));
            validate_static<Sqrt>(input, ops, expected_values);
            validate_static<Segment>(input, ops, expected_values);
            validate_static<Sparse>(input, ops, expected_values);
            auto expected = consume(oracle, ops);
            for (int rep = 0; rep < reps; ++rep) for (int j = 0; j < 4; ++j) {
                switch ((j + rep) % 4) {
                    case 0: run<Scan>("static", n, pattern, 0, "Scan", rep, input, ops, expected); break;
                    case 1: run<Sqrt>("static", n, pattern, 0, "Sqrt", rep, input, ops, expected); break;
                    case 2: run<Segment>("static", n, pattern, 0, "Segment", rep, input, ops, expected); break;
                    case 3: run<Sparse>("static", n, pattern, 0, "Sparse", rep, input, ops, expected); break;
                }
            }
            std::cerr << "completed static n=" << n << " " << pattern << '\n';
        }
    }
    constexpr int dynamic_n = 100000;
    auto input = make_array(dynamic_n, 20261031u);
    for (int percent : {0, 10, 50, 90}) {
        auto ops = make_mixed(dynamic_n, q, percent, 91817u);
        auto a = input; Scan oracle(a);
        auto expected = consume(oracle, ops);
        for (int rep = 0; rep < reps; ++rep) for (int j = 0; j < 3; ++j) {
            switch ((j + rep) % 3) {
                case 0: run<Scan>("mixed", dynamic_n, "uniform_endpoints", percent, "Scan", rep, input, ops, expected); break;
                case 1: run<Sqrt>("mixed", dynamic_n, "uniform_endpoints", percent, "Sqrt", rep, input, ops, expected); break;
                case 2: run<Segment>("mixed", dynamic_n, "uniform_endpoints", percent, "Segment", rep, input, ops, expected); break;
            }
        }
        std::cerr << "completed mixed updates=" << percent << "%\n";
    }
}
