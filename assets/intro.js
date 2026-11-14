/* Home page header */
/* intro will be typed out + show map of North America -> zoom into Philadelphia map */
/* map shapes live in map-data.js */

(() => {
    const NS = "http://www.w3.org/2000/svg";
    const $ = id => document.getElementById(id);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  
    /* draw map */
    const land = $("land");
    for (const d of MAP.countryPaths) {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", "land"); p.setAttribute("d", d); land.appendChild(p);
    }
    $("us").setAttribute("d", MAP.nation);
    $("states").setAttribute("d", MAP.stateBorders);
    $("counties").setAttribute("d", MAP.countyBorders);
  
    const labelsG = $("labels");
    const mkLabel = (txt, x, y, cls) => {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("class", cls);
      t.textContent = txt; labelsG.appendChild(t); return t;
    };
    const far = MAP.labels.far.map(([t, x, y]) => mkLabel(t, x, y, /Ocean|Gulf/.test(t) ? "ocean" : "far"));
    const near = MAP.labels.near.map(([t, x, y]) => mkLabel(t, x, y, "near"));
    const [px, py] = MAP.philly;
    const here = mkLabel("Philadelphia", px, py, "here");
  
    /* camera zoom math */
    function flyTo(p0, p1) {
      const rho = Math.SQRT2, rho2 = 2, rho4 = 4;
      const [ux0, uy0, w0] = p0, [ux1, uy1, w1] = p1;
      const dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, d1 = Math.sqrt(d2);
      const b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1);
      const b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1);
      const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
      const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      const S = (r1 - r0) / rho;
      return t => {
        const s = t * S, c = Math.cosh(r0);
        const u = w0 / (rho2 * d1) * (c * Math.tanh(rho * s + r0) - Math.sinh(r0));
        return [ux0 + u * dx, uy0 + u * dy, w0 * c / Math.cosh(rho * s + r0)];
      };
    }
  
    const W = MAP.W, H = MAP.H;
    const START = [W / 2, H / 2, W]; // all of na
    const endW = 115; // philly + south jersey area
    // put philly a bit right of centre and above name text
    const END = [px - 0.06 * endW, py + 0.12 * endW * H / W, endW];
    const path = flyTo(START, END);
    let view = START.slice();
  
    const camera = $("camera"), counties = $("counties"), dot = $("dot"), pulse = $("pulse");
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const ramp = (v, a, b) => clamp((v - a) / (b - a));
  
    function render(now) {
      const [cx, cy, w] = view, k = W / w;
      camera.setAttribute("transform", `translate(${W / 2 - cx * k},${H / 2 - cy * k}) scale(${k})`);
      // labels stay constant on-screen size
      labelsG.setAttribute("font-size", 15 / k);
      labelsG.setAttribute("stroke-width", 3 / k);
      const fFar = 1 - ramp(k, 1.4, 3.2), fNear = ramp(k, 6, 11);
      far.forEach(t => t.style.opacity = fFar);
      near.forEach(t => t.style.opacity = fNear * 0.9);
      here.style.opacity = ramp(k, 9, 12.5);
      here.setAttribute("font-size", 17 / k);
      here.setAttribute("y", py - 16 / k);
      counties.style.opacity = ramp(k, 5, 10) * 0.9;
      // dot + pulsing ring around it
      dot.setAttribute("cx", px); dot.setAttribute("cy", py);
      dot.setAttribute("r", 6 / k); dot.setAttribute("stroke-width", 2 / k);
      const ph = (now / 1800) % 1;
      pulse.setAttribute("cx", px); pulse.setAttribute("cy", py);
      pulse.setAttribute("r", (6 + ph * 22) / k); pulse.setAttribute("opacity", 0.4 * (1 - ph));
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    function zoomIn(duration = 4200) {
      return new Promise(done => {
        const t0 = performance.now();
        (function step(now) {
          const t = clamp((now - t0) / duration);
          view = path(ease(t));
          t < 1 ? requestAnimationFrame(step) : done();
        })(t0);
      });
    }
  
    /* typewriter stuff */
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    async function type(el, text, speed) {
      for (const ch of text) {
        el.textContent += ch;
        await sleep(speed + Math.random() * speed * 0.6);
      }
    }
  
    /* est clock */
    function tick() {
      const now = new Date();
      const time = now.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
      const hour = +now.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false });
      $("clock-time").textContent = time;
      $("clock-icon").textContent = hour >= 6 && hour < 18 ? "☀" : "☾";
    }
    tick(); setInterval(tick, 15000);
  
    /* sequence */
    const reveal = () => $("tagline").classList.add("show");
    async function intro() {
      if (reduce) {
        $("type1").textContent = "Hello, world!";
        $("type2").textContent = "I'm Tiffany";
        $("caret1").style.display = "none";
        view = END.slice(); reveal(); return;
      }
      await sleep(500);
      await type($("type1"), "Hello, world!", 75);
      await sleep(450);
      $("caret1").style.display = "none";
      $("caret2").style.display = "inline-block";
      await type($("type2"), "I'm Tiffany", 110);
      await sleep(100); /* map zoom delay after it finishes typing */
      await zoomIn();
      reveal();
    }
    intro();
  })();