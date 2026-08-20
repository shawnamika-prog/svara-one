const SAMPLE_VOICES=[
 {language:'English',code:'en',voiceId:'aura-2-thalia-en',name:'Thalia',accent:'American English',text:'Hello, and welcome to SvaraONE. Discover a voice that sounds natural, expressive, and ready for real work.'},
 {language:'Spanish',code:'es',voiceId:'aura-2-celeste-es',name:'Celeste',accent:'Colombian Spanish',text:'Hola, y bienvenido a SvaraONE. Descubre una voz natural, expresiva y lista para el trabajo real.'},
 {language:'German',code:'de',voiceId:'aura-2-julius-de',name:'Julius',accent:'German',text:'Hallo und willkommen bei SvaraONE. Entdecken Sie eine natürliche, ausdrucksstarke Stimme für echte Projekte.'},
 {language:'French',code:'fr',voiceId:'aura-2-agathe-fr',name:'Agathe',accent:'French',text:'Bonjour et bienvenue chez SvaraONE. Découvrez une voix naturelle, expressive et prête pour vos projets.'},
 {language:'Dutch',code:'nl',voiceId:'aura-2-rhea-nl',name:'Rhea',accent:'Dutch',text:'Hallo en welkom bij SvaraONE. Ontdek een natuurlijke, expressieve stem die klaar is voor echt werk.'},
 {language:'Italian',code:'it',voiceId:'aura-2-livia-it',name:'Livia',accent:'Italian',text:'Ciao e benvenuto su SvaraONE. Scopri una voce naturale, espressiva e pronta per il lavoro reale.'},
 {language:'Japanese',code:'ja',voiceId:'aura-2-izanami-ja',name:'Izanami',accent:'Japanese',text:'こんにちは、SvaraONEへようこそ。自然で表現力豊かな音声を、実際のコンテンツにお使いいただけます。'}
];
let activeAudio=null;

function injectSampleButtonStyles(){
 if(document.getElementById('sample-button-styles'))return;
 const style=document.createElement('style');
 style.id='sample-button-styles';
 style.textContent=`
.sample-listen{position:relative;min-height:48px;padding:8px 16px!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:12px!important;border-color:#ffffff18!important;background:linear-gradient(135deg,#101d2d,#0a1726)!important;transition:border-color .2s ease,background .2s ease,transform .2s ease,box-shadow .2s ease!important;overflow:hidden}
.sample-listen:hover:not(:disabled){border-color:#20d8c044!important;background:linear-gradient(135deg,#102938,#0b1d2b)!important;transform:translateY(-1px);box-shadow:0 10px 28px #0003}
.sample-listen:focus-visible{outline:2px solid #31d7c1;outline-offset:3px}
.sample-listen.is-playing{border-color:#21d8c0aa!important;background:linear-gradient(100deg,#0d302f,#10253a)!important;box-shadow:0 0 0 1px #21d8c01a,0 10px 30px #12cdbb18}
.sample-button-icon{width:30px;height:30px;flex:0 0 30px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(145deg,#19ddc0,#32aaff);color:#03111e;font-size:11px;font-weight:900;box-shadow:0 4px 14px #18dabe33}
.sample-button-label{font-size:13px;font-weight:800;letter-spacing:.01em;color:#dbe8f5}
.sample-mini-bars{margin-left:auto;height:22px;display:flex;align-items:center;gap:3px;opacity:.45}
.sample-mini-bars i{display:block;width:3px;height:8px;border-radius:3px;background:linear-gradient(#2fe2ca,#3699ff);transform-origin:center}
.sample-listen.is-playing .sample-mini-bars{opacity:1}
.sample-listen.is-playing .sample-mini-bars i:nth-child(1){animation:samplePulse .75s ease-in-out infinite alternate}
.sample-listen.is-playing .sample-mini-bars i:nth-child(2){animation:samplePulse .55s ease-in-out .08s infinite alternate}
.sample-listen.is-playing .sample-mini-bars i:nth-child(3){animation:samplePulse .9s ease-in-out .14s infinite alternate}
.sample-listen.is-playing .sample-mini-bars i:nth-child(4){animation:samplePulse .62s ease-in-out .04s infinite alternate}
.sample-listen.is-playing .sample-mini-bars i:nth-child(5){animation:samplePulse .8s ease-in-out .18s infinite alternate}
@keyframes samplePulse{from{height:5px}to{height:20px}}
@media (prefers-reduced-motion:reduce){.sample-listen{transition:none!important}.sample-listen:hover:not(:disabled){transform:none}.sample-listen.is-playing .sample-mini-bars i{animation:none}.sample-listen.is-playing .sample-mini-bars i:nth-child(2){height:16px}.sample-listen.is-playing .sample-mini-bars i:nth-child(3){height:11px}.sample-listen.is-playing .sample-mini-bars i:nth-child(4){height:18px}}
`;
 document.head.appendChild(style);
}

function setSampleButton(button,state){
 const label=button.querySelector('.sample-button-label');
 const icon=button.querySelector('.sample-button-icon');
 button.classList.toggle('is-playing',state==='playing');
 button.classList.toggle('is-loading',state==='loading');
 button.disabled=state==='loading';
 if(label)label.textContent=state==='playing'?'Playing':'Listen';
 if(icon)icon.textContent=state==='playing'?'Ⅱ':state==='loading'?'…':'▶';
 button.setAttribute('aria-label',`${state==='playing'?'Pause':'Listen to'} ${button.dataset.voiceName||'voice'} sample`);
}

function resetSampleButtons(){
 document.querySelectorAll('.sample-listen').forEach(button=>setSampleButton(button,'idle'));
}

