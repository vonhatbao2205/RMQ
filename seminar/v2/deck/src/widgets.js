/* Interactive widgets. Every answer shown is computed by the algorithm named on the slide. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  const NS = "http://www.w3.org/2000/svg";
  const sv = (tag, attrs = {}, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) { const v = attrs[k]; if (typeof v === "string" && v.startsWith("var(")) e.style.setProperty(k, v); else e.setAttribute(k, v); }
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const vn = (x, d = 0) => Number(x).toLocaleString("vi-VN", { maximumFractionDigits: d, minimumFractionDigits: d });
  const vnA = (x) => Number(x).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
  const fmtMs = (ms) => (ms < 1 ? "dưới 1 ms" : vnA(ms) + " ms");
  const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const HL = ["hl-q", "hl-a", "hl-l", "hl-r", "hl-b", "hl-o", "hl-bad", "dim"];
  const clearHL = (c) => c.classList.remove(...HL);

  const A8 = [7, 4, 9, 4, 6, 2, 2, 8];
  const A16 = [2, 7, 5, 8, 9, 4, 1, 6, 8, 5, 3, 7, 10, 2, 0, 4];
  const PRICES = [1.25, 1.10, 1.45, 0.98, 1.35, 0.89, 1.18, 1.05, 0.92, 1.30, 1.15, 0.99, 1.40, 0.87];
  const argmin = (a, l, r) => { let p = l; for (let i = l + 1; i <= r; i++) if (a[i] < a[p]) p = i; return p; };
  const better = (a, p, q) => (a[p] !== a[q] ? (a[p] < a[q] ? p : q) : Math.min(p, q));
  function buildST(a) {
    const n = a.length, K = Math.floor(Math.log2(n)) + 1, st = [a.map((_, i) => i)];
    for (let k = 1; k < K; k++) { st[k] = []; for (let i = 0; i + (1 << k) <= n; i++) st[k][i] = better(a, st[k - 1][i], st[k - 1][i + (1 << (k - 1))]); }
    return st;
  }

  // ------------------------------------------------ arrays
  function makeArr(vals, o = {}) {
    const root = h("div", "arr");
    const cells = vals.map((v, i) => {
      const w = h("div", "cellw" + (o.btn ? " btn" : ""));
      const c = h("div", "c", String(v));
      if (o.size) c.style.setProperty("--sz", o.size + "px");
      w.appendChild(c);
      if (!o.noidx) w.appendChild(h("div", "idx", String(i + (o.start || 0))));
      root.appendChild(w);
      return c;
    });
    return { root, cells };
  }
  function parseMarks(str, cells) {
    str.split(",").map((x) => x.trim()).filter(Boolean).forEach((m) => {
      const [rg, cl] = m.split(":");
      const [a, b] = rg.split("-").map(Number);
      for (let i = a; i <= (b === undefined ? a : b); i++) if (cells[i]) cells[i].classList.add(cl);
    });
  }
  window.mountArrays = function (scope) {
    $$(".arr[data-vals]", scope).forEach((e) => {
      const made = makeArr(e.dataset.vals.split(","), { size: +e.dataset.size || 0, noidx: e.dataset.noidx !== undefined, start: +(e.dataset.start || 0) });
      e.append(...made.root.children);
      e._cells = made.cells;
      if (e.dataset.static) parseMarks(e.dataset.static, e._cells);
    });
  };
  window.applyMarks = function (e, st) {
    if (!e._cells) return;
    const marks = JSON.parse(e.dataset.marks);
    let best = null;
    Object.keys(marks).map(Number).sort((a, b) => a - b).forEach((k) => { if (k <= st) best = k; });
    e._cells.forEach(clearHL);
    if (e.dataset.static) parseMarks(e.dataset.static, e._cells);
    if (best !== null) parseMarks(marks[best], e._cells);
  };

  // typed number field; Enter or Esc leaves it so the arrow keys move slides again
  function numField(v, min, max) {
    const inp = h("input", "num"); inp.type = "number"; inp.inputMode = "numeric"; inp.min = min; inp.max = max; inp.value = v;
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === "Escape") inp.blur(); });
    inp.addEventListener("focus", () => setTimeout(() => inp.select()));
    return inp;
  }
  // clamped value of a field (written back if it was out of range), NaN while empty
  function readNum(inp) {
    if (inp.value.trim() === "") return NaN;
    const v = Math.max(+inp.min, Math.min(+inp.max, Math.round(+inp.value)));
    if (String(v) !== inp.value) inp.value = v;
    return v;
  }

  function lrFields(parent, n, l0, r0, cb) {
    const box = h("div", "ctl");
    const mk = (name, v) => {
      const lab = h("label", "", `${name} =`), inp = numField(v, 0, n - 1);
      inp.id = parent.id ? parent.id + name : "";
      lab.appendChild(inp); box.appendChild(lab); return inp;
    };
    const L = mk("l", l0), R = mk("r", r0), hint = h("span", "hint", `0 ≤ l ≤ r ≤ ${n - 1}`);
    box.appendChild(hint);
    let last = [l0, r0];
    // while typing: redraw only when l ≤ r, otherwise flag both fields
    const fire = () => {
      const l = readNum(L), r = readNum(R), ok = l <= r;
      [L, R, hint].forEach((x) => x.classList.toggle("bad", !ok));
      if (ok) { last = [l, r]; cb(l, r); }
    };
    // on leaving a field: an empty field gets its last value back, a crossed pair moves the other end
    const settle = (who) => {
      let l = readNum(L), r = readNum(R);
      if (isNaN(l)) l = last[0];
      if (isNaN(r)) r = last[1];
      if (l > r) { if (who === "l") r = l; else l = r; }
      L.value = l; R.value = r; fire();
    };
    L.addEventListener("input", fire); R.addEventListener("input", fire);
    L.addEventListener("change", () => settle("l")); R.addEventListener("change", () => settle("r"));
    parent.appendChild(box);
    return { set(l, r) { L.value = l; R.value = r; fire(); }, box };
  }

  const W = (window.W = {});

  // ------------------------------------------------ story: ticket grid
  W.tickets = (el) => {
    const grid = h("div", "tickets");
    const cards = PRICES.map((p, i) => {
      const c = h("div", "tk", `<div class="d">${i + 1}/11</div><div class="p">${vn(p, 2)}</div>`);
      c.addEventListener("click", () => { if (pick === null) { pick = i; from.value = i; to.value = i; paint(); } else { const a = Math.min(pick, i), b = Math.max(pick, i); from.value = a; to.value = b; pick = null; paint(); } });
      grid.appendChild(c); return c;
    });
    let pick = null;
    const opts = PRICES.map((_, i) => `<option value="${i}">${i + 1}/11</option>`).join("");
    const ctl = h("div", "ctl", `<span>Từ ngày</span><select class="dark" id="tk-from">${opts}</select><span>đến ngày</span><select class="dark" id="tk-to">${opts}</select><button class="act" id="tk-go">Tìm ngày có vé rẻ nhất</button><span class="small">giá giả lập, triệu đồng</span>`);
    const out = h("div", "lead", "&nbsp;");
    el.append(grid, ctl, out);
    el.style.cssText += ";display:flex;flex-direction:column;gap:22px";
    const from = $("#tk-from", ctl), to = $("#tk-to", ctl), go = $("#tk-go", ctl);
    from.value = 2; to.value = 9;
    let timer = null, reads = 0;
    function paint() {
      clearInterval(timer);
      const a = +from.value, b = +to.value;
      cards.forEach((c, i) => { c.classList.remove("scan", "best"); c.classList.toggle("in", i >= a && i <= b); });
      out.innerHTML = `${b - a + 1} ngày · đã đọc <b>${reads}</b> ô`;
    }
    function run() {
      let a = +from.value, b = +to.value;
      if (a > b) { [a, b] = [b, a]; from.value = a; to.value = b; paint(); }
      clearInterval(timer);
      let i = a, best = a;
      cards.forEach((c) => c.classList.remove("best", "scan"));
      timer = setInterval(() => {
        cards.forEach((c) => c.classList.remove("scan"));
        if (i > b) {
          clearInterval(timer);
          cards[best].classList.add("best");
          out.innerHTML = `<span class="a">Rẻ nhất: <b>${best + 1}/11</b> · ${vn(PRICES[best], 2)} triệu</span> · đã đọc <b>${reads}</b> ô`;
          return;
        }
        cards[i].classList.add("scan"); reads++;
        if (PRICES[i] < PRICES[best]) best = i;
        cards.forEach((c) => c.classList.remove("best")); cards[best].classList.add("best");
        i++;
      }, 190);
    }
    from.addEventListener("change", paint); to.addEventListener("change", paint); go.addEventListener("click", run);
    paint();
    return { leave() { clearInterval(timer); }, step(s) { if (s === 1) { from.value = 2; to.value = 9; run(); } if (s === 2) { from.value = 4; to.value = 11; run(); } } };
  };

  // ------------------------------------------------ story: many users
  W.crowd = (el) => {
    const USERS = [["Pi", 2, 9, "--query"], ["Bạn A", 4, 11, "--seg"], ["Bạn B", 7, 13, "--sqrt"], ["Bạn C", 0, 6, "--sparse"], ["Bạn D", 5, 8, "--fh"], ["Bạn E", 1, 12, "--ans"]];
    const u = 72, x0 = 150, W_ = x0 + 14 * u + 10, top = 60, rh = 56;
    const svg = sv("svg", { viewBox: `0 0 ${W_} ${top + USERS.length * rh + 10}`, width: W_ });
    PRICES.forEach((p, i) => {
      const hgt = 30;
      svg.appendChild(sv("rect", { x: x0 + i * u + 3, y: 8, width: u - 6, height: hgt, rx: 5, fill: "var(--cell)", stroke: "var(--faint)" }));
      const t = sv("text", { x: x0 + i * u + u / 2, y: 29, "text-anchor": "middle", "font-size": 19, class: "m" }, vn(p, 2)); svg.appendChild(t);
    });
    const rows = USERS.map(([name, a, b, col], k) => {
      const y = top + k * rh, g = sv("g", { opacity: 0 });
      g.style.transition = "opacity .4s";
      g.appendChild(sv("text", { x: 0, y: y + 27, "font-size": 25, style: `fill:var(${col})` }, name));
      g.appendChild(sv("rect", { x: x0 + a * u + 3, y: y + 6, width: (b - a + 1) * u - 6, height: 28, rx: 14, fill: `var(${col})`, opacity: 0.85 }));
      g.appendChild(sv("text", { x: x0 + (a + b + 1) / 2 * u, y: y + 28, "text-anchor": "middle", "font-size": 20, style: "fill:var(--on-accent);font-weight:600" }, `đọc ${b - a + 1} ô`));
      svg.appendChild(g);
      return { g, reads: b - a + 1 };
    });
    el.appendChild(svg);
    const total = h("div", "lead", "");
    el.appendChild(total);
    el.style.cssText += ";display:flex;flex-direction:column;gap:14px";
    return {
      step(s) {
        const show = s === 0 ? 3 : 6;
        let sum = 0;
        rows.forEach((r, i) => { r.g.setAttribute("opacity", i < show ? 1 : 0); if (i < show) sum += r.reads; });
        total.innerHTML = `${show} người: đọc <b>${sum}</b> ô, trong khi mảng chỉ có <b>14</b> ô.`;
      },
    };
  };

  // ------------------------------------------------ definition explorer
  W.defx = (el) => {
    const { root, cells } = makeArr(A8, { size: 92 });
    const res = h("div", "stack");
    res.style.cssText = "min-height:170px;gap:14px";
    el.append(root);
    const presets = h("div", "ctl", "<span>Thử nhanh:</span>");
    [[1, 4], [3, 6], [6, 7], [2, 2], [0, 7]].forEach(([a, b]) => { const bt = h("button", "ghost", `(${a}, ${b})`); bt.addEventListener("click", () => ctl.set(a, b)); presets.appendChild(bt); });
    const ctl = lrFields(el, 8, 1, 4, draw);
    el.append(presets, res);
    el.style.cssText += ";display:flex;flex-direction:column;gap:24px;align-items:flex-start";
    function draw(l, r) {
      const p = argmin(A8, l, r), ties = A8.slice(l, r + 1).filter((v) => v === A8[p]).length;
      cells.forEach((c, i) => { clearHL(c); if (i < l || i > r) c.classList.add("dim"); else if (i === p) c.classList.add("hl-a"); else c.classList.add("hl-q"); });
      res.innerHTML =
        `<div class="lead"><span class="mono">A[${l}..${r}] = [${A8.slice(l, r + 1).join(", ")}]</span></div>` +
        `<div class="lead">min = <b class="a">${A8[p]}</b> ⇒ <span class="mono a">RMQ(${l}, ${r}) = ${p}</span></div>` +
        (ties > 1 ? `<div class="txt">Có ${ties} số ${A8[p]}: chọn bên trái.</div>` : "");
    }
    draw(1, 4);
  };

  // ------------------------------------------------ all pairs triangle
  W.allpairs = (el) => {
    const n = 8, size = 56;
    const wrap = h("div"); wrap.style.cssText = `display:grid;grid-template-columns:44px repeat(${n},${size}px);gap:4px;align-items:center;justify-items:center`;
    wrap.appendChild(h("div", "small", ""));
    for (let r = 0; r < n; r++) wrap.appendChild(h("div", "idx", "r=" + r));
    const cells = {};
    for (let l = 0; l < n; l++) {
      wrap.appendChild(h("div", "idx", "l=" + l));
      for (let r = 0; r < n; r++) {
        const c = h("div", "c" + (r < l ? " empty" : ""), "");
        c.style.setProperty("--sz", size + "px");
        wrap.appendChild(c);
        if (r >= l) cells[l + "," + r] = c;
      }
    }
    const cap = h("div", "txt", "");
    const arr = makeArr(A8, { size: 56 });
    el.append(arr.root, wrap, cap);
    el.style.cssText += ";display:flex;flex-direction:column;gap:16px;align-items:flex-start";
    let timer = null;
    const M = {};
    for (let l = 0; l < n; l++) { M[l + "," + l] = l; for (let r = l + 1; r < n; r++) M[l + "," + r] = better(A8, M[l + "," + (r - 1)], r); }
    function show(l, r) { arr.cells.forEach((c, i) => { clearHL(c); if (i >= l && i <= r) c.classList.add("hl-q"); if (i === M[l + "," + r]) c.classList.add("hl-a"); }); }
    Object.keys(cells).forEach((k) => { const [l, r] = k.split(",").map(Number); cells[k].style.cursor = "pointer"; cells[k].addEventListener("mouseenter", () => show(l, r)); });
    function fill(list, then) {
      clearInterval(timer);
      let i = 0;
      timer = setInterval(() => {
        if (i >= list.length) { clearInterval(timer); if (then) then(); return; }
        const [l, r] = list[i++];
        cells[l + "," + r].textContent = M[l + "," + r];
        cells[l + "," + r].classList.add("hl-l");
        show(l, r);
        const f = Object.values(cells).filter((c) => c.textContent).length;
        cap.innerHTML = `<b>${f}</b>/36 ô · <span class="mono">M[${l}][${r}] = ${M[l + "," + r]}</span>`;
      }, list.length > 10 ? 70 : 340);
    }
    return {
      leave() { clearInterval(timer); },
      step(s, prev) {
        if (s === 0) { Object.values(cells).forEach((c) => { c.textContent = ""; c.classList.remove("hl-l"); }); cap.innerHTML = "Bảng trống: 36 ô"; arr.cells.forEach(clearHL); }
        if (s === 1) { const list = []; for (let r = 1; r < n; r++) list.push([1, r]); fill(list); }
        if (s >= 2) { const list = []; for (let d = 0; d < n; d++) for (let l = 0; l + d < n; l++) list.push([l, l + d]); fill(list); }
      },
    };
  };

  // ------------------------------------------------ sqrt blocks with block-size slider
  W.sqrtx = (el) => {
    const A = [7, 4, 9, 6, 3, 8, 5, 10, 2, 11, 6, 9, 5, 1, 8, 12], n = 16, L = 2, R = 13;
    const line = h("div"); line.style.cssText = "display:flex;gap:3px;flex-wrap:nowrap";
    el.appendChild(line);
    const ctl = h("div", "ctl", `<label>b = <b id="sq-b">4</b><input id="sq-range" type="range" min="1" max="16" value="4"></label><span id="sq-note"></span>`);
    const res = h("div", "lead", "");
    res.style.minHeight = "104px";
    const chartBox = h("div");
    el.append(ctl, res, chartBox);
    el.style.cssText += ";display:flex;flex-direction:column;gap:18px";
    const X0 = 70, Y0 = 200, SX = 58, SY = 6;
    const svg = sv("svg", { viewBox: "0 0 1100 250", width: 1000 });
    chartBox.appendChild(svg);
    const cost = (b) => { const lb = Math.floor(L / b), rb = Math.floor(R / b); if (lb === rb) return R - L + 1; return ((lb + 1) * b - L) + (R - rb * b + 1) + (rb - lb - 1); };
    svg.appendChild(sv("line", { x1: X0, x2: X0 + SX * 16, y1: Y0, y2: Y0, stroke: "var(--faint)" }));
    svg.appendChild(sv("text", { x: X0 + SX * 16 + 8, y: Y0 + 6, "font-size": 22 }, "b"));
    svg.appendChild(sv("text", { x: 0, y: 20, "font-size": 21 }, "số ô phải đọc"));
    const marks = [];
    for (let b = 1; b <= 16; b++) {
      const c = cost(b), r = sv("rect", { x: X0 + (b - 1) * SX + 6, y: Y0 - c * SY, width: SX - 12, height: c * SY, fill: "var(--faint)", rx: 3 });
      svg.appendChild(r); marks.push(r);
      svg.appendChild(sv("text", { x: X0 + (b - 0.5) * SX, y: Y0 - c * SY - 7, "text-anchor": "middle", "font-size": 19, class: "m" }, c));
      svg.appendChild(sv("text", { x: X0 + (b - 0.5) * SX, y: Y0 + 24, "text-anchor": "middle", "font-size": 19, class: "m" }, b));
    }
    const inp = $("#sq-range", ctl), bl = $("#sq-b", ctl), note = $("#sq-note", ctl);
    function draw() {
      const b = +inp.value;
      bl.textContent = b; line.innerHTML = "";
      const lb = Math.floor(L / b), rb = Math.floor(R / b);
      const mins = [];
      for (let k = 0; k * b < n; k++) mins.push(Math.min(...A.slice(k * b, (k + 1) * b)));
      for (let k = 0; k * b < n; k++) {
        const group = h("div"); group.style.cssText = "display:flex;gap:2px;padding:4px;border:2px solid var(--b-line);border-radius:9px";
        for (let i = k * b; i < Math.min(n, (k + 1) * b); i++) {
          const c = h("div", "c", A[i]); c.style.setProperty("--sz", b === 1 ? "60px" : "60px");
          const whole = lb < k && k < rb;
          if (i >= L && i <= R) {
            if (lb === rb) c.classList.add("hl-q");
            else if (whole) c.classList.add("hl-b");
            else c.classList.add("hl-q");
          } else c.classList.add("dim");
          group.appendChild(c);
        }
        line.appendChild(group);
      }
      const scanCount = lb === rb ? R - L + 1 : ((lb + 1) * b - L) + (R - rb * b + 1);
      const whole = lb === rb ? 0 : rb - lb - 1;
      res.innerHTML = `Truy vấn <span class="mono q">[2, 13]</span>: quét <b class="q">${scanCount}</b> ô biên + đọc <b class="c-sqrt">${whole}</b> min khối = <b>${scanCount + whole}</b> ô`;
      marks.forEach((m, i) => { m.style.setProperty("fill", i + 1 === b ? "var(--sqrt)" : "var(--faint)"); });
      note.textContent = b === 4 ? "b = √16: cân bằng" : b < 4 ? "khối nhỏ: đọc nhiều min" : "khối lớn: quét nhiều biên";
    }
    inp.addEventListener("input", draw);
    draw();
  };

  // ------------------------------------------------ segment tree
  function segLayout(n, W_, top, gapY) {
    const nodes = [];
    (function rec(id, a, b, d) {
      nodes[id] = { id, a, b, d, x: 0, y: top + d * gapY };
      if (a === b) return;
      const m = (a + b) >> 1; rec(2 * id, a, m, d + 1); rec(2 * id + 1, m + 1, b, d + 1);
    })(1, 0, n - 1, 0);
    const u = W_ / n;
    nodes.forEach((nd) => { if (nd) nd.x = ((nd.a + nd.b + 1) / 2) * u; });
    return nodes;
  }
  W.segx = (el) => {
    const n = 8, vals = A8.slice();
    const svg = sv("svg", { viewBox: "0 0 1120 440", width: 1120, "data-drag": 1 });
    const nodes = segLayout(n, 1120, 34, 110);
    const shapes = {};
    nodes.forEach((nd) => {
      if (!nd || nd.id === 1) return;
      const p = nodes[nd.id >> 1];
      nd.edge = sv("line", { x1: p.x, y1: p.y + 30, x2: nd.x, y2: nd.y - 30, stroke: "var(--faint)", "stroke-width": 3 });
      svg.appendChild(nd.edge);
    });
    nodes.forEach((nd) => {
      if (!nd) return;
      const g = sv("g", {});
      const r = sv("rect", { x: nd.x - 54, y: nd.y - 34, width: 108, height: 72, rx: 13, fill: "var(--cell)", stroke: "var(--seg)", "stroke-width": 2.5 });
      const v = sv("text", { x: nd.x, y: nd.y + 2, "text-anchor": "middle", "font-size": 34, class: "m", style: "fill:var(--ink)" });
      const t = sv("text", { x: nd.x, y: nd.y + 28, "text-anchor": "middle", "font-size": 18, class: "m", style: "fill:var(--muted)" }, nd.a === nd.b ? `[${nd.a}]` : `[${nd.a},${nd.b}]`);
      g.append(r, v, t); svg.appendChild(g); shapes[nd.id] = { r, v, g };
    });
    const row2 = h("div", "ctl");
    const res = h("div", "lead", "");
    res.style.minHeight = "104px";
    const upd = h("div", "ctl", `<span>Đổi giá:</span><label>A[<i></i>]</label><label>=<i></i></label><button class="act" id="sg-do">Cập nhật</button><button class="ghost" id="sg-reset">Giá gốc</button>`);
    const pos = numField(5, 0, n - 1), val = numField(10, 0, 99), slots = upd.querySelectorAll("label i");
    slots[0].replaceWith(pos); slots[1].replaceWith(val);
    el.appendChild(svg);
    lrFields(row2, n, 1, 6, (l, r) => { L = l; R = r; draw(); });
    el.append(row2, upd, res);
    el.style.cssText += ";display:flex;flex-direction:column;gap:12px";
    let L = 1, R = 6, pathSet = new Set();
    const value = (nd) => Math.min(...vals.slice(nd.a, nd.b + 1));
    function canon(id, a, b, l, r, out, visits) {
      visits.n++;
      if (l <= a && b <= r) { out.push(id); return; }
      const m = (a + b) >> 1;
      if (l <= m) canon(2 * id, a, m, l, r, out, visits);
      if (r > m) canon(2 * id + 1, m + 1, b, l, r, out, visits);
    }
    function draw() {
      const out = [], visits = { n: 0 };
      canon(1, 0, n - 1, L, R, out, visits);
      nodes.forEach((nd) => {
        if (!nd) return;
        const s = shapes[nd.id];
        s.v.textContent = value(nd);
        const isC = out.includes(nd.id), isP = pathSet.has(nd.id);
        s.r.style.setProperty("fill", isC ? "var(--q-bg)" : isP ? "var(--r-bg)" : "var(--cell)");
        s.r.style.setProperty("stroke", isC ? "var(--query)" : "var(--seg)");
        s.r.setAttribute("stroke-width", isC || isP ? 5 : 2.5);
        if (nd.edge) { nd.edge.style.setProperty("stroke", isP ? "var(--seg)" : "var(--faint)"); nd.edge.setAttribute("stroke-width", isP ? 6 : 3); }
      });
      const m = Math.min(...vals.slice(L, R + 1));
      res.innerHTML = `<span class="mono q">[${L}, ${R}]</span> = <b class="q">${out.length}</b> nút: min(${out.map((id) => value(nodes[id])).join(", ")}) = <b class="a">${m}</b>.` + (pathSet.size ? ` Vừa sửa <b class="c-seg">${pathSet.size}</b> nút.` : "");
    }
    [pos, val].forEach((x) => x.addEventListener("keydown", (e) => { if (e.key === "Enter") update(); }));
    function update() {
      const p = readNum(pos), v = readNum(val);
      if (isNaN(p) || isNaN(v)) return;
      vals[p] = v; pathSet = new Set();
      let id = 1, a = 0, b = n - 1;
      while (true) { pathSet.add(id); if (a === b) break; const m = (a + b) >> 1; if (p <= m) { id = 2 * id; b = m; } else { id = 2 * id + 1; a = m + 1; } }
      draw();
    }
    $("#sg-do", upd).addEventListener("click", update);
    $("#sg-reset", upd).addEventListener("click", () => { A8.forEach((v, i) => { vals[i] = v; }); pathSet = new Set(); draw(); });
    draw();
    return { step(s) { if (s === 1) update(); if (s === 0) { A8.forEach((v, i) => { vals[i] = v; }); pathSet = new Set(); draw(); } } };
  };

  // ------------------------------------------------ sparse table grid
  function stGrid(el, A, o = {}) {
    const n = A.length, sz = o.size || 70, st = buildST(A), K = st.length;
    const grid = h("div"); grid.style.cssText = `display:grid;grid-template-columns:128px repeat(${n},${sz}px);gap:5px;align-items:center;justify-items:center`;
    grid.appendChild(h("div", "small", o.labelA || "A"));
    const top = A.map((v) => { const c = h("div", "c", o.fmt ? o.fmt(v) : v); c.style.setProperty("--sz", sz + "px"); if (o.fmt) c.style.fontSize = sz * 0.3 + "px"; grid.appendChild(c); return c; });
    grid.appendChild(h("div", "small", "i"));
    for (let i = 0; i < n; i++) grid.appendChild(h("div", "idx", String(i)));
    const cells = [];
    for (let k = 0; k < K; k++) {
      const lab = h("div", "small", `<span class="c-sparse mono">k=${k}</span> · dài ${1 << k}`);
      lab.style.justifySelf = "start"; grid.appendChild(lab);
      cells[k] = [];
      for (let i = 0; i < n; i++) {
        const has = i + (1 << k) <= n;
        const c = h("div", "c" + (has ? " two" : " empty"), has ? `${st[k][i]}<small>A=${o.fmt ? o.fmt(A[st[k][i]]) : A[st[k][i]]}</small>` : "");
        c.style.setProperty("--sz", sz + "px");
        if (has) { c.style.cursor = "pointer"; cells[k][i] = c; }
        grid.appendChild(c);
      }
    }
    el.appendChild(grid);
    return { st, top, cells, K, grid };
  }
  W.stread = (el) => {
    const g = stGrid(el, A8, { size: 78 });
    const res = h("div", "lead", ""); el.appendChild(res);
    el.style.cssText += ";display:flex;flex-direction:column;gap:18px";
    function pick(k, i) {
      g.top.forEach((c, j) => { clearHL(c); if (j >= i && j < i + (1 << k)) c.classList.add("hl-q"); if (j === g.st[k][i]) c.classList.add("hl-a"); });
      g.cells.forEach((row) => row.forEach((c) => c && clearHL(c)));
      g.cells[k][i].classList.add("hl-a");
      res.innerHTML = `<span class="mono">st[${k}][${i}] = ${g.st[k][i]}</span>: đoạn <span class="mono q">[${i}, ${i + (1 << k) - 1}]</span>, min ở vị trí <b class="a">${g.st[k][i]}</b>`;
    }
    g.cells.forEach((row, k) => row.forEach((c, i) => { if (c) { c.addEventListener("mouseenter", () => pick(k, i)); c.addEventListener("click", () => pick(k, i)); } }));
    return {
      step(s) {
        g.cells.forEach((row, k) => row.forEach((c) => { if (c) c.style.opacity = k <= s ? 1 : 0.08; }));
        if (s === 0) pick(0, 3); if (s === 1) pick(1, 3); if (s === 2) pick(2, 3); if (s >= 3) pick(3, 0);
      },
    };
  };
  W.stx = (el, o) => {
    const A = o.A || A8, fmt = o.money ? (v) => vn(v / 100, 2) : null;
    const g = stGrid(el, A, { size: o.size || 78, fmt: null, labelA: o.money ? "giá (×100k)" : "A" });
    const res = h("div", "lead", "");
    res.style.minHeight = "104px";
    const row = h("div");
    const ctl = lrFields(row, A.length, o.l === undefined ? 1 : o.l, o.r === undefined ? 6 : o.r, draw);
    el.append(row, res);
    el.style.cssText += ";display:flex;flex-direction:column;gap:14px";
    function draw(l, r) {
      const len = r - l + 1, k = Math.floor(Math.log2(len)), b = 1 << k, p = g.st[k][l], q = g.st[k][r - b + 1], ans = better(A, p, q);
      g.top.forEach((c, j) => {
        clearHL(c);
        const inL = j >= l && j < l + b, inR = j > r - b && j <= r;
        if (inL && inR) c.classList.add("hl-b"); else if (inL) c.classList.add("hl-l"); else if (inR) c.classList.add("hl-r"); else c.classList.add("dim");
        if (j === ans) { clearHL(c); c.classList.add("hl-a"); }
      });
      g.cells.forEach((rw) => rw.forEach((c) => c && clearHL(c)));
      g.cells[k][l].classList.add("hl-l"); g.cells[k][r - b + 1].classList.add("hl-r");
      const dayNote = o.money ? ` · bay ngày <b class="a">${ans + 3}/11</b>` : "";
      res.innerHTML = `<span class="mono">k = ${k}</span> · <span class="c-sparse mono">st[${k}][${l}] = ${p}</span> · <span class="c-seg mono">st[${k}][${r - b + 1}] = ${q}</span> ⇒ <b class="a mono">RMQ(${l}, ${r}) = ${ans}</b>${dayNote}`;
    }
    draw(o.l === undefined ? 1 : o.l, o.r === undefined ? 6 : o.r);
    return { set: ctl.set };
  };

  // ------------------------------------------------ why two blocks cover
  W.cover = (el) => {
    const N = 32, u = 46;
    const svg = sv("svg", { viewBox: `0 0 ${N * u + 10} 216`, width: N * u + 10 });
    const cellsG = sv("g", {}), L = sv("rect", { y: 12, height: 26, rx: 13, fill: "var(--sparse)" }), R = sv("rect", { y: 166, height: 26, rx: 13, fill: "var(--seg)" });
    svg.append(cellsG, L, R);
    const cs = [];
    for (let i = 0; i < N; i++) { const r = sv("rect", { x: i * u + 2, y: 54, width: u - 4, height: 96, rx: 6 }); cs.push(r); cellsG.appendChild(r); }
    const ctl = h("div", "ctl", `<label>L = <b id="cv-v">6</b><input type="range" id="cv-l" min="1" max="32" value="6" style="width:620px"></label>`);
    const res = h("div", "lead", "");
    el.append(svg, ctl, res);
    el.style.cssText += ";display:flex;flex-direction:column;gap:18px";
    const inp = $("#cv-l", ctl);
    function draw() {
      const n = +inp.value, k = Math.floor(Math.log2(n)), b = 1 << k, over = 2 * b - n;
      $("#cv-v", ctl).textContent = n;
      L.setAttribute("x", 2); L.setAttribute("width", b * u - 4);
      R.setAttribute("x", (n - b) * u + 2); R.setAttribute("width", b * u - 4);
      cs.forEach((c, i) => {
        if (i >= n) { c.style.setProperty("fill", "var(--panel)"); return; }
        const inL = i < b, inR = i >= n - b;
        c.style.setProperty("fill", inL && inR ? "var(--sqrt)" : inL ? "var(--l-fill)" : inR ? "var(--r-fill)" : "var(--bad)");
      });
      res.innerHTML = `Khối dài <b>${b}</b> vì <span class="mono">${b} ≤ ${n} &lt; ${2 * b}</span> · chồng lấn <b class="c-sqrt">${over}</b> ô`;
    }
    inp.addEventListener("input", draw);
    draw();
  };

  // ------------------------------------------------ update cost: sparse table vs segment tree
  W.dyn = (el) => {
    const n = 8;
    const wrap = h("div"); wrap.style.cssText = "display:flex;gap:40px;align-items:flex-start";
    const left = h("div"), right = h("div");
    wrap.append(left, right);
    const g = stGrid(left, A8, { size: 56 });
    const svg = sv("svg", { viewBox: "0 0 560 380", width: 560 });
    const nodes = segLayout(n, 560, 28, 104);
    nodes.forEach((nd) => { if (nd && nd.id > 1) { const p = nodes[nd.id >> 1]; nd.edge = sv("line", { x1: p.x, y1: p.y, x2: nd.x, y2: nd.y, stroke: "var(--faint)", "stroke-width": 3 }); svg.appendChild(nd.edge); } });
    nodes.forEach((nd) => { if (nd) { nd.c = sv("circle", { cx: nd.x, cy: nd.y, r: 21, fill: "var(--cell)", stroke: "var(--faint)", "stroke-width": 2.5 }); svg.appendChild(nd.c); } });
    right.appendChild(svg);
    const ctl = h("div", "ctl", `<label>Đổi A[<b id="dy-v">5</b>]<input id="dy-p" type="range" min="0" max="7" value="5"></label>`);
    const res = h("div", "lead", "");
    const big = h("div", "lead", "");
    el.append(wrap, ctl, res, big);
    el.style.cssText += ";display:flex;flex-direction:column;gap:14px";
    const inp = $("#dy-p", ctl);
    const countST = (N, p) => { let t = 0; for (let k = 0; (1 << k) <= N; k++) { const lo = Math.max(0, p - (1 << k) + 1), hi = Math.min(p, N - (1 << k)); t += hi - lo + 1; } return t; };
    function draw() {
      const p = +inp.value; $("#dy-v", ctl).textContent = p;
      let cnt = 0, tot = 0;
      g.cells.forEach((row, k) => row.forEach((c, i) => { if (!c) return; tot++; clearHL(c); if (i <= p && p < i + (1 << k)) { c.classList.add("hl-bad"); cnt++; } }));
      g.top.forEach((c, j) => { clearHL(c); if (j === p) c.classList.add("hl-q"); });
      let id = 1, a = 0, b = n - 1, path = 0;
      nodes.forEach((nd) => { if (nd) { nd.c.style.setProperty("fill", "var(--cell)"); nd.c.style.setProperty("stroke", "var(--faint)"); if (nd.edge) { nd.edge.style.setProperty("stroke", "var(--faint)"); nd.edge.setAttribute("stroke-width", 3); } } });
      while (true) {
        const nd = nodes[id]; nd.c.style.setProperty("fill", "var(--r-bg)"); nd.c.style.setProperty("stroke", "var(--seg)"); if (nd.edge) { nd.edge.style.setProperty("stroke", "var(--seg)"); nd.edge.setAttribute("stroke-width", 6); }
        path++;
        if (a === b) break;
        const m = (a + b) >> 1;
        if (p <= m) { id *= 2; b = m; } else { id = id * 2 + 1; a = m + 1; }
      }
      res.innerHTML = `<span class="c-sparse">Sparse Table</span>: <b class="bad">${cnt}</b>/${tot} ô · <span class="c-seg">Segment Tree</span>: <b class="c-seg">${path}</b> nút`;
      const N = 1 << 20;
      big.innerHTML = `n = 2<sup>20</sup>: <b class="bad">${vn(countST(N, N >> 1))}</b> ô so với <b class="c-seg">21</b> nút`;
    }
    inp.addEventListener("input", draw); draw();
  };

  // ------------------------------------------------ choosing a structure
  W.chooser = (el) => {
    const Q = [
      { q: "Mảng có thay đổi xen kẽ truy vấn?", yes: { name: "Segment Tree", cls: "c-seg", cost: "O(n) xây · O(log n) truy vấn, sửa", why: "Sửa chỉ chạm các nút trên đường lên gốc." } },
      { q: "Cửa sổ cùng độ dài, trượt tuần tự?", yes: { name: "Deque đơn điệu", cls: "c-sqrt", cost: "O(n) cho mọi cửa sổ", why: "Một lượt quét trả lời hết." } },
      { q: "Rất ít truy vấn, hoặc đoạn rất ngắn?", yes: { name: "Duyệt trực tiếp", cls: "c-scan", cost: "không xây · O(L) truy vấn", why: "Đoạn ngắn thì quét là nhanh nhất." } },
      { q: "n rất lớn, hoặc RAM eo hẹp?", yes: { name: "Fischer–Heun", cls: "c-fh", cost: "O(n) xây · O(1) truy vấn", why: "Truy vấn O(1) với bảng nhỏ hơn nhiều lần." } },
    ];
    const LAST = { name: "Sparse Table", cls: "c-sparse", cost: "O(n log n) xây · O(1) truy vấn", why: "Truy vấn nhanh nhất, code khoảng 20 dòng." };
    const SCEN = [["Vé máy bay, giá đã chốt", [0, 0, 0, 0]], ["Giá đổi liên tục", [1]], ["Chuyến đi đúng 3 ngày", [0, 1]], ["Chỉ tra vài lần", [0, 0, 1]], ["10⁹ phần tử, ít RAM", [0, 0, 0, 1]]];
    const wrap = h("div"); wrap.style.cssText = "display:grid;grid-template-columns:1fr 620px;gap:40px";
    const left = h("div", "stack"), right = h("div", "stack");
    wrap.append(left, right);
    const scen = h("div", "ctl"); scen.style.cssText = "gap:10px";
    SCEN.forEach(([name, path]) => { const b = h("button", "ghost", name); b.addEventListener("click", () => { $$("button", scen).forEach((x) => x.classList.remove("on")); b.classList.add("on"); answers = path.slice(); draw(); }); scen.appendChild(b); });
    el.append(scen, wrap);
    el.style.cssText += ";display:flex;flex-direction:column;gap:22px";
    let answers = [];
    function draw() {
      left.innerHTML = "";
      let stop = null;
      Q.forEach((q, i) => {
        const row = h("div", "key"); row.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:20px;padding:12px 22px";
        const ans = answers[i];
        const active = i === 0 || (answers.length >= i && answers.slice(0, i).every((a) => a === 0));
        row.style.opacity = active ? 1 : 0.28;
        if (active && ans === 1) row.style.borderColor = "var(--ans)";
        row.innerHTML = `<span class="txt" style="color:var(--ink)">${q.q}</span>`;
        const bs = h("div", "rowx"); bs.style.flexWrap = "nowrap"; bs.style.gap = "10px";
        ["Không", "Có"].forEach((label, v) => {
          const b = h("button", "ghost" + (active && ans === v ? " on" : ""), label);
          b.addEventListener("click", () => { answers = answers.slice(0, i); answers[i] = v; draw(); });
          bs.appendChild(b);
        });
        row.appendChild(bs); left.appendChild(row);
        if (active && ans === 1 && !stop) stop = q.yes;
      });
      const res = stop || (answers.length >= Q.length ? LAST : null);
      right.innerHTML = res
        ? `<div class="key a" style="padding:26px 30px"><div class="small">Nên chọn</div><h3 class="${res.cls}" style="font-size:52px;margin:8px 0 12px">${res.name}</h3><div class="mono" style="font-size:25px;color:var(--ink)">${res.cost}</div><p class="txt" style="margin-top:14px">${res.why}</p></div>`
        : "";
    }
    draw();
    return { step(s) { if (s === 1) { $$("button", scen)[0].click(); } } };
  };

  // ------------------------------------------------ trees: Catalan shapes
  function allTrees(n) {
    if (n === 0) return [null];
    const out = [];
    for (let l = 0; l < n; l++) for (const L of allTrees(l)) for (const R of allTrees(n - 1 - l)) out.push({ L, R });
    return out;
  }
  function cartesianTree(a) {
    const rec = (lo, hi) => { if (lo > hi) return null; const m = argmin(a, lo, hi); return { i: m, L: rec(lo, m - 1), R: rec(m + 1, hi) }; };
    return rec(0, a.length - 1);
  }
  const codeOf = (t) => (t ? (t.L ? "1" : "0") + (t.R ? "1" : "0") + " " + codeOf(t.L) + codeOf(t.R) : "");
  function drawTree(t, w, ht, color, r = 9) {
    const svg = sv("svg", { viewBox: `0 0 ${w} ${ht}`, width: w, height: ht });
    let idx = 0;
    const pts = [];
    const walk = (nd, d) => { if (!nd) return null; const L = walk(nd.L, d + 1); const me = { x: 0, y: d, id: idx++ }; me.x = me.id; pts.push(me); const R = walk(nd.R, d + 1); me.lc = L; me.rc = R; return me; };
    const root = walk(t, 0);
    const n = pts.length, dmax = Math.max(...pts.map((p) => p.y));
    const X = (p) => (p.x + 0.5) * (w / n), Y = (p) => 14 + p.y * ((ht - 28) / Math.max(1, dmax));
    pts.forEach((p) => [p.lc, p.rc].forEach((c) => { if (c) svg.appendChild(sv("line", { x1: X(p), y1: Y(p), x2: X(c), y2: Y(c), stroke: color, "stroke-width": 3 })); }));
    pts.forEach((p) => svg.appendChild(sv("circle", { cx: X(p), cy: Y(p), r, fill: color })));
    return svg;
  }
  W.catalan = (el) => {
    const shapes = allTrees(4), byCode = {};
    const grid = h("div"); grid.style.cssText = "display:grid;grid-template-columns:repeat(7,1fr);gap:8px";
    const cards = shapes.map((t, i) => {
      const code = codeOf(t).trim(); byCode[code] = i;
      const c = h("div"); c.style.cssText = "background:var(--panel);border:2.5px solid var(--hair);border-radius:10px;padding:6px 2px 4px;text-align:center;cursor:pointer;transition:border-color .25s,background .25s,opacity .25s";
      c.appendChild(drawTree(t, 140, 108, "var(--muted)", 8));
      c.appendChild(h("div", "mono", `<span style="font-size:16px;color:var(--muted);white-space:nowrap">${code}</span>`));
      grid.appendChild(c);
      c.addEventListener("click", () => select(i));
      return c;
    });
    const info = h("div", "lead", "");
    info.style.minHeight = "108px";
    el.append(grid, info);
    el.style.cssText += ";display:flex;flex-direction:column;gap:16px";
    function select(i) { cards.forEach((c, k) => { c.style.borderColor = k === i ? "var(--pi)" : "var(--hair)"; }); info.innerHTML = `Mã: <span class="mono c-pi">${codeOf(shapes[i]).trim()}</span>`; }
    const X = [9, 4, 1, 6], Z = [2, 7, 5, 8];
    const iX = byCode[codeOf(cartesianTree(X)).trim()], iZ = byCode[codeOf(cartesianTree(Z)).trim()];
    return {
      step(s) {
        cards.forEach((c) => { c.style.borderColor = "var(--hair)"; c.style.background = "var(--panel)"; });
        if (s === 0) info.innerHTML = "Toàn bộ 14 hình dạng. Bấm một hình để xem mã.";
        if (s >= 1) { cards[iX].style.borderColor = "var(--fh)"; cards[iX].style.background = "var(--o-bg)"; info.innerHTML = `<span class="mono c-fh">[9,4,1,6] [8,5,3,7] [10,2,0,4]</span>: cùng ô, mã <span class="mono c-fh">${codeOf(cartesianTree(X)).trim()}</span>`; }
        if (s >= 2) { cards[iZ].style.borderColor = "var(--sqrt)"; cards[iZ].style.background = "var(--b-bg)"; info.innerHTML += `<br><span class="mono c-sqrt">[2,7,5,8]</span>: ô khác, mã <span class="mono c-sqrt">${codeOf(cartesianTree(Z)).trim()}</span>`; }
      },
    };
  };

  // ------------------------------------------------ type code by stack
  W.stacktype = (el) => {
    const blocks = [[9, 4, 1, 6, "--fh"], [8, 5, 3, 7, "--fh"], [2, 7, 5, 8, "--sqrt"]];
    const cols = h("div"); cols.style.cssText = "display:grid;grid-template-columns:repeat(3,1fr);gap:26px";
    const views = blocks.map((b) => {
      const box = h("div", "stack"); box.style.gap = "12px";
      const made = makeArr(b.slice(0, 4), { size: 78 });
      const stack = h("div"); stack.style.cssText = "display:flex;gap:6px;min-height:64px;align-items:center";
      const ops = h("div", "mono"); ops.style.cssText = "font-size:29px;min-height:42px;color:var(--ink)";
      const pops = h("div", "small", "");
      box.append(made.root, h("div", "small", "ngăn xếp"), stack, h("div", "small", "1 = push, 0 = pop"), ops, pops);
      cols.appendChild(box);
      return { made, stack, ops, pops, vals: b.slice(0, 4), col: b[4] };
    });
    el.appendChild(cols);
    return {
      step(s) {
        views.forEach((v) => {
          const st = [], popc = [];
          let code = "";
          for (let i = 0; i < Math.min(s, 4); i++) {
            let c = 0;
            while (st.length && st[st.length - 1] > v.vals[i]) { st.pop(); code += "0"; c++; }
            st.push(v.vals[i]); code += "1 "; popc.push(c);
          }
          v.made.cells.forEach((c, i) => { clearHL(c); if (i === s - 1) c.classList.add("hl-q"); else if (i >= s) c.classList.add("dim"); });
          v.stack.innerHTML = "";
          st.forEach((x) => { const c = h("div", "c", x); c.style.setProperty("--sz", "60px"); c.style.borderColor = `var(${v.col})`; v.stack.appendChild(c); });
          v.ops.textContent = code || "·";
          v.ops.style.color = s >= 5 ? `var(${v.col})` : "";
          v.pops.innerHTML = s >= 1 ? `pop: <span class="mono">[${popc.join(", ")}]</span>` : "";
        });
      },
    };
  };

  // ------------------------------------------------ shared table
  W.shared = (el) => {
    const blocks = [{ s: 4, v: [9, 4, 1, 6] }, { s: 8, v: [8, 5, 3, 7] }, { s: 12, v: [10, 2, 0, 4] }];
    const T = {};
    for (let u = 0; u < 4; u++) for (let v = u; v < 4; v++) T[u + "," + v] = argmin(blocks[0].v, u, v);
    const wrap = h("div"); wrap.style.cssText = "display:flex;gap:46px;align-items:flex-start";
    const tbl = h("div"); tbl.style.cssText = "display:grid;grid-template-columns:40px repeat(4,74px);gap:5px;justify-items:center;align-items:center;flex:none";
    tbl.appendChild(h("div", "idx", "u\\v"));
    for (let v = 0; v < 4; v++) tbl.appendChild(h("div", "idx", v));
    const cells = {};
    for (let u = 0; u < 4; u++) {
      tbl.appendChild(h("div", "idx", u));
      for (let v = 0; v < 4; v++) {
        const c = h("div", "c" + (v < u ? " empty" : ""), v >= u ? T[u + "," + v] : "");
        if (v >= u) { c.style.cursor = "pointer"; cells[u + "," + v] = c; c.addEventListener("mouseenter", () => pick(u, v)); c.addEventListener("click", () => pick(u, v)); }
        tbl.appendChild(c);
      }
    }
    const right = h("div", "stack grow");
    const rows = blocks.map((b, i) => {
      const row = h("div"); row.style.cssText = "display:flex;gap:14px;align-items:center";
      const made = makeArr(b.v, { size: 62, start: b.s });
      const lab = h("div", "txt", ""); lab.style.minWidth = "0";
      row.append(h("div", "small", `khối ${i + 1}`), made.root, lab);
      right.appendChild(row);
      return { made, lab, b };
    });
    wrap.append(tbl, right);
    const cap = h("div", "lead", "");
    el.append(wrap, cap);
    el.style.cssText += ";display:flex;flex-direction:column;gap:18px";
    function pick(u, v) {
      Object.values(cells).forEach(clearHL);
      cells[u + "," + v].classList.add("hl-o");
      const p = T[u + "," + v];
      rows.forEach(({ made, lab, b }) => {
        made.cells.forEach((c, i) => { clearHL(c); if (i >= u && i <= v) c.classList.add("hl-q"); if (i === p) { clearHL(c); c.classList.add("hl-a"); } });
        lab.innerHTML = `<span class="mono">${b.s} + ${p} = <b class="a">${b.s + p}</b></span>`;
      });
      cap.innerHTML = `<span class="mono c-fh">T[type][${u}][${v}] = ${p}</span> ⇒ chỉ số gốc = vị trí bắt đầu + ${p}`;
    }
    pick(0, 1);
  };

  // ------------------------------------------------ why c = 1/4
  W.quarter = (el) => {
    const lgn = 32;
    const rows = h("div", "stack"); rows.style.gap = "14px";
    const ctl = h("div", "ctl", `<label>b = <b id="qr-c">0,25</b> · log₂ n<input type="range" id="qr-r" min="1" max="20" value="5" style="width:640px"></label><span class="small">với n = 2<sup>32</sup> ≈ 4,3 tỉ</span>`);
    const verdict = h("div", "lead", "");
    el.append(ctl, rows, verdict);
    el.style.cssText += ";display:flex;flex-direction:column;gap:22px";
    const inp = $("#qr-r", ctl);
    const bars = [["n", "var(--muted)"], ["Sparse Table đại diện", "var(--sparse)"], ["Bảng tra 4ᵇ·b³", "var(--fh)"]].map(([name, col]) => {
      const row = h("div"); row.style.cssText = "display:grid;grid-template-columns:380px 1fr 170px;gap:18px;align-items:center";
      const lab = h("div", "txt", name), track = h("div"), fill = h("div"), val = h("div", "mono", "");
      track.style.cssText = "height:30px;background:var(--panel);border-radius:6px;overflow:hidden";
      fill.style.cssText = `height:100%;background:${col};width:0;transition:width .2s`;
      val.style.cssText = "font-size:25px;text-align:right;color:var(--ink)";
      track.appendChild(fill); row.append(lab, track, val); rows.appendChild(row);
      return { fill, val };
    });
    const MAXLOG = 64;
    const sup = (lg) => `2<sup>${vnA(lg)}</sup>`;
    function draw() {
      const c = +inp.value / 20, b = c * lgn;
      $("#qr-c", ctl).textContent = vnA(c);
      const mLog = lgn - Math.log2(b), topLog = mLog + Math.log2(Math.max(1, mLog));
      const tabLog = 2 * b + 3 * Math.log2(b);
      [lgn, topLog, tabLog].forEach((lg, i) => { bars[i].fill.style.width = Math.min(100, lg / MAXLOG * 100) + "%"; bars[i].val.innerHTML = sup(lg.toFixed(1)); });
      const ok = tabLog <= lgn;
      const nc = 2 * c;
      verdict.innerHTML = `Số loại khối <span class="mono">4<sup>b</sup> = n<sup>${vnA(nc)}</sup></span> ⇒ ` + (c < 0.5
        ? `bảng tra o(n). <b class="a">Dùng được.</b>`
        : `bảng tra vượt tuyến tính. <b class="bad">Không còn O(n).</b>`);
    }
    inp.addEventListener("input", draw);
    draw();
  };

  // ------------------------------------------------ whole query, step by step
  // A16 split into 4 blocks of b = 4; the inputs slide and the walk-through draw the same row
  const fhRow = (sz, caps) => {
    const b = 4, row = h("div"), cells = [];
    row.style.cssText = "display:flex;gap:10px;flex-wrap:nowrap";
    for (let t = 0; t < 4; t++) {
      const grp = h("div"); grp.style.cssText = "display:flex;gap:3px;padding:5px;border:2px solid var(--o-line);border-radius:9px;position:relative";
      for (let i = t * b; i < (t + 1) * b; i++) { const w = h("div", "cellw"), c = h("div", "c", A16[i]); c.style.setProperty("--sz", sz + "px"); w.append(c, h("div", "idx", i)); grp.appendChild(w); cells.push(c); }
      if (!caps) { row.appendChild(grp); continue; }
      const col = h("div"); col.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:6px";
      col.append(h("div", "small", `khối ${t}`), grp);
      row.appendChild(col);
    }
    return { row, cells };
  };
  // what the build step leaves for the query: each block's minimum (value V[t], position G[t])
  W.fhin = (el) => {
    const { row, cells } = fhRow(58, true);
    for (let t = 0; t < 4; t++) { let p = 4 * t; for (let i = p + 1; i < 4 * t + 4; i++) if (A16[i] < A16[p]) p = i; cells[p].classList.add("hl-b"); }
    el.appendChild(row);
  };
  W.fhq = (el) => {
    const { row, cells } = fhRow(66);
    const body = h("div"); body.style.cssText = "display:grid;grid-template-columns:740px 1fr;gap:36px;align-items:start";
    const code = h("pre", "code");
    const L = [
      ["rmq(l, r):", -1],
      ["  a = l / b;  c = r / b", 1],
      ["  nếu a == c: return inBlock(a, l%b, r%b)", -1],
      ["  left  = inBlock(a, l%b, b-1)", 2],
      ["  right = inBlock(c, 0, r%b)", 3],
      ["  ans = better(left, right)", 3],
      ["  nếu a+1 <= c-1:", 4],
      ["    t = macro.rmq(a+1, c-1)", 4],
      ["    ans = better(ans, G[t])", 5],
      ["  return ans", 5],
    ];
    code.innerHTML = L.map(([t], i) => `<div class="ln" data-i="${i}" style="padding:1px 8px;border-radius:5px;transition:background .25s">${t.replace(/</g, "&lt;")}</div>`).join("");
    const out = h("div", "stack"); out.style.gap = "14px";
    body.append(code, out);
    el.append(row, body);
    el.style.cssText += ";display:flex;flex-direction:column;gap:20px";
    const notes = [
      `<p class="lead"><span class="mono q">RMQ(7, 12)</span>, b = 4</p><p class="lead mono c-fh">V = [2, 1, 3, 0]<br>G = [0, 6, 10, 14]</p>`,
      `<p class="lead mono">a = 7 / 4 = 1<br>c = 12 / 4 = 3</p>`,
      `<p class="lead"><span class="mono c-sparse">T[type₁][3][3] = 3</span><br>⇒ vị trí 7, giá trị 6</p>`,
      `<p class="lead"><span class="mono c-seg">T[type₃][0][0] = 0</span><br>⇒ vị trí 12, giá trị 10</p>`,
      `<p class="lead"><span class="mono c-sqrt">G[2] = 10</span><br>⇒ vị trí 10, giá trị 3</p>`,
      `<p class="lead a">So 6, 10, 3 ⇒ <b class="mono">RMQ(7, 12) = 10</b></p><p class="txt">Không vòng lặp theo độ dài đoạn: O(1).</p>`,
    ];
    return {
      step(s) {
        cells.forEach((c, i) => { clearHL(c); if (i < 7 || i > 12) c.classList.add("dim"); });
        if (s === 0) cells.forEach(clearHL);
        if (s >= 1) { for (let i = 7; i <= 12; i++) cells[i].classList.add("hl-q"); }
        if (s >= 2) { clearHL(cells[7]); cells[7].classList.add("hl-l"); }
        if (s >= 3) { clearHL(cells[12]); cells[12].classList.add("hl-r"); }
        if (s >= 4) { for (let i = 8; i <= 11; i++) { clearHL(cells[i]); cells[i].classList.add("hl-b"); } }
        if (s >= 5) { clearHL(cells[10]); cells[10].classList.add("hl-a"); }
        $$(".ln", code).forEach((l) => { const stp = L[+l.dataset.i][1]; l.style.background = stp === s ? "var(--q-bg)" : "transparent"; });
        out.innerHTML = notes[s];
      },
    };
  };

  // ------------------------------------------------ charts
  const ALGO = { Scan: ["Duyệt", "--scan"], Sqrt: ["Chia khối √n", "--sqrt"], Segment: ["Segment Tree", "--seg"], FischerHeun: ["Fischer–Heun", "--fh"], Sparse: ["Sparse Table", "--sparse"] };
  function lineChart(el, o) {
    const W_ = o.w || 1180, H = o.h || 560, m = { l: 118, r: o.right === undefined ? 190 : o.right, t: 38, b: 70 };
    const svg = sv("svg", { viewBox: `0 0 ${W_} ${H}`, width: W_ });
    const lx = o.xlog ? (v) => Math.log10(v) : (v) => v, ly = o.ylog ? (v) => Math.log10(v) : (v) => v;
    const [x0, x1] = o.xr.map(lx), [y0, y1] = o.yr.map(ly);
    const X = (v) => m.l + (lx(v) - x0) / (x1 - x0) * (W_ - m.l - m.r), Y = (v) => H - m.b - (ly(v) - y0) / (y1 - y0) * (H - m.t - m.b);
    o.yticks.forEach((t) => {
      svg.appendChild(sv("line", { x1: m.l, x2: W_ - m.r, y1: Y(t), y2: Y(t), stroke: "var(--hair)" }));
      svg.appendChild(sv("text", { x: m.l - 12, y: Y(t) + 7, "text-anchor": "end", "font-size": 22, class: "m" }, o.fmtY ? o.fmtY(t) : vnA(t)));
    });
    o.xticks.forEach((t) => {
      svg.appendChild(sv("line", { x1: X(t), x2: X(t), y1: H - m.b, y2: H - m.b + 7, stroke: "var(--faint)" }));
      const tx = sv("text", { x: X(t), y: H - m.b + 32, "text-anchor": "middle", "font-size": 22, class: "m" });
      if (o.fmtXsup) { const s = o.fmtXsup(t); tx.textContent = s[0]; const u = sv("tspan", { dy: -9, "font-size": 15 }, s[1]); tx.appendChild(u); } else tx.textContent = o.fmtX ? o.fmtX(t) : vnA(t);
      svg.appendChild(tx);
    });
    svg.appendChild(sv("line", { x1: m.l, x2: W_ - m.r, y1: H - m.b, y2: H - m.b, stroke: "var(--faint)" }));
    svg.appendChild(sv("text", { x: (m.l + W_ - m.r) / 2, y: H - 8, "text-anchor": "middle", "font-size": 23 }, o.xlabel || ""));
    svg.appendChild(sv("text", { x: 0, y: 20, "font-size": 23 }, o.ylabel || ""));
    (o.vlines || []).forEach((v) => {
      svg.appendChild(sv("line", { x1: X(v.x), x2: X(v.x), y1: m.t, y2: H - m.b, stroke: "var(--faint)", "stroke-dasharray": "5 6" }));
      svg.appendChild(sv("text", { x: X(v.x) - 6, y: m.t + 18, "text-anchor": "end", "font-size": 19, style: "fill:var(--muted)" }, v.label));
    });
    const lines = [];
    o.series.forEach((s) => {
      const d = s.pts.map(([x, y], i) => (i ? "L" : "M") + X(x).toFixed(1) + " " + Y(y).toFixed(1)).join("");
      const p = sv("path", { d, fill: "none", stroke: s.color, "stroke-width": 4, "stroke-linejoin": "round", "stroke-linecap": "round" });
      if (s.dash) p.setAttribute("stroke-dasharray", s.dash);
      svg.appendChild(p);
      s.pts.forEach(([x, y]) => { const c = sv("circle", { cx: X(x), cy: Y(y), r: 4.5, fill: s.color }); svg.appendChild(c); });
      lines.push({ p, s });
    });
    // direct labels at the line ends, nudged apart so they do not collide
    const labs = o.series.map((s) => {
      const last = s.pts[s.pts.length - 1], width = s.name.length * 13.5;
      let x = X(last[0]) + 12 + (s.dx || 0), y = Y(last[1]) + 8 + (s.dy || 0);
      if (x + width > W_) { x = X(last[0]) - width - 8; y -= 26; }
      return { s, x, y, width };
    }).sort((a, b) => a.y - b.y);
    labs.forEach((a, i) => { for (let j = 0; j < i; j++) { const b = labs[j]; if (a.x < b.x + b.width && b.x < a.x + a.width && Math.abs(a.y - b.y) < 28) a.y = b.y + 28; } });
    labs.forEach(({ s, x, y }) => { svg.appendChild(sv("text", { x, y, "font-size": 24, style: `fill:${s.color};font-weight:600` }, s.name)); });
    el.appendChild(svg);
    const tip = h("div", "chart-tip", "&nbsp;");
    tip.style.minHeight = "34px";
    if (o.tip !== false) el.appendChild(tip);
    const cursor = sv("line", { y1: m.t, y2: H - m.b, stroke: "var(--ink)", "stroke-width": 1, opacity: 0 });
    svg.appendChild(cursor);
    svg.addEventListener("mousemove", (e) => {
      const r = svg.getBoundingClientRect(), px = (e.clientX - r.left) * W_ / r.width;
      const allX = o.series[0].pts.map((p) => p[0]);
      let best = allX[0], bd = 1e9;
      allX.forEach((x) => { const dd = Math.abs(X(x) - px); if (dd < bd) { bd = dd; best = x; } });
      cursor.setAttribute("x1", X(best)); cursor.setAttribute("x2", X(best)); cursor.setAttribute("opacity", 0.4);
      const parts = o.series.map((s) => { const p = s.pts.find((q) => q[0] === best); return p ? `<span style="color:${s.color}">${s.name} ${o.fmtV ? o.fmtV(p[1]) : vnA(p[1])}</span>` : ""; }).filter(Boolean);
      tip.innerHTML = `${o.tipX ? o.tipX(best) : best}: ` + parts.join(" · ");
    });
    svg.addEventListener("mouseleave", () => cursor.setAttribute("opacity", 0));
    return {
      enter() {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        lines.forEach(({ p }) => {
          if (p.getAttribute("stroke-dasharray")) return;
          const len = p.getTotalLength();
          p.animate([{ strokeDasharray: `${len}`, strokeDashoffset: `${len}` }, { strokeDasharray: `${len}`, strokeDashoffset: "0" }], { duration: 750, easing: "ease-out" });
        });
      },
    };
  }
  const colorOf = (k) => `var(${ALGO[k][1]})`;
  W.chartN = (el) => {
    const B = window.BENCH.scale, keys = ["Scan", "Sqrt", "Segment", "FischerHeun", "Sparse"];
    const series = keys.map((k) => ({ name: ALGO[k][0], color: colorOf(k), pts: B[k].map((r) => [r.n, r.ns]) }));
    return lineChart(el, {
      series, xlog: true, ylog: true, xr: [1 << 10, 1 << 23], yr: [1, 500000],
      yticks: [1, 10, 100, 1000, 10000, 100000], xticks: [1 << 10, 1 << 13, 1 << 16, 1 << 19, 1 << 22],
      fmtXsup: (t) => ["2", String(Math.round(Math.log2(t)))], xlabel: "n, số phần tử (thang log)", ylabel: "nano giây / truy vấn (thang log)",
      fmtY: (t) => vn(t), fmtV: (v) => vnA(v) + " ns", tipX: (x) => `n = 2^${Math.round(Math.log2(x))}`,
      vlines: [{ x: 12288, label: "L1" }, { x: 327680, label: "L2" }, { x: 6291456, label: "L3" }],
    });
  };
  W.chartL = (el) => {
    const B = window.BENCH.length, keys = ["Scan", "Segment", "FischerHeun", "Sparse"];
    const pts = (k, cap) => B[k].filter((r) => r.L <= cap).map((r) => [r.L, r.ns]);
    const series = keys.map((k) => ({ name: ALGO[k][0], color: colorOf(k), pts: pts(k, k === "Scan" ? 65536 : 1048576) }));
    return lineChart(el, {
      series, xlog: true, ylog: true, xr: [1, 1048576], yr: [3, 6000], h: 500,
      yticks: [10, 100, 1000], xticks: [1, 16, 256, 4096, 65536, 1048576],
      fmtX: (t) => vn(t), xlabel: "L, độ dài đoạn truy vấn (thang log)", ylabel: "nano giây / truy vấn (thang log), n = 2²²",
      fmtV: (v) => vnA(v) + " ns", tipX: (x) => `L = ${vn(x)}`,
    });
  };
  W.chartMixed = (el) => {
    const B = window.BENCH.mixed, keys = ["Sqrt", "Segment"];
    const series = keys.map((k) => ({ name: ALGO[k][0], color: colorOf(k), pts: B[k].map((r) => [r.pct, r.ms]) }));
    return lineChart(el, {
      series, xr: [0, 100], yr: [0, 12], h: 480, yticks: [0, 2, 4, 6, 8, 10, 12], xticks: [0, 25, 50, 75, 100],
      fmtX: (t) => t + "%", xlabel: "tỉ lệ thao tác cập nhật trong 131.072 thao tác", ylabel: "tổng mili giây (xây + thao tác), n = 2¹⁷",
      fmtV: (v) => vnA(v) + " ms", tipX: (x) => `${x}% cập nhật`,
    });
  };
  W.costBars = (el) => {
    const B = window.BENCH.scale, N = 1 << 20, keys = ["Sparse", "FischerHeun", "Segment", "Sqrt", "Scan"];
    const get = (k) => B[k].find((r) => r.n === N);
    const panel = (title, val, fmt, maxV) => {
      const box = h("div", "stack grow"); box.style.gap = "12px";
      box.appendChild(h("h3", "", title));
      keys.forEach((k) => {
        const v = val(get(k));
        const row = h("div"); row.style.cssText = "display:grid;grid-template-columns:186px 1fr 118px;gap:10px;align-items:center";
        const track = h("div"), f = h("div");
        track.style.cssText = "height:32px;background:var(--panel);border-radius:5px;overflow:hidden";
        f.style.cssText = `height:100%;width:${Math.max(0.4, v / maxV * 100)}%;background:${colorOf(k)}`;
        track.appendChild(f);
        const name = h("div", "txt", ALGO[k][0]); name.style.cssText = "font-size:26px;white-space:nowrap"; row.append(name, track, h("div", "mono", `<span style="font-size:25px;color:var(--ink)">${fmt(v)}</span>`));
        box.appendChild(row);
      });
      return box;
    };
    const wrap = h("div"); wrap.style.cssText = "display:flex;gap:56px";
    wrap.append(
      panel("Thời gian xây (ms)", (r) => r.build, (v) => vnA(v), 30),
      panel("Bộ nhớ phụ (byte / phần tử)", (r) => r.mem / r.n, (v) => vnA(v), 78),
      panel("Một truy vấn (ns)", (r) => r.ns, (v) => (v > 1000 ? vn(v) : vnA(v)), 120));
    el.appendChild(wrap);
    const note = h("div", "small", "Thanh truy vấn của Duyệt vượt khỏi thang đo: khoảng 20 micro giây mỗi truy vấn.");
    el.appendChild(note);
    el.style.cssText += ";display:flex;flex-direction:column;gap:14px";
  };
  W.breakeven = (el) => {
    const B = window.BENCH.breakeven, keys = ["Scan", "Sqrt", "Segment", "FischerHeun", "Sparse"];
    const model = {};
    keys.forEach((k) => {
      const rows = B[k], r1 = rows[rows.length - 1];
      const build = rows.reduce((s, r) => s + r.build, 0) / rows.length;
      model[k] = { build, t: r1.ops / r1.q };  // ms per query from the largest measured q
    });
    const qs = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000];
    const series = keys.map((k) => {
      const pts = B[k].map((r) => [r.q, Math.max(r.total, 0.05)]);
      return k === "Sqrt" ? { name: ALGO[k][0], color: colorOf(k), pts, dx: -180, dy: -38 } : { name: ALGO[k][0], color: colorOf(k), pts };
    });
    const ctl = h("div", "ctl", `<label>q = <b id="be-q">100.000</b><input id="be-r" type="range" min="0" max="70" value="50" style="width:680px"></label>`);
    const out = h("div", "lead", "");
    const c = lineChart(el, {
      series, xlog: true, ylog: true, xr: [1, 1e7], yr: [0.05, 2000], h: 440, tip: false, right: 200,
      yticks: [0.1, 1, 10, 100, 1000], xticks: qs, fmtX: (t) => (t >= 1e6 ? `${t / 1e6}·10⁶` : vn(t)),
      xlabel: "q, số truy vấn (thang log), n = 2²⁰", ylabel: "tổng mili giây = xây + q truy vấn (thang log)", fmtY: (t) => vnA(t),
    });
    el.append(ctl, out);
    el.style.cssText += ";display:flex;flex-direction:column;gap:10px";
    const inp = $("#be-r", ctl);
    const cross = (a, b) => (model[a].build - model[b].build) / (model[b].t - model[a].t);
    const q1 = cross("FischerHeun", "Segment"), q2 = cross("Sparse", "FischerHeun");
    window.__breakeven = { q1, q2, model };
    function draw() {
      const q = Math.round(Math.pow(10, +inp.value / 10));
      $("#be-q", ctl).textContent = vn(q);
      const T = keys.map((k) => ({ k, v: model[k].build + q * model[k].t })).sort((a, b) => a.v - b.v);
      out.innerHTML = `Nhanh nhất: <b style="color:${colorOf(T[0].k)}">${ALGO[T[0].k][0]}</b> (${vnA(T[0].v)} ms)<div class="txt" style="margin-top:6px">Hòa vốn: Fischer–Heun vượt Segment Tree ở q ≈ <b>${vn(Math.round(q1 / 1000) * 1000)}</b> · Sparse Table vượt Fischer–Heun ở q ≈ <b>${vn(Math.round(q2 / 1e5) * 1e5)}</b></div>`;
    }
    inp.addEventListener("input", draw); draw();
    return c;
  };

  // ------------------------------------------------ time series: real min/max RMQ per pixel column
  W.ts = (el) => {
    const N = 200000, W_ = 1040, H = 340;
    const cv = h("canvas"); cv.width = W_ * 2; cv.height = H * 2; cv.style.cssText = `width:${W_}px;height:${H}px;display:block;cursor:crosshair;background:var(--panel);border:2px solid var(--hair);border-radius:12px;touch-action:none`;
    const side = h("div", "stack"); side.style.width = "680px"; side.style.flex = "none"; side.style.gap = "10px";
    const wrap = h("div"); wrap.style.cssText = "display:flex;gap:26px;align-items:flex-start";
    const left = h("div", "stack"); left.style.gap = "12px"; left.append(cv);
    const btns = h("div", "ctl", `<button class="ghost" id="ts-all">Toàn bộ</button><button class="ghost" id="ts-in">Zoom vào vùng chọn</button><span class="small">Kéo để chọn khoảng · ${vn(N)} điểm giá mô phỏng</span>`);
    left.appendChild(btns);
    wrap.append(left, side);
    el.appendChild(wrap);
    const ctx = cv.getContext("2d");
    let a, stMin, stMax, built = false, view = [0, N - 1], sel = null, drag = null;
    let seed = 20261102;
    const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const lg = new Uint8Array(N + 1); for (let i = 2; i <= N; i++) lg[i] = lg[i >> 1] + 1;
    function build() {
      if (built) return;
      a = new Float32Array(N);
      let v = 48, drift = 0;
      for (let i = 0; i < N; i++) { if (i % 9000 === 0) drift = (rnd() - 0.5) * 0.008; v = Math.max(6, v * (1 + drift * 0.02 + (rnd() - 0.5) * 0.0042)); a[i] = v; }
      const K = lg[N] + 1;
      stMin = [new Int32Array(N)]; stMax = [new Int32Array(N)];
      for (let i = 0; i < N; i++) { stMin[0][i] = i; stMax[0][i] = i; }
      for (let k = 1; k < K; k++) {
        const len = N - (1 << k) + 1, h2 = 1 << (k - 1), m0 = stMin[k - 1], x0 = stMax[k - 1], m1 = new Int32Array(len), x1 = new Int32Array(len);
        for (let i = 0; i < len; i++) { const p = m0[i], q = m0[i + h2]; m1[i] = a[p] <= a[q] ? p : q; const r = x0[i], s = x0[i + h2]; x1[i] = a[r] >= a[s] ? r : s; }
        stMin[k] = m1; stMax[k] = x1;
      }
      built = true;
    }
    const qMin = (l, r) => { const k = lg[r - l + 1], p = stMin[k][l], q = stMin[k][r - (1 << k) + 1]; return a[p] <= a[q] ? p : q; };
    const qMax = (l, r) => { const k = lg[r - l + 1], p = stMax[k][l], q = stMax[k][r - (1 << k) + 1]; return a[p] >= a[q] ? p : q; };
    const pad = { l: 66, r: 10, t: 14, b: 24 };
    const px2i = (x) => Math.round(view[0] + (x - pad.l) / (W_ - pad.l - pad.r) * (view[1] - view[0]));
    const i2px = (i) => pad.l + (i - view[0]) / (view[1] - view[0]) * (W_ - pad.l - pad.r);
    function draw() {
      const plotW = W_ - pad.l - pad.r, plotH = H - pad.t - pad.b;
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      ctx.clearRect(0, 0, W_, H);
      const lo = a[qMin(view[0], view[1])], hi = a[qMax(view[0], view[1])], rg = Math.max(1e-6, hi - lo);
      const Y = (v) => pad.t + (hi - v) / rg * plotH;
      ctx.strokeStyle = css("--hair"); ctx.fillStyle = css("--muted"); ctx.font = "19px 'JetBrains Mono', monospace"; ctx.textAlign = "right"; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) { const v = lo + rg * i / 4, y = Y(v); ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W_ - pad.r, y); ctx.stroke(); ctx.fillText(v.toFixed(1).replace(".", ","), pad.l - 8, y + 6); }
      const span = view[1] - view[0];
      ctx.fillStyle = css("--sparse");
      for (let x = 0; x < plotW; x++) {
        const i1 = view[0] + Math.floor(x / plotW * span), i2 = Math.min(view[1], view[0] + Math.floor((x + 1) / plotW * span));
        const mn = a[qMin(i1, Math.max(i1, i2))], mx = a[qMax(i1, Math.max(i1, i2))];
        const y1 = Y(mx), y2 = Y(mn);
        ctx.fillRect(pad.l + x, y1, 1, Math.max(1, y2 - y1));
      }
      let selTxt = `<p class="txt">Kéo chuột để chọn khoảng.</p>`;
      if (sel) {
        const [l, r] = sel;
        const px1 = i2px(l), px2 = i2px(r);
        ctx.fillStyle = css("--q-bg"); ctx.globalAlpha = 0.75; ctx.fillRect(px1, pad.t, px2 - px1, plotH); ctx.globalAlpha = 1;
        ctx.strokeStyle = css("--query"); ctx.lineWidth = 2; ctx.strokeRect(px1, pad.t, px2 - px1, plotH);
        const m = qMin(l, r), X = qMax(l, r);
        [[m, css("--ans")], [X, css("--bad")]].forEach(([p, col]) => { const x = i2px(p), y = Y(a[p]); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill(); });
        selTxt = `<p class="lead" style="font-size:33px"><span class="a">min ${a[m].toFixed(2).replace(".", ",")}</span> · <span class="bad">max ${a[X].toFixed(2).replace(".", ",")}</span></p>` +
          `<p class="txt" style="font-size:27px">${vn(r - l + 1)} điểm · RMQ: <b>2</b> lần tra · quét: <b>${vn(r - l + 1)}</b> lần đọc</p>`;
      }
      side.innerHTML = selTxt;
    }
    const toX = (e) => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) * W_ / r.width; };
    const clampI = (x) => Math.max(view[0], Math.min(view[1], px2i(x)));
    cv.addEventListener("pointerdown", (e) => { drag = clampI(toX(e)); sel = [drag, drag]; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", (e) => { if (drag === null) return; const i = clampI(toX(e)); sel = [Math.min(drag, i), Math.max(drag, i)]; draw(); });
    cv.addEventListener("pointerup", () => { drag = null; });
    $("#ts-all", btns).addEventListener("click", () => { view = [0, N - 1]; sel = null; draw(); });
    $("#ts-in", btns).addEventListener("click", () => { if (sel && sel[1] - sel[0] > 20) { view = sel.slice(); sel = null; draw(); } });
    addEventListener("deck-theme", () => { if (built) draw(); });
    return {
      enter() { build(); draw(); },
      step(s) { if (!built) build(); if (s === 0) { view = [0, N - 1]; sel = null; } if (s >= 1) { view = [0, N - 1]; sel = [62000, 118000]; } if (s >= 2) { view = [62000, 118000]; sel = [80000, 88000]; } draw(); },
    };
  };

  // ------------------------------------------------ DNA: suffix array + LCP + RMQ
  W.dna = (el) => {
    const S = "GATTACAGATTAC$", n = S.length;
    const order = [...Array(n).keys()].sort((a, b) => { const x = S.slice(a), y = S.slice(b); return x < y ? -1 : x > y ? 1 : 0; });
    const lcpOf = (a, b) => { let k = 0; while (a + k < n && b + k < n && S[a + k] === S[b + k]) k++; return k; };
    const LCP = order.map((p, r) => (r ? lcpOf(order[r - 1], p) : 0));
    const rankOf = []; order.forEach((p, r) => { rankOf[p] = r; });
    const rh = 40, base = 42;
    const tbl = h("div"); tbl.style.cssText = `position:relative;height:${base + n * rh}px;width:860px;flex:none`;
    const hdr = (t, x, cls = "") => { const d = h("div", "small " + cls, t); d.style.cssText += `;position:absolute;left:${x}px;top:0`; tbl.appendChild(d); return d; };
    hdr("hạng", 0); const hSA = hdr("SA", 74, "c-sparse"); hdr("hậu tố", 150); const hL = hdr("LCP", 720, "c-fh");
    const col = { A: "var(--dna-a)", C: "var(--dna-c)", G: "var(--dna-g)", T: "var(--dna-t)", $: "var(--muted)" };
    const rows = [...Array(n).keys()].map((p) => {
      const row = h("div"); row.style.cssText = `position:absolute;left:0;top:${base + p * rh}px;width:860px;height:${rh - 3}px;display:flex;align-items:center;cursor:pointer;transition:top .9s cubic-bezier(.3,.9,.3,1),background .2s;border-radius:7px`;
      const rk = h("div", "mono"); rk.style.cssText = "width:74px;font-size:24px;color:var(--muted);text-align:center";
      const sa = h("div", "mono c-sparse", p); sa.style.cssText += ";width:76px;font-size:26px;text-align:center";
      const txt = h("div", "mono"); txt.style.cssText = "width:570px;font-size:28px;letter-spacing:.03em;white-space:pre";
      txt.innerHTML = S.slice(p).split("").map((c) => `<span style="color:${col[c]}">${c}</span>`).join("");
      const lc = h("div", "c"); lc.style.setProperty("--sz", "36px"); lc.style.fontSize = "22px"; lc.style.marginLeft = "4px";
      row.append(rk, sa, txt, lc);
      row.addEventListener("click", () => pickRow(p));
      tbl.appendChild(row);
      return { row, rk, txt, lc, p };
    });
    const side = h("div", "stack grow");
    const wrap = h("div"); wrap.style.cssText = "display:flex;gap:40px;align-items:flex-start";
    wrap.append(tbl, side);
    el.appendChild(wrap);
    let sorted = false, showL = false, picks = [];
    function pickRow(p) { if (!showL) return; picks = picks.length >= 2 ? [p] : [...picks, p]; paint(); }
    function paint() {
      rows.forEach((r) => {
        const rank = sorted ? rankOf[r.p] : r.p;
        r.row.style.top = base + rank * rh + "px";
        r.rk.textContent = sorted ? rank : "";
        r.lc.textContent = showL ? LCP[rankOf[r.p]] : "";
        r.lc.style.opacity = showL ? 1 : 0;
        clearHL(r.lc); r.row.style.background = "transparent";
        r.txt.innerHTML = S.slice(r.p).split("").map((c) => `<span style="color:${col[c]}">${c}</span>`).join("");
      });
      hL.style.opacity = showL ? 1 : 0; hSA.style.opacity = 1;
      if (picks.length === 2 && picks[0] !== picks[1]) {
        let [x, y] = picks.map((p) => rankOf[p]); if (x > y) [x, y] = [y, x];
        let m = x + 1; for (let r = x + 1; r <= y; r++) { const row = rows[order[r]]; row.lc.classList.add("hl-q"); if (LCP[r] < LCP[m]) m = r; }
        rows[order[m]].lc.classList.remove("hl-q"); rows[order[m]].lc.classList.add("hl-a");
        const v = LCP[m];
        [order[x], order[y]].forEach((p) => {
          rows[p].row.style.background = "var(--row-hl)";
          rows[p].txt.innerHTML = S.slice(p).split("").map((c, i) => (i < v ? `<span style="color:var(--on-accent);background:var(--ans);border-radius:3px">${c}</span>` : `<span style="color:${col[c]}">${c}</span>`)).join("");
        });
        side.querySelector(".res").innerHTML = `Hạng ${x} và ${y}: <span class="mono">min LCP[${x + 1}..${y}] = <b class="a">${v}</b></span><br>Đoạn chung: <span class="mono a">${S.slice(order[x], order[x] + v) || "(rỗng)"}</span>.`;
      } else if (showL) side.querySelector(".res").innerHTML = "Bấm hai dòng để so sánh.";
    }
    side.innerHTML = `<div class="res lead"></div>`;
    side.appendChild($(".dna-extra", el.parentElement) || h("div"));
    return {
      step(s) {
        sorted = s >= 1; showL = s >= 2; picks = s === 3 ? [order[8], order[9]] : s >= 4 ? [order[3], order[5]] : [];
        if (s === 0) side.querySelector(".res").innerHTML = `DNA: <span class="mono">${S.slice(0, -1)}</span><br>Mỗi dòng là một hậu tố.`;
        if (s === 1) side.querySelector(".res").innerHTML = "Sắp theo thứ tự từ điển.<br>Cột SA: vị trí bắt đầu.";
        if (s === 2) side.querySelector(".res").innerHTML = "<span class=\"c-fh\">LCP[k]</span>: số ký tự chung với dòng ngay trên.";
        paint();
      },
    };
  };

  // ------------------------------------------------ document listing
  W.docs = (el) => {
    const DA = [1, 3, 2, 1, 2, 3, 1, 2], l0 = 2, r0 = 7;
    const C = DA.map((d, i) => { for (let j = i - 1; j >= 0; j--) if (DA[j] === d) return j; return -1; });
    const colD = { 1: "var(--dna-t)", 2: "var(--dna-a)", 3: "var(--dna-c)" };
    const steps = [];
    (function rec(l, r) {
      if (l > r) return;
      const k = argmin(C, l, r);
      if (C[k] >= l0) { steps.push({ l, r, k, ok: false }); return; }
      steps.push({ l, r, k, ok: true });
      rec(l, k - 1); rec(k + 1, r);
    })(l0, r0);
    const grid = h("div"); grid.style.cssText = "display:grid;grid-template-columns:150px repeat(8,84px);gap:6px;align-items:center;justify-items:center";
    const mkRow = (label, vals, fmt) => { const lb = h("div", "txt", label); lb.style.justifySelf = "start"; grid.appendChild(lb); return vals.map((v) => { const c = h("div", "c", fmt ? fmt(v) : v); c.style.setProperty("--sz", "76px"); grid.appendChild(c); return c; }); };
    const lb0 = h("div", "small", "vị trí"); lb0.style.justifySelf = "start"; grid.appendChild(lb0);
    DA.forEach((_, i) => grid.appendChild(h("div", "idx", i)));
    const rowD = mkRow("DA", DA, (d) => `D${d}`);
    rowD.forEach((c, i) => { c.style.color = colD[DA[i]]; c.style.fontSize = "30px"; });
    const rowC = mkRow("C", C);
    const out = h("div", "lead", ""), log = h("div", "stack"); log.style.gap = "6px";
    out.style.minHeight = "108px";
    const found = h("div", "rowx");
    el.append(grid, out, found, log);
    el.style.cssText += ";display:flex;flex-direction:column;gap:18px";
    return {
      step(s) {
        const n = Math.min(s, steps.length);
        rowC.forEach((c) => clearHL(c)); rowD.forEach((c) => { clearHL(c); });
        rowD.forEach((c, i) => { if (i < l0 || i > r0) c.classList.add("dim"); });
        rowC.forEach((c, i) => { if (i < l0 || i > r0) c.classList.add("dim"); });
        const rep = [];
        steps.slice(0, n).forEach((st) => { if (st.ok) rep.push(DA[st.k]); });
        found.innerHTML = `<span class="txt">Đã báo:</span>` + (rep.length ? rep.map((d) => `<span class="tag" style="border-color:${colD[d]};color:${colD[d]};font-size:27px">D${d}</span>`).join("") : `<span class="small">chưa có</span>`);
        if (n === 0) { out.innerHTML = `6 lần khớp, vị trí <span class="mono q">[2, 7]</span><br><span class="mono">C[i]</span>: lần xuất hiện trước của cùng tài liệu`; return; }
        const st = steps[n - 1];
        for (let i = st.l; i <= st.r; i++) rowC[i].classList.add("hl-q");
        clearHL(rowC[st.k]); rowC[st.k].classList.add(st.ok ? "hl-a" : "hl-bad");
        if (st.ok) { clearHL(rowD[st.k]); rowD[st.k].classList.add("hl-a"); }
        out.innerHTML = `<span class="mono">RMQ<sub>C</sub>(${st.l}, ${st.r}) = ${st.k}</span>, <span class="mono">C[${st.k}] = ${C[st.k]}</span> ` +
          (st.ok ? `&lt; 2 ⇒ <b class="a">báo D${DA[st.k]}</b>` : `≥ 2 ⇒ <b class="bad">dừng</b>`);
        if (n === steps.length) out.innerHTML += `<br>Xong: ${rep.length} tài liệu, chỉ ${steps.length} truy vấn RMQ.`;
      },
    };
  };

  // ------------------------------------------------ LCA explorer
  W.lca = (el) => {
    const P = { 1: [330, 36], 2: [160, 136], 3: [500, 136], 4: [70, 236], 5: [250, 236], 6: [410, 236], 7: [590, 236] };
    const par = { 2: 1, 3: 1, 4: 2, 5: 2, 6: 3, 7: 3 }, depth = { 1: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 2 };
    const E = [1, 2, 4, 2, 5, 2, 1, 3, 6, 3, 7, 3, 1], D = E.map((v) => depth[v]);
    const svg = sv("svg", { viewBox: "0 0 660 280", width: 660 });
    Object.keys(par).forEach((c) => svg.appendChild(sv("line", { x1: P[par[c]][0], y1: P[par[c]][1], x2: P[c][0], y2: P[c][1], stroke: "var(--faint)", "stroke-width": 3 })));
    const circles = {};
    Object.keys(P).forEach((k) => {
      const g = sv("g", { style: "cursor:pointer" });
      const c = sv("circle", { cx: P[k][0], cy: P[k][1], r: 30, fill: "var(--cell)", stroke: "var(--ink)", "stroke-width": 2.5 });
      const t = sv("text", { x: P[k][0], y: P[k][1] + 10, "text-anchor": "middle", "font-size": 28, class: "m", style: "fill:var(--ink)" }, k);
      g.append(c, t); svg.appendChild(g); circles[k] = c;
      g.addEventListener("click", () => pick(+k));
    });
    const mk = (vals, cls) => { const m = makeArr(vals, { size: 60, noidx: cls !== "d" }); return m; };
    const eRow = mk(E, "e"), dRow = mk(D, "d");
    const rowE = h("div", "rowx"); rowE.style.cssText = "gap:8px;flex-wrap:nowrap"; rowE.append(h("div", "lab", "E"), eRow.root);
    const rowD = h("div", "rowx"); rowD.style.cssText = "gap:8px;flex-wrap:nowrap;align-items:flex-start"; rowD.append(h("div", "lab", "D"), dRow.root);
    const res = h("div", "lead", "");
    const top = h("div"); top.style.cssText = "display:flex;gap:30px;align-items:flex-start";
    const extra = h("div", "grow stack"); extra.innerHTML = `<p class="small">Bấm hai nút trên cây</p>`;
    extra.appendChild(res);
    top.append(svg, extra);
    el.append(top, rowE, rowD);
    el.style.cssText += ";display:flex;flex-direction:column;gap:6px";
    let sel = [4, 6];
    function pick(k) { sel = sel.length === 2 ? [k] : [sel[0], k]; if (sel.length === 2) draw(); else { draw1(); } }
    function draw1() { Object.keys(circles).forEach((k) => { circles[k].style.setProperty("fill", +k === sel[0] ? "var(--q-bg)" : "var(--cell)"); circles[k].style.setProperty("stroke", +k === sel[0] ? "var(--query)" : "var(--ink)"); }); res.innerHTML = "Chọn thêm nút thứ hai."; }
    function draw() {
      const [u, v] = sel, fu = E.indexOf(u), fv = E.indexOf(v), lo = Math.min(fu, fv), hi = Math.max(fu, fv), m = argmin(D, lo, hi), w = E[m];
      Object.keys(circles).forEach((k) => {
        const c = circles[k], kk = +k;
        c.style.setProperty("fill", kk === w ? "var(--a-bg)" : kk === u || kk === v ? "var(--q-bg)" : "var(--cell)");
        c.style.setProperty("stroke", kk === w ? "var(--ans)" : kk === u || kk === v ? "var(--query)" : "var(--ink)");
      });
      eRow.cells.forEach((c, i) => { clearHL(c); if (i === fu || i === fv) c.classList.add("hl-q"); if (i === m) { clearHL(c); c.classList.add("hl-a"); } });
      dRow.cells.forEach((c, i) => { clearHL(c); if (i >= lo && i <= hi) c.classList.add("hl-o"); if (i === m) { clearHL(c); c.classList.add("hl-a"); } });
      res.innerHTML = `RMQ trên <span class="mono c-fh">D[${lo}..${hi}]</span> ⇒ <b class="a mono">LCA(${u}, ${v}) = E[${m}] = ${w}</b><br><span class="txt">Khoảng cách: ${depth[u] + depth[v] - 2 * depth[w]} cạnh</span>`;
    }
    draw();
  };

  // ------------------------------------------------ erosion: every output pixel is one 2D RMQ over the window around it
  W.erode = (el) => {
    const WI = 112, HE = 72, N = WI * HE, Z = 5, S = Z * 2, ZP = 360;
    const YEL = "#ffe14d", GRN = "#7ee06a";   // drawn on the dark image, so the same in both themes
    const mk = (w, ht) => { const c = h("canvas"); c.width = w * 2; c.height = ht * 2; c.style.cssText = `width:${w}px;height:${ht}px;display:block;border:2px solid var(--hair);border-radius:8px;touch-action:none;cursor:crosshair`; return c; };
    const c1 = mk(WI * Z, HE * Z), c2 = mk(WI * Z, HE * Z), cz = mk(ZP, ZP);
    cz.style.cursor = "default";
    const pane = (lab, cv) => { const b = h("div", "stack"); b.style.gap = "8px"; b.append(lab, cv); return b; };
    const labZ = h("div", "txt");
    const ctl = h("div", "ctl", `<label>bán kính cửa sổ = <b id="er-v">1</b><input id="er-r" type="range" min="0" max="5" value="1"></label><button class="ghost" id="er-go">▶ Quét từng điểm</button>`);
    const res = h("div", "txt"), zcap = h("div", "txt");
    zcap.style.fontSize = "28px";
    const below = h("div", "stack"); below.style.cssText = "gap:10px;grid-column:1 / 3"; below.append(ctl, res);
    const side = h("div", "stack"); side.style.gap = "14px"; side.append(zcap);
    // the slide's pre-rendered formula goes under the zoom, its note under the controls
    const f = $(".er-f", el), note = $(".er-note", el);
    if (f) side.append(f);
    if (note) below.append(note);
    const grid = h("div"); grid.style.cssText = "display:grid;grid-template-columns:auto auto auto;gap:16px 30px;align-items:start";
    grid.append(pane(h("div", "txt", "Ảnh gốc"), c1), pane(h("div", "txt", "Sau erosion"), c2), pane(labZ, cz), below, side);
    el.append(grid);
    // bright π on dark background, plus bright specks that erosion should remove
    const off = document.createElement("canvas"); off.width = WI; off.height = HE;
    const oc = off.getContext("2d"); oc.fillStyle = "#101010"; oc.fillRect(0, 0, WI, HE);
    oc.fillStyle = "#e8e8e8"; oc.font = "600 78px 'Source Serif 4', Georgia, serif"; oc.textAlign = "center"; oc.textBaseline = "middle"; oc.fillText("π", WI / 2, HE / 2 - 3);
    const data = oc.getImageData(0, 0, WI, HE).data, I = new Uint8Array(N);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < N; i++) I[i] = data[4 * i];
    for (let k = 0; k < 90; k++) { const x = Math.floor(rnd() * WI), y = Math.floor(rnd() * HE); I[y * WI + x] = 220; if (k % 3 === 0 && x + 1 < WI) I[y * WI + x + 1] = 220; }
    // the zoom starts on a lone speck right of π, so stepping from radius 0 to 1 shows it vanish
    let home = (HE >> 1) * WI + (WI >> 1);
    find: for (let y = 6; y < HE - 6; y++) for (let x = 86; x < WI - 6; x++) {
      if (I[y * WI + x] !== 220) continue;
      let lone = true;
      for (let dy = -3; dy <= 3 && lone; dy++) for (let dx = -3; dx <= 3; dx++) { const v = I[(y + dy) * WI + x + dx]; if (v > 60 && v !== 220) { lone = false; break; } }
      if (lone) { home = y * WI + x; break find; }
    }
    const LX = Math.floor(Math.log2(WI)) + 1, LY = Math.floor(Math.log2(HE)) + 1;
    const st = [];
    for (let kx = 0; kx < LX; kx++) { st[kx] = []; for (let ky = 0; ky < LY; ky++) st[kx][ky] = new Uint8Array(N); }
    st[0][0].set(I);
    for (let ky = 1; ky < LY; ky++) for (let y = 0; y + (1 << ky) <= HE; y++) for (let x = 0; x < WI; x++) st[0][ky][y * WI + x] = Math.min(st[0][ky - 1][y * WI + x], st[0][ky - 1][(y + (1 << (ky - 1))) * WI + x]);
    for (let kx = 1; kx < LX; kx++) for (let ky = 0; ky < LY; ky++) for (let y = 0; y + (1 << ky) <= HE; y++) for (let x = 0; x + (1 << kx) <= WI; x++) st[kx][ky][y * WI + x] = Math.min(st[kx - 1][ky][y * WI + x], st[kx - 1][ky][y * WI + x + (1 << (kx - 1))]);
    const lg = (v) => 31 - Math.clz32(v);
    function rmq2(x1, y1, x2, y2) {
      const kx = lg(x2 - x1 + 1), ky = lg(y2 - y1 + 1), a = st[kx][ky], bx = x2 - (1 << kx) + 1, by = y2 - (1 << ky) + 1;
      return Math.min(a[y1 * WI + x1], a[y1 * WI + bx], a[by * WI + x1], a[by * WI + bx]);
    }
    const inp = $("#er-r", ctl), btn = $("#er-go", ctl);
    let rad = 1, O = new Uint8Array(N), probe = home, scan = false, anim = 0;
    const win = (p) => { const x = p % WI, y = (p / WI) | 0; return [Math.max(0, x - rad), Math.max(0, y - rad), Math.min(WI - 1, x + rad), Math.min(HE - 1, y + rad)]; };
    const tmp = document.createElement("canvas"); tmp.width = WI; tmp.height = HE;
    const im = new ImageData(WI, HE);
    // pixels after `upto` are not computed yet: they show the original, dimmed
    function paint(cv, A, upto = N) {
      for (let i = 0; i < N; i++) { const v = i <= upto ? A[i] : I[i] * 0.35; im.data[4 * i] = v * 0.72; im.data[4 * i + 1] = v * 0.95; im.data[4 * i + 2] = v; im.data[4 * i + 3] = 255; }
      tmp.getContext("2d").putImageData(im, 0, 0);
      const g = cv.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
      g.drawImage(tmp, 0, 0, cv.width, cv.height);
      return g;
    }
    function run() {
      rad = +inp.value; $("#er-v", ctl).textContent = rad;
      const t0 = performance.now();
      for (let p = 0; p < N; p++) { const [x1, y1, x2, y2] = win(p); O[p] = rmq2(x1, y1, x2, y2); }
      res.innerHTML = `Cửa sổ ${2 * rad + 1}×${2 * rad + 1} · ${vn(N)} điểm ảnh = ${vn(N)} truy vấn RMQ 2D · ${fmtMs(performance.now() - t0)}`;
      draw();
    }
    function draw() {
      const [x1, y1, x2, y2] = win(probe), px = probe % WI, py = (probe / WI) | 0, k = 2 * rad + 1;
      let g = paint(c1, I);
      g.strokeStyle = YEL; g.lineWidth = 5; g.strokeRect(x1 * S - 3, y1 * S - 3, (x2 - x1 + 1) * S + 6, (y2 - y1 + 1) * S + 6);
      g = paint(c2, O, scan ? probe : N);
      g.strokeStyle = GRN; g.lineWidth = 5; g.strokeRect(px * S - 5, py * S - 5, S + 10, S + 10);
      // zoom: the window plus a ring of neighbours, every pixel a number
      const n = Math.max(5, k + 2), c = (n - 1) >> 1, cs = cz.width / n, z = cz.getContext("2d");
      z.setTransform(1, 0, 0, 1, 0, 0); z.fillStyle = "#0b0f14"; z.fillRect(0, 0, cz.width, cz.height);
      let best = y1 * WI + x1;
      for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (I[y * WI + x] < I[best]) best = y * WI + x;
      z.font = `500 ${Math.round(Math.min(46, cs * 0.4))}px 'JetBrains Mono', monospace`; z.textAlign = "center"; z.textBaseline = "middle";
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const x = px - c + i, y = py - c + j;
        if (x < 0 || y < 0 || x >= WI || y >= HE) continue;
        const v = I[y * WI + x], inW = x >= x1 && x <= x2 && y >= y1 && y <= y2;
        z.globalAlpha = inW ? 1 : 0.32;
        z.fillStyle = `rgb(${v * 0.72},${v * 0.95},${v})`; z.fillRect(i * cs + 1, j * cs + 1, cs - 2, cs - 2);
        if (cs >= 90) { z.fillStyle = v > 120 ? "#0b0f14" : "#e8edf3"; z.fillText(v, (i + 0.5) * cs, (j + 0.5) * cs + 2); }
      }
      z.globalAlpha = 1;
      z.strokeStyle = "#2a333f"; z.lineWidth = 2;
      for (let i = 1; i < n; i++) { z.beginPath(); z.moveTo(i * cs, 0); z.lineTo(i * cs, cz.height); z.moveTo(0, i * cs); z.lineTo(cz.width, i * cs); z.stroke(); }
      const ox = (x1 - px + c) * cs, oy = (y1 - py + c) * cs;
      z.strokeStyle = YEL; z.lineWidth = 6; z.strokeRect(ox, oy, (x2 - x1 + 1) * cs, (y2 - y1 + 1) * cs);
      z.strokeStyle = GRN; z.lineWidth = 6; z.strokeRect((best % WI - px + c) * cs + 7, (((best / WI) | 0) - py + c) * cs + 7, cs - 14, cs - 14);
      const cnt = (x2 - x1 + 1) * (y2 - y1 + 1);
      labZ.innerHTML = `Phóng to cửa sổ ${k}×${k}`;
      zcap.innerHTML = `min ${cnt} ô = <b class="a">${O[probe]}</b><br>⇒ điểm (${px}, ${py}) bên phải`;
    }
    function stop(reset) {
      cancelAnimationFrame(anim); anim = 0; scan = false; btn.textContent = "▶ Quét từng điểm";
      if (reset) probe = home;
      draw();
    }
    function play() {
      if (anim) return stop(false);
      scan = true; btn.textContent = "■ Dừng";
      const t0 = performance.now(), dur = 6000;
      const tick = (t) => { probe = Math.min(N - 1, Math.floor((t - t0) / dur * N)); draw(); if (probe < N - 1) anim = requestAnimationFrame(tick); else stop(true); };
      anim = requestAnimationFrame(tick);
    }
    function hover(e) {
      const r = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(WI - 1, Math.floor((e.clientX - r.left) / r.width * WI))), y = Math.max(0, Math.min(HE - 1, Math.floor((e.clientY - r.top) / r.height * HE)));
      if (anim) { cancelAnimationFrame(anim); anim = 0; btn.textContent = "▶ Quét từng điểm"; }
      scan = true; probe = y * WI + x; draw();
    }
    inp.addEventListener("input", () => { if (anim) stop(false); run(); });
    btn.addEventListener("click", play);
    [c1, c2].forEach((cv) => { cv.addEventListener("pointermove", hover); cv.addEventListener("pointerleave", () => { if (!anim) { scan = false; draw(); } }); });
    run();
    return {
      step(s, prev) { stop(true); inp.value = s === 0 ? 0 : s === 1 ? 1 : 2; run(); if (s === 1 && prev === 0) play(); },
      leave() { stop(true); },
    };
  };

  // ------------------------------------------------ 2D RMQ on a price table (rows: time slot, columns: day)
  // Column minima equal A8, so the 1D story is this table seen from above.
  const M2 = [
    [9, 6, 12, 7, 8, 5, 3, 10],
    [8, 4, 11, 5, 9, 3, 6, 9],
    [7, 7, 10, 6, 6, 4, 5, 11],
    [11, 5, 9, 8, 7, 2, 4, 8],
    [10, 8, 13, 4, 10, 6, 3, 12],
    [8, 6, 11, 9, 8, 7, 2, 9],
  ];
  const SLOTS = ["6h", "9h", "12h", "15h", "18h", "21h"];
  W.grid2d = (el) => {
    const R = M2.length, C = M2[0].length, S = 70, G = 6, LX = 76, TY = 34;
    const at = (r, c) => [LX + c * (S + G), TY + r * (S + G)];
    const box = h("div"); box.dataset.drag = 1;
    box.style.cssText = `position:relative;width:${LX + C * (S + G) - G}px;height:${TY + R * (S + G) - G}px;touch-action:none;user-select:none;cursor:crosshair`;
    for (let c = 0; c < C; c++) { const t = h("div", "idx", `${c + 3}/11`); t.style.cssText = `position:absolute;left:${at(0, c)[0]}px;top:4px;width:${S}px;text-align:center`; box.appendChild(t); }
    SLOTS.forEach((s, r) => { const t = h("div", "idx", s); t.style.cssText = `position:absolute;left:0;top:${at(r, 0)[1] + S / 2 - 10}px;width:${LX - 14}px;text-align:right`; box.appendChild(t); });
    const cells = M2.map((row, r) => row.map((v, c) => {
      const e = h("div", "c", v); e.style.setProperty("--sz", S + "px"); e.style.position = "absolute";
      [e.style.left, e.style.top] = at(r, c).map((p) => p + "px"); box.appendChild(e); return e;
    }));
    const qbox = h("div"); qbox.style.cssText = "position:absolute;border:5px solid var(--query);border-radius:12px;pointer-events:none;transition:all .2s;box-sizing:border-box";
    box.appendChild(qbox);
    const presets = h("div", "ctl", "<span>Thử nhanh:</span>");
    const res = h("div", "lead", ""); res.style.minHeight = "52px";
    el.append(box, presets, res);
    el.style.cssText += ";display:flex;flex-direction:column;gap:18px;align-items:flex-start";
    let q = [1, 1, 4, 5];
    const minOf = ([r1, c1, r2, c2]) => { let b = [r1, c1]; for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (M2[r][c] < M2[b[0]][b[1]]) b = [r, c]; return b; };
    function draw() {
      const [r1, c1, r2, c2] = q, [ar, ac] = minOf(q), hgt = r2 - r1 + 1, wid = c2 - c1 + 1;
      cells.forEach((row, r) => row.forEach((e, c) => { clearHL(e); if (r === ar && c === ac) e.classList.add("hl-a"); else if (r >= r1 && r <= r2 && c >= c1 && c <= c2) e.classList.add("hl-q"); }));
      const [x1, y1] = at(r1, c1), [x2, y2] = at(r2, c2);
      Object.assign(qbox.style, { left: x1 - 6 + "px", top: y1 - 6 + "px", width: x2 + S - x1 + 12 + "px", height: y2 + S - y1 + 12 + "px" });
      res.innerHTML = `${hgt}×${wid} = <b class="q">${hgt * wid}</b> ô phải đọc ⇒ rẻ nhất <b class="a">${M2[ar][ac]}</b> (${SLOTS[ar]} ngày ${ac + 3}/11)`;
    }
    [[1, 1, 4, 5], [0, 1, 4, 6], [2, 3, 2, 7], [0, 0, 5, 7]].forEach((p) => {
      const b = h("button", "ghost", `${p[2] - p[0] + 1}×${p[3] - p[1] + 1}`);
      b.addEventListener("click", () => { q = p.slice(); draw(); }); presets.appendChild(b);
    });
    // drag across the table to choose a rectangle
    const cellAt = (e) => {
      const r = box.getBoundingClientRect(), k = r.width / box.offsetWidth, x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k;
      return [Math.max(0, Math.min(R - 1, Math.floor((y - TY + G / 2) / (S + G)))), Math.max(0, Math.min(C - 1, Math.floor((x - LX + G / 2) / (S + G))))];
    };
    let anchor = null;
    box.addEventListener("pointerdown", (e) => { e.preventDefault(); box.setPointerCapture(e.pointerId); anchor = cellAt(e); q = [anchor[0], anchor[1], anchor[0], anchor[1]]; draw(); });
    box.addEventListener("pointermove", (e) => {
      if (!anchor) return;
      const [r, c] = cellAt(e);
      q = [Math.min(r, anchor[0]), Math.min(c, anchor[1]), Math.max(r, anchor[0]), Math.max(c, anchor[1])]; draw();
    });
    const end = () => { anchor = null; };
    box.addEventListener("pointerup", end); box.addEventListener("pointercancel", end);
    draw();
  };

  // ------------------------------------------------ Cartesian tree explorer
  W.carttree = (el) => {
    const n = A8.length, u = 104, dy = 76;
    const par = new Array(n).fill(-1), depth = new Array(n).fill(0), range = {};
    (function rec(lo, hi, p, d) { if (lo > hi) return; const m = argmin(A8, lo, hi); par[m] = p; depth[m] = d; range[m] = [lo, hi]; rec(lo, m - 1, m, d + 1); rec(m + 1, hi, m, d + 1); })(0, n - 1, -1, 0);
    const X = (i) => u / 2 + i * u, Y = (d) => 36 + d * dy;
    const svg = sv("svg", { viewBox: `0 0 ${n * u} ${Y(3) + 40}`, width: n * u });
    const edges = [], nodes = [];
    A8.forEach((_, i) => { if (par[i] >= 0) { const e = sv("line", { x1: X(par[i]), y1: Y(depth[par[i]]), x2: X(i), y2: Y(depth[i]), stroke: "var(--faint)", "stroke-width": 3 }); edges[i] = e; svg.appendChild(e); } });
    A8.forEach((v, i) => {
      const c = sv("circle", { cx: X(i), cy: Y(depth[i]), r: 30, fill: "var(--cell)", stroke: "var(--ink)", "stroke-width": 2.5 });
      svg.append(c, sv("text", { x: X(i), y: Y(depth[i]) + 10, "text-anchor": "middle", "font-size": 27, class: "m", style: "fill:var(--ink)" }, v), sv("text", { x: X(i) + 34, y: Y(depth[i]) - 18, "font-size": 18, class: "m", style: "fill:var(--muted)" }, `[${i}]`));
      nodes[i] = c;
    });
    const row = h("div"); row.style.cssText = `display:grid;grid-template-columns:repeat(${n},${u}px);justify-items:center;position:relative`;
    const cells = A8.map((v, i) => { const w = h("div", "cellw"), c = h("div", "c", v); c.style.setProperty("--sz", "78px"); w.append(c, h("div", "idx", i)); row.appendChild(w); return c; });
    const bar = h("div"); bar.style.cssText = "height:10px;border-radius:5px;background:var(--sqrt);transition:margin .25s,width .25s";
    const ctlBox = h("div"), res = h("div", "lead", "");
    el.append(svg, row, bar, ctlBox, res);
    el.style.cssText += ";display:flex;flex-direction:column;gap:10px";
    const up = (i) => { const p = [i]; while (par[p[p.length - 1]] >= 0) p.push(par[p[p.length - 1]]); return p; };
    function draw(l, r) {
      const pl = up(l), pr = up(r), lca = pl.find((x) => pr.includes(x));
      nodes.forEach((c, i) => { c.style.setProperty("fill", i === lca ? "var(--a-bg)" : i === l || i === r ? "var(--q-bg)" : "var(--cell)"); c.style.setProperty("stroke", i === lca ? "var(--ans)" : i === l || i === r ? "var(--query)" : "var(--ink)"); });
      edges.forEach((e, i) => { if (!e) return; const on = (pl.includes(i) && pl.indexOf(i) < pl.indexOf(lca)) || (pr.includes(i) && pr.indexOf(i) < pr.indexOf(lca)); e.style.setProperty("stroke", on ? "var(--query)" : "var(--faint)"); e.setAttribute("stroke-width", on ? 6 : 3); });
      cells.forEach((c, i) => { clearHL(c); if (i === lca) c.classList.add("hl-a"); else if (i >= l && i <= r) c.classList.add("hl-q"); });
      const [lo, hi] = range[lca];
      bar.style.marginLeft = lo * u + 13 + "px"; bar.style.width = (hi - lo + 1) * u - 26 + "px";
      res.innerHTML = `<span class="mono">LCA(${l}, ${r}) = ${lca}</span> và <span class="mono a">RMQ(${l}, ${r}) = ${lca}</span>, giá trị ${A8[lca]}. Cây con gốc ${lca} đại diện đoạn <span class="mono c-sqrt">[${lo}, ${hi}]</span>, chứa trọn đoạn truy vấn.`;
    }
    lrFields(ctlBox, n, 2, 4, draw);
    draw(2, 4);
  };

  // ------------------------------------------------ title π
  W.bigpi = (el, o) => {
    const svg = sv("svg", {});
    el.appendChild(svg);
    const p = window.makePi(svg, { mood: o.mood || "happy" });
    return { enter() { p.look(1200, 300); } };
  };
})();
