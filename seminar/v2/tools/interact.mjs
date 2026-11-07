// Drives the real controls in headless Chrome: sliders, buttons, keys, video, auto-play. Prints PASS/FAIL per check.
import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME || "/nix/store/72ajwyw507cb3j0b4vblgplsd5s7b90a-google-chrome-156.0.8078.73/bin/google-chrome-stable";
const OUT = resolve(process.argv[2] || "/tmp/rmq-interact");
mkdirSync(OUT, { recursive: true });
const PORT = 9900 + Math.floor(Math.random() * 90);
const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${PORT}`, "--window-size=1920,1080", "--autoplay-policy=no-user-gesture-required", `--user-data-dir=${OUT}/p`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page"); } catch (e) { /* not up yet */ } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => { const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(expression + " :: " + JSON.stringify(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails)); return r.result.result.value; };
await send("Page.enable"); await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "file://" + resolve(HERE, "../deck/dist/index.html") });
await sleep(1200);
let fails = 0;
const check = (name, ok, extra = "") => { console.log((ok ? "PASS " : "FAIL ") + name + (extra ? "  → " + extra : "")); if (!ok) fails++; };
const key = async (k, code) => { await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: code || k, windowsVirtualKeyCode: code === "ArrowRight" ? 39 : code === "ArrowLeft" ? 37 : k.toUpperCase().charCodeAt(0) }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: code || k }); await sleep(120); };
const find = (title) => ev(`deck.slides.findIndex(s => s.dataset.title === ${JSON.stringify(title)})`);
const open = async (title, step = 0) => { const i = await find(title); if (i < 0) throw new Error("no slide " + title); await ev(`deck.goto(${i},${step})`); await sleep(350); return i; };
const cur = (sel) => `deck.slides[deck.cur()].querySelector(${JSON.stringify(sel)})`;
const setRange = (sel, n, v) => ev(`(() => { const r = deck.slides[deck.cur()].querySelectorAll(${JSON.stringify(sel)})[${n}]; r.value = ${v}; r.dispatchEvent(new Event('input', {bubbles:true})); })()`);
const text = (sel = ".body") => ev(`${cur(sel)}.textContent`);

// keyboard navigation
await ev("deck.goto(0,0)"); await key("ArrowRight", "ArrowRight");
check("→ goes to next slide", (await ev("deck.cur()")) === 1);
await key("ArrowLeft", "ArrowLeft");
check("← goes back", (await ev("deck.cur()")) === 0);
const hash = await ev("(deck.goto(4,2), location.hash)");
check("deep link hash", hash === "#s5-2", hash);
await key("o"); check("O opens overview", await ev("document.getElementById('overview').classList.contains('show')"));
const ovt = await ev("document.getElementById('ovtime').textContent"); check("overview shows time budget", /phút/.test(ovt), ovt);
await key("Escape"); await key("n"); check("N opens notes", (await ev("document.getElementById('notesbox').textContent")).length > 20); await key("n");
await ev("deck.goto(0,0)");
await key("t");
let visited = 0; let seenOpt = false;
for (let i = 0; i < 200; i++) { const c = await ev("deck.cur()"); if (await ev(`deck.slides[${c}].dataset.opt !== undefined`)) seenOpt = true; visited++; const before = `${c}.${await ev("deck.step()")}`; await ev("deck.next()"); if (`${await ev("deck.cur()")}.${await ev("deck.step()")}` === before) break; }
check("T short mode skips optional slides", !seenOpt, `${visited} steps walked`);
await ev("deck.goto(0,0)"); await key("t");

// video
await open("Pi đi tìm vé rẻ");
await sleep(1600);
const v = await ev(`(() => { const v = ${cur("video")}; return { t: v.currentTime, p: v.paused, d: v.duration, w: v.videoWidth, e: v.error && v.error.message }; })()`);
check("video plays on arrival", !v.p && v.t > 0.3 && v.w === 1920, JSON.stringify(v));
await key("v"); check("V pauses", await ev(`${cur("video")}.paused`)); await key("v");
await key("]"); check("] speeds up", (await ev(`${cur("video")}.playbackRate`)) > 1); await key("r");
check("R restarts", (await ev(`${cur("video")}.currentTime`)) < 1.2);
// control bar: seek keys, buttons, scrubbing, speed, fade-out
const vt = () => ev(`${cur("video")}.currentTime`);
check("control bar shows on arrival", await ev(`deck.slides[deck.cur()].classList.contains("ctl-on")`));
await ev(`(() => { const v = ${cur("video")}; v.pause(); v.currentTime = 20; })()`); await sleep(150);
await key("l", "KeyL"); const tL = await vt();
await key("j", "KeyJ"); const tJ = await vt();
check("L seeks +5 s, J seeks −5 s", Math.abs(tL - 25) < 0.3 && Math.abs(tJ - 20) < 0.3, `${tL} ${tJ}`);
await ev(`${cur('.vctl [data-a="fwd"]')}.click()`); await sleep(120);
check("+5s button seeks forward", Math.abs((await vt()) - 25) < 0.3);
const tr = await ev(`(() => { const r = ${cur(".vtrack")}.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: tr.x, y: tr.y });
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: tr.x, y: tr.y, button: "left", clickCount: 1 });
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: tr.x, y: tr.y, button: "left", clickCount: 1 }); await sleep(200);
const half = await ev(`(() => { const v = ${cur("video")}; return { t: v.currentTime, d: v.duration, p: v.paused, tip: ${cur(".vtip")}.textContent }; })()`);
check("clicking the middle of the track seeks to half", Math.abs(half.t - half.d / 2) < 1 && half.p, JSON.stringify(half));
await ev(`${cur("video")}.playbackRate = 1`);
await ev(`${cur('.vctl [data-a="rate"]')}.click()`); await sleep(80);
check("speed button steps 1× → 1.25×", (await ev(`${cur("video")}.playbackRate`)) === 1.25 && (await ev(`${cur('.vctl [data-a="rate"]')}.textContent`)) === "1.25×");
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
await ev(`${cur('.vctl [data-a="play"]')}.click()`); await sleep(3200);
check("control bar fades while playing untouched", !(await ev(`${cur("video")}.paused`)) && !(await ev(`deck.slides[deck.cur()].classList.contains("ctl-on")`)));
await key("r");
const posters = await ev(`deck.slides.filter(s => s.classList.contains('video')).length`);
check("all video files decode", posters === 8, posters + " video slides");
for (const t of await ev(`deck.slides.filter(s => s.classList.contains('video')).map(s => s.dataset.title)`)) {
  await open(t); await sleep(700);
  const q = await ev(`(() => { const v = ${cur("video")}; return { w: v.videoWidth, d: v.duration, e: !!v.error }; })()`);
  check(`  ${t}`, q.w === 1920 && q.d > 10 && !q.e, `${q.d.toFixed(1)} s`);
}

