# Extensions and Generalizations of RMQ (beyond static 1D): 2D, dynamic, offline, sliding window, semigroup/tree, parallel, compressed

*How citations were checked (2026-10-31):* the DBLP API returned HTTP 429 (rate-limited) for the whole session, so **no citation was checked on DBLP**. Instead, every reference marked **[DOI✓]** was checked against its Crossref DOI record (authors, title, venue, year, pages). Abstracts and bounds come from OpenAlex/Semantic Scholar abstracts, arXiv, or the authors' own PDFs, as linked. Anything not confirmed this way is marked **UNVERIFIED**. Throughout, LNCS volume numbers and journal issue numbers are given from standard knowledge and are **UNVERIFIED** unless they appear in a quoted reference list (e.g., Algorithmica 63(4), 68(3), SICOMP 35(4), 40(2)). DOI, venue, year and pages are the verified fields.
Notation: N = mn, m ≤ n for 2D. "Indexing" = the input A can be read at query time, and space is counted as *extra* bits. "Encoding" = A cannot be accessed, so the space is everything.

---

## Q1. 2D RMQ on an m×n matrix: bounds, tradeoffs, lower bounds, naive 2D sparse table

### Takeaway

In the **indexing** model, 2D RMQ is essentially solved: O(N) preprocessing, O(1) query, O(N) extra bits, with a matching Ω(c)-query lower bound for N/c extra bits. In the **encoding** model it is *not* like 1D. There is no 2D Cartesian tree, and the space needed is Θ(N log m) bits, not O(N). Until ESA 2026, an optimal-space encoding could not answer queries efficiently. Gawrychowski–Górkiewicz–Satti (ESA 2026) give the first near-optimal encoding with fast queries.

### Cited Findings

#### Problem statement

