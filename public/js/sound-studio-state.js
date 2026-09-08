(()=>{
  const DEFAULTS={
    input:{sourceType:null,sourceAssetId:null,prompt:''},
    creative:{mood:null,style:null,energy:null,texture:null,tempoBpm:100,intensity:55,complexity:50,instrumental:true,excludeVocals:true,language:null,negativePrompt:''},
    generation:{type:'music',format:'mp3',durationSeconds:90,sampleRate:null,channels:null,provider:null},
    ui:{isGenerating:false,generationId:null,generationStatus:'idle',error:null,capabilities:null,advancedOpen:false},
    output:{status:'empty',assetId:null,r2Key:null,format:null,mimeType:null,duration:null,size:null}
  };
  const clone=v=>JSON.parse(JSON.stringify(v));
  const state=clone(DEFAULTS);
  const listeners=new Set();
  function emit(){const snapshot=clone(state);listeners.forEach(fn=>fn(snapshot));window.dispatchEvent(new CustomEvent('svara:sound-state-change',{detail:snapshot}));}
  function patch(section,values){Object.assign(state[section],values);emit();}
  const api={
    getState:()=>clone(state),
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},
    reset(){Object.assign(state,clone(DEFAULTS));emit();},
    setInput(values){patch('input',values||{});},
    setCreative(values){patch('creative',values||{});},
    setGeneration(values){patch('generation',values||{});},
    setUI(values){patch('ui',values||{});},
    setOutput(values){patch('output',values||{});}
  };
  window.SvaraSoundStudio=api;
  window.SvaraSoundStudioState=state;
  const syncFromUI=()=>{
    const root=document.getElementById('soundWorkspace'); if(!root)return;
    const prompt=root.querySelector('#soundPrompt');
    const type=root.querySelector('[data-sound-type].active');
    const mood=root.querySelector('.sound-mood.active');
    const tempo=root.querySelector('#soundTempo');
    const intensity=root.querySelector('#soundIntensity');
    const complexity=root.querySelector('#soundComplexity');
    const advanced=root.querySelector('#soundAdvancedBody');
    const selects=[...root.querySelectorAll('.sound-advanced-item select')];
    const checks=[...root.querySelectorAll('.sound-advanced-item input[type="checkbox"]')];
    patch('input',{prompt:prompt?.value||''});
    patch('generation',{type:type?.dataset.soundType||'music'});
    patch('creative',{
      mood:mood?.textContent?.trim()||null,
      tempoBpm:tempo?Number(tempo.value):100,
      intensity:intensity?Number(intensity.value):55,
      complexity:complexity?Number(complexity.value):50,
      texture:selects[0]?.value||null,
      instrumental:checks[0]?.checked??true,
      excludeVocals:checks[1]?.checked??true,
      advancedOpen:advanced?!advanced.hidden:false
    });
  };
  const bind=()=>{
    const root=document.getElementById('soundWorkspace'); if(!root||root.dataset.stateBound)return;
    root.dataset.stateBound='1';
    root.addEventListener('input',e=>{if(e.target.matches('#soundPrompt,#soundTempo,#soundIntensity,#soundComplexity'))syncFromUI();});
    root.addEventListener('change',e=>{if(e.target.matches('select,input[type="checkbox"]'))syncFromUI();});
    root.addEventListener('click',e=>{if(e.target.closest('[data-sound-type],.sound-mood,.sound-advanced-toggle'))queueMicrotask(syncFromUI);});
    syncFromUI();
  };
  bind();
  new MutationObserver(bind).observe(document.documentElement,{childList:true,subtree:true});
})();
