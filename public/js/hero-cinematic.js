(() => {
  const segments = [
    { start: 0.0, text: 'Every story has a moment that makes you stop and listen.' },
    { start: 5.0, text: 'It might be a whisper in the dark.' },
    { start: 9.2, text: 'It might be the excitement in someone’s voice when they finally say, “We did it.”' },
    { start: 16.2, text: 'It might be the pause before the words that change everything.' },
    { start: 21.6, text: 'And sometimes... it’s just a few simple words, spoken exactly the way they should be.' },
    { start: 29.2, text: 'That’s when voice becomes more than sound. It becomes a feeling.' },
    { start: 34.2, text: 'Welcome to SvaraONE.' },
    { start: 36.7, text: 'Intelligent performance orchestration for natural, expressive voice.' },
    { start: 40.3, text: 'I am. Svara. ONE.' }
  ];
  const referenceDuration = 44.5;

  const style = document.createElement('style');
  style.textContent = `
    .hero-card{position:relative;overflow:hidden;isolation:isolate}
    .hero-card > *:not(.hero-cosmos){position:relative;z-index:2}
    .hero-cosmos{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.62;transition:opacity .8s ease}
    .hero-cosmos canvas{display:block;width:100%;height:100%}
    .hero-card.is-hero-playing .hero-cosmos{opacity:.9}
    .hero-script{min-height:118px;margin:25px 0;color:#dbe8f5;display:flex;align-items:center}
    .hero-script-line{font-size:20px;line-height:1.55;transition:opacity .45s ease,transform .45s ease,color .45s ease;text-shadow:0 1px 16px #0008}
    .hero-script-line.is-active{color:#f2fbff;transform:translateY(0);opacity:1}
    .hero-script-line.is-idle{opacity:.9}
    .hero-script-line .brand-svara,.hero-script-line .brand-one{font-weight:inherit}
    .hero-card .card-top,.hero-card .voice-row,.hero-card .player{position:relative;z-index:3}
    @media(max-width:650px){.hero-script{min-height:150px}.hero-script-line{font-size:18px}}
    @media(prefers-reduced-motion:reduce){.hero-cosmos{opacity:.35}.hero-script-line{transition:none}}
  `;
  document.head.appendChild(style);

  function createCosmos(card) {
    const layer = document.createElement('div');
    layer.className = 'hero-cosmos';
    const canvas = document.createElement('canvas');
    layer.appendChild(canvas);
    card.prepend(layer);

    const ctx = canvas.getContext('2d');
    const stars = [];
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let width = 0, height = 0, dpr = 1, raf = 0, playing = false, last = performance.now();

    function resize() {
      const rect = card.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(48, Math.min(95, Math.round(width * height / 6200)));
      while (stars.length < count) stars.push(makeStar(true));
      while (stars.length > count) stars.pop();
    }

    function makeStar(initial = false) {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.15 + .2,
        alpha: Math.random() * .55 + .18,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * .22 + .04,
        drift: (Math.random() - .5) * .055,
        twinkle: Math.random() * .7 + .25,
        initial
      };
    }

    function draw(now) {
      const dt = Math.min(40, now - last) / 16.67;
      last = now;
      ctx.clearRect(0, 0, width, height);

      const glow = playing ? 1 : .65;
      const cx = width * .77;
      const cy = height * .53;
      const radius = Math.min(width, height) * .16;

      const bg = ctx.createRadialGradient(cx, cy, radius * .3, cx, cy, radius * 3.1);
      bg.addColorStop(0, `rgba(70,190,255,${.035 * glow})`);
      bg.addColorStop(.48, `rgba(25,220,190,${.022 * glow})`);
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      for (const star of stars) {
        if (!reduced && playing) {
          star.x += star.drift * dt;
          star.y += star.speed * .018 * dt;
          if (star.y > height + 3) star.y = -3;
          if (star.x < -3) star.x = width + 3;
          if (star.x > width + 3) star.x = -3;
        }
        const twinkle = .72 + Math.sin(now * .001 * star.twinkle + star.phase) * .28;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,238,255,${Math.max(.08, star.alpha * twinkle * glow)})`;
        ctx.fill();
      }

      // Subtle eclipse: distant glow, dark disc, and a thin halo.
      const halo = ctx.createRadialGradient(cx, cy, radius * .86, cx, cy, radius * 1.65);
      halo.addColorStop(0, `rgba(255,225,180,${.12 * glow})`);
      halo.addColorStop(.35, `rgba(255,190,120,${.07 * glow})`);
      halo.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2,9,18,.96)';
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(255,224,184,${.18 * glow})`;
      ctx.stroke();

      if (!reduced || playing) raf = requestAnimationFrame(draw);
    }

    const start = () => { playing = true; if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); } };
    const stop = () => { playing = false; if (!raf && !reduced) raf = requestAnimationFrame(draw); };
    resize();
    if (reduced) draw(performance.now()); else raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize, { passive: true });
    return { start, stop };
  }

  function setup() {
    const card = document.querySelector('.hero-card');
    if (!card) return;
    const oldQuote = card.querySelector('.quote');
    const player = card.querySelector('.player');
    if (!oldQuote || !player || card.querySelector('.hero-cosmos')) return;

    const script = document.createElement('div');
    script.className = 'hero-script';
    const line = document.createElement('div');
    line.className = 'hero-script-line is-idle';
    script.appendChild(line);
    oldQuote.replaceWith(script);

    const cosmos = createCosmos(card);
    let scale = 1;
    let activeIndex = -1;

    function render(index) {
      if (index < 0 || index >= segments.length || index === activeIndex) return;
      activeIndex = index;
      line.classList.remove('is-active');
      line.classList.add('is-idle');
      requestAnimationFrame(() => {
        line.innerHTML = segments[index].text
          .replace(/SvaraONE/g, '<span class="brand-svara">Svara</span><span class="brand-one">ONE</span>');
        line.classList.remove('is-idle');
        line.classList.add('is-active');
      });
    }

    function reset() {
      activeIndex = -1;
      line.textContent = segments[0].text;
      line.className = 'hero-script-line is-idle';
      card.classList.remove('is-hero-playing');
      cosmos.stop();
    }

    function sync(audio) {
      if (!audio || !Number.isFinite(audio.currentTime)) return;
      if (audio.duration > 0 && Number.isFinite(audio.duration)) scale = audio.duration / referenceDuration;
      const t = audio.currentTime / Math.max(scale, .01);
      let idx = 0;
      for (let i = 0; i < segments.length; i++) {
        if (t >= segments[i].start) idx = i;
        else break;
      }
      render(idx);
      if (audio.ended) reset();
    }

    document.addEventListener('play', (event) => {
      const audio = event.target;
      if (!(audio instanceof HTMLMediaElement) || !String(audio.src).includes('/api/sample-hero')) return;
      card.classList.add('is-hero-playing');
      cosmos.start();
      sync(audio);
    }, true);

    document.addEventListener('pause', (event) => {
      const audio = event.target;
      if (!(audio instanceof HTMLMediaElement) || !String(audio.src).includes('/api/sample-hero')) return;
      card.classList.remove('is-hero-playing');
      cosmos.stop();
    }, true);

    document.addEventListener('timeupdate', (event) => {
      const audio = event.target;
      if (!(audio instanceof HTMLMediaElement) || !String(audio.src).includes('/api/sample-hero')) return;
      sync(audio);
    }, true);

    document.addEventListener('ended', (event) => {
      const audio = event.target;
      if (!(audio instanceof HTMLMediaElement) || !String(audio.src).includes('/api/sample-hero')) return;
      reset();
    }, true);

    reset();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();
