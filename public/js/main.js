const SAMPLE_VOICES=[
 {language:'English',code:'en',voiceId:'aura-2-thalia-en',name:'Thalia',accent:'American English',text:'Hello, and welcome to SvaraONE. Discover a voice that sounds natural, expressive, and ready for real work.'},
 {language:'Spanish',code:'es',voiceId:'aura-2-celeste-es',name:'Celeste',accent:'Colombian Spanish',text:'Hola, y bienvenido a SvaraONE. Descubre una voz natural, expresiva y lista para el trabajo real.'},
 {language:'German',code:'de',voiceId:'aura-2-julius-de',name:'Julius',accent:'German',text:'Hallo und willkommen bei SvaraONE. Entdecken Sie eine natürliche, ausdrucksstarke Stimme für echte Projekte.'},
 {language:'French',code:'fr',voiceId:'aura-2-agathe-fr',name:'Agathe',accent:'French',text:'Bonjour et bienvenue chez SvaraONE. Découvrez une voix naturelle, expressive et prête pour vos projets.'},
 {language:'Dutch',code:'nl',voiceId:'aura-2-rhea-nl',name:'Rhea',accent:'Dutch',text:'Hallo en welkom bij SvaraONE. Ontdek een natuurlijke, expressieve stem die klaar is voor echt werk.'},
 {language:'Italian',code:'it',voiceId:'aura-2-livia-it',name:'Livia',accent:'Italian',text:'Ciao e benvenuto su SvaraONE. Scopri una voce naturale, espressiva e pronta per il lavoro reale.'},
 {language:'Japanese',code:'ja',voiceId:'aura-2-fujin-ja',name:'Fujin',accent:'Japanese',text:'こんにちは、SvaraONEへようこそ。自然で表現力豊かな音声を、実際のコンテンツにお使いいただけます。'}
];
let activeAudio=null;

function renderSampleVoices(){
 const grid=document.querySelector('#sampleVoiceGrid'); if(!grid)return;
 grid.innerHTML='';
 const cards=document.createElement('div'); cards.className='sample-grid';
 SAMPLE_VOICES.forEach(voice=>{
  const card=document.createElement('article'); card.className='sample-card';
  card.innerHTML=`<div class="sample-play-mark">▶</div><h4>${voice.language}</h4><p>${voice.name} · ${voice.accent}</p><button class="ghost button full sample-listen" type="button" aria-label="Listen to ${voice.language} sample">Listen</button>`;
  card.querySelector('button').addEventListener('click',()=>playStoredSample(voice,card.querySelector('button')));
  cards.appendChild(card);
 });
 grid.appendChild(cards);
}

async function playStoredSample(voice,button){
 if(activeAudio){activeAudio.pause();activeAudio.currentTime=0;activeAudio=null;document.querySelectorAll('.sample-listen').forEach(b=>{b.disabled=false;b.textContent='Listen';});}
 const original='Listen'; button.disabled=true; button.textContent='Loading…';
 try{
  const audio=new Audio(`/api/sample-voices/${voice.code}`);
  audio.preload='auto';
  activeAudio=audio;
  audio.onplaying=()=>{button.disabled=false;button.textContent='Playing…';};
  audio.onended=()=>{button.disabled=false;button.textContent=original;activeAudio=null;};
  audio.onerror=()=>{throw new Error('Sample unavailable');};
  await audio.play();
 }catch(err){button.disabled=false;button.textContent=original;activeAudio=null;console.error(err);}
}

function setupHeroPlayer(){
 const button=document.querySelector('#heroPlay');
 const bar=document.querySelector('.hero-card .bar span');
 const duration=document.querySelector('.hero-card .player small');
 const bars=[...document.querySelectorAll('.hero-card .wave i')];
 if(!button||!bar)return;
 let heroAudio=null;
 let started=false;
 let audioContext=null;
 let analyser=null;
 let source=null;
 let animationFrame=null;
 const idleHeights=[.22,.55,.88,.58,.42,.72,.9,.48,.76,.9,.5,.68,.34];

 const resetWave=()=>{
  bars.forEach((barEl,index)=>{barEl.style.height=`${idleHeights[index%idleHeights.length]*100}%`;barEl.style.transform='scaleY(1)';});
 };

 const animateWave=()=>{
  if(!analyser||!bars.length)return;
  const data=new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  const step=Math.max(1,Math.floor(data.length/bars.length));
  bars.forEach((barEl,index)=>{
   let sum=0;
   const start=index*step;
   const end=Math.min(data.length,start+step);
   for(let i=start;i<end;i++)sum+=data[i];
   const level=(sum/Math.max(1,end-start))/255;
   const height=18+Math.pow(level,.72)*82;
   barEl.style.height=`${height}%`;
   barEl.style.transform=`scaleY(${.82+level*.28})`;
  });
  animationFrame=requestAnimationFrame(animateWave);
 };

 const stopWave=()=>{if(animationFrame)cancelAnimationFrame(animationFrame);animationFrame=null;resetWave();};

 const connectAnalyser=async()=>{
  if(audioContext)return;
  audioContext=new (window.AudioContext||window.webkitAudioContext)();
  analyser=audioContext.createAnalyser();
  analyser.fftSize=128;
  analyser.smoothingTimeConstant=.78;
  source=audioContext.createMediaElementSource(heroAudio);
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  await audioContext.resume();
 };

 const reset=()=>{
  button.disabled=false;
  button.textContent='▶';
  bar.style.width='0%';
  if(duration) duration.textContent=heroAudio&&Number.isFinite(heroAudio.duration)?formatDuration(heroAudio.duration):'—:——';
  stopWave();
 };

 button.addEventListener('click',async()=>{
  try{
   if(heroAudio&&started){
    if(heroAudio.paused){
     if(audioContext)await audioContext.resume();
     await heroAudio.play();
    }else{
     heroAudio.pause();
    }
    return;
   }
   button.disabled=true;
   button.textContent='…';
   heroAudio=new Audio('/api/sample-hero');
   heroAudio.preload='auto';
   heroAudio.addEventListener('loadedmetadata',()=>{if(duration&&Number.isFinite(heroAudio.duration))duration.textContent=formatDuration(heroAudio.duration);});
   heroAudio.addEventListener('timeupdate',()=>{if(bar&&heroAudio.duration)bar.style.width=`${(heroAudio.currentTime/heroAudio.duration)*100}%`;});
   heroAudio.addEventListener('play',async()=>{
    started=true;
    button.disabled=false;
    button.textContent='Ⅱ';
    await connectAnalyser();
    if(!animationFrame)animateWave();
   });
   heroAudio.addEventListener('pause',()=>{if(started){button.textContent='▶';stopWave();}});
   heroAudio.addEventListener('ended',()=>{reset();started=false;});
   heroAudio.addEventListener('error',()=>{reset();console.error('Hero sample unavailable');});
   await heroAudio.play();
  }catch(err){reset();console.error(err);}
 });
 resetWave();
}

function formatDuration(seconds){
 const total=Math.max(0,Math.round(seconds));
 const minutes=Math.floor(total/60); const secs=String(total%60).padStart(2,'0');
 return `${String(minutes).padStart(2,'0')}:${secs}`;
}

setupHeroPlayer();
renderSampleVoices();
