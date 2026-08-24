(()=>{
let voices=window.SVARA_VOICES||[],list=document.getElementById('voiceList'),search=document.getElementById('voiceSearch');
let filter='all',selected=voices[0]||null,currentUrl=null,account=null,creditFactor=0.5,maxGenerationChars=10000;
const $=id=>document.getElementById(id),CREDIT_KEY='svaraOrigins.demoCredits.v2',START_CREDITS=5000;
let fullVoiceCatalogue=false,audioContext=null,analyser=null,sourceNode=null,visualFrame=0,previewAudio=null,previewVoiceId=null;

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
function escapeHtml(s){return String(s).replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function displayName(v){return String(v.name||v.voice_id||'Voice').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}
function normalizeVoice(v){
  if(v.id&&v.providerVoiceId)return {id:String(v.id),name:String(v.name||'Voice'),region:String(v.region||v.accent||v.language||''),category:String(v.category||'en'),style:String(v.style||'Natural'),gender:String(v.gender||''),age:String(v.age||''),provider:String(v.provider||'deepgram'),providerVoiceId:String(v.providerVoiceId),sampleUrl:String(v.sampleUrl||''),sampleStatus:String(v.sampleStatus||'missing'),languageName:String(v.languageName||LANGUAGE_NAMES[v.category]||v.category||''),characteristics:Array.isArray(v.characteristics)?v.characteristics:[],metadata:v.metadata||{}};
  const id=v.voice_id||'',parts=id.split('-'),lang=parts[parts.length-1]||'en',meta=v.metadata||{};
  return {id:`deepgram-${id}`,name:meta.name||displayName(v),region:meta.accent||meta.language||lang.toUpperCase(),category:lang,style:(meta.characteristics||[])[0]||'Natural',gender:meta.gender||'',age:meta.age||'',provider:'deepgram',providerVoiceId:id,sampleUrl:'',sampleStatus:'missing',languageName:LANGUAGE_NAMES[lang]||lang.toUpperCase(),characteristics:meta.characteristics||[],metadata:meta};
}

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
async function logout(){stopPreview();await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{});localStorage.removeItem(CREDIT_KEY);window.location.replace('/')}

function stopPreview(){
  if(!previewAudio)return;
  previewAudio.pause();previewAudio.currentTime=0;previewVoiceId=null;render();
}
async function togglePreview(voice){
  if(!voice?.sampleUrl)return;
  if(previewVoiceId===voice.id&&previewAudio&&!previewAudio.paused){previewAudio.pause();return}
  if(!previewAudio){
    previewAudio=new Audio();
    previewAudio.preload='none';
    previewAudio.addEventListener('ended',()=>{previewVoiceId=null;render()});
    previewAudio.addEventListener('pause',()=>{if(previewVoiceId)render()});
    previewAudio.addEventListener('error',()=>{previewVoiceId=null;render()});
  }
  if(previewAudio.src!==new URL(voice.sampleUrl,window.location.origin).href){previewAudio.src=voice.sampleUrl;previewAudio.load()}
  previewVoiceId=voice.id;
  try{await previewAudio.play();render()}catch(_){previewVoiceId=null;render()}
}
function voiceWave(){return Array.from({length:24},(_,i)=>`<i style="--h:${10+(Math.abs(Math.sin(i*1.73))*24)|0}px"></i>`).join('')}

async function loadVoiceRegistry(){
  const status=$('voiceStatus');
  try{
    const res=await fetch('/api/voices',{headers:{accept:'application/json'},cache:'no-store'});
    if(!res.ok)throw new Error(`Catalogue unavailable (${res.status})`);
    const data=await res.json();
    let discovered=(data.voices||[]).map(normalizeVoice);
    const allowed=new Set(account?.voices||[]);
    if(!fullVoiceCatalogue&&allowed.size)discovered=discovered.filter(v=>allowed.has(v.providerVoiceId)||allowed.has(v.id));
    voices=discovered;selected=voices[0]||null;
    status.textContent=voices.length?`${voices.length} voices available on your plan`:'No voices are currently assigned to this account';
    render();hideLanguageWarning();
  }catch(err){status.textContent='Could not load the voice catalogue';render()}
}
function render(){
  if(!list)return;
  const q=(search.value||'').toLowerCase();
  list.innerHTML=voices.filter(v=>(filter==='all'||v.category===filter)&&`${v.name} ${v.region} ${v.style} ${v.languageName} ${v.providerVoiceId} ${JSON.stringify(v.metadata||{})}`.toLowerCase().includes(q))
    .map(v=>{
      const gender=String(v.gender||'').trim();
      const region=String(v.region||'').trim();
      const language=String(v.languageName||'').trim();
      const style=String(v.style||'').trim();
      const tags=[gender,region,language,style&&style!=='Natural'?style:''].filter(Boolean).map(escapeHtml).join(' · ');
      return `<button class="voice ${selected&&selected.id===v.id?'selected':''}" data-id="${escapeHtml(v.id)}"><div class="voice-main"><span class="avatar">${escapeHtml((v.name||'V')[0])}</span><span class="voice-copy"><b>${escapeHtml(v.name)}</b></span><span class="preview-button ${previewVoiceId===v.id&&!previewAudio?.paused?'playing':''}" data-preview-id="${escapeHtml(v.id)}" aria-label="${previewVoiceId===v.id&&!previewAudio?.paused?'Pause':'Play'} ${escapeHtml(v.name)} preview">${previewVoiceId===v.id&&!previewAudio?.paused?'❚❚':'▶'}</span></div><div class="voice-wave ${previewVoiceId===v.id&&!previewAudio?.paused?'playing':''}" aria-hidden="true">${voiceWave()}</div><div class="voice-preview-label"><span>${v.sampleStatus==='ready'?'Voice preview':'Preview'}</span><span>${previewVoiceId===v.id&&!previewAudio?.paused?'Playing':'Listen'}</span></div><div class="voice-card-meta" title="${escapeHtml(tags)}">${tags}</div></button>`;
    }).join('');
  list.querySelectorAll('.voice').forEach(b=>b.onclick=e=>{
    const preview=e.target.closest('[data-preview-id]');
    const voice=voices.find(v=>v.id===b.dataset.id);
    if(preview){e.preventDefault();e.stopPropagation();togglePreview(voice);return}
    selected=voice||selected;hideLanguageWarning();render();
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
  box.hidden=true;box.innerHTML='';
}
function languageMismatch(){
  const voiceLang=selected?.category||'en';
  if(!selected||voiceLang==='en')return null;
  const detected=detectTextLanguage(script.value);
  if(!detected||detected===voiceLang)return null;
  return {voiceLang,detected};
}
function showLanguageMismatch(mismatch){
  const box=$('languageWarning');if(!box||!mismatch)return;
  const voiceName=LANGUAGE_NAMES[mismatch.voiceLang]||mismatch.voiceLang.toUpperCase();
  const detectedName=LANGUAGE_NAMES[mismatch.detected]||mismatch.detected.toUpperCase();
  box.innerHTML=`<strong>Language mismatch</strong><span>The selected voice is ${escapeHtml(voiceName)}. Switch to a voice that matches your script language. Alternatively rewrite the script language for the selected voice.</span>`;
  box.hidden=false;box.scrollIntoView({behavior:'smooth',block:'nearest'});
}
script.addEventListener('input',hideLanguageWarning);

function outputSettings(){
  const format=$('outputFormat')?.value||'mp3';
  if(format==='wav')return {format,extension:'wav',downloadLabel:'Download WAV',mime:'audio/wav'};
  if(format==='pcm')return {format,extension:'pcm',downloadLabel:'Download PCM',mime:'audio/l16;rate=24000'};
  return {format:'mp3',extension:'mp3',downloadLabel:'Download MP3',mime:'audio/mpeg'}
}
function updateFormatReady(format){
  const card=$('formatReady'),badge=$('formatBadge'),title=$('formatTitle'),description=$('formatDescription');if(!card)return;
  const info={mp3:{badge:'MP3',title:'MP3 audio ready',description:'Compressed audio output — ready to play, share or download.'},wav:{badge:'WAV',title:'WAV audio ready',description:'Uncompressed audio output — ideal for editing and production workflows.'},pcm:{badge:'PCM',title:'Linear16 audio ready',description:'Raw PCM output — download the file to use it in your audio workflow.'}}[format]||{badge:format.toUpperCase(),title:`${format.toUpperCase()} audio ready`,description:'Audio output is ready to download and use in your workflow.'};
  badge.textContent=info.badge;title.textContent=info.title;description.textContent=info.description;
}
function formatTime(seconds){if(!Number.isFinite(seconds)||seconds<0)return '0:00';const s=Math.floor(seconds),m=Math.floor(s/60),r=String(s%60).padStart(2,'0');return `${m}:${r}`}
function setupAnalyser(){
  if(analyser||(!window.AudioContext&&!window.webkitAudioContext))return;
  try{const Ctx=window.AudioContext||window.webkitAudioContext;audioContext=new Ctx();sourceNode=audioContext.createMediaElementSource($('player'));analyser=audioContext.createAnalyser();analyser.fftSize=128;analyser.smoothingTimeConstant=.78;sourceNode.connect(analyser);analyser.connect(audioContext.destination)}catch(_){analyser=null;sourceNode=null}
}
function drawWaveform(){
  const canvas=$('waveformCanvas'),audio=$('player');if(!canvas)return;
  const rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,w=Math.max(1,Math.floor(rect.width*dpr)),h=Math.max(1,Math.floor(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  const ctx=canvas.getContext('2d');ctx.clearRect(0,0,w,h);const bars=48,gap=Math.max(3*dpr,w/(bars*5)),barW=Math.max(2*dpr,(w-(bars-1)*gap)/bars);let data=null;
  if(analyser&&audio&&!audio.paused){data=new Uint8Array(analyser.frequencyBinCount);analyser.getByteFrequencyData(data)}
  const progress=audio&&Number.isFinite(audio.duration)&&audio.duration>0?audio.currentTime/audio.duration:0;
  for(let i=0;i<bars;i++){const x=i*(barW+gap),active=i/bars<=progress;let amp=.25+.18*Math.sin(i*.91);if(data)amp=Math.max(.12,data[Math.floor(i/bars*data.length)]/255);if(audio&&!audio.paused)amp*=.72+.45*Math.sin(performance.now()/170+i*.55)**2;const bh=Math.max(5*dpr,amp*h*.82),y=(h-bh)/2;ctx.fillStyle=active?'#24dec6':'#33475a';ctx.globalAlpha=active?.95:.75;ctx.beginPath();ctx.roundRect(x,y,barW,bh,barW/2);ctx.fill()}
  ctx.globalAlpha=1;if(audio&&!audio.paused)visualFrame=requestAnimationFrame(drawWaveform)
}
function refreshPlayer(){const audio=$('player'),toggle=$('playToggle'),time=$('playerTime');if(!audio)return;const paused=audio.paused;toggle.classList.toggle('playing',!paused);toggle.setAttribute('aria-label',paused?'Play generated voice':'Pause generated voice');time.textContent=`${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;drawWaveform()}
async function togglePlayback(){const audio=$('player');if(!audio.src)return;try{setupAnalyser();if(audioContext&&audioContext.state==='suspended')await audioContext.resume();if(audio.paused)await audio.play();else audio.pause()}catch(_){$('status').textContent='Playback unavailable'}}
$('playToggle').onclick=togglePlayback;$('player').addEventListener('play',refreshPlayer);$('player').addEventListener('pause',refreshPlayer);$('player').addEventListener('ended',()=>{refreshPlayer();drawWaveform()});$('player').addEventListener('timeupdate',refreshPlayer);$('player').addEventListener('loadedmetadata',refreshPlayer);
$('waveformShell').onclick=e=>{const audio=$('player');if(!audio.src||!Number.isFinite(audio.duration))return;const rect=e.currentTarget.getBoundingClientRect();audio.currentTime=Math.max(0,Math.min(audio.duration,(e.clientX-rect.left)/rect.width*audio.duration));refreshPlayer()};

$('generate').onclick=async()=>{
  const text=script.value.trim();if(!text||!selected)return;hideLanguageWarning();const mismatch=languageMismatch();if(mismatch){showLanguageMismatch(mismatch);$('status').textContent='Review language';return}
  const n=text.length;if(n>maxGenerationChars){$('status').textContent=`Maximum ${maxGenerationChars.toLocaleString()} characters`;return}
  const costInCredits=generationCost(n);if(costInCredits>credits()){$('status').textContent='Not enough credits';return}
  const btn=$('generate'),output=outputSettings();btn.disabled=true;btn.textContent='Generating…';$('status').textContent='Generating';$('debug').textContent='';
  try{
    const res=await fetch('/api/voice/generate',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({voiceId:selected.id,text,format:output.format,speed:Number($('speed').value),stability:Number($('stability').value),style:$('style').value})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok){
      if(res.status===402&&data.code==='INSUFFICIENT_CREDITS'){$('status').textContent='Not enough credits';$('creditWarning').hidden=false;$('creditWarning').innerHTML='<strong>Insufficient credits</strong><span>Your script exceeds your remaining credit limit. Upgrade or purchase more credits to continue.</span>';}
      else{$('status').textContent=data.error||'Generation failed';$('debug').textContent=data.details||''}
      return
    }
    const previous=Number(account?.credits||credits());
    const remaining=Number(data.remainingCredits);
    if(Number.isFinite(remaining)){setCredits(remaining);if(account)account.credits=remaining}else if(Number.isFinite(data.cost))setCredits(previous-Number(data.cost));
    $('creditWarning').hidden=true;$('status').textContent='Ready';
    if(currentUrl)URL.revokeObjectURL(currentUrl);currentUrl=URL.createObjectURL(new Blob([Uint8Array.from(atob(data.audio),c=>c.charCodeAt(0))],{type:output.mime}));
    const audio=$('player');audio.src=currentUrl;audio.load();$('playerTitle').textContent=`${selected.name} · ${output.format.toUpperCase()}`;$('empty').hidden=true;$('result').hidden=false;$('customPlayer').hidden=false;updateFormatReady(output.format);$('download').href=currentUrl;$('download').download=`svaraone-${selected.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.${output.extension}`;refreshPlayer();
  }catch(err){$('status').textContent='Generation failed';$('debug').textContent=err?.message||String(err)}
  finally{btn.disabled=false;btn.textContent='✦ Generate voice'}
};

$('logoutButton').onclick=logout;
loadPricing().then(loadAccount).then(ok=>ok&&loadVoiceRegistry());
})();
