(()=>{
  const $=id=>document.getElementById(id);
  const btn=$('generate'),script=$('script');
  if(!btn||!script)return;

  // Carry the current SvaraFlow state with voice-generation requests.
  // SvaraFlow remains an internal processing option and does not alter the billing unit.
  const svaraFlowToggle=$('svaraFlowToggle');
  const originalFetch=window.fetch.bind(window);
  window.fetch=async (input,init)=>{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    if(method==='POST'&&url.includes('/api/voice/generate')){
      const currentInit=init?{...init}:{};
      if(typeof currentInit.body==='string'){
        try{
          const payload=JSON.parse(currentInit.body);
          payload.svaraFlow=Boolean(svaraFlowToggle?.checked);
          currentInit.body=JSON.stringify(payload);
          return originalFetch(input,currentInit);
        }catch(_){ }
      }
    }
    return originalFetch(input,init);
  };

  let creditFactor=0.5;
  let generation=null;
  let invalidated=false;
  let busy=false;

  function costFor(text){
    const normalizedCharacters=Math.max(100,Math.ceil(String(text||'').length/100)*100);
    return Math.max(1,Math.ceil(normalizedCharacters*creditFactor));
  }
  function ensureCounter(){
    let label=$('freeGenerationCount');
    if(label)return label;
    label=document.createElement('div');label.id='freeGenerationCount';label.className='free-generation-count';label.setAttribute('aria-live','polite');
    btn.insertAdjacentElement('afterend',label);return label;
  }
  function setCounter(value){ensureCounter().textContent=`Free generations ${value}`}
  function setBilledButton(){btn.disabled=busy;btn.textContent='Generate'}
  function setFreeButton(){btn.disabled=busy;btn.textContent='Generate Again - Free'}
  function invalidateIfChanged(){
    if(!generation||generation.used||invalidated)return;
    if(script.value!==generation.script){invalidated=true;setCounter('0 / 0');setBilledButton()}
  }
  async function loadPricing(){
    try{const res=await fetch('/api/pricing',{cache:'no-store',credentials:'same-origin'});if(res.ok){const data=await res.json();const factor=Number(data.creditFactor);if(Number.isFinite(factor)&&factor>0)creditFactor=factor}}catch(_){ }
    setBilledButton();if(!generation)setCounter('0 / 0');
  }
  function clearOutputPanel(){
    const audio=$('player');
    if(audio){audio.pause();audio.removeAttribute('src');audio.load()}
    if(window.__svaraFreeTakeUrl){URL.revokeObjectURL(window.__svaraFreeTakeUrl);window.__svaraFreeTakeUrl=null}
    const empty=$('empty'),result=$('result'),customPlayer=$('customPlayer'),formatReady=$('formatReady'),download=$('download'),audioTools=$('audioTools'),processedResult=$('processedResult');
    if(empty)empty.hidden=false;
    if(result)result.hidden=true;
    if(customPlayer)customPlayer.hidden=true;
    if(formatReady)formatReady.hidden=true;
    if(download){download.removeAttribute('href');download.removeAttribute('download')}
    if(audioTools)audioTools.hidden=true;
    if(processedResult)processedResult.hidden=true;
    const status=$('status');if(status)status.textContent='Ready';
    const debug=$('debug');if(debug)debug.textContent='';
  }
  async function useFreeTake(){
    if(busy||!generation||generation.used||invalidated)return;
    if(script.value!==generation.script){invalidated=true;setCounter('0 / 0');setBilledButton();return}

    // Clear only the visible output. Preserve the generation object because
    // it is required to authorize the free take on the server.
    clearOutputPanel();
    busy=true;
    btn.disabled=true;btn.textContent='Generating Free Take…';
    try{
      const res=await fetch('/api/voice/generate',{method:'POST',headers:{'content-type':'application/json','X-SvaraONE-Free-Take':'true'},credentials:'same-origin',body:JSON.stringify({generationId:generation.id,text:generation.script})});
      if(!res.ok){const data=await res.json().catch(()=>({}));$('status').textContent=data.error||'Free take failed';$('debug').textContent=data.details||data.message||'';return}
      const audioBlob=await res.blob();if(!audioBlob.size)throw new Error('Free take audio response was empty');
      const audio=$('player');if(window.__svaraFreeTakeUrl)URL.revokeObjectURL(window.__svaraFreeTakeUrl);window.__svaraFreeTakeUrl=URL.createObjectURL(audioBlob);audio.src=window.__svaraFreeTakeUrl;audio.load();
      $('playerTitle').textContent=`${generation.voiceName} · ${generation.format.toUpperCase()}`;$('empty').hidden=true;$('result').hidden=false;$('customPlayer').hidden=generation.format==='pcm';$('formatReady').hidden=false;$('download').href=window.__svaraFreeTakeUrl;if(window.__svaraGenerationFilename)$('download').download=window.__svaraGenerationFilename;$('status').textContent='Ready';
      generation.used=true;setCounter('1 / 1');setBilledButton();window.dispatchEvent(new CustomEvent('svara:free-take-ready',{detail:{generationId:generation.id}}));
    }catch(err){$('status').textContent='Free take failed';$('debug').textContent=err?.message||String(err)}
    finally{busy=false;if(generation?.used||invalidated)setBilledButton();else if(generation)setFreeButton();else setBilledButton()}
  }
  btn.addEventListener('click',e=>{if(btn.textContent==='Generate Again - Free'){e.preventDefault();e.stopImmediatePropagation();useFreeTake()}},true);
  script.addEventListener('input',()=>{invalidateIfChanged();if(!generation||generation.used||invalidated)setBilledButton()});
  window.addEventListener('svara:reset-output',()=>{generation=null;invalidated=false;busy=false;setCounter('0 / 0');setBilledButton()});
  window.addEventListener('svara:generation-ready',event=>{
    const detail=event.detail||{};if(!detail.generationId)return;
    generation={id:String(detail.generationId),script:String(detail.script||''),voiceName:String(detail.voiceName||'Generated voice'),format:String(detail.format||'mp3').toLowerCase(),used:false};invalidated=false;busy=false;setCounter('0 / 1');
    setTimeout(()=>{if(generation&&!generation.used&&!invalidated)setFreeButton()},0);
  });
  loadPricing();
})();