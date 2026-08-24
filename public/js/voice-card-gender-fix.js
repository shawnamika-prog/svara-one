(()=>{
  const escapeHtml=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const genderValues=new Set(['male','female','masculine','feminine']);
  const displayValue=value=>{const text=String(value??'').trim();return text?text.charAt(0).toUpperCase()+text.slice(1):''};

  function updateCards(){
    document.querySelectorAll('#voiceList .voice').forEach(card=>{
      const meta=card.querySelector('.voice-card-meta');
      if(!meta)return;

      // studio-v2 currently renders: gender · region · language · style.
      // Use the metadata already rendered into the card so this remains correct after every render.
      const raw=meta.textContent.split('·').map(v=>v.trim()).filter(Boolean);
      if(!raw.length)return;

      const genderIndex=raw.findIndex(v=>genderValues.has(v.toLowerCase()));
      const gender=genderIndex>=0?displayValue(raw[genderIndex]):'';
      const withoutGender=genderIndex>=0?raw.filter((_,i)=>i!==genderIndex):raw;

      // Remove any duplicate gender/style value from the remaining metadata.
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
