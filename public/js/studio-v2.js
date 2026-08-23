(()=>{
let voices=window.SVARA_VOICES||[],list=document.getElementById('voiceList'),search=document.getElementById('voiceSearch');
let filter='all',selected=voices[0]||null,currentUrl=null,account=null,creditFactor=0.5,maxGenerationChars=10000;
const $=id=>document.getElementById(id),CREDIT_KEY='svaraOrigins.demoCredits.v2',START_CREDITS=5000;
let fullVoiceCatalogue=false, audioContext=null, analyser=null, sourceNode=null, visualFrame=0;

const LANGUAGE_NAMES={en:'English',es:'Spanish',de:'German',fr:'French',nl:'Dutch',it:'Italian',ja:'Japanese'};
const LANGUAGE_WORDS={
  en:new Set('the and to of in is a for with your voice create welcome global professional content that sounds natural human real this you we are from on as it'.split(' ')),
  es:new Set('el la los las de del un una y en es para con tu voz crear bienvenido bienvenida mundo contenido que natural humana este esta por como'.split(' ')),
  de:new Set('der die das den dem ein eine und ist für mit ihre ihr stimme erstellen willkommen welt inhalt natürlich menschlich diese dieser von zu'.split(' ')),
  fr:new Set('le la les de des du un une et en est pour avec votre voix créer bienvenue monde contenu qui naturel naturelle humaine ce cette dans'.split(' ')),
  nl:new Set('de het een en van is voor met je jouw stem maken welkom wereld inhoud die natuurlijk menselijk dit deze zijn te'.split(' ')),
  it:new Set('il lo la gli le di del un una e è per con la tua voce creare benvenuto benvenuta mondo contenuto naturale umano questa questo'.split(' '))
};

function credits(){return Number(localStorage.getItem(CREDIT_KEY)??START_CREDITS)}
function setCredits(n){const value=Math.max(0,n);localStorage.setItem(CREDIT_KEY,String(value));if($('creditBalance'))$('creditBalance').textContent=`${value.toLocaleString()} credits`;if($('topCredits'))$('topCredits').textContent=value.toLocaleString()}
function generationCost(n){return Math.max(1,Math.ceil(n/creditFactor))}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function displayName(v){return String(v.name||v.voice_id||'Voice').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}
function normalizeVoice(v){const id=v.voice_id||'',parts=id.split('-'),lang=parts[parts.length-1]||'en',meta=v.metadata||{};return {id:`deepgram-${id}`,name:meta.name||displayName(v),region:meta.accent||meta.language||lang.toUpperCase(),category:lang,style:(meta.characteristics||[])[0]||'Natural',gender:meta.gender||'',provider:'deepgram',providerVoiceId:id,metadata:meta}}

async function loadPricing(){
  try{
    const res=await fetch('/api/pricing',{cache:'no-store'});
    if(res.ok){
      const data=await res.json();
      const value=Number(data.creditFactor);
      if(Number.isFinite(value)&&value>0)creditFactor=value;
      fullVoiceCatalogue=data.fullVoiceCatalogue===true;
    }
  }catch(_){}
}
async function loadAccount(){
  const res=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data.authenticated){window.location.replace('/login.html?next=/studio');return false}
  account=data.user||null;
  maxGenerationChars=account?.subscription?.plan?10000:5000;
  const balance=Number(account?.credits||0);
  localStorage.setItem(CREDIT_KEY,String(balance));setCredits(balance);
  const pill=document.querySelector('.user-pill');
  if(pill)pill.textContent=`${account?.display_name||account?.email||'Account'} · ${account?.subscription?.plan||'Free'}`;
  return true
}
async function logout(){await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{});localStorage.removeItem(CREDIT_KEY);window.location.replace('/')}
async function loadDeepgramVoices(){
  const status=$('voiceStatus');
  try{
    const res=await fetch('/api/voices',{headers:{accept:'application/json'},cache:'no-store'});
    if(!res.ok)throw new Error(`Catalogue unavailable (${res.status})`);
    const data=await res.json();
    let discovered=(data.voices||[]).map(normalizeVoice);
    const allowed=new Set(account?.voices||[]);
    if(!fullVoiceCatalogue&&allowed.size)discovered=discovered.filter(v=>allowed.has(v.providerVoiceId));
    voices=discovered;selected=voices[0]||null;
    status.textContent=voices.length?`${voices.length} voices available on your plan`:'No voices are currently assigned to this account';
    render();hideLanguageWarning();
  }catch(err){status.textContent='Could not load the voice catalogue';render()}
}
function render(){
  if(!list)return;
  const q=(search.value||'').toLowerCase();
  list.innerHTML=voices.filter(v=>(filter==='all'||v.providerVoiceId.endsWith(`-${filter}`))&&`${v.name} ${v.region} ${v.style} ${v.providerVoiceId} ${JSON.stringify(v.metadata||{})}`.toLowerCase().includes(q))
    .map(v=>`<button class="voice ${selected&&selected.id===v.id?'selected':''}" data-id="${escapeHtml(v.id)}"><span class="avatar">${escapeHtml((v.name||'V')[0])}</span><span><b>${escapeHtml(v.name)}</b><small>${escapeHtml(v.region)} · ${escapeHtml(v.style)}${v.gender?` · ${escapeHtml(v.gender)}`:''}</small></span><em>›</em></button>`).join('');
  list.querySelectorAll('.voice').forEach(b=>b.onclick=()=>{
    selected=voices.find(v=>v.id===b.dataset.id)||selected;
    render();
    hideLanguageWarning();
  });
}
document.querySelectorAll('#voiceFilters button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#voiceFilters button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');filter=b.dataset.filter;render()
});
search.oninput=render;

