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

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing) return;
    const input = event.target.closest('#myLibraryFolderName');
    if (!input) return;
    const modal = input.closest('.my-library-folder-modal');
    const createButton = modal?.querySelector('.my-library-folder-dialog-button.primary');
    if (!createButton || createButton.disabled) return;
    event.preventDefault();
    createButton.click();
  });

  const bulkScript = document.createElement('script');
  bulkScript.src = 'js/my-library-bulk-actions.js';
  bulkScript.defer = true;
  document.head.appendChild(bulkScript);

  const foldersSyncScript = document.createElement('script');
  foldersSyncScript.src = 'js/my-library-folders-sync.js';
  foldersSyncScript.defer = true;
  document.head.appendChild(foldersSyncScript);
})();
