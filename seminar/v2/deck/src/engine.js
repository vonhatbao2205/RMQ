/* Deck engine: stage scaling, step reveal, π narration, videos, overview, notes, auto-play, short mode. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STORE = "rmq-deck-v2";
  const stage = $("#stage");
  const slides = $$(".s");
  const ACTS = ["Câu chuyện", "Bài toán", "Cơ sở thuật toán", "Áp dụng", "Tối ưu", "Benchmark", "Thực tế", "Kết"];
  const narr = $("#narr"), bubble = $("#bubble"), num = $("#num"), hud = $("#hud"), flashEl = $("#flash");
  const pi = window.makePi($("#pi"));
  let cur = 0, step = 0, auto = false, shortMode = false, autoTimer = null;
  const mounted = new WeakSet();

  function read(k, d) { try { const v = localStorage.getItem(STORE + k); return v === null ? d : v; } catch (e) { return d; } }
  function write(k, v) { try { localStorage.setItem(STORE + k, v); } catch (e) { /* private window */ } }

  function fit() {
    const vp = stage.parentElement, W = vp.clientWidth, H = vp.clientHeight;
    const k = Math.min(W / 1920, H / 1080);
    stage.style.transform = `translate(${(W - 1920 * k) / 2}px, ${(H - 1080 * k) / 2}px) scale(${k})`;
    window.deckScale = k;
  }

  // ---- per-slide metadata
  slides.forEach((s, i) => {
    s.dataset.i = i;
    let max = +(s.dataset.steps || 0);
    $$("[data-at]", s).forEach((e) => { max = Math.max(max, +e.dataset.at); });
    $$("[data-only]", s).forEach((e) => e.dataset.only.split(",").forEach((x) => { max = Math.max(max, +x); }));
    $$("[data-marks]", s).forEach((e) => Object.keys(JSON.parse(e.dataset.marks)).forEach((x) => { max = Math.max(max, +x); }));
    s._max = max;
  });

  function mountWidgets(s) {
    if (mounted.has(s)) return;
    mounted.add(s);
    s._w = [];
    window.mountArrays(s);
    $$("[data-w]", s).forEach((el) => {
      const make = window.W[el.dataset.w];
      if (!make) { console.error("unknown widget", el.dataset.w); return; }
      let opts = {};
      if (el.dataset.o) opts = JSON.parse(el.dataset.o);
      s._w.push(make(el, opts) || {});
    });
  }

  function applyStep(s, st, prev) {
    $$("[data-at]", s).forEach((e) => e.classList.toggle("on", st >= +e.dataset.at));
    $$("[data-only]", s).forEach((e) => e.classList.toggle("on", e.dataset.only.split(",").map(Number).includes(st)));
    $$("[data-marks]", s).forEach((e) => window.applyMarks(e, st));
    // narration: the last line whose step has been reached
    let line = null;
    $$(".say", s).forEach((e) => { if (+(e.dataset.step || 0) <= st) line = e; });
    if (line) sayLine(line.innerHTML, line.dataset.mood, line.dataset.look);
    else bubble.innerHTML = "";
    (s._w || []).forEach((w) => w.step && w.step(st, prev));
    num.textContent = `${+s.dataset.i + 1} / ${slides.length}`;
    updateHud();
    updateHash();
    queueAuto();
  }

  function sayLine(html, mood, look) {
    bubble.innerHTML = html;
    pi.mood(mood || "talk");
    if (look) { const [x, y] = look.split(",").map(Number); pi.look(x, y); } else pi.look(960, 400);
    narr.classList.remove("talk");
    void narr.offsetWidth;
    narr.classList.add("talk");
    sayLine.n = (sayLine.n || 0) + 1;
    pi.gesture(mood === "happy" || mood === "surprised" || sayLine.n % 3 === 0);
    clearTimeout(sayLine._t);
    if (!mood || mood === "talk") sayLine._t = setTimeout(() => pi.mood("neutral"), 1400);
  }

  function updateHash() {
    const h = `#s${cur + 1}` + (step ? `-${step}` : "");
    if (location.hash !== h) { try { history.replaceState(null, "", h); } catch (e) { /* sandboxed */ } }
  }

  // ---- navigation
  function enter(i, st) {
    const leaving = slides[cur];
    if (leaving && leaving !== slides[i]) leave(leaving);
    cur = i; step = st;
    slides.forEach((s, k) => s.classList.toggle("cur", k === i));
    const s = slides[i];
    mountWidgets(s);
    const isVideo = s.classList.contains("video");
    narr.classList.toggle("off", isVideo || s.dataset.nonarr !== undefined);
    narr.classList.toggle("nopi", s.dataset.nopi !== undefined);
    if (isVideo) {
      const v = $("video", s);
      v.currentTime = 0; v.playbackRate = 1;
      const p = v.play(); if (p) p.catch(() => {});
      showCtl(s);
    }
    (s._w || []).forEach((w) => w.enter && w.enter());
    applyStep(s, st, -1);
    write("pos", i);
  }
  function leave(s) {
    const v = $("video", s); if (v) v.pause();
    (s._w || []).forEach((w) => w.leave && w.leave());
  }
  const skippable = (i) => shortMode && slides[i].dataset.opt !== undefined;
  function next() {
    const s = slides[cur];
    if (step < s._max) { step++; applyStep(s, step, step - 1); return; }
    let i = cur + 1;
    while (i < slides.length && skippable(i)) i++;
    if (i < slides.length) enter(i, 0); else stopAuto();
  }
  function prev() {
    if (step > 0) { step--; applyStep(slides[cur], step, step + 1); return; }
    let i = cur - 1;
    while (i >= 0 && skippable(i)) i--;
    if (i >= 0) enter(i, slides[i]._max);
  }
  function goto(i, st = 0) { enter(Math.max(0, Math.min(slides.length - 1, i)), st); }

  // ---- HUD
  const actStart = [];
  ACTS.forEach((name, a) => {
    const list = slides.filter((s) => +s.dataset.act === a);
    if (!list.length) return;
    const seg = document.createElement("div");
    seg.className = "seg"; seg.style.setProperty("--w", list.length); seg.title = name;
    seg.innerHTML = "<i></i>";
    seg.addEventListener("click", () => goto(+list[0].dataset.i));
    hud.appendChild(seg);
    actStart.push({ a, first: +list[0].dataset.i, n: list.length, seg });
  });
  function updateHud() {
    actStart.forEach(({ first, n, seg }) => {
      const p = Math.max(0, Math.min(1, (cur - first + 1) / n));
      seg.style.setProperty("--p", (p * 100).toFixed(1) + "%");
    });
  }
  function flash(t) {
    flashEl.textContent = t; flashEl.classList.add("show");
    clearTimeout(flash._t); flash._t = setTimeout(() => flashEl.classList.remove("show"), 1500);
  }

  // ---- auto-play for viewers re-watching the deck alone
  function dwell() {
    const s = slides[cur];
    if (s.classList.contains("video")) return null;
    const txt = (bubble.textContent || "").length;
    return Math.max(3200, 1200 + txt * 62) + (s.dataset.dwell ? +s.dataset.dwell : 0);
  }
  function queueAuto() {
    clearTimeout(autoTimer);
    if (!auto) return;
    const d = dwell();
    if (d !== null) autoTimer = setTimeout(next, d);
  }
  function stopAuto() { auto = false; clearTimeout(autoTimer); flash("Tự chạy: tắt"); }
  function toggleAuto() {
    auto = !auto;
    flash(auto ? "Tự chạy: bật (A để tắt)" : "Tự chạy: tắt");
    if (auto) { const v = $("video", slides[cur]); if (v && v.ended) next(); else queueAuto(); } else clearTimeout(autoTimer);
  }

  // ---- videos: thin progress line, plus a control bar that shows on mouse move or while paused
  const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    replay: '<svg viewBox="0 0 24 24"><path d="M12 5V1.5L6.5 6 12 10.5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>',
  };
  const clock = (t) => { t = Math.max(0, Math.floor(t || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
  $$(".s.video").forEach((s) => {
    const v = $("video", s), bar = document.createElement("div"), ctl = document.createElement("div");
    bar.className = "vbar"; s.appendChild(bar);
    ctl.className = "vctl";
    ctl.innerHTML =
      `<button data-a="replay" title="Phát lại (R)">${ICON.replay}</button>` +
      `<button data-a="play" title="Phát / dừng (V hoặc K)">${ICON.pause}</button>` +
      `<button data-a="back" class="txt" title="Lùi 5 giây (J)">−5s</button>` +
      `<button data-a="fwd" class="txt" title="Tới 5 giây (L)">+5s</button>` +
      `<span class="vt">0:00</span>` +
      `<div class="vtrack" role="slider" aria-label="Tua video" tabindex="-1"><div class="vfill"></div><div class="vknob"></div><span class="vtip"></span></div>` +
      `<span class="vt vdur">0:00</span>` +
      `<button data-a="rate" class="txt rate" title="Tốc độ ([ và ])">1×</button>`;
    s.appendChild(ctl);
    v.muted = true; v.playsInline = true;
    const track = $(".vtrack", ctl), fill = $(".vfill", ctl), knob = $(".vknob", ctl), tip = $(".vtip", ctl);
    const playBtn = $('[data-a="play"]', ctl), rateBtn = $('[data-a="rate"]', ctl);
    const paint = () => {
      const f = v.duration ? v.currentTime / v.duration : 0, pct = (100 * f).toFixed(2) + "%";
      bar.style.width = pct; fill.style.width = pct; knob.style.left = pct;
      $(".vt", ctl).textContent = clock(v.currentTime); $(".vdur", ctl).textContent = clock(v.duration);
      track.setAttribute("aria-valuenow", Math.floor(v.currentTime));
    };
    v.addEventListener("timeupdate", paint);
    v.addEventListener("loadedmetadata", paint);
    v.addEventListener("seeked", paint);
    v.addEventListener("play", () => { playBtn.innerHTML = ICON.pause; showCtl(s); });
    v.addEventListener("pause", () => { playBtn.innerHTML = ICON.play; showCtl(s); });
    v.addEventListener("ratechange", () => { rateBtn.textContent = `${v.playbackRate}×`; });
    v.addEventListener("click", (e) => { e.stopPropagation(); toggleVideo(); });
    v.addEventListener("ended", () => { if (auto && slides[cur] === s) setTimeout(next, 900); });
    ctl.addEventListener("click", (e) => {
      e.stopPropagation();
      const b = e.target.closest("button"); if (!b) return;
      const a = b.dataset.a;
      if (a === "play") toggleVideo(); else if (a === "replay") replayVideo();
      else if (a === "back") seekBy(-5); else if (a === "fwd") seekBy(5); else if (a === "rate") stepRate(1, true);
      b.blur(); showCtl(s);
    });
    // scrubbing: drag anywhere on the track; the video pauses while dragging and resumes after
    const frac = (e) => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
    let drag = null;
    track.addEventListener("pointerdown", (e) => {
      e.preventDefault(); e.stopPropagation();
      track.setPointerCapture(e.pointerId);
      drag = { wasPlaying: !v.paused }; v.pause(); ctl.classList.add("drag");
      if (v.duration) v.currentTime = frac(e) * v.duration;
      paint();
    });
    track.addEventListener("pointermove", (e) => {
      const f = frac(e);
      tip.textContent = clock(f * (v.duration || 0)); tip.style.left = (100 * f).toFixed(2) + "%";
      if (drag && v.duration) { v.currentTime = f * v.duration; paint(); }
      showCtl(s);
    });
    const endDrag = () => { if (!drag) return; const p = drag.wasPlaying; drag = null; ctl.classList.remove("drag"); if (p) v.play().catch(() => {}); };
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    s.addEventListener("pointermove", () => showCtl(s));
    ctl.addEventListener("pointerenter", () => ctl.classList.add("hover"));
    ctl.addEventListener("pointerleave", () => { ctl.classList.remove("hover"); showCtl(s); });
  });
  let ctlTimer = 0;
  // controls stay while paused, dragging or hovered; otherwise they fade 2.5 s after the last activity
  function showCtl(s) {
    const ctl = $(".vctl", s); if (!ctl) return;
    s.classList.add("ctl-on"); clearTimeout(ctlTimer);
    ctlTimer = setTimeout(() => {
      const v = $("video", s);
      if (v && !v.paused && !ctl.classList.contains("hover") && !ctl.classList.contains("drag")) s.classList.remove("ctl-on");
    }, 2500);
  }
  function curVideo() { return $("video", slides[cur]); }
  function toggleVideo() {
    const v = curVideo(); if (!v) return false;
    if (v.paused) { const p = v.play(); if (p) p.catch(() => {}); flash("▶ Phát"); } else { v.pause(); flash("❚❚ Tạm dừng"); }
    return true;
  }
  function replayVideo() { const v = curVideo(); if (!v) return; v.currentTime = 0; const p = v.play(); if (p) p.catch(() => {}); flash("↺ Phát lại"); }
  function seekBy(d) {
    const v = curVideo(); if (!v || !v.duration) return;
    v.currentTime = Math.max(0, Math.min(v.duration - 0.05, v.currentTime + d));
    flash(`${d < 0 ? "⟲ Lùi" : "⟳ Tới"} 5 giây · ${clock(v.currentTime)}`); showCtl(slides[cur]);
  }
  function stepRate(d, wrap) {
    const v = curVideo(); if (!v) return;
    let c = RATES.indexOf(v.playbackRate) + d;
    c = wrap ? (c + RATES.length) % RATES.length : Math.max(0, Math.min(RATES.length - 1, c));
    v.playbackRate = RATES[c]; flash(`Tốc độ ${v.playbackRate}×`);
  }

  // ---- overview + notes
  const ov = $("#overview"), notes = $("#notes");
  function buildOverview() {
    const total = slides.reduce((t, s) => t + +(s.dataset.time || 0), 0);
    const totalShort = slides.reduce((t, s) => t + (s.dataset.opt !== undefined ? 0 : +(s.dataset.time || 0)), 0);
    $("#ovtime").textContent = `Toàn bộ ≈ ${Math.round(total / 60)} phút · bản rút gọn ≈ ${Math.round(totalShort / 60)} phút`;
    const g = $("#ovgrid"); g.innerHTML = "";
    slides.forEach((s, i) => {
      const d = document.createElement("div");
      d.className = "ovitem" + (i === cur ? " cur" : "") + (s.dataset.opt !== undefined ? " opt" : "");
      d.innerHTML = `<div class="n">${i + 1} · ${s.dataset.time || 0}s</div><div class="act">${ACTS[+s.dataset.act]}</div><div class="t">${s.dataset.title || ""}</div>`;
      d.addEventListener("click", () => { ov.classList.remove("show"); goto(i); });
      g.appendChild(d);
    });
  }
  function toggleOverview() { if (!ov.classList.contains("show")) buildOverview(); ov.classList.toggle("show"); notes.classList.remove("show"); }
  function toggleNotes() {
    if (!notes.classList.contains("show")) {
      const s = slides[cur], n = $(".notes", s);
      $("#notesbox").innerHTML = `<h3>${s.dataset.title || ""}</h3><p class="time">Khoảng ${s.dataset.time || "?"} giây${s.dataset.opt !== undefined ? " · có thể lướt qua khi thiếu giờ" : ""}</p>` + (n ? n.innerHTML : "<p>Chưa có ghi chú.</p>");
    }
    notes.classList.toggle("show"); ov.classList.remove("show");
  }

  // ---- input
  addEventListener("resize", fit);
  addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "select" || (tag === "input" && e.target.type !== "range")) return;
    if (tag === "input" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) return;
    const k = e.key;
    if (k === "ArrowRight" || k === "PageDown" || k === " ") { e.preventDefault(); if (e.target.tagName === "BUTTON") e.target.blur(); next(); }
    else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); prev(); }
    else if (k === "Home") goto(0);
    else if (k === "End") goto(slides.length - 1);
    else if (k === "o" || k === "O") toggleOverview();
    else if (k === "Escape") { ov.classList.remove("show"); notes.classList.remove("show"); }
    else if (k === "n" || k === "N") toggleNotes();
    else if (k === "a" || k === "A") toggleAuto();
    else if (k === "d" || k === "D") setTheme(document.documentElement.dataset.deckTheme === "dark" ? "light" : "dark");
    else if (k === "t" || k === "T") { shortMode = !shortMode; flash(shortMode ? "Bản rút gọn: bật" : "Bản rút gọn: tắt"); }
    else if (k === "f" || k === "F") { if (document.fullscreenElement) document.exitFullscreen(); else { const p = document.documentElement.requestFullscreen(); if (p) p.catch(() => flash("Trình duyệt không cho toàn màn hình")); } }
    else if (k === "v" || k === "V" || k === "k" || k === "K") toggleVideo();
    else if (k === "r" || k === "R") replayVideo();
    else if (k === "j" || k === "J") seekBy(-5);
    else if (k === "l" || k === "L") seekBy(5);
    else if (k === "[" || k === "]") stepRate(k === "]" ? 1 : -1);
  });
  let tx = null;
  addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (e.target.closest && e.target.closest("input,button,select,canvas,[data-drag],.vctl")) return;
    if (dx < -60) next(); else if (dx > 60) prev();
  });
  bubble.addEventListener("click", next);
  $("#nav-prev").addEventListener("click", prev);
  $("#nav-next").addEventListener("click", next);
  $("#nav-ov").addEventListener("click", toggleOverview);
  addEventListener("mousemove", (e) => {
    const k = window.deckScale || 1, r = stage.getBoundingClientRect();
    pi.look((e.clientX - r.left) / k, (e.clientY - r.top) / k, true);
  });

  // ---- light / dark theme; videos have a light copy named *_light.mp4
  $$("video").forEach((v) => {
    const src = v.getAttribute("src"), poster = v.getAttribute("poster");
    v.dataset.dark = src; v.dataset.light = src.replace(/\.mp4$/, "_light.mp4");
    v.dataset.darkPoster = poster; v.dataset.lightPoster = poster.replace(/\.jpg$/, "_light.jpg");
  });
  function setTheme(t, quiet) {
    if (t !== "light" && t !== "dark") t = "light";
    document.documentElement.dataset.deckTheme = t;
    write("theme", t);
    $$("#themes button").forEach((b) => { b.classList.toggle("on", b.dataset.t === t); b.setAttribute("aria-pressed", b.dataset.t === t); });
    $$("video").forEach((v) => {
      if (v.getAttribute("src") === v.dataset[t]) return;
      const playing = !v.paused, at = v.currentTime;
      v.src = v.dataset[t]; v.poster = v.dataset[t + "Poster"];
      if (playing) { v.currentTime = at; const p = v.play(); if (p) p.catch(() => {}); }
    });
    dispatchEvent(new CustomEvent("deck-theme", { detail: t }));
    if (!quiet) flash(t === "light" ? "Giao diện sáng" : "Giao diện tối");
  }
  $$("#themes button").forEach((b) => b.addEventListener("click", (ev) => { ev.stopPropagation(); setTheme(b.dataset.t); b.blur(); }));
  setTheme(read("theme", "light"), true);

  // ---- start
  function fromHash() {
    const m = /^#s(\d+)(?:-(\d+))?$/.exec(location.hash);
    if (m) return [Math.min(slides.length - 1, +m[1] - 1), +(m[2] || 0)];
    return null;
  }
  addEventListener("hashchange", () => { const h = fromHash(); if (h && (h[0] !== cur || h[1] !== step)) goto(h[0], h[1]); });
  fit();
  const h = fromHash();
  enter(h ? h[0] : 0, h ? h[1] : 0);
  window.deck = { next, prev, goto, slides, say: sayLine, flash, setTheme, count: () => slides.length, cur: () => cur, step: () => step };
})();
