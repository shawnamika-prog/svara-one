(() => {
  const libraryView = document.getElementById('myLibraryView');
  const table = libraryView?.querySelector('.my-library-table');
  if (!libraryView || !table) return;

  const boot = () => {
    const getVisibleRows = () => [...table.querySelectorAll('.my-library-row')]
      .filter(row => !row.hidden && row.style.display !== 'none');

    const syncSelectAll = () => {
      const checkbox = table.querySelector('.my-library-table-head .my-library-select');
      if (!checkbox) return;
      const rows = getVisibleRows();
      const inputs = rows.map(row => row.querySelector('.my-library-select[data-row-select]')).filter(Boolean);
      const checked = inputs.filter(input => input.checked).length;
      checkbox.disabled = inputs.length === 0;
      checkbox.checked = inputs.length > 0 && checked === inputs.length;
      checkbox.indeterminate = checked > 0 && checked < inputs.length;
    };

    const folderObserver = new MutationObserver(() => {
      window.setTimeout(syncSelectAll, 0);
    });
    folderObserver.observe(table, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'style'] });

    table.addEventListener('change', event => {
      if (event.target.matches('.my-library-select[data-row-select]')) {
        window.setTimeout(syncSelectAll, 0);
      }
    });

    function activeFolderId() {
      const active = libraryView.querySelector('.my-library-folder.active');
      if (!active) return '__all__';
      if (active.dataset.libraryFolderId) return active.dataset.libraryFolderId;
      const label = String(active.textContent || '').replace(/[▣□]/g, '').trim();
      if (label === 'Unfiled') return '__unfiled__';
      if (label === 'All generations') return '__all__';
      return null;
    }

    function filterMoveDestinations() {
      const select = document.getElementById('svaraBulkMoveFolder');
      if (!select) return false;
      const current = activeFolderId();
      if (!current || current === '__all__') return false;
      [...select.options].forEach(option => {
        if (option.value === current) option.remove();
      });
      if (!select.options.length) {
        const option = document.createElement('option');
        option.value = '';
        option.disabled = true;
        option.selected = true;
        option.textContent = 'No other folders available';
        select.appendChild(option);
        select.disabled = true;
      } else {
        select.disabled = false;
      }
      return true;
    }

    const modalObserver = new MutationObserver(() => {
      if (filterMoveDestinations()) window.setTimeout(filterMoveDestinations, 20);
    });
    modalObserver.observe(document.body, { childList: true, subtree: true });

    syncSelectAll();
  };

  if (table.querySelector('.my-library-table-head .my-library-select')) {
    boot();
  } else {
    const timer = window.setInterval(() => {
      if (!table.querySelector('.my-library-table-head .my-library-select')) return;
      window.clearInterval(timer);
      boot();
    }, 50);
  }
})();
