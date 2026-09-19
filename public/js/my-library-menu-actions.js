(() => {
  let activeItem = null;
  document.addEventListener('click', event => {
    const name = event.target.closest('.my-library-name');
    if (name) {
      const row = name.closest('.my-library-row');
      activeItem = {
        id: row?.dataset.assetId || '',
        assetType: row?.dataset.assetType || 'voice',
        filename: name.querySelector('strong')?.textContent?.trim() || '',
        format: row?.children?.[3]?.textContent?.trim() || ''
      };
      return;
    }
    const button = event.target.closest('.my-library-file-menu button');
    if (!button || !activeItem?.filename) return;
    const label = button.querySelector('span:last-child')?.textContent?.trim();
    if (!['Rename','Download','Delete'].includes(label)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.closest('.my-library-file-menu')?.remove();
    const item = {...activeItem};
    activeItem = null;
    if (label === 'Download') {
      const url = item.assetType === 'sound'
        ? '/api/sound/assets/' + encodeURIComponent(item.id) + '?download=1'
        : '/api/generations/media?filename=' + encodeURIComponent(item.filename) + '&download=1';
      const link = document.createElement('a');
      link.href = url;
      link.download = item.filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }
    if (label === 'Rename') {
      if (!window.SvaraModal?.rename) return;
      window.SvaraModal.rename(item.filename).then(async newFilename => {
        const requestedFilename = String(newFilename || '').trim();
        if (!requestedFilename || requestedFilename === item.filename) return;
        try {
          const response = await fetch('/api/library/assets/rename', {
            method: 'POST', credentials: 'same-origin',
            headers: {'content-type':'application/json', accept:'application/json'},
            body: JSON.stringify({assetId:item.id, assetType:item.assetType, filename:requestedFilename})
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || 'Rename failed (' + response.status + ')');
          window.SvaraLibrary?.refresh?.();
        } catch (error) { console.error(error); }
      }).catch(error => console.error(error));
      return;
    }
    if (label === 'Delete') {
      if (!window.SvaraModal?.delete) return;
      window.SvaraModal.delete(item.filename, {
        assetId: item.id,
        assetType: item.assetType
      });
    }
  }, true);
})();