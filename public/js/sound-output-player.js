(()=>{
  if(window.SvaraSoundOutputPlayer)return;

  const stateApi=()=>window.SvaraSoundStudio;
  let audio=null;
  let currentGenerationId=null;
  let pollTimer=null;
  let pollStartedAt=0;

  const root=()=>document.getElementById('soundWorkspace');
  const output=()=>root()?.querySelector('.sound-output');
  const empty=()=>output()?.querySelector('.sound-empty');
  const result=()=>output()?.querySelector('.sound-result');
  const playButton=()=>output()?.querySelector('.sound-play');
  const wave=()=>output()?.querySelector('.sound-wave');
  const timeNodes=()=>output()?.querySelectorAll('.sound-time strong')||[];

  const formatTime=value=>{
    const seconds=Math.max(0,Number(value)||0);
    const mins=Math.floor(seconds/60);
    const secs=Math.floor(seconds%60).toString().padStart(2,'0');
    return `${mins}:${secs}`;
  };

  const setButton=playing=>{
    const button=playButton();
    if(!button)return;
    button.innerHTML=playing?'<span style="width:8px;height:12px;border:0;border-left:3px solid #fff;border-right:3px solid #fff;margin:0"></span>':'<span></span>';
    button.setAttribute('aria-label',playing?'Pause Sound':'Play Sound');
  };

  const ensureAudio=()=>{
    const row=output()?.querySelector('.sound-player-row');
    if(!row)return null;
    if(audio&&audio.parentNode===row)return audio;
    audio=document.createElement('audio');
    audio.preload='metadata';
    audio.controls=false;
    audio.setAttribute('aria-hidden','true');
    audio.style.display='none';
    row.appendChild(audio);

    audio.addEventListener('loadedmetadata',()=>{
      const nodes=timeNodes();
      if(nodes[1])nodes[1].textContent=formatTime(audio.duration);
    });
    audio.addEventListener('timeupdate',()=>{
      const nodes=timeNodes();
      if(nodes[0])nodes[0].textContent=formatTime(audio.currentTime);
    });
    audio.addEventListener('play',()=>{wave()?.classList.add('playing');setButton(true)});
    audio.addEventListener('pause',()=>{wave()?.classList.remove('playing');setButton(false)});
    audio.addEventListener('ended',()=>{wave()?.classList.remove('playing');setButton(false);audio.currentTime=0;const nodes=timeNodes();if(nodes[0])nodes[0].textContent='0:00'});
    audio.addEventListener('error',()=>{wave()?.classList.remove('playing');setButton(false);setPlayerError('Sound playback could not be loaded.')});
    return audio;
  };

  const setPlayerError=message=>{
    const target=output()?.querySelector('.sound-generation-note');
    if(target){target.textContent=message;target.dataset.playerError='1';}
  };

  const showOutput=data=>{
    const out=stateApi();
    if(!out)return;
    out.setOutput({
      status:'ready',
      assetId:data.id||data.generationId||currentGenerationId,
      r2Key:data.r2Key||data.result?.r2Key||null,
      format:data.format||data.result?.format||'mp3',
      mimeType:data.mimeType||data.result?.mimeType||'audio/mpeg',
      duration:data.durationSeconds||data.result?.durationSeconds||null,
      size:data.sizeBytes||data.result?.sizeBytes||null
    });
    const emptyView=empty();
    const resultView=result();
    if(emptyView)emptyView.style.display='none';
    if(resultView)resultView.classList.add('show');
    const audioEl=ensureAudio();
    if(audioEl){
      const generationId=data.id||data.generationId||currentGenerationId;
      const src=`/api/sound/assets/${encodeURIComponent(generationId)}`;
      if(audioEl.src!==new URL(src,window.location.href).href){audioEl.pause();audioEl.src=src;audioEl.load()}
    }
    const nodes=timeNodes();
    if(nodes[0])nodes[0].textContent='0:00';
    if(nodes[1]&&data.durationSeconds)nodes[1].textContent=formatTime(data.durationSeconds);
    setButton(false);
  };

  const setProcessing=({id,status='processing'})=>{
    const out=stateApi();
    if(!out)return;
    currentGenerationId=id;
    out.setUI({generationId:id,generationStatus:status,isGenerating:status!=='ready',error:null});
    out.setOutput({status:'loading',assetId:id,r2Key:null,format:null,mimeType:null,duration:null,size:null});
  };

  const stopPolling=()=>{if(pollTimer){clearTimeout(pollTimer);pollTimer=null}};

  const pollGeneration=async id=>{
    if(!id)return;
    currentGenerationId=id;
    if(!pollStartedAt)pollStartedAt=Date.now();
    try{
      const response=await window.fetch('/api/sound/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({resultOnly:true,generationId:id})});
      const data=await response.json().catch(()=>null);
      if(!data)throw new Error('Invalid Sound generation response.');
      if(data.status==='ready'){
        stopPolling();
        pollStartedAt=0;
        showOutput(data);
        stateApi()?.setUI({generationId:id,generationStatus:'ready',isGenerating:false,error:null});
        return;
      }
      if(data.status==='failed'||data.status==='storage_failed'){
        stopPolling();
        pollStartedAt=0;
        stateApi()?.setUI({generationId:id,generationStatus:'failed',isGenerating:false,error:'Sound generation failed.'});
        stateApi()?.setOutput({status:'error',assetId:id});
        return;
      }
      if(Date.now()-pollStartedAt>120000){
        stopPolling();pollStartedAt=0;
        stateApi()?.setUI({generationId:id,generationStatus:'timeout',isGenerating:false,error:'Sound generation timed out.'});
        stateApi()?.setOutput({status:'error',assetId:id});
        return;
      }
      stateApi()?.setUI({generationId:id,generationStatus:'processing',isGenerating:true,error:null});
      pollTimer=setTimeout(()=>pollGeneration(id),1500);
    }catch(error){
      stopPolling();pollStartedAt=0;
      stateApi()?.setUI({generationId:id,generationStatus:'error',isGenerating:false,error:String(error?.message||'Sound result retrieval failed').slice(0,300)});
      stateApi()?.setOutput({status:'error',assetId:id});
    }
  };

  const watchGenerationFetch=()=>{
    if(window.__svaraSoundFetchWrapped)return;
    const originalFetch=window.fetch.bind(window);
    window.fetch=async(...args)=>{
      const response=await originalFetch(...args);
      try{
        const request=args[0];
        const url=typeof request==='string'?request:(request?.url||'');
        if(new URL(url,window.location.href).pathname==='/api/sound/generate'){
          const method=(args[1]?.method||request?.method||'GET').toUpperCase();
          if(method==='POST'){
            const copy=response.clone();
            const body=await copy.json().catch(()=>null);
            if(body?.id&&body?.status&&body.status!=='ready'&&body.resultOnly!==true){
              setProcessing({id:body.id,status:body.status});
              pollStartedAt=Date.now();
              pollGeneration(body.id);
            }
          }
        }
      }catch(error){console.error('sound_output_player_watch_error',error)}
      return response;
    };
    window.__svaraSoundFetchWrapped=true;
  };

  const bind=()=>{
    const r=root();
    if(!r||r.dataset.outputPlayerBound)return;
    r.dataset.outputPlayerBound='1';
    ensureAudio();
    const button=playButton();
    if(button){
      button.addEventListener('click',async()=>{
        const audioEl=ensureAudio();
        if(!audioEl||!audioEl.src){setPlayerError('No Sound asset is available yet.');return}
        try{if(audioEl.paused)await audioEl.play();else audioEl.pause()}catch(error){setPlayerError('Sound playback could not start.')}});
    }
  };

  const syncFromState=state=>{
    if(!state?.output?.assetId||state.output.status!=='ready')return;
    showOutput({
      id:state.output.assetId,
      r2Key:state.output.r2Key,
      format:state.output.format,
      mimeType:state.output.mimeType,
      durationSeconds:state.output.duration,
      sizeBytes:state.output.size
    });
  };

  window.SvaraSoundOutputPlayer={pollGeneration,showOutput};
  watchGenerationFetch();
  bind();
  window.addEventListener('svara:sound-state-change',event=>syncFromState(event.detail));
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();
