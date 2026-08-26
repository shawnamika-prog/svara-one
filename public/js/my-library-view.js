(() => {
  const libraryLink = document.querySelector('aside a[href="#library"]');
  const voiceLink = document.querySelector('aside a[href="#create"]');
  const voiceView = document.getElementById('voiceWorkspace');
  const libraryView = document.getElementById('myLibraryView');
  if (!libraryLink || !voiceLink || !voiceView || !libraryView) return;

  function show(view) {
    const library = view === 'library';
    voiceView.hidden = library;
    libraryView.hidden = !library;
    libraryLink.classList.toggle('active', library);
    voiceLink.classList.toggle('active', !library);
    libraryLink.setAttribute('aria-current', library ? 'page' : 'false');
    voiceLink.setAttribute('aria-current', library ? 'false' : 'page');
  }

  libraryLink.addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#library');
    show('library');
  });

  voiceLink.addEventListener('click', (event) => {
    event.preventDefault();
    history.replaceState(null, '', '#create');
    show('voice');
  });

  window.addEventListener('popstate', () => show(location.hash === '#library' ? 'library' : 'voice'));
  show(location.hash === '#library' ? 'library' : 'voice');
})();
