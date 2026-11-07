# Real-world applications of Range Minimum Query (RMQ) and a graded exercise list

Labels used throughout:
- **[GENUINE]**: RMQ (or the equivalent O(1) LCA on a tree) is a real algorithmic component in the cited work or code.
- **[GENUINE-LCA]**: the application needs LCA queries. RMQ via Euler tour is one standard way to answer them, but the cited system may use another LCA method.
- **[COUSIN]**: a closely related primitive (sliding-window min, nearest/previous smaller value, monotonic stack/deque) and not general RMQ.
- **[ANALOGY]**: only conceptually similar. Do not present it as an RMQ use.
- **UNVERIFIED**: I could not confirm it from a primary or official source during this research.

Citation metadata (authors, venue, volume, pages, year, DOI) for every paper below was checked against the Crossref API (`api.crossref.org/works/<DOI>`) unless it is marked otherwise. The "worked examples" are small illustrations I built myself and checked by running a script. They are not quoted from the papers.

---

## Q1. String processing and bioinformatics: SA + LCP + RMQ, LCE, compressed suffix trees, repeats, LZ, genome tools

### Takeaway
The core string application is solid and well documented. Build the suffix array (SA) and the LCP array, put an RMQ structure on LCP, and you get the longest common prefix of **any** two suffixes (the LCE query) in O(1). This is one of the two standard ways to answer LCE in constant time; the other is LCA on the suffix tree. LCE is the inner step of Landau–Vishkin k-mismatch/k-differences matching and of runs/tandem-repeat algorithms. Compressed suffix trees (Fischer–Mäkinen–Navarro 2009, CST++ 2010, the r-index-based CST of Gagie–Navarro–Prezza 2020) express suffix-tree navigation with RMQ, PSV and NSV over LCP. SDSL-lite ships these as real C++ classes.

### Cited Findings

