// Generates kich_ban.md from the slides: narration lines, speaker notes, time budget.
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const dir = join(HERE, "../deck/src/slides");
const ACTS = ["Câu chuyện", "Bài toán", "Cơ sở thuật toán", "Áp dụng", "Tối ưu", "Benchmark", "Thực tế", "Kết"];
const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const html = readdirSync(dir).filter((f) => f.endsWith(".html")).sort().map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
const secs = [...html.matchAll(/<section class="s([^"]*)"([^>]*)>([\s\S]*?)<\/section>/g)];
let out = "# Kịch bản trình bày RMQ\n\nFile này được sinh từ slide bằng `node tools/export_script.mjs`. Trong deck, bấm **N** để xem ghi chú của slide hiện tại.\n", act = -1, n = 0, total = 0, short = 0;
for (const [, cls, attrs, body] of secs) {
  n++;
  const get = (k) => (new RegExp(`data-${k}="([^"]*)"`).exec(attrs) || [])[1];
  const t = +(get("time") || 0), opt = /data-opt/.test(attrs), a = +get("act");
  total += t; if (!opt) short += t;
  if (a !== act) { act = a; out += `\n## ${ACTS[a]}\n`; }
  out += `\n### ${n}. ${get("title")} (${t} giây${opt ? ", có thể lướt" : ""})\n`;
  if (cls.includes("video")) out += `\n*Video manim, nói theo phụ đề.*\n`;
  const says = [...body.matchAll(/<div class="say"[^>]*>([\s\S]*?)<\/div>/g)].map((m) => strip(m[1]));
  if (says.length) out += "\n" + says.map((s) => `- Pi: ${s}`).join("\n") + "\n";
  const notes = /<div class="notes">([\s\S]*?)<\/div>/.exec(body);
  if (notes) out += "\n" + [...notes[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => strip(m[1])).join("\n\n") + "\n";
}
out = out.replace("\n\n## ", `\n\nTổng thời gian khoảng ${Math.round(total / 60)} phút; bản rút gọn (phím T) khoảng ${Math.round(short / 60)} phút.\n\n## `);
writeFileSync(join(HERE, "../kich_ban.md"), out);
console.log(`${n} slides, ${Math.round(total / 60)} min, short ${Math.round(short / 60)} min`);
