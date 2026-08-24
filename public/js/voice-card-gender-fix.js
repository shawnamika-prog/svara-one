(()=>{
  const escapeHtml=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

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

      const region=String(voice.region||'').trim();
      const language=String(voice.languageName||'').trim();
      const gender=String(voice.gender||'').trim();

      // The card should show only: Region · Language · Gender.
      // Never include the legacy style field, which can contain masculine/feminine.
      const values=[region,language,gender].filter(Boolean);
      const unique=[];
      values.forEach(value=>{
        const key=value.toLowerCase();
        if(!unique.some(existing=>existing.toLowerCase()===key))unique.push(value);
      });

      meta.innerHTML=unique.map((value,index)=>
        `<span class="${index===unique.length-1?'voice-gender':'voice-meta-rest'}">${escapeHtml(value)}</span>`
      ).join(' · ');
      meta.title=unique.join(' · ');
    });
  }

  const list=document.getElementById('voiceList');
  if(!list)return;
  const observer=new MutationObserver(updateCards);
  observer.observe(list,{childList:true,subtree:true});
  updateCards();
  window.addEventListener('svara:voices-updated',updateCards);
})();
