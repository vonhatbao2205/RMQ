/* RMQ seminar deck: video controls, footer, interactive widgets. Vanilla JS. */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };

  // ------------------------------------------------------------ videos
  function videoOf(slide) { return slide ? slide.querySelector(".video-card video") : null; }

  function badge(v, text) {
    const b = v.parentElement.querySelector(".vbadge");
    if (!b) return;
    b.textContent = text;
    b.classList.add("show");
    clearTimeout(b._t);
    b._t = setTimeout(() => b.classList.remove("show"), 1300);
  }

  function setupVideos() {
    $$(".video-card video").forEach((v) => {
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
      const card = v.parentElement;
      if (!card.querySelector(".vbadge")) card.appendChild(el("div", "vbadge", "1×"));
      if (!card.querySelector(".vbar")) card.appendChild(el("div", "vbar"));
      const bar = card.querySelector(".vbar");
      v.addEventListener("click", (e) => {
        e.stopPropagation();
        if (v.paused) { v.play(); badge(v, "▶ " + v.playbackRate + "×"); }
        else { v.pause(); badge(v, "❚❚ tạm dừng"); }
      });
      v.addEventListener("timeupdate", () => {
        if (v.duration) bar.style.width = (100 * v.currentTime / v.duration).toFixed(2) + "%";
      });
    });
  }

  function playCurrent(restart) {
    const v = videoOf(Reveal.getCurrentSlide());
    if (!v) return;
    if (restart) v.currentTime = 0;
    clearTimeout(v._start);
    v._start = setTimeout(() => v.play().catch(() => {}), 350);
  }

  function bindVideoKeys() {
    const withVideo = (fn) => () => { const v = videoOf(Reveal.getCurrentSlide()); if (v) fn(v); };
    Reveal.addKeyBinding({ keyCode: 86, key: "V", description: "Video: phát / tạm dừng" },
      withVideo((v) => { if (v.paused) { v.play(); badge(v, "▶ " + v.playbackRate + "×"); } else { v.pause(); badge(v, "❚❚ tạm dừng"); } }));
    Reveal.addKeyBinding({ keyCode: 82, key: "R", description: "Video: phát lại từ đầu" },
      withVideo((v) => { v.currentTime = 0; v.play(); badge(v, "↺ phát lại"); }));
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const step = (d) => withVideo((v) => {
      const i = Math.max(0, Math.min(rates.length - 1, rates.indexOf(v.playbackRate) + d));
      v.playbackRate = rates[i < 0 ? 2 : i];
      badge(v, v.playbackRate + "×");
    });
    Reveal.addKeyBinding({ keyCode: 219, key: "[", description: "Video: chậm hơn" }, step(-1));
    Reveal.addKeyBinding({ keyCode: 221, key: "]", description: "Video: nhanh hơn" }, step(+1));
  }

  // ------------------------------------------------------------ footer
  function updateFooter(slide) {
    const f = $(".deck-footer .sec");
    if (!f || !slide) return;
    const sec = slide.closest("[data-section]");
    f.textContent = sec ? sec.getAttribute("data-section") : "";
    const part = slide.getAttribute("data-part") || "0";
    const color = getComputedStyle(document.documentElement).getPropertyValue("--p" + part) || "";
    document.documentElement.style.setProperty("--accent-now", color.trim() || "var(--muted)");
    document.body.classList.toggle("title-slide-active", slide.classList.contains("title-slide"));
  }

  // ------------------------------------------------------------ Sparse Table explorer
  function SparseExplorer(root) {
    const EXAMPLE = [5, 2, 6, 3, 1, 7, 4, 8, 9, 2, 6, 4];
    let A = EXAMPLE.slice();
    let st = [];
    const n = A.length;
    const grid = $(".st-grid", root);
    const lIn = $("[data-l]", root), rIn = $("[data-r]", root);
    const lV = $("[data-lv]", root), rV = $("[data-rv]", root);
    const info = $(".st-info", root);
    lIn.max = rIn.max = n;

    function build() {
      st = [A.slice()];
      for (let k = 1; (1 << k) <= n; k++) {
        const prev = st[k - 1], row = [];
        for (let i = 0; i + (1 << k) <= n; i++) row.push(Math.min(prev[i], prev[i + (1 << (k - 1))]));
        st.push(row);
      }
    }

    function render() {
      grid.style.gridTemplateColumns = `118px repeat(${n}, 1fr)`;
      grid.innerHTML = "";
      grid.appendChild(el("div", "st-lbl", "i"));
      for (let i = 0; i < n; i++) grid.appendChild(el("div", "st-idx", String(i + 1)));
      st.forEach((row, k) => {
        grid.appendChild(el("div", "st-lbl", k === 0 ? `A<small>k = 0</small>` : `k = ${k}<small>độ dài ${1 << k}</small>`));
        for (let i = 0; i < n; i++) {
          if (i < row.length) {
            const c = el("div", "st-cell" + (k === 0 ? " arr0" : ""), String(row[i]));
            c.dataset.k = k; c.dataset.i = i;
            c.title = `st[${k}][${i + 1}] = min A[${i + 1}..${i + (1 << k)}]`;
            c.addEventListener("click", () => { setLR(i + 1, i + (1 << k)); });
            grid.appendChild(c);
          } else {
            grid.appendChild(el("div", "st-cell blank", ""));
          }
        }
      });
    }

    function setLR(l, r) {
      lIn.value = l; rIn.value = r;
      update();
    }

    function update() {
      let l = +lIn.value, r = +rIn.value;
      if (l > r) { if (document.activeElement === lIn) { r = l; rIn.value = r; } else { l = r; lIn.value = l; } }
      lV.textContent = l; rV.textContent = r;
      const L = r - l + 1, k = 31 - Math.clz32(L), p = 1 << k;
      const a0 = l - 1, b0 = r - p;               // 0-based starts of the two blocks
      const va = st[k][a0], vb = st[k][b0], ans = Math.min(va, vb);
      let arg = a0;
      for (let i = a0; i <= r - 1; i++) if (A[i] < A[arg]) arg = i;
      $$(".st-cell", grid).forEach((c) => {
        c.className = c.className.replace(/\b(inq|ia|ib|iab|used|ans|dim)\b/g, "").replace(/\s+/g, " ").trim();
        c.style.removeProperty("--c");
        if (c.classList.contains("blank")) return;
        const ck = +c.dataset.k, ci = +c.dataset.i;
        if (ck === 0) {
          const inA = ci >= a0 && ci < a0 + p, inB = ci >= b0 && ci < b0 + p;
          if (inA && inB) c.classList.add("iab");
          else if (inA) c.classList.add("ia");
          else if (inB) c.classList.add("ib");
          else if (ci >= l - 1 && ci <= r - 1) c.classList.add("inq");
          if (ci === arg) c.classList.add("ans");
        }
        if (ck === k && (ci === a0 || ci === b0)) {
          c.classList.add("used");
          c.style.setProperty("--c", ci === a0 ? "var(--blue)" : "var(--orange)");
        } else if (ck > 0) {
          c.classList.add("dim");
        }
      });
      info.innerHTML = `
        <div class="kv">
          <span class="k">độ dài L</span><span class="v">${r} − ${l} + 1 = ${L}</span>
          <span class="k">k = ⌊log₂ L⌋</span><span class="v">${k}  (2<sup>k</sup> = ${p})</span>
          <span class="k t-blue">đoạn 1</span><span class="v t-blue">[${l}, ${l + p - 1}] → st[${k}][${l}] = ${va}</span>
          <span class="k t-orange">đoạn 2</span><span class="v t-orange">[${r - p + 1}, ${r}] → st[${k}][${r - p + 1}] = ${vb}</span>
        </div>
        <div style="display:flex;align-items:baseline;gap:18px;margin-top:14px">
          <span class="k muted" style="font-size:24px">min = </span><span class="bigans">${ans}</span>
          <span class="muted" style="font-size:22px">tại vị trí ${arg + 1}</span>
        </div>
        <div class="muted" style="font-size:22px;margin-top:10px">Duyệt: <b class="t-scan">${L}</b> lần đọc · Sparse Table: <b class="t-sparse">2</b> lần tra bảng</div>`;
    }

    [lIn, rIn].forEach((inp) => {
      inp.addEventListener("input", update);
      inp.addEventListener("change", () => inp.blur());
    });
    $("[data-example]", root).addEventListener("click", () => { A = EXAMPLE.slice(); build(); render(); setLR(2, 7); });
    $("[data-random]", root).addEventListener("click", () => {
      A = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 19));
      build(); render(); update();
    });
    build(); render(); setLR(2, 7);
  }

  // ------------------------------------------------------------ Break-even explorer
  function BreakEven(root) {
    const D = window.BENCH;
    if (!D) return;
    const names = { Scan: "Duyệt trực tiếp", Sqrt: "Chia khối √n", Segment: "Segment Tree",
      Linear: "RMQ tuyến tính", Sparse: "Sparse Table" };
    const css = { Scan: "--scan", Sqrt: "--sqrt", Segment: "--seg", Linear: "--linear", Sparse: "--sparse" };
    const order = ["Scan", "Sqrt", "Segment", "Linear", "Sparse"];
    const rows = $(".be-rows", root);
    const slider = $("input[type=range]", root);
    const qlab = $("[data-q]", root);
    slider.max = D.qs.length - 1;
    const rowEls = {};
    order.forEach((a) => {
      const r = el("div", "be-row");
      r.style.setProperty("--c", `var(${css[a]})`);
      r.innerHTML = `<div class="name">${names[a]}</div><div class="track"><div class="bar"></div></div><div class="val"></div>`;
      rows.appendChild(r);
      rowEls[a] = r;
    });
    const LO = -2, HI = 5; // log10 ms axis: 0.01 ms .. 100 s
    const sup = (k) => String(k).split("").map((d) => "⁰¹²³⁴⁵⁶⁷⁸⁹"[+d]).join("");
    function fmtMs(v) {
      if (v >= 1000) return (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(".", ",") + " s";
      if (v >= 10) return v.toFixed(0) + " ms";
      if (v >= 1) return v.toFixed(1).replace(".", ",") + " ms";
      return v.toFixed(2).replace(".", ",") + " ms";
    }
    function update() {
      const q = D.qs[+slider.value];
      qlab.innerHTML = q === 1 ? "1" : "10" + sup(Math.round(Math.log10(q)));
      let best = null, bestV = Infinity;
      order.forEach((a) => {
        const info = D.algos[a];
        let v = info.measured[String(q)], est = false;
        if (v === undefined) { v = info.build_ms + q * info.ns_per_query / 1e6; est = true; }
        if (!est && v < bestV) { bestV = v; best = a; }
        const w = Math.max(1.5, Math.min(100, (Math.log10(v) - LO) / (HI - LO) * 100));
        const r = rowEls[a];
        const bar = $(".bar", r);
        bar.style.width = w + "%";
        bar.classList.toggle("est", est);
        $(".val", r).textContent = (est ? "≈ " : "") + fmtMs(v);
        r.classList.remove("win");
      });
      if (best) rowEls[best].classList.add("win");
    }
    slider.addEventListener("input", update);
    slider.addEventListener("change", () => slider.blur());
    slider.value = 3;
    update();
  }

  // ------------------------------------------------------------ font choice (?font=plex|jakarta|source|lexend|bevietnam)
  const fontChoice = new URLSearchParams(location.search).get("font");
  if (fontChoice) document.documentElement.setAttribute("data-font", fontChoice);

  // ------------------------------------------------------------ print / PDF: posters instead of videos
  function postersForPrint() {
    if (!/print-pdf/.test(location.search)) return;
    $$(".video-card video").forEach((v) => {
      const img = el("img");
      img.src = v.getAttribute("poster");
      img.alt = "Khung hình cuối của video minh họa";
      v.replaceWith(img);
    });
  }

  // ------------------------------------------------------------ init
  function init() {
    postersForPrint();
    setupVideos();
    bindVideoKeys();
    $$("[data-widget=sparse]").forEach(SparseExplorer);
    $$("[data-widget=breakeven]").forEach(BreakEven);
    updateFooter(Reveal.getCurrentSlide());
    Reveal.on("slidechanged", (e) => { updateFooter(e.currentSlide); playCurrent(true); });
    Reveal.on("ready", (e) => { updateFooter(e.currentSlide); playCurrent(true); });
    const total = Reveal.getTotalSlides();
    document.documentElement.style.setProperty("--total-slides", total);
  }

  if (window.Reveal && Reveal.isReady && Reveal.isReady()) init();
  else window.addEventListener("load", () => {
    if (Reveal.isReady()) init(); else Reveal.on("ready", init);
  });
})();
