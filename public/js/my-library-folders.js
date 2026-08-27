(() => {
  const libraryView = document.getElementById('myLibraryView');
  if (!libraryView) return;

  const foldersNav = libraryView.querySelector('.my-library-folders');
  const newFolderButton = libraryView.querySelector('.my-library-actions .my-library-action:first-child');
  if (!foldersNav || !newFolderButton) return;

  let folders = [];
  let generations = [];
  let selectedFolderId = '__unfiled__';
  let activeFilename = '';
  let observerTimer = null;
  let folderMenu = null;

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

  function closeFolderMenu() {
    if (folderMenu) { folderMenu.remove(); folderMenu = null; }
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
      button.className = `my-library-folder-dialog-button${action.primary ? ' primary' : ''}${action.danger ? ' danger' : ''}`;
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
    style.textContent = `.my-library-folder-modal{position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;padding:24px}.my-library-folder-modal-backdrop{position:absolute;inset:0;background:#0009;backdrop-filter:blur(4px)}.my-library-folder-dialog{position:relative;width:min(430px,calc(100vw - 32px));padding:20px;background:#081522;border:1px solid #ffffff16;border-radius:14px;box-shadow:0 24px 70px #000b;color:#b9c8d6}.my-library-folder-dialog-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.my-library-folder-dialog-head small{display:block;color:#31e3c8;font-size:9px;letter-spacing:.14em}.my-library-folder-dialog-head h3{margin:5px 0 0;color:#e7eef5;font-size:17px}.my-library-folder-close{width:30px;height:30px;border:1px solid #ffffff10;border-radius:8px;background:#0b1b29;color:#91a5b7;font-size:20px;line-height:1;cursor:pointer}.my-library-folder-dialog-body{margin:18px 0}.my-library-folder-dialog-body label{display:block;margin-bottom:7px;color:#9fb2c5;font-size:11px}.my-library-folder-dialog-body input,.my-library-folder-dialog-body select{box-sizing:border-box;width:100%;padding:11px 12px;border:1px solid #ffffff14;border-radius:9px;background:#07121d;color:#dbe6ef;outline:none;font:inherit;font-size:12px}.my-library-folder-dialog-body input:focus,.my-library-folder-dialog-body select:focus{border-color:#31e3c866}.my-library-folder-dialog-help{margin:9px 0 0;color:#71879a;font-size:11px;line-height:1.5}.my-library-folder-dialog-error{margin-top:9px;color:#ff8d8d;font-size:11px}.my-library-folder-dialog-actions{display:flex;justify-content:flex-end;gap:9px}.my-library-folder-dialog-button{padding:9px 14px;border:1px solid #ffffff12;border-radius:8px;background:#0b1b29;color:#9fb2c5;font:inherit;font-size:11px;cursor:pointer}.my-library-folder-dialog-button.primary{background:#0d2930;border-color:#31e3c855;color:#31e3c8}.my-library-folder-dialog-button.danger{background:#291418;border-color:#ff7d7d44;color:#ff9a9a}.my-library-folder-dialog-button:disabled{opacity:.55;cursor:default}.my-library-folder-created{animation:myLibraryFolderFlash .8s ease}@keyframes myLibraryFolderFlash{0%{background:#0d3b36}100%{background:transparent}}.my-library-folder-row{display:flex;align-items:center;gap:3px;width:100%}.my-library-folder-row>.my-library-folder{flex:1;min-width:0}.my-library-folder-more{flex:0 0 28px;width:28px;height:28px;border:0;border-radius:7px;background:transparent;color:#71869a;font-size:17px;line-height:1;cursor:pointer;opacity:.65}.my-library-folder-more:hover,.my-library-folder-more:focus-visible{background:#0a1d2b;color:#31e3c8;opacity:1;outline:none}.my-library-folder-menu{position:fixed;z-index:1050;min-width:140px;padding:6px;background:#081522;border:1px solid #ffffff16;border-radius:10px;box-shadow:0 16px 36px #0009}.my-library-folder-menu button{display:block;width:100%;padding:9px 11px;border:0;border-radius:7px;background:transparent;color:#9fb2c5;text-align:left;font:inherit;font-size:11px;cursor:pointer}.my-library-folder-menu button:hover{background:#0a1d2b;color:#31e3c8}.my-library-folder-menu button.danger:hover{color:#ff8b8b}`;
    document.head.appendChild(style);
  }

  function renderFolders() {
    foldersNav.querySelectorAll('.my-library-folder-row[data-library-folder-id]').forEach(row => row.remove());
    const staticButtons = [...foldersNav.querySelectorAll('.my-library-folder')];
    const unfiled = staticButtons.find(button => staticFolderId(button) === '__unfiled__');
    folders.forEach(folder => {
      const row = document.createElement('div');
      row.className = 'my-library-folder-row';
      row.dataset.libraryFolderId = folder.id;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'my-library-folder';
      button.dataset.libraryFolderId = folder.id;
      button.innerHTML = `<span class="my-library-folder-icon">□</span><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(folder.name)}</span><span style="margin-left:auto;opacity:.55;font-size:10px">${Number(folder.itemCount)||0}</span>`;
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'my-library-folder-more';
      more.dataset.folderAction = 'true';
      more.dataset.libraryFolderId = folder.id;
      more.setAttribute('aria-label', `Manage ${folder.name}`);
      more.textContent = '⋯';
      row.append(button, more);
      foldersNav.appendChild(row);
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
    showLibraryModal('New folder', '<label for="myLibraryFolderName">Folder name</label><input id="myLibraryFolderName" type="text" maxlength="80" autocomplete="off" placeholder="e.g. Client projects"><p class="my-library-folder-dialog-help">Folders organize your generations so you can find them quickly.</p>', [
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
          selectedFolderId = data.folder?.id || '__unfiled__';
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

  function openRenameFolder(folder) {
    injectStyles();
    const root = showLibraryModal('Rename folder', '<label for="myLibraryRenameFolder">Folder name</label><input id="myLibraryRenameFolder" type="text" maxlength="80" autocomplete="off" spellcheck="false"><p class="my-library-folder-dialog-help">Rename the folder without changing any files inside it.</p>', [
      { label:'Cancel', run:(_root,close)=>close() },
      { label:'Save changes', primary:true, run:async(root,close,button)=>{
        const input = root.querySelector('#myLibraryRenameFolder');
        const name = input?.value?.trim() || '';
        if (!name) { input?.focus(); return; }
        button.disabled = true;
        try {
          const response = await fetch('/api/generations/folders/rename', { method:'POST', credentials:'same-origin', headers:{'content-type':'application/json',accept:'application/json'}, body:JSON.stringify({folderId:folder.id,name}) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || `Could not rename folder (${response.status})`);
          close();
          await loadFolders();
        } catch (error) {
          button.disabled = false;
          const old = root.querySelector('.my-library-folder-dialog-error');
          if (old) old.remove();
          root.querySelector('.my-library-folder-dialog-body')?.insertAdjacentHTML('beforeend', `<div class="my-library-folder-dialog-error">${escapeHtml(error?.message || 'Could not rename folder.')}</div>`);
        }
      }}
    ]);
    const input = root.querySelector('#myLibraryRenameFolder');
    if (input) input.value = folder.name;
  }

  function openDeleteFolder(folder) {
    injectStyles();
    const count = Number(folder.itemCount) || 0;
    const fileText = count === 1 ? '1 file' : `${count} files`;
    showLibraryModal(`Delete “${folder.name}”?`, `<p class="my-library-folder-dialog-help" style="margin-top:0">This will permanently delete the folder and ${fileText} inside it. The files will also be permanently removed from your SvaraONE storage.</p><p class="my-library-folder-dialog-help">This action cannot be undone.</p>`, [
      { label:'Cancel', run:(_root,close)=>close() },
      { label:'Delete folder', danger:true, run:async(root,close,button)=>{
        button.disabled = true;
        button.textContent = 'Deleting…';
        try {
          const response = await fetch('/api/generations/folders/delete', { method:'POST', credentials:'same-origin', headers:{'content-type':'application/json',accept:'application/json'}, body:JSON.stringify({folderId:folder.id}) });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(data.error || `Could not delete folder (${response.status})`);
          selectedFolderId = '__unfiled__';
          close();
          await loadFolders();
        } catch (error) {
          button.disabled = false;
          button.textContent = 'Delete folder';
          const old = root.querySelector('.my-library-folder-dialog-error');
          if (old) old.remove();
          root.querySelector('.my-library-folder-dialog-body')?.insertAdjacentHTML('beforeend', `<div class="my-library-folder-dialog-error">${escapeHtml(error?.message || 'Could not delete folder.')}</div>`);
        }
      }}
    ]);
  }

  function openFolderMenu(folder, trigger) {
    closeFolderMenu();
    const menu = document.createElement('div');
    menu.className = 'my-library-folder-menu';
    menu.innerHTML = '<button type="button" data-folder-action="rename">Rename</button><button type="button" class="danger" data-folder-action="delete">Delete folder</button>';
    document.body.appendChild(menu);
    folderMenu = menu;
    const rect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(rect.right - menuRect.width, window.innerWidth - menuRect.width - 12))}px`;
    menu.style.top = `${Math.max(12, Math.min(rect.bottom + 5, window.innerHeight - menuRect.height - 12))}px`;
    menu.querySelector('[data-folder-action="rename"]').addEventListener('click', event => { event.stopPropagation(); closeFolderMenu(); openRenameFolder(folder); });
    menu.querySelector('[data-folder-action="delete"]').addEventListener('click', event => { event.stopPropagation(); closeFolderMenu(); openDeleteFolder(folder); });
  }

  newFolderButton.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); openNewFolder(); });

  foldersNav.addEventListener('click', async event => {
    const more = event.target.closest('.my-library-folder-more');
    if (more) {
      event.preventDefault();
      event.stopPropagation();
      const folder = folders.find(item => String(item.id) === String(more.dataset.libraryFolderId));
      if (folder) openFolderMenu(folder, more);
      return;
    }
    const button = event.target.closest('.my-library-folder');
    if (!button) return;
    const clickedFolderId = staticFolderId(button) || button.dataset.libraryFolderId;
    if (!clickedFolderId) return;
    event.preventDefault();
    event.stopPropagation();
    closeFolderMenu();
    selectedFolderId = clickedFolderId;
    renderFolders();
    await loadFolders();
  });

  document.addEventListener('click', event => {
    if (folderMenu && !folderMenu.contains(event.target) && !event.target.closest('.my-library-folder-more')) closeFolderMenu();
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

  window.addEventListener('resize', closeFolderMenu);
  window.addEventListener('scroll', closeFolderMenu, true);

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
