(() => {
  if (window.SvaraModal) return;

  let root = null;
  let resolver = null;
  let keyHandler = null;

  function ensureRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.className = 'svara-modal-root';
    root.hidden = true;
    root.innerHTML = `
      <section class="svara-modal" role="dialog" aria-modal="true" aria-labelledby="svaraModalTitle">
        <div class="svara-modal-head">
          <div>
            <p class="svara-modal-eyebrow">SVARAONE</p>
            <h2 id="svaraModalTitle" class="svara-modal-title"></h2>
          </div>
          <button class="svara-modal-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="svara-modal-body"></div>
        <div class="svara-modal-foot">
          <button class="svara-modal-button" type="button" data-modal-cancel>Cancel</button>
          <button class="svara-modal-button primary" type="button" data-modal-confirm>Rename</button>
        </div>
      </section>
    `;
    document.body.appendChild(root);

    const closeButton = root.querySelector('.svara-modal-close');
    const cancelButton = root.querySelector('[data-modal-cancel]');
    const confirmButton = root.querySelector('[data-modal-confirm]');

    closeButton.addEventListener('click', () => finish(null));
    cancelButton.addEventListener('click', () => finish(null));
    root.addEventListener('click', event => {
      if (event.target === root) finish(null);
    });
    confirmButton.addEventListener('click', () => {
      const input = root.querySelector('.svara-modal-input');
      finish(input ? input.value : true);
    });

    return root;
  }

  function finish(value) {
    if (!root || root.hidden) return;
    const currentResolver = resolver;
    resolver = null;
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler, true);
      keyHandler = null;
    }
    root.classList.remove('is-open');
    window.setTimeout(() => {
      if (root) root.hidden = true;
    }, 160);
    if (currentResolver) currentResolver(value);
  }

  function openRename(initialValue) {
    const modal = ensureRoot();
    const title = modal.querySelector('.svara-modal-title');
    const body = modal.querySelector('.svara-modal-body');
    const confirmButton = modal.querySelector('[data-modal-confirm]');

    if (resolver) finish(null);

    title.textContent = 'Rename generation';
    body.innerHTML = `
      <label class="svara-modal-label" for="svaraRenameInput">Generation name</label>
      <input id="svaraRenameInput" class="svara-modal-input" type="text" autocomplete="off" spellcheck="false">
      <p class="svara-modal-help">Choose a clear name for this audio asset. The MP3 extension will be preserved automatically.</p>
    `;
    confirmButton.textContent = 'Rename';

    const input = body.querySelector('#svaraRenameInput');
    input.value = String(initialValue ?? '');

    root.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-open'));

    keyHandler = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(null);
      } else if (event.key === 'Enter' && document.activeElement === input) {
        event.preventDefault();
        finish(input.value);
      }
    };
    document.addEventListener('keydown', keyHandler, true);

    window.setTimeout(() => {
      input.focus();
      input.select();
    }, 30);

    return new Promise(resolve => {
      resolver = resolve;
    });
  }

  window.SvaraModal = {
    rename: openRename
  };
})();