- Preprocess a static m×n array A (N = m·n entries from a total order). A query rectangle q = [i1..i2]×[j1..j2] asks for argmin over (i,j)∈q of A[i,j]. W.l.o.g. m ≤ n and entries are distinct (ties are broken by index) — [Brodal, Davoodi, Rao ESA'10 PDF](https://cs.au.dk/~gerth/papers/esa10.pdf)
- Brodal–Davoodi–Rao separate two models. In the indexing model, the query may read A plus an index. In the encoding model, the query sees only the data structure — [esa10.pdf](https://cs.au.dk/~gerth/papers/esa10.pdf)

#### Chronological bounds table (from Brodal–Davoodi–Rao Table 2 + later papers)

| Result | Query | Space (bits) | Preprocessing | Model |
|---|---|---|---|---|
| Store all answers | O(1), no probe of A | O(N² log N) | — | encoding |
| Gabow–Bentley–Tarjan 1984 (range trees) | O(log N) | O(N log² N) + \|A\| | O(N log N) | indexing; d-dim: O(log^{d−1} N) query, O(N log^d N) bits |
| Chazelle–Rosenberg 1989 (semigroup partial sums) | O(1) | O(N α_k(n)² log N) + \|A\| | O(N α_k(n)²) | indexing |
| Amir–Fischer–Lewenstein CPM'07 | O(1) | O(kN log N) + \|A\| (= O(kN) words) | O(N log^{[k+1]} N), any constant k>1 | indexing |
| Yuan–Atallah SODA'10 | O(1) | O(N log N) + \|A\| (= O(N) words) | O(N) | indexing, any fixed d |
| Demaine–Landau–Weimann ICALP'09 | — | Ω(n² log n) for n×n | Ω(n² log n) comparisons | encoding LB |
| Brodal–Davoodi–Rao ESA'10 | Ω(c) | N/c + \|A\| | — | indexing LB, any dimension |
| Brodal–Davoodi–Rao ESA'10 | O(1) | O(N) + \|A\| | O(N) | indexing |
| Brodal–Davoodi–Rao ESA'10 | O(c log² c) | O(N/c) + \|A\| | O(N) | indexing |
| Brodal–Davoodi–Rao ESA'10 | O(1) | O(N·min{m, log n}) | O(N) | encoding |
| Brodal–Davoodi–Rao ESA'10 | — | Ω(N log m) | — | encoding LB |
| Brodal–Davoodi–Lewenstein–Raman–Rao ESA'12 | O(c log c (log log c)²) | O(N/c) extra | — | indexing; O(c log c) for 0/1 matrices |
| Brodal–Brodnik–Davoodi ESA'13 | not considered | O(N log m) | — | encoding, matches LB |
| Gawrychowski–Górkiewicz–Satti ESA'26 | O(log^{1/κ} n) | O(κ·N·(log m + log log n)), κ∈[1, log log n] | — | encoding |

Sources for the table rows:
- Naive table, GBT, Chazelle–Rosenberg, AFL and Yuan–Atallah rows, and the BDR theorems: Table 2 and §1.1 of [Brodal, Davoodi, Rao ESA'10 PDF](https://cs.au.dk/~gerth/papers/esa10.pdf)
- AFL in words: "a class of algorithms using O(N log^{(k+1)} N) preprocessing time, O(kN log N) bits additional space and O(1) query time for any constant k > 1" — [esa10.pdf](https://cs.au.dk/~gerth/papers/esa10.pdf). A Bar-Ilan record (seen only as a search snippet) says the family "converges towards O(N log* N)" preprocessing — [BIU CRIS](https://cris.biu.ac.il/en/publications/two-dimensional-range-minimum-queries-2/) (secondary)
- Yuan–Atallah abstract: "the first linear-time preprocessing algorithm for arrays with fixed dimension, such that any range minimum query can be answered in constant time" — [DOI 10.1137/1.9781611973075.14](https://doi.org/10.1137/1.9781611973075.14) (abstract via OpenAlex)
- Gawrychowski–Górkiewicz–Satti say subsequent results [Poon ICDT'03, AFL, Yuan–Atallah] "improved these bounds to O(N log N) bits and O(1) query time", and that BDR "designed the first linear-bit (i.e., O(N) bits) index that supports queries in constant time" — [ESA 2026 paper, LIPIcs.ESA.2026.51](https://doi.org/10.4230/LIPIcs.ESA.2026.51)
- BDR abstract, verbatim content: "every algorithm enabled to access A during the query and using O(N/c) bits additional space requires Ω(c) query time, for any c where 1 ≤ c ≤ N. This lower bound holds for any dimension … tight up to a constant factor [in 1D] … indexing data structure of size O(N/c) bits additional space … O(N) time and achieves O(c log² c) query time … For the case where queries can not probe A … O(N·min{m, log n}) bits with O(1) query time … gap to the lower bound of Ω(N log m) bits" — [esa10.pdf](https://cs.au.dk/~gerth/papers/esa10.pdf). The LB is proved in a non-uniform cell-probe model — [esa10.pdf](https://cs.au.dk/~gerth/papers/esa10.pdf)
- Fibonacci-lattice index: "O(N/c) bits additional space with O(c log c (log log c)²) query time, for any parameter c, 4 ≤ c ≤ N … entries … from {0,1} … O(c log c)" — [Brodal, Davoodi, Lewenstein, Raman, Rao, TCS 638 (2016)](https://doi.org/10.1016/j.tcs.2016.02.016) (abstract via Semantic Scholar)
- DLW: "a proof that no Cartesian tree exists for the two-dimensional version of the range minimum query problem" — [DOI 10.1007/s00453-012-9683-x](https://doi.org/10.1007/s00453-012-9683-x). BDR restate it precisely: the number of different 2D-RMQ n×n matrices is Ω(((n/4)!)^{n/4}). This implies Ω(n² log n) for both preprocessing comparisons and bits, which disproves the linear bound conjectured by Amir et al. — [esa10.pdf](https://cs.au.dk/~gerth/papers/esa10.pdf)
- Brodal–Brodnik–Davoodi abstract: previous O(mn·min{m, log n}) bits vs. Ω(mn log m) lower bound; "We show that this space lower bound is optimal by presenting an encoding scheme using O(mn log m) bits. We do not consider query time." — [DOI 10.1007/978-3-642-40450-4_20](https://doi.org/10.1007/978-3-642-40450-4_20) (abstract via OpenAlex)
- ESA'26 describes that BBD encoding as "inherently sequential: it requires scanning the whole encoding to answer a query". New result (Theorem 1): for any integer κ ∈ [1, log log n], O(κmn(log m + log log n)) bits, O(log^{1/κ} n) query. A constant κ gives O(mn(log m + log log n)) bits with O(log^ε n) query, which is optimal when n ≤ 2^{O(m)}. κ = log log n gives O(1) query with a log log n space blow-up — [arXiv 2607.04509](https://arxiv.org/abs/2607.04509); [LIPIcs ESA 2026, Art. 51](https://doi.org/10.4230/LIPIcs.ESA.2026.51)

#### Few rows / random inputs (Golin et al.)

- For m = 2: the effective entropy is exactly **5n − O(log n) bits**, matched by an encoding that "merges" Cartesian trees (BDR's method gives 7n − O(log n)). They also give a (5+ε)n-bit structure with O(log(1/ε)/ε) query time. For m = 3: an encoding of (6 + log 5)n − O(log n) ≈ 8.32n bits, with lower bound 8n − O(log n). The merged-Cartesian-tree encoding uses Θ(nm²) bits in general — [Golin et al., arXiv 1109.2885](https://arxiv.org/abs/1109.2885)
- Random (i.i.d.) inputs: the expected effective entropy is Θ((log n)²) bits for 1-sided, Θ((log n)² log m) for 2-sided, Θ(n (log m)²) for 3-sided and Θ(nm) for 4-sided queries. They also give O(1)-time 4-sided RMQ in expected O(nm) bits. For 1D random arrays the expected entropy is ≤ cn bits with c ≈ 1.736 — [arXiv 1109.2885](https://arxiv.org/abs/1109.2885)

#### Newer encodings (2021–2026)

- Bounded alphabet σ (Jo & Satti, CPM 2025, journal version TCS 2026):
  - 1D: lower bound n·log(4cos²(π/(σ+2))) − O(σ log n) bits; optimal space with O(1) query for constant σ.
  - 2D, m ≤ n: 1-sided Θ(n log m) bits; 2- and 3-sided Θ(mn) bits with O(1) query; 4-sided Θ(mn log σ) bits, O(1) query when σ = O(1).
  - Open problem they restate: for m = o(n), find an o(nm log n)-bit structure with sublinear query time.
  - Sources: [CPM 2025, DOI 10.4230/LIPIcs.CPM.2025.25](https://doi.org/10.4230/LIPIcs.CPM.2025.25); [TCS 1070 (2026) 115824](https://doi.org/10.1016/j.tcs.2026.115824); [arXiv 2604.13350](https://arxiv.org/abs/2604.13350)
- 2D top-k encodings: a 4-sided encoding in (m·lg C((k+1)n, n) + 2nm(m−1) + o(n)) bits, which generalizes Golin et al.'s joint Cartesian tree and beats the trivial O(nm lg n) bits when m = o(lg n) — [Jo, Lingala, Satti, Algorithmica 83 (2021) 3379–3402](https://doi.org/10.1007/s00453-021-00856-1)

#### Naive 2D sparse table (competitive programming)

- Table st[a][b][i][j] stores the min of the 2^a × 2^b block whose top-left corner is (i,j). Build it as 1D sparse tables per row, then extend across rows. A query splits the row range and the column range each into two overlapping power-of-two pieces and takes the min of **4 table reads**. Overlap is harmless because min is idempotent. Preprocessing and space are O(nm log n log m); query is O(1) **only if log values are precomputed**, because calling `log2()` was flagged in the comments. A commenter also reported index bugs in the posted code — [Codeforces blog 45485 (fnf47)](https://codeforces.com/blog/entry/45485) (secondary/CP source)

#### Verified references (Q1)

- A. Amir, J. Fischer, M. Lewenstein. "Two-Dimensional Range Minimum Queries." CPM 2007, LNCS 4580, pp. 286–294. [DOI✓ 10.1007/978-3-540-73437-6_29](https://doi.org/10.1007/978-3-540-73437-6_29)
- H. Yuan, M. J. Atallah. "Data Structures for Range Minimum Queries in Multidimensional Arrays." SODA 2010, pp. 150–160. [DOI✓ 10.1137/1.9781611973075.14](https://doi.org/10.1137/1.9781611973075.14)
- G. S. Brodal, P. Davoodi, S. S. Rao. "On Space Efficient Two Dimensional Range Minimum Data Structures." ESA 2010, LNCS 6347, pp. 171–182 [DOI✓ 10.1007/978-3-642-15781-3_15](https://doi.org/10.1007/978-3-642-15781-3_15). Journal: Algorithmica 63(4):815–830, 2012 (online 2011) [DOI✓ 10.1007/s00453-011-9499-0](https://doi.org/10.1007/s00453-011-9499-0)
- E. D. Demaine, G. M. Landau, O. Weimann. "On Cartesian Trees and Range Minimum Queries." ICALP 2009, LNCS 5555, pp. 341–353 [DOI✓ 10.1007/978-3-642-02927-1_29](https://doi.org/10.1007/978-3-642-02927-1_29). Journal: Algorithmica 68(3):610–625, 2014 (online 2012) [DOI✓ 10.1007/s00453-012-9683-x](https://doi.org/10.1007/s00453-012-9683-x)
- M. J. Golin, J. Iacono, D. Krizanc, R. Raman, S. S. Rao. "Encoding 2D Range Maximum Queries." ISAAC 2011, LNCS 7074, pp. 180–189 [DOI✓ 10.1007/978-3-642-25591-5_20](https://doi.org/10.1007/978-3-642-25591-5_20). Journal: M. J. Golin, J. Iacono, D. Krizanc, R. Raman, S. R. Satti, S. M. Shende, TCS 609:316–327, 2016 [DOI✓ 10.1016/j.tcs.2015.10.012](https://doi.org/10.1016/j.tcs.2015.10.012). **Author-list discrepancy:** Crossref and OpenAlex list 5 authors for the ISAAC version (no Shende), while arXiv 1109.2885 and TCS list 6.
- G. S. Brodal, A. Brodnik, P. Davoodi. "The Encoding Complexity of Two Dimensional Range Minimum Data Structures." ESA 2013, LNCS 8125, pp. 229–240. [DOI✓ 10.1007/978-3-642-40450-4_20](https://doi.org/10.1007/978-3-642-40450-4_20)
- G. S. Brodal, P. Davoodi, M. Lewenstein, R. Raman, S. S. Rao. "Two Dimensional Range Minimum Queries and Fibonacci Lattices." ESA 2012, LNCS 7501, pp. 217–228 [DOI✓ 10.1007/978-3-642-33090-2_20](https://doi.org/10.1007/978-3-642-33090-2_20). Journal: TCS 638:33–43, 2016 [DOI✓ 10.1016/j.tcs.2016.02.016](https://doi.org/10.1016/j.tcs.2016.02.016)
- P. Gawrychowski, A. Górkiewicz, S. R. Satti. "Near-Optimal and Efficient Encoding for Two-Dimensional Range Minimum Queries." ESA 2026, LIPIcs, Art. 51, pp. 51:1–51:19. DOI 10.4230/LIPIcs.ESA.2026.51 (read from the LIPIcs PDF, not checked on Crossref). [PDF](https://drops.dagstuhl.de/storage/00lipics/lipics-vol388-esa2026/LIPIcs.ESA.2026.51/LIPIcs.ESA.2026.51.pdf)
- S. Jo, S. R. Satti. "Encodings for Range Minimum Queries over Bounded Alphabets." CPM 2025, LIPIcs, Art. 25 (DOI from the PDF) and TCS 1070:115824, 2026 [DOI✓ 10.1016/j.tcs.2026.115824](https://doi.org/10.1016/j.tcs.2026.115824)
- S. Jo, R. Lingala, S. R. Satti. "Encoding Two-Dimensional Range Top-k Queries." Algorithmica 83:3379–3402, 2021. [DOI✓ 10.1007/s00453-021-00856-1](https://doi.org/10.1007/s00453-021-00856-1)
- Background, cited as listed in the ESA'26 reference list: H. N. Gabow, J. L. Bentley, R. E. Tarjan, "Scaling and related techniques for geometry problems," STOC 1984, pp. 135–143, [DOI 10.1145/800057.808675](https://doi.org/10.1145/800057.808675). C. K. Poon, "Optimal range max datacube for fixed dimensions," ICDT 2003, [DOI 10.1007/3-540-36285-1_11](https://doi.org/10.1007/3-540-36285-1_11). B. Chazelle, B. Rosenberg, "Computing partial sums in multidimensional arrays," SoCG 1989, pp. 131–139, [DOI✓ 10.1145/73833.73848](https://doi.org/10.1145/73833.73848)
- Related structured special case (from the ESA'26 references): submatrix-max in (partial) Monge matrices. Kaplan, Mozes, Nussbaum, Sharir, TALG 13(2):26, 2017 [DOI 10.1145/3039873](https://doi.org/10.1145/3039873). Gawrychowski, Mozes, Weimann, TALG 16(2):16, 2020 [DOI 10.1145/3381416](https://doi.org/10.1145/3381416)

### Inferences

- **Core idea, for slides:** in 1D the Cartesian tree (2n bits) captures every RMQ answer. In 2D the "shape" of the answers carries Θ(log m) bits *per cell*: there are ((n/4)!)^{n/4} distinct n×n patterns, and log of that ≈ (n²/4)·log n. So you cannot beat storing per-cell ranks when m ≈ n. Indexing escapes this because the query can read A and compare candidates directly.
- **Why indexing reaches O(N) extra bits with O(1) query:** split into small blocks, use a micro-table lookup for in-block queries (BDR cite Atallah–Yuan's table-lookup method), and use a word-level structure on block minima. The query compares O(1) candidate positions *by reading A*. This is the 2D analogue of 1D block decomposition (inference from BDR §2).
- **2D sparse table vs. the literature:** O(nm log n log m) ≤ O(N log² N) words. That is the "naive" quadratic-log space which AFL and Yuan–Atallah improve to O(N) words.
- **Tiny worked example (for the audience):** A = [[3,1],[2,4]] (2×2). The query [1..2]×[1..2] gives (1,2); [2..2]×[1..2] gives (2,1). For the 2D sparse table on a 4×4 matrix and query rows 1..3 × cols 2..4: k1 = k2 = 1, so read the four 2×2 blocks anchored at (1,2), (2,2), (1,3), (2,3).
- **Encoding intuition example:** the 2×n case. Two rows, each with its own Cartesian tree, plus an interleaving of the two rows. Golin et al. show 5n − O(log n) bits are both necessary and sufficient. Contrast this with 2n for a single row.

### Gaps

- Exact AFL abstract wording and the O(N log* N) limit claim came only from a secondary snippet (Springer and DBLP pages were blocked or rate-limited).
- Exact Yuan–Atallah space constant (the dependence on d, such as 2^d·d!) was not confirmed. BDR state only "O(N log N) bits additional".
- No published lower bound was found for *query time* in the encoding model at O(N log m) bits, so whether ESA'26's O(log^{1/κ} n) is optimal remains open.
- Exact LNCS volume numbers (4580, 6347, 5555, 7074, 8125, 7501) are standard but were not confirmed in the Crossref fields printed. Mark them **UNVERIFIED** (the DOIs are verified).

---

## Q2. Dynamic RMQ: segment tree, lazy propagation, lower bounds, dynamic succinct RMQ

### Takeaway

With point updates, the segment tree's O(log n)/O(log n) is not optimal in the word-RAM. The tight bound is **Θ(log n / log log n)** query time when updates must be polylogarithmic. The lower bound is cell-probe, via marked ancestor (Alstrup–Husfeldt–Rauhe). The matching upper bound is Brodal–Davoodi–Rao's dynamic path minima, which includes arrays as a special case. In the **comparison model**, polylog queries force Ω(log n) comparisons per update (via Brodal–Chaudhuri–Radhakrishnan), so the comparison-based upper bound is Θ(log n/log log n) query with Θ(log n) amortized update.

### Cited Findings

#### Problem statement

- Maintain an array under update(i, x), and possibly insert/delete, answering min/argmin over [l, r]. Brodal–Davoodi–Rao note the dynamic array case is path minima on a path: "an array containing n elements, and we have to find the position of the minimum element within a query range" — [WADS'11 PDF](https://cs.au.dk/~gerth/papers/wads11.pdf)

#### Standard practice: segment tree + lazy propagation

- A segment tree supports point modifications and range queries in O(log n). With lazy propagation it applies modifications "to an entire segment of contiguous elements, and perform the query in the same time O(log n)". The page covers addition on segments, assignment on segments, and "adding on segments, querying for maximum" (min is symmetric) — [cp-algorithms: Segment Tree](https://cp-algorithms.com/data_structures/segment_tree.html)

#### Lower bounds (models matter)

- **Cell-probe (Alstrup–Husfeldt–Rauhe, FOCS'98).** They give a trade-off t_q = Ω(log n / log(t_u·b·log n)) for marked ancestor (b = word size). "For logarithmic word size the bound … implies a lower bound of Θ(log n/log log n) per operation." Corollaries include planar emptiness and dominance in Ω(log n/log log n) — [BRICS RS-98-7](https://www.brics.dk/RS/98/7/BRICS-RS-98-7.pdf); [DOI✓ 10.1109/SFCS.1998.743504](https://doi.org/10.1109/SFCS.1998.743504)
- **How it transfers to RMQ:** "(3) In the RAM model, if we want to update the edge-weights in polylogarithmic time, Ω(log n/log log n) cell probes are required to support path minima queries [Alstrup et al., §2.2]". These lower bounds are "derived … by reduction from the 1D-RMQ problem" — [Brodal, Davoodi, Rao WADS'11](https://cs.au.dk/~gerth/papers/wads11.pdf)
- **Comparison model:** "(4) … if we want to answer a path minima query in polylogarithmic time, Ω(log n) comparisons are required to update the edge-weights [Brodal–Chaudhuri–Radhakrishnan]" — [WADS'11](https://cs.au.dk/~gerth/papers/wads11.pdf). BCR's own result: any randomized algorithm with expected amortized t comparisons per Insert/Delete needs ≥ n/(e·2^{2t}) − 1 comparisons for FindMin. With FindAny instead, constant expected cost is possible; deterministic constant cost is impossible. An *offline* version has a deterministic O(1) amortized algorithm — [DOI✓ 10.1007/3-540-61422-2_116](https://doi.org/10.1007/3-540-61422-2_116) (abstract via Semantic Scholar)
- **Semigroup model:** "(5) … logarithmic time to support path minima queries implies Ω(log n) time to update the edge-weights, and vice versa [Pătraşcu–Demaine]" — [WADS'11](https://cs.au.dk/~gerth/papers/wads11.pdf); [Pătraşcu & Demaine, SICOMP 35(4) 2006, DOI✓](https://doi.org/10.1137/S0097539705447256)

#### Optimal upper bound (Brodal–Davoodi–Rao, WADS'11)

- Comparison-based: path minima in **Θ(log n/log log n)** query, **Θ(log n) amortized** edge-weight update. In the RAM, update improves to **O(log n/log log n) amortized**. O(n) space. Also supports insert (subdividing an edge), insert-leaf and contract — [WADS'11](https://cs.au.dk/~gerth/papers/wads11.pdf)
- Cell-probe trade-off in the link/cut setting: with polylog update, the query is Ω(log n/log log n). If t_q = O(log n/log log n), then t_u = Ω(log^{1+ε} n). That is, O(log n)-time updates and O(log n/log log n)-time queries cannot be had together in that setting — [WADS'11 §4](https://cs.au.dk/~gerth/papers/wads11.pdf)
- Héliou et al. independently summarize prior dynamic RMQ as "(log n/log log n) query time and O(log n/log log n) amortized time for the update in linear space" — [HAL hal-01255499](https://hal.science/hal-01255499v2)

#### Dynamic succinct / compressed

- **Navarro–Sadakane (TALG 2014):** the range min-max tree. The dynamic version supports insertion and deletion of nodes in 2n + O(n log log n/log n) bits with the optimal O(log n/log log n) for most operations (simpler 2n + O(n/log n) bits with O(log n)). Static: ±1-RMQ in n + O(n/polylog n) bits. Also dynamic bitmaps with rank/select/indels in O(log n/log log n) — [DOI✓ 10.1145/2601073](https://doi.org/10.1145/2601073) (abstract via Semantic Scholar; arXiv 0905.0768)
- **Héliou, Léonard, Mouchard, Salson (TCS 2016):** a non-Cartesian-tree approach. It uses hierarchical bit vectors M_k marking (k−1)-local minima, about O(log n) levels.
  - Static "Sample" variant: 2nH₀(M) + o(n) bits with O(log q · log^{1+ε} log q) query, where q is the query length.
  - Static "Sparse" variant: ≤ 3.16n + o(n) bits with O(log q).
  - It supports insertion, deletion and modification. Each level's bit-vector update costs O(log n/log log n) amortized. In the dynamic "Sample" setting the paper derives query O(log² n · log^ε log n).
  - It is an *indexing* structure: it returns values and needs S.
  - Sources: [HAL PDF](https://hal.science/hal-01255499v2/document); [DOI✓ 10.1016/j.tcs.2016.07.002](https://doi.org/10.1016/j.tcs.2016.07.002)

#### Verified references (Q2)

- S. Alstrup, T. Husfeldt, T. Rauhe. "Marked Ancestor Problems." FOCS 1998, pp. 534–543. [DOI✓ 10.1109/SFCS.1998.743504](https://doi.org/10.1109/SFCS.1998.743504). Also BRICS RS-98-7 [DOI✓ 10.7146/brics.v5i7.19279](https://doi.org/10.7146/brics.v5i7.19279)
- G. S. Brodal, S. Chaudhuri, J. Radhakrishnan. "The Randomized Complexity of Maintaining the Minimum." SWAT 1996, LNCS 1097, pp. 4–15 [DOI✓ 10.1007/3-540-61422-2_116](https://doi.org/10.1007/3-540-61422-2_116). Journal: Nordic J. Computing 3(4):337–351, 1996, as cited in WADS'11 (no DOI)
- M. Pătraşcu, E. D. Demaine. "Logarithmic Lower Bounds in the Cell-Probe Model." SIAM J. Comput. 35(4):932–963, 2006. [DOI✓ 10.1137/S0097539705447256](https://doi.org/10.1137/S0097539705447256)
- G. S. Brodal, P. Davoodi, S. S. Rao. "Path Minima Queries in Dynamic Weighted Trees." WADS 2011, LNCS 6844, pp. 290–301. [DOI✓ 10.1007/978-3-642-22300-6_25](https://doi.org/10.1007/978-3-642-22300-6_25)
- G. Navarro, K. Sadakane. "Fully Functional Static and Dynamic Succinct Trees." ACM TALG 10(3), Art. 16, 2014 [DOI✓ 10.1145/2601073](https://doi.org/10.1145/2601073). Conference: K. Sadakane, G. Navarro, "Fully-Functional Succinct Trees," SODA 2010, pp. 134–149 [DOI✓ 10.1137/1.9781611973075.13](https://doi.org/10.1137/1.9781611973075.13)
- A. Héliou, M. Léonard, L. Mouchard, M. Salson. "Efficient dynamic range minimum query." TCS 656:108–117, **2016**. [DOI✓ 10.1016/j.tcs.2016.07.002](https://doi.org/10.1016/j.tcs.2016.07.002). **The brief says 2017; Crossref and HAL both say 2016 (vol. 656).**

### Inferences

- **Core idea of the Θ(log n/log log n) upper bound:** replace the binary segment tree with a tree of fan-out ~log^ε n, so its height is O(log n/log log n). At each node, answer "which child range holds the min" in O(1) via word-level or micro-tree tricks. An update touches one root-to-leaf path. This is consistent with WADS'11's "O(log n/log log n) levels, and at each level all subqueries … supported in constant time".
- **Talking point:** the semigroup lower bound says log-time queries force log-time updates, so the segment tree is optimal *if you only combine values with min*. Beating it requires the RAM (indices, table lookup).
- **Lazy-propagation worked example:** A = [5,2,7,1,3]. After add(+3 on [2..4]) A = [5,5,10,4,3], so min[1..3] = 5. The +3 tag is stored on the O(log n) canonical nodes that exactly cover [2..4], and each such node's min is shifted by 3. Nothing is pushed down to children until a later operation enters that node.
- For range-assign plus range-min, compose tags as "assign overrides add". For range-add plus range-min, the node's min shifts by the tag. Both are O(log n) per operation (standard; cp-algorithms).

### Gaps

- The Brodal–Davoodi–Rao journal version, if any, was not found.
- No 2024–2026 dynamic-RMQ improvement was found. Search was limited by DBLP rate-limiting.
- Arge et al. 2013, which Héliou et al. cite for external-memory dynamic RMQ, was not checked.
- The WADS'11 volume number (LNCS 6844) is **UNVERIFIED**; the DOI is verified.

---

## Q3. Offline / batched RMQ: Tarjan offline LCA, Arpa's trick, small batches

### Takeaway

When all queries are known in advance, RMQ needs no O(1)-query structure. Sweep the right endpoint, keep a monotonic stack, and union-find the popped elements (Arpa's trick). The cost is O((n+q)·α) time with O(n) space, the same machinery as Tarjan's offline LCA. For q = o(n), Alzamel et al. engineer n + O(q) time and O(q) space.

### Cited Findings

- **Tarjan (J. ACM 1979):** path compression on balanced trees evaluates path functions over a sequence of m EVAL/LINK/UPDATE operations in O((m+n)·α(m+n, n)) — [DOI✓ 10.1145/322154.322161](https://doi.org/10.1145/322154.322161) (abstract via OpenAlex)
- **Offline LCA (Tarjan) as taught:** a DFS, and when a node is finished it is unioned into its parent. For a query (u,v) with u already visited, the answer is ancestor[find_set(u)]. cp-algorithms states the total is O(n + m), treating DSU operations as O(1) amortized — [cp-algorithms: Tarjan offline LCA](https://cp-algorithms.com/graph/lca_tarjan.html)
- **Arpa's trick (offline RMQ in O(α(n)) average per query):** group queries by right endpoint R (container[i] holds queries with R = i) and scan i left to right with a stack holding the next smaller element. When an element is popped, its DSU parent is set to i, so the parent of an element is the next smaller element to its right. A query (L, i) is answered by the value at find(L). Path compression applies. The method is "known as Arpa's trick" after AmirReza Poorakhavan, who popularized it, though the page notes "the algorithm existed already before his discovery" — [cp-algorithms: DSU, "Offline RMQ … Arpa's trick"](https://cp-algorithms.com/data_structures/disjoint_set_union.html)
- **Small batch (Alzamel, Charalampopoulos, Iliopoulos, Pissis, IWOCA 2017):** for q = o(n) queries known in advance, building a Ω(n) structure is not justified. The target is "n + O(q) time and O(q) space", achieved by modifying existing algorithms. The largest practical gain is for batches of LCA queries, and a library is provided — [arXiv 1705.04589](https://arxiv.org/abs/1705.04589); [DOI✓ 10.1007/978-3-319-78825-8_28](https://doi.org/10.1007/978-3-319-78825-8_28)
- Gabow–Tarjan's linear-time special-case union–find is the standard tool for making offline LCA strictly O(n + m). The bibliographic record is verified: H. N. Gabow, R. E. Tarjan, "A linear-time algorithm for a special case of disjoint set union," STOC 1983, pp. 246–251 [DOI✓ 10.1145/800061.808753](https://doi.org/10.1145/800061.808753); JCSS 30(2):209–221, 1985 [DOI✓ 10.1016/0022-0000(85)90014-5](https://doi.org/10.1016/0022-0000(85)90014-5). **The claim that it applies to offline LCA was not checked in this session — UNVERIFIED.**

#### Verified references (Q3)

- R. E. Tarjan. "Applications of Path Compression on Balanced Trees." J. ACM 26(4):690–715, 1979. [DOI✓ 10.1145/322154.322161](https://doi.org/10.1145/322154.322161)
- M. Alzamel, P. Charalampopoulos, C. S. Iliopoulos, S. P. Pissis. "How to Answer a Small Batch of RMQs or LCA Queries in Practice." IWOCA 2017, LNCS 10765, pp. 343–355, published 2018. [DOI✓ 10.1007/978-3-319-78825-8_28](https://doi.org/10.1007/978-3-319-78825-8_28)
- Arpa's trick: no peer-reviewed source. Cite [cp-algorithms DSU](https://cp-algorithms.com/data_structures/disjoint_set_union.html). An original Codeforces blog by Arpa likely exists, but its URL and title were **not located (UNVERIFIED)**.

### Inferences

- **Why it works (slide version):** after processing prefix [1..i], the DSU roots are exactly the elements on the monotonic stack, the "suffix minima" of the prefix. find(L) jumps to the first stack element at or after L, which is min A[L..i].
- **Worked example:** A = [4,2,5,1,3], queries (2,3), (1,5).
  - i=1: stack [4].
  - i=2: 2 pops 4, so parent(1)=2; stack [2].
  - i=3: stack [2,5]. Query (2,3) → find(2)=2 → A=2 ✓.
  - i=4: 1 pops 5 and 2, so parent(3)=4 and parent(2)=4; stack [1].
  - i=5: stack [1,3]. Query (1,5) → find(1) → 2 → 4 → A=1 ✓.
- The offline link to BCR: "maintaining the minimum" also becomes O(1) amortized deterministically offline [BCR abstract]. Knowing the future removes the comparison lower bound.

### Gaps

- The original Arpa blog post (title, date, URL) could not be located with the remaining budget.
- No formal worst-case analysis of Arpa's trick appears on cp-algorithms. It states "O(α(n)) on average", and with path compression only, the bound is amortized O(log) or α depending on union rule (the page notes union by rank requires a separate leader).

---

## Q4. Sliding-window minimum: monotonic deque, van Herk / Gil–Werman, Lemire

### Takeaway

For fixed window width w, every window min can be computed in O(n) total. The monotonic deque does this online with zero latency. The van Herk/Gil–Werman (vHGW) block prefix/suffix trick also does it, with about 3 comparisons per element *per filter* (6 − 8/w for max and min together), latency w. Lemire's streaming algorithm computes both max and min in ≤ 3 comparisons per element with zero latency.

### Cited Findings

- **Monotonic deque:** cp-algorithms "Minimum Stack / Minimum Queue" includes "Finding the minimum for all subarrays of fixed length" via a min-queue, with O(1) amortized per element — [cp-algorithms: Minimum stack/queue](https://cp-algorithms.com/data_structures/stack_queue_modification.html)
- **Gil–Werman (TPAMI 1993):** "The algorithms take constant time per pixel to compute min or max filters and polylog time per pixel … to compute the median filter. A logarithmic time per pixel lower bound for the computation of the median filter is shown." — [DOI✓ 10.1109/34.211471](https://doi.org/10.1109/34.211471) (abstract via OpenAlex)
- **Comparison counts (Lemire, Table I):**

  | Algorithm | Worst-case comparisons/element (max **and** min) | Latency | Buffer |
  |---|---|---|---|
  | Naive | 2w − 2 | 0 | O(1) |
  | van Herk 1992 / Gil–Werman 1993 | 6 − 8/w | w | 4w + O(1) |
  | Gil–Kimmel 2002 | 3 + 2 log w / w + O(1/w) | w | 6w + O(1) |
  | Lemire 2006 | 3 | 0 | 2w + O(1) |

  vHGW "is based on the batch computation of cumulative maxima and minima over overlapping blocks of 2w elements", using a 2w + O(1) buffer per filter. Lemire also needs ≤ 2 comparisons per element on monotonic input, and he proves "at least 2 comparisons per element are required" (stated in his introduction) — [Lemire, arXiv cs/0610046](https://arxiv.org/abs/cs/0610046)
- Lemire's abstract: "an easy-to-implement online algorithm requiring no more than 3 comparisons per element, in the worst case … no algorithm is known to compute the running maximum (or minimum) filter in 1.5 comparisons per element" — [arXiv cs/0610046](https://arxiv.org/abs/cs/0610046)
- A 2025 paper exists: A. Meijster, M. Marziali, "A Linear Time Algorithm for Local Minimum and Maximum Filters," LNCS 2025, pp. 315–327 [DOI✓ 10.1007/978-3-032-09544-2_23](https://doi.org/10.1007/978-3-032-09544-2_23). **Content UNVERIFIED (no abstract available).**

#### Verified references (Q4)

- M. van Herk. "A fast algorithm for local minimum and maximum filters on rectangular and octagonal kernels." Pattern Recognition Letters 13(7):517–521, 1992. [DOI✓ 10.1016/0167-8655(92)90069-C](https://doi.org/10.1016/0167-8655(92)90069-C)
- J. Gil, M. Werman. "Computing 2-D min, median, and max filters." IEEE TPAMI 15(5):504–507, 1993. [DOI✓ 10.1109/34.211471](https://doi.org/10.1109/34.211471)
- J. Y. Gil, R. Kimmel. "Efficient dilation, erosion, opening, and closing algorithms." IEEE TPAMI 24(12):1606–1617, 2002. [DOI✓ 10.1109/TPAMI.2002.1114852](https://doi.org/10.1109/TPAMI.2002.1114852)
- D. Lemire. "Streaming Maximum-Minimum Filter Using No More than Three Comparisons per Element." Nordic J. Computing 13(4):328–339, 2006 (journal ref from arXiv; no DOI). [arXiv cs/0610046](https://arxiv.org/abs/cs/0610046)

### Inferences

- **vHGW core idea:** cut the signal into blocks of length w. Compute g = prefix-min inside each block (left to right) and h = suffix-min inside each block (right to left). Any window [x, x+w−1] straddles at most one block boundary, so its min is min(h[x], g[x+w−1]). That is 1 comparison for the answer plus about 2 for the scans, roughly 3 per element per filter. This is the "disjoint sparse table with one level" idea, and it also explains the latency of w.
- **Separable 2D erosion:** a w×h rectangle min filter equals a row filter followed by a column filter. Gil–Werman's constant-per-pixel result follows from this. A 2D RMQ with *fixed* query shape is therefore far easier than the general 2D RMQ of Q1.
- **Worked example (w=3):** A = [4,2,12,3,8,7,1,5,9].
  - Blocks: [4,2,12 | 3,8,7 | 1,5,9].
  - g = [4,2,2 | 3,3,3 | 1,1,1]; h = [2,2,12 | 3,7,7 | 1,5,9].
  - Window starting at x=2 (A[2..4]) gives min(h[2], g[4]) = min(2,3) = 2 ✓.
  - The deque version keeps the indices of an increasing subsequence and pops from the back while the new element is ≤ the back.

### Gaps

- The exact comparison count for a *single* vHGW filter (3 − 4/w) is inferred by halving Lemire's combined max+min figure. It is not quoted from van Herk or Gil–Werman directly.
- The PRL issue number (7) and the TPAMI issue number (5) are **UNVERIFIED**; volume and pages are verified.

---

## Q5. Related queries: semigroup range products (Yao, Alon–Schieber), tree path minima (Chazelle), range k-th / top-k (wavelet trees), Disjoint Sparse Table, Sqrt Tree

### Takeaway

Min is idempotent (x ∘ x = x), so two *overlapping* precomputed ranges cover any query. That gives the sparse table's one-combine query with O(n log n) space. For a general (non-idempotent) semigroup like +, the precomputed pieces must be *disjoint*. Yao and Alon–Schieber show the trade-off is then governed by inverse-Ackermann functions: linear space forces Θ(α(n)) combine steps. Disjoint Sparse Table (n log n, 1 op) and Sqrt Tree (n log log n, O(1) ops) are practical points on that curve. Word-RAM RMQ with O(n) space and O(1) query escapes the semigroup lower bound because it uses indices and table lookups, not only min operations.

### Cited Findings

#### Semigroup lower and upper bounds

- **Yao (STOC 1982):** for the "interval" query, "we have determined the space-time tradeoff quite precisely to be T ≈ α(S, n), where α is the inverse to an Ackermann's function". In the dynamic case, any algorithm processing O(n) INSERT and QUERY needs Ω(n log n/log log n) time — [DOI✓ 10.1145/800070.802185](https://doi.org/10.1145/800070.802185) (abstract via OpenAlex)
- **Alon–Schieber (TR 1987, arXiv 2024):** for a semigroup (S,∘) and on-line queries s_i ∘ … ∘ s_j, "a preprocessing of Θ(n λ(k,n)) time and space is both necessary and sufficient to answer each such query in at most k steps, for any fixed k". λ(k,·) is the inverse of a function at level ⌊k/2⌋ of the primitive recursive hierarchy. With linear preprocessing, O(α(n)) steps suffice "and this is best possible". There are analogous results for path products in trees, and CREW PRAM preprocessing in O(log n) parallel time — [arXiv 2406.06321](https://arxiv.org/abs/2406.06321)
- **This applies to minima:** "(1) In the semigroup model, with linear space, Ω(α(n)) semigroup operations are required to answer a path minima query [Yao]" — [Brodal, Davoodi, Rao WADS'11](https://cs.au.dk/~gerth/papers/wads11.pdf)
- **Dynamic semigroup path minima:** WADS'11 dynamizes Alon–Schieber to answer queries in ≤ 7k − 4 semigroup operations with O(n·α_k(n)) space and O(α_k(n)) amortized leaf insert/delete — [WADS'11](https://cs.au.dk/~gerth/papers/wads11.pdf)
- **Idempotence, CP view:** the O(1) sparse-table query "only supports queries of idempotent functions … it works great for range minimum queries, but it is not possible to answer range sum queries using this approach". For arbitrary associative operations, the page points to the Disjoint Sparse Table and the Sqrt Tree — [cp-algorithms: Sparse Table](https://cp-algorithms.com/data_structures/sparse-table.html)

#### Disjoint Sparse Table and Sqrt Tree

- **Disjoint Sparse Table:** O(1) query for any monoid (associative operation) with O(n log n) space and construction. Each level stores aggregates from every index to its block midpoint. The level is chosen by the highest differing bit of l and r (lzcnt), using exactly one operation per query. A commenter warns one loop silently assumed commutativity — [Codeforces blog 79108](https://codeforces.com/blog/entry/79108); [follow-up blog 117151](https://codeforces.com/blog/entry/117151) (CP sources)
- **Sqrt Tree:** "can process such queries in O(1) time with O(n·log log n) preprocessing time and O(n·log log n) memory" for any associative operation (gcd, min, max, +, and, or, xor). It is a recursive √-decomposition of height O(log log n), storing prefixOp, suffixOp and between-blocks tables, and it supports element and segment updates — [cp-algorithms: Sqrt Tree](https://cp-algorithms.com/data_structures/sqrt-tree.html)

#### Tree path minima

- Static Cartesian tree of a weighted tree: the root is the minimum-weight edge, and the children are the Cartesian trees of the two components. It supports path minima in O(1) with linear space, but construction needs Ω(n log n) comparisons (reduction from sorting). Leaf insertion can be done in O(log n) — [WADS'11 §1](https://cs.au.dk/~gerth/papers/wads11.pdf)
- Demaine–Landau–Weimann give "a Cartesian tree for the bottleneck edge query problem on trees and undirected graphs" and a cache-oblivious Cartesian tree for RMQ — [DOI✓ 10.1007/s00453-012-9683-x](https://doi.org/10.1007/s00453-012-9683-x)

#### Range k-th smallest / top-k

- **Range selection lower bound:** any structure with S words needs Ω(log n / log(Sw/n)) query time. So n·polylog(n) space forces Ω(log n/log log n), and O(1) query needs n^{1+Ω(1)} space. Their linear-space upper bound is O(log k/log log n + log log n) — [Jørgensen & Larsen, SODA 2011, DOI✓ 10.1137/1.9781611973082.63](https://doi.org/10.1137/1.9781611973082.63)
- Wavelet-tree range quantile: T. Gagie, S. J. Puglisi, A. Turpin, "Range Quantile Queries: Another Virtue of Wavelet Trees," SPIRE 2009, LNCS 5721, pp. 1–6 [DOI✓ 10.1007/978-3-642-03784-9_1](https://doi.org/10.1007/978-3-642-03784-9_1). **Bound not retrieved; the commonly quoted O(log σ) per query is UNVERIFIED here.**
- T. Gagie, G. Navarro, S. J. Puglisi, "New algorithms on wavelet trees and applications to information retrieval," TCS 426–427:25–41, 2012 [DOI✓ 10.1016/j.tcs.2011.12.002](https://doi.org/10.1016/j.tcs.2011.12.002). G. Navarro, "Wavelet trees for all," JDA 25:2–20, 2014 [DOI✓ 10.1016/j.jda.2013.07.004](https://doi.org/10.1016/j.jda.2013.07.004). G. S. Brodal, R. Fagerberg, M. Greve, A. López-Ortiz, "Online Sorted Range Reporting," ISAAC 2009, pp. 173–182 [DOI✓ 10.1007/978-3-642-10631-6_19](https://doi.org/10.1007/978-3-642-10631-6_19). **Specific bounds of these three are UNVERIFIED in this session.**
- The segment-tree family also covers "Finding the k-th smallest number in a range" via a persistent segment tree — [cp-algorithms: Segment Tree](https://cp-algorithms.com/data_structures/segment_tree.html)

#### Verified references (Q5)

- A. C. Yao. "Space-time tradeoff for answering range queries (Extended Abstract)." STOC 1982, pp. 128–136. [DOI✓ 10.1145/800070.802185](https://doi.org/10.1145/800070.802185)
- N. Alon, B. Schieber. "Optimal Preprocessing for Answering On-Line Product Queries." Tech. Rep. TR 71/87, Tel Aviv University, 1987, as cited by WADS'11 (the TR number is **UNVERIFIED**). Posted as [arXiv 2406.06321](https://arxiv.org/abs/2406.06321) (2024). No DOI.
- B. Chazelle. "Computing on a free tree via complexity-preserving mappings." Algorithmica 2:337–361, 1987 [DOI✓ 10.1007/BF01840366](https://doi.org/10.1007/BF01840366). FOCS 1984 version, pp. 358–368 [DOI✓ 10.1109/SFCS.1984.715936](https://doi.org/10.1109/SFCS.1984.715936). **Content (bounds) not retrieved — UNVERIFIED.**
- B. Chazelle, B. Rosenberg. "Computing partial sums in multidimensional arrays." SoCG 1989, pp. 131–139. [DOI✓ 10.1145/73833.73848](https://doi.org/10.1145/73833.73848)
- A. G. Jørgensen, K. G. Larsen. "Range Selection and Median: Tight Cell Probe Lower Bounds and Adaptive Data Structures." SODA 2011, pp. 805–813. [DOI✓ 10.1137/1.9781611973082.63](https://doi.org/10.1137/1.9781611973082.63)
- Supporting 1D baseline: J. Fischer, V. Heun, SICOMP 40(2):465–492, 2011 [DOI✓ 10.1137/090779759](https://doi.org/10.1137/090779759). D. Harel, R. E. Tarjan, SICOMP 13(2):338–355, 1984 [DOI✓ 10.1137/0213024](https://doi.org/10.1137/0213024). M. A. Bender, M. Farach-Colton, LATIN 2000 [DOI✓ 10.1007/10719839_9](https://doi.org/10.1007/10719839_9)

### Inferences

- **Slide-ready explanation of "why min is O(1) but sum needs α(n)":**
  - In the semigroup model a query answer must be *assembled* from stored partial products.
  - For min, you may reuse elements twice, so two stored products always suffice: [l, l+2^k) ∪ (r−2^k, r]. With O(n log n) space that is one combine.
  - For +, double-counting is forbidden, so you need a *partition* of [l, r] into stored pieces. Yao and Alon–Schieber show that k pieces need about n·λ(k, n) space. That gives n log n for 2 pieces (the Disjoint Sparse Table), about n log log n with a constant number (the Sqrt Tree, by cp-algorithms' figures), and n with α(n) pieces.
  - Even min needs α(n) ops in the *pure semigroup* model at linear space (WADS'11 citing Yao). The word-RAM's O(n)/O(1) RMQ escapes this because it returns an *index* computed via LCA, table lookup and bit tricks, not via min-combinations.
- **Worked example for the Disjoint Sparse Table (n=8, sum):** for query [2,5] (0-based), 2 = 010 and 5 = 101, so the highest differing bit is 2. Use level 2 with mid boundary 4: the answer is suffix[2..3] + prefix[4..5]. That is one addition, with no overlap.
- The tree analogue is the same story: path minima ≈ Yao/Alon–Schieber on trees, and the Cartesian tree of a tree gives O(1) in the RAM.

### Gaps

- The precise mapping of "k steps" to λ(k,n) values (for example, whether k=2 corresponds to n log n) was not checked in the Alon–Schieber text, so the n log n / n log log n / n log* n ladder above is an inference.
- Chazelle 1987's exact bounds and the wavelet-tree bounds were not retrieved.

---

## Q6. Parallel RMQ: PRAM (Berkman–Vishkin, Berkman–Schieber–Vishkin) and GPU (Euler-tour LCA, RTXRMQ)

### Takeaway

On the PRAM, RMQ and LCA preprocessing can be done in O(α(n)) time with optimal work on the CRCW PRAM, via Berkman–Vishkin's recursive *-tree. With a non-standard bit-write assumption it takes constant time. Berkman–Schieber–Vishkin build on all-nearest-smaller-values (ANSV). On GPUs, Euler-tour LCA (Polak et al.) is a strong baseline, and RTXRMQ (2024) maps RMQ to ray-tracing closest-hit queries on RT cores, which wins for small ranges.

### Cited Findings

- **Berkman–Vishkin (SICOMP 1993; FOCS 1989):** the recursive *-tree gives "O(α(n)) time … using an optimal number of processors on the (weakest) concurrent-read, concurrent-write parallel random-access machine (CRCW PRAM)". It runs in constant time with optimal processors if "an extremely small number of processors each can write simultaneously into different bits of the same word". Applications include LCA ("considerably simpler than the known algorithms"), restricted-domain merging and parentheses matching — [DOI✓ 10.1137/0222017](https://doi.org/10.1137/0222017) (abstract via OpenAlex)
- **Alon–Schieber:** all their sequential preprocessing algorithms "can be parallelized efficiently to give optimal parallel algorithms which run in O(log n) time on a CREW PRAM" — [arXiv 2406.06321](https://arxiv.org/abs/2406.06321)
- **GPU Euler-tour LCA:** Polak, Siwiec, Stobierski adapt the Euler-tour technique to GPUs for LCA and bridges. The theoretically optimal Euler-tour algorithms "outperform practical heuristics on hard instances" and match them on easy ones — [IPDPS 2021, DOI✓ 10.1109/IPDPS49936.2021.00032](https://doi.org/10.1109/IPDPS49936.2021.00032)
- **RTXRMQ:** array elements become triangles placed and shaped by value and position, so "the closest hit of a ray launched from a point given by the query parameters corresponds to the result of that query". It reaches up to 5× over HRMQ (CPU) and 2.3× over GPU LCA for small query ranges. For medium and large ranges GPU LCA wins, but RTXRMQ is still 2.5–4× faster than HRMQ, which the abstract calls "a highly parallel CPU approach" — [arXiv 2306.03282](https://arxiv.org/abs/2306.03282); [FGCS 157 (2024) 98–111, DOI✓ 10.1016/j.future.2024.03.040](https://doi.org/10.1016/j.future.2024.03.040)

#### Verified references (Q6)

- O. Berkman, U. Vishkin. "Recursive Star-Tree Parallel Data Structure." SIAM J. Comput. 22(2):221–242, 1993 [DOI✓ 10.1137/0222017](https://doi.org/10.1137/0222017). FOCS 1989, pp. 196–202 [DOI✓ 10.1109/SFCS.1989.63478](https://doi.org/10.1109/SFCS.1989.63478)
- O. Berkman, B. Schieber, U. Vishkin. "Optimal Doubly Logarithmic Parallel Algorithms Based on Finding All Nearest Smaller Values." J. Algorithms 14(3):344–370, 1993. [DOI✓ 10.1006/jagm.1993.1018](https://doi.org/10.1006/jagm.1993.1018)
- A. Polak, A. Siwiec, M. Stobierski. "Euler Meets GPU: Practical Graph Algorithms with Theoretical Guarantees." IPDPS 2021, pp. 233–244. [DOI✓ 10.1109/IPDPS49936.2021.00032](https://doi.org/10.1109/IPDPS49936.2021.00032)
- E. Meneses, C. A. Navarro, H. Ferrada, F. A. Quezada. "Accelerating range minimum queries with ray tracing cores." Future Generation Computer Systems 157:98–111, 2024. [DOI✓ 10.1016/j.future.2024.03.040](https://doi.org/10.1016/j.future.2024.03.040)
- Related CPU baseline: H. Ferrada, G. Navarro, "Improved Range Minimum Queries," DCC 2016, pp. 516–525 [DOI✓ 10.1109/DCC.2016.42](https://doi.org/10.1109/DCC.2016.42). Whether this is the "HRMQ" in RTXRMQ is **UNVERIFIED**.

### Inferences

- **Core idea, PRAM:** RMQ reduces to ANSV (each element's nearest smaller neighbours define the Cartesian tree), and ANSV and LCA admit doubly-logarithmic or α(n) CRCW algorithms. Hence Cartesian tree + LCA preprocessing parallelizes with optimal work.
- **Core idea, RTXRMQ, as a slide picture:** the x-axis is the index and depth is the value. A ray cast along the value axis over x ∈ [l, r] first hits the smallest-value triangle in that x-slab. The hardware BVH (bounding-volume hierarchy) traversal does the "min".

### Gaps

- Precise Berkman–Schieber–Vishkin RMQ bounds (the commonly cited O(log log n) time with n/log log n processors on CRCW) were not retrieved — **UNVERIFIED**.
- No 2025–2026 GPU RMQ follow-ups were found. The only nearby hit was a 2026 SSRN preprint by the same group on GPU convex-hull filtering, which is not RMQ.

---

## Q7. RMQ on compressed / grammar-compressed arrays

### Takeaway

If S is compressible, the 2n + o(n)-bit barrier can be beaten. RMQ can be answered in O(log n) time in space linear in either (a) an SLP grammar of S, or (b) a top-tree/DAG compression of S's **Cartesian tree**. Option (b) can be exponentially smaller, is never worse by more than an O(σ) factor, and can be worse by Ω(σ).

### Cited Findings

- Theorem 1.1: "Given a string S of length n and an SLP-grammar compression … there is a data structure of size O(|S|) [grammar size] that answers range minimum queries on S in O(log n) time" — [Gawrychowski, Jo, Mozes, Weimann, arXiv 1902.04427](https://arxiv.org/abs/1902.04427)
- Theorem 1.2 plus the greedy top-tree construction of Bille et al. (depth O(log n)) gives an O(|T|)-space structure answering RMQ in O(log n), where T is the top-tree compression of the Cartesian tree C — [arXiv 1902.04427](https://arxiv.org/abs/1902.04427)
- "Even if S is not compressible, its Cartesian tree necessarily is". Compressing the Cartesian tree "can be exponentially better than the former, is never worse by more than an O(σ) factor … and can in fact be worse by an Ω(σ) factor" — [arXiv 1902.04427](https://arxiv.org/abs/1902.04427); [SPIRE'18 abstract via Semantic Scholar](https://doi.org/10.1007/978-3-030-00479-8_17)
- Entropy-bounded RMQ: Fischer and Heun give an O(1)-time solution in O(nH_k) + o(n) bits (as summarized by Héliou et al.) — [HAL PDF](https://hal.science/hal-01255499v2/document). J. Fischer, V. Heun, H. M. Stühler, "Practical Entropy-Bounded Schemes for O(1)-Range Minimum Queries," DCC 2008, pp. 272–281 [DOI✓ 10.1109/DCC.2008.45](https://doi.org/10.1109/DCC.2008.45)
- Bounded-alphabet *encodings* (σ small) also see Q1: Jo & Satti 2025/2026 — [TCS 2026](https://doi.org/10.1016/j.tcs.2026.115824)

#### Verified references (Q7)

- **S. Jo, S. Mozes, O. Weimann**. "Compressed Range Minimum Queries." SPIRE 2018, LNCS 11147, pp. 206–217. [DOI✓ 10.1007/978-3-030-00479-8_17](https://doi.org/10.1007/978-3-030-00479-8_17). **Correction to the brief: the SPIRE version has 3 authors. Gawrychowski joins only in the journal version.**
- **P. Gawrychowski, S. Jo, S. Mozes, O. Weimann**. "Compressed range minimum queries." TCS 812:39–48, **2020** (online 2019). [DOI✓ 10.1016/j.tcs.2019.07.002](https://doi.org/10.1016/j.tcs.2019.07.002); [arXiv 1902.04427](https://arxiv.org/abs/1902.04427)

### Inferences

- **Core idea, for slides:** RMQ answers depend only on the Cartesian tree shape, not on the values. Repeated subtrees can be shared in a DAG, and a top tree makes navigation O(log n) deep. The LCA in the compressed tree is the answer.
- **Worked example:** S = (1 2)^{n/2} = 1,2,1,2,… The grammar is tiny (O(log n) rules). With ties broken leftmost, the Cartesian tree is a *right* spine of 1s, each 1 with a single 2-leaf as left child. Conversely, S = 1,2,3,…,n has n distinct symbols, so it is grammar-incompressible as a string, but its Cartesian tree is a bare path.
- Both trees are highly repetitive, but a *plain DAG* does not shrink a spine, because every spine subtree has a different size. Top-tree compression is what exploits such repetitive shapes. That is why GJMW use top trees; the polylog/O(log n)-size claim for paths is my inference, not quoted.

### Gaps

- The LNCS volume (11147) and exact TCS issue are **UNVERIFIED**; the DOIs are verified.
- Whether the query time can be improved below O(log n) at grammar-size space (lower bounds) was not checked.
