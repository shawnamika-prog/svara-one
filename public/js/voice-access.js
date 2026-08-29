(()=>{
  const api=async path=>{const res=await fetch(path,{cache:'no-store'});if(!res.ok)throw new Error(`${path} ${res.status}`);return res.json()};

  function catalogueCount(data){
    return Array.isArray(data?.voices)?data.voices.length:null;
  }

  function planVoiceCount(pricing,plan,catalogueCount,fullCatalogue){
    // All plans have access to the full current Deepgram catalogue. Keep the
    // count dynamic so catalogue changes are reflected without code changes.
    if(Number.isFinite(catalogueCount)) return catalogueCount;
    if(plan==='free') return Number(pricing?.free?.voices);
    return Number(pricing?.plans?.[plan]?.voices);
  }

  function setVoiceLabel(article,count){
    if(!article||!Number.isFinite(count))return;
    const target=article.querySelector('[data-voice-count]');
    if(target)target.textContent=`${count.toLocaleString('en-US')} voices`;
  }

  function compactCredits(value){
    const n=Number(value);
    if(!Number.isFinite(n))return null;
    if(Math.abs(n)>=1000000){
      const v=n/1000000;
      return `${Number.isInteger(v)?v:v.toFixed(1).replace(/\.0$/,'')}M`;
    }
    if(Math.abs(n)>=1000){
      const v=n/1000;
      return `${Number.isInteger(v)?v:v.toFixed(1).replace(/\.0$/,'')}K`;
    }
    return n.toLocaleString('en-US');
  }

  function setFreeCredits(pricing){
    const credits=Number(pricing?.free?.credits);
    const formatted=compactCredits(credits);
    if(formatted===null)return;
    document.querySelectorAll('#freeCredits,[data-free-credits]').forEach(target=>{
      target.textContent=formatted;
    });
  }

  function monthlyEquivalent(value){
    const annual=Number(value);
    if(!Number.isFinite(annual))return null;
    return annual/12;
  }

  function setPlanPrices(pricing){
    ['starter','creator','pro','studio'].forEach(plan=>{
      const annual=Number(pricing?.plans?.[plan]?.price);
      const monthly=monthlyEquivalent(annual);
      const target=document.querySelector(`[data-plan-price="${plan}"]`);
      const billing=document.querySelector(`[data-plan-billing="${plan}"]`);
      if(target&&Number.isFinite(monthly)){
        target.textContent=`$${monthly.toLocaleString('en-US',{minimumFractionDigits:monthly%1?2:0,maximumFractionDigits:2})}`;
      }
      if(billing&&Number.isFinite(annual)) billing.textContent='billed annually';
    });
  }

  function setMonthlyBillingLabels(){
    document.querySelectorAll('.prices article').forEach(article=>{
      const name=article.querySelector('h3')?.textContent.trim().toLowerCase();
      if(name==='starter'||name==='creator'||name==='pro'||name==='studio'){
        const small=article.querySelector('.price small');
        if(small)small.textContent='/ month';
      }
    });
  }

  function setPlanCreditLabels(pricing){
    const plans=pricing?.plans||{};
    const articles=[...document.querySelectorAll('.prices article')];
    articles.forEach(article=>{
      const name=article.querySelector('h3')?.textContent.trim().toLowerCase();
      const value=name==='free'?pricing?.free?.credits:plans?.[name]?.credits;
      const formatted=compactCredits(value);
      const target=article.querySelector('b');
      if(target&&formatted!==null){
        target.innerHTML=`${formatted} <span class="brand-svara">Svara</span><span class="brand-one">ONE</span> Credits / ${name==='free'?'once-off':'month'}`;
      }
    });
  }

  function reinforcePricing(pricing){
    setFreeCredits(pricing);
    setPlanPrices(pricing);
    setMonthlyBillingLabels();
    setPlanCreditLabels(pricing);
    const timer=setInterval(()=>{
      setFreeCredits(pricing);
      setPlanPrices(pricing);
      setMonthlyBillingLabels();
      setPlanCreditLabels(pricing);
    },250);
    setTimeout(()=>clearInterval(timer),5000);
  }

  function updatePricingCards(pricing,catalogueCount,fullCatalogue){
    const articles=[...document.querySelectorAll('.prices article')];
    if(!articles.length)return;
    const byName=Object.fromEntries(articles.map(article=>[article.querySelector('h3')?.textContent.trim().toLowerCase(),article]));
    ['free','starter','creator','pro','studio'].forEach(plan=>{
      setVoiceLabel(byName[plan],planVoiceCount(pricing,plan,catalogueCount,fullCatalogue));
    });
  }

  async function init(){
    const prices=document.querySelector('.prices');
    try{
      const [pricing,access,voices]=await Promise.all([
        api('/api/pricing'),
        api('/api/voice-access'),
        api('/api/voices')
      ]);
      reinforcePricing(pricing);
      if(!prices)return;
      const count=catalogueCount(voices);
      const fullCatalogue=access?.fullCatalogue===true;
      updatePricingCards(pricing,count,fullCatalogue);
      prices.style.visibility='visible';
    }catch(error){
      console.error('Voice access display unavailable:',error);
      if(prices){
        prices.style.visibility='visible';
        prices.querySelectorAll('[data-voice-count]').forEach(target=>{target.textContent='Voice count unavailable';});
      }
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();