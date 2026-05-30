import { ITEMS, HUB_R, SEG_INNER, SEG_OUTER, ANGLE_SPREAD, GAP_DEG } from './config.js';
import { ease, polarToCart, mulberry32 } from './utils.js';

const SEG_DEG = (ANGLE_SPREAD / ITEMS.length) - GAP_DEG;

function itemAngle(i) {
  const start = -ANGLE_SPREAD / 2;
  const step = ANGLE_SPREAD / ITEMS.length;
  return (start + step * i + step / 2) * Math.PI / 180;
}

function buildShardShape(i) {
  const rng = mulberry32(i * 9999 + 1234);
  const angle = itemAngle(i);
  const halfSeg = (SEG_DEG / 2) * Math.PI / 180;
  const a1 = angle - halfSeg, a2 = angle + halfSeg;
  const pts = [];
  const rInner = HUB_R + SEG_INNER;
  const rOuter = rInner + SEG_OUTER;

  for (let s = 0; s <= 3; s++) {
    const t = s / 3;
    pts.push({ r: rInner + (rOuter - rInner) * t + (rng()-0.5)*10, a: a1 + (rng()-0.5)*0.04 });
  }
  for (let s = 0; s <= 4; s++) {
    const t = s / 4;
    pts.push({ r: rOuter + (rng()-0.5)*14, a: a1 + (a2-a1)*t + (rng()-0.5)*0.03 });
  }
  for (let s = 0; s <= 3; s++) {
    const t = s / 3;
    pts.push({ r: rOuter + (rInner-rOuter)*t + (rng()-0.5)*10, a: a2 + (rng()-0.5)*0.04 });
  }
  for (let s = 0; s <= 4; s++) {
    const t = s / 4;
    pts.push({ r: rInner + (rng()-0.5)*8, a: a2 + (a1-a2)*t + (rng()-0.5)*0.03 });
  }

  const hlPts = [
    { r: rInner + 4,              a: a1 + 0.01 },
    { r: rInner + 18 + rng()*10,  a: a1 + 0.01 },
    { r: rInner + 10 + rng()*8,   a: a1 + (a2-a1)*0.3 },
    { r: rInner + 5,              a: a1 + (a2-a1)*0.25 },
  ];

  return { pts, hlPts };
}

const shardShapes = ITEMS.map((_, i) => buildShardShape(i));

export function createCanvas(root, canvas, state) {
  const ctx = canvas.getContext('2d');

  function getHub() {
    return { x: -HUB_R + 18, y: root.offsetHeight / 2 };
  }

  function drawShard(hub, pts, ep, fillStyle, strokeStyle, strokeWidth) {
    if (pts.length < 3) return;
    const rInner = HUB_R + SEG_INNER;
    const scaledPts = pts.map(p => {
      const scaledR = rInner + (p.r - rInner) * ep;
      return polarToCart(hub, scaledR, p.a);
    });
    ctx.beginPath();
    ctx.moveTo(scaledPts[0].x, scaledPts[0].y);
    for (let k = 1; k < scaledPts.length; k++) ctx.lineTo(scaledPts[k].x, scaledPts[k].y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    if (strokeWidth > 0) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const hub = getHub();
    const ep = ease(state.progress);

    // Hub ring
    if (ep > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, ep * 1.5);
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, HUB_R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(80,180,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, HUB_R - 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,30,90,0.7)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100,200,255,0.8)';
      ctx.fill();
      for (let t = 0; t < 12; t++) {
        const ta = (t / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(hub.x + (HUB_R-10)*Math.cos(ta), hub.y + (HUB_R-10)*Math.sin(ta));
        ctx.lineTo(hub.x + (HUB_R-4)*Math.cos(ta),  hub.y + (HUB_R-4)*Math.sin(ta));
        ctx.strokeStyle = 'rgba(100,200,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    if (state.progress <= 0.005) return;

    // Menu shards
    ITEMS.forEach((label, i) => {
      const isActive = i === state.activeIdx;
      const shape = shardShapes[i];
      const angle = itemAngle(i);
      const rInner = HUB_R + SEG_INNER;
      const rOuter = rInner + SEG_OUTER * ep;

      ctx.save();
      const fill = isActive ? `rgba(160,50,0,${0.7+ep*0.15})` : `rgba(0,40,120,${0.6+ep*0.1})`;
      const stroke = isActive ? 'rgba(255,130,60,0.9)' : 'rgba(70,170,255,0.55)';
      drawShard(hub, shape.pts, ep, fill, stroke, isActive ? 1.5 : 1);
      ctx.globalAlpha = ep * (isActive ? 0.55 : 0.3);
      drawShard(hub, shape.hlPts, ep, isActive ? 'rgba(255,200,160,0.6)' : 'rgba(180,230,255,0.5)', '', 0);
      ctx.restore();

      // Label
      if (ep > 0.4) {
        const la = Math.min(1, (ep - 0.4) / 0.3);
        const midR = rInner + (rOuter - rInner) * 0.5;
        ctx.save();
        ctx.globalAlpha = la;
        ctx.font = `700 ${isActive ? 13 : 11}px Orbitron, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isActive ? '#fff' : 'rgba(160,220,255,0.9)';
        if (isActive) { ctx.shadowColor = 'rgba(255,140,60,0.9)'; ctx.shadowBlur = 12; }
        ctx.fillText(label, hub.x + midR * Math.cos(angle), hub.y + midR * Math.sin(angle));
        ctx.restore();
      }

      // Active chevron
      if (isActive && ep > 0.75) {
        const aa = (ep - 0.75) / 0.25;
        ctx.save();
        ctx.globalAlpha = aa;
        ctx.fillStyle = '#ff9060';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('▶', hub.x + (rOuter+13)*Math.cos(angle), hub.y + (rOuter+13)*Math.sin(angle));
        ctx.restore();
      }
    });
  }

  function resize() {
    canvas.width = root.offsetWidth;
    canvas.height = root.offsetHeight;
    draw();
  }

  function animate() {
    const diff = state.targetProgress - state.progress;
    if (Math.abs(diff) < 0.004) {
      state.progress = state.targetProgress;
      draw();
      state.rafId = null;
      return;
    }
    state.progress += diff * 0.18;
    draw();
    state.rafId = requestAnimationFrame(animate);
  }

  function startAnim() {
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(animate);
  }

  // Hit test: which shard is under the mouse?
  function hitTest(mx, my) {
    const hub = getHub();
    const ep = ease(state.progress);
    const rInner = HUB_R + SEG_INNER;
    const rOuter = rInner + SEG_OUTER * ep;
    const dx = mx - hub.x, dy = my - hub.y;
    const r = Math.sqrt(dx*dx + dy*dy);
    if (r < rInner - 10 || r > rOuter + 15) return -1;
    const angle = Math.atan2(dy, dx);
    const halfSeg = ((SEG_DEG / 2) + 1) * Math.PI / 180;
    for (let i = 0; i < ITEMS.length; i++) {
      let d = angle - itemAngle(i);
      while (d > Math.PI) d -= 2*Math.PI;
      while (d < -Math.PI) d += 2*Math.PI;
      if (Math.abs(d) <= halfSeg) return i;
    }
    return -1;
  }

  return { draw, resize, startAnim, hitTest };
}
