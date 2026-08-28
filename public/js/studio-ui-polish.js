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
    const style=document.createElement('style');
    style.textContent=`
      .svaraflow-control{
        margin:12px 20px 0!important;
        padding:12px 14px 13px;
        border:1px solid #ffffff0d;
        border-radius:13px;
        background:#081523;
        overflow:hidden;
        transition:padding .18s ease,border-color .18s ease,background .18s ease;
      }
      .svaraflow-control.is-enabled{
        border-color:#1ddfc433;
        background:linear-gradient(180deg,#091a28,#081522);
      }
      .svaraflow-toggle{margin:0!important;}
      #svaraFlowProfileControls{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-top:10px;
        width:100%;
      }
      #svaraFlowProfileControls label{
        display:flex;
        flex-direction:column;
        gap:6px;
        min-width:0;
      }
      #svaraFlowProfileControls label>span{
        font-size:10px;
        font-weight:600;
        color:#8b9aa8;
        text-transform:uppercase;
        letter-spacing:.04em;
      }
      #svaraFlowProfileControls select{
        width:100%;
        min-width:0;
        background:#0a1726;
        color:#fff;
        border:1px solid #ffffff10;
        border-radius:8px;
        padding:9px 10px;
        outline:none;
        font:inherit;
        font-size:13px;
      }
      #svaraFlowProfileControls select:focus{
        border-color:#1ddfc488;
        box-shadow:0 0 0 3px #1ddfc412;
      }
      #svaraFlowProfileControls[hidden]{display:none!important}
      @media(max-width:560px){
        #svaraFlowProfileControls{grid-template-columns:1fr;}
      }
    `;
    document.head.appendChild(style);

    host.classList.add('svaraflow-panel');

    const wrap=document.createElement('div');
    wrap.id='svaraFlowProfileControls';
    const makeField=(label,id)=>{
      const box=document.createElement('label');
      const title=document.createElement('span');
      title.textContent=label;
      const select=document.createElement('select');
      select.id=id;
      box.append(title,select);
      wrap.appendChild(box);
      return select;
    };

    categorySelect=makeField('Category','svaraFlowCategory');
    styleSelect=makeField('Style','svaraFlowStyle');
    Object.keys(profiles).forEach(category=>{
      const option=document.createElement('option');
      option.value=category;
      option.textContent=category;
      categorySelect.appendChild(option);
    });
    categorySelect.value='Creative';

    const syncStyles=()=>{
      styleSelect.innerHTML='';
      (profiles[categorySelect.value]||[]).forEach(styleName=>{
        const option=document.createElement('option');
        option.value=styleName;
        option.textContent=styleName;
        styleSelect.appendChild(option);
      });
      if(legacyStyle)legacyStyle.value=styleSelect.value||'Storytelling';
    };

    categorySelect.addEventListener('change',syncStyles);
    styleSelect.addEventListener('change',()=>{
      if(legacyStyle)legacyStyle.value=styleSelect.value;
    });
    syncStyles();

    const message=document.getElementById('svaraFlowMessage');
    if(message&&message.parentNode===host){
      host.insertBefore(message,host.lastElementChild);
    }
    host.appendChild(wrap);

    const syncPanel=()=>{
      const enabled=toggle.checked===true;
      host.classList.toggle('is-enabled',enabled);
      wrap.hidden=!enabled;
      if(message)message.hidden=!enabled;
    };
    toggle.addEventListener('change',syncPanel);
    syncPanel();
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