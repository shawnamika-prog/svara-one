const SAMPLE_TEXT={en:'Hello, and welcome to SvaraONE. Discover a voice that sounds natural, expressive, and ready for real work.',es:'Hola, y bienvenido a SvaraONE. Descubre una voz natural, expresiva y lista para el trabajo real.',de:'Hallo und willkommen bei SvaraONE. Entdecken Sie eine natürliche, ausdrucksstarke Stimme für echte Projekte.',fr:'Bonjour et bienvenue chez SvaraONE. Découvrez une voix naturelle, expressive et prête pour vos projets.',nl:'Hallo en welkom bij SvaraONE. Ontdek een natuurlijke, expressieve stem die klaar is voor echt werk.',it:'Ciao e benvenuto su SvaraONE. Scopri una voce naturale, espressiva e pronta per il lavoro reale.',ja:'こんにちは、SvaraONEへようこそ。自然で表現力豊かな音声を、実際のコンテンツにお使いいただけます。'};
const LANGUAGE_NAMES={en:'English',es:'Spanish',de:'German',fr:'French',nl:'Dutch',it:'Italian',ja:'Japanese'};
let activeAudio=null,activeUrl=null,allVoices=[];
function languageFor(voice){const id=String(voice.voice_id||'');return id.slice(id.lastIndexOf('-')+1).toLowerCase()||'en';}
function displayName(voice){const id=String(voice.voice_id||'');const raw=id.replace(/^aura-2-/,'').replace(/-[a-z]+$/,'');return raw?raw.charAt(0).toUpperCase()+raw.slice(1):'Voice';}
function accentFor(voice){return voice.metadata?.accent||voice.metadata?.language||'';}
function renderSamples(filter='all'){
 const grid=document.querySelector('#sampleVoiceGrid'); if(!grid)return;
 const voices=filter==='all'?allVoices:allVoices.filter(v=>languageFor(v)===filter);
 const groups={}; voices.forEach(v=>(groups[languageFor(v)]??=[]).push(v));
 grid.innerHTML='';
 Object.entries(groups).sort((a,b)=>(LANGUAGE_NAMES[a[0]]||a[0]).localeCompare(LANGUAGE_NAMES[b[0]]||b[0])).forEach(([lang,voicesForLanguage])=>{
  const group=document.createElement('section'); group.className='sample-language';
  const title=document.createElement('div'); title.className='sample-language-head'; title.innerHTML=`<h3>${LANGUAGE_NAMES[lang]||lang.toUpperCase()}</h3><span>${voicesForLanguage.length} voice${voicesForLanguage.length===1?'':'s'}</span>`; group.appendChild(title);
  const cards=document.createElement('div'); cards.className='sample-grid';
  voicesForLanguage.forEach(voice=>{
   const card=document.createElement('article'); card.className='sample-card';
   const name=displayName(voice), accent=accentFor(voice), meta=voice.metadata||{};
   card.innerHTML=`<div class="sample-play-mark">▶</div><h4>${name}</h4><p>${accent||LANGUAGE_NAMES[lang]||lang.toUpperCase()}${meta.gender?' · '+meta.gender:''}</p><button class="ghost button full sample-listen" type="button">Listen</button>`;
   card.querySelector('button').addEventListener('click',()=>playSample(voice,card.querySelector('button'),lang));
   cards.appendChild(card);
  });
  group.appendChild(cards); grid.appendChild(group);
 });
}
async function playSample(voice,button,lang){
 if(activeAudio){activeAudio.pause();activeAudio=null;} if(activeUrl){URL.revokeObjectURL(activeUrl);activeUrl=null;}
 const original='Listen'; button.disabled=true; button.textContent='Generating…';
 try{
  const res=await fetch('/api/voice/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({providerVoiceId:voice.voice_id,text:SAMPLE_TEXT[lang]||SAMPLE_TEXT.en})});
  if(!res.ok)throw new Error('Voice sample generation failed');
  const blob=await res.blob(); activeUrl=URL.createObjectURL(blob); activeAudio=new Audio(activeUrl); button.textContent='Playing…';
  activeAudio.onended=()=>{button.disabled=false;button.textContent=original;URL.revokeObjectURL(activeUrl);activeUrl=null;activeAudio=null;};
  await activeAudio.play();
 }catch(err){button.disabled=false;button.textContent=original;console.error(err);}
}
document.querySelectorAll('#heroPlay').forEach(b=>b.addEventListener('click',()=>{b.textContent=b.textContent==='▶'?'Ⅱ':'▶';document.querySelector('.bar span').style.width=b.textContent==='Ⅱ'?'62%':'0%';}));
async function loadVoiceCatalogue(){
 const summary=document.querySelector('#sampleSummary'),grid=document.querySelector('#sampleVoiceGrid'),filters=document.querySelector('#sampleLanguages'); if(!grid)return;
 try{
  const res=await fetch('/api/voices',{headers:{Accept:'application/json'}}); if(!res.ok)throw new Error('Catalogue request failed');
  const data=await res.json(); allVoices=Array.isArray(data.voices)?data.voices:[];
  const languages=[...new Set(allVoices.map(languageFor))].sort();
  summary.textContent=`${allVoices.length} Aura-2 voices across ${languages.length} languages. Listen to every voice in the current Deepgram catalogue.`;
  filters.innerHTML=`<button class="sample-filter active" data-lang="all">All voices</button>`+languages.map(l=>`<button class="sample-filter" data-lang="${l}">${LANGUAGE_NAMES[l]||l.toUpperCase()}</button>`).join('');
  filters.querySelectorAll('.sample-filter').forEach(btn=>btn.addEventListener('click',()=>{filters.querySelectorAll('.sample-filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderSamples(btn.dataset.lang);}));
  renderSamples();
 }catch(err){summary.textContent='Voice catalogue unavailable right now.';grid.innerHTML='<div class="sample-loading">Unable to load the current Deepgram voice catalogue.</div>';console.error(err);}
}
loadVoiceCatalogue();