// tickets
await open("Thử đặt vé: mỗi người một khoảng ngày");
await ev(`${cur("#tk-go")}.click()`); await sleep(2100);
check("ticket search finds 6/11 at 0,89", /6\/11/.test(await text()) && /0,89/.test(await text()), "");
check("ticket scan counts 8 reads", /đã đọc 8 ô/.test(await text()));

// definition
await open("Định nghĩa RMQ");
await setRange('input.num', 0, 3); await setRange('input.num', 1, 6); await sleep(80);
check("RMQ(3,6)=5", /RMQ\(3, 6\) = 5/.test(await text()), "");
await setRange('input.num', 1, 7); await setRange('input.num', 0, 6); await sleep(80);
check("RMQ(6,7)=6", /RMQ\(6, 7\) = 6/.test(await text()));

// chooser
await open("Chọn cấu trúc nào?");
const clickBtn = (label) => ev(`[...deck.slides[deck.cur()].querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(label)})).click()`);
await clickBtn("Giá đổi liên tục"); await sleep(60); check("chooser → Segment Tree", /Nên chọn\s*Segment Tree/.test(await text()), "");
await clickBtn("đúng 3 ngày"); await sleep(60); check("chooser → Deque", /Nên chọn\s*Deque/.test(await text()));
await clickBtn("Chỉ tra vài lần"); await sleep(60); check("chooser → Duyệt", /Nên chọn\s*Duyệt/.test(await text()));
await clickBtn("10⁹"); await sleep(60); check("chooser → Fischer–Heun", /Nên chọn\s*Fischer/.test(await text()));
await clickBtn("Vé máy bay"); await sleep(60); check("chooser → Sparse Table", /Nên chọn\s*Sparse Table/.test(await text()));

// catalan
await open("Đếm số loại khối: Catalan", 2);
check("14 shapes drawn", (await ev(`deck.slides[deck.cur()].querySelectorAll('[data-w=catalan] svg').length`)) === 14);
check("block code 11 10 00 00", /11 10 00 00/.test(await text()));

// shared table
await open("Bảng đáp án dùng chung");
check("shared table: 4+1=5, 8+1=9, 12+1=13", /4 \+ 1 = 5/.test(await text()) && /8 \+ 1 = 9/.test(await text()) && /12 \+ 1 = 13/.test(await text()));

