# Practical / Engineered RMQ Implementations and Published Benchmark Evidence

Scope: (a) the word-size-block + monotonic-stack-bitmask O(n)/O(1) RMQ (origins, exact algorithm), (b) published benchmark numbers from the main experimental papers, (c) what production/CP libraries implement. Research date 2026-10-31. Primary PDFs were downloaded and read in full where noted. Benchmark numbers are copied from tables and text. Numbers read off plots are marked as such.

---

## Q1. The "block bitmask" O(n)/O(1) RMQ: origins, exact algorithm, complexity

### Takeaway
The stack-bitmask technique comes from competitive programming, not from an academic paper. The earliest written source I found is a Codeforces comment by **jcg** (Nov 24, 2019). The canonical write-up is **brunomont's** Codeforces tutorial (blog entry 78931, Jun 16, 2020; he credits tfg for showing it to him and jcg's comment as the only source he found). **allvik66's** blog (entry 92310, Jun 28, 2021) gives a per-block-reset variant. The structure has two parts: a sparse table over block minima, which costs O((n/b)·log(n/b)), and one machine-word mask per position, which answers in-block queries with one clz/ctz. Preprocessing is O(n) when b = Θ(log n) ≤ w. With a fixed b = 64 it is O(n + (n/64)·log(n/64)), which is ≤ ~n table entries for every practical n. I found no peer-reviewed paper that describes exactly this mask technique (see Gaps).

### Cited Findings

