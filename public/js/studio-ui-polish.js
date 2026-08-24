(()=>{
  const MAX_CHARS=2000;
  const script=document.getElementById('script');
  const counter=document.getElementById('scriptCounter');
  if(!script||!counter)return;

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
})();