// query inputs: block minima marked, and they match V and G in the table
await open("Bước xây để lại gì", 1);
const mins = await ev(`[...deck.slides[deck.cur()].querySelectorAll("[data-w=fhin] .c")].map((c, i) => c.classList.contains("hl-b") ? i : -1).filter(i => i >= 0).join(",")`);
check("FH inputs: block minima at 0,6,10,14 = G", mins === "0,6,10,14" && /G = \[0, 6, 10, 14\]/.test(await text()) && /V = \[2, 1, 3, 0\]/.test(await text()), mins);
check("FH inputs: inBlock and macro described", /inBlock\(k, u, v\)/.test(await text()) && /macro\.rmq\(i, j\)/.test(await text()));

// full query
await open("Toàn bộ một truy vấn", 5);
check("FH RMQ(7,12)=10", /RMQ\(7, 12\) = 10/.test(await text()));

// cover: never a red cell, for every L
await open("Vì sao hai khối luôn đủ");
let red = 0;
for (let L = 1; L <= 32; L++) { await setRange('input[type=range]', 0, L); red += await ev(`[...deck.slides[deck.cur()].querySelectorAll('rect')].filter(r => r.getAttribute('fill') === '#ff5c5c').length`); }
check("two blocks cover every length 1..32", red === 0, `${red} uncovered`);

// quarter
await open("Vì sao chọn b = ¼ log₂ n");
await setRange('input[type=range]', 0, 10); await sleep(50); check("c = 1/2 flagged as not linear", /Không còn O\(n\)/.test(await text()));
await setRange('input[type=range]', 0, 5); await sleep(50); check("c = 1/4 accepted", /Dùng được/.test(await text()));

// breakeven
await open("Bao nhiêu truy vấn thì đáng?");
const be = async (v) => { await setRange('input[type=range]', 0, v); await sleep(40); return text(); };
check("q=1: Duyệt nhanh nhất", /Nhanh nhất: Duyệt/.test(await be(0)));
check("q=10^4: Segment Tree nhanh nhất", /Nhanh nhất: Segment Tree/.test(await be(40)));
check("q=10^6: Fischer–Heun nhanh nhất", /Nhanh nhất: Fischer/.test(await be(60)));
check("q=10^7: Sparse Table nhanh nhất", /Nhanh nhất: Sparse Table/.test(await be(70)));

// time series: real drag
await open("Chuỗi thời gian: biểu đồ giá");
const box = await ev(`(() => { const r = ${cur("canvas")}.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x + box.w * 0.3, y: box.y + box.h / 2, button: "left", clickCount: 1 });
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x + box.w * 0.6, y: box.y + box.h / 2, button: "left" });
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x + box.w * 0.6, y: box.y + box.h / 2, button: "left", clickCount: 1 });
await sleep(120);
check("drag selects a range and shows min/max", /min \d/.test(await text()) && /max \d/.test(await text()));
const pts = async () => +(await ev(`[...deck.slides[deck.cur()].querySelectorAll("p")].map((p) => p.textContent).find((t) => / điểm ·/.test(t)) || "0"`)).split(" ")[0].replace(/\./g, "");
const before = await pts();
await ev(`${cur("#ts-in")}.click()`); await sleep(120);
check("zoom clears the selection", /Kéo chuột để chọn khoảng/.test(await text()));
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: box.x + box.w * 0.3, y: box.y + box.h / 2, button: "left", clickCount: 1 });
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x + box.w * 0.6, y: box.y + box.h / 2, button: "left" });
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: box.x + box.w * 0.6, y: box.y + box.h / 2, button: "left", clickCount: 1 });
await sleep(120);
const after = await pts();
check("zoomed view: same drag covers fewer points", after > 0 && after < before * 0.5, `${before} → ${after}`);
check("time series: no stats box", !/Lần vẽ vừa rồi/.test(await text()));

// DNA
await open("DNA: Suffix Array + LCP + RMQ", 3);
check("adjacent ranks: GATTAC, length 6", /= 6/.test(await text()) && /GATTAC/.test(await text()));
await ev("deck.next()"); await sleep(1000);
check("far ranks: min = 1, A", /= 1/.test(await text()) && /chung: A\./.test(await text()));

// 2D RMQ: drag rectangles on the price table
const cellXY = async (r, c) => ev(`(() => { const e = deck.slides[deck.cur()].querySelectorAll("[data-drag] .c")[${r * 8 + c}].getBoundingClientRect(); return { x: e.left + e.width / 2, y: e.top + e.height / 2 }; })()`);
const drag = async (a, b) => {
  const p = await cellXY(...a), q = await cellXY(...b);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: q.x, y: q.y, button: "left" });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: q.x, y: q.y, button: "left", clickCount: 1 });
};
await open("RMQ hai chiều");
check("2D default: 20 cells, cheapest 2 at 15h 8/11", /= 20 ô/.test(await text()) && /rẻ nhất 2 \(15h ngày 8\/11\)/.test(await text()));
await drag([0, 0], [1, 2]);
check("2D drag (0,0)→(1,2): 6 cells, cheapest 4 at 9h 4/11", /2×3 = 6 ô/.test(await text()) && /rẻ nhất 4 \(9h ngày 4\/11\)/.test(await text()), (await text()).slice(-80));

// erosion
await open("Xử lý ảnh: erosion", 2);
check("erosion reports window 5×5", /5×5/.test(await text()));
const dark = await ev(`(() => { const cs = deck.slides[deck.cur()].querySelectorAll('canvas'), sum = (c) => { const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i]; return s; }; return [sum(cs[0]), sum(cs[1])]; })()`);
check("erosion darkens the image", dark[1] < dark[0] * 0.7, `${Math.round(100 * dark[1] / dark[0])}%`);
await open("Xử lý ảnh: erosion", 0);
check("zoom at radius 0: the speck itself, 220", /min 1 ô = 220/.test(await text()));
await open("Xử lý ảnh: erosion", 2);
check("zoom at radius 2: speck gone, min of 25 cells = 16", /min 25 ô = 16/.test(await text()));
const er = await ev(`(() => { const r = deck.slides[deck.cur()].querySelectorAll('canvas')[0].getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
const rightSum = () => ev(`(() => { const c = deck.slides[deck.cur()].querySelectorAll('canvas')[1], d = c.getContext('2d').getImageData(0, c.height / 2, c.width, c.height / 2).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s; })()`);
const full = await rightSum();
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: er.x + er.w * 0.5, y: er.y + er.h * 0.25 });
await sleep(120);
check("hover moves the zoom to the pointer", /điểm \(56, 18\)/.test(await text()), (await text()).match(/điểm \([^)]*\)/)?.[0]);
const part = await rightSum();
check("hover: right image below the pointer is not computed yet", part !== full);
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: er.x + er.w * 0.5, y: er.y + er.h * 1.3 });
await sleep(120);
check("leaving the image shows the whole result again", (await rightSum()) === full);
await ev(`${cur("#er-go")}.click()`); await sleep(300);
check("scan button runs", /Dừng/.test(await ev(`${cur("#er-go")}.textContent`)));
await sleep(6200);
check("scan finishes and resets", /Quét từng điểm/.test(await ev(`${cur("#er-go")}.textContent`)) && /min 25 ô = 16/.test(await text()));

