(() => {
  let patched = false;

  function patchRefresh() {
    const library = window.SvaraLibrary;
    const activeFolder = document.querySelector('.my-library-folder.active');
    if (patched || !library?.refresh || !activeFolder) return;

    const originalRefresh = library.refresh;
    const wrappedRefresh = async (...args) => {
      const result = await originalRefresh(...args);
      const currentFolder = document.querySelector('.my-library-folder.active');
      if (currentFolder) {
        currentFolder.click();
      }
      return result;
    };

    wrappedRefresh.__svaraFoldersSync = true;
    library.refresh = wrappedRefresh;
    patched = true;
  }

  patchRefresh();
  const timer = window.setInterval(() => {
    patchRefresh();
    if (patched) window.clearInterval(timer);
  }, 100);
})();
