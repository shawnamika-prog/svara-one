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
    const cost=Math.max(1,Math.ceil(text.length/creditFactor));

    if(text&&cost>balance){
      showWarning();
      return;
    }

    return originalGenerate.call(button,event);
  };
})();