(()=>{
  if(window.SvaraSoundOutputPlayer)return;

  const stateApi=()=>window.SvaraSoundStudio;
  let audio=null;
  let currentGenerationId=null;
  let currentR2Key=null;
  let pollTimer=null;
  let pollStartedAt=0;
  let applyingOutput=false;
  let waveformData=null;
  let waveformGenerationId=null;
  let waveformLoading=false;

  const root=()=>document.getElementById('soundWorkspace');
  const output=()=>root()?.querySelector('.sound-output');
  const empty=()=>output()?.querySelector('.sound-empty');
  const result=()=>output()?.querySelector('.sound-result');
  const playButton=()=>output()?.querySelector('.sound-play');
  const generateButton=()=>root()?.querySelector('#soundGenerate');
  const wave=()=>output()?.querySelector('.sound-wave');
  const timeNodes=()=>output()?.querySelectorAll('.sound-time strong')||[];

  const formatTime=value=>{
    const seconds=Math.max(0,Number(value)||0);
    const mins=Math.floor(seconds/60);
    const secs=Math.floor(seconds%60).toString().padStart(2,'0');
    return `${mins}:${secs}`;
  };

  const setGenerateButton=(busy,message='Generating…')=>{
    const button=generateButton();
    if(!button)return;
    button.disabled=busy;
    button.textContent=busy?message:'Generate Sound';
  };

  const setButton=playing=>{
    const button=playButton();
    if(!button)return;
    button.innerHTML=playing?'<span style="width:8px;height:12px;border:0;border-left:3px solid #fff;border-right:3px solid #fff;margin:0"></span>':'<span></span>';
    button.setAttribute('aria-label',playing?'Pause Sound':'Play Sound');
  };

  const setPlayerError=message=>{
    const target=output()?.querySelector('.sound-generation-note');
    if(target){target.textContent=message;target.dataset.playerError='1';}
    console.error('svara_sound_ui_error',message);
  };

  const ensureTransportUI=()=>{
    const out=output();
    if(!out)return null;
    const card=out.querySelector('.sound-main-card');
    const row=out.querySelector('.sound-player-row');
    if(!card||!row)return null;

    let seek=card.querySelector('.sound-seek');
    if(!seek){
      seek=document.createElement('input');
      seek.type='range';
      seek.className='sound-seek';
      seek.min='0';
      seek.max='1';
      seek.step='0.01';
      seek.value='0';
      seek.setAttribute('aria-label','Seek through sound');
      card.insertBefore(seek,row);
      seek.addEventListener('input',()=>{
        if(!audio||!Number.isFinite(audio.duration)||audio.duration<=0)return;
        audio.currentTime=(Number(seek.value)/100)*audio.duration;
        updateTransport();
      });
    }

    let volumeWrap=row.querySelector('.sound-volume');
    if(!volumeWrap){
      volumeWrap=document.createElement('div');
      volumeWrap.className='sound-volume';
      volumeWrap.innerHTML='<span aria-hidden="true">VOL</span><input class="sound-volume-range" type="range" min="0" max="100" value="100" aria-label="Sound volume">';
      row.appendChild(volumeWrap);
      volumeWrap.querySelector('input').addEventListener('input',event=>{
        if(audio)audio.volume=Number(event.target.value)/100;
      });
    }
    return {seek,volume:volumeWrap.querySelector('input')};
  };

  const updateTransport=()=>{
    const controls=ensureTransportUI();
    if(!audio||!controls)return;
    const duration=Number(audio.duration);
    const current=Number(audio.currentTime)||0;
    const percent=Number.isFinite(duration)&&duration>0?Math.min(100,Math.max(0,(current/duration)*100)):0;
    controls.seek.value=String(percent);
    const nodes=timeNodes();
    if(nodes[0])nodes[0].textContent=formatTime(current);
    if(nodes[1]&&Number.isFinite(duration))nodes[1].textContent=formatTime(duration);
    controls.seek.style.setProperty('--seek-progress',`${percent}%`);
  };

  const drawWaveform=()=>{
    const container=wave();
    if(!container)return;
    let canvas=container.querySelector('canvas');
    if(!canvas){
      container.innerHTML='';
      canvas=document.createElement('canvas');
      canvas.className='sound-wave-canvas';
      canvas.setAttribute('aria-label','Sound waveform');
      container.appendChild(canvas);
    }
    const rect=container.getBoundingClientRect();
    const width=Math.max(320,Math.floor(rect.width||700));
    const height=Math.max(80,Math.floor(rect.height||115));
    const dpr=window.devicePixelRatio||1;
    canvas.width=width*dpr;
    canvas.height=height*dpr;
    canvas.style.width='100%';
    canvas.style.height='100%';
    const ctx=canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    const bars=waveformData||Array.from({length:100},(_,i)=>0.15+(((i*37)%83)/100)*0.7);
    const gap=3;
    const barWidth=Math.max(2,(width-gap*(bars.length-1))/bars.length);
    const progress=audio&&Number.isFinite(audio.duration)&&audio.duration>0?audio.currentTime/audio.duration:0;
    const progressX=progress*width;
    bars.forEach((level,i)=>{
      const x=i*(barWidth+gap);
      const h=Math.max(5,level*(height-18));
      const y=(height-h)/2;
      ctx.globalAlpha=x<progressX?.98:.42;
      ctx.fillStyle=x<progressX?'#d36cff':'#5377ff';
      ctx.beginPath();
      const radius=Math.min(barWidth/2,3);
      ctx.roundRect(x,y,barWidth,h,radius);
      ctx.fill();
    });
    ctx.globalAlpha=1;
    if(Number.isFinite(progressX)){
      ctx.fillStyle='#ffffff';
      ctx.globalAlpha=.9;
      ctx.fillRect(Math.max(0,Math.min(width-1,progressX)),8,1,Math.max(1,height-16));
      ctx.globalAlpha=1;
    }
  };

  const loadWaveform=async generationId=>{
    if(!generationId||waveformGenerationId===generationId)return;
    waveformGenerationId=generationId;
    waveformLoading=true;
    try{
      const response=await window.fetch(`/api/sound/assets/${encodeURIComponent(generationId)}`,{credentials:'same-origin'});
      if(!response.ok)throw new Error('Waveform audio could not be loaded.');
      const buffer=await response.arrayBuffer();
      const AudioContextClass=window.AudioContext||window.webkitAudioContext;
      if(!AudioContextClass)throw new Error('Audio analysis is not supported by this browser.');
      const context=new AudioContextClass();
      try{
        const decoded=await context.decodeAudioData(buffer.slice(0));
        const channel=decoded.getChannelData(0);
        const barCount=110;
        const samplesPerBar=Math.max(1,Math.floor(channel.length/barCount));
        waveformData=Array.from({length:barCount},(_,i)=>{
          const start=i*samplesPerBar;
          const end=Math.min(channel.length,start+samplesPerBar);
          let sum=0;
          for(let j=start;j<end;j++)sum+=channel[j]*channel[j];
          const rms=Math.sqrt(sum/Math.max(1,end-start));
          return Math.min(1,Math.max(.06,rms*4.5));
        });
      }finally{await context.close().catch(()=>{})}
    }catch(error){
      console.warn('svara_sound_waveform_analysis_failed',error);
      waveformData=null;
    }finally{
      waveformLoading=false;
      drawWaveform();
    }
  };

  const ensureAudio=()=>{
    if(audio&&audio.isConnected)return audio;
    audio=document.createElement('audio');
    audio.preload='metadata';
    audio.controls=false;
    audio.setAttribute('aria-hidden','true');
    audio.style.display='none';
    audio.volume=1;
    document.body.appendChild(audio);

    audio.addEventListener('loadedmetadata',()=>{
      const nodes=timeNodes();
      if(nodes[1])nodes[1].textContent=formatTime(audio.duration);
      updateTransport();
      drawWaveform();
    });
    audio.addEventListener('timeupdate',()=>{updateTransport();drawWaveform()});
    audio.addEventListener('play',()=>{wave()?.classList.add('playing');setButton(true);drawWaveform()});
    audio.addEventListener('pause',()=>{wave()?.classList.remove('playing');setButton(false);drawWaveform()});
    audio.addEventListener('ended',()=>{wave()?.classList.remove('playing');setButton(false);audio.currentTime=0;updateTransport();drawWaveform()});
    audio.addEventListener('error',()=>{wave()?.classList.remove('playing');setButton(false);setPlayerError('Sound playback could not be loaded.')});
    return audio;
  };

  const wireDownload=()=>{
    const buttons=[...(output()?.querySelectorAll('.sound-action')||[])];
    const download=buttons.find(button=>button.textContent.trim().toLowerCase()==='download');
    if(!download||download.dataset.downloadBound)return;
    download.dataset.downloadBound='1';
    download.addEventListener('click',async event=>{
      event.preventDefault();
      if(!currentGenerationId){setPlayerError('No generated Sound asset is available yet.');return}
      const original=download.textContent;
      download.disabled=true;
      download.textContent='Preparing…';
      try{
        const response=await window.fetch(`/api/sound/assets/${encodeURIComponent(currentGenerationId)}`,{credentials:'same-origin'});
        if(!response.ok)throw new Error('Sound download could not be prepared.');
        const blob=await response.blob();
        let filename=currentR2Key?.split('/').pop()||`svaraone_sound_${currentGenerationId}.mp3`;
        if(!filename.includes('.')){
          const ext=(stateApi()?.getState?.()?.output?.format||'mp3').toLowerCase();
          filename+=`.${ext}`;
        }
        const url=URL.createObjectURL(blob);
        const anchor=document.createElement('a');
        anchor.href=url;
        anchor.download=filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
      }catch(error){setPlayerError(String(error?.message||'Sound download failed').slice(0,300))}
      finally{download.disabled=false;download.textContent=original}
    });
  };

  const cleanDeferredControls=()=>{
    const out=output();
    if(!out)return;
    out.querySelector('.sound-actions .sound-action:not(.primary)')?.remove();
    out.querySelector('.sound-variations')?.remove();
    out.querySelector('.sound-mock-note')?.remove();
  };

  const showOutput=data=>{
    const out=stateApi();
    if(!out)return;
    const generationId=data.id||data.generationId||currentGenerationId;
    if(!generationId)return;
    currentGenerationId=generationId;
    currentR2Key=data.r2Key||data.result?.r2Key||currentR2Key||null;
    applyingOutput=true;
    out.setOutput({
      status:'ready',
      assetId:generationId,
      r2Key:currentR2Key,
      format:data.format||data.result?.format||'mp3',
      mimeType:data.mimeType||data.result?.mimeType||'audio/mpeg',
      duration:data.durationSeconds||data.result?.durationSeconds||null,
      size:data.sizeBytes||data.result?.sizeBytes||null
    });
    applyingOutput=false;
    const emptyView=empty();
    const resultView=result();
    if(emptyView)emptyView.style.display='none';
    if(resultView)resultView.classList.add('show');
    cleanDeferredControls();
    ensureTransportUI();
    wireDownload();
    const audioEl=ensureAudio();
    if(audioEl){
      const src=`/api/sound/assets/${encodeURIComponent(generationId)}`;
      const absolute=new URL(src,window.location.href).href;
      if(audioEl.src!==absolute){
        audioEl.pause();
        audioEl.src=src;
        audioEl.load();
        waveformData=null;
        waveformGenerationId=null;
        loadWaveform(generationId);
      }else if(waveformGenerationId!==generationId){
        loadWaveform(generationId);
      }
    }
    updateTransport();
    setButton(audioEl?!audioEl.paused:false);
    drawWaveform();
  };

  const setProcessing=({id,status='processing'})=>{
    const out=stateApi();
    if(!out)return;
    currentGenerationId=id;
    currentR2Key=null;
    out.setUI({generationId:id,generationStatus:status,isGenerating:status!=='ready',error:null});
    out.setOutput({status:'loading',assetId:id,r2Key:null,format:null,mimeType:null,duration:null,size:null});
  };

  const stopPolling=()=>{if(pollTimer){clearTimeout(pollTimer);pollTimer=null}};

  const failGeneration=(id,message)=>{
    stopPolling();
    pollStartedAt=0;
    setGenerateButton(false);
    stateApi()?.setUI({generationId:id||null,generationStatus:'error',isGenerating:false,error:message});
    stateApi()?.setOutput({status:'error',assetId:id||null});
    setPlayerError(message);
  };

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
        setGenerateButton(false);
        stateApi()?.setUI({generationId:id,generationStatus:'ready',isGenerating:false,error:null});
        return;
      }
      if(data.status==='failed'||data.status==='storage_failed'){
        failGeneration(id,'Sound generation failed.');
        return;
      }
      if(Date.now()-pollStartedAt>120000){
        failGeneration(id,'Sound generation timed out.');
        return;
      }
      stateApi()?.setUI({generationId:id,generationStatus:'processing',isGenerating:true,error:null});
      pollTimer=setTimeout(()=>pollGeneration(id),1500);
    }catch(error){
      failGeneration(id,String(error?.message||'Sound result retrieval failed').slice(0,300));
    }
  };

  const generateSound=async event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    const out=stateApi();
    const state=out?.getState?.();
    if(!out||!state){setPlayerError('Sound Studio state is not available.');return}
    if(state.ui?.isGenerating)return;

    const prompt=String(state.input?.prompt||'').trim();
    if(!prompt){
      out.setUI({generationStatus:'error',isGenerating:false,error:'Prompt is required.'});
      setPlayerError('Enter a Sound prompt before generating.');
      return;
    }

    const type=String(state.generation?.type||'music').toLowerCase();
    if(type==='transition'){
      out.setUI({generationStatus:'error',isGenerating:false,error:'Transition generation is not available yet.'});
      setPlayerError('Transition generation is not available yet. Choose Music, SFX, Ambience, Loop or Jingle.');
      return;
    }

    const payload={
      prompt,
      type,
      format:state.generation?.format||'mp3',
      durationSeconds:Number(state.generation?.durationSeconds)||90,
      sampleRate:state.generation?.sampleRate??null,
      channels:state.generation?.channels??null,
      provider:state.generation?.provider||null,
      sourceType:state.input?.sourceType||null,
      sourceAssetId:state.input?.sourceAssetId||null,
      parameters:state.creative||null,
      inputs:[{inputType:'text',textContent:prompt,role:'prompt'}]
    };

    stopPolling();
    pollStartedAt=0;
    setGenerateButton(true,'Generating…');
    out.setUI({isGenerating:true,generationStatus:'processing',error:null,generationId:null});
    out.setOutput({status:'loading',assetId:null,r2Key:null,format:null,mimeType:null,duration:null,size:null});

    try{
      console.log('svara_sound_generate_request',payload);
      const response=await window.fetch('/api/sound/generate',{
        method:'POST',
        headers:{'content-type':'application/json'},
        credentials:'same-origin',
        body:JSON.stringify(payload)
      });
      const data=await response.json().catch(()=>null);
      console.log('svara_sound_generate_response',{status:response.status,data});

      if(!response.ok){
        const message=String(data?.error||'Sound generation request failed.').slice(0,300);
        failGeneration(data?.generationId||null,message);
        return;
      }

      if(!data?.id){
        failGeneration(null,'Sound generation did not return a generation ID.');
        return;
      }

      setProcessing({id:data.id,status:data.status||'processing'});
      currentGenerationId=data.id;
      pollStartedAt=Date.now();
      if(data.status==='ready')showOutput(data);
      else pollGeneration(data.id);
    }catch(error){
      failGeneration(null,String(error?.message||'Sound generation request failed').slice(0,300));
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
              if(!stateApi()?.getState?.()?.ui?.isGenerating){
                setProcessing({id:body.id,status:body.status});
                pollStartedAt=Date.now();
                pollGeneration(body.id);
              }
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
    ensureTransportUI();
    cleanDeferredControls();
    wireDownload();

    const generate=generateButton();
    if(generate)generate.addEventListener('click',generateSound,true);

    const button=playButton();
    if(button){
      button.addEventListener('click',async event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        const audioEl=ensureAudio();
        if(!audioEl||!audioEl.src){setPlayerError('No Sound asset is available yet.');return}
        try{if(audioEl.paused)await audioEl.play();else audioEl.pause()}catch(error){setPlayerError('Sound playback could not start.')}} ,true);
    }
  };

  const syncFromState=state=>{
    if(applyingOutput||!state?.output?.assetId||state.output.status!=='ready')return;
    showOutput({
      id:state.output.assetId,
      r2Key:state.output.r2Key,
      format:state.output.format,
      mimeType:state.output.mimeType,
      durationSeconds:state.output.duration,
      sizeBytes:state.output.size
    });
  };

  window.SvaraSoundOutputPlayer={pollGeneration,showOutput,generateSound};
  watchGenerationFetch();
  bind();
  window.addEventListener('svara:sound-state-change',event=>syncFromState(event.detail));
  window.addEventListener('resize',()=>drawWaveform());
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();