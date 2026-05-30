import { hourNames } from './config.js';
import { formatTime } from './utils.js';

export function createClock(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  function update() {
    const now = new Date();
    const { hh, mm } = formatTime(now);
    const label = hourNames[now.getHours()] ?? 'Dark Hour';
    el.innerHTML = `${label}<br>${hh}:${mm}`;
  }

  update();
  setInterval(update, 30000);
}
