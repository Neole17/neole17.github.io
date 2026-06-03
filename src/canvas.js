import { ITEMS, HUB_R, SEG_INNER, SEG_OUTER, ANGLE_SPREAD, GAP_DEG } from '../core/config.js';
import { ease, polarToCart } from '../core/utils.js';
import { itemAngle, SHARD_SHAPES } from './shards.js';

const SEG_DEG = (ANGLE_SPREAD / ITEMS.length) - GAP_DEG;

export function createCanvas(root, canvas, state) {
  const ctx = canvas.getContext('2d');

  function getHub() {
    return { x: -HUB_R + 18, y: root.offsetHeight / 2 };
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
      ctx.moveTo(hub.x + (HUB_R - 10) * Math.cos(ta), hub.y + (HUB_R - 10) * Math.sin(ta));
      ctx.lineTo(hub.x + (HUB_R -  4) * Math.cos(ta), hub.y + (HUB_R -  4) * Math.sin(ta));
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
        isActive ? `rgba(160,50,0,${.72 + ep * .15})` : `rgba(0,40,120,${.62 + ep * .1})`,
        isActive ? 'rgba(255,130,60,.9)' : 'rgba(70,170,255,.55)',
        isActive ? 2 : 1);
      ctx.globalAlpha = ep * (isActive ? .6 : .32);
      drawPoly(hub, sh.hlPts, ep,
        isActive ? 'rgba(255,220,180,.65)' : 'rgba(180,230,255,.55)', '', 0);
      ctx.globalAlpha = ep * .25;
      const cs = sh.crackPts.map(p => polarToCart(hub, rI + (p.r - rI) * ep, p.a));
      if (cs.length >= 2) {
        ctx.beginPath(); ctx.moveTo(cs[0].x, cs[0].y);
        for (let k = 1; k < cs.length; k++) ctx.lineTo(cs[k].x, cs[k].y);
        ctx.strokeStyle = isActive ? 'rgba(255,200,160,.5)' : 'rgba(140,200,255,.4)';
        ctx.lineWidth = .8; ctx.stroke();
      }
      ctx.restore();

      if (ep > .4) {
        const la   = Math.min(1, (ep - .4) / .3);
        const midR = rI + (rO - rI) * .5;
        ctx.save(); ctx.globalAlpha = la;
        ctx.font         = `700 ${isActive ? 14 : 12}px Orbitron, sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle    = isActive ? '#fff' : 'rgba(160,220,255,.9)';
        if (isActive) { ctx.shadowColor = 'rgba(255,140,60,.9)'; ctx.shadowBlur = 12; }
        ctx.fillText(label, hub.x + midR * Math.cos(angle), hub.y + midR * Math.sin(angle));
        ctx.restore();
      }

      if (isActive && ep > .75) {
        const aa = (ep - .75) / .25;
        ctx.save(); ctx.globalAlpha = aa; ctx.fillStyle = '#ff9060';
        ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('▶', hub.x + (rO + 14) * Math.cos(angle), hub.y + (rO + 14) * Math.sin(angle));
        ctx.restore();
      }
    });
  }

  // ── Background image drawing ──────────────────────────────────────────────
  // bgImage is an HTMLImageElement set via loadBgImage() below.
  // It is drawn to fill the canvas before everything else.
  let bgImage = null;

  function drawBackground(W, H) {
    if (bgImage && bgImage.complete) {
      // cover-fit: scale the image so it fills the canvas, cropping if needed
      const scale = Math.max(W / bgImage.naturalWidth, H / bgImage.naturalHeight);
      const dw    = bgImage.naturalWidth  * scale;
      const dh    = bgImage.naturalHeight * scale;
      const dx    = (W - dw) / 2;
      const dy    = (H - dh) / 2;
      ctx.drawImage(bgImage, dx, dy, dw, dh);
    } else {
      // fallback: gradient
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0,   '#020818');
      bg.addColorStop(.4,  '#041040');
      bg.addColorStop(.7,  '#0a2060');
      bg.addColorStop(1,   '#0d3080');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }
  }

  // ── Public: load a background image by URL ───────────────────────────────
  // Usage: renderer.loadBgImage('/assets/images/mybackground.jpg')
  // Or swap at runtime: renderer.loadBgImage(newUrl)
  function loadBgImage(src) {
    const img = new Image();
    img.onload  = () => { bgImage = img; draw(); };
    img.onerror = () => { console.warn('Could not load image:', src); bgImage = null; draw(); };
    img.src = src;
  }

  // Clear the background image and fall back to the gradient
  function clearBgImage() {
    bgImage = null;
    draw();
  }

  // ── Master draw ─────────────────────────────────────────────────────────────
  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const hub    = getHub();
    const menuEp = ease(state.progress);

    drawBackground(W, H);
    if (menuEp > 0)       drawHub(hub, menuEp);
    if (state.progress > .005) drawMenuShards(hub, menuEp);
  }

  function resize() {
    canvas.width  = root.offsetWidth;
    canvas.height = root.offsetHeight;
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
    const dx      = mx - hub.x, dy = my - hub.y;
    const r       = Math.sqrt(dx * dx + dy * dy);
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

  return { draw, resize, startAnim, hitTest, loadBgImage, clearBgImage };
}
