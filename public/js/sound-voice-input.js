(()=>{
  if(window.SvaraSoundVoiceInput)return;

  const state=()=>window.SvaraSoundStudio;
  let voices=[];
  let selected=null;
  let sourceAudio=null;
  let sourceCanvas=null;
  let sourceAnimation=0;

  const esc=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const time=value=>{const s=Math.max(0,Number(value)||0),m=Math.floor(s/60),sec=Math.floor(s%60).toString().padStart(2,'0');return `${m}:${sec}`};

  function style(){
    if(document.getElementById('sound-voice-input-styles'))return;
    const css=document.createElement('style');
    css.id='sound-voice-input-styles';
    css.textContent=`
      .sound-source{margin:18px 20px 0;padding:13px;border:1px solid #ffffff0d;border-radius:13px;background:#09111e}
      .sound-source-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
      .sound-source-head strong{font-size:10px;color:#dbe6f2;letter-spacing:.08em}.sound-source-head span{font-size:8px;color:#687b91}
      .sound-source-tabs{display:flex;gap:6px;margin-bottom:9px}.sound-source-tab{flex:1;border:1px solid #ffffff0d;border-radius:8px;background:#07101b;color:#8092a7;padding:8px;font:700 9px Inter;cursor:pointer}.sound-source-tab.active{color:#e0bdff;background:#28163d;border-color:#a85cff66}
      .sound-source-select{width:100%;border:1px solid #ffffff0d;border-radius:9px;background:#0b1524;color:#dbe7f3;padding:9px;font:600 10px Inter;outline:none}.sound-source-select:focus{border-color:#a75cff77}
      .sound-source-detail{display:none;margin-top:8px;padding:9px;border-radius:9px;background:#060b14;border:1px solid #ffffff0a}.sound-source-detail.show{display:block}.sound-source-detail strong{display:block;color:#cbd8e5;font-size:10px}.sound-source-detail small{display:block;margin-top:3px;color:#62758c;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .sound-source-output{margin-bottom:14px;padding:13px;border:1px solid #a85cff2e;border-radius:14px;background:linear-gradient(145deg,#111326,#0b1120);box-shadow:inset 0 0 26px #9c5cff08}.sound-source-output[hidden]{display:none}.sound-source-output-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.sound-source-output-head strong{font-size:11px}.sound-source-output-head span{font-size:8px;color:#8f6bb5}.sound-source-wave{height:82px;border:1px solid #ffffff0a;border-radius:10px;background:#060a14;overflow:hidden}.sound-source-wave canvas{display:block;width:100%;height:100%}.sound-source-player{display:flex;align-items:center;gap:10px;margin-top:10px}.sound-source-play{width:35px;height:35px;flex:none;border:0;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#6975ff,#bd59ff);color:#fff;cursor:pointer}.sound-source-play span{width:0;height:0;border-top:5px solid transparent;border-bottom:5px solid transparent;border-left:8px solid #fff;margin-left:2px}.sound-source-time{display:flex;justify-content:space-between;gap:8px;flex:1;color:#71839a;font-size:8px}.sound-source-time strong{color:#c4d1de;font-size:9px}.sound-source-volume{display:flex;align-items:center;gap:5px;color:#667990;font-size:7px}.sound-source-volume input{width:70px}
    `;
    document.head.appendChild(css);
  }

  function root(){return document.getElementById('soundWorkspace')}
  function outputBody(){return root()?.querySelector('.sound-output-body')}
  function prompt(){return root()?.querySelector('#soundPrompt')}

  function setInput(){
    const api=state();if(!api)return;
    if(selected){
      api.setInput({sourceType:'voice',sourceAssetId:selected.id});
    }else{
      api.setInput({sourceType:null,sourceAssetId:null});
    }
  }

  function drawSource(){
    if(!sourceCanvas)return;
    const ctx=sourceCanvas.getContext('2d');
    const rect=sourceCanvas.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    const width=Math.max(320,Math.floor(rect.width||600));
    const height=Math.max(60,Math.floor(rect.height||82));
    if(sourceCanvas.width!==width*dpr||sourceCanvas.height!==height*dpr){sourceCanvas.width=width*dpr;sourceCanvas.height=height*dpr;sourceCanvas.style.width='100%';sourceCanvas.style.height='100%'}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    const bars=70;const progress=sourceAudio&&Number.isFinite(sourceAudio.duration)&&sourceAudio.duration>0?sourceAudio.currentTime/sourceAudio.duration:0;
    for(let i=0;i<bars;i++){
      const x=i*(width/bars)+1;const base=.18+(((i*29)%71)/100)*.62;const live=sourceAudio&&!sourceAudio.paused?Math.sin(performance.now()/180+i*.43)*.08:0;const h=Math.max(5,base*(height-16)*(1+live));const y=(height-h)/2;
      ctx.globalAlpha=x<progress*width?.96:.42;ctx.fillStyle=x<progress*width?'#d36cff':'#5377ff';ctx.beginPath();ctx.roundRect(x,y,Math.max(2,width/bars-2),h,2);ctx.fill();
    }
    ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.globalAlpha=.9;ctx.fillRect(Math.max(0,Math.min(width-1,progress*width)),7,1,height-14);ctx.globalAlpha=1;
  }

  function visualise(){
    if(!sourceAudio||sourceAudio.paused||sourceAudio.ended){sourceAnimation=0;drawSource();return}
    drawSource();sourceAnimation=requestAnimationFrame(visualise);
  }

  function updateSourceTransport(){
    const box=outputBody()?.querySelector('.sound-source-output');if(!box)return;
    const now=box.querySelector('.sound-source-now'),dur=box.querySelector('.sound-source-duration');
    if(now)now.textContent=time(sourceAudio?.currentTime);if(dur)dur.textContent=time(sourceAudio?.duration);drawSource();
  }

  function wireSourceAudio(){
    if(!selected)return;
    if(sourceAudio){sourceAudio.pause();sourceAudio.src='';}
    sourceAudio=new Audio(`/api/sound/assets/${encodeURIComponent(selected.id)}`);sourceAudio.preload='metadata';sourceAudio.volume=1;sourceAudio.setAttribute('aria-hidden','true');sourceAudio.addEventListener('loadedmetadata',updateSourceTransport);sourceAudio.addEventListener('timeupdate',updateSourceTransport);sourceAudio.addEventListener('play',()=>{const b=outputBody()?.querySelector('.sound-source-play');if(b)b.innerHTML='<span style="width:7px;height:11px;border:0;border-left:3px solid #fff;border-right:3px solid #fff"></span>';if(!sourceAnimation)sourceAnimation=requestAnimationFrame(visualise)});sourceAudio.addEventListener('pause',()=>{const b=outputBody()?.querySelector('.sound-source-play');if(b)b.innerHTML='<span></span>';if(sourceAnimation){cancelAnimationFrame(sourceAnimation);sourceAnimation=0}drawSource()});sourceAudio.addEventListener('ended',()=>{sourceAudio.currentTime=0;updateSourceTransport()});sourceAudio.addEventListener('error',()=>console.warn('svara_sound_voice_preview_error'));
    document.body.appendChild(sourceAudio);
  }

  function renderSourceOutput(){
    const body=outputBody();if(!body)return;
    let box=body.querySelector('.sound-source-output');
    if(!selected){if(box)box.remove();return}
    if(!box){box=document.createElement('section');box.className='sound-source-output';body.insertBefore(box,body.firstChild)}
    box.innerHTML=`<div class="sound-source-output-head"><strong>Existing Voice</strong><span>${esc(selected.voiceName||'Voice')} · ${time(selected.durationSeconds)}</span></div><div class="sound-source-wave"><canvas></canvas></div><div class="sound-source-player"><button type="button" class="sound-source-play" aria-label="Play Existing Voice"><span></span></button><div class="sound-source-time"><strong class="sound-source-now">0:00</strong><span class="sound-source-duration">${time(selected.durationSeconds)}</span></div><label class="sound-source-volume">VOL <input type="range" min="0" max="100" value="100" aria-label="Existing Voice volume"></label></div>`;
    sourceCanvas=box.querySelector('canvas');
    const play=box.querySelector('.sound-source-play');
    play.addEventListener('click',async()=>{try{if(sourceAudio?.paused)await sourceAudio.play();else sourceAudio?.pause()}catch(error){console.warn('svara_sound_voice_play_error',error)}});
    box.querySelector('.sound-source-volume')?.querySelector('input')?.addEventListener('input',event=>{if(sourceAudio)sourceAudio.volume=Number(event.target.value)/100});
    drawSource();wireSourceAudio();
  }

  function updateDetail(select){
    const box=root()?.querySelector('.sound-source-detail');if(!box)return;
    const value=select?.value||'';selected=voices.find(v=>String(v.id)===value)||null;
    box.classList.toggle('show',Boolean(selected));
    box.innerHTML=selected?`<strong>${esc(selected.voiceName||'Voice')}</strong><small>${esc(selected.filename||'')} · ${esc(time(selected.durationSeconds))}</small>`:'';
    setInput();renderSourceOutput();
  }

  async function loadVoices(select){
    try{
      const response=await fetch('/api/generations?limit=500',{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||`Voice generations unavailable (${response.status})`);
      voices=(Array.isArray(data.generations)?data.generations:[]).filter(item=>String(item.status||'')==='ready'&&item.id);
      select.innerHTML='<option value="">Choose an existing Voice…</option>'+voices.map(v=>`<option value="${esc(v.id)}">${esc(v.voiceName||v.filename||'Voice')} · ${esc(v.filename||'')}</option>`).join('');
      if(selected?.id)select.value=selected.id;
    }catch(error){select.innerHTML='<option value="">Existing Voice unavailable</option>';console.warn('svara_sound_voice_inputs_error',error)}
  }

  function bind(){
    const r=root();if(!r||r.dataset.soundVoiceInputBound)return;r.dataset.soundVoiceInputBound='1';style();
    const promptWrap=r.querySelector('.sound-prompt');if(!promptWrap)return;
    const source=document.createElement('section');source.className='sound-source';source.innerHTML='<div class="sound-source-head"><strong>SOUND SOURCE</strong><span>Use text or an existing Voice</span></div><div class="sound-source-tabs"><button type="button" class="sound-source-tab active" data-source="text">Text</button><button type="button" class="sound-source-tab" data-source="voice">Existing Voice</button></div><select class="sound-source-select" aria-label="Existing Voice" hidden><option value="">Choose an existing Voice…</option></select><div class="sound-source-detail"></div>';
    promptWrap.insertAdjacentElement('beforebegin',source);
    const tabs=[...source.querySelectorAll('.sound-source-tab')],select=source.querySelector('.sound-source-select');
    tabs.forEach(tab=>tab.addEventListener('click',()=>{const voice=tab.dataset.source==='voice';tabs.forEach(t=>t.classList.toggle('active',t===tab));select.hidden=!voice;if(!voice){selected=null;setInput();renderSourceOutput();source.querySelector('.sound-source-detail').classList.remove('show');source.querySelector('.sound-source-detail').innerHTML=''}else loadVoices(select)}));
    select.addEventListener('change',()=>updateDetail(select));
    loadVoices(select);
  }

  function cleanup(){if(!sourceAudio)return;sourceAudio.pause();sourceAudio.src='';sourceAudio.remove();sourceAudio=null;if(sourceAnimation){cancelAnimationFrame(sourceAnimation);sourceAnimation=0}}

  window.addEventListener('svara:sound-state-change',event=>{const s=event.detail;if(s?.input?.sourceType!=='voice'&&selected){selected=null;renderSourceOutput()}});
  window.SvaraSoundVoiceInput={bind,cleanup};
  bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();
