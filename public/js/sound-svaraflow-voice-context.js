(()=>{
  if(window.SvaraSoundSvaraFlowVoiceContext)return;

  const root=()=>document.getElementById('soundWorkspace');
  const state=()=>window.SvaraSoundStudio;
  const text=value=>String(value??'').trim();
  const esc=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const MAX_PREVIEW=260;

  function styles(){
    if(document.getElementById('sound-svaraflow-voice-context-styles'))return;
    const style=document.createElement('style');
    style.id='sound-svaraflow-voice-context-styles';
    style.textContent=`
      #soundWorkspace .sound-sf-voice-context{margin:10px 14px 0;padding:10px 11px;border:1px solid #a85cff26;border-radius:12px;background:linear-gradient(145deg,#0d1321,#09111d);box-shadow:inset 0 0 24px #9b63ff06}
      #soundWorkspace .sound-sf-voice-context-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
      #soundWorkspace .sound-sf-voice-context-label{color:#8fa3b8;font-size:8px;font-weight:800;letter-spacing:.12em}
      #soundWorkspace .sound-sf-voice-context-name{color:#dfc6f3;font-size:9px;font-weight:700;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #soundWorkspace .sound-sf-voice-context-meta{margin-top:4px;color:#5f738a;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #soundWorkspace .sound-sf-voice-context-script{margin-top:8px;max-height:72px;overflow:auto;padding:8px 9px;border:1px solid #ffffff0a;border-radius:9px;background:#050a14;color:#8da0b5;font:9px/1.55 Inter,system-ui,sans-serif;scrollbar-width:thin;scrollbar-color:#6e4e99 transparent}
      #soundWorkspace .sound-sf-voice-context-script::-webkit-scrollbar{width:6px}
      #soundWorkspace .sound-sf-voice-context-script::-webkit-scrollbar-track{background:transparent}
      #soundWorkspace .sound-sf-voice-context-script::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#8c5bb7,#4b619d);border-radius:999px;border:1px solid transparent;background-clip:padding-box}
      @media(max-width:560px){#soundWorkspace .sound-sf-voice-context{margin:10px 11px 0}}
    `;
    document.head.appendChild(style);
  }

  function summary(value){
    const clean=text(value);
    if(!clean)return 'No stored script was found for this Voice.';
    return clean.length>MAX_PREVIEW?`${clean.slice(0,MAX_PREVIEW).trim()}…`:clean;
  }

  function remove(){root()?.querySelector('.sound-sf-voice-context')?.remove();}

  function startConversation(voice){
    const ui=window.SvaraSoundSvaraFlowUIV5;
    if(!ui?.startVoiceContextConversation)return false;
    return ui.startVoiceContextConversation(voice||null);
  }

  function render(voice,{autoStart=false}={}){
    const r=root();
    const shell=r?.querySelector('.sound-sf-shell');
    const top=r?.querySelector('.sound-sf-top');
    if(!shell||!top)return;
    remove();
    const script=text(voice?.script);
    if(!text(voice?.id)||!script)return;
    const card=document.createElement('section');
    card.className='sound-sf-voice-context';
    card.innerHTML=`<div class="sound-sf-voice-context-head"><span class="sound-sf-voice-context-label">VOICEOVER CONTEXT</span><span class="sound-sf-voice-context-name">${esc(voice?.name||voice?.voiceName||'Existing Voice')}</span></div><div class="sound-sf-voice-context-meta">${esc(voice?.folderName||'Unfiled')} · script attached to this Sound session</div><div class="sound-sf-voice-context-script" tabindex="0" aria-label="Existing Voice script">${esc(summary(script))}</div>`;
    top.insertAdjacentElement('afterend',card);
    if(autoStart){
      let attempts=0;
      const timer=setInterval(()=>{
        attempts++;
        if(startConversation(voice)||attempts>120)clearInterval(timer);
      },50);
    }
  }

  function syncFromState(){
    const input=state()?.getState?.().input||{};
    const voice=input.sourceType==='voice'?input.sourceVoiceContext:null;
    if(voice?.id&&text(voice.script))render(voice,{autoStart:false});else remove();
  }

  function bind(){
    styles();
    const r=root();
    if(!r)return false;
    if(r.dataset.soundSfVoiceContextBound)return true;
    r.dataset.soundSfVoiceContextBound='1';
    window.addEventListener('svara:sound-voice-context-ready',event=>{
      const voice=event.detail||{};
      if(voice?.id&&text(voice.script))render(voice,{autoStart:true});else remove();
    });
    window.addEventListener('svara:sound-state-change',event=>{
      const input=event.detail?.input||{};
      if(input.sourceType==='voice'&&input.sourceVoiceContext?.id&&text(input.sourceVoiceContext.script))render(input.sourceVoiceContext,{autoStart:false});else if(input.sourceType!=='voice')remove();
    });
    syncFromState();
    return true;
  }

  let attempts=0;
  const timer=setInterval(()=>{attempts++;if(bind()||attempts>200)clearInterval(timer)},50);
  window.SvaraSoundSvaraFlowVoiceContext={bind,render,remove,startConversation};
})();
