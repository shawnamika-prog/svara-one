(() => {
  const RETRY_DELAYS = [0, 1000, 2500, 5000];

  function refreshLibrary() {
    if (window.SvaraLibrary?.refresh) window.SvaraLibrary.refresh();
  }

  function redrawWaveformAfterVoiceRestore() {
    const audio = document.getElementById('player');
    if (!audio) return;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        audio.dispatchEvent(new Event('loadedmetadata'));
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
