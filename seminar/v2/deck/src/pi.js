/* The π narrator: drawn from the same outline as the Manim scenes (manim/pi_shape.json). */
(function () {
  "use strict";
  const S = window.PI_SHAPE;
  const NS = "http://www.w3.org/2000/svg";
  const toPath = (p) => "M" + p.map((q) => q.join(" ")).join("L") + "Z";
  const bodyPath = S.body.map(toPath).join("");

  function mouthPath(w, top, bot) {
    const { cx, cy } = S.mouth;
    let d = "", n = 14;
    for (let i = 0; i <= n; i++) { const x = -1 + 2 * i / n; d += (i ? "L" : "M") + (cx + x * w).toFixed(1) + " " + (cy + top * (1 - x * x)).toFixed(1); }
    for (let i = n - 1; i > 0; i--) { const x = -1 + 2 * i / n; d += "L" + (cx + x * w).toFixed(1) + " " + (cy + bot * (1 - x * x)).toFixed(1); }
    return d + "Z";
  }

  window.makePi = function (svg, opts = {}) {
    svg.setAttribute("viewBox", "0 -14 220 262");
    svg.innerHTML =
      `<g class="wrap">` +
      `<path class="arm arm-l" d="${toPath(S.armL)}" fill="#2fa8ff" style="transform-origin:${S.shoulderL[0]}px ${S.shoulderL[1]}px"/>` +
      `<path class="arm arm-r" d="${toPath(S.armR)}" fill="#2fa8ff" style="transform-origin:${S.shoulderR[0]}px ${S.shoulderR[1]}px"/>` +
      `<path d="${bodyPath}" fill="#2fa8ff"/>` +
      S.eyes.map((e) => `<g class="eye"><ellipse class="white" cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="#fff"/><circle class="pupil" cx="${e.cx + 3}" cy="${e.cy + 4}" r="${S.pupil}" fill="#000"/></g>`).join("") +
      `<path class="mouth" fill="#06233b"/></g>`;
    const mouth = svg.querySelector(".mouth");
    const pupils = Array.from(svg.querySelectorAll(".pupil"));
    const eyes = Array.from(svg.querySelectorAll(".eye"));
    let curM = S.moods.neutral.slice(), raf = 0, lastMouse = 0;
    mouth.setAttribute("d", mouthPath(...curM));

    function mood(m) {
      const target = S.moods[m] || S.moods.neutral, from = curM.slice(), t0 = performance.now();
      cancelAnimationFrame(raf);
      (function tick(t) {
        const u = Math.min(1, (t - t0) / 180), e = u * (2 - u);
        curM = from.map((v, i) => v + (target[i] - v) * e);
        mouth.setAttribute("d", mouthPath(...curM));
        if (u < 1) raf = requestAnimationFrame(tick);
      })(t0);
    }
    function look(x, y, fromMouse) {
      const now = performance.now();
      if (fromMouse) lastMouse = now; else if (now - lastMouse < 1500) return;
      const r = svg.getBoundingClientRect(), k = window.deckScale || 1, st = document.getElementById("stage").getBoundingClientRect();
      pupils.forEach((p, i) => {
        const e = S.eyes[i];
        const sx = (r.left - st.left) / k + (e.cx / 220) * r.width / k, sy = (r.top - st.top) / k + ((e.cy + 14) / 262) * r.height / k;
        const dx = x - sx, dy = y - sy, d = Math.hypot(dx, dy) || 1;
        p.setAttribute("cx", (e.cx + dx / d * e.rx * 0.46).toFixed(1));
        p.setAttribute("cy", (e.cy + dy / d * e.ry * 0.46).toFixed(1));
      });
    }
    function blink() {
      eyes.forEach((g, i) => {
        const e = S.eyes[i];
        g.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(.06)" }, { transform: "scaleY(1)" }],
          { duration: 170, easing: "ease-in-out" });
        g.style.transformOrigin = `${e.cx}px ${e.cy}px`;
      });
    }
    (function loop() { setTimeout(() => { blink(); loop(); }, 2600 + Math.random() * 3600); })();
    function gesture(both) {
      svg.classList.remove("gest", "gest2");
      void svg.getBoundingClientRect();
      svg.classList.add(both ? "gest2" : "gest");
    }
    if (opts.mood) mood(opts.mood);
    return { mood, look, blink, gesture };
  };
})();
