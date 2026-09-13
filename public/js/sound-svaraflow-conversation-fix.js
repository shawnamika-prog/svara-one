(()=>{
  if(window.SvaraSoundSvaraFlowConversationFix)return;

  const root=()=>document.getElementById('soundWorkspace');
  const state=()=>window.SvaraSoundStudio;

  const isVagueRefinement=value=>/^(not quite|not really|not exactly|almost|close|hmm|hmm\.?|no|nope|nah|try again|different|something else|i don['’]t like it|i don['’]t love it)$/i.test(String(value||'').trim());

  function bind(){
    const r=root();
    if(!r||r.dataset.soundSfConversationFixBound)return;
    const textarea=r.querySelector('#soundPrompt');
    const button=r.querySelector('#soundAskSvaraFlow');
    const thread=r.querySelector('.sound-sf-thread');
    const wrap=r.querySelector('.sound-sf-textarea-wrap');
    if(!textarea||!button||!thread||!wrap)return;
    r.dataset.soundSfConversationFixBound='1';

    const addMessage=(role,text)=>{
      const node=document.createElement('div');
      node.className=`sound-sf-message ${role}`;
      node.textContent=text;
      thread.appendChild(node);
      thread.scrollTop=thread.scrollHeight;
      return node;
    };

    const intercept=event=>{
      const text=String(textarea.value||'').trim();
      if(!text||!isVagueRefinement(text)||!thread.querySelector('.sound-sf-spec'))return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      addMessage('user',text);
      state()?.setInput?.({prompt:text});
      textarea.value='';
      textarea.placeholder='Tell SvaraFlow what feels off — instrument, mood, energy, texture, or overall direction…';
      const response=addMessage('assistant','Got it. What feels off about the direction? Tell me what you want changed, and I’ll reshape it with you.');
      wrap.classList.remove('thinking');
      button.disabled=false;
      button.textContent='Ask SvaraFlow';
      textarea.focus();
      return false;
    };

    button.addEventListener('click',intercept,true);
    textarea.addEventListener('keydown',event=>{
      if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){
        const text=String(textarea.value||'').trim();
        if(text&&isVagueRefinement(text)&&thread.querySelector('.sound-sf-spec'))intercept(event);
      }
    },true);
  }

  bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
  window.SvaraSoundSvaraFlowConversationFix={bind};
})();
