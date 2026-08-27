(()=>{
  const toggle=document.getElementById('svaraFlowToggle');
  if(!toggle)return;

  const originalFetch=window.fetch.bind(window);
  window.fetch=async (input,init)=>{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    if(method==='POST'&&url.includes('/api/voice/generate')){
      const currentInit=init?{...init}:{};
      if(typeof currentInit.body==='string'){
        try{
          const payload=JSON.parse(currentInit.body);
          payload.svaraFlow=toggle.checked;
          currentInit.body=JSON.stringify(payload);
          return originalFetch(input,currentInit);
        }catch(_){ }
      }
    }
    return originalFetch(input,init);
  };
})();