**Origins / write-ups**
- Earliest description found: jcg's comment (Nov 24, 2019, 23:40) on the Codeforces blog "Enumerating all Binary Trees to build O(n)/O(1) RMQ" (entry 71706, Nov 24, 2019). He gives it as an alternative to the Cartesian-tree in-block method. Text: "For each position i inside a block calculate a binary mask with the bits at positions b0 > b1 > … > bk set to one if a[i] > a[b0] > a[b1] > … > a[bk] (i > b0), here bj is maximum. Those masks can be represented in an integer if the size of a block is less than the size of a word… to get the minimum position in the interval [l, r] inside a block, you only have to find the smallest active bit b in mask[r] such that b ≥ l. If there is none active bit satisfying this condition the answer will be r." — [Codeforces 71706, comment 560384](https://codeforces.com/blog/entry/71706?#comment-560384)
- brunomont, "[Tutorial] Range minimum query in O(1) with linear time construction", Codeforces blog entry 78931, posted Jun 16, 2020. He writes "I would like to thank tfg for showing me this algorithm… The only source I could find was a comment from jcg". — [Codeforces 78931](https://codeforces.com/blog/entry/78931)
- brunomont's TL;DR: "Build a sparse table over blocks of size b = 30 ≥ log n… simulate a minqueue of size b over the array, and store a mask of the elements that are currently active in the minqueue… if r−l+1 ≤ b, then query(l, r) = r − most_significant_set_bit(mask[r] & ((1<<(r−l+1))−1))." — [Codeforces 78931](https://codeforces.com/blog/entry/78931)
- In brunomont's version, bit d of mask[r] stands for position r−d. A position is "important" for a fixed r "if the value at that position is smaller than all the values to the right of it". The mask moves from r to r+1 like this: shift left by 1 and truncate to b bits, then repeatedly clear the least significant set bit while A[r+1] is smaller than the element that bit stands for, then OR in bit 0. Each position turns a bit on once, so construction is amortized O(n). — [Codeforces 78931](https://codeforces.com/blog/entry/78931)
- brunomont's code. Note that it does **not** reset the mask at block boundaries; the mask is a sliding window of the last b positions. Key lines:
  - `msb_index(x) = __builtin_clz(1) - __builtin_clz(x)`
  - `small(r, size=b) = r - msb_index(mask[r] & ((1<<size)-1))`
  - build: `curr_mask = (curr_mask<<1) & ((1<<b)-1); while (curr_mask > 0 && op(i, i - msb_index(lsb(curr_mask))) == i) curr_mask ^= lsb(curr_mask); curr_mask |= 1; mask[i] = curr_mask;`
  - sparse table over blocks: `t[i] = small(b*i+b-1)` for i < n/b, then the usual doubling into a linearized table `t[n/b*j + i]`
  - query: if r−l+1 ≤ b, return `v[small(r, r-l+1)]`; otherwise `ans = op(small(l+b-1), small(r))`, `x = l/b+1, y = r/b-1`, and if x ≤ y, `j = msb_index(y-x+1)` and `ans = op(ans, op(t[n/b*j+x], t[n/b*j+y-(1<<j)+1]))`
  - Here `op(x,y) = v[x] < v[y] ? x : y`. — [Codeforces 78931](https://codeforces.com/blog/entry/78931)
- brunomont's complexity argument: the sparse table over n/b block minima costs O((n/b)·log(n/b)) ⊆ O((n/b)·log n), which is O(n) for b ∈ Θ(log n). In the comments he adds that O(n) construction assumes the bit operations are O(1) and that the word size is at least log n. — [Codeforces 78931](https://codeforces.com/blog/entry/78931)
- A commenter noted "you used b=64 in the benchmark" (the posted code uses b=30 with `int` masks). brunomont confirmed it "can be done with long long, just set b to 64". He also said the method does not work for gcd, because it "requires the answer to always be a value in the array". — [Codeforces 78931 comments](https://codeforces.com/blog/entry/78931)
- A commenter called it "The Fischer-Heun Structure" (Stanford CS166 slides). brunomont replied that it is "not the same algorithm, although it uses the same idea to divide the array into blocks of size Θ(log n) and build a sparse table out of those blocks. 'Small' queries are handled in a different way." — [Codeforces 78931 comments](https://codeforces.com/blog/entry/78931)
- allvik66, "Simple rmq O(n)/O(1) method and its improved version that supports updates", Codeforces blog entry 92310, Jun 28, 2021. This is the **per-block reset** variant:
  - Blocks of bl = ⌈log2 n⌉. "In each block we will go from left to right and will maintain stack of minimums… the i-th bit will contain 1, if the i-th number in the block is now located in the stack of minimums."
  - In-block query: "the bit 1 that we need is the first bit in mask >> (l − start_l)", with start_l = ⌊l/bl⌋·bl.
  - The index of the first set bit comes from a DP lookup table over all 2^bl < 2n masks (no intrinsics).
  - Cross-block query: min(getmin(l, end_l), getmin(start_r, r), sparse table over blocks [block_l+1, block_r−1]).
  - The code pops while `a[stack.back()] >= a[j]`, then sets bit (j−i).
  - Claim: "For n = 10^6 my implementation of this algorithm works as fast as the non-recursive segment tree."
  - Also gives a multi-level version that supports point updates: f(n) = f(⌈n/⌈log2 n⌉⌉) + n preprocessing and g(n) = g(⌈n/⌈log2 n⌉⌉) + log2 n per update. — [Codeforces 92310](https://codeforces.com/blog/entry/92310)
- Related classical scheme on cp-algorithms (Farach-Colton & Bender, ±1 RMQ only): "divide the array A into blocks of size K = 0.5 log N… For each block we calculate the minimum element… We construct a sparse table from the array B". In-block queries go through precomputed block types for ±1 arrays. — [cp-algorithms: LCA Farach-Colton and Bender](https://cp-algorithms.com/graph/lca_farachcoltonbender.html)
- Bender & Farach-Colton (as summarized by Baumstark et al.): blocks of size s = ½ log n, a SparseTable over the n/s block minima, and a lookup table of size O(2^s·s²) for in-block queries. "This solution requires a linear number of words and the space is dominated by the SparseTable on the sequence of 2n/log n block minima." — [Baumstark et al., SEA 2017](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.SEA.2017.12)

**Measured performance of the bitmask RMQ (brunomont's benchmark)**
- Setup:
  - n = 10^6, 2·10^6, …, 10^7.
  - Build time, plus time for 10^6 queries.
  - Averaged across 10 runs, compiled with -O2.
  - Machine not stated ("on my machine").
  - Query distribution not stated in the post (UNVERIFIED; presumably uniform random l, r).
  - Benchmark used b = 64 (per the comment above). — [Codeforces 78931](https://codeforces.com/blog/entry/78931)
- Contenders:
  - RMQ1: this post, ⟨O(n), O(1)⟩.
  - RMQ2: catlak_profesor_mfb's O(n)/O(1) from [blog 15149](https://codeforces.com/blog/entry/15149).
  - Sparse Table: ⟨O(n log n), O(1)⟩.
  - Sqrt-tree: gepardo, [blog 57046](https://codeforces.com/blog/entry/57046), ⟨O(n log log n), O(1)⟩.
  - Iterative segment tree and recursive segment tree. — [Codeforces 78931](https://codeforces.com/blog/entry/78931)
- Build time (ms): — [Codeforces 78931](https://codeforces.com/blog/entry/78931)

  | n | RMQ1 | RMQ2 | Sparse Table | Sqrt Tree | Seg iterative | Seg recursive |
  |---|---|---|---|---|---|---|
  | 10^6 | 15 | 27 | 42 | 43 | 3 | 7 |
  | 10^7 | 140 | 382 | 515 | 484 | 39 | 77 |

- Time for 10^6 queries (ms; divide by 10^6 to get ns/query): — [Codeforces 78931](https://codeforces.com/blog/entry/78931)

  | n | RMQ1 | RMQ2 | Sparse Table | Sqrt Tree | Seg iterative | Seg recursive |
  |---|---|---|---|---|---|---|
  | 10^6 | 44 | 104 | 18 | 51 | 138 | 323 |
  | 10^7 | 113 | 240 | 28 | 107 | 303 | 658 |

- brunomont's conclusion: construction is "much faster than Sparse Table and Sqrt-tree, but a little slower than Segment Trees"; query time is "roughly the same as Sqrt-tree, losing only to Sparse Table". — [Codeforces 78931](https://codeforces.com/blog/entry/78931)
- A Farach-Colton–Bender implementation posted in the comments "performed so poorly": build about 3× the sparse table's, and queries slower than the iterative segment tree. brunomont left it out of the table. — [Codeforces 78931 comments](https://codeforces.com/blog/entry/78931)
- Why the sparse table query is fast: "four memory accesses (two to A and two to M), a comparison, and a log-calculation on integers which corresponds to counting leading zero bits". — [Baumstark et al., SEA 2017](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.SEA.2017.12)

**Closest academic relatives (not the same in-block method)**
- Kowalski & Grabowski's BbST ("Block-based Sparse Table") is a sparse table over block minima with blocks of k = 512. For in-block work it uses speculative reads plus a scan, not masks. Detail and numbers are in Q7. — [arXiv 1711.10385](https://arxiv.org/abs/1711.10385)
- Baumstark et al. use the Bender–Farach-Colton block idea recursively, with a sparse table at the base case after Λ levels. — [Baumstark et al.](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.SEA.2017.12)

### Inferences

**Synthesized reference algorithm** (w = 64, per-block reset, leftmost argmin; derived from 92310 + jcg + 78931)
- Preprocessing, 0-indexed, nb = ⌈n/64⌉:
  - For each block b with start s = 64b, set m = 0 (uint64). For each i in [s, min(s+64, n)):
    - `while m != 0: t = 63 - clz64(m); if A[s+t] > A[i]: m ^= 1ULL<<t else break`. The highest set bit is the top of the stack (the most recent position). The pop is strict, so equal earlier elements stay, which gives leftmost-min semantics.
    - `m |= 1ULL << (i-s); mask[i] = m`.
  - `blockMin[b] = s + ctz64(mask[last index of block])`.
  - Sparse table: `ST[0][b] = blockMin[b]`; `ST[k][b] = better(ST[k-1][b], ST[k-1][b + 2^(k-1)])`, where `better(x,y) = (A[x] < A[y] || (A[x]==A[y] && x<y)) ? x : y`.
- In-block query, l, r in the same block with start s: `return s + ctz64(mask[r] & (~0ULL << (l - s)))`. The shift is always in [0, 63], so there is no UB.
- Why it is correct: the set bits of mask[r] are exactly the positions p in the block with p ≤ r and A[p] ≤ A[k] for all k ∈ (p, r]. The leftmost such p ≥ l is the leftmost minimum of A[l..r].
- Cross-block query, bl < br:
  - c1 = inblock(l, end(bl)) and c2 = inblock(start(br), r).
  - If bl+1 ≤ br−1: k = 63 − clz64(br−bl−1), and c3 = better(ST[k][bl+1], ST[k][br−2^k]).
  - Return better(c1, c3, c2), so ties go to the smallest index.
- Variant choice:
  - In brunomont's sliding-window variant, `small(l+b-1)` and `small(r)` can overlap the sparse-table part (fine for idempotent min).
  - His code ties toward the second argument (`v[x] < v[y] ? x : y`) and says "we can answer any of them". To get the **leftmost** index across parts, use ≤ in the combine.
  - With b = 64, `(1ULL<<64)-1` is UB, so special-case size == 64 (use ~0ULL).
- Complexity: the build is n pushes and ≤ n pops (amortized O(n)) plus the sparse table's (n/64)·⌈log2(n/64)⌉ entries. Whether this is linear depends on the model:
  - With fixed w = 64, (n/64)·log2(n/64) ≤ n holds whenever log2(n/64) ≤ 64, i.e. for every n ≤ 2^70. In practice the sparse table never has more entries than the array.
  - Asymptotically it is Θ(n log n / w), so it is O(n) only under the word-RAM assumption w = Θ(log n).
  - A strictly linear variant replaces the top sparse table with another level of the same structure (allvik66's multi-level scheme) or uses w ≥ log n blocks.
- Space arithmetic (my calculation):
  - mask[] costs 64 bits/element with uint64 masks (32 with b = 32).
  - At n = 10^8 the sparse table has ≈ 1.5625·10^6 blocks × 21 levels ≈ 3.3·10^7 entries. With 32-bit indices that is ≈ 131 MB, ≈ 10.5 bits/element.
  - Compare the full sparse table: ≈ 317–405 bits/element in Kowalski & Grabowski's measurements (Q7).
  - The masks dominate. To shrink them, store masks only within blocks of 32 (uint32), or store block-minimum values next to the indices in the table (as BbST does with its V array) to avoid one indirection into A.
- Expected query cost:
  - In-block: 1 mask load + ctz + 1 load of A.
  - Cross-block: about 2 mask loads + 2 table loads + up to 4 loads of A. That is roughly twice the sparse table's 4 accesses.
  - This matches brunomont's measurements: about 4× slower queries than the full sparse table (113 vs 28 ns at n = 10^7) but about 3.7× faster build (140 vs 515 ms).
  - The gap should narrow or reverse once the full sparse table falls out of cache or RAM (n ≳ 10^8). This is an inference, not measured in the post.

### Gaps
- I found no peer-reviewed paper that states the "stack-of-minima bitmask per position + ctz/clz" in-block method. My understanding, from background knowledge and not verified here, is that Fischer & Heun's practical scheme (CPM 2006 / SICOMP 2011) uses block types from Cartesian-tree numbers and in-block lookup tables. brunomont says only that small queries are handled "in a different way". The CPM 2006 full text was closed-access (Semantic Scholar marks it CLOSED), so I could not check its §5 practical variant.
- tfg's original source is unknown (brunomont himself asked readers for one).
- The machine for brunomont's benchmark is not stated. The benchmark files are on a Google Drive link that I did not fetch.
- "brunomont" is confirmed as the author of 78931. The task's guess "entry around 78931" is confirmed.
- No cp-algorithms page dedicated to this bitmask method was found. cp-algorithms covers Sparse Table, Sqrt Tree and Farach-Colton–Bender.

---

## Q2. Ferrada & Navarro, "Improved Range Minimum Queries" (DCC 2016; JDA 43 (2017) 72–80)

### Takeaway
Ferrada and Navarro replace DFUDS with a BP (balanced parentheses) representation of the leftmost-path-mapped Cartesian tree. This gives a simpler formula (2 selects + 1 rank + 1 ±1-RMQ) at ≈2.1 bits/element. They measured 1–3 µs per query on random arrays of n = 10^4..10^10. That is 3–6× faster than SDSL and 2× faster than Succinct, and it was the state of the art until Baumstark et al. 2017.

### Cited Findings
- Bibliography:
  - Journal: Journal of Discrete Algorithms 43 (2017) 72–80, DOI 10.1016/j.jda.2016.09.002 — [Crossref record via DOI](https://doi.org/10.1016/j.jda.2016.09.002).
  - Conference version: DCC 2016, pp. 516–525, DOI 10.1109/DCC.2016.42 — [DOI](https://doi.org/10.1109/DCC.2016.42).
  - Preprint PDF — [Navarro's PDF](https://users.dcc.uchile.cl/~gnavarro/ps/jda16.pdf).
- Core formula on the BP of the general tree: rmq_A(i, j) = rank1(rmq_D(select1(i+1) − 1, select1(j+1))). The ±1-RMQ must return the **rightmost** minimum. The rightmost-path mapping variant is rmq_A(i,j) = rank0(rmq_D(select0(i), select0(j))). — [FN JDA preprint](https://users.dcc.uchile.cl/~gnavarro/ps/jda16.pdf); restated as Eqs. (2)/(3) in [Baumstark et al.](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.SEA.2017.12)
- ±1-RMQ is done with a simplified range min-max tree (rmM-tree). The implementation:
  - stores sampled excesses exc[i] = excess(E, b·i) for rank;
  - answers select from a sampled table plus a sequential scan (the conference version used binary search, "considerably slower");
  - skips the scan of the last partial block when its block minimum is not smaller than the current min;
  - uses byte-wise lookup tables that fit in cache.
  The ±1-RMQ is "not formally constant time, as it builds on rmM-trees". — [FN JDA preprint](https://users.dcc.uchile.cl/~gnavarro/ps/jda16.pdf)
- Headline: "our structure uses 2.1n bits of space and answers RMQs in 1–3 microseconds". SDSL and Succinct "use 2.6n to 2.8n bits". "Our implementation is also 3–6 times faster than that in SDSL and twice as fast as the implementation in Succinct. It is also 2–4 times faster than our own implementation of Fischer and Heun's RMQ". — [FN JDA preprint](https://users.dcc.uchile.cl/~gnavarro/ps/jda16.pdf)
- Setup:
  - Arrays of n = 10^4 to 10^10 with randomly chosen ranges of fixed length 10,000.
  - Block size b = 512 chosen "as a compromise".
  - Space is "always below 2.1 bits per element (bpe)" on random arrays.
  - Also run on pseudo-sorted arrays (A[i] random in [i−Δ, i+Δ] or [n−i−Δ, n−i+Δ]) with n = 10^6. — [FN JDA preprint](https://users.dcc.uchile.cl/~gnavarro/ps/jda16.pdf)
- Construction at n = 10^9 with 64-bit integer input: stack-based builds take 60–70 ns/element versus 110–130 ns/element for SDSL's O(n)-bit construction. Succinct is "the slowest at construction (around 230 nanoseconds)". — [FN JDA preprint](https://users.dcc.uchile.cl/~gnavarro/ps/jda16.pdf)
- The library README says the structure size is "between 2.02n to 2.3n bits (depend on the configuration for block size and sampling for select_1)". Code: github.com/hferrada/rmq. — [hferrada/rmq README](https://github.com/hferrada/rmq)
- Third-party measurements: Kowalski & Grabowski measured F&N's "BP" at 2.20n bits (n = 100M) and 2.21n bits (n = 1G), with a build time of 66.6 s at n = 1G. Baumstark et al. measured F&N'16 at 2.10 bits/element at n = 10^9 (random). — [Kowalski & Grabowski](https://arxiv.org/abs/1711.10385); [Baumstark et al.](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.SEA.2017.12)

### Inferences
- In µs-per-query terms, the succinct 2n-bit family is about 1–2 orders of magnitude slower per query than a plain sparse table (tens of ns). They win on space (about 2.1 vs 300–400 bits/element) and on very large n.

### Gaps
- The extracted JDA text did not state the CPU, compiler, or RAM used (UNVERIFIED machine).
- The exact per-n query times are only in figures (Fig. 5/6), which I could not read numerically.

---

## Q3. Baumstark, Gog, Heuer & Labeit, "Practical Range Minimum Queries Revisited" (SEA 2017)

### Takeaway
Baumstark et al. reengineer F&N's BP-based index in four ways: a depth-aware select, a single mapping plus input reversal, a small-range scan shortcut, and recursion (Λ = 2) terminated by a SparseTable instead of an rmM-tree. They report up to 3× faster queries at ≈2.16 bits/element, and fastest times in a suffix-tree traversal on Pizza&Chili LCP arrays (≈127–139 ns/query).

### Cited Findings
- Bibliography: SEA 2017, LIPIcs vol. 75, Article 12, pp. 12:1–12:16, DOI 10.4230/LIPIcs.SEA.2017.12. Code: https://github.com/kittobi1992/rmq-experiments. — [DROPS](https://drops.dagstuhl.de/entities/document/10.4230/LIPIcs.SEA.2017.12); [PDF](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf)
- Optimizations (quoted or paraphrased from §1 and §3):
  1. **Lemma 4:** select1(i, BP) = 2i − depth(v) − 1. The answer therefore lies in BP[2i − max_excess − 1 .. 2i − 1], and "for trees of logarithmic depth we can directly calculate the correct 64-bit word containing the answer without using any extra space".
  2. **Theorem 5:** build the leftmost mapping on the reversed array with rightmost tie-breaking, which simulates the rightmost mapping. Pick whichever Cartesian tree is shallower.
  3. For small ranges (j − i < log n), scan a constant number of words instead of doing the second select.
  4. Replace the rmM-tree with recursion on the block-minima excess array E and terminate with a SparseTable after Λ levels.
  - Block sizes tested: s ∈ {1024, 2048, 4096} ("2, 4, and 8 cache lines"), Λ ∈ {1, 2, 3}. Final choice: s = 1024, Λ = 2. — [Baumstark et al. PDF](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf)
- Machine: single core of a machine with four Intel Xeon E5-4640 (32 cores / 64 hyper-threads), 512 GiB RAM, GCC 4.8.4 with optimizations. — [Baumstark et al. PDF](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf)
- Inputs (following F&N):
  - random: values uniform in [1, n];
  - inc-δ: A[i] ∈ [i−δ, i+δ];
  - dec-δ: A[i] ∈ [n−i−δ, n−i+δ].
  - n = 10^x, with 10^4 random queries for each range size 10^1..10^(x−1).
  - Baselines: SDSL (sdsl-lite), Succinct (github.com/ot/succinct), F&N'16 (github.com/hferrada/rmq), all accessed 20.12.2016. — [Baumstark et al. PDF](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf)
- Space, Table 2 (bits/element, random input, Fig. 6 data): — [Baumstark et al. PDF](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf)

  | Implementation | n = 10^4 | 10^5 | 10^6 | 10^7 | 10^8 | 10^9 |
  |---|---|---|---|---|---|---|
  | Sdsl | 2.64 | 3.26 | 2.61 | 2.55 | 2.54 | 2.54 |
  | Succinct | 2.80 | 2.71 | 2.70 | 2.71 | 2.71 | 2.70 |
  | F&N'16 | 4.52 | 2.31 | 2.10 | 2.09 | 2.10 | 2.10 |
  | NewRMQ (s = 1024, Λ = 2) | 2.41 | 2.18 | 2.16 | 2.16 | 2.16 | 2.17 |

  Parameter sweep: s = 1024, Λ = 1 grows to 2.65 at 10^9; s = 4096, Λ = 3 reaches 2.13.
- Query-time results (Figures 4–9 are plots; the y-axis is µs per query, mostly 0–6 µs): "up to a factor of three" faster than previous solutions. In the per-operation breakdown, "most time is spent on select1 and access of E and I"; these "get therefore more expensive for larger inputs due to address translation". — [Baumstark et al. PDF](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf)
- The rmM-tree "is not necessarily the cause for many cache misses but for many cache references". Using SparseTable and the tailored select "reduced the number of cache references significantly" (Fig. 7, n = 10^9). — [Baumstark et al. PDF](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf)
- Real application, DFS traversal of a suffix tree using RMQ over the LCP array of Pizza&Chili texts:
  - Table 1 depths of C_L^L(A) vs C_R^L(reversed A): dblp 543 vs 54; dna 371 vs 120; english 664 vs 132; sources 765 vs 3232.
  - Ratio of avoided second-select calls: 88.32% (dblp), 91.41% (dna), 87.31% (english), 88.33% (sources). — [Baumstark et al. PDF](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf)
- Figure 10 bar labels (ns per query), read from the PDF text layer. The bar-to-implementation mapping is my reading of the label positions, in legend order Sdsl, Succinct, F&N'16, NewRMQ: — [Baumstark et al. PDF](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf)

  | Text | Sdsl | Succinct | F&N'16 | NewRMQ |
  |---|---|---|---|---|
  | dblp | 160 | 237 | 284 | 127 |
  | dna | 155 | 217 | 270 | 133 |
  | english | 154 | 221 | 259 | 136 |
  | sources | 165 | 235 | 278 | 139 |

  This is consistent with the text: F&N is the fastest on synthetic benchmarks, but "library implementations are still faster on real-world applications such as suffix tree traversal".
- Kowalski & Grabowski summarize Baumstark et al.'s as "the fastest implementation… around 1µs per query (timings vary depending on query parameters) on an single core of the Intel Xeon E5-4640 CPU". They label its two variants SDSL-BP (2.53–2.55n bits) and SDSL-REC (2.16n bits). — [Kowalski & Grabowski](https://arxiv.org/abs/1711.10385)

### Inferences
- The recursion-plus-sparse-table-at-the-base design is the succinct-world analogue of "sparse table over block minima". The engineering lesson matches the CP bitmask method: a small top-level sparse table is cheap and fast.

### Gaps
- The exact per-range-size µs values for synthetic inputs are only in plots. I cannot give exact numbers beyond the axes (0–6 µs) and the "up to 3×" claim.
- The Fig. 10 mapping is inferred from label positions in the text layer (mark as UNVERIFIED if precision matters).

---

## Q4. Fischer & Heun 2006/2007 practical experiments; Ilie, Navarro & Tinta 2010 (LCE via RMQ vs direct comparison)

### Takeaway
Fischer & Heun's CPM 2006 paper claims its direct O(n)/O(1) RMQ is "almost twice as fast in practice" as previous approaches. It also says asymptotically slower variants do even better at common sizes. Its full text, and therefore its numbers, was not accessible. Ilie, Navarro & Tinta (2010) showed on 2000s hardware that, for LCE, constant-time RMQ over LCP (≈1.3–1.6 µs/pair) loses to naive direct character comparison (≈0.07–0.31 µs/pair). That is a cautionary data point: RMQ constant factors matter.

### Cited Findings
- Fischer & Heun, "Theoretical and Practical Improvements on the RMQ-Problem, with Applications to LCA and LCE", CPM 2006, LNCS (vol. 4009 per Springer listing), pp. 36–48, DOI 10.1007/11780441_5. — [DOI](https://doi.org/10.1007/11780441_5)
- Its abstract (via search-result summary of the Springer page, not fetched directly) says "the new method is almost twice as fast in practice as previous approaches, and asymptotically slower variants of the constant-time algorithms perform even better at today's common problem sizes". — [Springer/Unpaywall via search](https://unpaywall.org/10.1007%2F11780441_5)
- Fischer & Heun, "A New Succinct Representation of RMQ-Information and Improvements in the Enhanced Suffix Array", ESCAPE 2007, LNCS pp. 459–470, DOI 10.1007/978-3-540-74450-4_41. Its experimental numbers were not retrieved. — [DOI](https://doi.org/10.1007/978-3-540-74450-4_41)
- Ilie, Navarro & Tinta, "The Longest Common Extension Problem Revisited and Applications to Approximate String Searching", J. Discrete Algorithms 8(4) (2010) 418–428, DOI 10.1016/j.jda.2010.08.004. — [Navarro abstract page](https://users.dcc.uchile.cl/~gnavarro/abstracts/jda10.html); [PDF](https://users.dcc.uchile.cl/~gnavarro/ps/jda10.pdf)
- Setup:
  - Sun Fire V440, one UltraSPARC IIIi at 1593 MHz, 1 MB L2, 4 GB RAM, SunOS 5.10, gcc 3.4.3 -O3 -fomit-frame-pointer.
  - 10^6 random (i, j) pairs, average of 3 runs.
  - Preprocessing time excluded.
  - RMQ_const and RMQ_log are Fischer & Heun's [CPM 2006] constant-time and O(log n) RMQ-based LCE. — [Ilie et al. PDF](https://users.dcc.uchile.cl/~gnavarro/ps/jda10.pdf)
- Table 1 (µs per LCE pair; columns RMQ_const / RMQ_log / DirectComp): — [Ilie et al. PDF](https://users.dcc.uchile.cl/~gnavarro/ps/jda10.pdf)
  - book1: 1.34 / 1.11 / 0.07
  - E.coli: 1.43 / 1.12 / 0.21
  - chr22.dna: 1.46 / 1.17 / 0.20
  - etext99: 1.53 / 1.20 / 0.21
  - pitches: 1.63 / 1.28 / 0.20
  - rand(100 MB, σ = 2): 1.51 / 1.23 / 0.29
  - For files over 160 MB (proteins, DNA 385 MB, English 2108 MB), "—" means the RMQ methods ran out of memory, while DirectComp took 0.20–0.22.
- Ilie et al. on the results: "DirectComp is roughly 6 times faster" overall and "roughly 5 times faster than RMQ_log, the previous fastest". Their comparison of RMQ_const vs RMQ_log "gives results similar to [Fischer & Heun]" (i.e., the O(log) variant is faster in practice). — [Ilie et al. PDF](https://users.dcc.uchile.cl/~gnavarro/ps/jda10.pdf)
- Memory (Table 2, 4-byte ints): RMQ-based needs 24n+ bytes, DirectMin needs 8n (SA⁻¹ + LCP), and DirectComp needs n (text only). — [Ilie et al. PDF](https://users.dcc.uchile.cl/~gnavarro/ps/jda10.pdf)
- DirectMin is a linear scan of LCP[SA⁻¹[i]+1..SA⁻¹[j]]. It is best for pairs that are close in the suffix array. Plugging DirectComp into Landau–Vishkin gives "13 to 20 times faster than the original". — [Ilie et al. PDF](https://users.dcc.uchile.cl/~gnavarro/ps/jda10.pdf)

### Inferences
- For short typical ranges, a scan (DirectMin) or a cache-local structure beats a constant-time but cache-unfriendly RMQ. This is the same reason the bitmask method's in-block path (1 word plus ctz) is attractive.

### Gaps
- Fischer & Heun 2006/2007 machine, n, and timing tables: full texts are closed-access, so these are UNVERIFIED.

---

## Q5. Dima & Ceterchi, "Efficient Range Minimum Queries using Binary Indexed Trees" (Olympiads in Informatics 9, 2015, 39–44)

### Takeaway
Dima and Ceterchi use two Fenwick arrays, one storing the min over [i−lowbit(i)+1, i] and one over [i, i+lowbit(i)−1]. A query climbs from both ends toward a common node, which gives O(log N) query and O(log N) update. Table 1 shows that it beats a segment tree: 10M queries in 0.551 s vs 2.397 s. The abstract claims it outperforms the Sparse Table, but the paper reports **no** Sparse Table measurement.

### Cited Findings
- Bibliography: Olympiads in Informatics, 2015, Vol. 9, 39–44, DOI 10.15388/ioi.2015.04. Authors: Mircea Dima (Hickery), Rodica Ceterchi (Univ. Bucharest). — [PDF](https://ioinformatics.org/journal/v9_2015_39_44.pdf)
- Structures:
  - BIT1[i] = min A[i − 2^LSB(i) + 1 .. i], in the left binomial tree with parent(i) = i + 2^LSB(i).
  - BIT2[i] = min A[i .. i + 2^LSB(i) − 1], in the right binomial tree with parent(i) = i − 2^LSB(i).
  - Here 2^LSB(i) = lowbit(i), e.g. LSB(216) = 8 in their notation.
  - Both arrays are built in O(N) bottom-up. — [PDF](https://ioinformatics.org/journal/v9_2015_39_44.pdf)
- Query(i, j):
  1. From i, climb tree 1 (x ← x + lowbit(x)) "as long as the node index is less than or equal to j", and take BIT2[x] for the visited nodes.
  2. From j, climb tree 2 (y ← y − lowbit(y)), and take BIT1[y].
  3. Both climbs stop at the same node k = c1…cp 1 0…0, the common binary prefix of i and j followed by 1. Add A[k].
  - Example [5..13] splits into A[5], A[6..7], A[8], A[9..12], A[13].
  - Time O(log N) "where N is the size of the subarray". — [PDF](https://ioinformatics.org/journal/v9_2015_39_44.pdf)
- Update(p, v): climb the trees. For a node whose interval minimum was at p, combine the min of [x, p−1] and [p+1, y], computed on the fly by climbing from p+1 in tree 1 and p−1 in tree 2. "Since we are climbing each tree three times… the amortized time complexity of the Update operation is O(log N)". A naive version would be O(log² N). — [PDF](https://ioinformatics.org/journal/v9_2015_39_44.pdf)
- Experimental setup: C++, 3.5 GHz Intel Xeon-Haswell server, 8 GB RAM, Ubuntu 14, gcc 4.8. Initial array of 100K random integers; 10M random updates and 10M random queries. Times in seconds (Table 1): — [PDF](https://ioinformatics.org/journal/v9_2015_39_44.pdf)

  | Operation | Segment (Range) Tree | Binary Indexed Tree |
  |---|---|---|
  | Build 100K array | 0.0009 s | 0.0006 s |
  | 10M Updates | 1.274 s | 0.672 s |
  | 10M Queries | 2.397 s | 0.551 s |

  The paper summarizes this as "47% reduced time for updates and 77% reduced time on queries". The conclusion claims "2–4 times faster in practice".
- The abstract claims it is "outperforming in speed similar data structures like Segment/Range Trees or the Sparse Table Algorithm". However, Section 2.5 and Table 1 only compare against a segment tree. — [PDF](https://ioinformatics.org/journal/v9_2015_39_44.pdf)

### Inferences
- Derived per-operation costs: ≈55 ns/query (BIT) vs ≈240 ns/query (segment tree); ≈67 vs ≈127 ns/update. At n = 10^5 everything is L2-resident, so these numbers say little about large-n behaviour.
- The sparse-table claim in the abstract is unsupported by the paper's own data. Present it as such.

### Gaps
- The segment-tree implementation details (recursive or iterative) are not given. The "amortized" wording for update is not formally justified in the text.

---

## Q6. Alzamel, Charalampopoulos, Iliopoulos & Pissis, "How to answer a small batch of RMQs or LCA queries in practice" (IWOCA 2017)

### Takeaway
For q = o(n) offline queries, Alzamel et al. first contract A to O(q) entries in n + O(q) time. They then run a sparse table "in place" bucketed by query length (ST-RMQ_CON, n + O(q log q) time, O(q) space), which was their fastest in practice. Kowalski & Grabowski later beat it by "several times" with block-based sparse tables.

### Cited Findings
- Bibliography: IWOCA 2017, published in LNCS 10765 (2018), pp. 343–355, DOI 10.1007/978-3-319-78825-8_28. arXiv 1705.04589. Code: https://github.com/solonas13/rmqo (GPL). — [Crossref DOI](https://doi.org/10.1007/978-3-319-78825-8_28); [arXiv](https://arxiv.org/abs/1705.04589)
- Contraction:
  - If no query starts or ends at i or i+1, then max(A[i], A[i+1]) can never be an answer.
  - Mark the query endpoints and replace each maximal unmarked block by its minimum, which gives A_Q of size ≤ 4q−1, plus a map f from A_Q positions to A positions.
  - Marking uses values > µ = max A (bit-stealing) together with arrays Z0/Z1 of size 2q.
  - n + O(q) time, O(q) space.
  - Kowalski & Grabowski note that the space is "O(q) words plus O(n) bits" in theory because of the bit-stealing. — [arXiv](https://arxiv.org/abs/1705.04589); [Kowalski & Grabowski](https://arxiv.org/abs/1711.10385)
- ST-RMQ_CON:
  1. Put each query in bucket B_k with k = ⌊log(j'−i')⌋.
  2. Initialize D[m] = (A_Q[m], m).
  3. For k = 0..t−1: answer every query in B_k as min(D[i'], D[j'−2^k+1]), then update D[m] = min(D[m], D[m+2^k]).
  - D is overwritten in place, so space is O(q) and time is n + O(q log q).
  - Other variants: OFF-RMQ_CON uses a Cartesian tree plus Gabow–Tarjan offline LCA, n + O(q). ON-RMQ_CON uses Fischer–Heun via sdsl-lite, n + O(q). — [arXiv](https://arxiv.org/abs/1705.04589)
- Setup: one core of an Intel Core i5-4690 at 3.50 GHz, 16 GB RAM, g++ 5.4.0 -O3. Random uniform arrays of n = 10^6 and 10^8 (Exp. I) and n = 10^9 (Exp. II), with q from √n to 128√n, doubling. — [arXiv](https://arxiv.org/abs/1705.04589)
- Findings:
  - Contraction "improves the performance for all implementations substantially" (Fig. 1).
  - At n = 10^9, "ST-RMQ_CON becomes two times faster than ON-RMQ_CON as q grows". ON-RMQ without contraction could not run at n = 10^9 "due to insufficient amount of main memory".
  - For LCA (n = 10^6, Cartesian tree input), ST-LCA_CON is "more than two orders of magnitude faster" than OFF-LCA.
  - Conclusion: ST-RMQ_CON and ST-LCA_CON "seem to be the best way to answer in practice a small batch". — [arXiv](https://arxiv.org/abs/1705.04589)
- Follow-up (Kowalski & Grabowski) on a 4-core Intel i7-4790 at 3.6 GHz with n = 1G:
  - BbST_CON sorts the 2q endpoints with radix sort (kxsort), contracts to ≤ 2q−1 entries, and uses a block sparse table with k = 512.
  - "our algorithm is several times faster than its predecessor… sometimes (BbST, relatively large q) reaching an order of magnitude gap".
  - For small q, BbST_CON beats BbST without contraction; for large q, plain BbST wins.
  - The parallel version reached only "around factor 2 or slightly more" on 4 cores / 8 threads. — [Kowalski & Grabowski arXiv 1711.10385](https://arxiv.org/abs/1711.10385)
- Kowalski & Grabowski Table 3 (n = 100M): the cumulative share of the sort stage is 1.4% at q = 10K and 65.8% at q = 10.24M. The share up to and including contraction is 88–99.6% across settings. Sorting and contraction dominate, while query answering is minor. — [arXiv 1711.10385](https://arxiv.org/abs/1711.10385)

### Inferences
- When q ≪ n, the dominant cost is one pass over A, so any online O(n)-build structure (including the bitmask RMQ with ≈14 ns/element build in brunomont's test) competes mainly on build constant. The q ≈ n crossover was not measured in the sources I found.

### Gaps
- Absolute times (seconds) appear only in plots in Alzamel et al. (y-axes up to ~8 s for n = 10^8 and ~16 s for n = 10^9). I did not record exact values.

---

## Q7. Cache-aware / block-based, SIMD, GPU (RTXRMQ, GPU-RMQ) and parallel RMQ

### Takeaway
On CPUs, the block-based sparse table (BbST, k = 512) by Kowalski & Grabowski builds 1G elements in 0.6 s. For comparison, a full sparse table takes 436.6 s and SDSL-SCT 23.9 s. BbST is faster than succinct indexes on wide ranges, while a full sparse table remains "unbeatable" for narrow queries (≲ a few thousand). On GPUs:
- RTXRMQ (FGCS 2024) maps RMQ to ray–triangle intersection on RT cores. It is best for small ranges: up to 5× vs 192-core HRMQ and 2.3× vs GPU-LCA. It needs 4.5 GB at n = 2^26.
- GPU-RMQ (arXiv, Apr 2026) uses a hierarchical summary plus parallel scan, with optional RT cores. It claims up to ~8× vs LCA, ~17× vs RTXRMQ, and ~4800× vs HRMQ throughput.

### Cited Findings

**Kowalski & Grabowski, "Faster range minimum queries"**
- Bibliography: Software: Practice and Experience 48 (2018) 2043–2060, DOI 10.1002/spe.2597. arXiv 1711.10385. Preliminary version: "Faster batched range minimum queries", PSC 2017. Code: https://github.com/kowallus/BbST. — [Crossref DOI](https://doi.org/10.1002/spe.2597); [arXiv](https://arxiv.org/abs/1711.10385)
- BbST algorithm:
  - Split A into blocks of k. For each block, store the positions of the minima over spans of 2^(j−1) blocks starting at it (O((n/k) log(n/k)) words), plus the block-minimum values V_i.
  - Query: take m′ = min over the smallest span of blocks covering [ℓ, r]. If ℓ ≤ m′ ≤ r, return it. Otherwise take the min over the blocks fully inside the query and scan ≤ O(k) cells.
  - Average time O(k²/u) for average width u, i.e. O(1) for u = Ω(k²). The worst case is O(k), and BbST needs access to A.
  - BbST2 adds a second level of k2-sized blocks. Compact variants (cBbST) store byte-sized offsets Δ.
  - Hybrids cBbST2-SDSL-REC fall back to Baumstark et al.'s structure and do not need A. — [arXiv](https://arxiv.org/abs/1711.10385)
- Setup: C++ compiled with 32-bit gcc 7.2.0 -O3 -mavx2; 4-core Intel i7-4790 at 3.6 GHz, 32 GB DDR3-1600, Windows 10. A holds random 32-bit unsigned ints. ℓ is uniform and r−ℓ ∈ [0, width limit]. 1M queries per width; medians of 7 runs with cache flushes. — [arXiv](https://arxiv.org/abs/1711.10385)
- Table 1 (n = 1G, single-threaded): — [arXiv](https://arxiv.org/abs/1711.10385)

  | Variant | Build time (s) | Bits/element |
  |---|---|---|
  | SDSL-SADA | 212.5 | 5.85 |
  | SDSL-SCT | 23.9 | 2.54 |
  | BP (F&N) | 66.6 | 2.21 |
  | SDSL-BP | 26.0 | 2.55 |
  | SDSL-REC | 62.6 | 2.16 |
  | ST (full sparse table) | 436.6 | 404.94 |
  | BbST, k = 512 | 0.6 | 34.63 |
  | BbST2, k1 = 512, k2 = 64 | 2.7 | 34.75 |
  | BbST2, k1 = 4096, k2 = 256 | 2.8 | 32.31 |
  | cBbST-SDSL-REC, k = 512 | 66.0 | 2.82 |
  | cBbST2-SDSL-REC (512, 64) | 67.6 | 3.07 |
  | cBbST2-SDSL-REC (16384, 256) | 67.6 | 2.24 |

  BbST bit counts include 32 bits/element for A. The sparse-table part alone is 2.63 bits/element for k = 512 and 0.28 for k1 = 4096 (Table 2).
- Full sparse table space was 317.45n bits at n = 100M and 404.94n bits at n = 1G. The ST "is unbeatable for relatively narrow queries (of width up to a few thousands), yet the required space is around 320–400n bits". — [arXiv](https://arxiv.org/abs/1711.10385)
- Query results:
  - "BbST2 is, roughly speaking, about twice faster than SDSL-REC with range widths up to a few thousands… yet grows to an order of magnitude for wide queries".
  - BbST is "about 40 times faster" to build than SDSL-SCT. "In the construction time for SDSL-SCT over 1G elements we can build BbST and answer from about 100M to 400M queries."
  - The hybrid cBbST2-SDSL-REC (16384, 256) at 2.24n bits is "defeated in speed (by about 10%) only for the narrowest interval" vs SDSL-REC, and is more than 10× faster on wide intervals. — [arXiv](https://arxiv.org/abs/1711.10385)

**RTXRMQ**
- Bibliography: Meneses, Navarro, Ferrada & Quezada (Universidad Austral de Chile), "Accelerating range minimum queries with ray tracing cores", Future Generation Computer Systems 157 (Aug 2024) 98–111, DOI 10.1016/j.future.2024.03.040. arXiv 2306.03282. Code: github.com/temporal-hpc/rtxrmq. — [Crossref DOI](https://doi.org/10.1016/j.future.2024.03.040); [arXiv](https://arxiv.org/abs/2306.03282)
- Idea: each element becomes a triangle placed by value and shaped by position. A ray launched from a point given by (l, r) has its closest hit at the RMQ answer. A block-matrix extension handles n > 2^24: the query is split into in-block parts plus a query over the block-minima array A′. Floating-point precision limits required nb < 2^24 and bs < 2^18. — [arXiv](https://arxiv.org/abs/2306.03282)
- Setup:
  - GPU: NVIDIA RTX 6000 Ada (AD102, 142 SMs, 142 3rd-gen RT cores, 48 GB, 960 GB/s, 300 W TDP), CUDA 12.1, Ubuntu 22.04.
  - CPU baseline HRMQ: Ferrada–Navarro's structure parallelized over queries with OpenMP, run on 2× AMD EPYC 9654 (192 cores) with 384 GB DDR5.
  - GPU baseline LCA: Polak et al., IPDPS 2021.
  - Batch of q = 2^26 RMQs; input is uniform random floats.
  - Range distributions:
    - Large: uniform in [1, n], mean ≈ n/2.
    - Medium: LogNormal(µ = log(n^0.6), σ = 0.3), mean ≈ 2^15 at n = 2^26.
    - Small: LogNormal(µ = log(n^0.3), σ = 0.3), mean ≈ 2^8 at n = 2^26.
  - Each value is the average of 16 realizations × 32 repeats. — [arXiv](https://arxiv.org/abs/2306.03282)
- Results:
  - Large ranges: RTXRMQ ≈ 5 ns/RMQ, 2.5× faster than HRMQ@192 cores; LCA reaches up to 12.5× over HRMQ.
  - Overall speedups over HRMQ: 2.5×, 4× and 5× for large, medium and small ranges.
  - Against LCA: up to 2.3× faster on small ranges, slower on large and medium ranges.
  - The brute-force "Exhaustive" GPU scan was fastest around n ~ 2^15. — [arXiv](https://arxiv.org/abs/2306.03282)
- Memory (Table 2, MB): — [arXiv](https://arxiv.org/abs/2306.03282)

  | n | RTXRMQ default | RTXRMQ compressed | LCA | HRMQ |
  |---|---|---|---|---|
  | 2^20 | 71.63 | 56.28 | 6.93 | 0.30 |
  | 2^26 | 4512.15 | 3601.46 | 170.52 | 20.12 |

  Power: HRMQ draws up to 600 W, LCA 200–240 W, and RTXRMQ ≈ the 300 W TDP.

**GPU-RMQ (newest found, 2026)**
- Bibliography: Kreis, Henneberg, Henkys, Schuhknecht & Schmidt (JGU Mainz / Aperio Space), "GPU-RMQ: Accelerating Range Minimum Queries on Modern GPUs", arXiv 2604.01811 (cs.DB), 2 Apr 2026. Code: github.com/lakreis/GPU-RMQ. — [arXiv](https://arxiv.org/abs/2604.01811)
- Design: a hierarchy of range-minimum summaries built in parallel. Queries scan only the relevant portions with an optimized massively parallel scan, and the design can use RT cores and CUDA cores at different levels. — [arXiv](https://arxiv.org/abs/2604.01811)
- Setup: NVIDIA GeForce RTX 4090 (24 GB), CUDA 12.9.1, OptiX 8. CPU comparisons on an AMD Ryzen Threadripper 3990X (64 cores / 128 threads). Range distributions are the same as RTXRMQ's, plus "mixed". — [arXiv](https://arxiv.org/abs/2604.01811)
- Claims:
  - Throughput up to ~8× LCA, ~17× RTXRMQ and ~4800× HRMQ.
  - Construction up to ~100× faster than LCA, ~50× faster than RTXRMQ and ~2400× faster than HRMQ.
  - Memory up to ~4× smaller than LCA and ~10× smaller than RTXRMQ.
  - Handles up to 2^33 elements (64 GB), while RTXRMQ and LCA run out of memory at 2^28 and 2^29 elements on an RTX 4090.
  - Minimap2's chaining (which relies on RMQ) "accounts for up to 35% of the tool's total computational runtime". — [arXiv](https://arxiv.org/abs/2604.01811)

**Theory note**
- Bille et al., "Dynamic Range Minimum Queries on the Ultra-Wide Word RAM", arXiv 2411.16281; a Springer LNCS chapter exists at 10.1007/978-3-031-82670-2_10 (venue name not verified). This is a theoretical, block-based dynamic RMQ, not an engineering benchmark. — [arXiv](https://arxiv.org/abs/2411.16281)

### Inferences
- The BbST "speculative" query is an alternative to masks for the in-block part: if the covering-span minimum falls inside [ℓ, r], no in-block work is needed. Combining BbST-style speculation with mask-based fringe resolution would give O(1) worst case at small extra cost. This is my synthesis and is not benchmarked in any source.
- GPU results are batch-throughput numbers (ns/RMQ amortized over 2^26 queries), not latency. They are not directly comparable to the single-query ns/op numbers from CPU papers.

### Gaps
- I found no published paper on a "cache-friendly / Eytzinger / B-tree layout sparse table" or SIMD-vectorized RMQ with concrete numbers. Searches did not surface one (UNVERIFIED that none exists).
- GPU-RMQ is a preprint; its peer-reviewed venue was not found.
- Sqrt-tree performance appears only in brunomont's CP benchmark (Q1).

---

## Q8. What production / competitive-programming libraries actually implement

### Takeaway
Succinct-data-structure libraries (SDSL-lite) ship 2n–4n-bit Cartesian-tree/BP RMQs plus a compressed sparse table. CP libraries ship either a plain sparse table (KACTL) or no RMQ at all (AtCoder Library, which offers only segment trees and Fenwick trees). None of the libraries checked ships the bitmask O(n)/O(1) method.

### Cited Findings
- SDSL-lite `rmq_succinct_sct<t_min, t_bp_support = bp_support_sada<256,32,rank_support_v5<>>>`: "BPS-SCT" (balanced parentheses of the super-Cartesian tree). O(1) query "if the balanced parentheses support structure supports constant time operations"; space "2n+o(n) bits". — [rmq_succinct_sct.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/rmq_succinct_sct.hpp)
- SDSL-lite `rmq_succinct_sada`: BP-DFS of the extended Cartesian tree with rank/select support for the bit pattern "10" (`rank_support_v<10,2>`, `select_support_mcl<10,2>`). O(1) query, "4n+o(n) bits" space. Reference noted as "TODO: Kunihiko Sadakane". — [rmq_succinct_sada.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/rmq_succinct_sada.hpp)
- Measured: SDSL-SADA 5.85 bits/element with a 212.5 s build, and SDSL-SCT 2.54 bits/element with a 23.9 s build, at n = 1G. — [Kowalski & Grabowski](https://arxiv.org/abs/1711.10385)
- SDSL-lite `rmq_support_sparse_table<t_rac, t_min>`: reference Bender & Farach-Colton, LATIN 2000. O(1) query, space "O(n log² n) bits… We used bit compression to get a good result in practice". It keeps a pointer to the supported container, so it needs the original array. — [rmq_support_sparse_table.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/rmq_support_sparse_table.hpp)
- KACTL `RMQ.h` (authors Johan Sannemo and pajenegod, 2015-02-06, "Source: Folklore"): a plain sparse table `vector<vector<T>> jmp`. It returns min **values** (not indices) over the half-open range [a, b), with `dep = 31 - __builtin_clz(b - a)`. Time O(|V| log |V| + Q). — [KACTL RMQ.h](https://github.com/kth-competitive-programming/kactl/blob/main/content/data-structures/RMQ.h)
- AtCoder Library's `atcoder/` directory contains convolution, dsu, fenwicktree, lazysegtree, math, maxflow, mincostflow, modint, scc, segtree, string, twosat. There is no sparse table or RMQ module, so RMQ is done with `segtree`. — [ac-library/atcoder (GitHub API listing)](https://github.com/atcoder/ac-library/tree/master/atcoder)
- Research codebases with RMQ: hferrada/rmq (F&N BP, 2.02–2.3n bits), kittobi1992/rmq-experiments (Baumstark et al.), kowallus/BbST, solonas13/rmqo (offline batch), temporal-hpc/rtxrmq, lakreis/GPU-RMQ. — [hferrada/rmq](https://github.com/hferrada/rmq); [Baumstark et al. footnote 5](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf); [BbST](https://arxiv.org/abs/1711.10385); [rmqo](https://arxiv.org/abs/1705.04589); [RTXRMQ](https://arxiv.org/abs/2306.03282); [GPU-RMQ](https://arxiv.org/abs/2604.01811)
- Succinct (Grossi & Ottaviano, github.com/ot/succinct) uses 2.70–2.71 bits/element (Baumstark et al. Table 2). It "did not build on the largest arrays" in F&N's tests. — [Baumstark et al.](https://drops.dagstuhl.de/opus/volltexte/2017/7615/pdf/LIPIcs-SEA-2017-12.pdf); [FN JDA preprint](https://users.dcc.uchile.cl/~gnavarro/ps/jda16.pdf)

### Inferences
- For a seminar comparison baseline set, the natural "library" contenders are KACTL-style sparse table, ACL segtree, and SDSL `rmq_succinct_sct`. Measured SDSL-SCT numbers to compare against: 2.54 bits/element and 23.9 s build at n = 1G on an i7-4790.

### Gaps
- Not researched or verified: Boost (I am not aware of a Boost RMQ container; UNVERIFIED), Rust crates (e.g., any "rmq" or "sparse table" crate on crates.io), Yosupo Library Checker "Static RMQ" leaderboards, and other CP libraries (e.g., Nyaan, ei1333).
- Which SDSL RMQ is the default in `rmq_support.hpp` was not checked.

---

## Q9. Disjoint Sparse Table and Sqrt Tree

### Takeaway
Both answer O(1) queries for any **associative** operation (non-idempotent too, e.g. sum, product, matrix multiplication), unlike the standard overlapping sparse table, which requires idempotence.
- Disjoint Sparse Table: O(n log n) build and space. It picks its level from the highest differing bit of l and r.
- Sqrt Tree: O(n log log n) build and memory, O(1) query, and it supports point and segment updates.

### Cited Findings
- Standard sparse table: O(1) min via two overlapping power-of-two ranges, which works only for idempotent functions. "it is not possible to answer range sum queries using this approach. There are similar data structures that can handle any type of associative functions and answer range queries in O(1). One of them is called Disjoint Sparse Table. Another one would be the Sqrt Tree." (page last updated Sep 26, 2025). — [cp-algorithms Sparse Table](https://cp-algorithms.com/data_structures/sparse-table.html)
- Sqrt Tree, for any associative operation (gcd, min, max, +, and, or, xor): "can process such queries in O(1) time with O(n·log log n) preprocessing time and O(n·log log n) memory".
  - It is built from √n blocks with prefixOp, suffixOp and `between[i][j]`, recursively.
  - It supports single-element updates and updates on a segment.
  - Original Codeforces tutorial by gepardo (blog 57046). — [cp-algorithms Sqrt Tree](https://cp-algorithms.com/data_structures/sqrt-tree.html); [Codeforces 57046 (linked from 78931)](https://codeforces.com/blog/entry/57046)
- Disjoint Sparse Table, from search-result summaries (pages not fetched in full):
  - ramchandra's Codeforces tutorial (blog 79108) describes it as handling any monoid (associative operation with identity) in O(1) per query with O(n log n) construction time and space.
  - The level is found from the highest bit where l and r differ (one hardware instruction), and then two precomputed entries are combined.
  - A CodeChef tutorial notes the array must be immutable and that a sparse table often suffices. — [Codeforces 79108](https://codeforces.com/blog/entry/79108); [CodeChef discuss tutorial](https://discuss.codechef.com/t/tutorial-disjoint-sparse-table/17404)
- Measured Sqrt-tree in brunomont's benchmark: build 43 ms (n = 10^6) to 484 ms (n = 10^7), and 51 to 107 ns/query. That is about the same query speed as the O(n)/O(1) bitmask RMQ, with about 3.5× slower build. — [Codeforces 78931](https://codeforces.com/blog/entry/78931)
- The bitmask RMQ itself does **not** generalize to gcd or other non-selection operations: it "requires the answer to always be a value in the array". — [Codeforces 78931 comments](https://codeforces.com/blog/entry/78931)

### Inferences
- Disjoint Sparse Table query, standard formulation (not quoted from a fetched page):
  - If l == r, return a[l].
  - Otherwise k = 63 − clz(l xor r), and the answer is `left[k][l] ∘ right[k][r]`.
  - left[k][i] is the suffix aggregate from i to the middle of its level-k segment, and right[k][i] is the prefix aggregate from the middle+1 to i.
  - This needs n padded to a power of two. Treat it as an implementation sketch to verify against blog 79108.

### Gaps
- I did not find a cp-algorithms page dedicated to the Disjoint Sparse Table (the guessed URL returned 404). Its original inventor/source and any academic paper on it are unknown. Common attribution in CP is folklore (UNVERIFIED).
- No published benchmarks of the Disjoint Sparse Table vs others were found.
