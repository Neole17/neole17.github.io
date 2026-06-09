import { initAudio } from './audio.js';
import { createCanvas } from './canvas.js';
import { initClock }    from './clock.js';

const root    = document.getElementById('main-root');
const canvas  = document.getElementById('Neole17');
const trigger = document.getElementById('triggerZone');
if (!root || !canvas) throw new Error('Missing required DOM elements');

// ── Clock (creates its own DOM element) ───────────────────────────────────────
initClock();
initAudio();

// ── Shared state ──────────────────────────────────────────────────────────────
const state = {
  menuOpen:       false,
  progress:       0,
  targetProgress: 0,
  activeIdx:      0,
  count:          3,
  rafId:          null,
};

// ── Renderer ──────────────────────────────────────────────────────────────────
const renderer = createCanvas(root, canvas, state);


renderer.resize();
window.addEventListener('resize', () => renderer.resize());

renderer.loadBgImage('./assets/images/sitebg_shatter.png');

// ── Menu helpers ──────────────────────────────────────────────────────────────
const HUB_R = 52, SEG_INNER = 14, SEG_OUTER = 150;

function openMenu() {
  if (state.menuOpen) return;
  state.menuOpen       = true;
  state.targetProgress = 1;
  renderer.startAnim();
}

function closeMenu() {
  if (!state.menuOpen) return;
  state.menuOpen       = false;
  state.targetProgress = 0;
  renderer.startAnim();
}

function toggleMenu() { state.menuOpen ? closeMenu() : openMenu(); }

// ── Events ────────────────────────────────────────────────────────────────────
root.addEventListener('mousemove', e => {
  const rect = root.getBoundingClientRect();
  const mx   = e.clientX - rect.left;
  const my   = e.clientY - rect.top;

  if (mx < 40 && !state.menuOpen) { openMenu(); return; }

  if (state.menuOpen) {
    const hit = renderer.hitTest(mx, my);
    if (hit >= 0 && hit !== state.activeIdx) {
      state.activeIdx = hit;
      renderer.draw();
    }
    if (mx > HUB_R + SEG_INNER + SEG_OUTER + 70) closeMenu();
  }
});

root.addEventListener('mouseleave', () => { if (state.menuOpen) closeMenu(); });

canvas.style.pointerEvents = 'auto';
canvas.addEventListener('click', e => {
  if (!state.menuOpen) return;
  const rect = root.getBoundingClientRect();
  const hit  = renderer.hitTest(e.clientX - rect.left, e.clientY - rect.top);
  if (hit >= 0) {
    state.activeIdx = hit;
    renderer.draw();
    const pages = ['./portfolio.html', './about.html', './contact.html'];
    if (pages[hit]) window.location.href = pages[hit];
  }
});

trigger.addEventListener('click', toggleMenu);

document.addEventListener('keydown', e => {
  if (e.key === 'Tab') { e.preventDefault(); toggleMenu(); }
  if (state.menuOpen) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      state.activeIdx = (state.activeIdx + 1) % state.count;
      renderer.draw();
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      state.activeIdx = (state.activeIdx - 1 + state.count) % state.count;
      renderer.draw();
    }
    if (e.key === 'Escape') closeMenu();
  }
});