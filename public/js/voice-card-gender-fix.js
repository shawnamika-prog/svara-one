(()=>{
  const escapeHtml=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const genderValues=new Set(['male','female','masculine','feminine']);

  function updateCards(){
    const catalogue=window.SVARA_VOICES||[];
    document.querySelectorAll('#voiceList .voice').forEach(card=>{
      const voice=catalogue.find(v=>String(v.id)===String(card.dataset.id));
      if(!voice)return;
      const label=card.querySelector('.voice-preview-label');
      if(!label)return;
      let meta=card.querySelector('.voice-card-meta');
      if(!meta){
        meta=document.createElement('div');
        meta.className='voice-card-meta';
        label.insertAdjacentElement('afterend',meta);
      }

      const gender=String(voice.gender||'').trim();
      const region=String(voice.region||'').trim();
      const language=String(voice.languageName||'').trim();
      const parts=[];
      if(region)parts.push(`<span class="voice-meta-rest">${escapeHtml(region)}</span>`);
      if(language)parts.push(`<span class="voice-meta-rest">${escapeHtml(language)}</span>`);
      if(gender)parts.push(`<span class="voice-gender">${escapeHtml(gender)}</span>`);
      meta.innerHTML=parts.join(' · ');
      meta.title=[region,language,gender].filter(Boolean).join(' · ');
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
