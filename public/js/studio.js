(()=>{
let voices=window.SVARA_VOICES||[], list=document.getElementById('voiceList'), search=document.getElementById('voiceSearch');
let filter='all', selected=voices[0]||null, currentUrl=null;
const $=id=>document.getElementById(id), PROJECT_KEY='svaraOrigins.projects.v2', CREDIT_KEY='svaraOrigins.demoCredits.v2', START_CREDITS=5000;
function credits(){return Number(localStorage.getItem(CREDIT_KEY)??START_CREDITS)}
function setCredits(n){localStorage.setItem(CREDIT_KEY,String(Math.max(0,n)));$('creditBalance').textContent=`${Math.max(0,n).toLocaleString()} credits`;$('creditLarge').textContent=Math.max(0,n).toLocaleString()}
function projects(){try{return JSON.parse(localStorage.getItem(PROJECT_KEY)||'[]')}catch{return[]}}
function saveProjects(p){localStorage.setItem(PROJECT_KEY,JSON.stringify(p.slice(0,25)));renderProjects()}
function renderProjects(){const p=projects(),el=$('projectList');if(!p.length){el.innerHTML='<p class="muted">No saved projects yet.</p>';return}el.innerHTML=p.map(x=>`<article class="project"><div><b>${escapeHtml(x.name)}</b><small>${escapeHtml(x.voice)} · ${x.characters.toLocaleString()} chars · ${new Date(x.createdAt).toLocaleString()}</small></div><button class="ghost button small-button" data-project="${x.id}">Load</button></article>`).join('');el.querySelectorAll('[data-project]').forEach(b=>b.onclick=()=>loadProject(b.dataset.project))}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function displayName(v){return String(v.name||v.voice_id||'Voice').replace(/-/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}
function normalizeVoice(v){const id=v.voice_id||'';const parts=id.split('-');const lang=parts[parts.length-1]||'en';const meta=v.metadata||{};return {id:`deepgram-${id}`,name:meta.name||displayName(v),region:meta.accent||meta.language||lang.toUpperCase(),category:lang,style:(meta.characteristics||[])[0]||'Natural',gender:meta.gender||'',provider:'deepgram',providerVoiceId:id,metadata:meta}}
async function loadDeepgramVoices(){
  const status=$('voiceStatus');
  try{
    const res=await fetch('/api/voices',{headers:{accept:'application/json'},cache:'no-store'});
    if(!res.ok) throw new Error(`Catalogue unavailable (${res.status})`);
    const data=await res.json();
    const discovered=(data.voices||[]).map(normalizeVoice);
    if(!discovered.length) throw new Error('No Deepgram voices returned');
    voices=discovered; selected=voices[0]; status.textContent=`${voices.length} voices available`;
    render();
  }catch(err){
    status.textContent='Could not load live catalogue — showing local fallback';
    render();
  }
}
function loadProject(id){const p=projects().find(x=>x.id===id);if(!p)return;$('script').value=p.text;$('style').value=p.style||'Conversational';$('speed').value=p.speed||1;updateCount();selected=voices.find(v=>v.id===p.voiceId)||voices.find(v=>v.providerVoiceId===p.providerVoiceId)||selected;render();window.scrollTo({top:0,behavior:'smooth'})}
function render(){if(!list)return;const q=(search.value||'').toLowerCase();list.innerHTML=voices.filter(v=>(filter==='all'||v.providerVoiceId.endsWith(`-${filter}`))&&`${v.name} ${v.region} ${v.style} ${v.providerVoiceId} ${JSON.stringify(v.metadata||{})}`.toLowerCase().includes(q)).map(v=>`<button class="voice ${selected&&selected.id===v.id?'selected':''}" data-id="${escapeHtml(v.id)}"><span class="avatar">${escapeHtml((v.name||'V')[0])}</span><span><b>${escapeHtml(v.name)}</b><small>${escapeHtml(v.region)} · ${escapeHtml(v.style)}${v.gender?` · ${escapeHtml(v.gender)}`:''}</small></span><em>›</em></button>`).join('');list.querySelectorAll('.voice').forEach(b=>b.onclick=()=>{selected=voices.find(v=>v.id===b.dataset.id)||selected;render()})}
document.querySelectorAll('#voiceFilters button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#voiceFilters button').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()});search.oninput=render;
const script=$('script'),count=$('charCount'),cost=$('estimatedCost');
function updateCount(){const n=script.value.length;count.textContent=`${n.toLocaleString()} / 10,000`;cost.textContent=`${n.toLocaleString()} credits`}
script.addEventListener('input',updateCount);updateCount();setCredits(credits());$('speed').oninput=e=>$('speedValue').textContent=`${Number(e.target.value).toFixed(2)}×`;$('stability').oninput=e=>$('stabilityValue').textContent=`${e.target.value}%`;
$('generate').onclick=async()=>{const text=script.value.trim();if(!text||!selected)return;const n=text.length;if(n>credits()){$('status').textContent='Not enough credits';return}const btn=$('generate');btn.disabled=true;btn.textContent='Generating…';$('status').textContent='Generating';$('debug').textContent='';try{const res=await fetch('/api/voice/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({voiceId:selected.id,providerVoiceId:selected.providerVoiceId,text,format:'mp3',speed:Number($('speed').value),stability:Number($('stability').value),style:$('style').value})});if(!res.ok)throw new Error(`Generation failed (${res.status})`);const blob=await res.blob();if(currentUrl)URL.revokeObjectURL(currentUrl);currentUrl=URL.createObjectURL(blob);$('player').src=currentUrl;$('download').href=currentUrl;$('result').hidden=false;$('empty').hidden=true;$('status').textContent='Ready';setCredits(credits()-n);window.SvaraLibrary?.invalidate?.()}catch(e){$('status').textContent='Error';$('debug').textContent=e.message}finally{btn.disabled=false;btn.textContent='✦ Generate voice'}};
$('save').onclick=()=>{if(!$('result').hidden){const p=projects();p.unshift({id:crypto.randomUUID(),name:(script.value.trim().slice(0,42)||'Untitled project'),voiceId:selected.id,providerVoiceId:selected.providerVoiceId,voice:selected.name,text:script.value,characters:script.value.length,speed:Number($('speed').value),style:$('style').value,createdAt:new Date().toISOString()});saveProjects(p);$('savedNotice').hidden=false}};
$('clearProjects').onclick=()=>{if(confirm('Clear locally saved Svara Origins projects?')){localStorage.removeItem(PROJECT_KEY);renderProjects()}};
render();renderProjects();loadDeepgramVoices();
})();