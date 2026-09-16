(()=>{
  if(window.SvaraSoundSvaraFlowUIV5)return;
  const root=()=>document.getElementById('soundWorkspace');
  const read=async response=>response.json().catch(()=>null);
  const text=value=>String(value??'').trim();
  const state=()=>window.SvaraSoundStudio;

  function brand(){
    if(document.getElementById('sound-svaraflow-branding-v5'))return;
    const style=document.createElement('style');
    style.id='sound-svaraflow-branding-v5';
    style.textContent=`
      #soundWorkspace .sound-sf-orb{background:none!important;box-shadow:none!important;width:30px!important;height:30px!important;min-width:30px!important;min-height:30px!important;max-width:30px!important;max-height:30px!important;display:flex!important;flex:0 0 30px!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;position:relative!important;line-height:0!important;border:0!important;border-radius:50%!important}
      #soundWorkspace .sound-sf-avatar.assistant{background:none!important;box-shadow:none!important;width:32px!important;height:32px!important;min-width:32px!important;min-height:32px!important;max-width:32px!important;max-height:32px!important;display:flex!important;flex:0 0 32px!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;position:relative!important;line-height:0!important;border:0!important;border-radius:50%!important;padding:0!important;margin:0!important}
      #soundWorkspace .sound-sf-orb img,#soundWorkspace .sound-sf-avatar.assistant img{position:absolute!important;left:50%!important;top:50%!important;width:auto!important;height:100%!important;min-width:0!important;min-height:100%!important;max-width:none!important;max-height:none!important;display:block!important;object-fit:contain!important;object-position:center center!important;transform:translate(-50%,-50%)!important;border:0!important;padding:0!important;margin:0!important;line-height:0!important}
      #soundWorkspace .sound-sf-textarea-wrap textarea:disabled{cursor:wait!important;opacity:.72!important}
      #soundWorkspace .sound-sf-textarea-wrap.thinking{background:linear-gradient(120deg,#6b4cff,#bd5cff,#ff8a3d,#5d8cff,#ff9f5a,#6b4cff)!important;background-size:360% 100%!important;animation:soundSfThinkingV5 2.2s linear infinite!important;box-shadow:0 0 0 1px #ff8a3d55,0 0 28px #9b5cff35,0 0 50px #ff8a3d18!important}
      @keyframes soundSfThinkingV5{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
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
    const title=document.createElement('div');title.className='sound-sf-spec-title';title.innerHTML='<span>PROPOSED SOUND DIRECTION</span><span>SVARAFLOW</span>';
    const grid=document.createElement('div');grid.className='sound-sf-spec-grid';
    specSummary(spec).forEach(([label,value])=>{const line=document.createElement('div');line.className='sound-sf-spec-line';line.innerHTML=`${label} <b>${String(value)}</b>`;grid.appendChild(line)});
    card.appendChild(title);card.appendChild(grid);box.appendChild(card);
  }

  async function poll(id){
    const started=Date.now();
    for(;;){
      if(Date.now()-started>120000)throw new Error('Sound generation timed out.');
      const response=await fetch('/api/sound/generate',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({resultOnly:true,generationId:id})});
      const data=await read(response);
      if(!response.ok&&response.status!==202)throw new Error(data?.error||'Sound result unavailable');
      if(data?.status==='ready')return data;
      if(data?.status==='failed'||data?.status==='storage_failed')throw new Error(data?.error||'Sound generation failed');
      await new Promise(resolve=>setTimeout(resolve,1500));
    }
  }

  function showResult(data,ctx,thread){
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

  async function approve(ui){
    const ctx=context();
    ui.wrap.classList.add('thinking');
    ui.button.disabled=true;
    ui.textarea.disabled=true;
    ui.button.textContent='Preparing Sound…';
    try{
      const approvalResponse=await fetch('/api/sound/generate',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({svaraflowAction:'approve',approval:true,currentSpecification:ui.spec,prompt:ctx.prompt,type:ctx.type,format:ctx.format,durationSeconds:ctx.durationSeconds,sourceType:ctx.sourceType,sourceAssetId:ctx.sourceAssetId,parameters:ctx.parameters})});
      const approved=await read(approvalResponse);
      if(!approvalResponse.ok)throw new Error(approved?.error||'Sound approval failed.');
      const executionResponse=await fetch('/api/sound/generate',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({svaraflowAction:'execute',approval:true,currentSpecification:approved?.specification||ui.spec,prompt:ctx.prompt,type:ctx.type,format:ctx.format,durationSeconds:ctx.durationSeconds,sourceType:ctx.sourceType,sourceAssetId:ctx.sourceAssetId,parameters:ctx.parameters})});
      const execution=await read(executionResponse);
      if(!executionResponse.ok)throw new Error(execution?.error||'Sound execution failed.');
      if(!execution?.id)throw new Error('Sound execution returned no generation ID.');
      state()?.setUI?.({generationId:execution.id,generationStatus:'processing',isGenerating:true,error:null});
      addMessage(ui.thread,'assistant','Approved. I’m generating the Sound now.');
      const result=await poll(execution.id);showResult(result,ctx,ui.thread);
    }catch(error){addMessage(ui.thread,'assistant',String(error?.message||'Sound generation failed.'))}
    finally{
      ui.wrap.classList.remove('thinking');
      ui.button.disabled=false;
      ui.textarea.disabled=false;
      ui.button.textContent='Ask SvaraFlow';
    }
  }

  async function turn(ui){
    const latest=text(ui.textarea.value);
    if(!latest||ui.textarea.disabled){ui.textarea.focus();return;}
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
      const response=await fetch('/api/sound/generate',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      const data=await read(response);
      if(!response.ok)throw new Error(data?.error||`SvaraFlow request failed (${response.status})`);
      const action=String(data?.action||'');
      const reply=text(data?.response);
      if(reply){addMessage(ui.thread,'assistant',reply);ui.messages.push({role:'assistant',content:reply});}
      if(action==='approve'){
        if(data.specification)ui.spec=data.specification;
        await approve(ui);
      }else if(action==='propose'||action==='refine'){
        if(!data.specification)throw new Error('SvaraFlow returned no Sound direction.');
        ui.spec=data.specification;
        const host=addMessage(ui.thread,'assistant','SvaraFlow has mapped the current creative direction here:');
        appendSpec(host,ui.spec);
      }
    }catch(error){addMessage(ui.thread,'assistant',String(error?.message||'SvaraFlow could not respond.'))}
    finally{
      ui.wrap.classList.remove('thinking');
      ui.button.disabled=false;
      ui.textarea.disabled=false;
      ui.button.textContent='Ask SvaraFlow';
      ui.textarea.focus();
    }
  }

  function bind(){
    const r=root();if(!r||r.dataset.soundSfV5AgentBound)return;
    brand();
    const button=r.querySelector('#soundAskSvaraFlow');const textarea=r.querySelector('#soundPrompt');const thread=r.querySelector('.sound-sf-thread');const wrap=r.querySelector('.sound-sf-textarea-wrap');
    if(!button||!textarea||!thread||!wrap)return;
    r.dataset.soundSfV5AgentBound='1';
    mountOrb(r.querySelector('.sound-sf-orb'));
    const ui={button,textarea,thread,wrap,spec:null,messages:[]};
    const interceptClick=event=>{event.preventDefault();event.stopImmediatePropagation();turn(ui)};
    button.addEventListener('click',interceptClick,true);
    textarea.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();event.stopImmediatePropagation();turn(ui)}},true);
    window.SvaraSoundSvaraFlowUIV5={bind,ui};
  }

  bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();