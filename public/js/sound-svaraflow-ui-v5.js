(()=>{
  if(window.SvaraSoundSvaraFlowUIV5)return;
  const root=()=>document.getElementById('soundWorkspace');
  const approval=/^(perfect|perfect[.! ]*|yes|yes[.! ]*|go ahead|go ahead[.! ]*|generate it|please generate it|approved?|approve and generate|approve this|looks good|that works|that's good|that is good|sounds good|do it|let's do it|lets do it)$/i;
  function addUserMessage(thread,text){
    if(!thread)return;
    const row=document.createElement('div');row.className='sound-sf-message-row user';
    const avatar=document.createElement('div');avatar.className='sound-sf-avatar user';avatar.textContent='You';
    const bubble=document.createElement('div');bubble.className='sound-sf-message user';bubble.textContent=text;
    row.append(bubble,avatar);thread.appendChild(row);thread.scrollTop=thread.scrollHeight;
  }
  function bind(){
    const r=root();
    if(!r||r.dataset.soundSfV5Bound)return;
    const button=r.querySelector('#soundAskSvaraFlow');
    const textarea=r.querySelector('#soundPrompt');
    const thread=r.querySelector('.sound-sf-thread');
    if(!button||!textarea||!thread)return;
    r.dataset.soundSfV5Bound='1';
    const isApproval=value=>approval.test(String(value||'').trim());
    const intercept=event=>{
      const text=String(textarea.value||'').trim();
      if(!text||!isApproval(text)||!thread.querySelector('.sound-sf-spec'))return;
      const approve=[...thread.querySelectorAll('.sound-sf-action.primary')].filter(b=>/approve & generate/i.test(b.textContent||'' )).pop();
      if(!approve)return;
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      addUserMessage(thread,text);
      const firstUser=thread.querySelector('.sound-sf-message-row.user .sound-sf-message.user');
      const state=window.SvaraSoundStudio;
      if(firstUser)state?.setInput?.({prompt:firstUser.textContent||''});
      textarea.value='';
      approve.click();
    };
    button.addEventListener('click',intercept,true);
    textarea.addEventListener('keydown',event=>{
      if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){
        const text=String(textarea.value||'').trim();
        if(text&&isApproval(text)&&thread.querySelector('.sound-sf-spec'))intercept(event);
      }
    },true);
  }
  bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
  window.SvaraSoundSvaraFlowUIV5={bind};
})();
