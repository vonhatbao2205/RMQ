// Walks every slide and step in headless Chrome: reports JS errors, overflow and overlap with π's bubble,
// and saves screenshots. Usage: node audit.mjs [outdir] [--shots] [--only=3,7,12]
import { spawn } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME || "/nix/store/72ajwyw507cb3j0b4vblgplsd5s7b90a-google-chrome-156.0.8078.73/bin/google-chrome-stable";
const OUT = resolve(process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "/tmp/rmq-audit");
const SHOTS = process.argv.includes("--shots");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) || "").replace("--only=", "").split(",").filter(Boolean).map(Number);
const THEME = (process.argv.find((a) => a.startsWith("--theme=")) || "--theme=light").replace("--theme=", "");
mkdirSync(OUT, { recursive: true });
const PORT = 9333 + Math.floor(Math.random() * 500);
const page = "file://" + resolve(HERE, "../deck/dist/index.html");
const chrome = spawn(CHROME, ["--headless=new", "--no-sandbox", "--disable-gpu", `--remote-debugging-port=${PORT}`, "--window-size=1920,1080", "--hide-scrollbars",
  "--autoplay-policy=no-user-gesture-required", `--user-data-dir=${OUT}/profile`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 60 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page"); } catch (e) { /* not up yet */ } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });
let id = 0; const pending = new Map(); const errors = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.exceptionThrown") errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value || a.description).join(" "));
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errors.push(m.params.entry.text + " " + (m.params.entry.url || ""));
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => { const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails)); return r.result.result.value; };
await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: page });
await sleep(1200);

const AUDIT = `(() => {
  const s = deck.slides[deck.cur()], out = [];
  if (s.classList.contains('video')) { const v = s.querySelector('video'); return { problems: v.error ? ['video error'] : [], video: v.duration, paused: v.paused }; }
  const bub = document.getElementById('bubble').getBoundingClientRect();
  const hasBub = !document.getElementById('narr').classList.contains('off') && bub.height > 0;
  const body = s.querySelector('.body');
  if (body && body.scrollHeight > body.clientHeight + 3) out.push('body overflow ' + (body.scrollHeight - body.clientHeight) + 'px');
  const visible = (e) => { for (let x = e; x && x !== s; x = x.parentElement) { const c = getComputedStyle(x); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity < 0.05) return false; } return true; };
  const piBox = document.getElementById('pi').getBoundingClientRect();
  const hasPi = hasBub && piBox.width > 0;
  let worst = 0, worstEl = null, right = 0, rightEl = null, hit = 0, hitEl = null, piHit = 0, piEl = null;
  for (const e of s.querySelectorAll('h1,h2,h3,p,li,td,th,pre,svg,canvas,.c,.txt,.lead,.key,.tk,table,.ctl,button')) {
    if (e.closest('.say,.notes') || !visible(e)) continue;
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (r.bottom > worst) { worst = r.bottom; worstEl = e; }
    if (r.right > right) { right = r.right; rightEl = e; }
    if (hasPi && !['TABLE', 'SVG', 'CANVAS'].includes(e.tagName.toUpperCase()) && !e.classList.contains('key')) {
      const dx = Math.min(r.right, piBox.right) - Math.max(r.left, piBox.left), dy = Math.min(r.bottom, piBox.bottom) - Math.max(r.top, piBox.top + 10);
      if (dx > 6 && dy > 3 && dy > piHit) { piHit = dy; piEl = e; }
    }
    if (hasBub && !e.classList.contains('key') && e.tagName !== 'TABLE') {
      const dx = Math.min(r.right, bub.right + 4) - Math.max(r.left, bub.left - 4), dy = Math.min(r.bottom, bub.bottom + 4) - Math.max(r.top, bub.top - 4);
      if (dx > 6 && dy > 3 && dy > hit) { hit = dy; hitEl = e; }
    }
  }
  const name = (e) => e ? e.tagName + '.' + (e.className.baseVal ?? e.className) + ' "' + (e.textContent || '').trim().slice(0, 40) + '"' : '';
  if (worst > 1076) out.push('below stage by ' + Math.round(worst - 1080) + ': ' + name(worstEl));
  if (right > 1912) out.push('past right edge by ' + Math.round(right - 1920) + ': ' + name(rightEl));
  if (piHit) out.push('under pi by ' + Math.round(piHit) + 'px: ' + name(piEl));
  if (hit) out.push('under bubble by ' + Math.round(hit) + 'px: ' + name(hitEl));
  // clipped text inside fixed containers
  for (const e of s.querySelectorAll('pre.code,.c')) { if (visible(e) && e.scrollWidth > e.clientWidth + 2) out.push('clipped ' + name(e) + ' ' + e.scrollWidth + '>' + e.clientWidth); }
  return { problems: out, bubble: document.getElementById('bubble').textContent.length, bubH: Math.round(bub.height) };
})()`;

await ev(`deck.setTheme(${JSON.stringify(THEME)}, true)`);
const total = await ev("deck.count()");
const report = [];
let shots = 0;
for (let i = 0; i < total; i++) {
  if (ONLY.length && !ONLY.includes(i + 1)) continue;
  const max = await ev(`(deck.goto(${i},0), deck.slides[${i}]._max)`);
  for (let st = 0; st <= max; st++) {
    await ev(`deck.goto(${i},${st})`);
    await sleep(ONLY.length ? 1500 : 650);
    const r = await ev(AUDIT);
    const title = await ev(`deck.slides[${i}].dataset.title`);
    if (r.problems.length) report.push(`#${i + 1}.${st} ${title}: ${r.problems.join(" | ")}`);
    if (SHOTS) {
      const img = await send("Page.captureScreenshot", { format: "jpeg", quality: 72, captureBeyondViewport: false });
      writeFileSync(join(OUT, `s${String(i + 1).padStart(2, "0")}_${st}.jpg`), Buffer.from(img.result.data, "base64")); shots++;
    }
  }
}
const bev = await ev("window.__breakeven ? JSON.stringify(window.__breakeven) : ''");
console.log(`slides ${total}, shots ${shots}`);
console.log("JS errors:", errors.length ? [...new Set(errors)].join("\n  ") : "none");
console.log("layout problems:", report.length ? "\n" + report.join("\n") : "none");
if (bev) console.log("breakeven", bev);
ws.close(); chrome.kill();
process.exit(0);
