(() => {
  if (window.SvaraModal) return;
  let root = null, resolver = null, keyHandler = null, previewItem = null, activeMedia = null, previewCleanup = null;

  function ensureRoot(){
    if(root)return root;
    root=document.createElement('div');
    root.className='svara-modal-root';
    root.hidden=true;
    root.innerHTML='<section class="svara-modal" role="dialog" aria-modal="true" aria-labelledby="svaraModalTitle"><div class="svara-modal-head"><div><p class="svara-modal-eyebrow">SVARAONE</p><h2 id="svaraModalTitle" class="svara-modal-title"></h2></div><button class="svara-modal-close" type="button" aria-label="Close">×</button></div><div class="svara-modal-body"></div><div class="svara-modal-foot"><button class="svara-modal-button" type="button" data-modal-cancel>Close</button><button class="svara-modal-button primary" type="button" data-modal-confirm>Rename</button></div></section>';
    document.body.appendChild(root);
    root.querySelector('.svara-modal-close').addEventListener('click',()=>finish(null));
    root.querySelector('[data-modal-cancel]').addEventListener('click',()=>finish(null));
    root.addEventListener('click',e=>{if(e.target===root)finish(null);});
    root.querySelector('[data-modal-confirm]').addEventListener('click',()=>finish(root.querySelector('.svara-modal-input')?.value??true));
    return root;
  }

  function stopPreview(){
    if(previewCleanup){previewCleanup();previewCleanup=null;}
    if(activeMedia){
      try{activeMedia.pause();}catch{}
      try{activeMedia.removeAttribute('src');activeMedia.load();}catch{}
      activeMedia=null;
    }
  }

  function finish(value){
    if(!root||root.hidden)return;
    const current=resolver;
    resolver=null;
    if(keyHandler)document.removeEventListener('keydown',keyHandler,true);
    keyHandler=null;
    stopPreview();
    root.classList.remove('is-open');
    setTimeout(()=>{if(root)root.hidden=true;},160);
    if(current)current(value);
  }

  function openRename(initialValue){
    const modal=ensureRoot();
    stopPreview();
    modal.querySelector('.svara-modal-title').textContent='Rename generation';
    modal.querySelector('.svara-modal-body').innerHTML='<label class="svara-modal-label" for="svaraRenameInput">Generation name</label><input id="svaraRenameInput" class="svara-modal-input" type="text" autocomplete="off" spellcheck="false"><p class="svara-modal-help">Choose a clear name for this audio asset. The file format will be preserved automatically.</p>';
    const confirm=modal.querySelector('[data-modal-confirm]');
    confirm.hidden=false;
    confirm.textContent='Rename';
    const input=modal.querySelector('#svaraRenameInput');
    input.value=String(initialValue??'');
    root.hidden=false;
    requestAnimationFrame(()=>root.classList.add('is-open'));
    keyHandler=e=>{if(e.key==='Escape'){e.preventDefault();finish(null);}else if(e.key==='Enter'&&document.activeElement===input){e.preventDefault();finish(input.value);}};
    document.addEventListener('keydown',keyHandler,true);
    setTimeout(()=>{input.focus();input.select();},30);
    return new Promise(resolve=>{resolver=resolve;});
  }

  function buildWaveform(media){
    const wrap=document.createElement('div');
    wrap.className='svara-audio-player';
    const top=document.createElement('div');
    top.className='svara-audio-main';
    const play=document.createElement('button');
    play.className='svara-audio-play';
    play.type='button';
    play.setAttribute('aria-label','Play');
    play.innerHTML='<span class="svara-audio-play-icon">▶</span>';
    const wave=document.createElement('div');
    wave.className='svara-waveform';
    wave.setAttribute('role','slider');
    wave.setAttribute('aria-label','Audio progress');
    wave.tabIndex=0;
    const bars=document.createElement('div');
    bars.className='svara-waveform-bars';
    const idleHeights=[.22,.55,.88,.58,.42,.72,.9,.48,.76,.9,.5,.68,.34,.62,.82,.46,.7,.92,.54,.78,.38,.66,.86,.5,.74,.94,.44,.69,.83,.57,.77,.35,.63,.9,.48,.71,.87,.53,.75,.41,.68,.88,.51,.73,.93,.46,.64,.8];
    idleHeights.forEach((h,i)=>{const bar=document.createElement('span');bar.style.height=`${h*100}%`;bar.dataset.index=i;bars.appendChild(bar);});
    wave.append(bars);
    top.append(play,wave);
    const info=document.createElement('div');
    info.className='svara-audio-time';
    const current=document.createElement('span');
    const duration=document.createElement('span');
    current.textContent='0:00';duration.textContent='0:00';
    info.append(current,duration);
    wrap.append(top,info);
    let audioContext=null,source=null,analyser=null,animationFrame=null;
    const barEls=[...bars.querySelectorAll('span')];
    const resetWave=()=>barEls.forEach((bar,index)=>{bar.style.height=`${idleHeights[index%idleHeights.length]*100}%`;bar.style.transform='scaleY(1)';});
    const animateWave=()=>{if(!analyser||media.paused){animationFrame=null;return;}const data=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(data);const step=Math.max(1,Math.floor(data.length/barEls.length));barEls.forEach((bar,index)=>{let sum=0;const start=index*step,end=Math.min(data.length,start+step);for(let i=start;i<end;i++)sum+=data[i];const level=(sum/Math.max(1,end-start))/255;bar.style.height=`${18+Math.pow(level,.72)*82}%`;bar.style.transform=`scaleY(${.82+level*.28})`;});animationFrame=requestAnimationFrame(animateWave);};
    const connectAnalyser=async()=>{if(audioContext)return;const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;try{audioContext=new Ctx();analyser=audioContext.createAnalyser();analyser.fftSize=128;analyser.smoothingTimeConstant=.78;source=audioContext.createMediaElementSource(media);source.connect(analyser);analyser.connect(audioContext.destination);await audioContext.resume();}catch(err){try{audioContext?.close();}catch{}audioContext=null;source=null;analyser=null;}};
    const update=()=>{const d=Number.isFinite(media.duration)?media.duration:0;const p=d?Math.min(1,Math.max(0,media.currentTime/d)):0;current.textContent=formatTime(media.currentTime);duration.textContent=formatTime(d);wave.setAttribute('aria-valuemin','0');wave.setAttribute('aria-valuemax',String(d||0));wave.setAttribute('aria-valuenow',String(media.currentTime||0));wave.style.setProperty('--svara-wave-progress',`${p*100}%`);};
    const toggle=async()=>{if(media.paused){await connectAnalyser();if(audioContext?.state==='suspended')await audioContext.resume().catch(()=>{});media.play().catch(()=>{});}else media.pause();};
    play.addEventListener('click',toggle);
    media.addEventListener('play',async()=>{await connectAnalyser();if(audioContext?.state==='suspended')audioContext.resume().catch(()=>{});play.classList.add('is-playing');play.setAttribute('aria-label','Pause');play.querySelector('span').textContent='Ⅱ';if(!animationFrame)animateWave();});
    media.addEventListener('pause',()=>{play.classList.remove('is-playing');play.setAttribute('aria-label','Play');play.querySelector('span').textContent='▶';if(animationFrame){cancelAnimationFrame(animationFrame);animationFrame=null;}resetWave();});
    media.addEventListener('ended',()=>{media.currentTime=0;update();});
    media.addEventListener('timeupdate',update);
    media.addEventListener('loadedmetadata',update);
    const seek=e=>{const rect=wave.getBoundingClientRect();const ratio=Math.min(1,Math.max(0,(e.clientX-rect.left)/rect.width));if(Number.isFinite(media.duration))media.currentTime=media.duration*ratio;};
    wave.addEventListener('click',seek);
    wave.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const step=5*(e.key==='ArrowRight'?1:-1);media.currentTime=Math.min(Math.max(0,media.currentTime+step),Number.isFinite(media.duration)?media.duration:media.currentTime);}});
    previewCleanup=()=>{if(animationFrame){cancelAnimationFrame(animationFrame);animationFrame=null;}play.removeEventListener('click',toggle);wave.removeEventListener('click',seek);try{source?.disconnect();}catch{}try{analyser?.disconnect();}catch{}try{audioContext?.close();}catch{}source=null;analyser=null;audioContext=null;};
    update();resetWave();return wrap;
  }

  function openPreview(mediaUrl,item={}){
    const modal=ensureRoot();
    if(resolver)finish(null);
    modal.querySelector('.svara-modal-title').textContent='Preview';
    modal.querySelector('[data-modal-confirm]').hidden=true;
    const body=modal.querySelector('.svara-modal-body');
    body.innerHTML='';
    const filename=String(item.filename||'');
    const type=String(item.mediaType||item.type||item.format||'').toLowerCase();
    const video=type==='video'||/\.(mp4|webm|mov|m4v)$/i.test(filename);
    const media=document.createElement(video?'video':'audio');
    media.preload='metadata';media.playsInline=true;media.src=String(mediaUrl||'');media.setAttribute('aria-label',`Preview of ${filename||'generation'}`);activeMedia=media;
    const mediaWrap=document.createElement('div');
    mediaWrap.className=video?'svara-media-preview svara-video-preview':'svara-media-preview';
    if(video){media.className='svara-modal-video';media.controls=true;mediaWrap.appendChild(media);}else{media.className='svara-modal-audio';mediaWrap.appendChild(buildWaveform(media));media.style.display='none';}
    body.appendChild(mediaWrap);
    const meta=document.createElement('div');meta.className='svara-modal-media-meta';
    const name=document.createElement('strong');name.textContent=filename||'Generation';
    const details=document.createElement('span');const parts=[item.voiceName,item.format].filter(Boolean);if(item.sizeBytes)parts.push(formatBytes(item.sizeBytes)||String(item.sizeBytes));details.textContent=parts.join(' · ');meta.append(name,details);body.appendChild(meta);
    const actions=document.createElement('div');actions.className='svara-modal-media-actions';actions.innerHTML='<button type="button" class="svara-modal-media-action" data-preview-download aria-label="Download"><span class="svara-modal-media-action-icon" aria-hidden="true">↓</span><span>Download</span></button><button type="button" class="svara-modal-media-action" data-preview-delete aria-label="Delete"><span class="svara-modal-media-action-icon" aria-hidden="true">⌫</span><span>Delete</span></button>';body.appendChild(actions);
    root.hidden=false;requestAnimationFrame(()=>root.classList.add('is-open'));
    keyHandler=e=>{if(e.key==='Escape'){e.preventDefault();finish(null);}};document.addEventListener('keydown',keyHandler,true);
    if(video)setTimeout(()=>media.focus(),30);
    return new Promise(resolve=>{resolver=resolve;});
  }

  function formatTime(seconds){const value=Math.max(0,Number(seconds)||0);const minutes=Math.floor(value/60);const secs=Math.floor(value%60).toString().padStart(2,'0');return `${minutes}:${secs}`;}
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function formatBytes(bytes){if(typeof bytes==='string'&&/[a-z]/i.test(bytes))return bytes;const value=Number(bytes)||0;if(!value)return '';if(value<1024)return `${value} B`;if(value<1048576)return `${(value/1024).toFixed(1)} KB`;return `${(value/1048576).toFixed(1)} MB`;}
  window.SvaraModal={rename:openRename,preview:openPreview};
  document.addEventListener('click',event=>{
    const filename=event.target.closest('.my-library-name');
    if(filename){const row=filename.closest('.my-library-row');previewItem={filename:filename.querySelector('strong')?.textContent?.trim()||'',row};return;}
    const button=event.target.closest('.my-library-file-menu button');if(!button)return;
    const label=button.querySelector('span:last-child')?.textContent?.trim();if(label!=='Preview'||!previewItem?.filename)return;if(!window.SvaraModal?.preview)return;
    const item={filename:previewItem.filename};const voice=previewItem.row?.children?.[1]?.textContent?.trim();const format=previewItem.row?.children?.[3]?.textContent?.trim();const size=previewItem.row?.children?.[4]?.textContent?.trim();if(voice)item.voiceName=voice;if(format)item.format=format;if(size)item.sizeBytes=size;
    window.SvaraModal.preview(`/api/generations/media?filename=${encodeURIComponent(item.filename)}`,item);
  },true);
})();