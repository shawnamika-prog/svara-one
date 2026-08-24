(()=>{
  const list=document.getElementById('voiceList');
  if(!list)return;
  let audio=null, activeCard=null, activeId=null, objectUrl=null;

  function cleanupUrl(){
    if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}
  }
  function setCard(card, state){
    if(activeCard && activeCard!==card){
      activeCard.querySelector('.voice-wave')?.classList.remove('playing');
      activeCard.querySelector('.preview-button')?.classList.remove('playing');
      const labels=activeCard.querySelectorAll('.voice-preview-label span');
      if(labels[0])labels[0].textContent='Voice preview';
      if(labels[1])labels[1].textContent='Listen';
    }
    activeCard=card||null;
    if(!card)return;
    const wave=card.querySelector('.voice-wave');
    const button=card.querySelector('.preview-button');
    const labels=card.querySelectorAll('.voice-preview-label span');
    const playing=state==='playing';
    const loading=state==='loading';
    wave?.classList.toggle('playing',playing);
    button?.classList.toggle('playing',playing);
    if(button)button.textContent=playing?'❚❚':loading?'…':'▶';
    if(labels[0])labels[0].textContent=loading?'Loading preview…':'Voice preview';
    if(labels[1])labels[1].textContent=playing?'Playing':loading?'Loading':'Listen';
  }

  async function playPreview(card,id){
    if(activeId===id && audio){
      if(!audio.paused){audio.pause();return false;}
      try{await audio.play();setCard(card,'playing');return true;}catch(e){setCard(card,'idle');return false;}
    }

    if(audio){audio.pause();audio.removeAttribute('src');audio.load();}
    cleanupUrl();
    activeId=id;
    setCard(card,'loading');

    try{
      const response=await fetch(`/api/voice-samples/${encodeURIComponent(id)}`,{
        method:'GET',
        credentials:'same-origin',
        cache:'no-store',
        headers:{accept:'audio/mpeg,audio/*'}
      });
      if(!response.ok){
        let message=`Preview unavailable (${response.status})`;
        try{const data=await response.json();if(data.error)message=data.error;}catch(_){}
        throw new Error(message);
      }
      const blob=await response.blob();
      if(!blob.size)throw new Error('Preview returned no audio');
      objectUrl=URL.createObjectURL(blob);
      audio=new Audio();
      audio.preload='auto';
      audio.src=objectUrl;
      audio.addEventListener('ended',()=>{activeId=null;setCard(card,'idle');});
      audio.addEventListener('error',()=>{activeId=null;setCard(card,'idle');});
      await audio.play();
      setCard(card,'playing');
      return true;
    }catch(error){
      console.error('SvaraONE voice preview failed:',error);
      activeId=null;
      setCard(card,'idle');
      const labels=card.querySelectorAll('.voice-preview-label span');
      if(labels[1])labels[1].textContent='Unavailable';
      return false;
    }
  }

  list.addEventListener('click',event=>{
    const preview=event.target.closest('[data-preview-id]');
    if(!preview || !list.contains(preview))return;
    const card=preview.closest('.voice');
    const id=preview.dataset.previewId;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    playPreview(card,id).then(success=>{
      if(!success || !card?.isConnected)return;
      card.click();
      const selectedCard=list.querySelector(`.voice[data-id="${CSS.escape(id)}"]`);
      if(selectedCard)setCard(selectedCard,'playing');
    });
  },true);
})();