(()=>{
  if(window.SvaraSoundExistingVoicePickerVisibility)return;

  const root=()=>document.getElementById('soundWorkspace');

  function sync(){
    const r=root();
    const trigger=r?.querySelector('.sound-source-picker-trigger');
    if(!trigger)return false;
    const active=[...r.querySelectorAll('.sound-source-tabs .sound-source-tab')].find(tab=>tab.classList.contains('active'));
    const existing=Boolean(active&&/existing voice/i.test(active.textContent||''));
    trigger.style.display=existing?'flex':'none';
    return true;
  }

  function bind(){
    const r=root();
    if(!r||r.dataset.soundExistingVoicePickerVisibilityBound)return false;
    if(!r.querySelector('.sound-source-picker-trigger'))return false;
    r.dataset.soundExistingVoicePickerVisibilityBound='1';
    r.addEventListener('click',event=>{
      if(event.target.closest('.sound-source-tab'))queueMicrotask(sync);
    });
    window.addEventListener('svara:sound-state-change',sync);
    sync();
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{attempts++;if(bind()||attempts>200)clearInterval(timer)},50);
  window.SvaraSoundExistingVoicePickerVisibility={bind,sync};
})();
