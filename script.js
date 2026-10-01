(() => {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* ---------- Hero plot: 90 students, scattered or grouped by risk ---------- */
  const canvas = document.getElementById('plot');
  const ctx = canvas.getContext('2d');
  const btn = document.getElementById('toggle');
  const N = 90;
  let W = 0, H = 0, grouped = false, mouse = { x: -999, y: -999 };
  let pts = [];

  const rand = (a, b) => a + Math.random() * (b - a);
  const level = i => (i < 40 ? 0 : i < 68 ? 1 : 2); // 0 low, 1 medium, 2 high

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setTargets();
  }

  function setTargets() {
    const cx = [W * 0.2, W * 0.5, W * 0.8];
    pts.forEach(p => {
      p.gx = cx[p.lv] + rand(-W * 0.09, W * 0.09);
      p.gy = H * 0.5 + rand(-H * 0.3, H * 0.3);
    });
    if (reduce) pts.forEach(p => { p.x = grouped ? p.gx : p.sx * W; p.y = grouped ? p.gy : p.sy * H; });
  }

  function init() {
    pts = Array.from({ length: N }, (_, i) => ({
      lv: level(i), sx: rand(.06, .94), sy: rand(.08, .92),
      x: W / 2, y: H / 2, vx: 0, vy: 0, r: rand(4, 7), ph: rand(0, 6.28)
    }));
    resize();
    pts.forEach(p => { p.x = p.sx * W; p.y = p.sy * H; });
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const cols = [css('--low'), css('--mid'), css('--high')];
    ctx.strokeStyle = css('--line'); ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 4; i++) { ctx.moveTo(0, H * i / 4); ctx.lineTo(W, H * i / 4); }
    ctx.stroke();

    pts.forEach(p => {
      const bob = reduce ? 0 : Math.sin(t / 900 + p.ph) * 4;
      const tx = grouped ? p.gx : p.sx * W;
      const ty = (grouped ? p.gy : p.sy * H) + bob;
      p.vx += (tx - p.x) * 0.045; p.vy += (ty - p.y) * 0.045;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 70 && d > 0) { p.vx += dx / d * 1.6; p.vy += dy / d * 1.6; }
      p.vx *= 0.8; p.vy *= 0.8;
      p.x += p.vx; p.y += p.vy;
      ctx.fillStyle = grouped ? cols[p.lv] : css('--muted');
      ctx.globalAlpha = grouped ? 1 : 0.55;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (!reduce) requestAnimationFrame(draw);
  }

  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });

  btn.addEventListener('click', () => {
    grouped = !grouped;
    btn.textContent = grouped ? 'Scatter' : 'Group';
    btn.setAttribute('aria-pressed', grouped);
    if (reduce) { setTargets(); draw(0); }
  });

  init();
  requestAnimationFrame(draw);
  window.addEventListener('resize', () => { resize(); if (reduce) draw(0); });
  // Sort the students once, shortly after load, as the page's one big moment
  if (!reduce) setTimeout(() => btn.click(), 1600);

  /* ---------- Risk estimate demo ---------- */
  const $ = id => document.getElementById(id);
  const att = $('att'), mrk = $('mrk'), asg = $('asg');
  function estimate() {
    $('o-att').textContent = att.value + '%';
    $('o-mrk').textContent = mrk.value + '%';
    $('o-asg').textContent = asg.value + '%';
    const strength = 0.4 * att.value + 0.4 * mrk.value + 0.2 * asg.value;
    const risk = Math.max(0, Math.min(100, Math.round((100 - strength) * 1.4 - 12)));
    const [label, color] = risk < 25 ? ['Low risk', '--low'] : risk < 50 ? ['Medium risk', '--mid'] : ['High risk', '--high'];
    $('fill').style.width = Math.max(risk, 4) + '%';
    $('fill').style.background = css(color);
    $('verdict').textContent = `${label}: ${risk}%`;
  }
  [att, mrk, asg].forEach(el => el.addEventListener('input', estimate));
  estimate();

  /* ---------- Highlight current section in the nav ---------- */
  const links = [...document.querySelectorAll('nav a')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) io.observe(s); });
  }
})();
