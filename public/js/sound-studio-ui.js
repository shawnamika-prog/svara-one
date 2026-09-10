(()=>{
  const workspace=()=>document.getElementById('soundWorkspace');
  const enhanceTextureSelect=()=>{
    const root=workspace();
    if(!root)return;
    root.querySelectorAll('.sound-advanced-item select').forEach(select=>{
      if(select.dataset.svaraCustomDropdown)return;
      select.dataset.svaraCustomDropdown='1';
      const wrap=document.createElement('div');
      wrap.className='svara-select';
      const button=document.createElement('button');
      button.type='button';
      button.className='svara-select-button';
      button.setAttribute('aria-haspopup','listbox');
      button.setAttribute('aria-expanded','false');
      const menu=document.createElement('div');
      menu.className='svara-select-menu';
      menu.setAttribute('role','listbox');
      [...select.options].forEach(option=>{
        const item=document.createElement('button');
        item.type='button';
        item.className='svara-select-option';
        item.dataset.value=option.value;
        item.textContent=option.textContent;
        item.setAttribute('role','option');
        item.setAttribute('aria-selected',option.value===select.value?'true':'false');
        item.addEventListener('click',()=>{
          select.value=option.value;
          select.dispatchEvent(new Event('change',{bubbles:true}));
          update();
          close();
        });
        menu.appendChild(item);
      });
      const update=()=>{
        const selected=select.options[select.selectedIndex];
        button.textContent=selected?.textContent||'';
        menu.querySelectorAll('.svara-select-option').forEach(item=>item.setAttribute('aria-selected',item.dataset.value===select.value?'true':'false'));
      };
      const close=()=>{wrap.classList.remove('open');button.setAttribute('aria-expanded','false')};
      button.addEventListener('click',event=>{
        event.stopPropagation();
        const open=wrap.classList.toggle('open');
        button.setAttribute('aria-expanded',open?'true':'false');
      });
      select.addEventListener('change',update);
      wrap.append(button,menu);
      select.hidden=true;
      select.parentNode.insertBefore(wrap,select);
      update();
    });
  };

  const removeMockNote=()=>workspace()?.querySelector('.sound-generation-note')?.remove();

  const bindVolume=()=>{
    const root=workspace();
    if(!root)return;
    root.querySelectorAll('.sound-volume').forEach(wrap=>{
      const range=wrap.querySelector('.sound-volume-range');
      if(!range)return;
      let value=wrap.querySelector('.sound-volume-value');
      if(!value){
        value=document.createElement('span');
        value.className='sound-volume-value';
        wrap.appendChild(value);
      }
      const update=()=>{value.textContent=`${Math.round(Number(range.value)||0)}%`};
      if(!range.dataset.svaraVolumeBound){
        range.dataset.svaraVolumeBound='1';
        range.addEventListener('input',update);
      }
      update();
    });
  };

  const sync=()=>{
    enhanceTextureSelect();
    removeMockNote();
    bindVolume();
  };

  const outsideClick=event=>{
    if(event.target.closest('.svara-select'))return;
    document.querySelectorAll('.svara-select.open').forEach(select=>{
      select.classList.remove('open');
      select.querySelector('.svara-select-button')?.setAttribute('aria-expanded','false');
    });
  };

  document.addEventListener('click',outsideClick);
  sync();
  new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true});
})();
