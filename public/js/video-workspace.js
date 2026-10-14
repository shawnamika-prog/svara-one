(()=> {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const seedScenes = () => [];
  const style = document.createElement('style');
  style.id='svaraVideoWorkspaceStyle';
  style.textContent = `
    .sv-video{color:#e5edf8;display:grid;gap:14px;min-width:0;font-family:Inter,system-ui,sans-serif}
    .sv-video *{box-sizing:border-box}.sv-card{background:linear-gradient(180deg,#0b1220,#080e18);border:1px solid #ffffff12;border-radius:15px;min-width:0;overflow:hidden}
    .sv-vhead{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:17px 19px;border-bottom:1px solid #ffffff0c;flex-wrap:wrap}
    .sv-eyebrow{font-size:9px;letter-spacing:.17em;font-weight:800;color:#65a7ff}.sv-vhead h2{font-size:22px;letter-spacing:-.04em;margin:5px 0}.sv-vhead p{font-size:11px;color:#8294aa;margin:0;line-height:1.5}
    .sv-actions{display:flex;gap:7px;flex-wrap:wrap}.sv-btn{border:1px solid #ffffff16;border-radius:9px;background:#101a29;color:#c4d3e4;padding:9px 12px;font:700 10px Inter,system-ui;cursor:pointer}.sv-btn:hover{border-color:#4c8cff88;color:white}.sv-btn.primary{border-color:#4c8cff;background:linear-gradient(110deg,#2675ee,#438dff);color:white}.sv-btn:disabled{opacity:.5;cursor:wait}
    .sv-mode{display:flex;gap:3px;background:#080e18;border:1px solid #ffffff14;border-radius:10px;padding:3px}.sv-mode button{border:0;background:transparent;color:#8da0b5;border-radius:7px;padding:8px 10px;font:600 9px Inter;cursor:pointer}.sv-mode button.active{background:#183d73;color:#bcd9ff;box-shadow:inset 0 0 0 1px #4b8cff66}
    .sv-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:14px 16px}.sv-step{display:flex;align-items:center;gap:8px;min-width:0;color:#8092a8;font-size:10px}.sv-step b{display:grid;place-items:center;width:27px;height:27px;flex:none;border-radius:50%;background:#263448;color:#bdcce0}.sv-step.active b,.sv-step.done b{background:#277cf5;color:#fff}.sv-step span{display:block;min-width:0}.sv-step strong{display:block;color:#dbe7f6;font-size:10px}.sv-step small{display:block;color:#73879d;font-size:8px;margin-top:3px}
    .sv-main{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(310px,.85fr);gap:14px;align-items:start}.sv-scenes{display:grid;gap:10px}.sv-scene{display:grid;grid-template-columns:minmax(190px,29%) minmax(0,1fr) 112px;gap:12px;padding:10px;border:1px solid #ffffff12;background:#0a1220;border-radius:12px;cursor:pointer;min-width:0}.sv-scene.selected{border-color:#428bff99;box-shadow:inset 0 0 0 1px #428bff24}.sv-thumb{position:relative;display:grid;place-items:center;aspect-ratio:16/9;min-height:110px;border-radius:8px;overflow:hidden;background:radial-gradient(ellipse at 65% 15%,#284c7b,#111f37 45%,#070d18 80%);border:1px solid #ffffff10;color:#7c9fc9}.sv-thumb img,.sv-thumb video{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}.sv-thumb span{position:relative;font-size:28px;z-index:1;text-shadow:0 2px 15px #000}.sv-number{position:absolute;z-index:2;left:7px;top:7px;background:#267cf5;color:#fff;border-radius:6px;padding:5px 7px;font-size:10px;font-weight:800}.sv-scene-info{min-width:0;padding:3px 0}.sv-scene-info h3{font-size:12px;margin:0 0 7px;line-height:1.4;color:#edf4ff}.sv-scene-info p{font-size:10px;color:#8da0b5;line-height:1.5;margin:0 0 9px}.sv-meta{display:flex;gap:5px;flex-wrap:wrap}.sv-chip{padding:5px 7px;border-radius:6px;background:#101d2d;border:1px solid #ffffff0b;color:#8fa7c0;font-size:8px;white-space:nowrap}.sv-chip.status{color:#e4c48a}.sv-chip.ready{color:#60e0c9}.sv-mini-assets{display:flex;gap:5px;margin-top:9px;flex-wrap:wrap}.sv-mini-assets button{border:1px solid #ffffff12;border-radius:7px;background:#0c1725;color:#9aadc1;padding:6px 7px;font-size:8px;cursor:pointer}.sv-mini-assets button:hover{color:#fff;border-color:#428bff66}.sv-scene-actions{display:grid;align-content:start;gap:5px}.sv-scene-actions .sv-btn{padding:8px 5px;font-size:9px}.sv-add{border:1px dashed #3984fa88;border-radius:10px;background:#0b1422;color:#81b5ff;padding:13px;text-align:center;width:100%;cursor:pointer;font:700 10px Inter}.sv-add:hover{background:#10203a}
    .sv-right{display:grid;gap:12px;min-width:0}.sv-preview{padding:12px}.sv-preview-head{display:flex;align-items:center;justify-content:space-between;padding:2px 2px 10px}.sv-preview-head strong{font-size:12px}.sv-preview-stage{aspect-ratio:16/9;display:grid;place-items:center;position:relative;overflow:hidden;border-radius:9px;background:radial-gradient(ellipse at 50% 15%,#244a79,#101a2b 55%,#050a12);border:1px solid #ffffff12}.sv-preview-stage img,.sv-preview-stage video{width:100%;height:100%;object-fit:contain}.sv-preview-placeholder{text-align:center;padding:20px;color:#8ea5c0}.sv-preview-placeholder b{font-size:25px;display:block;margin-bottom:10px}.sv-preview-placeholder span{display:block;font-size:10px;line-height:1.5}
    .sv-tabs{display:flex;border-bottom:1px solid #ffffff12;overflow:auto}.sv-tabs button{flex:1;min-width:64px;padding:11px 7px;border:0;border-bottom:2px solid transparent;background:transparent;color:#8194aa;font:600 9px Inter;cursor:pointer}.sv-tabs button.active{color:#8fc0ff;border-bottom-color:#3987ff;background:#0d1727}
    .sv-settings{padding:14px;display:grid;gap:12px}.sv-field{display:grid;gap:6px;min-width:0}.sv-field label{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8196ad}.sv-field input,.sv-field textarea,.sv-field select{width:100%;min-width:0;border:1px solid #ffffff14;border-radius:8px;background:#060d17;color:#e4edf8;padding:10px;font:11px/1.5 Inter,system-ui;outline:none}.sv-field textarea{min-height:94px;resize:vertical}.sv-field input:focus,.sv-field textarea:focus,.sv-field select:focus{border-color:#438cff88;box-shadow:0 0 0 2px #438cff12}.sv-two{display:grid;grid-template-columns:1fr 1fr;gap:9px}.sv-asset-row{display:flex;align-items:center;gap:9px;border:1px solid #ffffff10;border-radius:9px;background:#0a1422;padding:10px}.sv-asset-icon{width:30px;height:30px;display:grid;place-items:center;background:#14243a;border-radius:7px;color:#83b6ff;flex:none}.sv-asset-copy{min-width:0;flex:1}.sv-asset-copy strong{display:block;font-size:10px}.sv-asset-copy small{display:block;font-size:8px;color:#758ba2;margin-top:3px;overflow-wrap:anywhere}.sv-status{padding:10px;border:1px solid #ffffff10;background:#070d16;border-radius:8px;color:#91a4b8;font-size:9px;line-height:1.5;overflow-wrap:anywhere}.sv-status.error{color:#ffaaaa;border-color:#70313a}.sv-status.success{color:#7de3d0;border-color:#1b6c63}.sv-asset-placeholder{padding:15px;border:1px dashed #ffffff20;border-radius:9px;text-align:center;color:#71859c;font-size:10px;line-height:1.6}
    .sv-hidden{display:none!important}.sv-toast{color:#7ee1ce;font-size:9px;min-height:12px}.sv-modal-backdrop{position:fixed;inset:0;z-index:1500;background:#000b;display:grid;place-items:center;padding:18px}.sv-modal{width:min(520px,100%);background:#0b1422;border:1px solid #ffffff1c;border-radius:14px;padding:18px;box-shadow:0 25px 80px #000b}.sv-modal h3{margin:0 0 12px;font-size:16px}.sv-modal-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
    @media(max-width:1050px){.sv-main{grid-template-columns:1fr}.sv-right{grid-template-columns:1fr 1fr;align-items:start}.sv-steps{gap:5px}.sv-step{gap:5px}}
    @media(max-width:700px){.sv-scene{grid-template-columns:110px minmax(0,1fr);gap:9px}.sv-scene-actions{grid-column:1/-1;grid-template-columns:repeat(4,minmax(0,1fr))}.sv-thumb{min-height:75px}.sv-right{grid-template-columns:1fr}.sv-steps{grid-template-columns:repeat(5,minmax(68px,1fr));overflow:auto}.sv-step small{display:none}.sv-vhead{padding:14px}.sv-vhead h2{font-size:19px}}
    @media(max-width:420px){.sv-scene{grid-template-columns:1fr}.sv-thumb{min-height:130px}.sv-scene-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.sv-mode button{padding:7px 6px;font-size:8px}.sv-two{grid-template-columns:1fr}}
    /* Video workspace accent theme: indigo */
    .sv-video{--sv-accent:#6366F1;--sv-accent-bright:#818CF8;--sv-accent-soft:#242454;--sv-accent-border:#5558D9}
    .sv-eyebrow{color:#818CF8}
    .sv-btn:hover{border-color:#6366F188;color:#fff}
    .sv-btn.primary{border-color:#5558D9;background:linear-gradient(110deg,#4F46E5,#6366F1);color:#fff}
    .sv-mode button.active{background:#242454;color:#D5D6FF;box-shadow:inset 0 0 0 1px #818CF866}
    .sv-step.active b,.sv-step.done b{background:#6366F1;color:#fff}
    .sv-scene.selected{border-color:#818CF899;box-shadow:inset 0 0 0 1px #6366F124}
    .sv-thumb{background:radial-gradient(ellipse at 65% 15%,#34366f,#1b1d42 45%,#070d18 80%);color:#A5B4FC}
    .sv-number{background:#5558D9;color:#fff}
    .sv-mini-assets button:hover{color:#fff;border-color:#818CF866}
    .sv-add{border-color:#6366F188;color:#A5B4FC}
    .sv-add:hover{background:#171936}
    .sv-tabs button.active{color:#C7D2FE;border-bottom-color:#818CF8;background:#14152c}
    .sv-field input:focus,.sv-field textarea:focus,.sv-field select:focus{border-color:#818CF888;box-shadow:0 0 0 2px #6366F112}
    .sv-asset-icon{background:#242454;color:#A5B4FC}
    .sv-preview-stage{background:radial-gradient(ellipse at 50% 15%,#34366f,#17192d 55%,#050a12)}
    /* Hide the right-side preview and settings panels for the simplified storyboard layout */
    .sv-main{grid-template-columns:minmax(0,1fr)!important}
    .sv-right{display:none!important}
    /* Compose-inspired spacious panel sizing */
    /* Match Compose's content alignment: start close to the sidebar, not centered in a narrow column */
    main.workspace:has(.sv-video){display:block;grid-template-columns:minmax(0,1fr);max-width:none;width:100%;margin:0;padding:26px 38px}
    .studio-domain-placeholder:has(.sv-video){display:block;width:100%;max-width:none;margin:0;padding:0;justify-self:stretch}
    .sv-video{width:100%;max-width:none;margin:0}
    .sv-video{gap:20px}
    .sv-card{border-radius:20px}
    .sv-vhead{padding:24px 28px;gap:20px;text-align:left}\n    .sv-vhead>div:first-child{margin-right:auto;text-align:left;align-self:flex-start}\n    .sv-vhead h2,.sv-vhead p,.sv-vhead .sv-eyebrow{text-align:left}
    .sv-eyebrow{font-size:10px}
    .sv-vhead h2{font-size:26px;margin:7px 0}
    .sv-vhead p{font-size:12px;font-weight:400;letter-spacing:normal;line-height:1.65}
    .sv-steps{padding:20px 24px;gap:14px}
    .sv-step{gap:11px;font-size:12px}
    .sv-step b{width:34px;height:34px;font-size:12px}
    .sv-step strong{font-size:12px}
    .sv-step small{font-size:10px}
    .sv-main{grid-template-columns:minmax(0,1.45fr) minmax(380px,.9fr);gap:20px}
    .sv-scenes{gap:14px}
    .sv-scene{grid-template-columns:minmax(220px,30%) minmax(0,1fr) 132px;gap:16px;padding:14px;border-radius:15px}
    .sv-thumb{min-height:150px;border-radius:10px}
    .sv-thumb span{font-size:34px}
    .sv-scene-info{padding:5px 0}
    .sv-scene-info h3{font-size:15px;margin-bottom:9px}
    .sv-scene-info p{font-size:12px;line-height:1.65;margin-bottom:12px}
    .sv-meta{gap:7px}
    .sv-chip{font-size:10px;padding:6px 8px}
    .sv-mini-assets{gap:7px;margin-top:12px}
    .sv-mini-assets button{font-size:10px;padding:8px 9px}
    .sv-scene-actions{gap:7px}
    .sv-scene-actions .sv-btn{padding:10px 7px;font-size:10px}
    .sv-btn{font-size:11px;padding:11px 14px}
    .sv-preview{padding:18px}
    .sv-preview-head{padding:2px 2px 14px}
    .sv-preview-head strong{font-size:15px}
    .sv-preview-stage{border-radius:12px;min-height:240px}
    .sv-preview-placeholder{padding:26px}
    .sv-preview-placeholder b{font-size:32px}
    .sv-preview-placeholder span{font-size:12px;line-height:1.65}
    .sv-settings{padding:20px;gap:16px}
    .sv-tabs button{font-size:11px;padding:14px 9px}
    .sv-field label{font-size:10px}
    .sv-field input,.sv-field textarea,.sv-field select{font-size:12px;padding:12px}
    .sv-asset-row{padding:13px;gap:12px}
    .sv-asset-icon{width:36px;height:36px}
    .sv-asset-copy strong{font-size:12px}
    .sv-asset-copy small{font-size:10px}
    .sv-status{padding:13px;font-size:11px;line-height:1.6}
    .sv-asset-placeholder{padding:19px;font-size:11px;line-height:1.7}
    @media(max-width:1250px){.sv-main{grid-template-columns:minmax(0,1.2fr) minmax(340px,.9fr);gap:16px}.sv-scene{grid-template-columns:minmax(170px,28%) minmax(0,1fr) 118px;gap:12px}.sv-thumb{min-height:125px}}
    @media(max-width:1050px){.sv-main{grid-template-columns:1fr}.sv-right{grid-template-columns:1fr 1fr;align-items:start}.sv-steps{gap:8px}.sv-step{gap:8px}}
    @media(max-width:700px){.sv-vhead{padding:18px}.sv-vhead h2{font-size:22px}.sv-main{gap:14px}.sv-scene{grid-template-columns:130px minmax(0,1fr);gap:12px;padding:12px}.sv-scene-actions{grid-column:1/-1;grid-template-columns:repeat(3,minmax(0,1fr))}.sv-thumb{min-height:90px}.sv-right{grid-template-columns:1fr}.sv-steps{grid-template-columns:repeat(5,minmax(76px,1fr));overflow:auto;padding:16px}.sv-step small{display:none}.sv-preview-stage{min-height:190px}}
    @media(max-width:420px){.sv-scene{grid-template-columns:1fr}.sv-thumb{min-height:160px}.sv-scene-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.sv-mode button{padding:7px 6px;font-size:8px}.sv-two{grid-template-columns:1fr}.sv-vhead{padding:15px}.sv-steps{grid-template-columns:repeat(5,minmax(68px,1fr))}}
  `;
  document.head.appendChild(style);

  function render(root){
    if(root.dataset.videoWorkspaceInitialized==='1')return;
    root.className='studio-domain-placeholder';
    root.innerHTML = `
      <div class="sv-video">
        <section class="sv-card">
          <div class="sv-vhead"><div><div class="sv-eyebrow">VIDEO</div><h2>Bring your story to life</h2><p>Plan, create and direct every scene. You direct &amp; SvaraFlow coordinates the work.</p></div>
            
          </div>
        </section>
        <div class="sv-main">
          <section class="sv-card">
            <div class="sv-vhead"><div><div class="sv-eyebrow">STORYBOARD</div><span class="sv-hidden" data-count>(3)</span></div></div>
            <div class="sv-scenes" data-scenes style="padding:10px"></div>
            <div style="padding:0 10px 10px"><button class="sv-add" data-action="add">＋ Add New Scene</button></div>
          </section>
          <div class="sv-right">
            <section class="sv-card sv-preview"><div class="sv-preview-head"><strong>Scene Preview</strong><span class="sv-chip" data-preview-state>Baseline needed</span></div><div class="sv-preview-stage" data-preview><div class="sv-preview-placeholder"><b>▶</b><span>Select a scene and add a reference image.<br>Preview and generated video will appear here.</span></div></div><div class="sv-status" style="margin-top:10px" data-global-status role="status">UI foundation ready. Generation remains scene-by-scene.</div></section>
            <section class="sv-card"><div class="sv-tabs" role="tablist"><button class="active" data-tab="settings">Scene Settings</button><button data-tab="assets">Assets</button><button data-tab="prompt">Prompt</button><button data-tab="advanced">Advanced</button></div><div class="sv-settings" data-settings></div></section>
          </div>
        </div>
        <section class="sv-card"><div class="sv-vhead"><div><div class="sv-eyebrow">ASSEMBLY · PLACEHOLDER</div><h2>Production Timeline</h2><p>Approved scene clips, dialogue, music, sound effects and transitions will be arranged here in a later phase.</p></div><span class="sv-chip">Not connected yet</span></div><div style="padding:14px;display:grid;gap:8px"><div class="sv-asset-row"><div class="sv-asset-icon">▣</div><div class="sv-asset-copy"><strong>Video scenes</strong><small>Scene clips and transitions · planned</small></div><span class="sv-chip">Future</span></div><div class="sv-asset-row"><div class="sv-asset-icon">♫</div><div class="sv-asset-copy"><strong>Voice, music &amp; sound</strong><small>Audio lanes and sync controls · planned</small></div><span class="sv-chip">Future</span></div></div></section>
      </div>`;
    const scenesNode=root.querySelector('[data-scenes]');
    const settingsNode=root.querySelector('[data-settings]');
    const preview=root.querySelector('[data-preview]');
    const globalStatus=root.querySelector('[data-global-status]');
    const previewState=root.querySelector('[data-preview-state]');
    let scenes=seedScenes(), selectedId=null, tab='settings', mode='director', reorder=false, modal=null;
    const selected=()=>scenes.find(s=>s.id===selectedId)||null;
    const setStatus=(message,type='')=>{globalStatus.textContent=message;globalStatus.className='sv-status'+(type?' '+type:'');};
    const renderScenes=()=>{
      root.querySelector('[data-count]').textContent='('+scenes.length+')';
      scenesNode.innerHTML=scenes.map((s,index)=>`<article class="sv-scene ${s.id===selectedId?'selected':''}" data-scene="${esc(s.id)}" tabindex="0" aria-label="Select ${esc(s.title)}">
        <div class="sv-thumb">${s.image?'<img src="'+esc(s.image)+'" alt="Scene reference">':s.video?'<video src="'+esc(s.video)+'" muted playsinline></video>':'<span>✧</span>'}</div>
        <div class="sv-scene-info"><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p><div class="sv-meta"><span class="sv-chip">${s.duration}s</span><span class="sv-chip">${s.ratio==='1280:720'?'16:9':s.ratio==='720:1280'?'9:16':s.ratio==='960:960'?'1:1':s.ratio}</span><span class="sv-chip">Runway Gen-4 Turbo</span><span class="sv-chip ${s.status==='Completed'||s.status==='Approved'?'ready':'status'}">${esc(s.status)}</span></div><div class="sv-mini-assets"><button data-scene-action="image" data-id="${esc(s.id)}">▧ Image</button><button data-scene-action="motion" data-id="${esc(s.id)}">⌁ Motion</button><button data-scene-action="voice" data-id="${esc(s.id)}">♩ Voice</button><button data-scene-action="music" data-id="${esc(s.id)}">♫ Music</button><button data-scene-action="sound" data-id="${esc(s.id)}">◖ Sound</button></div></div>
        <div class="sv-scene-actions"><button class="sv-btn primary" data-scene-action="generate" data-id="${esc(s.id)}">✦ Generate</button><button class="sv-btn" data-scene-action="preview" data-id="${esc(s.id)}">▷ Preview</button><button class="sv-btn" data-scene-action="edit" data-id="${esc(s.id)}">✎ Edit</button><button class="sv-btn" data-scene-action="duplicate" data-id="${esc(s.id)}">▢ Duplicate</button><button class="sv-btn" data-scene-action="delete" data-id="${esc(s.id)}">⌫ Delete</button></div>
      </article>`).join('');
    };
    const renderPreview=()=>{
      const s=selected();if(!s){previewState.textContent='No scene selected';preview.innerHTML='<div class="sv-preview-placeholder"><b>▶</b><span>Add a scene to see its preview here.</span></div>';return;}previewState.textContent=s.status;
      if(s.video)preview.innerHTML='<video controls playsinline src="'+esc(s.video)+'"></video>';
      else if(s.image)preview.innerHTML='<img src="'+esc(s.image)+'" alt="Selected scene baseline image">';
      else preview.innerHTML='<div class="sv-preview-placeholder"><b>▶</b><span>'+esc(s.title)+'<br>Add a reference image to prepare this scene.</span></div>';
    };
    const field=(label,control)=>'<div class="sv-field"><label>'+label+'</label>'+control+'</div>';
    const renderSettings=()=>{
      const s=selected();if(!s){settingsNode.innerHTML='<div class="sv-asset-placeholder">Add a scene to configure its settings.</div>';return;}let html='';
      if(tab==='settings') html=field('Scene title','<input data-bind="title" value="'+esc(s.title)+'" maxlength="100">')+field('Scene description','<textarea data-bind="description" maxlength="800">'+esc(s.description)+'</textarea>')+'<div class="sv-two">'+field('Duration','<select data-bind="duration"><option value="5" '+(s.duration===5?'selected':'')+'>5 seconds</option><option value="10" '+(s.duration===10?'selected':'')+'>10 seconds</option></select>')+field('Aspect ratio','<select data-bind="ratio"><option value="1280:720" '+(s.ratio==='1280:720'?'selected':'')+'>Landscape · 16:9</option><option value="720:1280" '+(s.ratio==='720:1280'?'selected':'')+'>Portrait · 9:16</option><option value="1104:832" '+(s.ratio==='1104:832'?'selected':'')+'>Landscape · 4:3</option><option value="832:1104" '+(s.ratio==='832:1104'?'selected':'')+'>Portrait · 3:4</option><option value="960:960" '+(s.ratio==='960:960'?'selected':'')+'>Square · 1:1</option><option value="1584:672" '+(s.ratio==='1584:672'?'selected':'')+'>Wide · 2.36:1</option></select>')+'</div>'+field('Generation model','<select disabled><option>Runway Gen-4 Turbo · connected</option><option>Other providers · planned</option></select>')+'<div class="sv-asset-placeholder">Scene baseline image: '+(s.image?'Ready':'Not selected')+'<br>Voice, music and sound effects selectors are placeholders for the asset integration phase.</div>';
      else if(tab==='assets') html='<div class="sv-asset-row"><div class="sv-asset-icon">▧</div><div class="sv-asset-copy"><strong>Reference image</strong><small>'+(s.image?'Image attached':'Choose a local image for this scene')+'</small></div><button class="sv-btn" data-settings-action="image">Choose</button><input class="sv-hidden" data-image-input type="file" accept="image/png,image/jpeg,image/webp"></div><div class="sv-asset-row"><div class="sv-asset-icon">♩</div><div class="sv-asset-copy"><strong>Voice</strong><small>Voice library integration · placeholder</small></div><button class="sv-btn" data-settings-action="voice">Select</button></div><div class="sv-asset-row"><div class="sv-asset-icon">♫</div><div class="sv-asset-copy"><strong>Music</strong><small>Sound library integration · placeholder</small></div><button class="sv-btn" data-settings-action="music">Select</button></div><div class="sv-asset-row"><div class="sv-asset-icon">◖</div><div class="sv-asset-copy"><strong>Sound effects</strong><small>Sound library integration · placeholder</small></div><button class="sv-btn" data-settings-action="sound">Select</button></div><div class="sv-asset-placeholder">Asset selectors will connect to SvaraONE libraries in a later phase.</div>';
      else if(tab==='prompt') html=field('Motion prompt','<textarea data-bind="prompt" maxlength="2000" style="min-height:150px">'+esc(s.prompt)+'</textarea>')+'<div class="sv-asset-placeholder">Prompts are editable now. SvaraFlow prompt planning and refinement will be connected in a later phase.</div>';
      else html='<div class="sv-asset-placeholder">Advanced generation controls will be added when supported by the selected provider.</div>'+field('Scene approval','<select data-bind="status"><option '+(s.status==='Baseline needed'?'selected':'')+'>Baseline needed</option><option '+(s.status==='Ready to generate'?'selected':'')+'>Ready to generate</option><option '+(s.status==='Approved'?'selected':'')+'>Approved</option><option '+(s.status==='Needs revision'?'selected':'')+'>Needs revision</option></select>');
      settingsNode.innerHTML=html;
    };
    const selectScene=id=>{if(!scenes.some(s=>s.id===id))return;selectedId=id;renderScenes();renderSettings();renderPreview();};
    const chooseImage=()=>{
      const s=selected();const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.onchange=()=>{const file=input.files&&input.files[0];if(!file)return;if(s.image&&s.image.startsWith('blob:'))URL.revokeObjectURL(s.image);s.image=URL.createObjectURL(file);s.imageFile=file;s.status='Ready to generate';renderScenes();renderSettings();renderPreview();setStatus('Baseline image attached to '+s.title+'. Review the prompt before generating.','success');};input.click();
    };
    const showPlaceholder=kind=>{const labels={voice:'Voice selection will connect to Voice Library.',music:'Music selection will connect to Sound Library.',sound:'Sound-effect selection will connect to Sound Library.',motion:'Edit the scene motion prompt in the Prompt tab.'};setStatus(labels[kind]||'This control is reserved for the next implementation phase.');if(kind==='motion'){tab='prompt';renderTabs();renderSettings();}};
    const renderTabs=()=>root.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    const generate=async s=>{
      if(!s.imageFile){selectScene(s.id);tab='assets';renderTabs();renderSettings();setStatus('Add a reference image to this scene before generating.','error');return;}
      if(!s.prompt.trim()){selectScene(s.id);tab='prompt';renderTabs();renderSettings();setStatus('Add a motion prompt before generating.','error');return;}
      s.status='Generating';renderScenes();renderPreview();setStatus('Uploading the scene image and submitting to Runway…');
      const button=root.querySelector('[data-scene-action="generate"][data-id="'+s.id+'"]');if(button){button.disabled=true;button.textContent='Submitting…';}
      try{
        const body=new FormData();body.append('image',s.imageFile,s.imageFile.name);body.append('promptText',s.prompt);body.append('ratio',s.ratio);body.append('duration',String(s.duration));
        const response=await fetch('/api/video/runway',{method:'POST',credentials:'same-origin',body});const data=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(data.error||('Runway request failed ('+response.status+')'));
        const taskId=String(data.id||data.taskId||'');if(!taskId)throw new Error('Runway returned no task ID.');
        setStatus('Runway accepted '+s.title+'. Checking generation status…');
        let finished=false;
        for(let n=0;n<60;n++){await new Promise(resolve=>setTimeout(resolve,4000));const poll=await fetch('/api/video/runway/tasks/'+encodeURIComponent(taskId),{credentials:'same-origin',cache:'no-store'});const state=await poll.json().catch(()=>({}));if(!poll.ok)throw new Error(state.error||('Status check failed ('+poll.status+')'));const status=String(state.status||'').toUpperCase();if(status==='SUCCEEDED'){const output=Array.isArray(state.output)?state.output[0]:state.output;if(!output)throw new Error('Runway returned no video URL.');s.video=output;s.status='Completed';finished=true;break;}if(status==='FAILED'||status==='CANCELED')throw new Error(state.failure||state.failureCode||'Runway could not generate this scene.');}
        if(!finished)throw new Error('Generation is still processing. Task ID: '+taskId);
        renderScenes();renderPreview();setStatus(s.title+' generated successfully. Preview the result and mark it approved when ready.','success');
      }catch(error){s.status='Failed';renderScenes();setStatus(String(error?.message||error),'error');}
      finally{const b=root.querySelector('[data-scene-action="generate"][data-id="'+s.id+'"]');if(b){b.disabled=false;b.textContent='✦ Generate';}}
    };
    const addScene=()=>{const n=scenes.length+1;const s={id:'scene-'+Date.now(),title:'Scene '+n+' — New Scene',description:'Describe what happens in this scene.',duration:5,ratio:'1280:720',status:'Baseline needed',image:'',video:'',prompt:'Describe the action, camera movement, lighting and desired visual continuity.'};scenes.push(s);selectScene(s.id);setStatus('New scene added. Edit the description, attach a baseline image and refine the prompt.');};
    const openProjectMenu=()=>{const wrap=document.createElement('div');wrap.className='sv-modal-backdrop';wrap.innerHTML='<section class="sv-modal" role="dialog" aria-modal="true"><h3>Project actions</h3><div class="sv-asset-placeholder">Project rename, duplicate, templates and history are planned. This milestone keeps the project local to this workspace.</div><div class="sv-modal-foot"><button class="sv-btn" data-close>Close</button></div></section>';wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.closest('[data-close]'))wrap.remove();});root.appendChild(wrap);};
    root.addEventListener('click',event=>{
      const modeButton=event.target.closest('[data-mode]');if(modeButton){mode=modeButton.dataset.mode;root.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b===modeButton));setStatus(mode==='director'?'Director mode: approve each scene before generation.':mode==='hybrid'?'Hybrid mode: review key decisions and let SvaraFlow assist.':'Automatic mode selected. Automated orchestration is a planned feature.');return;}
      const tabButton=event.target.closest('[data-tab]');if(tabButton){tab=tabButton.dataset.tab;renderTabs();renderSettings();return;}
      const sceneAction=event.target.closest('[data-scene-action]');if(sceneAction){event.stopPropagation();const s=scenes.find(x=>x.id===sceneAction.dataset.id);if(!s)return;const action=sceneAction.dataset.sceneAction;if(action==='generate'){selectScene(s.id);generate(s);}else if(action==='preview'){selectScene(s.id);renderPreview();if(s.video){preview.innerHTML='<video controls autoplay playsinline src="'+esc(s.video)+'"></video>';}}else if(action==='edit'){selectScene(s.id);tab='settings';renderTabs();renderSettings();}else if(action==='image'){selectScene(s.id);chooseImage();}else if(action==='motion'){selectScene(s.id);tab='prompt';renderTabs();renderSettings();}else if(action==='voice'||action==='music'||action==='sound'){selectScene(s.id);showPlaceholder(action);}else if(action==='duplicate'){const copy={...s,id:'scene-'+Date.now(),title:s.title+' (Copy)',image:s.image,video:'',status:s.imageFile?'Ready to generate':'Baseline needed'};scenes.splice(scenes.indexOf(s)+1,0,copy);selectScene(copy.id);setStatus('Scene duplicated. Review its prompt and image before generating.');}else if(action==='delete'){scenes=scenes.filter(x=>x.id!==s.id);selectedId=scenes[0]?.id||null;renderScenes();renderSettings();renderPreview();setStatus('Scene removed from this unsaved storyboard.');}return;}
      const settingsAction=event.target.closest('[data-settings-action]');if(settingsAction){if(settingsAction.dataset.settingsAction==='image')chooseImage();else showPlaceholder(settingsAction.dataset.settingsAction);return;}
      const action=event.target.closest('[data-action]')?.dataset.action;if(action==='add'){addScene();return;}if(action==='reorder'){reorder=!reorder;setStatus(reorder?'Reorder mode: use the scene cards’ move controls in the next phase.':'Reorder mode closed.');return;}if(action==='save'){setStatus('Save Project is a placeholder in this UI milestone. Persistent project storage is planned.');return;}if(action==='project-menu'){openProjectMenu();return;}if(action==='generate-all'){setStatus('Generate All is reserved for a later phase. Generate scenes individually for now; each request can consume Runway credits.');return;}
      const card=event.target.closest('[data-scene]');if(card)selectScene(card.dataset.scene);
    });
    root.addEventListener('change',event=>{
      const bind=event.target.dataset.bind;if(bind){const s=selected();s[bind]=bind==='duration'?Number(event.target.value):event.target.value;if(bind==='status')renderScenes();if(bind==='title'||bind==='description'||bind==='duration'||bind==='ratio')renderScenes();renderPreview();return;}
      if(event.target.matches('[data-image-input]')){const file=event.target.files&&event.target.files[0];if(file){const s=selected();s.imageFile=file;s.image=URL.createObjectURL(file);s.status='Ready to generate';renderScenes();renderSettings();renderPreview();}}
    });
    root.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-scene]')){event.preventDefault();selectScene(event.target.dataset.scene);}});
    renderScenes();renderSettings();renderPreview();
    root.dataset.videoWorkspaceInitialized='1';
  }
  window.SvaraVideoWorkspace={render};
})();