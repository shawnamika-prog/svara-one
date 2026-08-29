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
    .hero-cosmos{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.72;transition:opacity 1.2s ease}
    .hero-cosmos canvas{display:block;width:100%;height:100%}
    .hero-card.is-hero-playing .hero-cosmos{opacity:1}
    .hero-script{min-height:118px;margin:25px 0;display:flex;align-items:center;position:relative}
    .hero-script:after{content:'';position:absolute;left:-12px;right:35%;top:50%;height:120px;transform:translateY(-50%);background:radial-gradient(ellipse at center,rgba(5,18,32,.78),rgba(5,18,32,0) 72%);z-index:-1;pointer-events:none}
    .hero-script-line{font-size:20px;line-height:1.55;color:#cbd9e8;transition:opacity .55s ease,transform .55s ease,color .55s ease;text-shadow:0 2px 22px rgba(0,0,0,.8);max-width:94%}
    .hero-script-line.is-active{color:#f1f8ff;transform:translateY(0);opacity:1}
    .hero-script-line.is-idle{opacity:.72;transform:translateY(4px)}
    .hero-script-line .brand-svara,.hero-script-line .brand-one{font-weight:inherit}
    .hero-card .card-top,.hero-card .voice-row,.hero-card .player{position:relative;z-index:3}
    @media(max-width:650px){.hero-script{min-height:150px}.hero-script-line{font-size:18px;max-width:100%}.hero-script:after{right:0}}
    @media(prefers-reduced-motion:reduce){.hero-cosmos{opacity:.42}.hero-script-line{transition:none}.hero-script:after{opacity:.7}}
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
      const count = Math.max(34, Math.min(62, Math.round(width * height / 9800)));
      while (stars.length < count) stars.push(makeStar());
      while (stars.length > count) stars.pop();
    }

    function makeStar() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * .72 + .18,
        alpha: Math.random() * .34 + .08,
        phase: Math.random() * Math.PI * 2,
        twinkle: Math.random() * .5 + .15,
        drift: (Math.random() - .5) * .018
      };
    }

    function draw(now) {
      const dt = Math.min(40, now - last) / 16.67;
      last = now;
      ctx.clearRect(0, 0, width, height);

      const intensity = playing ? 1 : .72;
      const cx = width * .79;
      const cy = height * .51;
      const radius = Math.min(width, height) * .13;
      const sourceX = cx - radius * .72;

      // Very dark atmospheric space: the stars should be discovered, not announced.
      for (const star of stars) {
        if (!reduced && playing) {
          star.x += star.drift * dt;
          if (star.x < -2) star.x = width + 2;
          if (star.x > width + 2) star.x = -2;
        }
        const twinkle = .76 + Math.sin(now * .001 * star.twinkle + star.phase) * .24;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(211,234,255,${Math.max(.025, star.alpha * twinkle * intensity)})`;
        ctx.fill();
      }

      // A distant celestial light sits behind a dark object, echoing the SvaraONE mark.
      const atmosphere = ctx.createRadialGradient(sourceX, cy, radius * .15, sourceX, cy, radius * 3.8);
      atmosphere.addColorStop(0, `rgba(255,221,166,${.095 * intensity})`);
      atmosphere.addColorStop(.18, `rgba(81,202,236,${.045 * intensity})`);
      atmosphere.addColorStop(.55, `rgba(28,137,190,${.018 * intensity})`);
      atmosphere.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = atmosphere;
      ctx.fillRect(0, 0, width, height);

      // Soft light source.
      const sun = ctx.createRadialGradient(sourceX, cy, 0, sourceX, cy, radius * 1.3);
      sun.addColorStop(0, `rgba(255,239,204,${.20 * intensity})`);
      sun.addColorStop(.38, `rgba(255,202,139,${.10 * intensity})`);
      sun.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = sun;
      ctx.beginPath();
      ctx.arc(sourceX, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Dark silhouette. It is intentionally understated so it reads as an eclipse, not a circle.
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2,9,18,.985)';
      ctx.fill();

      // Thin atmospheric rim around the silhouette.
      ctx.lineWidth = .9;
      ctx.strokeStyle = `rgba(225,238,246,${.055 * intensity})`;
      ctx.stroke();

      // A restrained crescent/halo appears where the hidden light escapes.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rim = ctx.createRadialGradient(sourceX, cy, radius * .82, sourceX, cy, radius * 1.24);
      rim.addColorStop(0, 'rgba(255,231,195,0)');
      rim.addColorStop(.72, `rgba(255,221,170,${.10 * intensity})`);
      rim.addColorStop(.9, `rgba(109,214,236,${.035 * intensity})`);
      rim.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(sourceX, cy, radius * 1.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (!reduced || playing) raf = requestAnimationFrame(draw);
    }

    const start = () => {
      playing = true;
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(draw); }
    };
    const stop = () => {
      playing = false;
      if (!raf && !reduced) raf = requestAnimationFrame(draw);
    };

    resize();
    if (reduced) draw(performance.now());
    else raf = requestAnimationFrame(draw);
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
