const HOUR_NAMES = [
  'Hour',      'Hour',    'Hour',     'Hour',
  'Hour',      'Hour',     'Hour',      'Hour',
  'Hour',    'Hour',     'Hour', 'Hour',
  'Hour',    'Hour',   'Hour',      'Hour',
  'Hour',    'Hour',   'Hour',      'Hour',
  'Hour',      'Hour',    'Hour','Hour',
];

export function initClock() {
  // Create the element in JS so index.html stays clean
  const el = document.createElement('div');
  el.id = 'dateDisplay';
  document.getElementById('main-root').appendChild(el);

  function update() {
    const now  = new Date();
    const hh   = String(now.getHours()).padStart(2, '0');
    const mm   = String(now.getMinutes()).padStart(2, '0');
    const name = HOUR_NAMES[now.getHours()];
    el.innerHTML = `${name}<br>${hh}:${mm}`;
  }

  update();
  setInterval(update, 30_000);
}