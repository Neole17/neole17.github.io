// Constants
const ITEMS        = ['PORTFOLIO', 'ABOUT', 'CONTACT'];
const HUB_R        = 52;
const SEG_INNER    = 14;
const SEG_OUTER    = 260;
const ANGLE_SPREAD = 80;
const GAP_DEG      = 5;
const SEG_DEG      = (ANGLE_SPREAD / ITEMS.length) - GAP_DEG;

function ease(t) {
  return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3) / 2;
}

function polarToCart(hub, r, a) {
  return { x: hub.x + r * Math.cos(a), y: hub.y + r * Math.sin(a) };
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function itemAngle(i) {
  const start = -ANGLE_SPREAD / 2;
  const step  = ANGLE_SPREAD / ITEMS.length;
  return (start + step * i + step / 2) * Math.PI / 180;
}

function buildShardShape(i) {
  const rng     = mulberry32(i * 9999 + 1234);
  const angle   = itemAngle(i);
  const halfSeg = (SEG_DEG / 2) * Math.PI / 180;
  const a1 = angle - halfSeg, a2 = angle + halfSeg;
  const pts = [], rI = HUB_R + SEG_INNER, rO = rI + SEG_OUTER;

  for (let s = 0; s <= 4; s++) {
    const t = s / 4, r = rI + (rO - rI) * t;
    pts.push({ r: r + (rng()-.5)*18, a: a1 + (rng()-.5)*.06 });
  }
  for (let s = 0; s <= 6; s++) {
    const t = s / 6, a = a1 + (a2-a1)*t;
    pts.push({ r: rO + (rng()-.5)*22, a: a + (rng()-.5)*.04 });
  }
  for (let s = 0; s <= 4; s++) {
    const t = s / 4, r = rO + (rI-rO)*t;
    pts.push({ r: r + (rng()-.5)*18, a: a2 + (rng()-.5)*.06 });
  }
  for (let s = 0; s <= 6; s++) {
    const t = s / 6, a = a2 + (a1-a2)*t;
    pts.push({ r: rI + (rng()-.5)*12, a: a + (rng()-.5)*.04 });
  }

  const hlPts = [
    { r: rI + 6,             a: a1 + .01 },
    { r: rI + 32 + rng()*16, a: a1 + .01 },
    { r: rI + 18 + rng()*12, a: a1 + (a2-a1)*.35 },
    { r: rI + 7,             a: a1 + (a2-a1)*.3 },
  ];

  const crackPts = [
    { r: rI + (rO-rI)*.3 + (rng()-.5)*10, a: angle + (rng()-.5)*halfSeg*.6 },
    { r: rI + (rO-rI)*.7 + (rng()-.5)*10, a: angle + (rng()-.5)*halfSeg*.4 },
    { r: rO - rng()*20,                    a: angle + (rng()-.5)*halfSeg*.8 },
  ];

  return { pts, hlPts, crackPts };
}

const SHARD_SHAPES = ITEMS.map((_, i) => buildShardShape(i));

export function createCanvas(root, canvas, state) {
  const ctx = canvas.getContext('2d');
  let bgImage = null;
  let canvasW = 0, canvasH = 0;

  function getHub() {
    return { x: -HUB_R + 18, y: canvasH / 2 };
  }

  function drawPoly(hub, pts, ep, fill, stroke, lw) {
    if (pts.length < 3) return;
    const rI = HUB_R + SEG_INNER;
    const sp = pts.map(p => {
      const sr = rI + (p.r - rI) * ep;
      return polarToCart(hub, sr, p.a);
    });
    ctx.beginPath();
    ctx.moveTo(sp[0].x, sp[0].y);
    for (let k = 1; k < sp.length; k++) ctx.lineTo(sp[k].x, sp[k].y);
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (lw > 0) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }

  function drawBackground() {
    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
      const scale = Math.max(canvasW / bgImage.naturalWidth, canvasH / bgImage.naturalHeight);
      const dw = bgImage.naturalWidth  * scale;
      const dh = bgImage.naturalHeight * scale;
      const dx = (canvasW - dw) / 2;
      const dy = (canvasH - dh) / 2;
      ctx.drawImage(bgImage, dx, dy, dw, dh);
    } else {
      const bg = ctx.createLinearGradient(0, 0, canvasW, canvasH);
      bg.addColorStop(0,  '#020818');
      bg.addColorStop(.4, '#041040');
      bg.addColorStop(.7, '#0a2060');
      bg.addColorStop(1,  '#0d3080');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }
  }

  function drawHub(hub, ep) {
    ctx.save(); ctx.globalAlpha = Math.min(1, ep * 1.5);
    ctx.beginPath(); ctx.arc(hub.x, hub.y, HUB_R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(80,180,255,.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(hub.x, hub.y, HUB_R - 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,30,90,.7)'; ctx.fill();
    ctx.beginPath(); ctx.arc(hub.x, hub.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100,200,255,.8)'; ctx.fill();
    for (let t = 0; t < 12; t++) {
      const ta = (t / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(hub.x + (HUB_R-10)*Math.cos(ta), hub.y + (HUB_R-10)*Math.sin(ta));
      ctx.lineTo(hub.x + (HUB_R- 4)*Math.cos(ta), hub.y + (HUB_R- 4)*Math.sin(ta));
      ctx.strokeStyle = 'rgba(100,200,255,.3)'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();
  }

  function drawMenuShards(hub, ep) {
    ITEMS.forEach((label, i) => {
      const isActive = i === state.activeIdx;
      const sh       = SHARD_SHAPES[i];
      const angle    = itemAngle(i);
      const rI       = HUB_R + SEG_INNER;
      const rO       = rI + SEG_OUTER * ep;

      ctx.save();
      drawPoly(hub, sh.pts, ep,
      isActive ? `rgba(255,255,255,${.22+ep*.08})` : `rgba(0,40,120,${.62+ep*.1})`,
      isActive ? 'rgba(255,255,255,.95)' : 'rgba(70,170,255,.55)',
      isActive ? 2 : 1);
      ctx.globalAlpha = ep * (isActive ? .6 : .32);
      drawPoly(hub, sh.hlPts, ep,
      isActive ? 'rgba(255,255,255,.55)' : 'rgba(180,230,255,.55)', '', 0);
      ctx.globalAlpha = ep * .25;
      const cs = sh.crackPts.map(p => polarToCart(hub, rI + (p.r-rI)*ep, p.a));
      if (cs.length >= 2) {
        ctx.beginPath(); ctx.moveTo(cs[0].x, cs[0].y);
        for (let k = 1; k < cs.length; k++) ctx.lineTo(cs[k].x, cs[k].y);
        ctx.strokeStyle = isActive ? 'rgba(189, 194, 196, 0.5)' : 'rgba(140,200,255,.4)';
        ctx.lineWidth = .8; ctx.stroke();
      }
      ctx.restore();

      if (ep > .4) {
        const la   = Math.min(1, (ep-.4)/.3);
        const midR = rI + (rO-rI) * .5;
        ctx.save(); ctx.globalAlpha = la;
        ctx.font         = `700 ${isActive ? 14 : 12}px Orbitron, sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = isActive ? '#fff' : 'rgba(160,220,255,.9)';
      if (isActive) {
        ctx.shadowColor = 'rgba(255,255,255,.9)';
        ctx.shadowBlur = 14;
      }
        ctx.fillText(label, hub.x + midR*Math.cos(angle), hub.y + midR*Math.sin(angle));
        ctx.restore();
      }

      if (isActive && ep > .75) {
        const aa = (ep-.75)/.25;
        ctx.save(); ctx.globalAlpha = aa; ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('▶', hub.x + (rO+14)*Math.cos(angle), hub.y + (rO+14)*Math.sin(angle));
        ctx.restore();
      }
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvasW, canvasH);
    const hub    = getHub();
    const menuEp = ease(state.progress);
    drawBackground();
    if (menuEp > 0)            drawHub(hub, menuEp);
    if (state.progress > .005) drawMenuShards(hub, menuEp);
  }

  // Only resize when dimensions actually change; never called from draw()
  function resize() {
    const w = root.offsetWidth;
    const h = root.offsetHeight;
    if (w === canvasW && h === canvasH) return;
    canvasW = w;
    canvasH = h;
    canvas.width  = w;
    canvas.height = h;
    draw();
  }

  function animate() {
    const diff = state.targetProgress - state.progress;
    if (Math.abs(diff) < .004) {
      state.progress = state.targetProgress;
      draw(); state.rafId = null; return;
    }
    state.progress += diff * .18;
    draw();
    state.rafId = requestAnimationFrame(animate);
  }

  function startAnim() {
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(animate);
  }

  function hitTest(mx, my) {
    const hub     = getHub();
    const ep      = ease(state.progress);
    const rI      = HUB_R + SEG_INNER;
    const rO      = rI + SEG_OUTER * ep;
    const dx = mx - hub.x, dy = my - hub.y;
    const r  = Math.sqrt(dx*dx + dy*dy);
    if (r < rI - 10 || r > rO + 15) return -1;
    const angle   = Math.atan2(dy, dx);
    const segHalf = ((SEG_DEG / 2) + 1) * Math.PI / 180;
    for (let i = 0; i < ITEMS.length; i++) {
      let d = angle - itemAngle(i);
      while (d >  Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      if (Math.abs(d) <= segHalf) return i;
    }
    return -1;
  }

  function loadBgImage(src) {
    const img = new Image();
    img.onload  = () => { bgImage = img; draw(); };
    img.onerror = () => { console.warn('Could not load image:', src); };
    img.src = src;
  }

  function clearBgImage() { bgImage = null; draw(); }

  return { draw, resize, startAnim, hitTest, loadBgImage, clearBgImage };
}