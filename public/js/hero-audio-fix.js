(() => {
  function setupHeroAudioFix() {
    const card = document.querySelector('.hero-card');
    const oldButton = document.querySelector('#heroPlay');
    const bar = card?.querySelector('.bar');
    const fill = card?.querySelector('.bar span');
    const durationEl = card?.querySelector('.player small');
    const bars = [...document.querySelectorAll('.hero-card .wave i')];
    if (!card || !oldButton || !bar || !fill) return;

    const button = oldButton.cloneNode(true);
    oldButton.replaceWith(button);

    const idleHeights = [.22,.55,.88,.58,.42,.72,.9,.48,.76,.9,.5,.68,.34];
    let audio = null;
    let audioContext = null;
    let analyser = null;
    let source = null;
    let animationFrame = null;
    let dragging = false;

    const resetWave = () => bars.forEach((el, i) => {
      el.style.height = `${idleHeights[i % idleHeights.length] * 100}%`;
      el.style.transform = 'scaleY(1)';
    });

    const stopAnimation = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = null;
      resetWave();
    };

    const animateWave = () => {
      if (!analyser || !bars.length || !audio || audio.paused || audio.ended) {
        animationFrame = null;
        return;
      }
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const step = Math.max(1, Math.floor(data.length / bars.length));
      bars.forEach((el, i) => {
        let sum = 0;
        const start = i * step;
        const end = Math.min(data.length, start + step);
        for (let j = start; j < end; j++) sum += data[j];
        const level = (sum / Math.max(1, end - start)) / 255;
        el.style.height = `${18 + Math.pow(level, .72) * 82}%`;
        el.style.transform = `scaleY(${.82 + level * .28})`;
      });
      animationFrame = requestAnimationFrame(animateWave);
    };

    const connectAnalyser = async () => {
      if (!audio) return;
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = .78;
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
      }
      if (audioContext.state === 'suspended') await audioContext.resume();
    };

    const format = seconds => {
      if (!Number.isFinite(seconds)) return '—:——';
      const total = Math.max(0, Math.round(seconds));
      return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    };

    const setPosition = clientX => {
      if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      audio.currentTime = ratio * audio.duration;
      fill.style.width = `${ratio * 100}%`;
    };

    bar.style.cursor = 'pointer';
    bar.setAttribute('role', 'slider');
    bar.setAttribute('aria-label', 'Seek voice preview');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.tabIndex = 0;

    bar.addEventListener('pointerdown', event => {
      if (!audio) return;
      dragging = true;
      bar.setPointerCapture?.(event.pointerId);
      setPosition(event.clientX);
      event.preventDefault();
    });
    bar.addEventListener('pointermove', event => {
      if (dragging) setPosition(event.clientX);
    });
    const endDrag = event => {
      if (!dragging) return;
      dragging = false;
      if (event.clientX != null) setPosition(event.clientX);
    };
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', () => { dragging = false; });
    bar.addEventListener('keydown', event => {
      if (!audio || !Number.isFinite(audio.duration)) return;
      const amount = audio.duration * .05;
      if (event.key === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - amount); event.preventDefault(); }
      if (event.key === 'ArrowRight') { audio.currentTime = Math.min(audio.duration, audio.currentTime + amount); event.preventDefault(); }
    });

    const syncUI = () => {
      if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const ratio = audio.currentTime / audio.duration;
      fill.style.width = `${ratio * 100}%`;
      bar.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
      if (durationEl) durationEl.textContent = format(audio.duration);
    };

    const reset = () => {
      button.disabled = false;
      button.textContent = '▶';
      fill.style.width = '0%';
      if (durationEl) durationEl.textContent = audio ? format(audio.duration) : '—:——';
      stopAnimation();
    };

    button.addEventListener('click', async () => {
      try {
        if (!audio) {
          if (window.stopHeroPlayback) window.stopHeroPlayback();
          button.disabled = true;
          button.textContent = '…';
          audio = new Audio('/api/sample-hero');
          audio.preload = 'auto';
          audio.addEventListener('loadedmetadata', syncUI);
          audio.addEventListener('durationchange', syncUI);
          audio.addEventListener('timeupdate', syncUI);
          audio.addEventListener('playing', async () => {
            button.disabled = false;
            button.textContent = 'Ⅱ';
            await connectAnalyser();
            if (!animationFrame) animateWave();
          });
          audio.addEventListener('pause', () => {
            button.textContent = '▶';
            stopAnimation();
          });
          audio.addEventListener('ended', () => {
            reset();
            audio.currentTime = 0;
            syncUI();
          });
          audio.addEventListener('error', () => {
            reset();
            console.error('Hero sample unavailable');
          });
        }

        if (audio.paused) {
          if (window.activeAudio && window.activeAudio !== audio) {
            window.activeAudio.pause();
            window.activeAudio.currentTime = 0;
          }
          await connectAnalyser();
          await audio.play();
        } else {
          audio.pause();
        }
      } catch (err) {
        reset();
        console.error(err);
      }
    });

    resetWave();
    reset();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupHeroAudioFix, { once: true });
  else setupHeroAudioFix();
})();