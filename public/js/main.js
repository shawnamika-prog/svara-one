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
  card.innerHTML=`<div class="sample-play-mark">▶</div><h4>${voice.language}</h4><p>${voice.name} · ${voice.accent}</p><button class="ghost button full sample-listen" type="button">Listen</button>`;
  card.querySelector('button').addEventListener('click',()=>playStoredSample(voice,card.querySelector('button')));
  cards.appendChild(card);
 });
 grid.appendChild(cards);
}
async function playStoredSample(voice,button){
 if(activeAudio){activeAudio.pause();activeAudio=null;document.querySelectorAll('.sample-listen').forEach(b=>{b.disabled=false;b.textContent='Listen';});}
 const original='Listen'; button.disabled=true; button.textContent='Loading…';
 try{
  const res=await fetch(`/api/sample-voices/${voice.code}`,{headers:{Accept:'audio/mpeg'}});
  if(!res.ok)throw new Error('Sample unavailable');
  const blob=await res.blob(); activeAudio=new Audio(URL.createObjectURL(blob)); button.textContent='Playing…';
  activeAudio.onended=()=>{button.disabled=false;button.textContent=original;activeAudio=null;};
  await activeAudio.play();
 }catch(err){button.disabled=false;button.textContent=original;console.error(err);}
}
document.querySelectorAll('#heroPlay').forEach(b=>b.addEventListener('click',()=>{b.textContent=b.textContent==='▶'?'Ⅱ':'▶';document.querySelector('.bar span').style.width=b.textContent==='Ⅱ'?'62%':'0%';}));
renderSampleVoices();
