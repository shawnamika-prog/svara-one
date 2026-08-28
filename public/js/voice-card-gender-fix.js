(()=>{
  const escapeHtml=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const genderValues=new Set(['male','female','masculine','feminine']);
  const displayValue=value=>{const text=String(value??'').trim();return text?text.charAt(0).toUpperCase()+text.slice(1):''};
  const useCaseLabels={
    ivr:'Phone Systems',
    'customer service':'Customer Service',
    commercial:'Advertising',
    advertising:'Advertising',
    interview:'Interviews',
    audiobook:'Audiobooks',
    'casual chat':'Casual Conversation'
  };
  const displayUseCase=value=>useCaseLabels[String(value??'').trim().toLowerCase()]||displayValue(value);

  function updateCards(){
    const voices=Array.isArray(window.SVARA_VOICES)?window.SVARA_VOICES:[];
    const byId=new Map(voices.map(v=>[String(v.id),v]));
    document.querySelectorAll('#voiceList .voice[data-id]').forEach(card=>{
      const meta=card.querySelector('.voice-card-meta');
      if(!meta)return;
      const voice=byId.get(String(card.dataset.id));
      if(!voice)return;

      const gender=displayValue(voice.gender||'');
      const regionParts=String(voice.region||'').split(' · ').map(v=>v.trim()).filter(Boolean);
      const accent=displayValue(regionParts[0]||'');
      const language=displayValue(voice.languageName||regionParts[1]||'');
      const identity=[accent,language,gender].filter(Boolean).join(' · ');

      const source=voice.metadata||{};
      const rawCases=Array.isArray(source.use_cases)?source.use_cases:Array.isArray(source.useCases)?source.useCases:[];
      const useCases=[...new Set(rawCases.map(displayUseCase).filter(Boolean))].slice(0,3);

      meta.innerHTML=`<div class="voice-meta-identity">${escapeHtml(identity)}</div>${useCases.length?`<div class="voice-meta-usecase"><span>USE CASES</span> ${escapeHtml(useCases.join(' · '))}</div>`:''}`;
      meta.title=[identity,useCases.join(' · ')].filter(Boolean).join(' · ');
    });
  }

  const list=document.getElementById('voiceList');
  if(!list)return;
  const observer=new MutationObserver(()=>requestAnimationFrame(updateCards));
  observer.observe(list,{childList:true,subtree:true});
  updateCards();
  window.addEventListener('svara:voices-updated',updateCards);
  [100,300,700,1500,3000].forEach(ms=>setTimeout(updateCards,ms));
})();
