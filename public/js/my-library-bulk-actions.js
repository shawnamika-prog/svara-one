(() => {
  const libraryView = document.getElementById('myLibraryView');
  const table = libraryView?.querySelector('.my-library-table');
  const filesHead = libraryView?.querySelector('.my-library-files-head');
  if (!libraryView || !table || !filesHead) return;

  const selected = new Set();
  let headerCheckbox = null;
  let bulkBar = null;
  let actionLock = false;
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const visibleRows = () => [...table.querySelectorAll('.my-library-row')].filter(row => !row.hidden && getComputedStyle(row).display !== 'none');
  const filenameFor = row => row.querySelector('.my-library-name strong')?.textContent?.trim() || '';

  function styles() {
    if (document.getElementById('my-library-bulk-styles')) return;
    const style = document.createElement('style');
    style.id = 'my-library-bulk-styles';
    style.textContent = `
      .my-library-table-head{position:relative}.my-library-row{position:relative}.my-library-select-wrap{position:absolute;left:13px;top:50%;transform:translateY(-50%);display:grid;place-items:center;z-index:2}.my-library-select{appearance:none;-webkit-appearance:none;width:16px;height:16px;margin:0;border:1px solid #52687b;border-radius:4px;background:#071522;cursor:pointer;position:relative}.my-library-select:hover{border-color:#31e3c8}.my-library-select:checked{background:#31e3c8;border-color:#31e3c8}.my-library-select:checked::after{content:'✓';position:absolute;left:2px;top:-1px;color:#062019;font-size:12px;font-weight:800}.my-library-select:indeterminate{background:#123d39;border-color:#31e3c8}.my-library-select:indeterminate::after{content:'';position:absolute;left:3px;top:6px;width:8px;height:2px;border-radius:2px;background:#31e3c8}.my-library-table-head span:first-of-type{padding-left:28px}.my-library-row .my-library-name{padding-left:28px}.my-library-bulkbar{display:flex;align-items:center;gap:9px;margin:0 0 12px;padding:9px 11px;border:1px solid rgba(49,227,200,.12);border-radius:10px;background:#071522;min-height:38px;box-sizing:border-box}.my-library-bulk-count{margin-right:auto;color:#9fb2c5;font-size:11px}.my-library-bulk-count strong{color:#e7f1f8}.my-library-bulk-button{border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px 12px;background:#0b1b29;color:#a9bac9;font:inherit;font-size:11px;font-weight:600;cursor:pointer}.my-library-bulk-button:hover{background:#102333;color:#edf6ff}.my-library-bulk-button.move{border-color:rgba(49,227,200,.32);background:#0d2930;color:#31e3c8}.my-library-bulk-button.move:hover{background:#123d39}.my-library-bulk-button.delete{border-color:rgba(255,125,125,.28);background:#291418;color:#ff9a9a}.my-library-bulk-button.delete:hover{background:#35191f;color:#ffadad}.my-library-bulk-button.clear{padding-left:8px;padding-right:8px;background:transparent;border-color:transparent;color:#71879a}.my-library-bulk-button:disabled{opacity:.55;cursor:default}.svara-modal-root.bulk-delete .svara-modal{border-color:rgba(255,125,125,.22)}.svara-modal-root.bulk-delete .svara-modal-button.primary{background:#291418;border-color:rgba(255,125,125,.28);color:#ff9a9a}.svara-modal-root.bulk-delete .svara-modal-button.primary:hover{background:#35191f;border-color:rgba(255,125,125,.42);color:#ffadad}.svara-modal-bulk-list{max-height:180px;overflow:auto;margin-top:12px;padding:10px 12px;border:1px solid rgba(255,255,255,.07);border-radius:10px;background:#07121d;color:#8ea4b8;font-size:10px;line-height:1.55}.svara-modal-bulk-list div{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}@media(max-width:900px){.my-library-table-head span:first-of-type{padding-left:28px}.my-library-row .my-library-name{padding-left:28px}}`;
    document.head.appendChild(style);
  }

  function updateHeader() {
    if (!headerCheckbox) return;
    const names = visibleRows().map(filenameFor).filter(Boolean);
    const count = names.filter(name => selected.has(name)).length;
    headerCheckbox.checked = names.length > 0 && count === names.length;
    headerCheckbox.indeterminate = count > 0 && count < names.length;
    headerCheckbox.disabled = names.length === 0;
  }

  function updateBar() {
    if (!bulkBar) return;
    const count = selected.size;
    bulkBar.hidden = count === 0;
    const node = bulkBar.querySelector('[data-bulk-count]');
    if (node) node.innerHTML = `<strong>${count}</strong> ${count === 1 ? 'file' : 'files'} selected`;
    updateHeader();
  }

  function clear() {
    selected.clear();
    table.querySelectorAll('.my-library-select[data-row-select]').forEach(input => { input.checked = false; });
    updateBar();
  }

  function selectAll() {
    visibleRows().forEach(row => {
      const filename = filenameFor(row);
      if (filename) selected.add(filename);
    });
    table.querySelectorAll('.my-library-select[data-row-select]').forEach(input => {
      const row = input.closest('.my-library-row');
      input.checked = !!row && visibleRows().includes(row);
    });
    updateBar();
  }

  function setupHeader() {
    if (table.querySelector('.my-library-table-head .my-library-select-wrap')) return;
    const head = table.querySelector('.my-library-table-head');
    if (!head) return;
    const wrap = document.createElement('label');
    wrap.className = 'my-library-select-wrap';
    wrap.title = 'Select all visible files';
    headerCheckbox = document.createElement('input');
    headerCheckbox.type = 'checkbox';
    headerCheckbox.className = 'my-library-select';
    headerCheckbox.setAttribute('aria-label', 'Select all visible files');
    headerCheckbox.addEventListener('change', () => headerCheckbox.checked ? selectAll() : clear());
    wrap.appendChild(headerCheckbox);
    head.appendChild(wrap);
  }

  function setupRows() {
    table.querySelectorAll('.my-library-row').forEach(row => {
      if (row.querySelector('.my-library-select-wrap')) return;
      const filename = filenameFor(row);
      if (!filename) return;
      const wrap = document.createElement('label');
      wrap.className = 'my-library-select-wrap';
      wrap.title = `Select ${filename}`;
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'my-library-select';
      input.dataset.rowSelect = 'true';
      input.checked = selected.has(filename);
      input.setAttribute('aria-label', `Select ${filename}`);
      input.addEventListener('click', event => event.stopPropagation());
      input.addEventListener('change', () => {
        if (input.checked) selected.add(filename);
        else selected.delete(filename);
        updateBar();
      });
      wrap.appendChild(input);
      row.appendChild(wrap);
    });
  }

  function setupBar() {
    if (bulkBar) return;
    bulkBar = document.createElement('div');
    bulkBar.className = 'my-library-bulkbar';
    bulkBar.hidden = true;
    bulkBar.innerHTML = '<span class="my-library-bulk-count" data-bulk-count></span><button type="button" class="my-library-bulk-button move" data-bulk-move>Move to</button><button type="button" class="my-library-bulk-button delete" data-bulk-delete>Delete</button><button type="button" class="my-library-bulk-button clear" data-bulk-clear>Clear</button>';
    filesHead.insertAdjacentElement('afterend', bulkBar);
    bulkBar.querySelector('[data-bulk-clear]').addEventListener('click', clear);
    bulkBar.querySelector('[data-bulk-move]').addEventListener('click', openMove);
    bulkBar.querySelector('[data-bulk-delete]').addEventListener('click', openDelete);
  }

  function modal(title, body, label, danger = false) {
    const root = document.createElement('div');
    root.className = `svara-modal-root${danger ? ' bulk-delete' : ''}`;
    root.innerHTML = `<section class="svara-modal" role="dialog" aria-modal="true" aria-labelledby="svaraBulkModalTitle"><div class="svara-modal-head"><div><p class="svara-modal-eyebrow">MY LIBRARY</p><h2 id="svaraBulkModalTitle" class="svara-modal-title">${esc(title)}</h2></div><button class="svara-modal-close" type="button" aria-label="Close">×</button></div><div class="svara-modal-body">${body}</div><div class="svara-modal-foot"><button class="svara-modal-button" type="button" data-bulk-cancel>Cancel</button><button class="svara-modal-button primary" type="button" data-bulk-confirm>${esc(label)}</button></div></section>`;
    document.body.appendChild(root);
    const close = () => root.remove();
    root.querySelector('.svara-modal-close').addEventListener('click', close);
    root.querySelector('[data-bulk-cancel]').addEventListener('click', close);
    root.addEventListener('click', event => { if (event.target === root) close(); });
    requestAnimationFrame(() => root.classList.add('is-open'));
    return { root, close, confirm: root.querySelector('[data-bulk-confirm]') };
  }

  async function folders() {
    const response = await fetch('/api/generations/folders', { credentials: 'same-origin', cache: 'no-store', headers: { accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Could not load folders (${response.status})`);
    return Array.isArray(data.folders) ? data.folders : [];
  }

  async function openMove() {
    if (actionLock || !selected.size) return;
    const names = [...selected];
    const m = modal(`Move ${names.length} ${names.length === 1 ? 'file' : 'files'}`, `<label class="svara-modal-label" for="svaraBulkMoveFolder">Move ${names.length} ${names.length === 1 ? 'file' : 'files'} to</label><select id="svaraBulkMoveFolder" class="svara-modal-input"><option value="" selected disabled>Loading folders…</option></select><p class="svara-modal-help">All selected files will be moved together. Their audio files are not changed.</p>`, 'Move to');
    const select = m.root.querySelector('#svaraBulkMoveFolder');
    const help = m.root.querySelector('.svara-modal-help');
    try {
      const list = await folders();
      if (!m.root.isConnected) return;
      const options = ['<option value="__unfiled__">Unfiled</option>', ...list.map(folder => `<option value="${esc(folder.id)}">${esc(folder.name)}</option>`)];
      select.innerHTML = options.join('');
      select.disabled = options.length === 0;
      setTimeout(() => select.focus(), 30);
    } catch (error) {
      if (!m.root.isConnected) return;
      select.innerHTML = '<option value="" selected disabled>Could not load folders</option>';
      select.disabled = true;
      if (help) help.textContent = error?.message || 'Could not load folders.';
    }

    m.confirm.addEventListener('click', async () => {
      if (actionLock) return;
      const folderId = select?.value || '';
      if (!folderId) return;
      actionLock = true;
      m.confirm.disabled = true;
      m.confirm.textContent = 'Moving…';
      try {
        for (const filename of names) {
          const response = await fetch('/api/generations/move', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ filename, folderId: folderId === '__unfiled__' ? null : folderId })
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || `Could not move ${filename}`);
        }
        m.close();
        clear();
        window.SvaraLibrary?.refresh?.();
      } catch (error) {
        m.confirm.disabled = false;
        m.confirm.textContent = 'Move to';
        if (help) help.textContent = error?.message || 'Could not move the selected files.';
      } finally {
        actionLock = false;
      }
    }, { once: true });
  }

  function openDelete() {
    if (actionLock || !selected.size) return;
    const names = [...selected];
    const list = names.slice(0, 8).map(name => `<div>${esc(name)}</div>`).join('');
    const more = names.length > 8 ? `<div>+ ${names.length - 8} more</div>` : '';
    const m = modal(`Delete ${names.length} ${names.length === 1 ? 'file' : 'files'}?`, `<p class="svara-modal-delete-name">Delete ${names.length} ${names.length === 1 ? 'file' : 'files'}?</p><p class="svara-modal-help">This will permanently remove the selected generations from your SvaraONE library. This action cannot be undone.</p><div class="svara-modal-bulk-list">${list}${more}</div>`, 'Delete', true);
    m.confirm.addEventListener('click', async () => {
      if (actionLock) return;
      actionLock = true;
      m.confirm.disabled = true;
      m.confirm.textContent = 'Deleting…';
      try {
        for (const filename of names) {
          const response = await fetch('/api/generations/delete', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json', accept: 'application/json' },
            body: JSON.stringify({ filename })
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || `Could not delete ${filename}`);
        }
        m.close();
        clear();
        window.SvaraLibrary?.refresh?.();
      } catch (error) {
        m.confirm.disabled = false;
        m.confirm.textContent = 'Delete';
        const help = m.root.querySelector('.svara-modal-help');
        if (help) help.textContent = error?.message || 'Could not delete the selected files.';
      } finally {
        actionLock = false;
      }
    }, { once: true });
  }

  const observer = new MutationObserver(() => {
    setupHeader();
    setupRows();
    updateHeader();
  });
  observer.observe(table, { childList: true, subtree: true });

  const search = libraryView.querySelector('.my-library-search');
  const date = libraryView.querySelector('[aria-label="Filter by date"]');
  const format = libraryView.querySelector('[aria-label="Filter by format"]');
  [search, date, format].filter(Boolean).forEach(control => control.addEventListener('input', clear));
  [date, format].filter(Boolean).forEach(control => control.addEventListener('change', clear));

  styles();
  setupHeader();
  setupRows();
  setupBar();
  updateBar();
})();