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
  const label=value=>{
    const text=String(value||'').trim().toLowerCase();
    if(LABELS[text]) return LABELS[text];
    return text.replace(/\b\w/g,c=>c.toUpperCase());
  };
  const escape=value=>String(value??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const clean=value=>String(value??'').trim();
  const displayGender=value=>{
    const text=clean(value).toLowerCase();
    if(text==='masculine'||text==='male')return 'Masculine';
    if(text==='feminine'||text==='female')return 'Feminine';
    return clean(value);
  };

  const decorate=()=>{
    const voices=Array.isArray(window.SVARA_VOICES)?window.SVARA_VOICES:[];
    if(!voices.length)return;
    const byId=new Map(voices.map(v=>[String(v.id),v]));
    document.querySelectorAll('#voiceList .voice[data-id]').forEach(card=>{
      const voice=byId.get(String(card.dataset.id));
      if(!voice)return;

      const meta=voice.metadata||{};
      const rawCases=Array.isArray(voice.useCases)
        ? voice.useCases
        : Array.isArray(meta.use_cases)
          ? meta.use_cases
          : Array.isArray(meta.useCases)
            ? meta.useCases
            : [];
      const useCases=[...new Set(rawCases.map(label).filter(Boolean))].slice(0,3);

      const region=clean(meta.accent||voice.region||'');
      const language=clean(meta.language||voice.languageName||'');
      const gender=displayGender(meta.gender||voice.gender||'');
      const identity=[region,language,gender].filter(Boolean).join(' · ');

      const target=card.querySelector('.voice-card-meta');
      if(!target)return;
      target.innerHTML=`<div class="voice-meta-identity">${escape(identity)}</div>${useCases.length?`<div class="voice-meta-usecase"><span>Best For:</span> ${escape(useCases.join(' · '))}</div>`:''}`;
      target.removeAttribute('title');
    });
  };

  const start=()=>{
    const list=document.getElementById('voiceList');
    if(!list)return;
    new MutationObserver(()=>requestAnimationFrame(decorate)).observe(list,{childList:true,subtree:true});
    decorate();
    window.addEventListener('svara:voices-updated',decorate);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
