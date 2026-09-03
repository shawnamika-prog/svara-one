(()=>{
  const workspace=document.querySelector('.workspace');
  const voiceView=document.getElementById('voiceWorkspace');
  const libraryView=document.getElementById('myLibraryView');
  const voiceLink=document.querySelector('aside a[href="#voice"]');
  const soundLink=document.querySelector('aside a[href="#sound"]');
  const videoLink=document.querySelector('aside a[href="#video"]');
  const composeLink=document.querySelector('aside a[href="#compose"]');
  const libraryLink=document.querySelector('aside a[href="#library"]');
  if(!workspace||!voiceView||!libraryView||!voiceLink||!libraryLink)return;

  const assets={
    voice:'/api/branding/studio-voice-card.png',
    sound:'/api/branding/studio-sound-card.png',
    video:'/api/branding/studio-video-card.png',
    compose:'/api/branding/studio-compose-card.png'
  };

  const icons={
    voice:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 3v18M23 10v4"/></svg>',
    sound:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h4l5 4V5.5l-5 4z"/><path d="M17 9.2a4.2 4.2 0 0 1 0 5.6M19.5 6.8a7.5 7.5 0 0 1 0 10.4"/></svg>',
    video:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 6-3v10l-6-3z"/></svg>',
    compose:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7z"/><path d="m19 3 .7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7z"/></svg>'
  };

  const landing=document.createElement('section');
  landing.id='studioLanding';
  landing.className='studio-landing';
  landing.innerHTML=`
    <div class="studio-landing-hero">
      <p class="studio-landing-eyebrow">WELCOME TO SVARAONE STUDIO</p>
      <h1>What do you <span>want to create?</span></h1>
      <p class="studio-landing-lede">Create with voice, sound and video — or let SvaraFlow orchestrate your idea into one complete composition.</p>
    </div>
    <div class="studio-landing-grid">
      <a href="#voice" class="studio-domain-card" data-domain="voice" aria-label="Open Voice workspace">
        <img src="${assets.voice}" alt="" loading="eager" decoding="async">
        <span class="studio-card-top">${icons.voice}</span>
        <div class="studio-card-copy"><p class="studio-card-kicker">VOICE</p><h2>Create voices that connect.</h2><p class="studio-card-description">Natural, expressive voice creation for real creative work.</p><span class="studio-card-cta">Explore Voice <span aria-hidden="true">→</span></span></div>
      </a>
      <a href="#sound" class="studio-domain-card" data-domain="sound" aria-label="Open Sound workspace">
        <img src="${assets.sound}" alt="" loading="lazy" decoding="async">
        <span class="studio-card-top">${icons.sound}</span>
        <div class="studio-card-copy"><p class="studio-card-kicker">SOUND</p><h2>Create sound that moves.</h2><p class="studio-card-description">Music, SFX and sonic worlds built for your projects.</p><span class="studio-card-cta">Explore Sound <span aria-hidden="true">→</span></span></div>
      </a>
      <a href="#video" class="studio-domain-card" data-domain="video" aria-label="Open Video workspace">
        <img src="${assets.video}" alt="" loading="lazy" decoding="async">
        <span class="studio-card-top">${icons.video}</span>
        <div class="studio-card-copy"><p class="studio-card-kicker">VIDEO</p><h2>Create videos that inspire.</h2><p class="studio-card-description">Bring ideas to life through cinematic visual creation.</p><span class="studio-card-cta">Explore Video <span aria-hidden="true">→</span></span></div>
      </a>
    </div>
    <a href="#compose" class="studio-compose-card" aria-label="Compose with SvaraFlow">
      <img src="${assets.compose}" alt="" loading="lazy" decoding="async">
      <div class="studio-compose-copy"><p class="studio-compose-kicker">HAVE AN IDEA?</p><h2>Compose with <span>SvaraFlow</span></h2><p>Describe what you want to create and SvaraFlow understands your intent, orchestrates the right creative capabilities, and brings voice, sound and video into a single creative composition.</p><span class="studio-compose-cta">Start creating with SvaraFlow <span aria-hidden="true">→</span></span></div>
    </a>
    <div class="studio-landing-footer">ONE Intelligent Orchestration . THREE Creative Domains . ONE Studio</div>`;
  workspace.prepend(landing);

  const placeholder=document.createElement('section');
  placeholder.id='studioPlaceholder';
  placeholder.className='studio-domain-placeholder';
  placeholder.hidden=true;
  workspace.appendChild(placeholder);

  function setActive(active){
    [voiceLink,soundLink,videoLink,composeLink,libraryLink].filter(Boolean).forEach(link=>link.classList.remove('active'));
    const link=({voice:voiceLink,sound:soundLink,video:videoLink,compose:composeLink,library:libraryLink})[active];
    if(link)link.classList.add('active');
  }

  function show(view,updateHash=true){
    if(updateHash)history.replaceState(null,'',`#${view}`);
    landing.hidden=view!=='studio';
    voiceView.hidden=view!=='voice';
    libraryView.hidden=view!=='library';
    placeholder.hidden=!['sound','video','compose'].includes(view);
    if(['sound','video','compose'].includes(view)){
      const labels={sound:['Sound','Sound workspace'],video:['Video','Video workspace'],compose:['Compose','SvaraFlow composition workspace']};
      const [title,subtitle]=labels[view];
      placeholder.innerHTML=`<div class="placeholder-panel"><small>${title.toUpperCase()}</small><h2>${subtitle}</h2><p>This workspace is being built as an independent SvaraONE domain. The Studio landing page is ready for it.</p></div>`;
    }
    setActive(view);
    if(view==='library')window.SvaraLibrary?.refresh?.();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  document.querySelector('aside .home-link')?.addEventListener('click',()=>setActive('studio'));
  voiceLink.addEventListener('click',e=>{e.preventDefault();show('voice');});
  soundLink?.addEventListener('click',e=>{e.preventDefault();show('sound');});
  videoLink?.addEventListener('click',e=>{e.preventDefault();show('video');});
  composeLink?.addEventListener('click',e=>{e.preventDefault();show('compose');});
  libraryLink.addEventListener('click',e=>{e.preventDefault();show('library');});
  landing.addEventListener('click',e=>{const card=e.target.closest('a[data-domain]');if(card){e.preventDefault();show(card.dataset.domain);return;}if(e.target.closest('.studio-compose-card')){e.preventDefault();show('compose');}});

  const initial=location.hash.replace(/^#/,'');
  show(['voice','sound','video','compose','library'].includes(initial)?initial:'studio',false);
})();