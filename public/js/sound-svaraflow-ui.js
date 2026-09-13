(()=>{
  if(window.SvaraSoundSvaraFlowUI)return;

  const state=()=>window.SvaraSoundStudio;
  const root=()=>document.getElementById('soundWorkspace');
  const esc=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const json=async(response)=>response.json().catch(()=>null);
  const formatTime=value=>{const s=Math.max(0,Number(value)||0),m=Math.floor(s/60),sec=Math.floor(s%60).toString().padStart(2,'0');return `${m}:${sec}`};

  function styles(){
    if(document.getElementById('sound-svaraflow-ui-styles'))return;
    const style=document.createElement('style');
    style.id='sound-svaraflow-ui-styles';
    style.textContent=`
      .sound-panel-head .sound-flow{display:none}
      .sound-svaraflow-chat{margin:18px 20px 0;border:1px solid #ffffff0d;border-radius:15px;background:linear-gradient(180deg,#08101c,#07101a);overflow:hidden}
      .sound-chat-thread{max-height:265px;overflow:auto;padding:13px 13px 4px;display:flex;flex-direction:column;gap:9px;scrollbar-width:thin}
      .sound-chat-message{max-width:88%;padding:10px 12px;border-radius:12px;font-size:10px;line-height:1.55;white-space:pre-wrap}
      .sound-chat-message.user{align-self:flex-end;background:#201536;border:1px solid #a85cff2d;color:#dcd0ea}
      .sound-chat-message.assistant{align-self:flex-start;background:#0c1724;border:1px solid #ffffff0b;color:#b7c6d6}
      .sound-chat-message.thinking{color:#8b9caf;font-style:italic}
      .sound-chat-message .sound-spec{margin-top:8px;padding:9px 10px;border:1px solid #a85cff20;border-radius:10px;background:#0b1020;color:#aebbd0}
      .sound-chat-message .sound-spec strong{display:block;color:#dfc5ff;font-size:9px;margin-bottom:5px}
      .sound-chat-actions{display:flex;gap:7px;margin-top:9px;flex-wrap:wrap}
      .sound-chat-action{border:1px solid #ffffff12;border-radius:8px;background:#0b1523;color:#aebdcb;padding:7px 10px;font:700 9px Inter;cursor:pointer}
      .sound-chat-action.primary{border-color:#a85cff55;background:linear-gradient(105deg,#263b72,#7439a4);color:#fff}
      .sound-chat-composer{padding:12px;border-top:1px solid #ffffff0b}
      .sound-chat-composer-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:7px;color:#6f8299;font-size:8px;letter-spacing:.1em;font-weight:800}
      .sound-chat-composer-head span:last-child{color:#a66cff}
      .sound-chat-textarea-wrap{position:relative;border-radius:13px;padding:1px;background:transparent}
      .sound-chat-textarea-wrap.thinking{background:linear-gradient(100deg,#7b5cff,#bb62ff,#5f89ff,#7b5cff);background-size:260% 100%;animation:soundThinkingBorder 2.8s ease-in-out infinite;box-shadow:0 0 0 1px #8f68ff20,0 0 20px #8b5cff10}
      .sound-chat-textarea-wrap.thinking::after{content:"";position:absolute;inset:1px;border-radius:12px;pointer-events:none;box-shadow:inset 0 0 22px #8b5cff0b}
      .sound-chat-textarea-wrap textarea{position:relative;z-index:1;display:block;width:100%;min-height:115px;resize:vertical;border:1px solid #ffffff10;border-radius:12px;background:#050a14;color:#edf4ff;padding:14px;font:13px/1.65 Inter,system-ui,sans-serif;outline:none}
      .sound-chat-textarea-wrap textarea:focus{border-color:#a75cff55;box-shadow:0 0 0 3px #a75cff0c}
      @keyframes soundThinkingBorder{0%,100%{background-position:0% 50%;opacity:.72}50%{background-position:100% 50%;opacity:1}}
      .sound-chat-send-row{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:8px}
      .sound-chat-hint{color:#596d84;font-size:8px}
      .sound-ask{border:1px solid #a85cff55;border-radius:10px;padding:10px 14px;background:linear-gradient(105deg,#5d70ff,#874ff4 55%,#b85cff);color:#fff;font:800 10px Inter;cursor:pointer;box-shadow:0 8px 24px #6c4df21c;transition:.18s ease}
      .sound-ask:hover{transform:translateY(-1px);filter:brightness(1.05)}
      .sound-ask:disabled{opacity:.65;cursor:wait;transform:none}
      .sound-adapter-controls{margin:14px 20px 0;padding:13px;border:1px solid #ffffff0c;border-radius:13px;background:#09111e}
      .sound-adapter-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}
      .sound-adapter-head strong{font-size:9px;letter-spacing:.12em;color:#7f91a7}.sound-adapter-head span{font-size:8px;color:#596e86}
      .sound-adapter-grid{display:grid;grid-template-columns:1.25fr .9fr .85fr;gap:8px}
      .sound-adapter-field{min-width:0}.sound-adapter-field label{display:block;margin-bottom:6px;color:#71849a;font-size:8px;letter-spacing:.08em;font-weight:800}
      .sound-adapter-field select{width:100%;border:1px solid #ffffff0d;background:#0b1524;color:#dbe7f3;border-radius:8px;padding:9px;font:600 9px Inter;outline:none}
      .sound-adapter-meta{margin-top:8px;color:#5f738b;font-size:8px}
      .sound-sf-hidden{display:none!important}
      @media(max-width:560px){.sound-svaraflow-chat,.sound-adapter-controls{margin-left:14px;margin-right:14px}.sound-adapter-grid{grid-template-columns:1fr}.sound-chat-message{max-width:95%}}
    `;
    document.head.appendChild(style);
  }

  function addMessage(thread,role,text,extraClass=''){
    const box=document.createElement('div');box.className=`sound-chat-message ${role}${extraClass?` ${extraClass}`:''}`;box.textContent=text;thread.appendChild(box);thread.scrollTop=thread.scrollHeight;return box;
  }

  function specificationSummary(spec){
    const creative=spec?.creative||{};
    const lines=[];
    if(spec?.role)lines.push(`Role: ${spec.role}`);
    if(spec?.intent)lines.push(`Intent: ${spec.intent}`);
    if(creative.mood)lines.push(`Mood: ${creative.mood}`);
    if(creative.style)lines.push(`Style: ${creative.style}`);
    if(creative.energy)lines.push(`Energy: ${creative.energy}`);
    if(creative.texture)lines.push(`Texture: ${creative.texture}`);
    if(creative.tempo_bpm!==null&&creative.tempo_bpm!==undefined)lines.push(`Tempo: ${creative.tempo_bpm} BPM`);
    if(spec?.voice_relationship?.support_voice===true)lines.push('Supports the voiceover');
    if(spec?.voice_relationship?.avoid_competition===true)lines.push('Avoids competing with speech');
    return lines.slice(0,8).join('\n')||'I have a Sound direction ready for your approval.';
  }

  function buildContext(){
    const api=state(),s=api?.getState?.()||{};
    const sourceType=s.input?.sourceType||'text';
    return {
      prompt:String(s.input?.prompt||root()?.querySelector('#soundPrompt')?.value||'').trim(),
      type:String(s.generation?.type||'music'),
      format:String(s.generation?.format||'mp3'),
      durationSeconds:Number(s.generation?.durationSeconds||90),
      sourceType,
      sourceAssetId:s.input?.sourceAssetId||null,
      parameters:{
        mood:s.creative?.mood||null,
        tempoBpm:s.creative?.tempoBpm??null,
        intensity:s.creative?.intensity??null,
        complexity:s.creative?.complexity??null,
        texture:s.creative?.texture||null,
        instrumental:s.creative?.instrumental??true,
        excludeVocals:s.creative?.excludeVocals??true
      }
    };
  }

  function syncLegacyControls(context){
    const r=root();if(!r)return;
    const typeButton=r.querySelector(`[data-sound-type="${CSS.escape(context.type)}"]`);if(typeButton)typeButton.click();
    const duration=r.querySelector('.sound-control select');if(duration){const value=formatTime(context.durationSeconds);const option=[...duration.options].find(o=>o.value===value||o.textContent===value);if(option){duration.value=option.value;duration.dispatchEvent(new Event('change',{bubbles:true}))}}
    const hiddenFormat=r.querySelector('#soundFormatMirror');if(hiddenFormat){hiddenFormat.value=context.format;hiddenFormat.dispatchEvent(new Event('change',{bubbles:true}))}
    state()?.setGeneration?.({type:context.type,format:context.format,durationSeconds:context.durationSeconds});
  }

  async function loadCapabilities(adapterControls,context){
    try{
      const response=await fetch('/api/sound/capabilities',{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
      const data=await json(response);
      if(!response.ok)throw new Error(data?.error||`Capabilities unavailable (${response.status})`);
      const caps=data?.capabilities||{};
      const types=Array.isArray(caps.types)?caps.types:[];
      const formats=Array.isArray(caps.outputFormats)?caps.outputFormats:[];
      const typeSelect=adapterControls.querySelector('#soundAdapterType');
      const formatSelect=adapterControls.querySelector('#soundAdapterFormat');
      if(typeSelect){typeSelect.innerHTML=(types.length?types:['music']).map(v=>`<option value="${esc(v)}">${esc(v.charAt(0).toUpperCase()+v.slice(1))}</option>`).join('');typeSelect.value=types.includes(context.type)?context.type:(types[0]||'music')}
      if(formatSelect){formatSelect.innerHTML=(formats.length?formats:['mp3']).map(v=>`<option value="${esc(v)}">${esc(v.toUpperCase())}</option>`).join('');formatSelect.value=formats.includes(context.format)?context.format:(formats[0]||'mp3')}
      const constraints=caps.parameters?.serviceConstraints||{};
      const ranges=Object.values(constraints).map(v=>v||{}).filter(v=>Number.isFinite(Number(v.minDurationSeconds))||Number.isFinite(Number(v.maxDurationSeconds)));
      const min=ranges.length?Math.min(...ranges.map(v=>Number(v.minDurationSeconds)||1)):1;
      const max=ranges.length?Math.max(...ranges.map(v=>Number(v.maxDurationSeconds)||600)):600;
      const durationOptions=[15,30,45,60,90,120,180,300].filter(v=>v>=min&&v<=max);
      if(!durationOptions.length)durationOptions.push(Math.max(1,Math.round(min)));
      const durationSelect=adapterControls.querySelector('#soundAdapterDuration');
      if(durationSelect){durationSelect.innerHTML=durationOptions.map(v=>`<option value="${v}">${formatTime(v)}</option>`).join('');durationSelect.value=durationOptions.includes(context.durationSeconds)?String(context.durationSeconds):String(durationOptions[0])}
      const meta=adapterControls.querySelector('.sound-adapter-meta');if(meta)meta.textContent=`Adapter capabilities cached · ${data.provider||'configured provider'}${data.lastVerifiedAt?` · verified ${new Date(data.lastVerifiedAt).toLocaleString()}`:''}`;
      return caps;
    }catch(error){
      const meta=adapterControls.querySelector('.sound-adapter-meta');if(meta)meta.textContent='Adapter capabilities could not be loaded. The SvaraFlow conversation can still continue.';
      return null;
    }
  }

  function makeAdapterControls(context){
    const el=document.createElement('section');el.className='sound-adapter-controls';el.innerHTML=`
      <div class="sound-adapter-head"><strong>ADAPTER CONTROLS</strong><span>Provider capability driven</span></div>
      <div class="sound-adapter-grid">
        <div class="sound-adapter-field"><label for="soundAdapterType">TYPE</label><select id="soundAdapterType"></select></div>
        <div class="sound-adapter-field"><label for="soundAdapterFormat">FORMAT</label><select id="soundAdapterFormat"></select></div>
        <div class="sound-adapter-field"><label for="soundAdapterDuration">DURATION</label><select id="soundAdapterDuration"></select></div>
      </div>
      <div class="sound-adapter-meta">Loading adapter capabilities…</div>`;
    const r=root();
    const oldSections=[...r.querySelectorAll('.sound-section,.sound-advanced')];
    oldSections.forEach(node=>node.classList.add('sound-sf-hidden'));
    const chat=r.querySelector('.sound-svaraflow-chat');
    if(chat)chat.insertAdjacentElement('afterend',el);else r.querySelector('.sound-prompt')?.insertAdjacentElement('afterend',el);
    const patchContext=()=>{const t=el.querySelector('#soundAdapterType')?.value||context.type,f=el.querySelector('#soundAdapterFormat')?.value||context.format,d=Number(el.querySelector('#soundAdapterDuration')?.value||context.durationSeconds);state()?.setGeneration?.({type:t,format:f,durationSeconds:d});context={...context,type:t,format:f,durationSeconds:d};syncLegacyControls(context)};
    ['soundAdapterType','soundAdapterFormat','soundAdapterDuration'].forEach(id=>el.querySelector(`#${id}`)?.addEventListener('change',patchContext));
    loadCapabilities(el,context);
    return el;
  }

  function renderApproved(thread,spec,onApprove,onRefine){
    const box=addMessage(thread,'assistant','I’ve translated that into a Sound direction. Review it before anything is generated.');
    const card=document.createElement('div');card.className='sound-spec';card.innerHTML=`<strong>SVARAFLOW SOUND DIRECTION</strong><div>${esc(specificationSummary(spec))}</div>`;
    const actions=document.createElement('div');actions.className='sound-chat-actions';
    const refine=document.createElement('button');refine.type='button';refine.className='sound-chat-action';refine.textContent='Refine';
    const approve=document.createElement('button');approve.type='button';approve.className='sound-chat-action primary';approve.textContent='Approve & Generate';
    refine.addEventListener('click',onRefine);approve.addEventListener('click',onApprove);actions.append(refine,approve);box.append(card,actions);thread.scrollTop=thread.scrollHeight;
  }

  function setThinking(wrapper,value){wrapper.classList.toggle('thinking',value)}

  function renderOutput(generation){
    const r=root();if(!r)return;
    const empty=r.querySelector('.sound-empty');const result=r.querySelector('.sound-result');if(empty)empty.style.display='none';if(result){result.classList.add('show');result.style.display='block'}
    const title=r.querySelector('.sound-result-top strong');const meta=r.querySelector('.sound-result-top span');const wave=r.querySelector('.sound-wave');
    if(title)title.textContent='Generated Sound';
    if(meta)meta.textContent=`${String(generation.type||'Sound').replace(/^./,c=>c.toUpperCase())} · ${formatTime(generation.durationSeconds||0)}`;
    if(wave){wave.classList.remove('playing');wave.innerHTML='';for(let i=0;i<140;i++){const bar=document.createElement('i');bar.style.setProperty('--h',`${12+(i*37)%78}px`);wave.appendChild(bar)}}
    const row=r.querySelector('.sound-player-row');let audio=r.querySelector('#soundSvaraFlowAudio');if(!audio){audio=document.createElement('audio');audio.id='soundSvaraFlowAudio';audio.preload='metadata';audio.style.display='none';r.appendChild(audio)}
    const src=`/api/sound/assets/${encodeURIComponent(generation.id)}`;audio.src=src;audio.load();
    const play=r.querySelector('.sound-play');if(play&&!play.dataset.svBound){play.dataset.svBound='1';play.addEventListener('click',async()=>{try{if(audio.paused)await audio.play();else audio.pause()}catch(error){console.warn('svara_sound_chat_play_error',error)}})}
    audio.addEventListener('play',()=>{wave?.classList.add('playing');if(play)play.setAttribute('aria-label','Pause Sound')},{once:false});
    audio.addEventListener('pause',()=>{wave?.classList.remove('playing');if(play)play.setAttribute('aria-label','Play Sound')},{once:false});
    const current=r.querySelector('#soundCurrentTime');const duration=r.querySelector('.sound-time span');
    audio.addEventListener('timeupdate',()=>{if(current)current.textContent=formatTime(audio.currentTime);if(duration&&Number.isFinite(audio.duration))duration.textContent=formatTime(audio.duration)},{once:false});
    const download=[...r.querySelectorAll('.sound-action')].find(b=>b.textContent.trim().toLowerCase()==='download');
    if(download){download.disabled=false;download.onclick=()=>{const a=document.createElement('a');a.href=src;a.download=`svaraone_sound_${generation.id}.mp3`;a.click()}}
    state()?.setUI?.({generationId:generation.id,generationStatus:'ready',isGenerating:false,error:null});
    state()?.setOutput?.({status:'ready',assetId:generation.id,r2Key:generation.r2Key||null,format:generation.format||'mp3',mimeType:generation.mimeType||'audio/mpeg',duration:generation.durationSeconds||null,size:generation.sizeBytes||null});
  }

  async function pollResult(id,waitStartedAt){
    if(Date.now()-waitStartedAt>120000)throw new Error('Sound generation timed out.');
    const response=await fetch('/api/sound/generate',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({resultOnly:true,generationId:id})});
    const data=await json(response);if(!response.ok&&response.status!==202&&response.status!==200)throw new Error(data?.error||`Sound result unavailable (${response.status})`);
    if(data?.status==='ready')return data;
    if(data?.status==='failed'||data?.status==='storage_failed')throw new Error(data?.error||'Sound generation failed.');
    await new Promise(resolve=>setTimeout(resolve,1500));
    return pollResult(id,waitStartedAt);
  }

  async function askSvaraFlow(ctx,ui){
    const prompt=String(ui.textarea?.value||'').trim();if(!prompt)throw new Error('Tell SvaraFlow what you want to create first.');
    const api=state();api?.setInput?.({prompt});
    addMessage(ui.thread,'user',prompt);
    setThinking(ui.textareaWrap,true);ui.button.disabled=true;ui.button.textContent='SvaraFlow is thinking…';
    const hasSpec=Boolean(ui.currentSpecification);
    const body=hasSpec?{
      svaraflowAction:'refine',feedback:prompt,currentSpecification:ui.currentSpecification,
      prompt, type:ctx.type, format:ctx.format, durationSeconds:ctx.durationSeconds, sourceType:ctx.sourceType, sourceAssetId:ctx.sourceAssetId, parameters:ctx.parameters
    }:{
      svaraflowOnly:true,prompt,type:ctx.type,format:ctx.format,durationSeconds:ctx.durationSeconds,sourceType:ctx.sourceType,sourceAssetId:ctx.sourceAssetId,parameters:ctx.parameters
    };
    try{
      const response=await fetch('/api/sound/generate',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)});
      const data=await json(response);if(!response.ok)throw new Error(data?.error||`SvaraFlow request failed (${response.status})`);
      const spec=data?.specification;if(!spec)throw new Error('SvaraFlow returned no Sound specification.');
      ui.currentSpecification=spec;
      const reply=hasSpec?'I’ve refined the Sound direction. Review the updated version below.':'I understand the creative intent. I’ve prepared a Sound direction for you to approve.';
      addMessage(ui.thread,'assistant',reply);
      renderApproved(ui.thread,spec,()=>approveAndGenerate(ctx,ui),()=>{ui.textarea.value='Tell SvaraFlow what you want changed…';ui.textarea.focus()});
    }finally{
      setThinking(ui.textareaWrap,false);ui.button.disabled=false;ui.button.textContent='Ask SvaraFlow';
    }
  }

  async function approveAndGenerate(ctx,ui){
    if(!ui.currentSpecification)throw new Error('There is no Sound direction to approve.');
    setThinking(ui.textareaWrap,true);ui.button.disabled=true;ui.button.textContent='Preparing Sound…';
    try{
      addMessage(ui.thread,'user','Approve this direction and generate it.');
      const approveBody={svaraflowAction:'approve',approval:true,currentSpecification:ui.currentSpecification,prompt:ctx.prompt,type:ctx.type,format:ctx.format,durationSeconds:ctx.durationSeconds,sourceType:ctx.sourceType,sourceAssetId:ctx.sourceAssetId,parameters:ctx.parameters};
      const approveResponse=await fetch('/api/sound/generate',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(approveBody)});
      const approved=await json(approveResponse);if(!approveResponse.ok)throw new Error(approved?.error||'Sound approval failed.');
      const executeBody={svaraflowAction:'execute',approval:true,currentSpecification:approved?.specification||ui.currentSpecification,prompt:ctx.prompt,type:ctx.type,format:ctx.format,durationSeconds:ctx.durationSeconds,sourceType:ctx.sourceType,sourceAssetId:ctx.sourceAssetId,parameters:ctx.parameters};
      const executeResponse=await fetch('/api/sound/generate',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(executeBody)});
      const execution=await json(executeResponse);if(!executeResponse.ok)throw new Error(execution?.error||'Sound execution failed.');
      if(!execution?.id)throw new Error('Sound execution returned no generation ID.');
      state()?.setUI?.({generationId:execution.id,generationStatus:'processing',isGenerating:true,error:null});
      addMessage(ui.thread,'assistant','Approved. I’m generating the Sound now.');
      const result=await pollResult(execution.id,Date.now());
      renderOutput({id:result.id,type:result.type||ctx.type,format:result.format||ctx.format,mimeType:result.mimeType||'audio/mpeg',durationSeconds:result.durationSeconds||ctx.durationSeconds,sizeBytes:result.sizeBytes||null,r2Key:result.r2Key||null});
      addMessage(ui.thread,'assistant','The Sound is ready. It’s now available in the Output panel.');
    }finally{
      setThinking(ui.textareaWrap,false);ui.button.disabled=false;ui.button.textContent='Ask SvaraFlow';
    }
  }

  function bind(){
    const r=root();if(!r||r.dataset.soundSvaraFlowBound)return;styles();r.dataset.soundSvaraFlowBound='1';
    const oldPrompt=r.querySelector('.sound-prompt');if(!oldPrompt)return;
    const textarea=oldPrompt.querySelector('#soundPrompt');if(!textarea)return;
    const context=buildContext();
    const chat=document.createElement('section');chat.className='sound-svaraflow-chat';chat.innerHTML=`
      <div class="sound-chat-thread" aria-live="polite"></div>
      <div class="sound-chat-composer">
        <div class="sound-chat-composer-head"><span>SVARAFLOW</span><span>CREATIVE CONVERSATION</span></div>
        <div class="sound-chat-textarea-wrap"><textarea id="soundSvaraFlowPrompt" maxlength="2000" placeholder="Tell SvaraFlow what you want to create…"></textarea></div>
        <div class="sound-chat-send-row"><span class="sound-chat-hint">Talk naturally. SvaraFlow will shape the Sound direction with you.</span><button id="soundAskSvaraFlow" class="sound-ask" type="button">Ask SvaraFlow</button></div>
      </div>`;
    oldPrompt.replaceWith(chat);
    const hiddenPrompt=document.createElement('input');hiddenPrompt.id='soundPrompt';hiddenPrompt.type='hidden';hiddenPrompt.value=textarea.value||'';r.appendChild(hiddenPrompt);
    const thread=chat.querySelector('.sound-chat-thread');const liveTextarea=chat.querySelector('#soundSvaraFlowPrompt');const button=chat.querySelector('#soundAskSvaraFlow');const wrap=chat.querySelector('.sound-chat-textarea-wrap');
    liveTextarea.value='';
    liveTextarea.addEventListener('input',()=>{hiddenPrompt.value=liveTextarea.value;state()?.setInput?.({prompt:liveTextarea.value})});
    const ui={thread,textarea:liveTextarea,textareaWrap:wrap,button,currentSpecification:null};
    button.addEventListener('click',()=>{askSvaraFlow({...buildContext(),prompt:liveTextarea.value},ui).catch(error=>{addMessage(thread,'assistant',String(error?.message||'SvaraFlow could not respond.'));setThinking(wrap,false);button.disabled=false;button.textContent='Ask SvaraFlow'})});
    liveTextarea.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();button.click()}});
    const adapter=makeAdapterControls(context);
    const typeLabel=r.querySelector('.sound-label');if(typeLabel)typeLabel.textContent='';
    r.querySelectorAll('.sound-prompt-foot').forEach(node=>node.classList.add('sound-sf-hidden'));
    r.querySelector('#soundInspire')?.closest('.sound-prompt-foot')?.classList.add('sound-sf-hidden');
    const badge=r.querySelector('#soundFlowBadge');if(badge)badge.classList.add('sound-sf-hidden');
    const note=r.querySelector('.sound-generation-note');if(note)note.textContent='SvaraFlow keeps the creative conversation human-led. Provider controls stay adapter-specific.';
  }

  bind();
  const observer=new MutationObserver(bind);observer.observe(document.documentElement,{childList:true,subtree:true});
  window.SvaraSoundSvaraFlowUI={bind};
})();
