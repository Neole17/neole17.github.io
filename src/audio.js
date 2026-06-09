// ── Ambient audio ─────────────────────────────────────────────────────────────
// Drop your audio files in /assets/audio/
// Each page calls initAudio() on load — picks a random track and plays it softly.

const TRACKS = [
  { src: './assets/audio/Beneath the Mask.mp3',  title: 'Beneath the Mask', credits: 'Shoji Meguro / Lyn Inaizumi' },
  { src: './assets/audio/Clair De Lune.mp3',     title: 'Clair De Lune',    credits: 'Claude Debussy' },
  { src: './assets/audio/Luv Letter.mp3',        title: 'Luv Letter',       credits: 'DJ OKAWARI' },
  { src: './assets/audio/Royal Days.mp3',        title: 'Royal Days',       credits: 'Shoji Meguro' },
  { src: './assets/audio/Burning Vow.mp3',       title: 'Burning Vow',      credits: 'Ringo / 芝麻Mochi' },
  { src: './assets/audio/Korok Forest.mp3',      title: 'Korok Forest',     credits: 'Manaka Kataoka' },
  { src: './assets/audio/Great Plateau.mp3',     title: 'Great Plateau',    credits: 'Manaka Kataoka / Hajime Wakai' },
];

export function initAudio(theme) {
  // theme: 'dark' (home) or 'light' (other pages)
  const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];

  const audio = new Audio(track.src);
  audio.loop   = true;
  audio.volume = 0.18;

  // Create ticker element
  const ticker = document.createElement('div');
  ticker.id = 'now-playing';
  ticker.style.cssText = [
    'position:fixed', 'bottom:14px', 'left:16px', 'z-index:9000',
    'display:flex', 'align-items:center', 'gap:8px',
    'pointer-events:none', 'max-width:320px', 'overflow:hidden',
  ].join(';');

  // Equalizer icon
  const icon = document.createElement('div');
  icon.style.cssText = 'flex-shrink:0;display:flex;align-items:flex-end;gap:1.5px;height:12px;';
  const barHeights = [4, 10, 6, 8];
  const delays     = [0, 0.15, 0.3, 0.1];
  barHeights.forEach(function(h, i) {
    const b = document.createElement('span');
    b.style.cssText = [
      'display:block', 'width:2px', 'height:' + h + 'px',
      'background:' + (theme === 'dark' ? 'rgba(100,200,255,0.5)' : 'rgba(0,0,0,0.25)'),
      'animation:npEq 0.8s ease-in-out infinite alternate',
      'animation-delay:' + delays[i] + 's',
    ].join(';');
    icon.appendChild(b);
  });

  // Inject keyframes once
  if (!document.getElementById('np-style')) {
    const st = document.createElement('style');
    st.id = 'np-style';
    st.textContent = '@keyframes npEq{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}';
    document.head.appendChild(st);
  }

  // Scroll wrap + text
  const wrap = document.createElement('div');
  wrap.style.cssText = 'overflow:hidden;white-space:nowrap;flex:1;';

  const label = 'Now Playing: ' + track.title + '  —  ' + track.credits + '\u2003\u2003\u2003\u2003';
  const txt = document.createElement('span');
  txt.style.cssText = [
    'display:inline-block',
    'font-family:Orbitron,sans-serif',
    'font-size:9px', 'letter-spacing:2px', 'white-space:nowrap',
    'color:' + (theme === 'dark' ? 'rgba(100,200,255,0.45)' : 'rgba(0,0,0,0.28)'),
  ].join(';');
  txt.textContent = label + label; // duplicate for seamless loop

  wrap.appendChild(txt);
  ticker.appendChild(icon);
  ticker.appendChild(wrap);
  document.body.appendChild(ticker);

  // Scroll animation
  let x = 0, raf = null;
  function scroll() {
    x -= 0.38;
    const half = txt.scrollWidth / 2;
    if (Math.abs(x) >= half) x = 0;
    txt.style.transform = 'translateX(' + x + 'px)';
    raf = requestAnimationFrame(scroll);
  }
  scroll();

  // Start on first click (browser autoplay policy)
  function start() {
    audio.play().catch(function(){});
    document.removeEventListener('click', start, true);
    document.removeEventListener('keydown', start, true);
  }
  document.addEventListener('click',   start, true);
  document.addEventListener('keydown', start, true);
}