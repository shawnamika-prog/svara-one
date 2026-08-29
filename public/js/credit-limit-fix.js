(()=>{
  const button=document.getElementById('generate');
  const script=document.getElementById('script');
  if(!button||!script)return;

  const warning=document.getElementById('creditWarning');
  const creditKey='svaraOrigins.demoCredits.v2';
  let creditFactor=0.5;
  let pricingLoaded=false;

  async function loadCreditFactor(){
    if(pricingLoaded)return;
    pricingLoaded=true;
    try{
      const response=await fetch('/api/pricing',{cache:'no-store'});
      if(response.ok){
        const data=await response.json();
        const value=Number(data.creditFactor);
        if(Number.isFinite(value)&&value>0)creditFactor=value;
      }
    }catch(_){
      // Keep the baseline factor if pricing cannot be loaded.
    }
  }

  function showWarning(){
    if(!warning)return;
    warning.textContent='Your script exceeds your remaining credit limit. Upgrade or purchase more credits to continue';
    warning.hidden=false;
    warning.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function hideWarning(){
    if(warning){warning.hidden=true;warning.textContent='';}
  }

  script.addEventListener('input',hideWarning);

  const originalGenerate=button.onclick;
  if(typeof originalGenerate!=='function')return;

  button.onclick=async event=>{
    hideWarning();
    await loadCreditFactor();

    const text=script.value.trim();
    const balance=Number(localStorage.getItem(creditKey)||0);
    const normalizedCharacters=Math.max(100,Math.ceil(text.length/100)*100);
    const cost=Math.max(1,Math.ceil(normalizedCharacters*creditFactor));

    if(text&&cost>balance){
      showWarning();
      return;
    }

    return originalGenerate.call(button,event);
  };
})();

// My Library — rename support using the reusable SvaraONE modal.
(()=>{
  let activeGeneration=null;

  document.addEventListener('click',event=>{
    const name=event.target.closest?.('.my-library-name');
    if(!name)return;
    activeGeneration={filename:name.querySelector('strong')?.textContent?.trim()||''};
  },true);

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('.my-library-file-menu button');
    if(!button||!button.textContent.trim().toLowerCase().includes('rename'))return;
    const item=activeGeneration;
    setTimeout(async()=>{
      if(!item)return;
      const current=item.filename;
      const dot=current.lastIndexOf('.');
      const extension=dot>0?current.slice(dot):'';
      const base=dot>0?current.slice(0,dot):current;
      const entered=await window.SvaraModal?.rename(base);
      if(entered===null||entered===undefined)return;
      const trimmed=String(entered).trim();
      if(!trimmed||trimmed===base)return;
      const newFilename=trimmed.toLowerCase().endsWith(extension.toLowerCase())?trimmed:`${trimmed}${extension}`;
      try{
        const response=await fetch('/api/generations/rename',{
          method:'POST',credentials:'same-origin',
          headers:{'content-type':'application/json',accept:'application/json'},
          body:JSON.stringify({currentFilename:current,filename:newFilename})
        });
        const data=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(data.error||'Could not rename generation.');
        window.location.reload();
      }catch(error){
        window.alert(error.message||'Could not rename generation.');
      }
    },0);
  },true);
})();