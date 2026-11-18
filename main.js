// Accueil : un disque de points dont la taille suit un champ de valeurs qui ondule,
// comme une carte de chaleur vivante. Respecte prefers-reduced-motion.
(function () {
  const canvas = document.getElementById("field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COLORS = {
    ink: [236, 230, 216],
    gold: [227, 179, 76],
    green: [76, 175, 122],
    red: [196, 81, 92],
  };

  let dots = [];
  let size = 0;
  let dpr = 1;
  const pointer = { x: -1e4, y: -1e4 };

  // Pseudo-aléatoire déterministe : le même dessin à chaque visite.
  function rand(i) {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function build() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    size = rect.width;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    dots = [];
    const n = 23; // points par ligne
    const step = size / n;
    const c = size / 2;
    const r = size / 2 - step / 2;
    let i = 0;
    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++) {
        const x = step / 2 + gx * step;
        const y = step / 2 + gy * step;
        const d = Math.hypot(x - c, y - c);
        if (d > r) continue;
        const p = rand(i++);
        const color = p < 0.09 ? "gold" : p < 0.15 ? "green" : p < 0.175 ? "red" : "ink";
        dots.push({ x, y, u: (x - c) / r, v: (y - c) / r, edge: d / r, color });
      }
    }
    if (reduce) draw(0);
  }

  function field(u, v, t) {
    return (
      0.5 +
      0.22 * Math.sin(u * 3.1 + t * 0.6) +
      0.18 * Math.sin(v * 2.7 - t * 0.45) +
      0.14 * Math.sin((u + v) * 4.2 + t * 0.8) +
      0.08 * Math.sin(Math.hypot(u - 0.3, v + 0.2) * 7 - t * 1.1)
    );
  }

  function draw(now) {
    const t = reduce ? 1.7 : now / 1000;
    ctx.clearRect(0, 0, size, size);
    const step = size / 23;
    for (const d of dots) {
      let val = Math.max(0, Math.min(1, field(d.u, d.v, t)));
      val *= 1 - Math.pow(d.edge, 6) * 0.6; // bord plus calme
      const near = Math.hypot(d.x - pointer.x, d.y - pointer.y);
      const boost = near < size * 0.18 ? (1 - near / (size * 0.18)) * 0.5 : 0;
      const v = Math.min(1, val + boost);
      const radius = step * (0.08 + 0.34 * v);
      const accent = d.color !== "ink";
      const rgb = COLORS[d.color];
      const alpha = accent ? 0.35 + 0.65 * v : 0.12 + 0.55 * v;
      ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!reduce) requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
    if (reduce) draw(0);
  });
  canvas.addEventListener("pointerleave", () => {
    pointer.x = pointer.y = -1e4;
    if (reduce) draw(0);
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 150);
  });

  build();
  if (!reduce) requestAnimationFrame(draw);
})();

// Apparition douce des blocs au scroll.
(function () {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12 }
  );
  items.forEach((el) => io.observe(el));
})();