function renderSampleVoices(){
 const grid=document.querySelector('#sampleVoiceGrid'); if(!grid)return;
 injectSampleButtonStyles();
 grid.innerHTML='';
 const cards=document.createElement('div'); cards.className='sample-grid';
 SAMPLE_VOICES.forEach(voice=>{
  const card=document.createElement('article'); card.className='sample-card';
  card.innerHTML=`<div class="sample-play-mark">▶</div><div class="sample-voice-identity"><img class="sample-portrait" src="/api/voice-portraits/${voice.code}-v3" alt="${voice.name}, ${voice.accent} voice" loading="lazy"><div class="sample-voice-copy"><h4>${voice.language}</h4><strong>${voice.name}</strong><p>${voice.accent}</p></div></div><button class="ghost button full sample-listen" type="button" data-voice-name="${voice.name}" aria-label="Listen to ${voice.name} sample"><span class="sample-button-icon">▶</span><span class="sample-button-label">Listen</span><span class="sample-mini-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></button>`;
  const button=card.querySelector('button');
  button.addEventListener('click',()=>playStoredSample(voice,button));
  cards.appendChild(card);
 });
 grid.appendChild(cards);
}

async function playStoredSample(voice,button){
 if(activeAudio&&activeAudio._voiceCode===voice.code){
  if(activeAudio.paused){
   try{await activeAudio.play();}catch(err){setSampleButton(button,'idle');console.error(err);}
  }else{activeAudio.pause();}
  return;
 }
 if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;activeAudio=null;resetSampleButtons();}
 setSampleButton(button,'loading');
 try{
  const audio=new Audio(`/api/sample-voices/${voice.code}`);
  audio.preload='auto';
  audio._voiceCode=voice.code;
  activeAudio=audio;
  audio.onplaying=()=>setSampleButton(button,'playing');
  audio.onpause=()=>{if(activeAudio===audio&&!audio.ended)setSampleButton(button,'idle');};
  audio.onended=()=>{setSampleButton(button,'idle');if(activeAudio===audio)activeAudio=null;};
  audio.onerror=()=>{setSampleButton(button,'idle');if(activeAudio===audio)activeAudio=null;console.error('Sample unavailable:',voice.code);};
  await audio.play();
 }catch(err){setSampleButton(button,'idle');if(activeAudio&&activeAudio._voiceCode===voice.code)activeAudio=null;console.error(err);}
}

function setupHeroPlayer(){
 const button=document.querySelector('#heroPlay');
 const bar=document.querySelector('.hero-card .bar span');
 const duration=document.querySelector('.hero-card .player small');
 const bars=[...document.querySelectorAll('.hero-card .wave i')];
 if(!button||!bar)return;
 let heroAudio=null,started=false,audioContext=null,analyser=null,source=null,animationFrame=null;
 const idleHeights=[.22,.55,.88,.58,.42,.72,.9,.48,.76,.9,.5,.68,.34];
 const resetWave=()=>bars.forEach((barEl,index)=>{barEl.style.height=`${idleHeights[index%idleHeights.length]*100}%`;barEl.style.transform='scaleY(1)';});
 const animateWave=()=>{if(!analyser||!bars.length)return;const data=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(data);const step=Math.max(1,Math.floor(data.length/bars.length));bars.forEach((barEl,index)=>{let sum=0;const start=index*step,end=Math.min(data.length,start+step);for(let i=start;i<end;i++)sum+=data[i];const level=(sum/Math.max(1,end-start))/255;barEl.style.height=`${18+Math.pow(level,.72)*82}%`;barEl.style.transform=`scaleY(${.82+level*.28})`;});animationFrame=requestAnimationFrame(animateWave);};
 const stopWave=()=>{if(animationFrame)cancelAnimationFrame(animationFrame);animationFrame=null;resetWave();};
 const connectAnalyser=async()=>{if(audioContext)return;audioContext=new(window.AudioContext||window.webkitAudioContext)();analyser=audioContext.createAnalyser();analyser.fftSize=128;analyser.smoothingTimeConstant=.78;source=audioContext.createMediaElementSource(heroAudio);source.connect(analyser);analyser.connect(audioContext.destination);await audioContext.resume();};
 const reset=()=>{button.disabled=false;button.textContent='▶';bar.style.width='0%';if(duration)duration.textContent=heroAudio&&Number.isFinite(heroAudio.duration)?formatDuration(heroAudio.duration):'—:——';stopWave();};
 button.addEventListener('click',async()=>{try{if(heroAudio&&started){if(heroAudio.paused){if(audioContext)await audioContext.resume();await heroAudio.play();}else heroAudio.pause();return;}button.disabled=true;button.textContent='…';heroAudio=new Audio('/api/sample-hero');heroAudio.preload='auto';heroAudio.addEventListener('loadedmetadata',()=>{if(duration&&Number.isFinite(heroAudio.duration))duration.textContent=formatDuration(heroAudio.duration);});heroAudio.addEventListener('timeupdate',()=>{if(bar&&heroAudio.duration)bar.style.width=`${heroAudio.currentTime/heroAudio.duration*100}%`;});heroAudio.addEventListener('play',async()=>{started=true;button.disabled=false;button.textContent='Ⅱ';await connectAnalyser();if(!animationFrame)animateWave();});heroAudio.addEventListener('pause',()=>{if(started){button.textContent='▶';stopWave();}});heroAudio.addEventListener('ended',()=>{reset();started=false;});heroAudio.addEventListener('error',()=>{reset();console.error('Hero sample unavailable');});await heroAudio.play();}catch(err){reset();console.error(err);}});
 resetWave();
}

function formatDuration(seconds){const total=Math.max(0,Math.round(seconds));const minutes=Math.floor(total/60);const secs=String(total%60).padStart(2,'0');return `${String(minutes).padStart(2,'0')}:${secs}`;}
setupHeroPlayer();
renderSampleVoices();
