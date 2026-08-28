(()=>{
  const MAX_CHARS=2000;
  const script=document.getElementById('script');
  const counter=document.getElementById('scriptCounter');
  if(script&&counter){
    script.maxLength=MAX_CHARS;

    function updateCounter(){
      if(script.value.length>MAX_CHARS)script.value=script.value.slice(0,MAX_CHARS);
      const remaining=MAX_CHARS-script.value.length;
      counter.textContent=`${remaining.toLocaleString()} character${remaining===1?'':'s'} remaining`;
      counter.classList.toggle('near-limit',remaining<=200&&remaining>0);
      counter.classList.toggle('at-limit',remaining===0);
    }

    script.addEventListener('input',updateCounter);
    script.addEventListener('paste',()=>requestAnimationFrame(updateCounter));
    updateCounter();
  }

  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
    const url=typeof input==='string'?input:input?.url||'';
    if(url.includes('/api/voice/generate')&&init?.body&&typeof init.body==='string'){
      try{
        const payload=JSON.parse(init.body);
        payload.svaraFlow=document.getElementById('svaraFlowToggle')?.checked===true;
        init={...init,body:JSON.stringify(payload)};
      }catch(_){ }
    }
    return nativeFetch(input,init);
  };
})();