const TRACKS = [
  { src: './assets/audio/Beneath the Mask.mp3',  title: 'Beneath the Mask', credits: 'Shoji Meguro / Lyn Inaizumi' },
  { src: './assets/audio/Clair De Lune.mp3',     title: 'Clair De Lune',    credits: 'Claude Debussy' },
  { src: './assets/audio/Luv Letter.mp3',        title: 'Luv Letter',       credits: 'DJ OKAWARI' },
  { src: './assets/audio/Royal Days.mp3',        title: 'Royal Days',       credits: 'Shoji Meguro' },
  { src: './assets/audio/Burning Vow.mp3',       title: 'Burning Vow',      credits: 'Ringo / 芝麻Mochi' },
  { src: './assets/audio/Korok Forest.mp3',      title: 'Korok Forest',     credits: 'Manaka Kataoka' },
  { src: './assets/audio/Great Plateau.mp3',     title: 'Great Plateau',    credits: 'Manaka Kataoka / Hajime Wakai' },
];

// theme: 'dark' = blue text (home page), 'light' = dark text (white pages)
export function initAudio(theme) {
  const isDark = theme !== 'light';
  const track  = TRACKS[Math.floor(Math.random() * TRACKS.length)];
  const color  = isDark ? 'rgba(100,200,255,0.45)' : 'rgba(0,0,0,0.28)';
  const barCol = isDark ? 'rgba(100,200,255,0.5)'  : 'rgba(0,0,0,0.25)';

  // ── Inject keyframes ──────────────────────────────────────────────────────
  if (!document.getElementById('np-style')) {
    const st = document.createElement('style');
    st.id = 'np-style';
    st.textContent = '@keyframes npEq{from{transform:scaleY(0.3)}to{transform:scaleY(1)}}';
    document.head.appendChild(st);
  }

  // ── Build ticker DOM ──────────────────────────────────────────────────────
  const ticker = document.createElement('div');
  ticker.style.cssText =
    'position:fixed;bottom:14px;left:50%;transform:translateX(-50%);z-index:9000;' +
    'display:flex;align-items:center;gap:8px;' +
    'pointer-events:none;max-width:400px;overflow:hidden;';

  // equalizer bars
  const icon = document.createElement('div');
  icon.style.cssText = 'flex-shrink:0;display:flex;align-items:flex-end;gap:1.5px;height:12px;';
  [4,10,6,8].forEach(function(h, i) {
    const b = document.createElement('span');
    b.style.cssText =
      'display:block;width:2px;height:'+h+'px;background:'+barCol+';' +
      'animation:npEq 0.8s ease-in-out infinite alternate;' +
      'animation-delay:'+[0,0.15,0.3,0.1][i]+'s;';
    icon.appendChild(b);
  });

  // scroll wrap
  const wrap = document.createElement('div');
  wrap.style.cssText = 'overflow:hidden;white-space:nowrap;flex:1;min-width:0;';

  const label = 'Now Playing: ' + track.title + '  \u2014  ' + track.credits;
  // pad with spaces so the seam isn't obvious
  const gap   = '\u2003\u2003\u2003\u2003\u2003';
  const txt   = document.createElement('span');
  txt.style.cssText =
    'display:inline-block;font-family:Orbitron,sans-serif;' +
    'font-size:9px;letter-spacing:2px;white-space:nowrap;color:'+color+';';
  // set content once, measure after layout
  txt.textContent = label + gap + label + gap;

  wrap.appendChild(txt);
  ticker.appendChild(icon);
  ticker.appendChild(wrap);
  document.body.appendChild(ticker);

  // ── Scroll — wait one frame so scrollWidth is real ────────────────────────
  let x = 0;
  requestAnimationFrame(function() {
    // scrollWidth should now be accurate
    const half = txt.scrollWidth * 5;

    function scroll() {
      x -= 0.38;
      if (Math.abs(x) >= half) x = 0;
      txt.style.transform = 'translateX(' + x + 'px)';
      requestAnimationFrame(scroll);
    }
    scroll();
  });

  // ── Audio — start on first user interaction ───────────────────────────────
  const audio  = new Audio(track.src);
  audio.loop   = true;
  audio.volume = 0.18;

  function start() {
    audio.play().catch(function(){});
    document.removeEventListener('click',   start, true);
    document.removeEventListener('keydown', start, true);
    document.removeEventListener('mousemove', start, true);
  }
  // mousemove catches the very first cursor movement — no click needed
  document.addEventListener('click',     start, true);
  document.addEventListener('keydown',   start, true);
  document.addEventListener('mousemove', start, true);
}