import { ITEMS, HUB_R, SEG_INNER, SEG_OUTER } from './config.js';
import { createClock } from './clock.js';
import { createMenu } from './menu.js';
import { createCanvas } from './canvas.js';

const root    = document.getElementById('main-root');
const canvas  = document.getElementById('radial-canvas');
const trigger = document.getElementById('triggerZone');
if (!root || !canvas) throw new Error('Required DOM elements not found');

// Shared state object — single source of truth
const state = {
  menuOpen:       false,
  progress:       0,
  targetProgress: 0,
  activeIdx:      0,
  count:          ITEMS.length,
  rafId:          null,
};

// --- Systems ---
createClock('dateDisplay');

const renderer = createCanvas(root, canvas, state);

const menu = createMenu(state, {
  onOpen:     () => renderer.startAnim(),
  onClose:    () => renderer.startAnim(),
  onNavigate: () => renderer.draw(),
});

// --- Resize ---
new ResizeObserver(renderer.resize).observe(root);
renderer.resize();

// --- Events ---
root.addEventListener('mousemove', e => {
  const rect = root.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (mx < 40 && !state.menuOpen) {
    menu.open();
    return;
  }

  if (state.menuOpen) {
    const hit = renderer.hitTest(mx, my);
    if (hit >= 0 && hit !== state.activeIdx) {
      state.activeIdx = hit;
      renderer.draw();
    }
    if (mx > HUB_R + SEG_INNER + SEG_OUTER + 60) {
      menu.close();
    }
  }
});

root.addEventListener('mouseleave', () => {
  if (state.menuOpen) menu.close();
});

canvas.style.pointerEvents = 'auto';
canvas.addEventListener('click', e => {
  if (!state.menuOpen) return;
  const rect = root.getBoundingClientRect();
  const hit = renderer.hitTest(e.clientX - rect.left, e.clientY - rect.top);
  if (hit >= 0) {
    state.activeIdx = hit;
    renderer.draw();
    // TODO: navigate to section based on ITEMS[hit]
  }
});

trigger.addEventListener('click', () => menu.toggle());

document.addEventListener('keydown', e => {
  if (e.key === 'Tab') { e.preventDefault(); menu.toggle(); }
  if (state.menuOpen) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') menu.navigateDown();
    if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  menu.navigateUp();
    if (e.key === 'Escape') menu.close();
  }
});
