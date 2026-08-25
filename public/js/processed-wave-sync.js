(()=>{
const audio=document.getElementById('processedAudio');
const shell=document.getElementById('processedWaveformShell');
const originalCanvas=document.getElementById('processedCanvas');
if(!audio||!shell||!originalCanvas)return;

// Take ownership of the canvas so the older renderer cannot overwrite it.
originalCanvas.id='processedCanvasLegacy';
const canvas=document.createElement('canvas');
canvas.id='processedCanvas';
canvas.setAttribute('aria-hidden','true');
originalCanvas.replaceWith(canvas);

let ctxAudio=null,source=null,analyser=null,frame=0;

function setup(){
  if(analyser)return;
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return;
    ctxAudio=new Ctx();
    source=ctxAudio.createMediaElementSource(audio);
    analyser=ctxAudio.createAnalyser();
    analyser.fftSize=128;
    analyser.smoothingTimeConstant=.78;
    source.connect(analyser);
    analyser.connect(ctxAudio.destination);
  }catch(_){analyser=null}
}

function draw(){
  const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  const w=Math.max(1,Math.floor(rect.width*dpr)),h=Math.max(1,Math.floor(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  const g=canvas.getContext('2d');g.clearRect(0,0,w,h);
  const bars=48,gap=Math.max(3*dpr,w/(bars*5)),barW=Math.max(2*dpr,(w-(bars-1)*gap)/bars);
  const progress=Number.isFinite(audio.duration)&&audio.duration>0?audio.currentTime/audio.duration:0;
  const playing=!audio.paused;
  let data=null;
  if(analyser&&playing){data=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(data)}
  for(let i=0;i<bars;i++){
    let amp=.25+.18*Math.sin(i*.91);
    if(data)amp=Math.max(.12,data[Math.floor(i/bars*data.length)]/255);
    if(playing)amp*=.72+.45*Math.sin(performance.now()/170+i*.55)**2;
    const bh=Math.max(5*dpr,amp*h*.82),x=i*(barW+gap),y=(h-bh)/2,active=i/bars<=progress;
    g.fillStyle=active?'#24dec6':'#33475a';
    g.globalAlpha=active?.95:.75;
    g.beginPath();g.roundRect(x,y,barW,bh,barW/2);g.fill();
  }
  g.globalAlpha=1;
  if(playing)frame=requestAnimationFrame(draw);
  else if(frame){cancelAnimationFrame(frame);frame=0}
}

function sync(){
  if(!audio)return;
  if(!audio.paused)setup();
  if(ctxAudio&&ctxAudio.state==='suspended'&&!audio.paused)ctxAudio.resume().catch(()=>{});
  draw();
}

audio.addEventListener('play',sync);
audio.addEventListener('pause',sync);
audio.addEventListener('timeupdate',draw);
audio.addEventListener('ended',sync);
audio.addEventListener('loadedmetadata',sync);
shell.addEventListener('click',()=>requestAnimationFrame(draw));
window.addEventListener('resize',draw);
draw();
})();
