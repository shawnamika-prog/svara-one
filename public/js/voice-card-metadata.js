(()=>{
  const LABELS={
    ivr:'Phone Systems',
    'customer service':'Customer Service',
    commercial:'Advertising',
    advertising:'Advertising',
    interview:'Interviews',
    audiobook:'Audiobooks',
    'casual chat':'Casual Conversation'
  };
  const label=value=>LABELS[String(value||'').trim().toLowerCase()]||String(value||'').trim();
  const escape=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const decorate=()=>{
    const voices=Array.isArray(window.SVARA_VOICES)?window.SVARA_VOICES:[];
    if(!voices.length)return;
    const byId=new Map(voices.map(v=>[String(v.id),v]));
    document.querySelectorAll('#voiceList .voice[data-id]').forEach(card=>{
      const voice=byId.get(String(card.dataset.id));
      if(!voice)return;
      const meta=voice.metadata||{};
      const useCases=Array.isArray(meta.use_cases)?meta.use_cases:Array.isArray(meta.useCases)?meta.useCases:[];
      const unique=[...new Set(useCases.map(label).filter(Boolean))].slice(0,3);
      const gender=String(voice.gender||'').trim();
      const accent=String(voice.region||'').trim();
      const language=String(voice.languageName||'').trim();
      const identity=[accent,language,gender].filter(Boolean).join(' · ');
      const target=card.querySelector('.voice-card-meta');
      if(!target)return;
      target.innerHTML=`<div class="voice-meta-identity">${escape(identity)}</div>${unique.length?`<div class="voice-meta-usecase"><span>USE CASES</span> ${escape(unique.join(' · '))}</div>`:''}`;
      target.removeAttribute('title');
    });
  };
  const start=()=>{
    const list=document.getElementById('voiceList');
    if(!list)return;
    new MutationObserver(()=>requestAnimationFrame(decorate)).observe(list,{childList:true,subtree:true});
    decorate();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
