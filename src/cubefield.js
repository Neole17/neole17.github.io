
const DEPTH = 34;
const LIGHT = norm([-0.45, -0.7, -0.55]);

function norm(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function rot(p, rx, ry, rz) {
  let [x, y, z] = p;
  let c = Math.cos(rx), s = Math.sin(rx);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ry); s = Math.sin(ry);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(rz); s = Math.sin(rz);
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
}

const C = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
];
const F = [
  [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4],
  [2, 3, 7, 6], [1, 2, 6, 5], [0, 4, 7, 3],
];

export function initCubeField(host, canvas, opts = {}) {
  const BG = opts.bg || [165, 170, 176];
  const ctx = canvas.getContext('2d');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let seed = 11;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const cubes = Array.from({ length: 78 }, () => {
    const a = rnd() * Math.PI * 2;
    const r = 1.5 + rnd() * 3.6;
    return {
      x: Math.cos(a) * r, y: Math.sin(a) * r, z: 1 + rnd() * DEPTH,
      s: 0.55 + rnd() * 1.25,
      rx: rnd() * 6.28, ry: rnd() * 6.28, rz: rnd() * 6.28,
      spin: [(rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.12, (rnd() - 0.5) * 0.08],
      tone: rnd(),
    };
  });

  let w = 0, h = 0, dpr = 1;
  let tx = 0, ty = 0, mx = 0, my = 0;
  let travel = 0, last = performance.now();

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = host.clientWidth; h = host.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    if (still) draw(0);
  }

  function draw(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = `rgb(${BG.join(',')})`;
    ctx.fillRect(0, 0, w, h);
    const f = Math.max(w, h) * 0.62;
    const cx = w / 2, cy = h / 2;
    const yaw = mx * 0.16, pitch = my * 0.12, roll = t * 0.012;
    const cam = (p) => rot(p, pitch, yaw, roll);
    const proj = (p) => [cx + (f * p[0]) / p[2], cy + (f * p[1]) / p[2]];

    ctx.lineWidth = 1;
    const W = 6.2;
    const phase = travel % 2;
    for (let k = 0; k < DEPTH / 2; k++) {
      const z = 2 + k * 2 - phase;
      if (z < 0.6) continue;
      const ring = [[-W, -W], [W, -W], [W, W], [-W, W]].map(([x, y]) => cam([x, y, z]));
      if (ring.some((p) => p[2] < 0.3)) continue;
      ctx.strokeStyle = `rgba(60,62,66,${0.22 * (1 - z / DEPTH)})`;
      ctx.beginPath();
      ring.forEach((p, i) => { const [sx, sy] = proj(p); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
      ctx.closePath();
      ctx.stroke();
    }
    for (let i = -3; i <= 3; i++) {
      const o = (i / 3) * W;
      for (const [a, b] of [[[o, -W], [o, W]], [[-W, o], [W, o]]]) {
        for (const [x, y] of [a, b]) {
          const n = cam([x, y, 0.6]), fz = cam([x, y, DEPTH]);
          if (n[2] < 0.3) continue;
          const [x1, y1] = proj(n), [x2, y2] = proj(fz);
          ctx.strokeStyle = 'rgba(60,62,66,0.12)';
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      }
    }

    const placed = cubes.map((c) => {
      let z = c.z - travel;
      z = ((z - 0.4) % DEPTH + DEPTH) % DEPTH + 0.4;
      return { c, z };
    }).sort((a, b) => b.z - a.z);

    for (const { c, z } of placed) {
      const rx = c.rx + c.spin[0] * t, ry = c.ry + c.spin[1] * t, rz = c.rz + c.spin[2] * t;
      const pts = C.map((p) => {
        const q = rot([p[0] * c.s, p[1] * c.s, p[2] * c.s], rx, ry, rz);
        return cam([q[0] + c.x, q[1] + c.y, q[2] + z]);
      });
      if (pts.some((p) => p[2] < 0.25) || z < 0.95) continue;
      const fog = Math.min(1, Math.max(0, (z - 4) / (DEPTH - 4))) ** 1.3;
      const fade = Math.min(1, Math.max(0, (z - 0.9) / 3.2));
      for (const face of F) {
        const a = pts[face[0]], b = pts[face[1]], d = pts[face[3]];
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
        const n = norm([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]);
        if (n[0] * a[0] + n[1] * a[1] + n[2] * a[2] >= 0) continue;
        const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const base = 62 + c.tone * 50 + lit * 120;
        const g = base + (BG[0] - base) * fog;
        ctx.fillStyle = `rgba(${g | 0},${g | 0},${g | 0},${fade})`;
        ctx.strokeStyle = `rgba(${(g * 0.82) | 0},${(g * 0.82) | 0},${(g * 0.82) | 0},${fade * 0.6})`;
        ctx.beginPath();
        face.forEach((i, k) => { const [sx, sy] = proj(pts[i]); k ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    travel += dt * 0.7;
    mx += (tx - mx) * 0.06;
    my += (ty - my) * 0.06;
    draw(now / 1000);
    requestAnimationFrame(loop);
  }

  new ResizeObserver(resize).observe(host);
  resize();
  if (!still) {
    addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
    requestAnimationFrame(loop);
  }
}