**A. Foundations (the arrays RMQ runs on)**
- Suffix arrays: Udi Manber, Gene Myers, "Suffix Arrays: A New Method for On-Line String Searches", *SIAM J. Computing* 22(5):935–948, 1993. — [DOI 10.1137/0222058](https://doi.org/10.1137/0222058)
- Linear-time LCP construction: Toru Kasai, Gunho Lee, Hiroki Arimura, Setsuo Arikawa, Kunsoo Park, "Linear-Time Longest-Common-Prefix Computation in Suffix Arrays and Its Applications", CPM 2001, LNCS (vol. 2089), pp. 181–192. — [DOI 10.1007/3-540-48194-x_17](https://doi.org/10.1007/3-540-48194-x_17). (The LNCS volume number 2089 comes from my own knowledge. Crossref did not return a volume.)
- Enhanced suffix arrays (ESA): M. I. Abouelhoda, S. Kurtz, E. Ohlebusch, "Replacing suffix trees with enhanced suffix arrays", *J. Discrete Algorithms* 2:53–86, 2004. — [DOI 10.1016/S1570-8667(03)00065-0](https://doi.org/10.1016/S1570-8667(03)00065-0). An ESA is a suffix array plus an lcp table plus a child table (about 4n bytes). It gives a uniform framework for replacing bottom-up suffix-tree traversals. Stated applications: maximal, supermaximal and tandem repeats, maximal unique matches (MUMs), and the Ziv–Lempel decomposition. — [search summary of the paper PDF](https://hollywood.zbh.uni-hamburg.de/uploads/pubs/pdf/AboKurOhl2004.pdf). There is an earlier WABI 2002 version, "The Enhanced Suffix Array and Its Applications to Genome Analysis", LNCS pp. 449–463. — [DOI 10.1007/3-540-45784-4_35](https://doi.org/10.1007/3-540-45784-4_35)
- The RMQ theory these applications rely on:
  - Harel & Tarjan, "Fast Algorithms for Finding Nearest Common Ancestors", *SIAM J. Comput.* 13(2):338–355, 1984. — [DOI 10.1137/0213024](https://doi.org/10.1137/0213024)
  - Schieber & Vishkin, *SIAM J. Comput.* 17(6):1253–1262, 1988. — [DOI 10.1137/0217079](https://doi.org/10.1137/0217079)
  - Bender & Farach-Colton, "The LCA Problem Revisited", LATIN 2000, LNCS 1776, pp. 88–94. — [DOI 10.1007/10719839_9](https://doi.org/10.1007/10719839_9)
  - Fischer & Heun, "Space-Efficient Preprocessing Schemes for Range Minimum Queries on Static Arrays", *SIAM J. Comput.* 40(2):465–492, 2011. — [DOI 10.1137/090779759](https://doi.org/10.1137/090779759)
- Navarro's survey summarises the two results that string and document applications depend on. "Solution 5": linear space and preprocessing, O(1) query [Harel–Tarjan; Schieber–Vishkin; Berkman–Vishkin; Bender–Farach-Colton]. "Solution 6" [Fischer–Heun 2011]: 2n+o(n) bits, linear preprocessing, O(1) query, **without accessing the original array**, and this space is asymptotically optimal. — [Navarro 2014, arXiv 1304.6023, §2.3.2](https://arxiv.org/abs/1304.6023)

**B. LCE / LCP of two arbitrary suffixes [GENUINE]**
- Domain: string algorithms. Array: LCP[1..n] (LCP[i] = lcp of suffixes SA[i−1] and SA[i]). Query: for suffixes starting at text positions i and j, let r1 < r2 be their ranks (r = ISA[pos]). Then LCE(i, j) = min LCP[r1+1..r2] = RMQ on LCP.
- Ilie, Navarro & Tinta write that LCE "appears as a subproblem in many fundamental string problems". They add that the two known O(1)-per-query approaches use "constant-time computation of the Lowest Common Ancestor in trees or constant-time computation of Range Minimum Queries in arrays". They also show that simple direct-comparison LCE is faster in practice, and that this gives a Landau–Vishkin variant 13–20× faster than the original. — L. Ilie, G. Navarro, L. Tinta, "The longest common extension problem revisited and applications to approximate string searching", *J. Discrete Algorithms* 8(4):418–428, 2010, [DOI 10.1016/j.jda.2010.08.004](https://doi.org/10.1016/j.jda.2010.08.004); abstract read from [author PDF](https://www.dcc.uchile.cl/~gnavarro/ps/jda10.pdf)
- Pedagogical value: the same survey states that "the practically fastest algorithm to date computes RMQ on the longest [common prefix array]". It also states that the RMQ-based solution is more efficient in practice than the LCA-based one. — [Ilie–Navarro–Tinta PDF](https://www.dcc.uchile.cl/~gnavarro/ps/jda10.pdf)

**C. Approximate string matching (Landau–Vishkin) [GENUINE, via LCE]**
- G. M. Landau, U. Vishkin, "Efficient string matching with k mismatches", *Theoretical Computer Science* 43:239–249, 1986. — [DOI 10.1016/0304-3975(86)90178-7](https://doi.org/10.1016/0304-3975(86)90178-7)
- G. M. Landau, U. Vishkin, "Fast parallel and serial approximate string matching", *J. Algorithms* 10(2):157–169, 1989 (k-differences). Serial O(nk) for a fixed alphabet; parallel O(log m + k) time with n processors. — [DOI 10.1016/0196-6774(89)90010-2](https://doi.org/10.1016/0196-6774(89)90010-2); [abstract via Academia.edu listing](https://www.academia.edu/50538292/Fast_Parallel_and_Serial_Approximate_String_Matching)
- Landau's method was the first to combine suffix trees with LCA queries, using O(1) LCE "jumps" along diagonals. — [Wikipedia: Gad Landau](https://en.wikipedia.org/wiki/Gad_Landau); [Ilie–Navarro–Tinta 2010](https://www.dcc.uchile.cl/~gnavarro/ps/jda10.pdf). Later work replaced the suffix tree with a suffix array for the LCE queries to save space (de Castro Miranda & Ayala-Rincón, per the search summary). — [mat.unb.br PDF](https://mat.unb.br/ayala/sbs2005_lvsa.pdf)

**D. Compressed suffix trees (CST) [GENUINE]**
- Sadakane's CST: K. Sadakane, "Compressed Suffix Trees with Full Functionality", *Theory of Computing Systems* 41:589–607, 2007. — [DOI 10.1007/s00224-006-1198-x](https://doi.org/10.1007/s00224-006-1198-x). SDSL-lite's `cst_sada.hpp` is "an implementation of Sadakane's CST" and provides `lca(v, w)`. — [sdsl-lite/include/sdsl/cst_sada.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/cst_sada.hpp)
- J. Fischer, V. Mäkinen, G. Navarro, "Faster entropy-bounded compressed suffix trees", *Theoretical Computer Science* 410(51):5354–5364, 2009. — [DOI 10.1016/j.tcs.2009.09.012](https://doi.org/10.1016/j.tcs.2009.09.012). The abstract says the structure "totally gets rid of the suffix tree topology and expresses all the suffix tree operations using range minimum queries and a novel primitive called next/previous smaller value in a sequence". The conference version is "An(other) Entropy-Bounded Compressed Suffix Tree" (CPM 2008). — [Navarro abstract page](https://users.dcc.uchile.cl/~gnavarro/abstracts/tcs09.html)
- E. Ohlebusch, J. Fischer, S. Gog, "CST++", SPIRE 2010, LNCS 6393, pp. 322–333. — [DOI 10.1007/978-3-642-16321-0_34](https://doi.org/10.1007/978-3-642-16321-0_34). The abstract describes a new CST with O(1) navigation that is smaller than earlier CSTs, plus a practical LCP-array compression. — [SpringerProfessional listing](https://www.springerprofessional.de/en/cst/3383168)
- SDSL-lite source code (official):
  - `cst_sct3.hpp` is "the CST proposed by Ohlebusch and Gog" and references "Enno Ohlebusch, Johannes Fischer, Simon Gog". It defines `rmq(l, r)` as a "Range minimum query based on the rr_enclose method". Its `lca(v,w)` computes `min_index = rmq(v.i+1, w.j)`. — [cst_sct3.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/cst_sct3.hpp)
  - RMQ classes: `rmq_succinct_sct` (O(1) query, 2n+o(n) bits), `rmq_succinct_sada` (O(1) query, 4n+o(n) bits, after Sadakane), and `rmq_support_sparse_table` (O(1) query, citing "The LCA Problem Revisited"). There is also a `range_maximum_support_sparse_table` alias. — [rmq_support.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/rmq_support.hpp), [rmq_succinct_sct.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/rmq_succinct_sct.hpp), [rmq_succinct_sada.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/rmq_succinct_sada.hpp), [rmq_support_sparse_table.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/rmq_support_sparse_table.hpp)
  - Library paper: S. Gog, T. Beller, A. Moffat, M. Petri, "From Theory to Practice: Plug and Play with Succinct Data Structures", SEA 2014, LNCS pp. 326–337. — [DOI 10.1007/978-3-319-07959-2_28](https://doi.org/10.1007/978-3-319-07959-2_28); [GitHub README](https://github.com/simongog/sdsl-lite)
- r-index / BWT-runs-bounded suffix trees: T. Gagie, G. Navarro, N. Prezza, "Fully Functional Suffix Trees and Optimal Text Searching in BWT-Runs Bounded Space", *J. ACM* 67(1):1–54, 2020 (partial version at SODA 2018). — [DOI 10.1145/3375890](https://doi.org/10.1145/3375890). Section 6 ("A Run-Length Compressed Suffix Tree") builds on Fischer et al.'s CST representation. Its primitives are SA/ISA access, LCP access, and "three special queries on LCP: (a) Range Minimum Query RMQ(i,j) = arg min LCP[k]", PSV and NSV. The paper also reports fixing a bug in an RMQ-based formula from Fischer et al. — [arXiv 1809.02792 full text, §6.1](https://arxiv.org/abs/1809.02792) (I read it myself: "RMQ" occurs 35 times)

**E. Repeats, runs, tandem repeats [GENUINE via LCE in modern algorithms; classical ones use other LCE tools]**
- M. G. Main, R. J. Lorentz, "An O(n log n) algorithm for finding all repetitions in a string", *J. Algorithms* 5(3):422–432, 1984. — [DOI 10.1016/0196-6774(84)90021-X](https://doi.org/10.1016/0196-6774(84)90021-X)
- R. Kolpakov, G. Kucherov, "Finding maximal repetitions in a word in linear time", FOCS 1999, pp. 596–604. — [DOI 10.1109/SFFCS.1999.814634](https://doi.org/10.1109/SFFCS.1999.814634)
- H. Bannai, T. I, S. Inenaga, Y. Nakashima, M. Takeda, K. Tsuruta, "The 'Runs' Theorem", *SIAM J. Comput.* 46(5):1501–1514, 2017 (SODA 2015 version; arXiv 1406.0263). — [DOI 10.1137/15M1011032](https://doi.org/10.1137/15M1011032). The linear-time runs algorithm reduces to Θ(n) LCE queries. Per Kosolobov's restatement of their Lemma 1, if O(n) LCE queries can be answered online in O(f(n)) total, all runs are found in O(n + f(n)). — [arXiv 2102.08670 (Ellert & Fischer)](https://arxiv.org/abs/2102.08670); [arXiv 1406.0263](https://arxiv.org/abs/1406.0263)
- ESA (Abouelhoda et al. 2004) lists tandem repeats and maximal/supermaximal repeats among its applications. Those are computed by LCP-interval traversal, not necessarily by RMQ. — [AboKurOhl2004.pdf](https://hollywood.zbh.uni-hamburg.de/uploads/pubs/pdf/AboKurOhl2004.pdf)

**F. Lempel–Ziv factorization [GENUINE for ESA; COUSIN (PSV/NSV) for the fast LPF-based methods]**
- The ESA paper shows how to compute the Ziv–Lempel decomposition. — [AboKurOhl2004.pdf (search summary)](https://hollywood.zbh.uni-hamburg.de/uploads/pubs/pdf/AboKurOhl2004.pdf)
- M. Crochemore, L. Ilie, "Computing Longest Previous Factor in linear time and applications", *Information Processing Letters* 106(2):75–80, 2008. — [DOI 10.1016/j.ipl.2007.10.006](https://doi.org/10.1016/j.ipl.2007.10.006)
- J. Kärkkäinen, D. Kempa, S. J. Puglisi, "Linear Time Lempel-Ziv Factorization: Simple, Fast, Small", CPM 2013, LNCS pp. 189–200. — [DOI 10.1007/978-3-642-38905-4_19](https://doi.org/10.1007/978-3-642-38905-4_19)
- (Only the citation metadata of the last two was verified. My memory says they use previous/next-smaller-value (PSV/NSV) over SA together with LCP, but I did not check the internals. Treat that detail as **UNVERIFIED**.)

**G. Genome tools: what actually uses RMQ**
- Verified: SDSL-lite CSTs (`cst_sct3`, `cst_sada`) and its RMQ classes (above). SDSL is a library that bioinformatics tools build on.
- Checked and negative: `andi` (alignment-free phylogeny, Haubold et al.) implements an ESA in `src/esa.c` with "lcp-intervals" and an lcp-cache. `grep` for "rmq"/"range minimum" in that file found nothing. So andi is an ESA user but **not** an explicit RMQ user. — [andi/src/esa.c](https://github.com/evolbioinf/andi/blob/master/src/esa.c)
- MUMmer (3/4), essaMEM, sparseMEM: **UNVERIFIED** whether they use RMQ. I found no source, so do not claim it in the seminar.

### Inferences
- Worked example (constructed, script-verified). S = `banana$`. SA = [6,5,3,1,0,4,2] (suffixes `$`, `a$`, `ana$`, `anana$`, `banana$`, `na$`, `nana$`), and LCP = [–,0,1,3,0,0,2].
  - LCE(5,1) (`a$` vs `anana$`): ranks 1 and 3, so min(LCP[2..3]) = min(1,3) = 1, giving "a".
  - LCE(3,1): ranks 2 and 3, so LCP[3] = 3, giving "ana".
  - LCE(1,4): ranks 3 and 5, so min(0,0) = 0.
  - This is a simple slide to show "RMQ on LCP = LCP of any two suffixes".
- Worked example idea for k-mismatch (Landau–Vishkin style). Build SA+LCP+RMQ on T#P. For each alignment position i, call LCE(i, start of P) to jump to the next mismatch, skip it, and repeat at most k+1 times. That gives O(nk) total after linear preprocessing. Example: T = `abcabd`, P = `abd`, k = 1. Alignment 0 matches `ab`, then mismatches `c`/`d`, then the pattern ends, so there is 1 mismatch and the alignment is reported. Alignment 3 matches exactly.
- A good teaching contrast: the theoretical O(1) RMQ is what gives the O(nk) bound. Ilie–Navarro–Tinta, however, show that direct comparison beats it in practice on typical inputs. This is a nice "theory vs. practice" slide.

### Gaps
- I could not access Kasai et al.'s full text (Springer paywall). That their stated applications include simulating bottom-up suffix-tree traversal comes from my memory and is UNVERIFIED.
- Whether Abouelhoda et al. 2004 explicitly uses an RMQ structure, or only lcp-intervals plus the child table, is UNVERIFIED. The child table is their mechanism for top-down and child navigation.
- Kolpakov–Kucherov and Main–Lorentz internals (which LCE mechanism they use) were not read. Only the citations were verified.
- No verified evidence of RMQ inside MUMmer or other mainstream aligners (BWA, Bowtie).

---

## Q2. Document retrieval (Muthukrishnan 2002; Sadakane 2007; Navarro 2014 survey)

### Takeaway
This is the cleanest "RMQ as a genuine component" application. Muthukrishnan's optimal document listing runs RMQ over the **predecessor array** L of the **document array** C. Sadakane made it succinct by using an RMQ that never accesses L plus a bitmap. Navarro's ACM Computing Surveys paper describes both precisely and gives a worked example you can reuse on a slide.

### Cited Findings
- S. Muthukrishnan, "Efficient algorithms for document retrieval problems", Proc. 13th ACM-SIAM SODA, pp. 657–666, 2002. These details come from the bibliography of [Navarro 2014](https://arxiv.org/abs/1304.6023) and from [arXiv 1211.5353](https://arxiv.org/abs/1211.5353). I did not find a DOI; Crossref search did not return it.
- K. Sadakane, "Succinct data structures for flexible text retrieval systems", *J. Discrete Algorithms* 5(1):12–22, 2007. — [DOI 10.1016/j.jda.2006.03.011](https://doi.org/10.1016/j.jda.2006.03.011)
- G. Navarro, "Spaces, Trees, and Colors: The Algorithmic Landscape of Document Retrieval on Sequences", *ACM Computing Surveys* 46(4), Article 52, 47 pp., 2014. — [DOI 10.1145/2535933](https://doi.org/10.1145/2535933); [arXiv 1304.6023](https://arxiv.org/abs/1304.6023)
- The arrays, quoted from Navarro §4:
  - Document array: "C[i] contains … the number of the document suffix A[i] belongs to", where A is the suffix array of the concatenated collection.
  - Predecessors array: L[i] = max{j < i : C[j] = C[i]} ∪ {0}.
  - Problem ("color listing"): output the distinct values in C[sp, ep], where [sp, ep] is the SA interval of the pattern. — [Navarro 2014 §4](https://arxiv.org/abs/1304.6023)
- The algorithm (Navarro's description of Muthukrishnan's method): "It first finds p = rmq_L(i, j). If L[p] < sp, then C[p] is a new distinct color … reported immediately. Then we continue recursively with [i, p−1] and [p+1, j]. If, instead, L[p] ≥ sp … we terminate the recursion." The recursion tree has about 2× as many nodes as reported colors, so the method is optimal and real-time. It "incrementally build[s] the top part of the Cartesian tree of L[sp, ep]". Result: document listing in O(m + docc) time and O(n lg n) bits ("Solution 8"). — [Navarro 2014 §4](https://arxiv.org/abs/1304.6023)
- Worked example in the survey (reusable on a slide). Color listing on C[11..16]:
  1. rmq_L(11,16) = 12, and L[12] = 7 < 11, so report color 4.
  2. On the left, L[11] = 8 < 11, so report color 1.
  3. On the right, rmq_L(13,16) = 14, and L[14] = 9 < 11, so report color 3.
  4. L[13] = 12 ≥ 11 and L[16] = 11 ≥ 11 stop the recursion. L[15] is never examined.
  - The survey's running example uses syllable texts T1 = "mi ma ma", T2 = "la ma la", … — [Navarro 2014, §4 example & Fig. 4](https://arxiv.org/abs/1304.6023)
- Sadakane 2007 (succinct version):
  - Replaces the suffix tree with a compressed suffix array (CSA).
  - Uses "the first RMQ solution that did not need to access L" (4n+o(n) bits; Fischer–Heun later achieved the optimal 2n+o(n)).
  - Replaces the test L[p] < sp with a bitmap V[1..D]. Navarro notes this is correct only if the left subinterval is processed before the right.
  - Result: |CSA| + O(n) bits instead of O(n lg n). — [Navarro 2014 §5](https://arxiv.org/abs/1304.6023)
- Further RMQ uses in the same line of work:
  - Sadakane also builds a range-**maximum** structure over the successor array to find the rightmost occurrence of each document. This is used for term frequency.
  - Hon, Shah & Vitter (FOCS 2009, pp. 713–722) reduce the extra space to o(n) by building the RMQ on block minima L′[1, n/b]. — [Navarro 2014 §5](https://arxiv.org/abs/1304.6023)

### Inferences
- Teaching angle for a Vietnamese CP audience: color listing is exactly the CP problem "list the distinct values in a[l..r] in O(#distinct)". Precompute prev[i] (last index with the same value) and recurse on argmin prev in [l, r] while prev < l. It connects nicely to the "number of distinct values in a range" problems they already know (offline BIT / Mo's).
- Domain mapping for slides:
  - Domain: search engines and bioinformatics (genome collections).
  - Array: L (previous occurrence of the same document id, in SA order).
  - Query: "which documents contain pattern P?"
  - Source: Muthukrishnan 2002 / Navarro 2014.

### Gaps
- No DOI was found for Muthukrishnan's SODA 2002 paper (the ACM DL lists SODA papers under 10.5555/… identifiers, which I did not verify). I did not read the original paper; its content comes from Navarro's survey.
- Navarro's "Practical compact indexes for top-k document retrieval" (with Gog, Konow, Petri et al.) was not checked.

---

## Q3. Trees and graphs: LCA via Euler tour + RMQ, and where LCA is used in practice

### Takeaway
LCA ↔ RMQ is a two-way reduction:
- Berkman–Vishkin: Euler tour plus a depth array (a ±1 RMQ instance).
- Gabow–Bentley–Tarjan: the Cartesian tree turns RMQ back into LCA.
- Bender–Farach-Colton made the whole chain practical.

Real uses of LCA include gene-tree/species-tree reconciliation (LCA mapping), XML keyword search (SLCA semantics), and suffix-tree LCE (Q1). Most of those systems need *an* LCA oracle; RMQ is the implementation you would teach, not necessarily the one the authors used. `git merge-base` is a DAG "best common ancestor" problem and should only be mentioned as an analogy.

### Cited Findings
- History and reductions, quoted from Navarro 2014 Appendix A:
  - Harel–Tarjan 1984 first gave O(1) LCA after linear preprocessing, but the method "was quite complicated".
  - Berkman & Vishkin 1993: "if one traverses the tree in preorder and writes down the depths of the touched nodes in an array, then the LCA problem on the tree becomes an RMQ problem on the array of depths". The array has consecutive entries differing by ±1.
  - Gabow et al. 1984 showed the converse via Cartesian trees [Vuillemin 1980]: "rmq_L(sp, ep) corresponds to the LCA of the nodes corresponding to array positions i and j of the Cartesian tree of L".
  - Bender & Farach-Colton 2000 simplified everything "up to a point that the solution was considered to be practical", using a sparse table over power-of-two intervals plus blocking. — [Navarro 2014 App. A](https://arxiv.org/abs/1304.6023)
  - Citations:
    - Berkman & Vishkin, "Recursive star-tree parallel data structure", *SIAM J. Comput.* 22(2):221–242, 1993 (from Navarro's bibliography).
    - Gabow, Bentley, Tarjan, "Scaling and related techniques for geometry problems", STOC 1984, pp. 135–143. — [DOI 10.1145/800057.808675](https://doi.org/10.1145/800057.808675)
    - Vuillemin, "A unifying look at data structures", *CACM* 23(4):229–239, 1980. — [DOI 10.1145/358841.358852](https://doi.org/10.1145/358841.358852)
- LCA in DAGs (relevant to the git analogy): M. A. Bender, M. Farach-Colton, G. Pemmasani, S. Skiena, P. Sumazin, "Lowest common ancestors in trees and directed acyclic graphs", *J. Algorithms* 57(2):75–94, 2005. — [DOI 10.1016/j.jalgor.2005.08.001](https://doi.org/10.1016/j.jalgor.2005.08.001). Content not read; citation only.
- **Phylogenetics / comparative genomics [GENUINE-LCA]:**
  - C. M. Zmasek, S. R. Eddy, "A simple algorithm to infer gene duplication and speciation events on a gene tree", *Bioinformatics* 17(9):821–828, 2001. — [DOI 10.1093/bioinformatics/17.9.821](https://doi.org/10.1093/bioinformatics/17.9.821)
  - Follow-up literature describes the "lca-mapping", "which maps every node in the gene tree to the most recent node in the species tree that could have contained the ancestral gene". In it, "a node in the gene tree represents a duplication if it has a child with the same lca-mapping". — [secondary sources via search, e.g. PMC3044269](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3044269/)
  - Slide mapping:
    - Array RMQ runs on: the depth array of the Euler tour of the **species** tree.
    - Query: M(g) = LCA(M(left child), M(right child)), computed bottom-up over the gene tree.
    - Cost: one LCA per gene-tree node, so O(|G|) after O(|S| log |S|) or O(|S|) preprocessing.
- **XML keyword search [GENUINE-LCA, but NOT RMQ]:**
  - Y. Xu, Y. Papakonstantinou, "Efficient keyword search for smallest LCAs in XML databases", SIGMOD 2005, pp. 527–538. — [DOI 10.1145/1066157.1066217](https://doi.org/10.1145/1066157.1066217)
  - Answers are the roots of the smallest subtrees containing all keywords (SLCA). The algorithms are Indexed Lookup Eager and Scan Eager, implemented in XKSearch.
  - The paper uses **Dewey numbers**, which "provide a straightforward solution to locating the LCA of two nodes". The LCA is the longest common prefix of the Dewey labels, so no RMQ is used. — [paper PDF (UCSD course copy)](https://cseweb.ucsd.edu/classes/wi19/cse232B-a/papers/xu-lca.pdf)
- **Version control [ANALOGY only]:** the git documentation says "git merge-base finds the best common ancestor(s) between two commits to use in a three-way merge… there can be more than one merge base for a pair of commits", and "when the history involves criss-cross merges, there can be more than one best common ancestor". Commit history is a DAG, so the tree LCA/RMQ reduction does not apply directly. — [git-merge-base docs](https://git-scm.com/docs/git-merge-base)
- **Suffix-tree LCA = LCE** (see Q1). SDSL `cst_sct3::lca` is literally `rmq` over LCP. — [cst_sct3.hpp](https://github.com/simongog/sdsl-lite/blob/master/include/sdsl/cst_sct3.hpp)
- Vietnamese teaching resources on LCA:
  - VNOI Wiki "Các phương pháp giải bài toán LCA" (author: Khúc Anh Tuấn) covers "Cách 1 – Sparse Table" (ancestor jump table) and "Cách 2 – Euler Tour + Interval Tree". It says LCA can be converted to RMQ and links the prerequisite article "Bài toán RMQ và bài toán LCA". — [wiki.vnoi.info/algo/data-structures/lca](https://wiki.vnoi.info/algo/data-structures/lca)
  - The prerequisite article "Bài toán RMQ và bài toán LCA" is a translation of the TopCoder tutorial. — [wiki.vnoi.info/translate/topcoder/Range-Minimum-Query-and-Lowest-Common-Ancestor](https://wiki.vnoi.info/translate/topcoder/Range-Minimum-Query-and-Lowest-Common-Ancestor)
  - "Lowest Common Ancestor (LCA) - Binary Lifting". VNOI's announcement says that besides "Euler Tour + RMQ", binary lifting is also efficient. — [wiki.vnoi.info/algo/data-structures/lca-binlift](https://wiki.vnoi.info/algo/data-structures/lca-binlift); [VNOJ blog post](https://oj.vnoi.info/user/dquynh_2811/blog/8)
  - "Đường đi Euler trên cây". — [wiki.vnoi.info/algo/graph-theory/euler-tour-on-tree](https://wiki.vnoi.info/algo/graph-theory/euler-tour-on-tree)

### Inferences
- Worked example (constructed, script-verified). Tree: 0→{1,2}, 1→{3,4}, 2→{5}.
  - Euler tour E = [0,1,3,1,4,1,0,2,5,2,0], depths D = [0,1,2,1,2,1,0,1,2,1,0], first = {0:0, 1:1, 3:2, 4:4, 2:7, 5:8}.
  - LCA(3,4): argmin D[2..4] gives E[3] = 1.
  - LCA(4,5): argmin D[4..8] gives E[6] = 0.
  - LCA(3,1): D[1..2] gives 1.
- Tree distance (CSES 1135, ABC014 D): dist(u,v) = depth[u] + depth[v] − 2·depth[LCA(u,v)]. This is the standard CP application slide.
- Pedagogical warning worth a slide: Euler-tour RMQ gives the LCA but **not** path aggregates such as min/max edge on a path (SPOJ DISQUERY, VNOJ LUBENICA). Those need binary lifting with min/max tables, or HLD plus a sparse table or segment tree.
- Network routing and labeling schemes: I found no specific citation in this pass (see Gaps).

### Gaps
- Robinson–Foulds distance and tree consensus via LCA: I found no citation showing RMQ/LCA as a component (Day's 1985 algorithm uses other techniques). Omit, or mark UNVERIFIED.
- LCA-based distance labeling schemes for network routing (e.g., Peleg, Gavoille et al.): not researched/verified in this pass.
- Whether Zmasek–Eddy's own implementation uses an O(1) LCA (RMQ) or naive climbing: UNVERIFIED (their full text was not read).

---

## Q4. Computational geometry and other domains: Cartesian tree / ANSV, histogram, image min/max filters, time series, OLAP, streaming

### Takeaway
- **[GENUINE]**: the Cartesian tree reduction and its parallel ANSV relative are genuine theory components. OLAP range-MAX (Ho et al. 1997) is a genuine database use of range-max precomputation, using a hierarchical tree rather than a sparse table.
- **[COUSIN]**: image morphology (erosion/dilation = min/max filter, van Herk / Gil–Werman) and streaming time-series min/max (Lemire) are sliding-window min/max. That is a fixed-width RMQ special case solved by block prefix/suffix minima or monotonic deques. Label it as such.
- **[COUSIN] or [GENUINE]**: the largest rectangle in a histogram is a classic that admits both an O(n) stack solution and an RMQ divide-and-conquer solution.

### Cited Findings
- **Cartesian tree, RMQ ↔ LCA [GENUINE]:** Vuillemin 1980 [DOI](https://doi.org/10.1145/358841.358852); Gabow–Bentley–Tarjan STOC 1984 [DOI](https://doi.org/10.1145/800057.808675). The reduction is described in [Navarro 2014 App. A](https://arxiv.org/abs/1304.6023).
- **All Nearest Smaller Values (ANSV):** O. Berkman, B. Schieber, U. Vishkin, "Optimal Doubly Logarithmic Parallel Algorithms Based On Finding All Nearest Smaller Values", *J. Algorithms* 14(3):344–370, 1993. — [DOI 10.1006/jagm.1993.1018](https://doi.org/10.1006/jagm.1993.1018). The specific geometric applications in that paper (e.g., monotone polygon triangulation, parenthesis matching) come from memory and are UNVERIFIED.
- **Largest rectangle in histogram:** LeetCode #84 "Largest Rectangle in Histogram" (Hard). LeetCode's own topic tags are Array, Stack, Monotonic Stack, **Range Minimum/Maximum Query**. — [leetcode.com/problems/largest-rectangle-in-histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) (tags read via LeetCode GraphQL)
- **Image processing (grayscale morphology) [COUSIN: fixed-window RMQ]:**
  - M. van Herk, "A fast algorithm for local minimum and maximum filters on rectangular and octagonal kernels", *Pattern Recognition Letters* 13(7):517–521, 1992. — [DOI 10.1016/0167-8655(92)90069-C](https://doi.org/10.1016/0167-8655(92)90069-C)
  - J. Gil, M. Werman, "Computing 2-D min, median, and max filters", *IEEE TPAMI* 15(5):504–507, 1993. — [DOI 10.1109/34.211471](https://doi.org/10.1109/34.211471)
  - The two were developed independently, and the method is known as the van Herk/Gil–Werman (HGW) algorithm. — [Gil & Kimmel, "Efficient Dilation, Erosion, Opening, and Closing Algorithms", IEEE TPAMI 2002, PDF](https://www.cs.technion.ac.il/wp-content/ron-kimmel/papers/EfficientMorphology_KimmelGil_PAMI_2002.pdf) (citation details of the Gil–Kimmel paper not Crossref-checked)
  - Leptonica's grayscale morphology module cites Gil & Werman (PAMI 15(5) 504–507). — [Image::Leptonica graymorphlow docs](https://v1.metacpan.org/pod/Image::Leptonica::Func::graymorphlow)
- **Time series / signal processing [COUSIN]:**
  - D. Lemire, "Streaming Maximum-Minimum Filter Using No More than Three Comparisons per Element", *Nordic Journal of Computing* 13(4):328–339, 2006. — [arXiv cs/0610046](https://arxiv.org/abs/cs/0610046)
  - The paper gives at most 3 comparisons per element in the worst case (2 for monotonic input) and proves a lower bound of 2 with no latency.
  - The GNU Scientific Library `movstat` module cites it for its moving min/max code. — [search summary incl. GSL mmacc.c](https://git.stg.centos.org/source-git/gsl/blob/15b3efacc3996773c6bfc682d3529e35c567aa45/f/movstat/mmacc.c)
  - LeetCode #239 "Sliding Window Maximum" (Hard) is tagged Queue, Sliding Window, Heap, **Monotonic Queue**, **Range Minimum/Maximum Query**. — [leetcode.com/problems/sliding-window-maximum](https://leetcode.com/problems/sliding-window-maximum/)
- **Databases / OLAP [GENUINE range-MAX]:**
  - C.-T. Ho, R. Agrawal, N. Megiddo, R. Srikant, "Range queries in OLAP data cubes", SIGMOD 1997, pp. 73–88. — [DOI 10.1145/253260.253274](https://doi.org/10.1145/253260.253274)
  - The paper gives fast algorithms for range **SUM** (prefix-sum cube with an auxiliary array of the same size as the cube, O(1) per query) and range **MAX** (precomputed max over balanced hierarchical tree structures plus a branch-and-bound-like search). — [SIGMOD Record listing / search summary](https://sigmodrecord.org/1997/06/15/range-queries-in-olap-data-cubes/)
  - Caution: an IBM Research page with the same title lists different authors (Alon & Megiddo, JACM). This looks like a metadata error; Crossref confirms the four authors above.
- **2D generalisation:** the VNOI Wiki RMQ article has a "Sparse Table 2D" section. Its worked problem is CodeChef CHSQARR "Chef and Rectangle Array" (2D range max over sub-rectangles). — [wiki.vnoi.info/algo/data-structures/rmq](https://wiki.vnoi.info/algo/data-structures/rmq); [codechef.com/problems/CHSQARR](https://www.codechef.com/problems/CHSQARR)

### Inferences
- Worked example (constructed, script-verified): histogram h = [2,1,5,6,2,3], answer 10.
  - RMQ divide and conquer: the min of the whole range is 1 at index 1, giving area 1·6 = 6. Recurse on [5,6,2,3], whose min is 2, giving 2·4 = 8. Recurse on [5,6], whose min is 5, giving 5·2 = 10, the best.
  - With an O(1) RMQ, each recursion node costs O(1), so the total is O(n) after preprocessing. The monotonic-stack solution is O(n) with no preprocessing.
  - Good slide: the same problem solved by "RMQ" and by its "cousin".
- Image erosion mapping:
  - Array: one image row (then each column, for a separable rectangular structuring element).
  - Query: min over the window [x−r, x+r] (erosion; max gives dilation).
  - HGW splits the row into blocks of size w = 2r+1 and stores prefix-min and suffix-min per block, so any window equals suffix-min of one block combined with prefix-min of the next. That is a sparse-table-like "two overlapping pieces" trick. (This description of HGW internals is from my knowledge; the papers themselves were not read.)
- OLAP mapping: array = a measure along one dimension of the cube (generalised to d dimensions); query = MAX over a hyper-rectangle. A good bridge to "2D sparse table" in CP.

### Gaps
- Network monitoring / streaming sliding-window min/max in routers (e.g., Datar–Gionis–Indyk–Motwani style sliding-window statistics): I found no primary source showing min/max specifically. Treat as a gap or rely on Lemire as the streaming reference.
- Scheduling applications of RMQ: no source found. Omit.
- Stock-price "range min/max" queries: commonly cited informally, but I found no authoritative source. Present as an illustrative example only.

---

## Q5. Graded exercise list (with links, best technique, expected complexity)

### Takeaway
Every problem below was checked to exist with the stated title:
- CSES: problem-set page.
- Codeforces: official API (`/api/problemset.problems`, with rating and tags).
- VNOJ: page titles and statement headers.
- AtCoder: task pages.
- LeetCode: GraphQL.
- SPOJ: search-engine snapshots, because SPOJ blocked direct fetches with 403 / Cloudflare.

Two items from the original brief are **not** RMQ problems:
- VNOJ **LQDDIV** ("Phân tập", tag "Chia đôi tập" = meet-in-the-middle, N ≤ 32).
- Codeforces **870B** "Maximum of Maximums of Minimums" (rating 1200, tag greedy only; 872B is not a listed problemset ID).

Drop both from an RMQ exercise list.

### Cited Findings

**Level 1 — Direct RMQ (static / dynamic)**

| # | Problem | Link | What it asks | Best technique, complexity |
|---|---|---|---|---|
| 1 | CSES 1647 Static Range Minimum Queries (section "Range Queries") | [cses.fi/problemset/task/1647](https://cses.fi/problemset/task/1647) | static range min | Sparse table, O(n log n) build, O(1) query |
| 2 | SPOJ RMQSQ "Range Minimum Query" | [spoj.com/problems/RMQSQ](https://www.spoj.com/problems/RMQSQ/) | N ≤ 100,000 numbers, Q queries min on [i, j], 0-indexed ([search snapshot](https://spoj.com/problems/RMQSQ)) | Sparse table O(1) per query; segment tree or sqrt also pass |
| 3 | Library Checker "Static RMQ" (listed in the VNOI Wiki RMQ exercises) | [judge.yosupo.jp/problem/staticrmq](https://judge.yosupo.jp/problem/staticrmq) | static RMQ, large input (constraints UNVERIFIED) | Sparse table, or ⟨O(n), O(1)⟩ block + Cartesian-tree methods for speed |
| 4 | VNOJ NKLINEUP "Xếp hàng" | [oj.vnoi.info/problem/nklineup](https://oj.vnoi.info/problem/nklineup) | N ≤ 50,000 cows, Q ≤ 200,000 queries for max − min of heights on [A, B] | Two sparse tables (max, min), O(N log N + Q) |
| 5 | CodeChef FRMQ "Chef and Array" (VNOI Wiki list) | [codechef.com/problems/FRMQ](https://www.codechef.com/problems/FRMQ) | range max with generated queries (details UNVERIFIED) | Sparse table O(1) per query |
| 6 | CSES 1649 Dynamic Range Minimum Queries | [cses.fi/problemset/task/1649](https://cses.fi/problemset/task/1649) | point update + range min | Segment tree, O(log n) per operation (a sparse table does not support updates) |
| 7 | AtCoder Library Practice J "Segment Tree" | [atcoder.jp/contests/practice2/tasks/practice2_j](https://atcoder.jp/contests/practice2/tasks/practice2_j) | point update, range max, max_right (first index where a condition holds) | ACL segtree, O(log n) per operation |

**Level 2 — RMQ cousins: sliding window, monotonic stack/deque, offline RMQ**

| # | Problem | Link | What it asks | Best technique, complexity |
|---|---|---|---|---|
| 8 | CSES 1645 Nearest Smaller Values ("Sorting and Searching") | [cses.fi/problemset/task/1645](https://cses.fi/problemset/task/1645) | for each i, nearest j < i with a[j] < a[i] | Monotonic stack, O(n) (the ANSV primitive) |
| 9 | VNOJ MINK "Huyền thoại Lục Vân Tiên" | [oj.vnoi.info/problem/mink](https://oj.vnoi.info/problem/mink) | min of every window of K consecutive values, N ≤ 17,000, T test cases | Monotonic deque O(N) per test; sparse table O(N log N) also fine |
| 10 | LeetCode 239 Sliding Window Maximum (Hard) | [leetcode.com/problems/sliding-window-maximum](https://leetcode.com/problems/sliding-window-maximum/) | max of each window of size k | Monotonic deque O(n) |
| 11 | LeetCode 84 Largest Rectangle in Histogram (Hard) | [leetcode.com/problems/largest-rectangle-in-histogram](https://leetcode.com/problems/largest-rectangle-in-histogram/) | max rectangle area | Monotonic stack O(n); alternative is RMQ divide and conquer |
| 12 | VNOJ QBRECT "Hình chữ nhật 0 1" | [oj.vnoi.info/problem/qbrect](https://oj.vnoi.info/problem/qbrect) | title verified; content assumed to be largest all-1 sub-rectangle (UNVERIFIED) | Per-row histogram + stack, O(mn) |
| 13 | VNOJ QMAX "Giá trị lớn nhất" | [oj.vnoi.info/problem/qmax](https://oj.vnoi.info/problem/qmax) | n, m, p ≤ 50,000: all m range-add updates come first, then p range-max queries | Offline: difference array, then static sparse table, O(n log n + m + p) |
| 14 | VNOJ QMAX2 "Giá trị lớn nhất ver2" | [oj.vnoi.info/problem/qmax2](https://oj.vnoi.info/problem/qmax2) | interleaved range add and range max (tag: Segment Tree) | Lazy segment tree, O(log n) per operation |
| 15 | Codeforces 52C Circular RMQ (2200) | [codeforces.com/problemset/problem/52/C](https://codeforces.com/problemset/problem/52/C) | range add and range min on a circular array | Lazy segment tree; split a wrapped range into two |

**Level 3 — RMQ combined with binary search / two pointers / DP**

| # | Problem | Link | Technique, complexity |
|---|---|---|---|
| 16 | CF 5C Longest Regular Bracket Sequence (1900; listed by the VNOI Wiki) | [codeforces.com/problemset/problem/5/C](https://codeforces.com/problemset/problem/5/C) | Prefix balance + RMQ + binary search for the farthest r, O(n log n); stack O(n) also works |
| 17 | CF 514D R2D2 and Droid Army (2000) | [codeforces.com/problemset/problem/514/D](https://codeforces.com/problemset/problem/514/D) | Two pointers + m sparse tables (range max per weapon type), O(nm log n) |
| 18 | CF 359D Pair of Numbers (2000) | [codeforces.com/problemset/problem/359/D](https://codeforces.com/problemset/problem/359/D) | Sparse tables for min and gcd (both idempotent) + binary search on length |
| 19 | CF 475D CGCDSSQ (2000; VNOI Wiki list) | [codeforces.com/problemset/problem/475/D](https://codeforces.com/problemset/problem/475/D) | GCD sparse table + binary search for the O(log A) gcd change points per left end |
| 20 | CF 487B Strip (2000; VNOI Wiki list) | [codeforces.com/problemset/problem/487/B](https://codeforces.com/problemset/problem/487/B) | DP + range max−min check (sparse table or deque) + two pointers |
| 21 | CF 689D Friends and Subsequences (2100) | [codeforces.com/problemset/problem/689/D](https://codeforces.com/problemset/problem/689/D) | Count (l, r) with max a = min b: two sparse tables + binary search per l, O(n log n) |
| 22 | CF 1454F Array Partition (2100; VNOI Wiki list) | [codeforces.com/problemset/problem/1454/F](https://codeforces.com/problemset/problem/1454/F) | Sparse table + binary search over the middle segment |
| 23 | VNOJ AVLBIT "Dãy cấp số cộng" (VNOJ tag "Range Minimum Query"; VNOI Wiki list) | [oj.vnoi.info/problem/avlbit](https://oj.vnoi.info/problem/avlbit) | Exact statement UNVERIFIED (arithmetic-progression segments + RMQ) |

**Level 4 — LCA (Euler tour + RMQ) and tree paths**

| # | Problem | Link | Technique, complexity |
|---|---|---|---|
| 24 | CSES 1688 Company Queries II ("Tree Algorithms") | [cses.fi/problemset/task/1688](https://cses.fi/problemset/task/1688) | LCA of two employees: Euler tour + sparse table, O(n log n) build, O(1) query |
| 25 | CSES 1135 Distance Queries | [cses.fi/problemset/task/1135](https://cses.fi/problemset/task/1135) | dist = d[u] + d[v] − 2d[LCA] |
| 26 | SPOJ LCA "Lowest Common Ancestor" (also in the VNOI Wiki list) | [spoj.com/problems/LCA](https://www.spoj.com/problems/LCA/) | Plain LCA queries (exact constraints UNVERIFIED) |
| 27 | AtCoder ABC014 D "閉路" | [atcoder.jp/contests/abc014/tasks/abc014_4](https://atcoder.jp/contests/abc014/tasks/abc014_4) | Tree plus one extra edge (a, b): output the cycle length = dist(a, b) + 1 via LCA |
| 28 | CF 832D Misha, Grisha and Underground (1900) | [codeforces.com/problemset/problem/832/D](https://codeforces.com/problemset/problem/832/D) | Several LCA distance queries per test |
| 29 | CF 191C Fools and Roads (1900) | [codeforces.com/problemset/problem/191/C](https://codeforces.com/problemset/problem/191/C) | LCA + difference on tree (+1 at u, +1 at v, −2 at LCA) |
| 30 | CF 1328E Tree Queries (1900) | [codeforces.com/problemset/problem/1328/E](https://codeforces.com/problemset/problem/1328/E) | Ancestor checks with tin/tout (Euler tour) |
| 31 | SPOJ DISQUERY "Distance Query" | [spoj.com/problems/DISQUERY](https://www.spoj.com/problems/DISQUERY/) | N, K ≤ 100,000; shortest and longest road on the u–v path ([search snapshot](https://spoj.com/SPOJ/problems/DISQUERY)). Binary lifting with min/max tables, O((N + K) log N). Euler-tour RMQ alone is not enough |
| 32 | VNOJ LUBENICA (COCI 2006; VNOJ tag LCA) | [oj.vnoi.info/problem/lubenica](https://oj.vnoi.info/problem/lubenica) | Same task as DISQUERY (min/max road on a path) |
| 33 | VNOJ UPGRANET "VOI 11 Bài 6 – Nâng cấp mạng" (tags: MST, DSU, LCA) | [oj.vnoi.info/problem/upgranet](https://oj.vnoi.info/problem/upgranet) | MST + LCA path-max |
| 34 | CF 609E Minimum spanning tree for each edge (2100) | [codeforces.com/problemset/problem/609/E](https://codeforces.com/problemset/problem/609/E) | MST + path-max via binary lifting |
| 35 | CF 519E A and B and Lecture Rooms (2100; VNOI LCA list) | [codeforces.com/problemset/problem/519/E](https://codeforces.com/problemset/problem/519/E) | LCA + k-th ancestor |
| 36 | VNOJ HBTLCA "dynamic LCA" (tag LCA) | [oj.vnoi.info/problem/hbtlca](https://oj.vnoi.info/problem/hbtlca) | LCA under a changing root (classic: answer from the LCAs of the three pairs) |
| 37 | CF 916E Jamie and Tree (2400; VNOI LCA list) | [codeforces.com/problemset/problem/916/E](https://codeforces.com/problemset/problem/916/E) | Rerooting + Euler tour + lazy segment tree |

**Level 5 — Strings (SA + LCP + RMQ) and advanced RMQ**

| # | Problem | Link | Technique, complexity |
|---|---|---|---|
| 38 | AtCoder ABC213 F "Common Prefixes" | [atcoder.jp/contests/abc213/tasks/abc213_f](https://atcoder.jp/contests/abc213/tasks/abc213_f) | N ≤ 10^6; for every k output Σ_j LCP(S_k, S_j). SA + LCP + monotonic stack in both directions, O(N log N) or O(N) |
| 39 | CF 123D String (2300) | [codeforces.com/problemset/problem/123/D](https://codeforces.com/problemset/problem/123/D) | SA + LCP + stack (counting substring occurrences) |
| 40 | CF 1073G Yet Another LCP Problem (2600) | [codeforces.com/problemset/problem/1073/G](https://codeforces.com/problemset/problem/1073/G) | SA + LCP + **RMQ** (sparse table) + sorting by rank + monotonic stack: the direct "LCP of arbitrary suffixes" application |
| 41 | CF 803G Periodic RMQ Problem (2300) | [codeforces.com/problemset/problem/803/G](https://codeforces.com/problemset/problem/803/G) | Sparse table over the base block + segment tree over compressed coordinates |
| 42 | CF 1988E Range Minimum Sum (2300) | [codeforces.com/problemset/problem/1988/E](https://codeforces.com/problemset/problem/1988/E) | Contribution of each element via nearest smaller values / Cartesian tree |
| 43 | CF 1730E Maximums and Minimums (2700) | [codeforces.com/problemset/problem/1730/E](https://codeforces.com/problemset/problem/1730/E) | Monotonic stacks + divisor enumeration (challenge problem) |

- All Codeforces titles, ratings and tags above come from the official API. — [codeforces.com/api/problemset.problems](https://codeforces.com/api/problemset.problems)
- CSES titles and sections were checked on the problem set page. — [cses.fi/problemset](https://cses.fi/problemset/)
- The VNOI Wiki RMQ article's own "Bài tập áp dụng" list: Library Checker Static RMQ, VNOJ AVLBIT, CodeChef FRMQ, CF 5C, CF 1454F, CF 475D, CF 487B, plus CodeChef CHSQARR for 2D. — [wiki.vnoi.info/algo/data-structures/rmq](https://wiki.vnoi.info/algo/data-structures/rmq)
- The VNOI Wiki LCA (Binary Lifting) article's exercise links: CF 519E, CF 916E; VNOJ fselect, hbtlca, lubenica, pwalk, upgranet, voi17bgame, votree; SPOJ LCA, QTREE2. — [wiki.vnoi.info/algo/data-structures/lca-binlift](https://wiki.vnoi.info/algo/data-structures/lca-binlift)

**VNOI Wiki reading list (exact URLs, HTTP 200 verified; titles as published):**
- "Range Minimum Query (RMQ) - Sparse Table"
  - Author: Lê Minh Hoàng (ĐH KHTN, ĐHQG-HCM). Reviewers include Hồ Ngọc Vĩnh Phát, Hoàng Xuân Nhật, Nguyễn Anh Bảo.
  - Sections: Sparse Table; RMQ (Thuật toán ngây thơ; Thuật toán tối ưu 1.1–1.n; Thuật toán tối ưu 2); Range Sum Queries (RSQ); Sparse Table 2D.
  - The article notes that the sparse table suits idempotent operations and cannot handle interleaved updates like a segment tree. — [wiki.vnoi.info/algo/data-structures/rmq](https://wiki.vnoi.info/algo/data-structures/rmq)
- "Bài toán RMQ và bài toán LCA" (TopCoder translation). — [wiki.vnoi.info/translate/topcoder/Range-Minimum-Query-and-Lowest-Common-Ancestor](https://wiki.vnoi.info/translate/topcoder/Range-Minimum-Query-and-Lowest-Common-Ancestor)
- "Các phương pháp giải bài toán LCA" (Khúc Anh Tuấn). — [wiki.vnoi.info/algo/data-structures/lca](https://wiki.vnoi.info/algo/data-structures/lca)
- "Lowest Common Ancestor (LCA) - Binary Lifting". — [wiki.vnoi.info/algo/data-structures/lca-binlift](https://wiki.vnoi.info/algo/data-structures/lca-binlift)
- "Cây Phân Đoạn (cơ bản)". — [wiki.vnoi.info/algo/data-structures/segment-tree-basic](https://wiki.vnoi.info/algo/data-structures/segment-tree-basic)
- "Tất tần tật về Cây Phân Đoạn (Segment Tree)". — [wiki.vnoi.info/algo/data-structures/segment-tree-extend](https://wiki.vnoi.info/algo/data-structures/segment-tree-extend)
- "Hàng đợi hai đầu (deque) và Bài toán tìm max-min trong đoạn tịnh tiến". — [wiki.vnoi.info/algo/data-structures/deque-min-max](https://wiki.vnoi.info/algo/data-structures/deque-min-max)
- "Mảng hậu tố (Suffix Array)". — [wiki.vnoi.info/algo/string/suffix-array](https://wiki.vnoi.info/algo/string/suffix-array)
- "Đường đi Euler trên cây". — [wiki.vnoi.info/algo/graph-theory/euler-tour-on-tree](https://wiki.vnoi.info/algo/graph-theory/euler-tour-on-tree)
- "Chia căn (sqrt decomposition) và ứng dụng: Phần 1". — [wiki.vnoi.info/algo/data-structures/sqrt-decomposition](https://wiki.vnoi.info/algo/data-structures/sqrt-decomposition)
- "Cây chỉ số nhị phân (Binary Indexed Tree)". — [wiki.vnoi.info/algo/data-structures/fenwick](https://wiki.vnoi.info/algo/data-structures/fenwick)
- (Guessed URLs that returned 404, so do not cite them: `/algo/data-structures/sparse-table`, `/algo/graph-theory/lca`, `/algo/data-structures/lca-euler-tour`.)
- English companion: cp-algorithms "Sparse Table". — [cp-algorithms.com/data_structures/sparse-table.html](https://cp-algorithms.com/data_structures/sparse-table.html)

### Inferences
- Suggested seminar homework path, building one technique per step:
  1. CSES 1647
  2. NKLINEUP
  3. MINK or LeetCode 239 (deque cousin)
  4. CSES 1645 and LeetCode 84 (stack / ANSV cousin)
  5. CF 689D or 1454F (RMQ + binary search)
  6. CSES 1688 and 1135 (Euler tour + RMQ for LCA)
  7. DISQUERY / LUBENICA (why Euler-tour RMQ is not enough for path aggregates)
  8. ABC213F and CF 1073G (the string application, mirroring Q1)
- The VNOI-sourced problems (NKLINEUP, MINK, QMAX, LUBENICA, UPGRANET, AVLBIT) give a Vietnamese audience familiar judges. Pair each with the matching VNOI Wiki article above.

### Gaps
- SPOJ pages could not be fetched directly (403 / Cloudflare). Titles and the RMQSQ and DISQUERY constraints come from search-engine snapshots of the SPOJ pages. The exact SPOJ LCA constraints are UNVERIFIED.
- The statements of VNOJ AVLBIT, QBRECT, VOTREE, PWALK and FSELECT were not read beyond titles and tags. Codeforces ratings for 52C, 803G and others are as the API returned them on 2026-10-31 and can change.
- Library Checker "Static RMQ" exists (the VNOI Wiki links it; the page title is generic because it is a JS app), but its constraints were not verified.
