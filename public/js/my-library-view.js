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
  const sortButton = libraryView.querySelector('.my-library-actions .my-library-action:last-child');

  const toolbar = libraryView.querySelector('.my-library-toolbar');
  if (toolbar && !libraryView.querySelector('.my-library-retention')) {
    const retention = document.createElement('div');
    retention.className = 'my-library-retention';
    retention.innerHTML = '<span class="my-library-retention-icon" aria-hidden="true">◷</span><span><strong>90-day storage</strong> · Your generated files are automatically deleted after 90 days.</span>';
    toolbar.insertAdjacentElement('afterend', retention);
  }

  if (tableHead && !tableHead.querySelector('.my-library-expiry-head')) {
    const expiryHead = document.createElement('span');
    expiryHead.className = 'my-library-expiry-head';
    expiryHead.textContent = 'Auto removes';
    tableHead.appendChild(expiryHead);
  }

  let generations = [];
  let loaded = false;
  let loading = false;
  let sortMode = 'newest';
  let openFileMenu = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>\"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;'
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
      const haystack = `${item.filename} ${item.voiceName} ${item.assetType || ''} ${item.soundType || ''} ${item.format} ${item.status}`.toLowerCase();
      const queryOk = !query || haystack.includes(query);
      const dateOk = dateMatches(item.createdAt, dateValue);
      const formatOk = formatValue === 'All formats' || item.format === formatValue;
      return queryOk && dateOk && formatOk;
    });
  }

  function sortGenerations(items) {
    const sorted = [...items];
    const text = value => String(value || '').toLowerCase();
    const time = value => {
      const parsed = Date.parse(value || '');
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    switch (sortMode) {
      case 'oldest': return sorted.sort((a, b) => time(a.createdAt) - time(b.createdAt));
      case 'name-asc': return sorted.sort((a, b) => text(a.filename).localeCompare(text(b.filename)));
      case 'name-desc': return sorted.sort((a, b) => text(b.filename).localeCompare(text(a.filename)));
      case 'voice-asc': return sorted.sort((a, b) => text(a.voiceName).localeCompare(text(b.voiceName)) || time(b.createdAt) - time(a.createdAt));
      case 'size-desc': return sorted.sort((a, b) => (Number(b.sizeBytes) || 0) - (Number(a.sizeBytes) || 0));
      case 'size-asc': return sorted.sort((a, b) => (Number(a.sizeBytes) || 0) - (Number(b.sizeBytes) || 0));
      case 'newest':
      default: return sorted.sort((a, b) => time(b.createdAt) - time(a.createdAt));
    }
  }

  function filteredAndSortedGenerations() { return sortGenerations(filteredGenerations()); }

  function setupSortMenu() {
    if (!sortButton || libraryView.querySelector('.my-library-sort-menu')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'my-library-sort-wrap';
    sortButton.parentNode.insertBefore(wrapper, sortButton);
    wrapper.appendChild(sortButton);
    sortButton.setAttribute('aria-haspopup', 'true');
    sortButton.setAttribute('aria-expanded', 'false');
    const menu = document.createElement('div');
    menu.className = 'my-library-sort-menu';
    menu.hidden = true;
    menu.innerHTML = `<button type="button" data-sort="newest">Newest first</button><button type="button" data-sort="oldest">Oldest first</button><button type="button" data-sort="name-asc">Name A–Z</button><button type="button" data-sort="name-desc">Name Z–A</button><button type="button" data-sort="voice-asc">Voice A–Z</button><button type="button" data-sort="size-desc">Largest first</button><button type="button" data-sort="size-asc">Smallest first</button>`;
    wrapper.appendChild(menu);
    if (!document.getElementById('my-library-sort-styles')) {
      const style = document.createElement('style');
      style.id = 'my-library-sort-styles';
      style.textContent = `.my-library-sort-wrap{position:relative;display:inline-flex}.my-library-sort-menu{position:absolute;right:0;top:calc(100% + 7px);z-index:30;min-width:170px;padding:6px;background:#081522;border:1px solid #ffffff12;border-radius:10px;box-shadow:0 14px 30px #0008}.my-library-sort-menu button{display:block;width:100%;padding:9px 11px;border:0;border-radius:7px;background:transparent;color:#9fb2c5;text-align:left;font:inherit;font-size:11px;cursor:pointer}.my-library-sort-menu button:hover,.my-library-sort-menu button.active{background:#0a1d2b;color:#31e3c8}`;
      document.head.appendChild(style);
    }
    const closeMenu = () => { menu.hidden = true; sortButton.setAttribute('aria-expanded', 'false'); };
    sortButton.addEventListener('click', event => { event.stopPropagation(); menu.hidden = !menu.hidden; sortButton.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true'); });
    menu.querySelectorAll('button[data-sort]').forEach(option => option.addEventListener('click', () => { sortMode = option.dataset.sort || 'newest'; menu.querySelectorAll('button').forEach(button => button.classList.toggle('active', button === option)); render(); closeMenu(); }));
    document.addEventListener('click', event => { if (!wrapper.contains(event.target)) closeMenu(); });
    menu.querySelector('[data-sort="newest"]')?.classList.add('active');
  }

  function closeFileMenu() { if (openFileMenu) { openFileMenu.remove(); openFileMenu = null; } }
  let selectedAssetIds = new Set();
  function selectedItems(){return generations.filter(item=>selectedAssetIds.has(String(item.id||"")));}
  function updateSelectionBar(){
    let bar=libraryView.querySelector(".my-library-selection-bar"); const items=selectedItems();
    if(!items.length){bar?.remove();return;}
    if(!bar){bar=document.createElement("div");bar.className="my-library-selection-bar";toolbar?.insertAdjacentElement("afterend",bar);}
    bar.innerHTML="<span><strong>"+items.length+"</strong> selected</span><button type=\"button\" class=\"my-library-bulk-move\">Move to…</button><button type=\"button\" class=\"my-library-bulk-clear\">Clear</button>";
    bar.querySelector(".my-library-bulk-clear").onclick=()=>{selectedAssetIds.clear();render();};
    bar.querySelector(".my-library-bulk-move").onclick=openBulkMoveDialog;
  }
  function toggleSelection(id,checked){const key=String(id||"");if(!key)return;if(checked)selectedAssetIds.add(key);else selectedAssetIds.delete(key);updateSelectionBar();}
  async function openBulkMoveDialog(){
    const items=selectedItems();if(!items.length)return;
    const response=await fetch("/api/generations/folders",{credentials:"same-origin",cache:"no-store",headers:{accept:"application/json"}});
    const data=await response.json().catch(()=>({}));if(!response.ok){console.error(data.error||"Could not load folders.");return;}
    const folders=Array.isArray(data.folders)?data.folders:[];
    const options=["<option value=\"__unfiled__\">Unfiled</option>"].concat(folders.map(folder=>"<option value=\""+escapeHtml(folder.id)+"\">"+escapeHtml(folder.name)+"</option>")).join("");
    const root=document.createElement("div");root.className="my-library-bulk-modal";
    root.innerHTML="<div class=\"my-library-bulk-backdrop\"></div><section class=\"my-library-folder-dialog\" role=\"dialog\" aria-modal=\"true\"><div class=\"my-library-folder-dialog-head\"><div><small>MY LIBRARY</small><h3>Move "+items.length+" "+(items.length===1?"file":"files")+"</h3></div><button type=\"button\" class=\"my-library-folder-close\" aria-label=\"Close\">×</button></div><div class=\"my-library-folder-dialog-body\"><label for=\"myLibraryBulkMoveFolder\">Move selected files to</label><select id=\"myLibraryBulkMoveFolder\">"+options+"</select><p class=\"my-library-folder-dialog-help\">Voice and Sound assets will be moved using their own domain storage.</p></div><div class=\"my-library-folder-dialog-actions\"><button type=\"button\" class=\"my-library-folder-dialog-button\" data-cancel>Cancel</button><button type=\"button\" class=\"my-library-folder-dialog-button primary\" data-move>Move</button></div></section>";
    document.body.appendChild(root);const close=()=>root.remove();root.querySelector("[data-cancel]").onclick=close;root.querySelector(".my-library-folder-close").onclick=close;root.querySelector(".my-library-bulk-backdrop").onclick=close;
    root.querySelector("[data-move]").onclick=async()=>{const button=root.querySelector("[data-move]");button.disabled=true;button.textContent="Moving…";try{const folderId=root.querySelector("#myLibraryBulkMoveFolder").value;const moveResponse=await fetch("/api/library/assets/move",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json",accept:"application/json"},body:JSON.stringify({assets:items.map(item=>({id:item.id,assetType:item.assetType||"voice"})),folderId:folderId==="__unfiled__"?null:folderId})});const moveData=await moveResponse.json().catch(()=>({}));if(!moveResponse.ok)throw new Error(moveData.error||"Could not move files ("+moveResponse.status+")");selectedAssetIds.clear();close();await window.SvaraLibrary?.refresh?.();}catch(error){button.disabled=false;button.textContent="Move";root.querySelector(".my-library-folder-dialog-body")?.insertAdjacentHTML("beforeend","<div class=\"my-library-folder-dialog-error\">"+escapeHtml(error?.message||"Could not move files.")+"</div>");}};
  }

  function injectSelectionStyles(){if(document.getElementById("my-library-selection-styles"))return;const style=document.createElement("style");style.id="my-library-selection-styles";style.textContent=".my-library-selection-bar{display:flex;align-items:center;gap:10px;padding:9px 12px;margin-top:10px;border:1px solid #ffffff10;border-radius:10px;background:#081522;color:#9fb2c5;font-size:11px}.my-library-selection-bar strong{color:#e7eef5}.my-library-selection-bar button{padding:7px 11px;border:1px solid #ffffff12;border-radius:7px;background:#0b1b29;color:#9fb2c5;font:inherit;cursor:pointer}.my-library-selection-bar .my-library-bulk-move{margin-left:auto;border-color:#31e3c855;background:#0d2930;color:#31e3c8}.my-library-select{width:15px;height:15px;accent-color:#31e3c8}.my-library-bulk-modal{position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:24px}.my-library-bulk-backdrop{position:absolute;inset:0;background:#0009;backdrop-filter:blur(4px)}";document.head.appendChild(style);}
  function setupFileActionMenu() {
    if (!table || table.dataset.fileMenuReady) return;
    table.dataset.fileMenuReady = 'true';
    const style = document.createElement('style');
    style.textContent = `.my-library-file-menu{position:fixed;z-index:1000;min-width:160px;padding:6px;background:#081522;border:1px solid #ffffff16;border-radius:10px;box-shadow:0 16px 36px #0009}.my-library-file-menu button{display:flex;align-items:center;gap:10px;width:100%;padding:10px 11px;border:0;border-radius:7px;background:transparent;color:#b4c3d1;text-align:left;font:inherit;font-size:12px;cursor:pointer}.my-library-file-menu button:hover{background:#0a1d2b;color:#31e3c8}.my-library-file-menu .file-menu-icon{width:16px;text-align:center;font-size:14px;line-height:1}.my-library-file-menu .file-menu-delete:hover{color:#ff7d7d}`;
    document.head.appendChild(style);
    table.addEventListener('click', event => {
      const name = event.target.closest('.my-library-name');
      if (!name) return;
      event.preventDefault(); event.stopPropagation();
      const row = name.closest('.my-library-row');
      const index = Number(row?.dataset.generationIndex);
      const item = Number.isInteger(index) ? filteredAndSortedGenerations()[index] : null;
      if (!item) return;
      closeFileMenu();
      const menu = document.createElement('div');
      menu.className = 'my-library-file-menu';
      menu.setAttribute('role', 'menu');
      menu.innerHTML = `<button type="button" role="menuitem"><span class="file-menu-icon">✎</span><span>Rename</span></button><button type="button" role="menuitem"><span class="file-menu-icon">▶</span><span>Preview</span></button><button type="button" role="menuitem"><span class="file-menu-icon">↗</span><span>Move to</span></button><button type="button" role="menuitem"><span class="file-menu-icon">↓</span><span>Download</span></button><button type="button" role="menuitem" class="file-menu-delete"><span class="file-menu-icon">⌫</span><span>Delete</span></button>`;
      document.body.appendChild(menu);
      openFileMenu = menu;
      const rect = name.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const left = Math.min(rect.left, window.innerWidth - menuRect.width - 12);
      const top = Math.min(rect.bottom + 6, window.innerHeight - menuRect.height - 12);
      menu.style.left = `${Math.max(12, left)}px`;
      menu.style.top = `${Math.max(12, top)}px`;
      menu.querySelectorAll('button').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); closeFileMenu(); }));
    });
    document.addEventListener('click', event => { if (openFileMenu && !openFileMenu.contains(event.target)) closeFileMenu(); });
    window.addEventListener('resize', closeFileMenu);
    window.addEventListener('scroll', closeFileMenu, true);
  }

  function setTableMessage(title, message, icon = '◈') {
    if (!table) return;
    closeFileMenu();
    table.querySelectorAll('.my-library-row').forEach(row => row.remove());
    if (empty) { empty.hidden = false; empty.innerHTML = `<div><div class="my-library-empty-icon">${icon}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p></div>`; }
  }

  function render() {
    if (!table || !tableHead || !empty) return;
    closeFileMenu();
    const visible = filteredAndSortedGenerations();
    const activeFilter = Boolean((searchInput?.value || '').trim()) || (dateFilter?.value || 'All dates') !== 'All dates' || (formatFilter?.value || 'All formats') !== 'All formats';
    table.querySelectorAll('.my-library-row').forEach(row => row.remove());
    if (filesTitle) filesTitle.textContent = activeFilter ? 'Filtered generations' : 'All generations';
    if (filesCount) filesCount.textContent = `${visible.length} ${visible.length === 1 ? 'item' : 'items'}`;
    if (!visible.length) { empty.hidden = false; empty.innerHTML = `<div><div class="my-library-empty-icon">◈</div><h3>${escapeHtml(generations.length ? 'No matching generations' : 'Your generations will appear here')}</h3><p>${escapeHtml(generations.length ? 'Try changing your search or filters.' : 'Generate a voice and your original audio will be added to My Library.')}</p></div>`; return; }
    empty.hidden = true;
    const fragment = document.createDocumentFragment();
    visible.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = `my-library-row status-${escapeHtml(item.status)}`;
      row.dataset.generationIndex = String(index);
      row.dataset.assetId = String(item.id || '');
      row.dataset.assetType = String(item.assetType || 'voice');
      row.dataset.folderId = String(item.folderId || '');
      row.innerHTML = `<span class="my-library-name" title="${escapeHtml(item.filename)}"><strong>${escapeHtml(item.filename)}</strong>${item.status !== 'ready' ? `<small>${escapeHtml(item.status)}</small>` : ''}</span><span>${escapeHtml(item.assetType === 'sound' ? 'Sound' : item.voiceName)}</span><span>${escapeHtml(formatDate(item.createdAt))}</span><span>${escapeHtml(item.format)}</span><span>${escapeHtml(formatBytes(item.sizeBytes))}</span><span class="my-library-expiry" title="Automatically removed after 90 days">${escapeHtml(formatRemovalDate(item.expiresAt))}</span>`;
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
      const response = await fetch('/api/generations?limit=500', { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) { window.location.replace('/login.html?next=/studio'); return; }
      if (!response.ok) throw new Error(data.error || `Generation service unavailable (${response.status})`);
      generations = Array.isArray(data.generations) ? data.generations : [];
      loaded = true;
      render();
    } catch (error) {
      generations = [];
      loaded = false;
      setTableMessage('Could not load your generations', error?.message || 'Please try again.', '⚠');
    } finally { loading = false; }
  }

  window.SvaraLibrary = window.SvaraLibrary || {};
  window.SvaraLibrary.refresh = () => loadGenerations(true);
  window.SvaraLibrary.invalidate = () => { loaded = false; };

  function showView(view) {
    const showLibrary = view === 'library';
    libraryView.hidden = !showLibrary;
    voiceView.hidden = showLibrary;
    libraryLink.classList.toggle('active', showLibrary);
    voiceLink.classList.toggle('active', !showLibrary);
    if (showLibrary) loadGenerations();
  }

  libraryLink.addEventListener('click', event => { event.preventDefault(); history.replaceState(null, '', '#library'); showView('library'); });
  voiceLink.addEventListener('click', event => { event.preventDefault(); history.replaceState(null, '', '#voice'); showView('voice'); });
  window.addEventListener('hashchange', () => showView(location.hash === '#library' ? 'library' : 'voice'));

  searchInput?.addEventListener('input', render);
  dateFilter?.addEventListener('change', render);
  formatFilter?.addEventListener('change', render);

  injectSelectionStyles();
  setupSortMenu();
  setupFileActionMenu();
  showView(location.hash === '#library' ? 'library' : 'voice');
})();