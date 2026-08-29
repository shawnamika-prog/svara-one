(() => {
  let activeFilename = '';

  document.addEventListener('click', event => {
    const name = event.target.closest('.my-library-name');
    if (name) {
      activeFilename = name.querySelector('strong')?.textContent?.trim() || '';
      return;
    }

    const button = event.target.closest('.my-library-file-menu button');
    if (!button || !activeFilename) return;

    const label = button.querySelector('span:last-child')?.textContent?.trim();
    if (!['Rename', 'Download', 'Delete'].includes(label)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    button.closest('.my-library-file-menu')?.remove();

    const filename = activeFilename;
    activeFilename = '';

    if (label === 'Rename') {
      if (!window.SvaraModal?.rename) return;

      window.SvaraModal.rename(filename).then(async newFilename => {
        const requestedFilename = String(newFilename || '').trim();
        if (!requestedFilename || requestedFilename === filename) return;

        try {
          const response = await fetch('/api/generations/rename', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ currentFilename: filename, filename: requestedFilename })
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || `Rename failed (${response.status})`);
          window.location.reload();
        } catch (error) {
          console.error(error);
        }
      }).catch(error => console.error(error));
      return;
    }

    if (label === 'Download') {
      const link = document.createElement('a');
      link.href = `/api/generations/media?filename=${encodeURIComponent(filename)}&download=1`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    if (label === 'Delete') {
      if (!window.SvaraModal?.delete) return;
      window.SvaraModal.delete(filename);
    }
  }, true);
})();
