//script from nelson
(function () {
  const canvas = document.getElementById('bg-grid');
  const ctx = canvas.getContext('2d');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CELL = 4;
  const DAMP = 0.982;
  const BG = [10, 12, 14];
  const MINT = [166, 245, 208];
  const BLUE = [0, 225, 255];

  let w, h, dpr, gw, gh, cur, prev, buf, img, lastDrop = 0;
  const mouse = { x: 0, y: 0, on: false, lx: 0, ly: 0 };

  function setup() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    gw = Math.ceil(w / CELL) + 2;
    gh = Math.ceil(h / CELL) + 2;
    cur = new Float32Array(gw * gh);
    prev = new Float32Array(gw * gh);
    buf = document.createElement('canvas');
    buf.width = gw;
    buf.height = gh;
    img = buf.getContext('2d').createImageData(gw, gh);
  }

  function drop(x, y, radius, strength) {
    const cx = x / CELL + 1, cy = y / CELL + 1;
    const r = Math.max(1, radius);
    const x0 = Math.max(1, Math.floor(cx - r)), x1 = Math.min(gw - 2, Math.ceil(cx + r));
    const y0 = Math.max(1, Math.floor(cy - r)), y1 = Math.min(gh - 2, Math.ceil(cy + r));
    for (let j = y0; j <= y1; j++) {
      for (let i = x0; i <= x1; i++) {
        const d2 = ((i - cx) ** 2 + (j - cy) ** 2) / (r * r);
        if (d2 < 1) cur[j * gw + i] += strength * Math.cos(d2 * Math.PI / 2);
      }
    }
  }

  function step() {
    for (let j = 1; j < gh - 1; j++) {
      for (let i = 1; i < gw - 1; i++) {
        const k = j * gw + i;
        prev[k] = ((cur[k - 1] + cur[k + 1] + cur[k - gw] + cur[k + gw]) * 0.5 - prev[k]) * DAMP;
      }
    }
    const t = cur; cur = prev; prev = t;
  }

  function render() {
    const data = img.data;
    for (let j = 0; j < gh; j++) {
      for (let i = 0; i < gw; i++) {
        const k = j * gw + i;
        let s = 0, c = 0;
        if (i > 0 && i < gw - 1 && j > 0 && j < gh - 1) {
          s = (cur[k - 1] - cur[k + 1]) * 0.6 + (cur[k - gw] - cur[k + gw]) * 0.8;
          c = cur[k];
        }
        const lit = s > 0 ? Math.min(1, s * 0.035) : 0;
        const shade = s < 0 ? Math.min(1, -s * 0.03) : 0;
        const spec = lit > 0.7 ? (lit - 0.7) * 1.2 : 0;
        const glow = Math.min(0.06, Math.abs(c) * 0.0012);
        const p = k * 4;
        const m = i / gw;
        const a = lit * 0.17 + glow;
        const sp = spec * 0.14;
        data[p]     = BG[0] + (MINT[0] + (BLUE[0] - MINT[0]) * m) * (a + sp) - BG[0] * shade * 0.4;
        data[p + 1] = BG[1] + (MINT[1] + (BLUE[1] - MINT[1]) * m) * (a + sp) - BG[1] * shade * 0.4;
        data[p + 2] = BG[2] + (MINT[2] + (BLUE[2] - MINT[2]) * m) * (a + sp) - BG[2] * shade * 0.4;
        data[p + 3] = 255;
      }
    }
    buf.getContext('2d').putImageData(img, 0, 0);
    ctx.drawImage(buf, CELL, CELL, gw - 2, gh - 2, 0, 0, (gw - 2) * CELL, (gh - 2) * CELL);
  }

  function frame(t) {
    if (t - lastDrop > 1400 + Math.random() * 2000) {
      drop(Math.random() * w, Math.random() * h, 2 + Math.random() * 1.5, 10 + Math.random() * 12);
      lastDrop = t;
    }
    if (mouse.on) {
      const dist = Math.hypot(mouse.x - mouse.lx, mouse.y - mouse.ly);
      if (dist > 2) {
        const n = Math.min(6, Math.ceil(dist / 12));
        for (let s = 1; s <= n; s++) {
          const f = s / n;
          drop(mouse.lx + (mouse.x - mouse.lx) * f, mouse.ly + (mouse.y - mouse.ly) * f, 3, Math.min(28, 5 + dist * 0.45) / n);
        }
      }
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
    }
    step();
    render();
    requestAnimationFrame(frame);
  }

  function move(e) {
    if (!mouse.on) {
      mouse.lx = e.clientX;
      mouse.ly = e.clientY;
    }
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.on = true;
  }

  function splash(e) {
    drop(e.clientX, e.clientY, 6, 130);
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2, r = 20 + Math.random() * 30;
      drop(e.clientX + Math.cos(a) * r, e.clientY + Math.sin(a) * r, 2.5, 30);
    }
  }

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', splash, { passive: true });
  document.addEventListener('pointerleave', () => { mouse.on = false; });
  window.addEventListener('blur', () => { mouse.on = false; });
  window.addEventListener('resize', setup);

  setup();
  if (still) render();
  else requestAnimationFrame(frame);
})();
