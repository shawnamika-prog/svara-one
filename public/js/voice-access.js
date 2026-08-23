(()=>{
  const api=async path=>{const res=await fetch(path,{cache:'no-store'});if(!res.ok)throw new Error(`${path} ${res.status}`);return res.json()};

  function catalogueCount(data){
    return Array.isArray(data?.voices)?data.voices.length:null;
  }

  function planVoiceCount(pricing,plan,catalogueCount){
    if(pricing?.fullVoiceCatalogue===true && Number.isFinite(catalogueCount)) return catalogueCount;
    if(plan==='free') return Number(pricing?.free?.voices);
    return Number(pricing?.plans?.[plan]?.voices);
  }

  function setVoiceLabel(article,count){
    if(!article||!Number.isFinite(count))return;
    const items=[...article.querySelectorAll('li')];
    const target=items.find(li=>/voices|voice library/i.test(li.textContent));
    if(target)target.textContent=`${count.toLocaleString('en-US')} voices`;
  }

  function updatePricingCards(pricing,catalogueCount){
    const articles=[...document.querySelectorAll('.prices article')];
    if(!articles.length)return;
    const byName=Object.fromEntries(articles.map(article=>[article.querySelector('h3')?.textContent.trim().toLowerCase(),article]));
    ['free','starter','creator','pro','studio'].forEach(plan=>{
      setVoiceLabel(byName[plan],planVoiceCount(pricing,plan,catalogueCount));
    });
  }

  async function init(){
    try{
      const [pricing,voices]=await Promise.all([api('/api/pricing'),api('/api/voices')]);
      const count=catalogueCount(voices);
      updatePricingCards(pricing,count);

      const grid=document.querySelector('#planGrid');
      if(grid){
        const observer=new MutationObserver(()=>updatePricingCards(pricing,count));
        observer.observe(grid,{childList:true,subtree:true});
        setTimeout(()=>observer.disconnect(),5000);
      }
    }catch(error){
      console.error('Voice access display unavailable:',error);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
