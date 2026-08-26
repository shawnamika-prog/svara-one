(() => {
  const libraryLink = document.querySelector('aside a[href="#library"]');
  const voiceLink = document.querySelector('aside a[href="#voice"]');
  const voiceView = document.getElementById('voiceWorkspace');
  const libraryView = document.getElementById('myLibraryView');
  if (!libraryLink || !voiceLink || !voiceView || !libraryView) return;

  const searchInput = libraryView.querySelector('.my-library-search');
  const dateFilter = libraryView.querySelector('[aria-label="Filter by date"]');
  const formatFilter = libraryView.querySelector('[aria-label="Filter by format"]');
  const filesHead = libraryView.querySelector('.my-library-files-head');
  const filesTitle = filesHead?.querySelector('strong');
  const filesCount = filesHead?.querySelector('span');
  const table = libraryView.querySelector('.my-library-table');
  const tableHead = table?.querySelector('.my-library-table-head');
  const empty = table?.querySelector('.my-library-empty');

  // Retention notice: make the automatic 90-day deletion policy visible in My Library.
  const toolbar = libraryView.querySelector('.my-library-toolbar');
  if (toolbar && !libraryView.querySelector('.my-library-retention')) {
    const retention = document.createElement('div');
    retention.className = 'my-library-retention';
    retention.innerHTML = '<span class="my-library-retention-icon" aria-hidden="true">◷</span><span><strong>90-day storage</strong> · Your generated files are automatically deleted after 90 days.</span>';
    toolbar.insertAdjacentElement('afterend', retention);
  }

  // Add the retention date column without changing the existing studio markup.
  if (tableHead && !tableHead.querySelector('.my-library-expiry-head')) {
    const expiryHead = document.createElement('span');
    expiryHead.className = 'my-library-expiry-head';
    expiryHead.textContent = 'Auto removes';
    tableHead.appendChild(expiryHead);
  }

  let generations = [];
  let loaded = false;
  let loading = false;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (!value) return '—';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  }

  function formatRemovalDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    }).format(date);
  }

  function dateMatches(value, filter) {
    if (filter === 'All dates') return true;
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    if (filter === 'Today') {
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
    }
    if (filter === 'This week') {
      const start = new Date(now);
      const day = start.getDay() || 7;
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - day + 1);
      return date >= start;
    }
    if (filter === 'This month') {
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }
    return true;
  }

  function filteredGenerations() {
    const query = String(searchInput?.value || '').trim().toLowerCase();
    const dateValue = dateFilter?.value || 'All dates';
    const formatValue = formatFilter?.value || 'All formats';
    return generations.filter(item => {
      const haystack = `${item.filename} ${item.voiceName} ${item.format} ${item.status}`.toLowerCase();
      const queryOk = !query || haystack.includes(query);
      const dateOk = dateMatches(item.createdAt, dateValue);
      const formatOk = formatValue === 'All formats' || item.format === formatValue;
      return queryOk && dateOk && formatOk;
    });
  }

  function setTableMessage(title, message, icon = '◈') {
    if (!table) return;
    table.querySelectorAll('.my-library-row').forEach(row => row.remove());
    if (empty) {
      empty.hidden = false;
      empty.innerHTML = `<div><div class="my-library-empty-icon">${icon}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p></div>`;
    }
  }

  function render() {
    if (!table || !tableHead || !empty) return;
    const visible = filteredGenerations();
    const activeFilter = Boolean((searchInput?.value || '').trim()) || (dateFilter?.value || 'All dates') !== 'All dates' || (formatFilter?.value || 'All formats') !== 'All formats';

    table.querySelectorAll('.my-library-row').forEach(row => row.remove());

    if (filesTitle) filesTitle.textContent = activeFilter ? 'Filtered generations' : 'All generations';
    if (filesCount) filesCount.textContent = `${visible.length} ${visible.length === 1 ? 'item' : 'items'}`;

    if (!visible.length) {
      empty.hidden = false;
      empty.innerHTML = `<div><div class="my-library-empty-icon">◈</div><h3>${escapeHtml(generations.length ? 'No matching generations' : 'Your generations will appear here')}</h3><p>${escapeHtml(generations.length ? 'Try changing your search or filters.' : 'Generate a voice and your original audio will be added to My Library.')}</p></div>`;
      return;
    }

    empty.hidden = true;
    const fragment = document.createDocumentFragment();
    visible.forEach(item => {
      const row = document.createElement('div');
      row.className = `my-library-row status-${escapeHtml(item.status)}`;
      row.innerHTML = `
        <span class="my-library-name" title="${escapeHtml(item.filename)}"><strong>${escapeHtml(item.filename)}</strong>${item.status !== 'ready' ? `<small>${escapeHtml(item.status)}</small>` : ''}</span>
        <span>${escapeHtml(item.voiceName)}</span>
        <span>${escapeHtml(formatDate(item.createdAt))}</span>
        <span>${escapeHtml(item.format)}</span>
        <span>${escapeHtml(formatBytes(item.sizeBytes))}</span>
        <span class="my-library-expiry" title="Automatically removed after 90 days">${escapeHtml(formatRemovalDate(item.expiresAt))}</span>
      `;
      fragment.appendChild(row);
    });
    table.appendChild(fragment);
  }

  async function loadGenerations(force = false) {
    if (loading || (loaded && !force)) return;
    loading = true;
    setTableMessage('Loading your generations…', 'Retrieving your saved SvaraONE creations.', '◇');
    if (filesCount) filesCount.textContent = 'Loading…';

    try {
      const response = await fetch('/api/generations?limit=500', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { accept: 'application/json' }
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.replace('/login.html?next=/studio');
        return;
      }
      if (!response.ok) throw new Error(data.error || `Generation service unavailable (${response.status})`);
      generations = Array.isArray(data.generations) ? data.generations : [];
      loaded = true;
      render();
    } catch (error) {
      generations = [];
      loaded = false;
      setTableMessage('Could not load your generations', error?.message || 'Please try again.', '!');
      if (filesCount) filesCount.textContent = 'Unavailable';
    } finally {
      loading = false;
    }
  }

  searchInput?.addEventListener('input', render);
  dateFilter?.addEventListener('change', render);
  formatFilter?.addEventListener('change', render);

  function show(view) {
    const library = view === 'library';
    voiceView.hidden = library;
    libraryView.hidden = !library;
    libraryLink.classList.toggle('active', library);
    voiceLink.classList.toggle('active', !library);
    libraryLink.setAttribute('aria-current', library ? 'page' : 'false');
    voiceLink.setAttribute('aria-current', library ? 'false' : 'page');
    if (library) loadGenerations(true);
  }

  libraryLink.addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#library');
    show('library');
  });

  voiceLink.addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#voice');
    show('voice');
  });

  window.addEventListener('popstate', () => show(location.hash === '#library' ? 'library' : 'voice'));
  show(location.hash === '#library' ? 'library' : 'voice');
})();