const script=$('script');
$('speed').oninput=e=>$('speedValue').textContent=`${Number(e.target.value).toFixed(2)}×`;
$('stability').oninput=e=>$('stabilityValue').textContent=`${e.target.value}%`;

function detectTextLanguage(text){
  const cleaned=String(text||'').toLowerCase();
  if(!cleaned.trim())return null;
  if(/[\u3040-\u30ff\u3400-\u9fff]/.test(cleaned))return 'ja';
  const tokens=(cleaned.match(/[a-zà-ÿ]+/g)||[]);
  if(tokens.length<5)return null;
  const scores={};
  for(const [lang,words] of Object.entries(LANGUAGE_WORDS))scores[lang]=tokens.reduce((sum,t)=>sum+(words.has(t)?1:0),0);
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  if(!ranked.length||ranked[0][1]<2)return null;
  if(ranked[1]&&ranked[0][1]-ranked[1][1]<1)return null;
  return ranked[0][0];
}
function hideLanguageWarning(){
  const box=$('languageWarning');
  if(!box)return;
  box.hidden=true;
  box.innerHTML='';
}
function languageMismatch(){
  const voiceLang=selected?.category||'en';
  if(!selected||voiceLang==='en')return null;
  const detected=detectTextLanguage(script.value);
  if(!detected||detected===voiceLang)return null;
  return {voiceLang,detected};
}
function showLanguageMismatch(mismatch){
  const box=$('languageWarning');
  if(!box||!mismatch)return;
  const voiceName=LANGUAGE_NAMES[mismatch.voiceLang]||mismatch.voiceLang.toUpperCase();
  const detectedName=LANGUAGE_NAMES[mismatch.detected]||mismatch.detected.toUpperCase();
  box.innerHTML=`<strong>Language mismatch</strong><span>This voice is ${escapeHtml(voiceName)}, but your script appears to be ${escapeHtml(detectedName)}. Aura-2 voices are language-specific. Switch the voice or rewrite the script before generating.</span>`;
  box.hidden=false;
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
}
script.addEventListener('input',hideLanguageWarning);

