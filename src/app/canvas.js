/* ── CANVAS — dot-matrix animations for sign-in and home empty state ── */

/* ── Sign-in screen: animated twinkling dot matrix ── */
export function initSignInCanvas() {
  const canvas = document.getElementById('auth-dot-canvas');
  if (!canvas) return;

  const ctx      = canvas.getContext('2d');
  const GRID     = 13;
  const DOT      = 2.6;
  const CORN     = 0.9;
  const OP_LEVELS = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1.0];
  const FREQ     = 4.5;

  let raf, dots = [];
  const t0 = performance.now();

  function hash(n) {
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b) | 0;
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b) | 0;
    return ((n ^ (n >>> 16)) >>> 0) / 0x100000000;
  }
  function hash2(x, y) { return hash(x * 1619 + y * 31337 + 1); }

  function buildDots() {
    dots = [];
    const W = canvas.width, H = canvas.height;
    const cols = Math.ceil(W / GRID) + 2;
    const rows = Math.ceil(H / GRID) + 2;
    const ox   = (W % GRID) / 2;
    const oy   = (H % GRID) / 2;
    const gCX  = cols / 2, gCY = rows / 2;
    const maxDist = Math.sqrt((cols / 2) ** 2 + (rows / 2) ** 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dist     = Math.sqrt((c - gCX) ** 2 + (r - gCY) ** 2);
        const distNorm = Math.min(dist / maxDist, 1.0);
        const edgeMult = 0.04 + 0.96 * (distNorm * distNorm);
        const isGold   = hash2(c, r) < 0.30;
        const baseMax  = isGold
          ? 0.55 + hash(c * 313 + r * 1021 + 5) * 0.45
          : 0.22 + hash(c * 541 + r * 733  + 7) * 0.43;
        dots.push({
          x: ox + c * GRID, y: oy + r * GRID,
          gx: c, gy: r, dist,
          delay:      dist * 0.042 + hash2(c + 77, r + 77) * 0.55,
          isGold,
          maxOp:      baseMax * edgeMult,
          showOffset: hash2(c + 13, r + 99),
        });
      }
    }
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    buildDots();
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    if (!document.getElementById('auth-dot-canvas')) {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      return;
    }
    const t = (performance.now() - t0) / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const d of dots) {
      const elapsed = t - d.delay;
      if (elapsed < 0) continue;
      const reveal = Math.min(elapsed / 0.28, 1.0);
      const slot   = Math.floor(t / FREQ + d.showOffset + FREQ);
      const randV  = hash(d.gx * 1009 + d.gy * 1013 + slot * 7919);
      const baseOp = OP_LEVELS[Math.min(Math.floor(randV * 10), 9)];
      const op     = reveal * baseOp * d.maxOp;
      if (op < 0.008) continue;
      ctx.globalAlpha = op;
      ctx.fillStyle   = d.isGold ? '#D0A052' : '#c8c0b8';
      ctx.beginPath();
      ctx.roundRect(d.x - DOT, d.y - DOT, DOT * 2, DOT * 2, CORN);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  }
  draw();
}

/* ── Home empty state: static dot matrix background ── */
export function initHomeEmptyCanvas() {
  const canvas = document.getElementById('home-empty-canvas');
  if (!canvas) return;

  const ctx  = canvas.getContext('2d');
  const GRID = 22, DOT = 2.2, CORN = 0.6;

  function hash(n) {
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b) | 0;
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b) | 0;
    return ((n ^ (n >>> 16)) >>> 0) / 0x100000000;
  }
  function hash2(x, y) { return hash(x * 1619 + y * 31337 + 1); }

  function draw() {
    const parent = canvas.parentElement;
    canvas.width  = parent?.offsetWidth  || window.innerWidth;
    canvas.height = parent?.offsetHeight || window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cols = Math.ceil(canvas.width  / GRID) + 2;
    const rows = Math.ceil(canvas.height / GRID) + 2;
    const ox   = (canvas.width  % GRID) / 2;
    const oy   = (canvas.height % GRID) / 2;
    const cx = cols / 2, cy = rows / 2;
    const maxD = Math.sqrt(cx * cx + cy * cy);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
        const edge = 0.05 + 0.95 * ((dist / maxD) ** 2);
        const h = hash2(c, r);
        const isGold = h < 0.25;
        const baseOp = isGold
          ? 0.40 + hash(c * 313 + r * 1021 + 5) * 0.45
          : 0.15 + hash(c * 541 + r * 733  + 7) * 0.30;
        const op = baseOp * edge * 0.22;
        if (op < 0.006) continue;
        ctx.globalAlpha = op;
        ctx.fillStyle   = isGold ? '#D0A052' : '#c8c0b8';
        ctx.beginPath();
        ctx.roundRect(ox + c * GRID - DOT, oy + r * GRID - DOT, DOT * 2, DOT * 2, CORN);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  draw();
  const ro = new ResizeObserver(draw);
  ro.observe(canvas.parentElement || canvas);
}
