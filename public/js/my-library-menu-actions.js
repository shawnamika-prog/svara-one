(() => {
  function findFilenameForMenu(menu) {
    if (!menu) return '';
    const menuRect = menu.getBoundingClientRect();
    let best = null;
    let bestScore = Infinity;

    document.querySelectorAll('.my-library-name').forEach(name => {
      const strong = name.querySelector('strong');
      const filename = strong?.textContent?.trim() || '';
      if (!filename) return;
      const rect = name.getBoundingClientRect();
      const vertical = Math.abs(rect.bottom + 6 - menuRect.top);
      const horizontal = Math.abs(rect.left - menuRect.left);
      const score = vertical * 10 + horizontal;
      if (score < bestScore) {
        bestScore = score;
        best = filename;
      }
    });

    return best || '';
  }

  function downloadGeneration(filename) {
    const link = document.createElement('a');
    link.href = `/api/generations/media?filename=${encodeURIComponent(filename)}&download=1`;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function deleteGeneration(filename) {
    if (!window.confirm(`Delete “${filename}”? This cannot be undone.`)) return;

    try {
      const response = await fetch('/api/generations/delete', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Delete failed (${response.status})`);
      window.location.reload();
    } catch (error) {
      window.alert(error?.message || 'Could not delete the generation.');
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('.my-library-file-menu button');
    if (!button) return;

    const label = button.querySelector('span:last-child')?.textContent?.trim();
    if (label !== 'Download' && label !== 'Delete') return;

    const menu = button.closest('.my-library-file-menu');
    const filename = findFilenameForMenu(menu);
    if (!filename) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    menu?.remove();

    if (label === 'Download') {
      downloadGeneration(filename);
      return;
    }

    deleteGeneration(filename);
  }, true);
})();
