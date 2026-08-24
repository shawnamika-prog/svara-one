(()=>{
  const api=async path=>{const res=await fetch(path,{cache:'no-store'});if(!res.ok)throw new Error(`${path} ${res.status}`);return res.json()};

  function catalogueCount(data){
    return Array.isArray(data?.voices)?data.voices.length:null;
  }

  function planVoiceCount(pricing,plan,catalogueCount,fullCatalogue){
    if(fullCatalogue===true && Number.isFinite(catalogueCount)) return catalogueCount;
    if(plan==='free') return Number(pricing?.free?.voices);
    return Number(pricing?.plans?.[plan]?.voices);
  }

  function setVoiceLabel(article,count){
    if(!article||!Number.isFinite(count))return;
    const target=article.querySelector('[data-voice-count]');
    if(target)target.textContent=`${count.toLocaleString('en-US')} voices`;
  }

  function setFreeCredits(pricing){
    const credits=Number(pricing?.free?.credits);
    if(!Number.isFinite(credits))return;
    document.querySelectorAll('#freeCredits,[data-free-credits]').forEach(target=>{
      target.textContent=credits.toLocaleString('en-US');
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
      setFreeCredits(pricing);
      setPlanPrices(pricing);
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