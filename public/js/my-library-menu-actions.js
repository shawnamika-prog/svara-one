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
    if (label !== 'Download' && label !== 'Delete') return;

    event.preventDefault();
    event.stopImmediatePropagation();
    button.closest('.my-library-file-menu')?.remove();

    const filename = activeFilename;
    activeFilename = '';

    if (label === 'Download') {
      const link = document.createElement('a');
      link.href = `/api/generations/media?filename=${encodeURIComponent(filename)}&download=1`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    if (!window.confirm(`Delete “${filename}”? This cannot be undone.`)) return;

    fetch('/api/generations/delete', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ filename })
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || `Delete failed (${response.status})`);
        window.location.reload();
      })
      .catch(error => {
        window.alert(error?.message || 'Could not delete the generation.');
      });
  }, true);
})();
