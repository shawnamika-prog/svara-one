(()=>{
  if(window.SvaraSoundSvaraFlowUIV4)return;
  const root=()=>document.getElementById('soundWorkspace');

  function styles(){
    if(document.getElementById('sound-svaraflow-ui-v4-styles'))return;
    const style=document.createElement('style');
    style.id='sound-svaraflow-ui-v4-styles';
    style.textContent=`
      #soundWorkspace .sound-adapter-controls{display:none}
      #soundWorkspace .sound-direct-mode{display:none;margin-top:14px;border:1px solid #ffffff0d;border-radius:16px;background:linear-gradient(180deg,#08111d,#06101a);overflow:hidden}
      #soundWorkspace .sound-direct-mode.active{display:block}
      #soundWorkspace .sound-direct-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #ffffff0b}
      #soundWorkspace .sound-direct-title{color:#dce7f3;font-size:10px;font-weight:800;letter-spacing:.12em}
      #soundWorkspace .sound-direct-back{border:1px solid #ffffff14;border-radius:9px;background:#0b1624;color:#a9bacb;padding:8px 11px;font:700 8px Inter;cursor:pointer}
      #soundWorkspace .sound-direct-body{padding:13px}
      #soundWorkspace .sound-direct-note{color:#62758b;font-size:8px;line-height:1.55;margin:0 0 9px}
      #soundWorkspace .sound-direct-textarea-wrap{border:1px solid #ffffff10;border-radius:14px;background:#050a14}
      #soundWorkspace .sound-direct-textarea-wrap textarea{display:block;width:100%;min-height:145px;max-height:280px;resize:vertical;border:0;border-radius:14px;background:transparent;color:#edf4ff;padding:15px;font:13px/1.7 Inter,system-ui,sans-serif;outline:none;overflow:auto;scrollbar-width:thin;scrollbar-color:#795a9e #050a14}
      #soundWorkspace .sound-direct-textarea-wrap textarea::-webkit-scrollbar{width:7px}
      #soundWorkspace .sound-direct-textarea-wrap textarea::-webkit-scrollbar-track{background:#050a14}
      #soundWorkspace .sound-direct-textarea-wrap textarea::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#8b5db8,#4b619b);border-radius:999px;border:2px solid #050a14}
      #soundWorkspace .sound-direct-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px}
      #soundWorkspace .sound-direct-hint{color:#596d84;font-size:8px}
      #soundWorkspace .sound-direct-generate{border:1px solid #a85cff66;border-radius:10px;padding:11px 16px;background:linear-gradient(105deg,#5d70ff,#884ff4 55%,#bd5cff);color:#fff;font:800 10px Inter;cursor:pointer;box-shadow:0 8px 24px #6c4df224}
      #soundWorkspace .sound-direct-generate:hover{transform:translateY(-1px);filter:brightness(1.06)}
      #soundWorkspace .sound-direct-generate:disabled{opacity:.65;cursor:wait;transform:none}
      #soundWorkspace .sound-direct-mode.active~.sound-adapter-controls{display:block}
      #soundWorkspace .sound-sf-top .sound-sf-mode button{border:1px solid #ffffff14;border-radius:9px;background:#0b1624;color:#aebdd0;padding:7px 10px;font:700 8px Inter;cursor:pointer;text-transform:none;letter-spacing:0}
      #soundWorkspace .sound-sf-top .sound-sf-mode button:hover{border-color:#9a63d855;color:#d8c5ee}
      #soundWorkspace.sound-direct-active .sound-sf-shell{display:none}
      #soundWorkspace.sound-direct-active .sound-direct-mode{display:block}
      #soundWorkspace.sound-direct-active .sound-adapter-controls{display:block}
      #soundWorkspace.sound-direct-active .sound-sf-top{display:none}
      @media(max-width:560px){
        #soundWorkspace .sound-direct-footer{flex-direction:column;align-items:stretch}
        #soundWorkspace .sound-direct-hint{max-width:none}
        #soundWorkspace .sound-direct-generate{width:100%}
      }
    `;
    document.head.appendChild(style);
  }

  function makeController(r,sfShell,adapter,textarea){
    if(r.dataset.soundSfV4Ready)return;
    r.dataset.soundSfV4Ready='1';

    const top=sfShell.querySelector('.sound-sf-top');
    if(!top)return;
    let modeButton=top.querySelector('.sound-sf-direct-toggle');
    if(!modeButton){
      const mode=top.querySelector('.sound-sf-mode');
      if(!mode)return;
      modeButton=document.createElement('button');
      modeButton.type='button';
      modeButton.className='sound-sf-direct-toggle';
      modeButton.textContent='Switch to Direct Mode';
      mode.appendChild(modeButton);
    }

    const direct=document.createElement('section');
    direct.className='sound-direct-mode';
    direct.innerHTML=`
      <div class="sound-direct-head">
        <strong class="sound-direct-title">DIRECT MODE</strong>
        <button type="button" class="sound-direct-back">Back to SvaraFlow</button>
      </div>
      <div class="sound-direct-body">
        <p class="sound-direct-note">Manual Sound creation. SvaraFlow is bypassed for this generation; available options come from the configured provider adapter.</p>
        <div class="sound-direct-textarea-wrap"></div>
        <div class="sound-direct-footer">
          <span class="sound-direct-hint">Enter to generate · Shift + Enter for a new line</span>
          <button type="button" class="sound-direct-generate">Generate Sound</button>
        </div>
      </div>`;

    sfShell.insertAdjacentElement('afterend',direct);
    const directWrap=direct.querySelector('.sound-direct-textarea-wrap');
    directWrap.appendChild(textarea);

    const back=direct.querySelector('.sound-direct-back');
    const generate=direct.querySelector('.sound-direct-generate');
    const hiddenLegacy=r.querySelector('.sound-generate');

    const enterDirect=()=>{
      r.classList.add('sound-direct-active');
      direct.classList.add('active');
      modeButton.textContent='Back to SvaraFlow';
      textarea.placeholder='Enter your Sound prompt...';
      textarea.focus();
      adapter?.scrollIntoView({behavior:'smooth',block:'nearest'});
    };
    const leaveDirect=()=>{
      r.classList.remove('sound-direct-active');
      direct.classList.remove('active');
      modeButton.textContent='Switch to Direct Mode';
      textarea.placeholder='Tell SvaraFlow what you want to create...';
      const composer=sfShell.querySelector('.sound-sf-textarea-wrap');
      if(composer)composer.appendChild(textarea);
      textarea.focus();
    };

    modeButton.addEventListener('click',()=>{
      if(r.classList.contains('sound-direct-active'))leaveDirect();else enterDirect();
    });
    back.addEventListener('click',leaveDirect);

    const doDirectGenerate=()=>{
      const text=String(textarea.value||'').trim();
      if(!text)return textarea.focus();
      const state=window.SvaraSoundStudio;
      state?.setInput?.({prompt:text});
      if(hiddenLegacy){
        hiddenLegacy.disabled=false;
        hiddenLegacy.click();
      }
    };
    generate.addEventListener('click',doDirectGenerate);
    textarea.addEventListener('keydown',event=>{
      if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){
        event.preventDefault();
        doDirectGenerate();
      }
    });
  }

  function bind(){
    const r=root();
    if(!r){return}
    styles();
    const sfShell=r.querySelector('.sound-sf-shell');
    const adapter=r.querySelector('.sound-adapter-controls');
    const textarea=r.querySelector('#soundPrompt');
    if(!sfShell||!adapter||!textarea)return;
    makeController(r,sfShell,adapter,textarea);
  }

  bind();
  const observer=new MutationObserver(bind);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.SvaraSoundSvaraFlowUIV4={bind};
})();
