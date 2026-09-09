(()=>{
  if(window.SvaraSoundPlaybackFixes)return;
  window.SvaraSoundPlaybackFixes=true;

  let audioContext=null;
  let analyser=null;
  let sourceNode=null;
  let frequencyData=null;
  let animationFrame=0;
  let boundAudio=null;
  let seeking=false;
  let seekWasPlaying=false;

  const getAudio=()=>document.querySelector('audio[aria-hidden="true"][preload="metadata"]');
  const getSeek=()=>document.querySelector('#soundWorkspace .sound-seek');
  const getCanvas=()=>document.querySelector('#soundWorkspace .sound-wave-canvas');

  const formatTime=value=>{
    const seconds=Math.max(0,Number(value)||0);
    const mins=Math.floor(seconds/60);
    const secs=Math.floor(seconds%60).toString().padStart(2,'0');
    return `${mins}:${secs}`;
  };

  const syncSeek=()=>{
    const seek=getSeek();
    const audio=getAudio();
    if(!seek)return;
    seek.min='0';
    seek.max='100';
    seek.step='0.1';
    if(audio&&Number.isFinite(audio.duration)&&audio.duration>0){
      const percent=Math.min(100,Math.max(0,(audio.currentTime/audio.duration)*100));
      seek.value=String(percent);
      seek.style.setProperty('--seek-progress',`${percent}%`);
      const nodes=document.querySelectorAll('#soundWorkspace .sound-time strong');
      if(nodes[0])nodes[0].textContent=formatTime(audio.currentTime);
      if(nodes[1])nodes[1].textContent=formatTime(audio.duration);
    }
  };

  const seekToValue=()=>{
    const audio=getAudio();
    const seek=getSeek();
    if(!audio||!seek||!Number.isFinite(audio.duration)||audio.duration<=0)return;
    const percent=Math.min(100,Math.max(0,Number(seek.value)||0));
    audio.currentTime=(percent/100)*audio.duration;
    syncSeek();
  };

  const ensureVisualizer=()=>{
    const audio=getAudio();
    if(!audio)return false;
    if(boundAudio===audio&&analyser)return true;
    boundAudio=audio;
    try{
      audioContext=new (window.AudioContext||window.webkitAudioContext)();
      analyser=audioContext.createAnalyser();
      analyser.fftSize=256;
      analyser.smoothingTimeConstant=.78;
      frequencyData=new Uint8Array(analyser.frequencyBinCount);
      sourceNode=audioContext.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);
      audio.addEventListener('play',()=>{audioContext?.resume().catch(()=>{});startAnimation()});
      audio.addEventListener('pause',stopAnimation);
      audio.addEventListener('ended',stopAnimation);
      startAnimation();
      return true;
    }catch(error){
      console.warn('svara_sound_live_visualizer_failed',error);
      analyser=null;
      return false;
    }
  };

  const drawLiveWaveform=()=>{
    const canvas=getCanvas();
    const audio=getAudio();
    if(!canvas||!audio||!analyser||!frequencyData)return;
    const rect=canvas.getBoundingClientRect();
    const width=Math.max(320,Math.floor(rect.width||700));
    const height=Math.max(80,Math.floor(rect.height||115));
    const dpr=window.devicePixelRatio||1;
    if(canvas.width!==width*dpr||canvas.height!==height*dpr){
      canvas.width=width*dpr;
      canvas.height=height*dpr;
      canvas.style.width='100%';
      canvas.style.height='100%';
    }
    const ctx=canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,width,height);
    analyser.getByteFrequencyData(frequencyData);

    const barCount=88;
    const gap=3;
    const barWidth=Math.max(2,(width-gap*(barCount-1))/barCount);
    const duration=Number(audio.duration);
    const progress=Number.isFinite(duration)&&duration>0?audio.currentTime/duration:0;
    const progressX=progress*width;
    const half=frequencyData.length/barCount;

    for(let i=0;i<barCount;i++){
      const start=Math.floor(i*half);
      const end=Math.max(start+1,Math.floor((i+1)*half));
      let sum=0;
      for(let j=start;j<Math.min(end,frequencyData.length);j++)sum+=frequencyData[j];
      const level=sum/Math.max(1,end-start)/255;
      const idle=.10+Math.min(.78,level*1.35);
      const x=i*(barWidth+gap);
      const h=Math.max(5,idle*(height-18));
      const y=(height-h)/2;
      ctx.globalAlpha=x<progressX?.98:.48;
      ctx.fillStyle=x<progressX?'#d36cff':'#5377ff';
      ctx.beginPath();
      ctx.roundRect(x,y,barWidth,h,Math.min(barWidth/2,3));
      ctx.fill();
    }
    ctx.globalAlpha=1;
    if(Number.isFinite(progressX)){
      ctx.fillStyle='#ffffff';
      ctx.globalAlpha=.92;
      ctx.fillRect(Math.max(0,Math.min(width-1,progressX)),8,1,Math.max(1,height-16));
      ctx.globalAlpha=1;
    }
  };

  const animate=()=>{
    animationFrame=window.requestAnimationFrame(animate);
    const audio=getAudio();
    if(!audio||audio.paused||audio.ended){stopAnimation();return}
    drawLiveWaveform();
  };

  const startAnimation=()=>{
    if(animationFrame)return;
    animationFrame=window.requestAnimationFrame(animate);
  };

  const stopAnimation=()=>{
    if(animationFrame){window.cancelAnimationFrame(animationFrame);animationFrame=0;}
  };

  document.addEventListener('pointerdown',event=>{
    const seek=event.target.closest?.('.sound-seek');
    if(!seek)return;
    const audio=getAudio();
    seekWasPlaying=Boolean(audio&&!audio.paused&&!audio.ended);
    seeking=true;
  },true);

  document.addEventListener('input',event=>{
    const seek=event.target.closest?.('.sound-seek');
    if(!seek)return;
    event.stopImmediatePropagation();
    seekToValue();
  },true);

  const finishSeek=event=>{
    const seek=event.target.closest?.('.sound-seek');
    if(!seek)return;
    event.stopImmediatePropagation();
    seekToValue();
    const audio=getAudio();
    const resume=seeking&&seekWasPlaying;
    seeking=false;
    if(resume&&audio&&!audio.ended){
      audio.play().then(startAnimation).catch(()=>{});
    }
  };

  document.addEventListener('change',finishSeek,true);
  document.addEventListener('pointerup',finishSeek,true);
  document.addEventListener('click',event=>{
    if(event.target.closest?.('.sound-seek'))event.stopImmediatePropagation();
  },true);

  const bindAudio=()=>{
    const audio=getAudio();
    if(!audio)return;
    syncSeek();
    ensureVisualizer();
    if(audio.dataset.playbackFixBound)return;
    audio.dataset.playbackFixBound='1';
    audio.addEventListener('loadedmetadata',syncSeek);
    audio.addEventListener('durationchange',syncSeek);
    audio.addEventListener('timeupdate',syncSeek);
    audio.addEventListener('play',()=>{ensureVisualizer();audioContext?.resume().catch(()=>{});startAnimation()});
    audio.addEventListener('pause',stopAnimation);
  };

  const observer=new MutationObserver(bindAudio);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  bindAudio();
})();
