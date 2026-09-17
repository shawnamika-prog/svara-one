(()=>{
  if(window.SvaraSoundSvaraFlowUIV4)return;
  const root=()=>document.getElementById('soundWorkspace');
  const state=()=>window.SvaraSoundStudio;

  function styles(){
    if(document.getElementById('sound-svaraflow-ui-v4-styles'))return;
    const style=document.createElement('style');
    style.id='sound-svaraflow-ui-v4-styles';
    style.textContent=`
      #soundWorkspace .sound-sf-legacy-hidden{display:none!important}
      #soundWorkspace:not(.sound-direct-active) .sound-adapter-controls{display:none!important}
      #soundWorkspace:not(.sound-direct-active) .sound-direct,
      #soundWorkspace:not(.sound-direct-active) .sound-direct-mode{display:none!important}
      #soundWorkspace.sound-direct-active .sound-sf-shell{display:none!important}
      #soundWorkspace.sound-direct-active .sound-direct,
      #soundWorkspace.sound-direct-active .sound-direct-mode{display:block!important}
      #soundWorkspace.sound-direct-active .sound-adapter-controls{display:block!important}
      #soundWorkspace .sound-sf-shell{display:block}
      #soundWorkspace .sound-sf-mode button{border:1px solid #ffffff14;border-radius:9px;background:#0b1624;color:#aebdd0;padding:7px 10px;font:700 8px Inter;cursor:pointer;text-transform:none;letter-spacing:0}
      #soundWorkspace .sound-sf-mode button:hover{border-color:#a85cff88;color:#dec9f5;background:linear-gradient(100deg,#211537,#171127);box-shadow:0 0 18px #8b5cff18}
      #soundWorkspace .sound-direct-back:hover{border-color:#a85cff88!important;color:#dec9f5!important;background:linear-gradient(100deg,#211537,#171127)!important;box-shadow:0 0 18px #8b5cff18!important}
      #soundWorkspace .sound-adapter-meta{display:none!important}
      #soundWorkspace .sound-sf-thread{scrollbar-width:thin;scrollbar-color:#7a5aa2 transparent}
      #soundWorkspace .sound-sf-textarea-wrap textarea{scrollbar-width:thin;scrollbar-color:#7a5aa2 #050a14}
      #soundWorkspace .sound-sf-thread::-webkit-scrollbar,#soundWorkspace .sound-sf-textarea-wrap textarea::-webkit-scrollbar{width:7px}
      #soundWorkspace .sound-sf-thread::-webkit-scrollbar-track,#soundWorkspace .sound-sf-textarea-wrap textarea::-webkit-scrollbar-track{background:transparent}
      #soundWorkspace .sound-sf-thread::-webkit-scrollbar-thumb,#soundWorkspace .sound-sf-textarea-wrap textarea::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#8b5db8,#4b619b);border-radius:999px;border:2px solid transparent;background-clip:padding-box}
    `;
    document.head.appendChild(style);
  }

  function hideLegacy(r){
    r.querySelectorAll('.sound-section,.sound-advanced,.sound-generate,.sound-generation-note,#soundFlowBadge,#soundInspire').forEach(node=>node.classList.add('sound-sf-legacy-hidden'));
  }

  function dedupeModeButtons(r,keep){
    const buttons=[...r.querySelectorAll('button')].filter(button=>/switch to direct mode/i.test(button.textContent||''));
    buttons.forEach(button=>{if(button!==keep)button.remove()});
  }

  function setDirectMode(r,enabled){
    r.classList.toggle('sound-direct-active',enabled);
    r.querySelector('.sound-direct')?.classList.toggle('active',enabled);
    r.querySelector('.sound-direct-mode')?.classList.toggle('active',enabled);
    const button=r.querySelector('.sound-sf-mode button');
    if(button)button.textContent=enabled?'Return to SvaraFlow':'Switch to Direct Mode';
    if(enabled)r.querySelector('.sound-adapter-controls')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function syncSourceAvailability(r){
    const mode=r.querySelector('.sound-sf-mode');
    if(!mode)return;
    const button=mode.querySelector('button');
    if(!button)return;
    const input=state()?.getState?.().input||{};
    const existingVoice=String(input.sourceType||'').toLowerCase()==='voice';
    button.hidden=existingVoice;
    if(existingVoice&&r.classList.contains('sound-direct-active'))setDirectMode(r,false);
  }

  function bind(){
    const r=root();
    if(!r)return;
    styles();
    hideLegacy(r);

    const shell=r.querySelector('.sound-sf-shell');
    if(!shell)return;
    const top=shell.querySelector('.sound-sf-top');
    if(!top)return;

    let modeButton=top.querySelector('.sound-sf-mode-button,.sound-sf-direct-toggle');
    if(!modeButton){
      const mode=top.querySelector('.sound-sf-mode');
      if(mode){
        modeButton=document.createElement('button');
        modeButton.type='button';
        modeButton.className='sound-sf-mode-button';
        modeButton.textContent='Switch to Direct Mode';
        mode.appendChild(modeButton);
      }
    }
    if(!modeButton)return;

    dedupeModeButtons(r,modeButton);

    if(!modeButton.dataset.v4Bound){
      modeButton.dataset.v4Bound='1';
      modeButton.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        setDirectMode(r,!r.classList.contains('sound-direct-active'));
      },true);
    }

    const back=r.querySelector('.sound-direct-back,.sound-direct-mode .sound-direct-back');
    if(back&&!back.dataset.v4Bound){
      back.dataset.v4Bound='1';
      back.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        setDirectMode(r,false);
      },true);
    }

    r.classList.toggle('sound-direct-active',r.classList.contains('sound-direct-active'));
    const adapter=r.querySelector('.sound-adapter-controls');
    if(adapter&&!adapter.dataset.v4Bound){
      adapter.dataset.v4Bound='1';
      adapter.setAttribute('aria-label','Provider-supported controls');
    }

    r.querySelectorAll('.sound-direct-note').forEach(note=>{
      const text='SvaraFlow disabled. Direct mode enabled';
      if(note.textContent!==text)note.textContent=text;
    });
    syncSourceAvailability(r);
  }

  bind();
  window.addEventListener('svara:sound-state-change',()=>{
    const r=root();
    if(r)syncSourceAvailability(r);
  });
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
  window.SvaraSoundSvaraFlowUIV4={bind,setDirectMode};
})();