// auto-play moves by itself
await ev("deck.goto(3,0)"); await key("a"); await sleep(7000);
const moved = await ev("deck.step()") > 0 || (await ev("deck.cur()")) > 3;
check("A auto-play advances", moved); await key("a");

// theme buttons
await ev("deck.goto(1,0)"); await sleep(300);
await ev(`document.querySelector('#themes button[data-t=dark]').click()`); await sleep(200);
const darkState = await ev(`({ t: document.documentElement.dataset.deckTheme, bg: getComputedStyle(document.body).backgroundColor, src: deck.slides[1].querySelector('video').getAttribute('src') })`);
check("dark button: black background, dark video", darkState.t === "dark" && darkState.bg === "rgb(0, 0, 0)" && !/_light/.test(darkState.src), JSON.stringify(darkState));
await ev(`document.querySelector('#themes button[data-t=light]').click()`); await sleep(400);
const lightState = await ev(`({ t: document.documentElement.dataset.deckTheme, bg: getComputedStyle(document.body).backgroundColor, src: deck.slides[1].querySelector('video').getAttribute('src'), w: deck.slides[1].querySelector('video').videoWidth })`);
check("light button: light background, light video", lightState.t === "light" && lightState.bg !== "rgb(0, 0, 0)" && /_light/.test(lightState.src), JSON.stringify(lightState));
await key("d"); check("D toggles theme", (await ev("document.documentElement.dataset.deckTheme")) === "dark"); await key("d");

// responsive: stage fits a phone without page scroll
await send("Emulation.setDeviceMetricsOverride", { width: 400, height: 800, deviceScaleFactor: 2, mobile: true }); await sleep(250);
await ev("dispatchEvent(new Event('resize'))"); await sleep(100);
const m = await ev(`({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, r: Math.round(document.getElementById('stage').getBoundingClientRect().width) })`);
check("phone width: no horizontal scroll, stage fits", m.sw <= m.cw && m.r <= 400, JSON.stringify(m));

console.log("uncaught JS errors:", errors.length ? errors.join("\n") : "none");
console.log(fails ? `${fails} FAILED` : "ALL PASSED");
ws.close(); chrome.kill(); process.exit(fails ? 1 : 0);
