(()=>{
  const escapeHtml=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function updateCards(){
    const catalogue=window.SVARA_VOICES||[];
    document.querySelectorAll('#voiceList .voice').forEach(card=>{
      const voice=catalogue.find(v=>String(v.id)===String(card.dataset.id));
      const meta=card.querySelector('.voice-copy small');
      if(!voice||!meta)return;
      const gender=String(voice.gender||'').trim();
      const region=String(voice.region||voice.languageName||'').trim();
      if(!gender)return;
      meta.innerHTML=`<span class="voice-gender">${escapeHtml(gender)}</span>${region?` · ${escapeHtml(region)}`:''}`;
      meta.title=region?`${gender} · ${region}`:gender;
    });
  }
  updateCards();
  const list=document.getElementById('voiceList');
  if(list)new MutationObserver(updateCards).observe(list,{childList:true});
  window.addEventListener('svara:voices-updated',updateCards);
})();