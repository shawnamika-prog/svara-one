(() => {
  const libraryView = document.getElementById('myLibraryView');
  if (!libraryView) return;

  const foldersNav = libraryView.querySelector('.my-library-folders');
  const newFolderButton = libraryView.querySelector('.my-library-actions .my-library-action:first-child');
  if (!foldersNav || !newFolderButton) return;

  let folders = [];
  let generations = [];
  let selectedFolderId = '__all__';
  let activeFilename = '';
  let observerTimer = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  }

  function staticFolderId(button) {
    if (button.dataset.libraryFolderId) return button.dataset.libraryFolderId;
    const label = String(button.textContent || '').replace(/[▣□]/g, '').trim();
    if (label === 'Unfiled') return '__unfiled__';
    if (label === 'All generations') return '__all__';
    return null;
  }

  function closeActionMenu() {
    document.querySelectorAll('.my-library-file-menu').forEach(menu => menu.remove());
  }

  function showLibraryModal(title, body, actions) {
    document.querySelector('.my-library-folder-modal')?.remove();
    const root = document.createElement('div');
    root.className = 'my-library-folder-modal';
    root.innerHTML = `<div class="my-library-folder-modal-backdrop"></div><section class="my-library-folder-dialog" role="dialog" aria-modal="true" aria-labelledby="myLibraryFolderDialogTitle"><div class="my-library-folder-dialog-head"><div><small>MY LIBRARY</small><h3 id="myLibraryFolderDialogTitle">${escapeHtml(title)}</h3></div><button type="button" class="my-library-folder-close" aria-label="Close">×</button></div><div class="my-library-folder-dialog-body">${body}</div><div class="my-library-folder-dialog-actions"></div></section>`;
    document.body.appendChild(root);
    const close = () => root.remove();
    root.querySelector('.my-library-folder-close').addEventListener('click', close);
    root.querySelector('.my-library-folder-modal-backdrop').addEventListener('click', close);
    const actionWrap = root.querySelector('.my-library-folder-dialog-actions');
    actions.forEach(action => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `my-library-folder-dialog-button${action.primary ? ' primary' : ''}`;
      button.textContent = action.label;
      button.addEventListener('click', async () => {
        if (action.run) await action.run(root, close, button);
      });
      actionWrap.appendChild(button);
    });
    setTimeout(() => root.querySelector('input,select')?.focus(), 30);
    return root;
  }

  function injectStyles() {
    if (document.getElementById('my-library-folder-action-styles')) return;
    const style = document.createElement('style');
    style.id = 'my-library-folder-action-styles';
    style.textContent = `.my-library-folder-modal{position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:24px}.my-library-folder-modal-backdrop{position:absolute;inset:0;background:#0009;backdrop-filter:blur(4px)}.my-library-folder-dialog{position:relative;width:min(430px,calc(100vw - 32px));padding:20px;background:#081522;border:1px solid #ffffff16;border-radius:14px;box-shadow:0 24px 70px #000b;color:#b9c8d6}.my-library-folder-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.my-library-folder-dialog-head small{display:block;color:#31e3c8;font-size:9px;letter-spacing:.14em}.my-library-folder-dialog-head h3{margin:5px 0 0;color:#e7eef5;font-size:17px}.my-library-folder-close{width:30px;height:30px;border:1px solid #ffffff10;border-radius:8px;background:#0b1b29;color:#91a5b7;font-size:20px;line-height:1;cursor:pointer}.my-library-folder-dialog-body{margin:18px 0}.my-library-folder-dialog-body label{display:block;margin-bottom:7px;color:#9fb2c5;font-size:11px}.my-library-folder-dialog-body input,.my-library-folder-dialog-body select{box-sizing:border-box;width:100%;padding:11px 12px;border:1px solid #ffffff14;border-radius:9px;background:#07121d;color:#dbe6ef;outline:none;font:inherit;font-size:12px}.my-library-folder-dialog-body input:focus,.my-library-folder-dialog-body select:focus{border-color:#31e3c866}.my-library-folder-dialog-help{margin:9px 0 0;color:#71879a;font-size:11px;line-height:1.5}.my-library-folder-dialog-error{margin-top:9px;color:#ff8d8d;font-size:11px}.my-library-folder-dialog-actions{display:flex;justify-content:flex-end;gap:9px}.my-library-folder-dialog-button{padding:9px 14px;border:1px solid #ffffff12;border-radius:8px;background:#0b1b29;color:#9fb2c5;font:inherit;font-size:11px;cursor:pointer}.my-library-folder-dialog-button.primary{background:#0d2930;border-color:#31e3c855;color:#31e3c8}.my-library-folder-dialog-button:disabled{opacity:.55;cursor:default}.my-library-folder-created{animation:myLibraryFolderFlash .8s ease}@keyframes myLibraryFolderFlash{0%{background:#0d3b36}100%{background:transparent}}`;
    document.head.appendChild(style);
  }

  function renderFolders() {
    foldersNav.querySelectorAll('.my-library-folder[data-library-folder-id]').forEach(button => button.remove());
    const staticButtons = [...foldersNav.querySelectorAll('.my-library-folder')];
    const unfiled = staticButtons.find(button => staticFolderId(button) === '__unfiled__');
    folders.forEach(folder => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'my-library-folder';
      button.dataset.libraryFolderId = folder.id;
      button.innerHTML = `<span class="my-library-folder-icon">□</span>${escapeHtml(folder.name)}<span style="margin-left:auto;opacity:.55;font-size:10px">${Number(folder.itemCount)||0}</span>`;
      foldersNav.appendChild(button);
    });
    foldersNav.querySelectorAll('.my-library-folder').forEach(button => {
      button.classList.toggle('active', staticFolderId(button) === selectedFolderId || button.dataset.libraryFolderId === selectedFolderId);
    });
    if (unfiled) unfiled.classList.toggle('active', selectedFolderId === '__unfiled__');
  }

  function applyFolderFilter() {
    const rows = [...libraryView.querySelectorAll('.my-library-row')];
    if (!rows.length) return;
    const folderByFilename = new Map(generations.map(item => [String(item.filename), item.folderId || null]));
    let shown = 0;
    rows.forEach(row => {
      const filename = row.querySelector('.my-library-name strong')?.textContent?.trim() || '';
      const folderId = folderByFilename.get(filename);
      const matches = selectedFolderId === '__all__' || (selectedFolderId === '__unfiled__' ? folderId == null : folderId === selectedFolderId);
      row.hidden = !matches;
      row.style.display = matches ? '' : 'none';
      if (matches) shown++;
    });
    const filesTitle = libraryView.querySelector('.my-library-files-head strong');
    const filesCount = libraryView.querySelector('.my-library-files-head span');
    const folder = folders.find(item => item.id === selectedFolderId);
    if (filesTitle) filesTitle.textContent = selectedFolderId === '__all__' ? 'All generations' : selectedFolderId === '__unfiled__' ? 'Unfiled' : (folder?.name || 'Folder');
    if (filesCount) filesCount.textContent = `${shown} ${shown === 1 ? 'item' : 'items'}`;
    const empty = libraryView.querySelector('.my-library-empty');
    if (empty && selectedFolderId !== '__all__' && shown === 0) {
      empty.hidden = false;
      empty.innerHTML = `<div><div class="my-library-empty-icon">□</div><h3>This folder is empty</h3><p>Use Move to… from a generation's menu to add a file here.</p></div>`;
    } else if (empty && rows.some(row => !row.hidden)) {
      empty.hidden = true;
    }
  }

  async function loadFolders() {
    try {
      const [folderResponse, generationResponse] = await Promise.all([
        fetch('/api/generations/folders', { credentials:'same-origin', cache:'no-store', headers:{accept:'application/json'} }),
        fetch('/api/generations?limit=500', { credentials:'same-origin', cache:'no-store', headers:{accept:'application/json'} })
      ]);
      const folderData = await folderResponse.json().catch(() => ({}));
      const generationData = await generationResponse.json().catch(() => ({}));
      if (!folderResponse.ok) throw new Error(folderData.error || `Folder service unavailable (${folderResponse.status})`);
      if (!generationResponse.ok) throw new Error(generationData.error || `Generation service unavailable (${generationResponse.status})`);
      folders = Array.isArray(folderData.folders) ? folderData.folders : [];
      generations = Array.isArray(generationData.generations) ? generationData.generations : [];
      renderFolders();
      applyFolderFilter();
    } catch (error) {
      console.error('library_folder_load_error', error);
    }
  }

  function openNewFolder() {
    injectStyles();
    showLibraryModal('New folder', '<label for="myLibraryFolderName">Folder name</label><input id="myLibraryFolderName" type="text" maxlength="80" autocomplete="off" placeholder="e.g. Client projects"><p class="my-library-folder-dialog-help">Folders organize your generations without moving the underlying R2 audio file.</p>', [
      { label:'Cancel', run:(_root,close)=>close() },
      { label:'Create folder', primary:true, run:async(root,close,button)=>{
        const input = root.querySelector('#myLibraryFolderName');
        const name = input?.value?.trim() || '';
        if (!name) { input?.focus(); return; }
        button.disabled = true;
        try {
          const response = await fetch('/api/generations/folders', { method:'POST', credentials:'same-origin', headers:{'content-type':'application/json',accept:'application/json'}, body:JSON.stringify({name}) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || `Could not create folder (${response.status})`);
          close();
          selectedFolderId = data.folder?.id || '__all__';
          await loadFolders();
          setTimeout(() => foldersNav.querySelector(`[data-library-folder-id="${CSS.escape(selectedFolderId)}"]`)?.classList.add('my-library-folder-created'), 20);
        } catch (error) {
          button.disabled = false;
          const old = root.querySelector('.my-library-folder-dialog-error');
          if (old) old.remove();
          root.querySelector('.my-library-folder-dialog-body')?.insertAdjacentHTML('beforeend', `<div class="my-library-folder-dialog-error">${escapeHtml(error?.message || 'Could not create folder.')}</div>`);
        }
      }}
    ]);
  }

  function openMoveDialog(filename) {
    injectStyles();
    const options = `<option value="__unfiled__">Unfiled</option>${folders.map(folder => `<option value="${escapeHtml(folder.id)}">${escapeHtml(folder.name)}</option>`).join('')}`;
    showLibraryModal('Move generation', `<label for="myLibraryMoveFolder">Move “${escapeHtml(filename)}” to</label><select id="myLibraryMoveFolder">${options}</select><p class="my-library-folder-dialog-help">The audio stays in its user-scoped R2 generation path. Only its Library folder changes.</p>`, [
      { label:'Cancel', run:(_root,close)=>close() },
      { label:'Move', primary:true, run:async(root,close,button)=>{
        button.disabled = true;
        const selected = root.querySelector('#myLibraryMoveFolder')?.value || '__unfiled__';
        try {
          const response = await fetch('/api/generations/move', { method:'POST', credentials:'same-origin', headers:{'content-type':'application/json',accept:'application/json'}, body:JSON.stringify({filename,folderId:selected === '__unfiled__' ? null : selected}) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || `Could not move generation (${response.status})`);
          close();
          window.location.reload();
        } catch (error) {
          button.disabled = false;
          const old = root.querySelector('.my-library-folder-dialog-error');
          if (old) old.remove();
          root.querySelector('.my-library-folder-dialog-body')?.insertAdjacentHTML('beforeend', `<div class="my-library-folder-dialog-error">${escapeHtml(error?.message || 'Could not move generation.')}</div>`);
        }
      }}
    ]);
  }

  newFolderButton.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); openNewFolder(); });

  foldersNav.addEventListener('click', async event => {
    const button = event.target.closest('.my-library-folder');
    if (!button) return;
    const clickedFolderId = staticFolderId(button) || button.dataset.libraryFolderId;
    if (!clickedFolderId) return;
    event.preventDefault();
    event.stopPropagation();
    selectedFolderId = clickedFolderId;
    renderFolders();
    await loadFolders();
  });

  document.addEventListener('click', event => {
    const name = event.target.closest('.my-library-name');
    if (name) activeFilename = name.querySelector('strong')?.textContent?.trim() || '';
    const button = event.target.closest('.my-library-file-menu button');
    if (!button || !activeFilename) return;
    const label = button.querySelector('span:last-child')?.textContent?.trim();
    if (label !== 'Move to') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeActionMenu();
    openMoveDialog(activeFilename);
  }, true);

  const table = libraryView.querySelector('.my-library-table');
  if (table) {
    const observer = new MutationObserver(() => {
      clearTimeout(observerTimer);
      observerTimer = setTimeout(applyFolderFilter, 0);
    });
    observer.observe(table, { childList:true, subtree:true });
  }

  injectStyles();
  loadFolders();
})();
