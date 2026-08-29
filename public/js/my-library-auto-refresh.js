(() => {
  const RETRY_DELAYS = [0, 1000, 2500, 5000];

  function refreshLibrary() {
    if (window.SvaraLibrary?.refresh) window.SvaraLibrary.refresh();
  }

  function redrawWaveformAfterVoiceRestore() {
    const audioElements = [
      document.getElementById('player'),
      document.getElementById('processedAudio')
    ].filter(Boolean);

    if (!audioElements.length) return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        audioElements.forEach(audio => {
          audio.dispatchEvent(new Event('loadedmetadata'));
        });
      });
    });
  }

  window.addEventListener('svara:generation-ready', () => {
    RETRY_DELAYS.forEach(delay => window.setTimeout(refreshLibrary, delay));
  });

  const voiceLink = document.querySelector('aside a[href="#voice"]');
  voiceLink?.addEventListener('click', redrawWaveformAfterVoiceRestore, true);
  window.addEventListener('hashchange', () => {
    if (location.hash === '#voice') redrawWaveformAfterVoiceRestore();
  });
})();
