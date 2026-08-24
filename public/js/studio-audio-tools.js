(()=>{
const $=id=>document.getElementById(id);
const result=$('result'),tools=$('audioTools'),processed=$('processedResult'),status=$('audioToolsStatus');
if(!result||!tools||!processed)return;

let processedUrl=null,processedAudio=null,processedBuffer=null,sourceBuffer=null,sourceFormat='mp3',rendering=false;

function setStatus(text,error=false){if(!status)return;status.textContent=text||'';status.classList.toggle('error',error)}
function setBusy(busy){rendering=busy;tools.querySelectorAll('.audio-tool').forEach(b=>b.disabled=busy)}
function formatFromTitle(){const title=$('playerTitle')?.textContent||'';const m=title.match(/·\s*(MP3|WAV|PCM)$/i);return (m?.[1]||'MP3').toLowerCase()}
function pcmToBuffer(arrayBuffer,sampleRate=24000){
  const samples=new Int16Array(arrayBuffer.slice(0,arrayBuffer.byteLength-arrayBuffer.byteLength%2));
  const ctx=new AudioContext();
  const buffer=ctx.createBuffer(1,samples.length,sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<samples.length;i++)data[i]=samples[i]/32768;
  ctx.close();return buffer;
}
async function loadSource(){
  sourceFormat=formatFromTitle();
  const player=$('player');
  if(!player?.src)throw new Error('Generate audio first.');
  const bytes=await (await fetch(player.src)).arrayBuffer();
  if(sourceFormat==='pcm')return pcmToBuffer(bytes,24000);
  const ctx=new AudioContext();
  try{return await ctx.decodeAudioData(bytes)}finally{ctx.close()}
}
function makeGraph(ctx,source,type,buffer){
  let input=source,last=input;
  const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=type==='rumble'?90:65;high.Q.value=.7;input.connect(high);last=high;
  if(type==='dehiss'||type==='clean'){
    const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=type==='dehiss'?11000:15000;low.Q.value=.55;last.connect(low);last=low;
  }
  if(type==='clarity'||type==='clean'){
    const eq=ctx.createBiquadFilter();eq.type='peaking';eq.frequency.value=3200;eq.Q.value=.75;eq.gain.value=type==='clarity'?2.5:1.2;last.connect(eq);last=eq;
  }
  if(type==='clean'){
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=2.2;comp.attack.value=.008;comp.release.value=.12;last.connect(comp);last=comp;
  }
  const gain=ctx.createGain();
  let peak=0;
  if(type==='normalize'||type==='clean'){
    for(let c=0;c<buffer.numberOfChannels;c++){const d=buffer.getChannelData(c);for(let i=0;i<d.length;i++)peak=Math.max(peak,Math.abs(d[i]))}
    gain.gain.value=peak>.001?Math.min(1.6,.95/peak):1;
  }else gain.gain.value=1;
  last.connect(gain);gain.connect(ctx.destination);return gain;
}
async function renderEffect(type){
  if(rendering)return;
  setBusy(true);setStatus('Rendering processed audio…');
  try{
    if(!sourceBuffer)sourceBuffer=await loadSource();
    const ctx=new OfflineAudioContext(sourceBuffer.numberOfChannels,sourceBuffer.length,sourceBuffer.sampleRate);
    const src=ctx.createBufferSource();src.buffer=sourceBuffer;makeGraph(ctx,src,type,sourceBuffer);src.start(0);
    processedBuffer=await ctx.startRendering();
    const wav=encodeWav(processedBuffer);if(processedUrl)URL.revokeObjectURL(processedUrl);processedUrl=URL.createObjectURL(wav);
    processedAudio=$('processedAudio');processedAudio.src=processedUrl;processedAudio.load();
    $('processedTitle').textContent=`${$('playerTitle')?.textContent||'Generated voice'} · ${labelFor(type)}`;
    $('processedTime').textContent=`0:00 / ${formatTime(processedBuffer.duration)}`;
    $('processedDownload').href=processedUrl;$('processedDownload').download=`svaraone-processed-${type}.wav`;
    processed.hidden=false;drawProcessedWave();setStatus('Processed audio ready. Original audio is unchanged.');
  }catch(err){setStatus(err?.message||'Audio processing failed.',true)}finally{setBusy(false)}
}
function labelFor(type){return ({clean:'Clean Voice',dehiss:'De-hiss',rumble:'Rumble Removal',clarity:'Voice Clarity',normalize:'Normalized'}[type]||type)}
function formatTime(s){if(!Number.isFinite(s)||s<0)return '0:00';const n=Math.floor(s),m=Math.floor(n/60),r=String(n%60).padStart(2,'0');return `${m}:${r}`}
function encodeWav(buffer){
  const channels=buffer.numberOfChannels,sr=buffer.sampleRate,frames=buffer.length,bytes=2,block=channels*bytes,buf=new ArrayBuffer(44+frames*block),v=new DataView(buf);let p=0;
  const w=(s)=>{for(let i=0;i<s.length;i++)v.setUint8(p++,s.charCodeAt(i))};w('RIFF');v.setUint32(p,36+frames*block,true);p+=4;w('WAVE');w('fmt ');v.setUint32(p,16,true);p+=4;v.setUint16(p,1,true);p+=2;v.setUint16(p,channels,true);p+=2;v.setUint32(p,sr,true);p+=4;v.setUint32(p,sr*block,true);p+=4;v.setUint16(p,block,true);p+=2;v.setUint16(p,16,true);p+=2;w('data');v.setUint32(p,frames*block,true);p+=4;
  const data=Array.from({length:channels},(_,c)=>buffer.getChannelData(c));
  for(let i=0;i<frames;i++)for(let c=0;c<channels;c++){const x=Math.max(-1,Math.min(1,data[c][i]));v.setInt16(p,x<0?x*32768:x*32767,true);p+=2}
  return new Blob([buf],{type:'audio/wav'})
}
function drawProcessedWave(){
  const canvas=$('processedCanvas');if(!canvas||!processedBuffer)return;const rect=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1,w=Math.max(1,Math.floor(rect.width*dpr)),h=Math.max(1,Math.floor(rect.height*dpr));canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);const d=processedBuffer.getChannelData(0),bars=64,bw=w/bars;ctx.fillStyle='#24dec6';for(let i=0;i<bars;i++){const a=Math.floor(i/bars*d.length),b=Math.max(a+1,Math.floor((i+1)/bars*d.length));let peak=0;for(let j=a;j<b;j++)peak=Math.max(peak,Math.abs(d[j]));const bh=Math.max(4*dpr,peak*h*.88),x=i*bw+1,y=(h-bh)/2;ctx.globalAlpha=.55+.35*peak;ctx.fillRect(x,y,Math.max(1,bw-2),bh)}ctx.globalAlpha=1}
function toggleProcessed(){if(!processedAudio?.src)return;if(processedAudio.paused)processedAudio.play().catch(()=>{});else processedAudio.pause()}
function syncProcessed(){if(!processedAudio)return;const playing=!processedAudio.paused;const btn=$('processedPlay');btn.classList.toggle('playing',playing);btn.setAttribute('aria-label',playing?'Pause processed audio':'Play processed audio');$('processedTime').textContent=`${formatTime(processedAudio.currentTime)} / ${formatTime(processedAudio.duration)}`}

tools.querySelectorAll('.audio-tool').forEach(b=>b.addEventListener('click',()=>renderEffect(b.dataset.tool)));
$('processedPlay')?.addEventListener('click',toggleProcessed);
$('processedAudio')?.addEventListener('play',syncProcessed);$('processedAudio')?.addEventListener('pause',syncProcessed);$('processedAudio')?.addEventListener('timeupdate',syncProcessed);$('processedAudio')?.addEventListener('ended',syncProcessed);

const observer=new MutationObserver(()=>{if(!result.hidden){tools.hidden=false;sourceBuffer=null;processed.hidden=true;setStatus('Choose an audio tool to create a processed version.')}});
observer.observe(result,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('resize',drawProcessedWave);
})();
