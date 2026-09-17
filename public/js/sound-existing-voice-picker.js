(()=>{
  if(window.SvaraSoundExistingVoicePicker)return;

  const state=()=>window.SvaraSoundStudio;
  const root=()=>document.getElementById('soundWorkspace');
  const esc=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const time=value=>{const s=Math.max(0,Number(value)||0),m=Math.floor(s/60),sec=Math.floor(s%60).toString().padStart(2,'0');return `${m}:${sec}`};

  let voices=[];
  let activeFolder='all';
  let searchTerm='';
  let previewAudio=null;
  let previewId=null;

  function styles(){
    if(document.getElementById('sound-existing-voice-picker-styles'))return;
    const style=document.createElement('style');
    style.id='sound-existing-voice-picker-styles';
    style.textContent=`
      #soundWorkspace .sound-source-picker-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #ffffff0d;border-radius:9px;background:#0b1524;color:#dbe7f3;padding:10px 11px;font:600 10px Inter;cursor:pointer;text-align:left}
      #soundWorkspace .sound-source-picker-trigger:hover{border-color:#a85cff66;background:#101525;color:#f0e4ff}
      #soundWorkspace .sound-source-picker-copy{min-width:0;overflow:hidden}.sound-source-picker-copy strong{display:block;font-size:10px}.sound-source-picker-copy small{display:block;margin-top:3px;color:#697c91;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sound-source-picker-chevron{color:#9a6cff;font-size:13px;line-height:1}
      .sound-voice-picker-overlay{position:fixed;inset:0;z-index:10000;display:none;place-items:center;padding:24px;background:#02050bd9;backdrop-filter:blur(10px)}
      .sound-voice-picker-overlay.open{display:grid}
      .sound-voice-picker{width:min(920px,calc(100vw - 32px));height:min(680px,calc(100vh - 48px));display:grid;grid-template-columns:190px minmax(0,1fr);border:1px solid #ffffff14;border-radius:18px;background:linear-gradient(180deg,#091322,#060d18);box-shadow:0 28px 90px #0009;overflow:hidden;color:#dbe7f3}
      .sound-voice-picker-sidebar{border-right:1px solid #ffffff0b;padding:17px 12px;background:#07101b}.sound-voice-picker-sidebar-head{padding:3px 8px 12px}.sound-voice-picker-sidebar-head strong{display:block;font-size:11px;letter-spacing:.1em}.sound-voice-picker-sidebar-head small{display:block;margin-top:4px;color:#63768d;font-size:8px;line-height:1.5}
      .sound-voice-picker-folder{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;border:0;border-radius:9px;background:transparent;color:#8396aa;padding:9px 8px;font:600 9px Inter;cursor:pointer;text-align:left}.sound-voice-picker-folder:hover{background:#101725;color:#d9e2ec}.sound-voice-picker-folder.active{background:#28183f;color:#e0c1ff}.sound-voice-picker-folder-count{font-size:8px;color:#5f7389}.sound-voice-picker-folder.active .sound-voice-picker-folder-count{color:#b789df}
      .sound-voice-picker-main{display:flex;flex-direction:column;min-width:0}.sound-voice-picker-head{padding:17px 18px 14px;border-bottom:1px solid #ffffff0b}.sound-voice-picker-title{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}.sound-voice-picker-title strong{font-size:15px;letter-spacing:-.02em}.sound-voice-picker-close{width:30px;height:30px;border:1px solid #ffffff10;border-radius:9px;background:#0a1523;color:#91a3b6;font-size:16px;cursor:pointer}.sound-voice-picker-close:hover{border-color:#a85cff66;color:#e0c1ff}
      .sound-voice-picker-tools{display:flex;align-items:center;gap:9px;margin-top:12px}.sound-voice-picker-search{flex:1;min-width:0;border:1px solid #ffffff10;border-radius:9px;background:#050a14;color:#e9f1f8;padding:10px 11px;font:500 10px Inter;outline:none}.sound-voice-picker-search:focus{border-color:#a85cff66;box-shadow:0 0 0 3px #a75cff0c}.sound-voice-picker-count{color:#60748a;font-size:8px;white-space:nowrap}
      .sound-voice-picker-list{flex:1;overflow:auto;padding:14px 16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;gap:9px;scrollbar-width:thin;scrollbar-color:#6e4e99 transparent}.sound-voice-picker-list::-webkit-scrollbar{width:7px}.sound-voice-picker-list::-webkit-scrollbar-track{background:transparent}.sound-voice-picker-list::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#8c5bb7,#4b619d);border-radius:999px;border:2px solid transparent;background-clip:padding-box}
      .sound-voice-picker-card{min-width:0;border:1px solid #ffffff0d;border-radius:12px;background:#09111e;padding:11px;display:flex;flex-direction:column;gap:9px}.sound-voice-picker-card.selected{border-color:#a85cff55;background:linear-gradient(145deg,#161126,#0a1220);box-shadow:inset 0 0 24px #9b63ff08}.sound-voice-picker-card-top{display:flex;align-items:center;gap:9px}.sound-voice-picker-avatar{width:30px;height:30px;flex:0 0 30px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#586cff,#b85cff);color:#fff;font:800 10px Inter}.sound-voice-picker-copy{min-width:0;flex:1}.sound-voice-picker-copy strong{display:block;color:#dbe6f0;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sound-voice-picker-copy small{display:block;margin-top:3px;color:#687b91;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sound-voice-picker-play{width:28px;height:28px;flex:0 0 28px;border:1px solid #a85cff3d;border-radius:50%;background:#18122a;color:#c98aff;display:grid;place-items:center;cursor:pointer;font-size:9px}.sound-voice-picker-play:hover{border-color:#a85cff88;background:#211735}.sound-voice-picker-wave{height:26px;display:flex;align-items:center;gap:2px;padding:0 1px;overflow:hidden}.sound-voice-picker-wave i{width:2px;border-radius:99px;background:#7253a8;opacity:.72}.sound-voice-picker-meta{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#60738a;font-size:8px}.sound-voice-picker-meta span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sound-voice-picker-use{width:100%;border:1px solid #ffffff12;border-radius:8px;background:#0b1624;color:#b7c6d5;padding:8px 9px;font:700 9px Inter;cursor:pointer}.sound-voice-picker-use:hover{border-color:#a85cff66;color:#e0c1ff;background:#121327}.sound-voice-picker-card.selected .sound-voice-picker-use{border-color:#a85cff66;background:linear-gradient(105deg,#593e82,#7246a0);color:#fff}
      .sound-voice-picker-empty{grid-column:1/-1;display:grid;place-items:center;min-height:240px;padding:30px;text-align:center;color:#667b92}.sound-voice-picker-empty strong{display:block;color:#aebfd0;font-size:11px}.sound-voice-picker-empty span{display:block;margin-top:5px;font-size:8px;line-height:1.6}
      @media(max-width:720px){.sound-voice-picker{grid-template-columns:1fr;height:min(720px,calc(100vh - 24px));}.sound-voice-picker-sidebar{display:none}.sound-voice-picker-list{grid-template-columns:1fr;padding:12px}.sound-voice-picker-head{padding:14px 13px 12px}.sound-voice-picker-overlay{padding:12px}}
    `;
    document.head.appendChild(style);
  }

  function stopPreview(){
    if(previewAudio){previewAudio.pause();previewAudio.currentTime=0;previewAudio=null;}
    previewId=null;
  }

  function preview(voice){
    const url=voice?.filename?`/api/generations/media?filename=${encodeURIComponent(voice.filename)}`:'';
    if(!url)return;
    if(previewId===voice.id&&previewAudio&&!previewAudio.paused){stopPreview();renderList();return;}
    stopPreview();
    previewAudio=new Audio(url);previewAudio.preload='metadata';previewId=voice.id;
    previewAudio.addEventListener('ended',()=>{stopPreview();renderList()});
    previewAudio.addEventListener('error',()=>{stopPreview();renderList()});
    previewAudio.play().then(()=>renderList()).catch(()=>{stopPreview();renderList()});
    renderList();
  }

  function folders(){
    const map=new Map();
    voices.forEach(v=>{const key=v.folderId||'unfiled';const name=v.folderName||'Unfiled';if(!map.has(key))map.set(key,{id:key,name,count:0});map.get(key).count++;});
    return [{id:'all',name:'All Voices',count:voices.length},{id:'unfiled',name:'Unfiled',count:map.get('unfiled')?.count||0},...Array.from(map.values()).filter(f=>f.id!=='unfiled').sort((a,b)=>a.name.localeCompare(b.name))];
  }

  function filtered(){
    const q=searchTerm.toLowerCase();
    return voices.filter(v=>{
      const folderMatch=activeFolder==='all'||(activeFolder==='unfiled'?!v.folderId:String(v.folderId)===String(activeFolder));
      const text=`${v.voiceName||''} ${v.filename||''} ${v.folderName||''}`.toLowerCase();
      return folderMatch&&(!q||text.includes(q));
    });
  }

  function renderList(){
    const list=document.querySelector('.sound-voice-picker-list');if(!list)return;
    const items=filtered();
    const current=state()?.getState?.().input||{};
    list.innerHTML=items.length?items.map(v=>{
      const selected=String(current.sourceAssetId||'')===String(v.id);
      const bars=Array.from({length:24},(_,i)=>`<i style="height:${6+((i*13)%17)}px"></i>`).join('');
      return `<article class="sound-voice-picker-card${selected?' selected':''}">
        <div class="sound-voice-picker-card-top"><span class="sound-voice-picker-avatar">${esc(String(v.voiceName||'V').slice(0,1).toUpperCase())}</span><div class="sound-voice-picker-copy"><strong>${esc(v.voiceName||'Voice')}</strong><small>${esc(v.folderName||'Unfiled')} · ${esc(v.filename||'')}</small></div><button class="sound-voice-picker-play" type="button" data-preview-id="${esc(v.id)}" aria-label="${previewId===v.id?'Pause':'Play'} preview">${previewId===v.id?'Ⅱ':'▶'}</button></div>
        <div class="sound-voice-picker-wave" aria-hidden="true">${bars}</div>
        <div class="sound-voice-picker-meta"><span>${time(v.durationSeconds)}</span><span>${v.script?'Script available':'No script'}</span></div>
        <button class="sound-voice-picker-use" type="button" data-use-id="${esc(v.id)}">${selected?'Using this Voice':'Use this Voice'}</button>
      </article>`;
    }).join(''):`<div class="sound-voice-picker-empty"><div><strong>No Voices found</strong><span>Try another folder or search term.</span></div></div>`;
    list.querySelectorAll('[data-preview-id]').forEach(button=>button.addEventListener('click',()=>{const voice=voices.find(v=>String(v.id)===String(button.dataset.previewId));if(voice)preview(voice)}));
    list.querySelectorAll('[data-use-id]').forEach(button=>button.addEventListener('click',()=>{const voice=voices.find(v=>String(v.id)===String(button.dataset.useId));if(voice)selectVoice(voice)}));
    const count=document.querySelector('.sound-voice-picker-count');if(count)count.textContent=`${items.length} Voice${items.length===1?'':'s'}`;
  }

  function renderFolders(){
    const host=document.querySelector('.sound-voice-picker-sidebar');if(!host)return;
    const fs=folders();
    host.innerHTML=`<div class="sound-voice-picker-sidebar-head"><strong>VOICE LIBRARY</strong><small>Choose from your Voices and custom folders.</small></div>`+fs.map(f=>`<button type="button" class="sound-voice-picker-folder${activeFolder===f.id?' active':''}" data-folder-id="${esc(f.id)}"><span>${esc(f.name)}</span><span class="sound-voice-picker-folder-count">${f.count}</span></button>`).join('');
    host.querySelectorAll('[data-folder-id]').forEach(button=>button.addEventListener('click',()=>{activeFolder=button.dataset.folderId;renderFolders();renderList()}));
  }

  function close(){stopPreview();document.querySelector('.sound-voice-picker-overlay')?.classList.remove('open');}

  function selectVoice(voice){
    const select=root()?.querySelector('.sound-source-select');
    if(select){
      if(![...select.options].some(option=>String(option.value)===String(voice.id))){
        const option=document.createElement('option');option.value=String(voice.id);option.textContent=`${voice.voiceName||'Voice'} · ${voice.filename||''}`;select.appendChild(option);
      }
      select.value=String(voice.id);
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
    const script=String(voice.script||'').trim();
    state()?.setInput?.({sourceType:'voice',sourceAssetId:String(voice.id),sourceScript:script,sourceVoiceContext:{id:String(voice.id),name:String(voice.voiceName||'Voice'),filename:String(voice.filename||''),folderId:voice.folderId||null,folderName:String(voice.folderName||'Unfiled'),script}});
    const prompt=root()?.querySelector('#soundPrompt');
    if(prompt&&!prompt.value.trim())prompt.placeholder='Tell SvaraFlow what kind of Sound you want to explore for this voiceover…';
    window.dispatchEvent(new CustomEvent('svara:sound-voice-context-ready',{detail:{...voice}}));
    const trigger=root()?.querySelector('.sound-source-picker-trigger');
    if(trigger){trigger.querySelector('.sound-source-picker-copy').innerHTML=`<strong>${esc(voice.voiceName||'Voice')}</strong><small>${esc(voice.folderName||'Unfiled')} · ${esc(voice.filename||'')}</small>`;}
    close();
  }

  async function loadVoices(){
    const response=await fetch('/api/generations?limit=500&includeScript=1',{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data?.error||`Voice library unavailable (${response.status})`);
    voices=(Array.isArray(data.generations)?data.generations:[]).filter(item=>String(item.status||'')==='ready'&&item.id);
    renderFolders();renderList();
  }

  function open(){
    const overlay=document.querySelector('.sound-voice-picker-overlay');if(!overlay)return;
    overlay.classList.add('open');
    const search=document.querySelector('.sound-voice-picker-search');
    if(search){search.focus();search.select()}
    loadVoices().catch(()=>{const list=document.querySelector('.sound-voice-picker-list');if(list)list.innerHTML='<div class="sound-voice-picker-empty"><div><strong>Voice library unavailable</strong><span>Could not load your Voices right now.</span></div></div>'});
  }

  function ensureModal(){
    if(document.querySelector('.sound-voice-picker-overlay'))return;
    const overlay=document.createElement('div');overlay.className='sound-voice-picker-overlay';overlay.innerHTML=`<div class="sound-voice-picker" role="dialog" aria-modal="true" aria-labelledby="soundVoicePickerTitle"><aside class="sound-voice-picker-sidebar"></aside><main class="sound-voice-picker-main"><header class="sound-voice-picker-head"><div class="sound-voice-picker-title"><div><strong id="soundVoicePickerTitle">Choose an Existing Voice</strong><div style="margin-top:4px;color:#667a91;font-size:8px;line-height:1.5">Select a Voice to bring its audio and script into the Sound workflow.</div></div><button type="button" class="sound-voice-picker-close" aria-label="Close">×</button></div><div class="sound-voice-picker-tools"><input class="sound-voice-picker-search" type="search" placeholder="Search Voices or folders…" aria-label="Search Voices"><span class="sound-voice-picker-count">0 Voices</span></div></header><div class="sound-voice-picker-list"></div></main></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',event=>{if(event.target===overlay)close()});
    overlay.querySelector('.sound-voice-picker-close')?.addEventListener('click',close);
    overlay.querySelector('.sound-voice-picker-search')?.addEventListener('input',event=>{searchTerm=String(event.target.value||'');renderList()});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
  }

  function bind(){
    styles();
    const r=root();if(!r||r.dataset.soundExistingVoicePickerBound)return;
    const source=r.querySelector('.sound-source');if(!source)return;
    const select=source.querySelector('.sound-source-select');if(!select)return;
    r.dataset.soundExistingVoicePickerBound='1';
    select.hidden=true;
    let trigger=source.querySelector('.sound-source-picker-trigger');
    if(!trigger){
      trigger=document.createElement('button');trigger.type='button';trigger.className='sound-source-picker-trigger';trigger.innerHTML='<span class="sound-source-picker-copy"><strong>Choose an existing Voice…</strong><small>Your Voice Library</small></span><span class="sound-source-picker-chevron">›</span>';select.insertAdjacentElement('beforebegin',trigger);
      trigger.addEventListener('click',open);
    }
    const tabs=[...source.querySelectorAll('.sound-source-tab')];
    const syncTab=()=>{
      const voiceActive=source.querySelector('.sound-source-tab[data-source="voice"]')?.classList.contains('active');
      trigger.hidden=!voiceActive;
      if(!voiceActive)state()?.setInput?.({sourceType:null,sourceAssetId:null,sourceScript:'',sourceVoiceContext:null});
    };
    tabs.forEach(tab=>tab.addEventListener('click',syncTab));
    syncTab();
    ensureModal();
  }

  window.SvaraSoundExistingVoicePicker={bind,open,close,selectVoice};
  let attempts=0;
  const tryBind=()=>{if(root()?.querySelector('.sound-source'))bind();else if(attempts++<40)setTimeout(tryBind,50)};
  tryBind();
})();