function outputSettings(){
  const format=$('outputFormat')?.value||'mp3';
  if(format==='wav')return {format,extension:'wav',downloadLabel:'Download WAV',mime:'audio/wav'};
  if(format==='pcm')return {format,extension:'pcm',downloadLabel:'Download PCM',mime:'audio/l16;rate=24000'};
  return {format:'mp3',extension:'mp3',downloadLabel:'Download MP3',mime:'audio/mpeg'}
}
function formatTime(seconds){
  if(!Number.isFinite(seconds)||seconds<0)return '0:00';
  const s=Math.floor(seconds),m=Math.floor(s/60),r=String(s%60).padStart(2,'0');
  return `${m}:${r}`;
}
function setupAnalyser(){
  if(analyser||(!window.AudioContext&&!window.webkitAudioContext))return;
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    audioContext=new Ctx();
    sourceNode=audioContext.createMediaElementSource($('player'));
    analyser=audioContext.createAnalyser();
    analyser.fftSize=128;analyser.smoothingTimeConstant=.78;
    sourceNode.connect(analyser);analyser.connect(audioContext.destination);
  }catch(_){analyser=null;sourceNode=null}
}
function drawWaveform(){
  const canvas=$('waveformCanvas'),audio=$('player');
  if(!canvas)return;
  const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
  const w=Math.max(1,Math.floor(rect.width*dpr)),h=Math.max(1,Math.floor(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);
  const bars=48,gap=Math.max(3*dpr,w/(bars*5)),barW=Math.max(2*dpr,(w-(bars-1)*gap)/bars);
  let data=null;
  if(analyser&&audio&&!audio.paused){data=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(data)}
  const progress=audio&&Number.isFinite(audio.duration)&&audio.duration>0?audio.currentTime/audio.duration:0;
  for(let i=0;i<bars;i++){
    const x=i*(barW+gap),active=i/bars<=progress;
    let amp=.25+.18*Math.sin(i*.91);
    if(data)amp=Math.max(.12,data[Math.floor(i/bars*data.length)]/255);
    if(audio&&!audio.paused)amp*=.72+.45*Math.sin(performance.now()/170+i*.55)**2;
    const bh=Math.max(5*dpr,amp*h*.82),y=(h-bh)/2;
    ctx.fillStyle=active?'#24dec6':'#33475a';ctx.globalAlpha=active?.95:.75;
    ctx.beginPath();ctx.roundRect(x,y,barW,bh,barW/2);ctx.fill();
  }
  ctx.globalAlpha=1;
  if(audio&&!audio.paused)visualFrame=requestAnimationFrame(drawWaveform);
}
function refreshPlayer(){
  const audio=$('player'),toggle=$('playToggle'),time=$('playerTime');
  if(!audio)return;
  const paused=audio.paused;
  toggle.classList.toggle('playing',!paused);
  toggle.setAttribute('aria-label',paused?'Play generated voice':'Pause generated voice');
  time.textContent=`${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  drawWaveform();
}
async function togglePlayback(){
  const audio=$('player');if(!audio.src)return;
  try{
    setupAnalyser();
    if(audioContext&&audioContext.state==='suspended')await audioContext.resume();
    if(audio.paused)await audio.play();else audio.pause();
  }catch(_){$('status').textContent='Playback unavailable'}
}
$('playToggle').onclick=togglePlayback;
$('player').addEventListener('play',refreshPlayer);
$('player').addEventListener('pause',refreshPlayer);
$('player').addEventListener('ended',()=>{refreshPlayer();drawWaveform()});
$('player').addEventListener('timeupdate',refreshPlayer);
$('player').addEventListener('loadedmetadata',refreshPlayer);
$('waveformShell').onclick=e=>{
  const audio=$('player');if(!audio.src||!Number.isFinite(audio.duration))return;
  const rect=e.currentTarget.getBoundingClientRect();
  audio.currentTime=Math.max(0,Math.min(audio.duration,(e.clientX-rect.left)/rect.width*audio.duration));
  refreshPlayer();
};

$('generate').onclick=async()=>{
  const text=script.value.trim();if(!text||!selected)return;
  hideLanguageWarning();
  const mismatch=languageMismatch();
  if(mismatch){
    showLanguageMismatch(mismatch);
    $('status').textContent='Review language';
    return;
  }
  const n=text.length;
  if(n>maxGenerationChars){$('status').textContent=`Maximum ${maxGenerationChars.toLocaleString()} characters`;return}
  const costInCredits=generationCost(n);
  if(costInCredits>credits()){$('status').textContent='Not enough credits';return}
  const btn=$('generate'),output=outputSettings();
  btn.disabled=true;btn.textContent='Generating…';$('status').textContent='Generating';$('debug').textContent='';
  try{
    const res=await fetch('/api/voice/generate',{
      method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',
      body:JSON.stringify({voiceId:selected.id,providerVoiceId:selected.providerVoiceId,text,format:output.format,speed:Number($('speed').value),stability:Number($('stability').value),style:$('style').value})
    });
    if(!res.ok){const data=await res.json().catch(()=>({}));throw new Error(data.error||`Generation failed (${res.status})`)}
    const blob=await res.blob();
    if(currentUrl)URL.revokeObjectURL(currentUrl);
    currentUrl=URL.createObjectURL(blob);
    const player=$('player');
    player.pause();player.src=output.format==='pcm'?'':currentUrl;player.hidden=output.format==='pcm';
    if(output.format!=='pcm')player.load();
    $('download').href=currentUrl;$('download').download=`svaraone-generation.${output.extension}`;$('download').textContent=output.downloadLabel;
    $('result').hidden=false;$('empty').hidden=true;$('status').textContent=output.format==='pcm'?'Ready · PCM':'Ready';
    $('customPlayer').hidden=output.format==='pcm';$('pcmReady').hidden=output.format!=='pcm';
    $('playerTitle').textContent=`${selected.name} · ${output.extension.toUpperCase()}`;
    refreshPlayer();
    const remaining=Number(res.headers.get('X-SvaraONE-Credits-Remaining'));
    if(Number.isFinite(remaining))setCredits(remaining);else await loadAccount();
  }catch(e){$('status').textContent='Error';$('debug').textContent=e.message}
  finally{btn.disabled=false;btn.textContent='✦ Generate voice'}
};

(async()=>{
  await loadAccount();await loadPricing();
  if(account){
    script.maxLength=maxGenerationChars;
    const logoutButton=document.querySelector('#logoutButton');if(logoutButton)logoutButton.onclick=logout;
    render();loadDeepgramVoices();hideLanguageWarning();
  }
})();
})();