(()=>{
  const escapeHtml=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const genderValues=new Set(['male','female','masculine','feminine']);
  const displayValue=value=>{const text=String(value??'').trim();return text?text.charAt(0).toUpperCase()+text.slice(1):''};

  function updateCards(){
    document.querySelectorAll('#voiceList .voice').forEach(card=>{
      const meta=card.querySelector('.voice-card-meta');
      if(!meta)return;

      // Detailed metadata is rendered by voices.js. Never overwrite it.
      // This guard is the critical fix: the legacy gender normalizer must not
      // destroy accent, language, gender, age, characteristics or use cases.
      if(meta.querySelector('.voice-meta-identity, .voice-meta-character, .voice-meta-usecase')){
        return;
      }

      const raw=meta.textContent.split('·').map(v=>v.trim()).filter(Boolean);
      if(!raw.length)return;

      // Only normalize the legacy/simple card metadata.
      const genderIndex=raw.findIndex(v=>genderValues.has(v.toLowerCase()));
      if(genderIndex<0)return;

      const gender=displayValue(raw[genderIndex]);
      const withoutGender=raw.filter((_,i)=>i!==genderIndex);
      const clean=withoutGender.filter(v=>!genderValues.has(v.toLowerCase()));
      const region=clean[0]?displayValue(clean[0]):'';
      const language=clean[1]?displayValue(clean[1]):'';
      const parts=[region,language,gender].filter(Boolean);
      const next=parts.join(' · ');

      if(meta.textContent.trim()!==next){
        meta.innerHTML=parts.map((value,i)=>`<span class="${i===2?'voice-gender':'voice-meta-rest'}">${escapeHtml(value)}</span>`).join(' · ');
      }
      meta.title=next;
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
