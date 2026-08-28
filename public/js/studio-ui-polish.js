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

  const toggle=document.getElementById('svaraFlowToggle');
  const host=document.querySelector('.svaraflow-control');
  const legacyStyle=document.getElementById('style');
  const profiles={
    Creative:['Storytelling','Character','Audiobook','Animation'],
    Business:['Commercial','Corporate','Presentation','Product Demo','Sales'],
    Education:['E-learning','Tutorial','Lesson','Language Learning'],
    Media:['Narration','Documentary','Podcast','News','Trailer'],
    Performance:['Dramatic','Inspirational','Calm','Energetic','Mystery']
  };
  let categorySelect=null,styleSelect=null;

  if(host&&toggle){
    const wrap=document.createElement('div');
    wrap.id='svaraFlowProfileControls';
    wrap.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;width:100%;';
    const makeField=(label,id)=>{
      const box=document.createElement('label');
      box.style.cssText='display:flex;flex-direction:column;gap:4px;min-width:0;';
      const title=document.createElement('span');
      title.textContent=label;
      title.style.cssText='font-size:10px;font-weight:600;color:#8b9aa8;text-transform:uppercase;letter-spacing:.04em;';
      const select=document.createElement('select');
      select.id=id;
      select.style.cssText='width:100%;min-width:0;padding:7px 8px;border-radius:7px;background:#101922;color:#dce7ef;border:1px solid #ffffff16;font:inherit;font-size:11px;';
      box.append(title,select);
      wrap.appendChild(box);
      return select;
    };
    categorySelect=makeField('Category','svaraFlowCategory');
    styleSelect=makeField('Style','svaraFlowStyle');
    Object.keys(profiles).forEach(category=>{
      const option=document.createElement('option');option.value=category;option.textContent=category;categorySelect.appendChild(option);
    });
    categorySelect.value='Creative';
    const syncStyles=()=>{
      styleSelect.innerHTML='';
      (profiles[categorySelect.value]||[]).forEach(style=>{
        const option=document.createElement('option');option.value=style;option.textContent=style;styleSelect.appendChild(option);
      });
      if(legacyStyle)legacyStyle.value=styleSelect.value||'Storytelling';
    };
    categorySelect.addEventListener('change',syncStyles);
    styleSelect.addEventListener('change',()=>{if(legacyStyle)legacyStyle.value=styleSelect.value;});
    syncStyles();
    const message=document.getElementById('svaraFlowMessage');
    if(message&&message.parentNode===host)host.insertBefore(wrap,message);
    else host.appendChild(wrap);
  }

  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
    const url=typeof input==='string'?input:input?.url||'';
    if(url.includes('/api/voice/generate')&&init?.body&&typeof init.body==='string'){
      try{
        const payload=JSON.parse(init.body);
        payload.svaraFlow=document.getElementById('svaraFlowToggle')?.checked===true;
        payload.svaraFlowCategory=document.getElementById('svaraFlowCategory')?.value||'Creative';
        payload.svaraFlowStyle=document.getElementById('svaraFlowStyle')?.value||'Storytelling';
        init={...init,body:JSON.stringify(payload)};
      }catch(_){ }
    }
    return nativeFetch(input,init);
  };
})();