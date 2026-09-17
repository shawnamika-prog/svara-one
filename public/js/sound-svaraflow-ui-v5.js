(()=>{
  if(window.SvaraSoundSvaraFlowUIV5)return;
  const root=()=>document.getElementById('soundWorkspace');
  const read=async response=>response.json().catch(()=>null);
  const text=value=>String(value??'').trim();
  const state=()=>window.SvaraSoundStudio;
  let conversationGeneration=0;
  let activeController=null;

  function brand(){
    if(document.getElementById('sound-svaraflow-branding-v5'))return;
    const style=document.createElement('style');
    style.id='sound-svaraflow-branding-v5';
    style.textContent=`
      #soundWorkspace .sound-sf-orb{background:none!important;box-shadow:none!important;width:30px!important;height:30px!important;min-width:30px!important;min-height:30px!important;max-width:30px!important;max-height:30px!important;display:flex!important;flex:0 0 30px!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;position:relative!important;line-height:0!important;border:0!important;border-radius:50%!important}
      #soundWorkspace .sound-sf-avatar.assistant{background:none!important;box-shadow:none!important;width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;max-width:32px!important;max-height:32px!important;display:flex!important;flex:0 0 32px!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;position:relative!important;line-height:0!important;border:0!important;border-radius:50%!important;padding:0!important;margin:0!important}
      #soundWorkspace .sound-sf-orb img,#soundWorkspace .sound-sf-avatar.assistant img{position:absolute!important;left:50%!important;top:50%!important;width:auto!important;height:100%!important;min-width:0!important;min-height:100%!important;max-width:none!important;max-height:none!important;display:block!important;object-fit:contain!important;object-position:center center!important;transform:translate(-50%,-50%)!important;border:0!important;padding:0!important;margin:0!important;line-height:0!important}
      #soundWorkspace .sound-sf-textarea-wrap textarea:disabled{cursor:wait!important;opacity:.72!important}
      @property --sound-sf-angle-v8{syntax:'<angle>';inherits:false;initial-value:0deg}
      #soundWorkspace .sound-sf-textarea-wrap.thinking{position:relative!important;background:#050a14!important;box-shadow:0 0 22px #8b5cff18,0 0 42px #ff8a3d10!important;overflow:hidden!important}
      #soundWorkspace .sound-sf-textarea-wrap.thinking::before{content:"";position:absolute!important;inset:0!important;padding:2px!important;border-radius:inherit!important;pointer-events:none!important;z-index:2!important;background:conic-gradient(from var(--sound-sf-angle-v8),#ffffff10 0deg 300deg,#5d70ff 308deg,#8b5cff 320deg,#bd5cff 332deg,#ff8a3d 344deg,#ffb36e 352deg,#ffffff10 360deg)!important;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)!important;-webkit-mask-composite:xor!important;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0)!important;mask-composite:exclude!important;animation:soundSfPerimeterV8 2.2s linear infinite!important}
      #soundWorkspace .sound-sf-textarea-wrap.thinking textarea{position:relative!important;z-index:3!important;border-color:transparent!important;background:#050a14!important}
      #soundWorkspace .sound-sf-brand .sf-tm{font-size:.42em!important;line-height:1!important;vertical-align:super!important;position:relative!important;top:-.05em!important;letter-spacing:0!important;margin-left:1px!important;font-weight:700!important}
      @keyframes soundSfPerimeterV8{to{--sound-sf-angle-v8:360deg}}
    `;
    document.head.appendChild(style);
  }

  function orb(){
    const img=document.createElement('img');
    img.src='/api/branding/svaraone-orb.png';
    img.alt='SvaraONE';
    img.setAttribute('aria-hidden','true');
    return img;
  }

  function mountOrb(target){
    if(!target)return;
    if(!target.querySelector('img'))target.replaceChildren(orb());
  }

  function context(){
    const r=root();
    const s=state()?.getState?.()||{};
    const adapter=r?.querySelector('.sound-adapter-controls');
    return {
      prompt:text(s.input?.prompt||r?.querySelector('#soundPrompt')?.value),
      type:text(adapter?.querySelector('#soundAdapterType')?.value||s.generation?.type||'music'),
      format:text(adapter?.querySelector('#soundAdapterFormat')?.value||s.generation?.format||'mp3'),
      durationSeconds:Number(adapter?.querySelector('#soundAdapterDuration')?.value||s.generation?.durationSeconds||90),
      sourceType:text(s.input?.sourceType||'text'),
      sourceAssetId:text(s.input?.sourceAssetId||'')||null,
      sourceScript:text(s.input?.sourceScript||''),
      voiceContext:s.input?.sourceVoiceContext||null,
      parameters:s.creative||{}
    };
  }

  function addMessage(thread,role,message){
    const row=document.createElement('div');row.className=`sound-sf-message-row ${role}`;
    const avatar=document.createElement('div');avatar.className=`sound-sf-avatar ${role}`;
    if(role==='assistant')mountOrb(avatar);else avatar.textContent='You';
    const bubble=document.createElement('div');bubble.className=`sound-sf-message ${role}`;bubble.textContent=message;
    if(role==='assistant')row.append(avatar,bubble);else row.append(bubble,avatar);
    thread.appendChild(row);thread.scrollTop=thread.scrollHeight;return bubble;
  }

  function specSummary(spec){
    const c=spec?.creative||{},d=spec?.dynamics||{},v=spec?.voice_relationship||{},x=spec?.constraints||{};
    return [
      ['Role',spec?.role],['Intent',spec?.intent],['Mood',c.mood],['Style',c.style],['Energy',c.energy],['Texture',c.texture],
      ['Tempo',c.tempo_bpm==null?null:`${c.tempo_bpm} BPM`],['Opening',d.opening],['Development',d.development],['Climax',d.climax],['Ending',d.ending],
      ['Voice',v.support_voice?'Supports voiceover':null],['Avoid',v.avoid_competition?'Avoid competing with speech':null],
      ['Duration',x.duration_seconds==null?null:`${x.duration_seconds}s`]
    ].filter(([,value])=>value!==null&&value!==undefined&&value!=='').slice(0,12);
  }

  function appendSpec(box,spec){
    const card=document.createElement('div');card.className='sound-sf-spec';
    const title=document.createElement('div');title.className='sound-sf-spec-title';title.innerHTML='<span>PROPOSED SOUND DIRECTION</span><span>SvaraFlow<sup class="sf-tm">TM</sup></span>';
    const grid=document.createElement('div');grid.className='sound-sf-spec-grid';
    specSummary(spec).forEach(([label,value])=>{const line=document.createElement('div');line.className='sound-sf-spec-line';line.innerHTML=`${label} <b>${String(value)}</b>`;grid.appendChild(line)});
    card.appendChild(title);card.appendChild(grid);box.appendChild(card);
  }

  async function poll(id,generation,signal){
    const started=Date.now();
    for(;;){
      if(generation!==conversationGeneration)return null;
      if(Date.now()-started>120000)throw new Error('Sound generation timed out.');
      const response=await fetch('/api/sound/generate',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({resultOnly:true,generationId:id}),signal});
      if(generation!==conversationGeneration)return null;
      const data=await read(response);
      if(generation!==conversationGeneration)return null;
      if(!response.ok&&response.status!==202)throw new Error(data?.error||'Sound result unavailable');
      if(data?.status==='ready')return data;
      if(data?.status==='failed'||data?.status==='storage_failed')throw new Error(data?.error||'Sound generation failed');
      await new Promise(resolve=>setTimeout(resolve,1500));
    }
  }

  function showResult(data,ctx,thread,generation){
    if(generation!==conversationGeneration||!data)return;
    const r=root();
    r?.querySelector('.sound-empty')?.style.setProperty('display','none');
    const result=r?.querySelector('.sound-result');
    if(result){result.classList.add('show');result.style.display='block'}
    const title=r?.querySelector('.sound-result-top strong');if(title)title.textContent='Generated Sound';
    const meta=r?.querySelector('.sound-result-top span');if(meta)meta.textContent=`${ctx.type||'Sound'} · ${Math.round(Number(data.durationSeconds||ctx.durationSeconds)||0)}s`;
    state()?.setUI?.({generationId:data.id,generationStatus:'ready',isGenerating:false,error:null});
    state()?.setOutput?.({status:'ready',assetId:data.id,r2Key:data.r2Key||null,format:data.format||ctx.format,mimeType:data.mimeType||'audio/mpeg',duration:data.durationSeconds||ctx.durationSeconds,size:data.sizeBytes||null});
    window.dispatchEvent(new CustomEvent('svara:sound-ui-generation-ready',{detail:data}));
    if(thread)addMessage(thread,'assistant','The Sound is ready. It is now available in the Output panel.');
  }

  async function approve(ui,generation,signal){
    const ctx=context();
    ui.wrap.classList.add('thinking');
    ui.button.disabled=true;
    ui.textarea.disabled=true;
    ui.button.textContent='Preparing Sound…';
    try{
      if(generation!==conversationGeneration)return;
      const approvedSpec=ui.spec||{};
      const specDuration=Number(approvedSpec?.constraints?.duration_seconds);
      const approvedDuration=Number.isFinite(specDuration)&&specDuration>0?specDuration:ctx.durationSeconds;
      const approvalResponse=await fetch('/api/sound/generate',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({svaraflowAction:'approve',approval:true,currentSpecification:approvedSpec,prompt:ctx.prompt,type:ctx.type,format:ctx.format,durationSeconds:approvedDuration,sourceType:ctx.sourceType,sourceAssetId:ctx.sourceAssetId,sourceScript:ctx.sourceScript,voiceContext:ctx.voiceContext,parameters:ctx.parameters}),signal});
      if(generation!==conversationGeneration)return;
      const approved=await read(approvalResponse);
      if(generation!==conversationGeneration)return;
      if(!approvalResponse.ok)throw new Error(approved?.error||'Sound approval failed.');
      const executionSpecification=approved?.specification||approvedSpec;
      const executionSpecDuration=Number(executionSpecification?.constraints?.duration_seconds);
      const executionDuration=Number.isFinite(executionSpecDuration)&&executionSpecDuration>0?executionSpecDuration:approvedDuration;
      const executionResponse=await fetch('/api/sound/generate',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({svaraflowAction:'execute',approval:true,currentSpecification:executionSpecification,prompt:ctx.prompt,type:ctx.type,format:ctx.format,durationSeconds:executionDuration,sourceType:ctx.sourceType,sourceAssetId:ctx.sourceAssetId,sourceScript:ctx.sourceScript,voiceContext:ctx.voiceContext,parameters:ctx.parameters}),signal});
      if(generation!==conversationGeneration)return;
      const execution=await read(executionResponse);
      if(generation!==conversationGeneration)return;
      if(!executionResponse.ok)throw new Error(execution?.error||'Sound execution failed.');
      if(!execution?.id)throw new Error('Sound execution returned no generation ID.');
      state()?.setUI?.({generationId:execution.id,generationStatus:'processing',isGenerating:true,error:null});
      addMessage(ui.thread,'assistant','Approved. I’m generating the Sound now.');
      const result=await poll(execution.id,generation,signal);showResult(result,{...ctx,durationSeconds:executionDuration},ui.thread,generation);
    }catch(error){
      if(error?.name==='AbortError'||generation!==conversationGeneration)return;
      addMessage(ui.thread,'assistant',String(error?.message||'Sound generation failed.'))
    }finally{
      if(generation!==conversationGeneration)return;
      ui.wrap.classList.remove('thinking');
      ui.button.disabled=false;
      ui.textarea.disabled=false;
      ui.button.textContent='Ask SvaraFlow';
    }
  }

  async function turn(ui){
    const latest=text(ui.textarea.value);
    if(!latest||ui.textarea.disabled){ui.textarea.focus();return;}
    const generation=conversationGeneration;
    if(activeController)activeController.abort();
    const controller=new AbortController();
    activeController=controller;
    addMessage(ui.thread,'user',latest);
    ui.messages.push({role:'user',content:latest});
    ui.textarea.value='';
    state()?.setInput?.({prompt:latest});
    ui.wrap.classList.add('thinking');
    ui.button.disabled=true;
    ui.textarea.disabled=true;
    ui.button.textContent='SvaraFlow is thinking…';
    const ctx={...context(),prompt:latest};
    const payload={svaraflowAction:'agent',message:latest,conversation:ui.messages,currentSpecification:ui.spec,context:ctx};
    try{
      const response=await fetch('/api/sound/generate',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      if(generation!==conversationGeneration)return;
      const data=await read(response);
      if(generation!==conversationGeneration)return;
      if(!response.ok)throw new Error(data?.error||`SvaraFlow request failed (${response.status})`);
      const action=String(data?.action||'');
      const reply=text(data?.response);
      if(reply){addMessage(ui.thread,'assistant',reply);ui.messages.push({role:'assistant',content:reply});}
      if(generation!==conversationGeneration)return;
      if(action==='approve'){
        if(data.specification)ui.spec=data.specification;
        await approve(ui,generation,controller.signal);
      }else if(action==='propose'||action==='refine'){
        if(!data.specification)throw new Error('SvaraFlow returned no Sound direction.');
        ui.spec=data.specification;
        const host=addMessage(ui.thread,'assistant','SvaraFlow has mapped the current creative direction here:');
        appendSpec(host,ui.spec);
      }
    }catch(error){
      if(error?.name==='AbortError'||generation!==conversationGeneration)return;
      addMessage(ui.thread,'assistant',String(error?.message||'SvaraFlow could not respond.'))
    }finally{
      if(generation!==conversationGeneration)return;
      ui.wrap.classList.remove('thinking');
      ui.button.disabled=false;
      ui.textarea.disabled=false;
      ui.button.textContent='Ask SvaraFlow';
      ui.textarea.focus();
      if(activeController===controller)activeController=null;
    }
  }

  function resetConversation(ui){
    conversationGeneration+=1;
    if(activeController){activeController.abort();activeController=null;}
    if(!ui)return;
    ui.messages=[];
    ui.spec=null;
    ui.voiceContextStarted=false;
    ui.voiceContextVoiceId=null;
    ui.thread?.replaceChildren();
    if(ui.textarea){ui.textarea.value='';ui.textarea.disabled=false;}
    if(ui.button){ui.button.disabled=false;ui.button.textContent='Ask SvaraFlow';}
    ui.wrap?.classList.remove('thinking');
  }

  async function startVoiceContextConversation(ui,voice){
    const voiceId=text(voice?.id||context().voiceContext?.id||'');
    if(!ui||!voiceId)return false;
    if(ui.voiceContextStarted&&ui.voiceContextVoiceId===voiceId)return true;
    if(ui.voiceContextVoiceId!==voiceId){
      resetConversation(ui);
      ui.voiceContextVoiceId=voiceId;
    }
    if(ui.textarea.disabled||ui.voiceContextStarted)return false;
    const generation=conversationGeneration;
    if(activeController)activeController.abort();
    const controller=new AbortController();
    activeController=controller;
    const ctxBase=context();
    const voiceName=text(voice?.name||voice?.voiceName||ctxBase.voiceContext?.name||'selected Voice');
    const latest=`Review the selected ${voiceName} voiceover and its stored script. Propose several distinct Sound directions that fit the voice, delivery, and narrative. Do not approve or generate audio; this is an exploratory proposal only.`;
    ui.voiceContextStarted=true;
    ui.wrap.classList.add('thinking');
    ui.button.disabled=true;
    ui.textarea.disabled=true;
    ui.button.textContent='SvaraFlow is thinking…';
    const payload={svaraflowAction:'agent',message:latest,conversation:ui.messages,currentSpecification:null,context:{...ctxBase,prompt:'',voiceContextInitiation:true,executionAllowed:false}};
    try{
      const response=await fetch('/api/sound/generate',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      if(generation!==conversationGeneration)return false;
      const data=await read(response);
      if(generation!==conversationGeneration)return false;
      if(!response.ok)throw new Error(data?.error||`SvaraFlow request failed (${response.status})`);
      const reply=text(data?.response);
      if(reply){addMessage(ui.thread,'assistant',reply);ui.messages.push({role:'assistant',content:reply});}
      if(data?.specification){
        ui.spec=data.specification;
        const host=addMessage(ui.thread,'assistant','SvaraFlow has mapped the current creative direction here:');
        appendSpec(host,ui.spec);
      }else if(String(data?.action||'')==='approve'){
        addMessage(ui.thread,'assistant','I’ll keep this exploratory for now. Choose or refine a Sound direction before we generate anything.');
      }else if(!reply){
        throw new Error('SvaraFlow returned no Sound directions.');
      }
    }catch(error){
      if(error?.name==='AbortError'||generation!==conversationGeneration)return false;
      ui.voiceContextStarted=false;
      addMessage(ui.thread,'assistant',String(error?.message||'SvaraFlow could not respond.'));
    }finally{
      if(generation!==conversationGeneration)return;
      ui.wrap.classList.remove('thinking');
      ui.button.disabled=false;
      ui.textarea.disabled=false;
      ui.button.textContent='Ask SvaraFlow';
      if(activeController===controller)activeController=null;
    }
    return true;
  }

  function bind(){
    const r=root();if(!r||r.dataset.soundSfV5AgentBound)return;
    brand();
    const button=r.querySelector('#soundAskSvaraFlow');const textarea=r.querySelector('#soundPrompt');const thread=r.querySelector('.sound-sf-thread');const wrap=r.querySelector('.sound-sf-textarea-wrap');
    if(!button||!textarea||!thread||!wrap)return;
    r.dataset.soundSfV5AgentBound='1';
    mountOrb(r.querySelector('.sound-sf-orb'));
    const topBrand=r.querySelector('.sound-sf-brand');
    if(topBrand&&topBrand.textContent.trim()==='SVARAFLOW')topBrand.innerHTML='<span class="sf-name">SvaraFlow</span><sup class="sf-tm">TM</sup>';
    const ui={button,textarea,thread,wrap,spec:null,messages:[],voiceContextStarted:false,voiceContextVoiceId:null};
    const interceptClick=event=>{event.preventDefault();event.stopImmediatePropagation();turn(ui)};
    button.addEventListener('click',interceptClick,true);
    textarea.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();event.stopImmediatePropagation();turn(ui)}},true);
    window.SvaraSoundSvaraFlowUIV5={bind,ui,resetConversation:()=>resetConversation(ui),startVoiceContextConversation:voice=>startVoiceContextConversation(ui,voice)};
    window.addEventListener('svara:sound-source-change',event=>{
      const sourceType=String(event.detail?.sourceType||'');
      if(sourceType==='text'||sourceType==='voice')resetConversation(ui);
    });
  }

  bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();
