(() => {
  const RETRY_DELAYS = [0, 1000, 2500, 5000];

  function refreshLibrary() {
    if (window.SvaraLibrary?.refresh) window.SvaraLibrary.refresh();
  }

  window.addEventListener('svara:generation-ready', () => {
    RETRY_DELAYS.forEach(delay => window.setTimeout(refreshLibrary, delay));
  });
})();
