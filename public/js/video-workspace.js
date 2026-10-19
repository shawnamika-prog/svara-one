(()=> {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const seedScenes = () => [];
  const style = document.createElement('style');
  style.id='svaraVideoWorkspaceStyle';
  style.textContent = `
    .sv-video{color:#e5edf8;display:grid;gap:14px;min-width:0;font-family:Inter,system-ui,sans-serif}
    .sv-video *{box-sizing:border-box}.sv-card{background:linear-gradient(180deg,#0b1220,#080e18);border:1px solid #ffffff12;border-radius:15px;min-width:0;overflow:hidden}
    .sv-vhead{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:17px 19px;border-bottom:1px solid #ffffff0c;flex-wrap:wrap}.sv-workflow-label{padding-top:13px}
    .sv-eyebrow{font-size:9px;letter-spacing:.17em;font-weight:800;color:#65a7ff}.sv-vhead h2{font-size:22px;letter-spacing:-.04em;margin:5px 0}.sv-vhead p{font-size:11px;color:#8294aa;margin:0;line-height:1.5}
    .sv-actions{display:flex;gap:7px;flex-wrap:wrap}.sv-btn{border:1px solid #ffffff16;border-radius:9px;background:#101a29;color:#c4d3e4;padding:9px 12px;font:700 10px Inter,system-ui;cursor:pointer}.sv-btn:hover{border-color:#4c8cff88;color:white}.sv-btn.primary{border-color:#4c8cff;background:linear-gradient(110deg,#2675ee,#438dff);color:white}.sv-btn:disabled{opacity:.5;cursor:wait}
    .sv-mode{display:flex;gap:3px;background:#080e18;border:1px solid #ffffff14;border-radius:10px;padding:3px}.sv-mode button{border:0;background:transparent;color:#8da0b5;border-radius:7px;padding:8px 10px;font:600 9px Inter;cursor:pointer}.sv-mode button.active{background:#183d73;color:#bcd9ff;box-shadow:inset 0 0 0 1px #4b8cff66}
    .sv-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:14px 16px}.sv-step{display:flex;align-items:center;gap:8px;min-width:0;color:#8092a8;font-size:10px}.sv-step b{display:grid;place-items:center;width:27px;height:27px;flex:none;border-radius:50%;background:#263448;color:#bdcce0}.sv-step.active b,.sv-step.done b{background:#277cf5;color:#fff}.sv-step span{display:block;min-width:0}.sv-step strong{display:block;color:#dbe7f6;font-size:10px}.sv-step small{display:block;color:#73879d;font-size:8px;margin-top:3px}
    .sv-workflow{padding:0 16px 15px;display:grid;gap:10px}.sv-workflow-label{font-size:9px;letter-spacing:.14em;font-weight:800;color:#778ba7}.sv-workflow-rail{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:0;align-items:start}.sv-workflow-step{position:relative;display:grid;justify-items:center;align-content:start;gap:6px;padding:0 4px;border:0;background:none;color:#74869e;cursor:pointer;min-width:0;text-align:center}.sv-workflow-step:before{content:'';position:absolute;height:2px;background:#273449;left:calc(50% + 16px);right:calc(-50% + 16px);top:14px;z-index:0;pointer-events:none}.sv-workflow-step:last-child:before{display:none}.sv-workflow-step.done:before,.sv-workflow-step.active:before{background:#635bdf}.sv-workflow-dot{position:relative;z-index:1;display:grid;place-items:center;width:29px;height:29px;border-radius:50%;border:1px solid #35445c;background:#0b1220;box-shadow:0 0 0 3px #0b1220;color:#91a2ba;font-size:10px;font-weight:800}.sv-workflow-step.active .sv-workflow-dot{border-color:#8b83ff;background:#5146c9;color:white;box-shadow:0 0 0 4px #635bdf22}.sv-workflow-step.done .sv-workflow-dot{border-color:#327f75;background:#123c3b;color:#7ee7d0}.sv-workflow-step strong{display:block;font-size:9px;line-height:1.25;color:#b8c5d7;font-weight:650;overflow-wrap:anywhere}.sv-workflow-step.active strong{color:#e4e5ff}.sv-workflow-step:disabled{cursor:not-allowed;opacity:.55}.sv-workflow-step:disabled .sv-workflow-dot{background:#080d15}.sv-workflow-status{font-size:9px;color:#8ea0b6;line-height:1.4}.sv-workflow-status strong{color:#cbd5e1;font-weight:700}.sv-accordion.workflow-locked{display:none!important}.sv-accordion.workflow-current{border-color:#635bdf55}.sv-workflow-actions{display:flex;gap:8px;flex-wrap:wrap}.sv-workflow-actions .sv-btn{font-size:10px}.sv-workflow-actions .sv-btn.skip{background:transparent;border-color:#ffffff20;color:#9eacc0}
    @media(max-width:760px){.sv-workflow{padding:12px}.sv-workflow-rail{grid-template-columns:repeat(7,minmax(80px,1fr));overflow-x:auto;padding:2px 0 7px}.sv-workflow-step strong{font-size:9px}.sv-workflow-status{font-size:9px}}

    .sv-projects-panel .sv-vhead{border-bottom:1px solid #ffffff0c}.sv-projects-list{display:grid;gap:8px;padding:14px 16px}.sv-project-row{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #ffffff12;border-radius:10px;background:#0a1220;min-width:0}.sv-project-icon{display:grid;place-items:center;flex:none;width:38px;height:38px;border-radius:9px;background:#25234b;color:#c7d2fe;font-size:17px}.sv-project-copy{min-width:0;flex:1}.sv-project-copy strong{display:block;font-size:12px;color:#e5edf8;overflow-wrap:anywhere}.sv-project-copy small{display:block;margin-top:5px;color:#879ab1;font-size:9px;line-height:1.5}.sv-project-actions{display:flex;gap:6px;flex-wrap:wrap}.sv-project-actions .sv-btn{padding:8px 10px}.sv-project-empty{padding:18px;border:1px dashed #ffffff1f;border-radius:10px;color:#8ea0b6;font-size:11px;line-height:1.6;text-align:center}.sv-project-actions .danger{background:#261418;border-color:#71313b;color:#ff8f9b}.sv-project-actions .danger:hover{background:#30171d;border-color:#8a3c48;color:#ffabb4}.sv-delete-project-modal{max-width:440px;border-color:#75404a;box-shadow:0 25px 90px #000d,0 0 35px #5b233522}.sv-delete-project-mark{display:grid;place-items:center;width:36px;height:36px;border-radius:10px;background:#4a202b;border:1px solid #a84858;color:#ffb7c0;font-size:21px;font-weight:800;margin-bottom:14px}.sv-delete-project-modal h3{font-size:17px;color:#f1f5ff}.sv-delete-project-modal p{margin:0;color:#a8b6c9;font-size:12px;line-height:1.7}.sv-delete-project-modal p strong{color:#f1f5ff;overflow-wrap:anywhere}.sv-delete-project-modal .sv-modal-foot{margin-top:22px}.sv-btn-danger{background:#7f2635!important;border:1px solid #b84b5d!important;color:#fff!important}.sv-btn-danger:hover{background:#9b2e40!important}
.sv-saved-reference-list{display:grid;gap:6px;margin-top:8px}.sv-saved-reference-list>small{font-size:9px;color:#93a6bd}.sv-saved-reference{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:7px 9px;border:1px solid #ffffff12;border-radius:8px;background:#0a1220}.sv-saved-reference span{flex:1;min-width:120px;font-size:10px;color:#cbd5e1;overflow-wrap:anywhere}.sv-saved-reference .sv-btn{padding:6px 8px;font-size:9px;text-decoration:none}
.sv-project-actions .danger:hover{border-color:#bd485a}
    .sv-main{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(310px,.85fr);gap:14px;align-items:start}.sv-scenes{display:grid;gap:10px}.sv-scene{display:grid;grid-template-columns:minmax(190px,29%) minmax(0,1fr) 112px;gap:12px;padding:10px;border:1px solid #ffffff12;background:#0a1220;border-radius:12px;cursor:pointer;min-width:0}.sv-scene.selected{border-color:#428bff99;box-shadow:inset 0 0 0 1px #428bff24}.sv-thumb{position:relative;display:grid;place-items:center;aspect-ratio:16/9;min-height:110px;border-radius:8px;overflow:hidden;background:radial-gradient(ellipse at 65% 15%,#284c7b,#111f37 45%,#070d18 80%);border:1px solid #ffffff10;color:#7c9fc9}.sv-thumb img,.sv-thumb video{width:100%;height:100%;position:absolute;inset:0;object-fit:cover}.sv-thumb span{position:relative;font-size:28px;z-index:1;text-shadow:0 2px 15px #000}.sv-number{position:absolute;z-index:2;left:7px;top:7px;background:#267cf5;color:#fff;border-radius:6px;padding:5px 7px;font-size:10px;font-weight:800}.sv-scene-info{min-width:0;padding:3px 0}.sv-scene-info h3{font-size:12px;margin:0 0 7px;line-height:1.4;color:#edf4ff}.sv-scene-info p{font-size:10px;color:#8da0b5;line-height:1.5;margin:0 0 9px}.sv-meta{display:flex;gap:5px;flex-wrap:wrap}.sv-chip{padding:5px 7px;border-radius:6px;background:#101d2d;border:1px solid #ffffff0b;color:#8fa7c0;font-size:8px;white-space:nowrap}.sv-chip.status{color:#e4c48a}.sv-chip.ready{color:#60e0c9}.sv-mini-assets{display:flex;gap:5px;margin-top:9px;flex-wrap:wrap}.sv-mini-assets button{border:1px solid #ffffff12;border-radius:7px;background:#0c1725;color:#9aadc1;padding:6px 7px;font-size:8px;cursor:pointer}.sv-mini-assets button:hover{color:#fff;border-color:#428bff66}.sv-scene-actions{display:grid;align-content:start;gap:5px}.sv-scene-actions .sv-btn{padding:8px 5px;font-size:9px}.sv-add{border:1px dashed #3984fa88;border-radius:10px;background:#0b1422;color:#81b5ff;padding:13px;text-align:center;width:100%;cursor:pointer;font:700 10px Inter}.sv-add:hover{background:#10203a}
    .sv-right{display:grid;gap:12px;min-width:0}.sv-preview{padding:12px}.sv-preview-head{display:flex;align-items:center;justify-content:space-between;padding:2px 2px 10px}.sv-preview-head strong{font-size:12px}.sv-preview-stage{aspect-ratio:16/9;display:grid;place-items:center;position:relative;overflow:hidden;border-radius:9px;background:radial-gradient(ellipse at 50% 15%,#244a79,#101a2b 55%,#050a12);border:1px solid #ffffff12}.sv-preview-stage img,.sv-preview-stage video{width:100%;height:100%;object-fit:contain}.sv-preview-placeholder{text-align:center;padding:20px;color:#8ea5c0}.sv-preview-placeholder b{font-size:25px;display:block;margin-bottom:10px}.sv-preview-placeholder span{display:block;font-size:10px;line-height:1.5}
    .sv-tabs{display:flex;border-bottom:1px solid #ffffff12;overflow:auto}.sv-tabs button{flex:1;min-width:64px;padding:11px 7px;border:0;border-bottom:2px solid transparent;background:transparent;color:#8194aa;font:600 9px Inter;cursor:pointer}.sv-tabs button.active{color:#8fc0ff;border-bottom-color:#3987ff;background:#0d1727}
    .sv-settings{padding:14px;display:grid;gap:12px}.sv-field{display:grid;gap:6px;min-width:0}.sv-field label{font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8196ad}.sv-field input,.sv-field textarea,.sv-field select{width:100%;min-width:0;border:1px solid #ffffff14;border-radius:8px;background:#060d17;color:#e4edf8;padding:10px;font:11px/1.5 Inter,system-ui;outline:none}.sv-field textarea{min-height:94px;resize:vertical}
/* SvaraONE-native scrollbars for multiline text inputs (no Bootstrap). */
.sv-field textarea,.sv-refine-panel textarea{scrollbar-width:thin;scrollbar-color:#45418f #080f1c}
.sv-field textarea::-webkit-scrollbar,.sv-refine-panel textarea::-webkit-scrollbar{width:8px;height:8px}
.sv-field textarea::-webkit-scrollbar-track,.sv-refine-panel textarea::-webkit-scrollbar-track{background:#080f1c;border-radius:8px}
.sv-field textarea::-webkit-scrollbar-thumb,.sv-refine-panel textarea::-webkit-scrollbar-thumb{background:#45418f;border:2px solid #080f1c;border-radius:8px}
.sv-field textarea::-webkit-scrollbar-thumb:hover,.sv-refine-panel textarea::-webkit-scrollbar-thumb:hover{background:#7168e8}
.sv-field input:focus,.sv-field textarea:focus,.sv-field select:focus{border-color:#438cff88;box-shadow:0 0 0 2px #438cff12}.sv-two{display:grid;grid-template-columns:1fr 1fr;gap:9px}.sv-asset-row{display:flex;align-items:center;gap:9px;border:1px solid #ffffff10;border-radius:9px;background:#0a1422;padding:10px}.sv-asset-icon{width:30px;height:30px;display:grid;place-items:center;background:#14243a;border-radius:7px;color:#83b6ff;flex:none}.sv-asset-copy{min-width:0;flex:1}.sv-asset-copy strong{display:block;font-size:10px}.sv-asset-copy small{display:block;font-size:8px;color:#758ba2;margin-top:3px;overflow-wrap:anywhere}.sv-status{padding:10px;border:1px solid #ffffff10;background:#070d16;border-radius:8px;color:#91a4b8;font-size:9px;line-height:1.5;overflow-wrap:anywhere}.sv-status.error{color:#ffaaaa;border-color:#70313a}.sv-status.success{color:#7de3d0;border-color:#1b6c63}.sv-asset-placeholder{padding:15px;border:1px dashed #ffffff20;border-radius:9px;text-align:center;color:#71859c;font-size:10px;line-height:1.6}
    .sv-hidden{display:none!important}.sv-toast{color:#7ee1ce;font-size:9px;min-height:12px}.sv-modal-backdrop{position:fixed;inset:0;z-index:1500;background:#000b;display:grid;place-items:center;padding:18px}.sv-modal{width:min(520px,100%);background:#0b1422;border:1px solid #ffffff1c;border-radius:14px;padding:18px;box-shadow:0 25px 80px #000b}.sv-modal h3{margin:0 0 12px;font-size:16px}.sv-modal-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
    @media(max-width:1050px){.sv-main{grid-template-columns:1fr}.sv-right{grid-template-columns:1fr 1fr;align-items:start}.sv-steps{gap:5px}.sv-step{gap:5px}}
    @media(max-width:700px){.sv-scene{grid-template-columns:110px minmax(0,1fr);gap:9px}.sv-scene-actions{grid-column:1/-1;grid-template-columns:repeat(4,minmax(0,1fr))}.sv-thumb{min-height:75px}.sv-right{grid-template-columns:1fr}.sv-steps{grid-template-columns:repeat(5,minmax(68px,1fr));overflow:auto}.sv-step small{display:none}.sv-vhead{padding:14px}.sv-vhead h2{font-size:19px}}
    @media(max-width:420px){.sv-scene{grid-template-columns:1fr}.sv-thumb{min-height:130px}.sv-scene-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.sv-mode button{padding:7px 6px;font-size:8px}.sv-two{grid-template-columns:1fr}}
    /* Video workspace accent theme: indigo */
    .sv-discovery-result{text-align:left!important}.sv-discovery-result *{text-align:left}.sv-concept-kicker{font-size:9px;font-weight:800;letter-spacing:.15em;color:#a5a6ff;margin-bottom:8px}.sv-concept-kicker span{opacity:.5}.sv-discovery-result h3{font-size:20px;line-height:1.3;margin:5px 0 7px;color:#f2f5ff}.sv-discovery-result h4{font-size:12px;margin:0;color:#e0e7ff}.sv-discovery-result p,.sv-discovery-result li{font-size:11px;line-height:1.55;color:#aebbd0}.sv-concept-logline{font-size:13px!important;line-height:1.6!important;color:#e0e7ff!important;max-width:850px;margin:0 0 15px!important}.sv-concept-icon{width:15px;height:15px;flex:0 0 15px;color:#a5b4fc}.sv-concept-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:14px 0 18px}.sv-concept-meta>div{display:flex;align-items:flex-start;gap:9px;padding:10px;border:1px solid #ffffff12;border-radius:8px;background:#0b1422;min-width:0}.sv-concept-meta span{font-size:10px;line-height:1.5;color:#d7e1f1}.sv-concept-direction{padding:14px;border:1px solid #ffffff12;border-radius:10px;background:#11172a;margin:0 0 17px}.sv-concept-section-title{display:flex;align-items:center;gap:8px;margin-bottom:9px}.sv-concept-section-title>span{margin-left:auto;font-size:9px;color:#a5b4fc}.sv-concept-direction>p{margin:0 0 10px}.sv-concept-tags{display:flex;gap:6px;flex-wrap:wrap}.sv-concept-tags span{font-size:9px;color:#c7d2fe;border:1px solid #6366f144;background:#27254a;padding:4px 7px;border-radius:5px}.sv-concept-story{margin-top:2px}.sv-concept-scenes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.sv-concept-scene{padding:11px;border:1px solid #ffffff12;background:#0a1321;border-radius:9px;min-width:0}.sv-concept-scene-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.sv-concept-scene-title{display:flex;align-items:center;gap:7px;min-width:0}.sv-concept-scene-title strong{font-size:11px;line-height:1.4;color:#e2e8f0}.sv-concept-scene-number{font-size:9px;color:#a5b4fc;font-variant-numeric:tabular-nums}.sv-concept-duration{display:flex;align-items:center;gap:4px;white-space:nowrap;color:#a5b4fc;font-size:9px}.sv-concept-duration .sv-concept-icon{width:12px;height:12px;flex-basis:12px}.sv-concept-purpose{margin:8px 0!important;color:#d7e1f1!important}.sv-concept-detail{display:flex;align-items:flex-start;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #ffffff0c}.sv-concept-detail .sv-concept-icon{margin-top:1px}.sv-concept-detail p{margin:0!important;flex:1}.sv-concept-narration{background:#12192a;border-radius:6px;padding:8px;margin-top:9px}.sv-concept-bottom{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.sv-concept-bottom>div{padding:10px;border:1px solid #ffffff12;border-radius:8px}.sv-concept-bottom small{font-size:8px;letter-spacing:.1em;color:#8795bd}.sv-concept-bottom p{margin:5px 0 0!important;color:#d7e1f1!important}.sv-concept-more{margin-top:12px;border-top:1px solid #ffffff12;padding-top:10px}.sv-concept-more summary{display:flex;align-items:center;gap:8px;cursor:pointer;color:#aebbd0;font-size:10px;list-style:none}.sv-concept-more summary::-webkit-details-marker{display:none}.sv-concept-more>div{padding:8px 0}.sv-concept-more strong{font-size:10px;color:#d7e1f1}.sv-concept-more ul{margin:5px 0 10px;padding-left:17px}.sv-concept-more li{margin:3px 0}.sv-discovery-result .sv-draft-note{padding:8px 10px;border-radius:7px;background:#241f12;border:1px solid #8a6d2d55;color:#e9d5a2;font-size:9px;line-height:1.5;margin-top:12px}.sv-discovery-result-actions{display:flex;flex-direction:column;align-items:stretch;gap:12px}.sv-discovery-result-actions [data-discovery-result-note]{display:block;flex:none;text-align:right;width:100%}.sv-discovery-action-buttons{display:flex;justify-content:flex-end;align-items:center;gap:8px;flex-wrap:wrap;width:100%}.sv-discovery-action-buttons>.sv-btn{flex:none}.sv-discovery-result h3{font-size:20px!important;line-height:1.3!important;margin:5px 0 7px!important}.sv-discovery-result .sv-concept-logline{font-size:13px!important;line-height:1.6!important;margin:0 0 15px!important}.sv-discovery-result .sv-concept-direction>p{margin:0 0 10px!important}.sv-discovery-result .sv-concept-bottom p{margin:5px 0 0!important}
/* Option C Creative Canvas */
.sv-discovery-result.sv-creative-canvas{padding:15px!important}.sv-canvas-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}.sv-canvas-title{min-width:0;flex:1}.sv-canvas-title h3{margin:2px 0 4px!important;font-size:22px!important}.sv-canvas-title .sv-concept-logline{font-size:11px!important;line-height:1.5!important;margin:0!important;color:#b8c5dc!important}.sv-canvas-meta{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.sv-canvas-meta span{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border:1px solid #ffffff12;background:#0b1422;border-radius:8px;color:#cbd5e1;font-size:9px;white-space:nowrap}.sv-canvas-meta .sv-concept-icon{width:13px;height:13px;flex-basis:13px}.sv-canvas-top{display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:12px}.sv-canvas-title{width:100%;max-width:none;flex:none}.sv-canvas-title h3{max-width:none;overflow-wrap:normal;word-break:normal}.sv-canvas-title .sv-concept-logline{max-width:none;width:100%;overflow-wrap:normal}.sv-canvas-meta{width:100%;justify-content:flex-start;align-items:center}.sv-canvas-style{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin:12px 0 14px}.sv-canvas-style p{margin:0!important;flex:1;min-width:220px;font-size:10px!important;line-height:1.5!important;color:#aebbd0!important}.sv-canvas-style span{font-size:9px;color:#d5d6ff;background:#242454;border:1px solid #6366f144;border-radius:6px;padding:5px 8px}.sv-canvas-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(260px,.9fr);gap:12px;align-items:stretch}.sv-canvas-preview{position:relative;min-width:0;min-height:310px;overflow:hidden;border:1px solid #34375f;border-radius:12px;background:radial-gradient(ellipse at 72% 22%,#3c3478 0%,transparent 38%),radial-gradient(ellipse at 20% 85%,#173d5d 0%,transparent 42%),linear-gradient(135deg,#11182c,#080d18 65%);display:flex;flex-direction:column;justify-content:space-between;padding:15px}.sv-canvas-preview:before{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 15%,#a5b4fc0b 48%,transparent 70%);pointer-events:none}.sv-canvas-preview-top,.sv-canvas-preview-bottom{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:8px}.sv-canvas-preview-top span,.sv-canvas-preview-bottom span{font-size:9px;color:#c7d2fe;background:#070d18a8;border:1px solid #ffffff18;padding:6px 8px;border-radius:6px}.sv-canvas-preview-art{position:relative;z-index:1;display:grid;place-items:center;flex:1;min-height:180px;text-align:center;padding:18px}.sv-canvas-orbit{position:absolute;width:min(42%,210px);aspect-ratio:1;border:1px solid #a5b4fc44;border-radius:50%;box-shadow:0 0 60px #6366f122,inset 0 0 35px #6366f111}.sv-canvas-orbit:before,.sv-canvas-orbit:after{content:"";position:absolute;border:1px solid #7dd3fc35;border-radius:50%;inset:14% -14%;transform:rotate(-32deg)}.sv-canvas-orbit:after{inset:28% -27%;transform:rotate(34deg)}.sv-canvas-art-symbol{position:relative;display:grid;place-items:center;width:76px;height:76px;border-radius:22px;background:linear-gradient(145deg,#818cf833,#38bdf822);border:1px solid #a5b4fc77;color:#dbeafe;font-size:36px;box-shadow:0 0 55px #6366f133}.sv-canvas-art-copy{position:relative;max-width:310px;margin-top:16px;color:#e5e7eb;font-size:11px;line-height:1.55}.sv-canvas-art-copy small{display:block;color:#a5b4fc;font-size:8px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:6px}.sv-canvas-side{display:grid;grid-template-rows:auto 1fr;gap:10px;min-width:0}.sv-canvas-rail{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px}.sv-canvas-thumb{position:relative;min-width:0;overflow:hidden;padding:0;border:1px solid #ffffff18;border-radius:8px;background:linear-gradient(145deg,#243354,#10182a 65%,#080d18);cursor:pointer;aspect-ratio:1.08}.sv-canvas-thumb:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 70% 25%,#a5b4fc33,transparent 48%),linear-gradient(135deg,transparent,#38bdf811)}.sv-canvas-thumb:nth-child(2n){background:linear-gradient(145deg,#392d5e,#10182a 70%,#080d18)}.sv-canvas-thumb:nth-child(3n){background:linear-gradient(145deg,#17475a,#10182a 70%,#080d18)}.sv-canvas-thumb.active{border-color:#8b83ff;box-shadow:0 0 0 2px #6366f155,0 0 18px #6366f133}.sv-canvas-thumb b{position:absolute;left:5px;top:5px;display:grid;place-items:center;width:20px;height:20px;border-radius:6px;background:#11172dcc;color:#c7d2fe;font-size:9px}.sv-canvas-thumb.active b{background:#7167f8;color:white}.sv-canvas-thumb i{position:absolute;left:50%;top:54%;width:28px;height:28px;border:1px solid #c7d2fe55;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 16px #818cf822}.sv-canvas-thumb i:after{content:"";position:absolute;inset:6px;border-radius:50%;background:#a5b4fc44}.sv-canvas-detail{min-width:0;padding:13px;border:1px solid #ffffff14;border-radius:10px;background:#0a1220}.sv-canvas-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:8px}.sv-canvas-detail-head small{display:block;color:#a5b4fc;font-size:8px;letter-spacing:.12em;margin-bottom:4px}.sv-canvas-detail-head h4{font-size:14px!important;margin:0!important;color:#edf2ff}.sv-canvas-detail-head>span{font-size:9px;color:#a5b4fc;white-space:nowrap}.sv-canvas-purpose{font-size:10px!important;line-height:1.5!important;margin:0 0 10px!important;color:#cbd5e1!important}.sv-canvas-detail-row{display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-top:1px solid #ffffff0d}.sv-canvas-detail-row .sv-concept-icon{width:14px;height:14px;flex-basis:14px;margin-top:1px}.sv-canvas-detail-row p{font-size:10px!important;line-height:1.5!important;margin:0!important;color:#aebbd0!important;flex:1}.sv-canvas-detail-row.voice{margin-top:4px;padding:9px;border:1px solid #ffffff0b;background:#12192a;border-radius:7px}
.sv-canvas-production-panel{display:grid;grid-template-columns:58px minmax(0,1fr);gap:14px;align-items:stretch;margin-top:10px;padding:13px;border:1px solid #ffffff0d;background:linear-gradient(145deg,#121a2b,#0b1220);border-radius:10px}
.sv-canvas-production-icon{display:flex;align-items:center;justify-content:center;border-right:1px solid #38415b;padding-right:13px;color:#928cff}
.sv-canvas-production-icon .sv-concept-icon{width:38px;height:38px;flex-basis:38px;stroke-width:1.5}
.sv-canvas-production-copy{display:grid;gap:13px;align-content:center;min-width:0}
.sv-canvas-production-copy section{min-width:0}
.sv-canvas-production-copy small{display:block;font-size:9px;letter-spacing:.1em;font-weight:700;color:#a5a5ff;margin-bottom:5px}
.sv-canvas-production-copy p{font-size:11px!important;line-height:1.55!important;color:#d0d8e8!important;margin:0!important;overflow-wrap:anywhere}
.sv-canvas-narration-empty{color:#8794aa!important;font-style:italic}
@media(max-width:600px){.sv-canvas-production-panel{grid-template-columns:38px minmax(0,1fr);gap:10px;padding:10px}.sv-canvas-production-icon{padding-right:8px}.sv-canvas-production-icon .sv-concept-icon{width:27px;height:27px;flex-basis:27px}}
.sv-canvas-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:12px;padding-top:11px;border-top:1px solid #ffffff12}.sv-canvas-takeaway{font-size:10px!important;line-height:1.5!important;color:#cbd5e1!important;margin:0!important;flex:1;min-width:180px}.sv-canvas-takeaway strong{color:#a5b4fc;margin-right:6px}.sv-canvas-cta{font-size:10px!important;color:#c7d2fe!important;margin:0!important}.sv-canvas-more{margin-top:10px}
.sv-work-section{border-top:1px solid #273449;margin-top:2px}.sv-work-section[data-work-section="discover"]{border-top:0;margin-top:0}.sv-work-section>summary{list-style:none;display:flex;align-items:center;gap:11px;padding:14px 3px;cursor:pointer;user-select:none}.sv-work-section>summary::-webkit-details-marker{display:none}.sv-work-index{display:grid;place-items:center;flex:0 0 28px;width:28px;height:28px;border:1px solid #3a4560;border-radius:8px;color:#b7b5ff;background:#151a2c;font-size:10px;font-weight:800}.sv-work-section>summary>span:nth-child(2){display:grid;gap:3px;flex:1;min-width:0}.sv-work-section>summary strong{font-size:12px;color:#e2e8f0;font-weight:700}.sv-work-section>summary small{font-size:10px;color:#8ea0b6;line-height:1.4}.sv-work-chevron{display:inline-flex;align-items:center;justify-content:center;flex:0 0 30px;width:30px;height:30px;box-sizing:border-box;border:1px solid #6259c9;border-radius:8px;background:#28245b;color:transparent;font-size:0;line-height:0;padding:0;margin:0;position:relative;transition:border-color .15s,background .15s,box-shadow .15s}.sv-work-chevron:before{content:'';display:block;width:6px;height:6px;border-right:1.5px solid #d5d2ff;border-bottom:1.5px solid #d5d2ff;transform:translateY(-1.5px) rotate(45deg);transition:transform .15s,border-color .15s}.sv-work-section>summary:hover .sv-work-chevron,.sv-work-section>summary:focus-visible .sv-work-chevron{border-color:#8b82ff;background:#373080;color:#fff}.sv-work-section>summary:hover .sv-work-chevron:before,.sv-work-section>summary:focus-visible .sv-work-chevron:before{border-color:#fff}.sv-work-section>summary:focus-visible{outline:none}.sv-work-section>summary:focus-visible .sv-work-chevron{box-shadow:0 0 0 2px #6259c955}.sv-work-section[open]>summary .sv-work-chevron:before{transform:translateY(1.5px) rotate(225deg)}.sv-work-section-content{padding:0 2px 15px}.sv-work-section-content>.sv-accordion-intro{margin-top:0}.sv-work-refine{margin-top:8px}.sv-work-refine>summary{justify-content:center;text-align:center;position:relative}.sv-work-refine>summary>.sv-work-index{position:absolute;left:3px}.sv-work-refine>summary>.sv-work-chevron{position:absolute;right:3px}.sv-work-refine>summary>span:nth-child(2){text-align:center}.sv-work-refine .sv-work-section-content{padding-bottom:0}.sv-work-refine .sv-refine-panel{margin-top:0;border:0;border-top:1px solid #273449;border-radius:0;padding:14px 0 4px;background:transparent}
.sv-refine-panel{margin-top:14px;padding:15px;border:1px solid #34375f;border-radius:11px;background:linear-gradient(145deg,#111a2b,#0a1220);display:grid;gap:9px}.sv-refine-heading{display:flex;align-items:center;gap:10px}.sv-refine-heading>div{display:grid;gap:3px}.sv-refine-heading strong{font-size:12px;color:#eef2ff}.sv-refine-heading small{font-size:10px;color:#aebbd0;line-height:1.5}.sv-refine-spark{display:grid;place-items:center;width:30px;height:30px;border:1px solid #7c73ff55;background:#262450;border-radius:9px;color:#c7c5ff;font-size:19px}.sv-refine-panel label{font-size:10px;color:#c7d2fe}.sv-refine-panel select,.sv-refine-panel textarea{box-sizing:border-box;width:100%;min-width:0;border:1px solid #29354a;border-radius:8px;background:#080f1c;color:#e2e8f0;padding:10px;font:inherit;font-size:11px;outline:none}.sv-refine-panel textarea{resize:vertical;line-height:1.55}.sv-refine-panel select:focus,.sv-refine-panel textarea:focus{border-color:#8178ff}.sv-refine-scene-wrap{display:grid;gap:6px}.sv-refine-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}.sv-refine-actions>span{font-size:9px;color:#93a4bc}.sv-refine-actions .sv-btn{padding:9px 12px;font-size:10px}.sv-refine-undo{justify-self:start;border:0;background:none;color:#b7b5ff;font-size:10px;padding:4px 0;cursor:pointer}.sv-refine-undo:hover{text-decoration:underline}
@media(max-width:900px){.sv-canvas-layout{grid-template-columns:1fr}.sv-canvas-preview{min-height:250px}.sv-canvas-side{grid-template-rows:auto auto}}@media(max-width:600px){.sv-discovery-result.sv-creative-canvas{padding:11px!important}.sv-canvas-meta{justify-content:flex-start}.sv-canvas-meta span{padding:6px}.sv-canvas-style p{min-width:100%}.sv-canvas-preview{min-height:220px;padding:10px}.sv-canvas-rail{gap:4px}.sv-canvas-thumb b{left:3px;top:3px;width:17px;height:17px}.sv-canvas-detail{padding:10px}}
@media(max-width:700px){.sv-concept-scenes{grid-template-columns:1fr}.sv-concept-meta{grid-template-columns:1fr 1fr}.sv-concept-bottom{grid-template-columns:1fr}.sv-discovery-result{padding:13px}}.sv-discovery-result h3{font-size:19px;margin:6px 0 8px;color:#f2f5ff}.sv-discovery-result h4{font-size:11px;margin:17px 0 7px;color:#c7d2fe}.sv-discovery-result p,.sv-discovery-result li{font-size:11px;line-height:1.65;color:#aebbd0}.sv-concept-logline{font-size:13px!important;color:#e0e7ff!important}.sv-concept-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:14px 0}.sv-concept-grid>div{padding:10px;border:1px solid #ffffff12;border-radius:8px;background:#0b1422;min-width:0}.sv-concept-grid small{display:block;color:#8795bd;font-size:8px;letter-spacing:.1em;margin-bottom:5px}.sv-concept-grid strong{font-size:10px;line-height:1.5;overflow-wrap:anywhere}.sv-concept-scenes{display:grid;gap:8px}.sv-concept-scene{padding:11px;border:1px solid #ffffff12;background:#0a1321;border-radius:9px}.sv-concept-scene-head{display:flex;justify-content:space-between;gap:8px;align-items:start}.sv-concept-scene-head strong{font-size:11px}.sv-concept-scene-head span{white-space:nowrap;color:#a5b4fc;font-size:9px}.sv-concept-scene p{margin:7px 0 0}.sv-concept-scene b{color:#d9e2f4}.
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
    .sv-brand-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding-top:18px}
    .sv-brand-upload{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:16px;border:1px dashed #6366F188;border-radius:10px;background:#0a1220;color:#e5edf8;cursor:pointer;min-height:132px}
    .sv-brand-upload:hover{background:#14152c;border-color:#818CF8}
    .sv-brand-upload input[type=file]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
    .sv-brand-upload-icon{display:grid;place-items:center;width:28px;height:28px;border-radius:7px;background:#242454;color:#A5B4FC;font-size:18px}
    .sv-brand-upload strong{font-size:12px}.sv-brand-upload small,.sv-brand-file{font-size:10px;color:#8294aa;overflow-wrap:anywhere}
    .sv-brand-preview{display:flex;align-items:center;gap:12px;padding:12px;margin-top:14px;border:1px solid #ffffff12;border-radius:9px;background:#080e18}
    .sv-brand-preview[hidden]{display:none!important}.sv-brand-preview img{max-width:180px;max-height:76px;object-fit:contain}.sv-brand-preview span{font-size:10px;color:#8294aa}
    .sv-brand-grid input[type=color]{height:40px;padding:4px;cursor:pointer}
    @media(max-width:700px){.sv-brand-grid{grid-template-columns:1fr}}
    .sv-accordion-head{width:100%;display:flex;align-items:center;gap:12px;padding:17px 22px;border:0;background:transparent;color:#e5edf8;text-align:left;cursor:pointer}
    .sv-accordion-head:hover{background:#ffffff04}
    .sv-accordion-number{width:34px;height:34px;display:grid;place-items:center;flex:none;border-radius:9px;background:#242454;color:#A5B4FC;font-size:11px;font-weight:800}
    .sv-accordion-title{display:grid;gap:4px;flex:1;min-width:0}
    .sv-accordion-title strong{font-size:14px;font-weight:700}
    .sv-accordion-title small{font-size:11px;color:#8294aa;font-weight:400}
    .sv-accordion-state{font-size:10px;color:#91a4b8;padding:5px 8px;border:1px solid #ffffff12;border-radius:7px;background:#0a1422;white-space:nowrap}
    .sv-accordion-state.complete{color:#67e8c5;border-color:#22665b;background:#102822}
    .sv-accordion-chevron{display:inline-flex;align-items:center;justify-content:center;min-width:70px;padding:6px 0;box-sizing:border-box;font-size:0;line-height:1;color:#a5b4fc;text-align:right;white-space:nowrap}.sv-accordion-head[aria-expanded="true"] .sv-accordion-chevron:after{content:"Collapse ↑";font-size:11px;font-weight:600;letter-spacing:.01em}.sv-accordion-head[aria-expanded="false"] .sv-accordion-chevron:after{content:"Expand ↓";font-size:11px;font-weight:600;letter-spacing:.01em}.sv-accordion-head:hover .sv-accordion-chevron:after{color:#c7c5ff}.sv-accordion-head:focus-visible .sv-accordion-chevron{outline:1px solid #6259c9;outline-offset:3px;border-radius:4px}
    .sv-accordion-body{padding:0 22px 20px;border-top:1px solid #ffffff0c}
    /* Consistent compact label/control rows across all setup panels */
    .sv-setup-grid .sv-field,.sv-brand-grid .sv-field{grid-template-columns:155px minmax(0,1fr);align-items:start;column-gap:12px}
    .sv-setup-grid .sv-field>span,.sv-brand-grid .sv-field>span,.sv-setup-grid .sv-field>label,.sv-brand-grid .sv-field>label{grid-column:1;grid-row:1;text-align:right;align-self:center;padding-top:10px}
    .sv-setup-grid .sv-field>input,.sv-setup-grid .sv-field>textarea,.sv-setup-grid .sv-field>select,.sv-brand-grid .sv-field>input,.sv-brand-grid .sv-field>textarea,.sv-brand-grid .sv-field>select{grid-column:2;grid-row:1}
    .sv-setup-grid .sv-field-wide,.sv-brand-grid .sv-field-wide{grid-column:1/-1}
    .sv-brand-grid .sv-field-wide .sv-accordion-intro{grid-column:2}
    @media(max-width:700px){
      .sv-setup-grid .sv-field,.sv-brand-grid .sv-field{grid-template-columns:112px minmax(0,1fr);column-gap:9px}
      .sv-setup-grid .sv-field>span,.sv-brand-grid .sv-field>span,.sv-setup-grid .sv-field>label,.sv-brand-grid .sv-field>label{font-size:9px;letter-spacing:.04em}
    }

    .sv-discovery .sv-accordion-intro{margin:28px 0 30px;line-height:1.8}.sv-discovery .sv-accordion-intro sup{font-size:.65em;vertical-align:super;letter-spacing:0}
    .sv-discovery-mode small{font-weight:400;letter-spacing:normal}
    .sv-discovery-modes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:8px 0 4px}
    .sv-discovery-mode{display:grid;grid-template-columns:32px minmax(0,1fr);column-gap:10px;align-items:start;text-align:left;padding:15px;border:1px solid #ffffff16;border-radius:12px;background:#0a1220;color:#e5edf8;cursor:pointer}
    .sv-discovery-mode.active{border-color:#818CF8;background:linear-gradient(135deg,#171936,#0b1220);box-shadow:inset 0 0 0 1px #6366F122}
    .sv-discovery-mode-icon{grid-row:1/3;display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:#242454;color:#C7D2FE;font-size:17px}
    .sv-discovery-mode strong{font-size:12px;line-height:1.5}.sv-discovery-mode small{font-size:10px;color:#8294aa;line-height:1.6;margin-top:4px}
    .sv-discovery-fields{margin-top:10px}
    .sv-discovery-upload{position:relative;grid-column:1/-1;display:grid;min-width:0;width:100%;box-sizing:border-box;gap:9px;border:1px dashed #6366F188;border-radius:9px;padding:13px;background:#0a1220;color:#A5B4FC;cursor:pointer;font-size:11px;font-weight:400;letter-spacing:normal;line-height:1.5}.sv-discovery-upload span{font-weight:400;letter-spacing:normal;overflow-wrap:anywhere}.sv-discovery-upload .sv-upload-button{display:inline-flex;align-items:center;justify-content:center;justify-self:start;padding:9px 14px;border:1px solid #7774ff;border-radius:8px;background:linear-gradient(135deg,#5148e5,#655cf6);color:#fff;font-size:11px;font-weight:600;letter-spacing:normal;line-height:1.2;box-shadow:0 3px 10px #5148e522}.sv-discovery-upload .sv-upload-button:hover{background:linear-gradient(135deg,#6259f2,#7770ff)}.sv-discovery-upload>span:not(.sv-upload-button),.sv-discovery-upload>small{justify-self:start;text-align:left;align-self:start;width:100%}.sv-discovery-upload{align-content:start;justify-items:start}.sv-discovery-upload input{position:absolute;inset:0;width:100%;height:100%;min-width:0;max-width:100%;box-sizing:border-box;opacity:0;cursor:pointer;z-index:2}.sv-discovery-fields .sv-field-wide{min-width:0}.sv-discovery-fields .sv-discovery-upload-field{grid-column:1/-1;display:block;width:100%;min-width:0}.sv-discovery-upload-field .sv-discovery-upload{display:grid;width:100%;grid-column:1;max-width:100%}.sv-discovery-upload-field>span{display:block;margin-bottom:8px;text-align:left;width:100%;justify-self:start}.sv-discovery-fields .sv-discovery-upload-field>span{grid-column:1/-1!important;justify-self:stretch!important;text-align:left!important;margin-left:0!important;margin-right:0!important;padding-left:0!important;width:100%!important;display:block!important;float:none!important}
    .sv-discovery-upload input{width:100%;font-size:10px;color:#91a4b8}
    .sv-discovery-upload small{color:#8294aa;overflow-wrap:anywhere;font-weight:400;letter-spacing:normal}
    .sv-discovery-help{margin-top:12px;padding:11px 13px;border-radius:9px;background:#0a1220;border:1px solid #ffffff0c;color:#91a4b8;font-size:10px;line-height:1.6}
    .sv-discovery-result{margin-top:16px;padding:16px;border:1px solid #6366F155;border-radius:12px;background:linear-gradient(145deg,#14152c,#080e18);color:#dbe7f6;font-size:12px;line-height:1.7}
    .sv-discovery-result h3{font-size:15px;margin:0 0 8px;color:#eef2ff}.sv-discovery-result p{margin:7px 0;color:#a9b8cc}.sv-discovery-result ul{margin:8px 0;padding-left:19px;color:#a9b8cc}.sv-discovery-result li{margin:4px 0}
    .sv-discovery-result .sv-draft-note{padding:9px 11px;border-radius:8px;background:#241f12;border:1px solid #8a6d2d55;color:#e9d5a2;font-size:10px;margin-top:12px}
    .sv-discovery-result-actions{justify-content:space-between}
    @media(max-width:700px){.sv-discovery-modes{grid-template-columns:1fr}.sv-discovery-upload{grid-column:1}.sv-discovery-result{padding:13px}}
    .sv-accordion-body[hidden]{display:none!important}
    .sv-setup-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding-top:18px}
    .sv-field-wide{grid-column:1/-1}
    .sv-field>span{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8196ad}
    .sv-accordion-intro{color:#91a4b8;font-size:12px;line-height:1.7;margin:18px 0}
    .sv-accordion-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;flex-wrap:wrap}
    .sv-setup-note{font-size:10px;color:#71859c}
    .sv-accordion-body>.sv-scenes{padding:14px 0!important}
    .sv-accordion-body>div[style]{padding-left:0!important;padding-right:0!important}
    @media(max-width:700px){.sv-accordion-head{padding:14px}.sv-accordion-body{padding:0 14px 15px}.sv-accordion-title strong{font-size:12px}.sv-accordion-title small{font-size:10px}.sv-accordion-state{display:none}.sv-setup-grid{grid-template-columns:1fr}.sv-field-wide{grid-column:auto}}
    /* Hide the right-side preview and settings panels for the simplified storyboard layout */
    .sv-main{grid-template-columns:minmax(0,1fr)!important}
    .sv-right{display:none!important}
    /* Compose-inspired spacious panel sizing */
    /* Match Compose's content alignment: start close to the sidebar, not centered in a narrow column */
    main.workspace:has(> #studioPlaceholder:not([hidden]) .sv-video){display:block;grid-template-columns:minmax(0,1fr);max-width:none;width:100%;margin:0;padding:26px 38px}
    #studioPlaceholder:not([hidden]):has(.sv-video){display:block;width:100%;max-width:none;margin:0;padding:0;justify-self:stretch}
    .sv-video{width:100%;max-width:none;margin:0}
    .sv-video{gap:20px}
    .sv-card{border-radius:20px}
    .sv-vhead{padding:24px 28px;gap:20px;text-align:left}
    .sv-vhead>div:first-child{margin-right:auto;text-align:left;align-self:flex-start}
    .sv-vhead h2,.sv-vhead p,.sv-vhead .sv-eyebrow{text-align:left}
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
        <section class="sv-card" data-video-header-panel>
          <div class="sv-vhead"><div><div class="sv-eyebrow">VIDEO</div><h2>Bring your story to life</h2><p>Plan, create and direct every scene. You direct &amp; SvaraFlow coordinates the work.</p></div>
            
          </div>
          <div class="sv-workflow" aria-label="Video workflow">

          <div class="sv-workflow-label">YOUR CREATIVE WORKFLOW</div>
          <nav class="sv-workflow-rail" data-workflow-rail aria-label="Workflow stages">
            <button class="sv-workflow-step active" type="button" data-workflow-step="0" aria-current="step"><span class="sv-workflow-dot">1</span><strong>Story &amp; Concept</strong></button>
            <button class="sv-workflow-step" type="button" data-workflow-step="1" disabled><span class="sv-workflow-dot">2</span><strong>Branding</strong></button>
            <button class="sv-workflow-step" type="button" data-workflow-step="2" disabled><span class="sv-workflow-dot">3</span><strong>Characters</strong></button>
            <button class="sv-workflow-step" type="button" data-workflow-step="3" disabled><span class="sv-workflow-dot">4</span><strong>Environments</strong></button>
            <button class="sv-workflow-step" type="button" data-workflow-step="4" disabled><span class="sv-workflow-dot">5</span><strong>Visual Style</strong></button>
            <button class="sv-workflow-step" type="button" data-workflow-step="5" disabled><span class="sv-workflow-dot">6</span><strong>Storyboard</strong></button>
            <button class="sv-workflow-step" type="button" data-workflow-step="6" disabled><span class="sv-workflow-dot">7</span><strong>Production</strong></button>
          </nav>
          </div>
        </section>
        <section class="sv-card sv-projects-panel" data-video-projects-panel>
          <div class="sv-vhead"><div><div class="sv-eyebrow">YOUR WORK</div><h2>My Video Projects</h2><p>Open a saved draft or remove a project you no longer need.</p></div><div class="sv-actions"><button class="sv-btn" type="button" data-projects-refresh>Refresh list</button></div></div>
          <div class="sv-projects-list" data-projects-list aria-live="polite"><div class="sv-status">Loading your saved projects…</div></div>
        </section>
        <section class="sv-card sv-accordion sv-discovery" data-accordion="story">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="story" aria-expanded="false"><span class="sv-accordion-number">01</span><span class="sv-accordion-title"><strong>Creative Discovery</strong><small>Start with an idea. SvaraFlow<sup>™</sup> helps shape the video.</small></span><span class="sv-accordion-state" data-accordion-state="story">Ready to explore</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="story" hidden>
            <details class="sv-work-section" data-work-section="discover" open><summary><span class="sv-work-index">A</span><span><strong>Discover your idea</strong><small>Set your goal, audience and references.</small></span><span class="sv-work-chevron">⌄</span></summary><div class="sv-work-section-content">
            <p class="sv-accordion-intro">You don't need a finished script or a detailed brief. Tell SvaraFlow<sup>™</sup> what you're trying to achieve, and we'll help you discover the story, format and visual direction.</p>
            <div class="sv-discovery-modes" role="group" aria-label="Choose how to start">
              <button type="button" class="sv-discovery-mode active" data-discovery-mode="discover" aria-pressed="true"><span class="sv-discovery-mode-icon">✧</span><strong>Help me develop my idea</strong><small>Start with a goal, even if the details aren't clear yet.</small></button>
              <button type="button" class="sv-discovery-mode" data-discovery-mode="brief" aria-pressed="false"><span class="sv-discovery-mode-icon">▤</span><strong>I already have a brief</strong><small>Add the material you already have. SvaraFlow<sup>™</sup> can organise your brief, identify gaps and help turn it into a clear creative direction.</small></button>
            </div>
            <div class="sv-setup-grid sv-discovery-fields">
              <label class="sv-field sv-field-wide"><span>What are you trying to achieve?</span><textarea data-discovery-field="idea" rows="4" placeholder="e.g. I need a video to explain what my platform does."></textarea></label>
              <label class="sv-field sv-field-wide"><span>Website or product link <small>(optional)</small></span><input type="url" data-discovery-field="url" placeholder="https://your-platform.com"></label>
              <label class="sv-field"><span>Who is it for? <small>(optional)</small></span><select data-discovery-field="audience"><option value="">Help me decide</option><option>Potential customers</option><option>Existing customers</option><option>Investors or business partners</option><option>Employees or internal teams</option><option>General audience</option><option>Children or young people</option><option>Parents or families</option><option>Business decision-makers</option><option>Developers or technical users</option><option>Students or educators</option><option>Community or non-profit audience</option><option>Government or public sector</option><option>Specific industry or profession</option><option>Internal stakeholders</option><option>Other / multiple audiences</option></select></label>
              <label class="sv-field"><span>What should it do? <small>(optional)</small></span><select data-discovery-field="goal"><option value="">Recommend a goal</option><option>Explain how something works</option><option>Introduce or launch a product</option><option>Encourage sign-ups or sales</option><option>Tell a story or build awareness</option><option>Train or educate</option><option>Demonstrate a product or feature</option><option>Onboard new users</option><option>Provide instructions or a tutorial</option><option>Build trust or explain credibility</option><option>Recruit or attract talent</option><option>Fundraise or attract investment</option><option>Share a customer story or testimonial</option><option>Announce news or an update</option><option>Promote an event</option><option>Raise awareness for a cause</option><option>Entertain or inspire</option><option>Explain a complex topic</option><option>Other / multiple objectives</option></select></label>
              <div class="sv-field sv-field-wide sv-discovery-upload-field"><span>Reference files <small>(optional)</small></span><label class="sv-discovery-upload"><input type="file" data-discovery-files multiple accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.png,.jpg,.jpeg,.webp" aria-label="Choose reference files"><span class="sv-upload-button">Choose files</span><span>＋ Add a script, brief, presentation or reference images</span><small data-discovery-file-names>No files selected</small></label></div>
            </div>
            <div class="sv-discovery-help"><span>Not sure about the audience or goal? Leave them blank. Discovery will help you decide. You stay in control. Nothing is final until you approve the concept.</span></div>
            <div class="sv-accordion-foot"><span class="sv-setup-note"></span><button class="sv-btn primary" type="button" data-discovery-submit>Shape my idea <span aria-hidden="true">→</span></button></div></div></details>
            <details class="sv-work-section" data-work-section="concept" hidden><summary><span class="sv-work-index">B</span><span><strong>Creative concept</strong><small>Review the direction and scene previews.</small></span><span class="sv-work-chevron">⌄</span></summary><div class="sv-work-section-content">
            <div class="sv-discovery-result" data-discovery-result hidden aria-live="polite"></div>
            <div class="sv-accordion-foot sv-discovery-result-actions" data-discovery-actions hidden><span class="sv-setup-note" data-discovery-result-note>AI concept draft · references are not yet analysed.</span><div class="sv-discovery-action-buttons"><button class="sv-btn" type="button" data-discovery-edit-preserve>Edit my answers</button><button class="sv-btn" type="button" data-discovery-edit>Generate a new idea</button><button class="sv-btn primary" type="button" data-discovery-approve>Approve concept &amp; create storyboard →</button></div></div></div></details>
          </div>
        </section>
        <section class="sv-card sv-accordion" data-accordion="branding">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="branding" aria-expanded="false"><span class="sv-accordion-number">02</span><span class="sv-accordion-title"><strong>Branding</strong><small>Logos, brand colours, fonts and visual assets</small></span><span class="sv-accordion-state" data-accordion-state="branding">Not started</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="branding" hidden>
            <p class="sv-accordion-intro">Upload your brand assets so scenes can reflect your identity. These selections are currently held in this workspace only; persistent storage and automatic application to generated scenes will be connected in a later phase.</p>
            <div class="sv-brand-grid">
              <label class="sv-brand-upload"><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-brand-upload="logo"><span class="sv-brand-upload-icon">＋</span><strong>Logo</strong><small>PNG, JPG, WebP or SVG</small><span class="sv-brand-file" data-brand-file="logo">No logo uploaded</span></label>
              <label class="sv-brand-upload"><input type="file" accept="image/png,image/jpeg,image/webp" data-brand-upload="reference"><span class="sv-brand-upload-icon">＋</span><strong>Brand imagery</strong><small>Campaign images or visual references</small><span class="sv-brand-file" data-brand-file="reference">No imagery uploaded</span></label>
              <label class="sv-field"><span>Primary brand colour</span><input type="color" value="#6366F1" data-project-field="brandPrimary"></label>
              <label class="sv-field"><span>Secondary brand colour</span><input type="color" value="#818CF8" data-project-field="brandSecondary"></label>
              <label class="sv-field"><span>Brand font / typography notes</span><input data-project-field="brandFont" placeholder="e.g. Inter, bold geometric sans"></label>
              <label class="sv-field sv-field-wide"><span>Logo placement preference</span><select data-project-field="logoPlacement"><option value="as-needed">Choose per scene</option><option value="mascot-clothing">On mascot clothing or uniform</option><option value="mascot-accessory">As a mascot accessory or badge</option><option value="mascot-prop">On a prop the mascot holds or uses</option><option value="environment">On a sign or environment element</option><option value="end-card">End card / closing frame</option><option value="overlay">Clean graphic overlay in the final video</option></select></label>
              <p class="sv-accordion-intro sv-field-wide">For a logo on a mascot, choose the intended placement here and describe the character-specific details in Characters &amp; Mascots. For accurate brand marks, SvaraONE should preserve the uploaded logo as a separate reference/graphic and apply it deliberately, rather than relying on the video model to redraw it.</p>
              <label class="sv-field"><span>Brand guidelines / notes</span><textarea data-project-field="brandNotes" rows="2" placeholder="Logo usage, clear space, tone, do's and don'ts..."></textarea></label>
            </div>
            <div class="sv-brand-preview" data-brand-preview hidden><img data-brand-logo-preview alt="Uploaded brand logo preview"><span>Logo preview</span></div>
            <div class="sv-accordion-foot"><span class="sv-setup-note">Brand assets can later be reused across scenes and exports.</span><div class="sv-workflow-actions"><button class="sv-btn primary" type="button" data-section-review="branding">Approve &amp; continue →</button> <button class="sv-btn skip" type="button" data-workflow-skip="branding">Skip branding</button></div></div>
          </div>
        </section>
        <section class="sv-card sv-accordion" data-accordion="characters">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="characters" aria-expanded="false"><span class="sv-accordion-number">03</span><span class="sv-accordion-title"><strong>Characters &amp; Mascots</strong><small>Reusable character identity and references</small></span><span class="sv-accordion-state" data-accordion-state="characters">Not started</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="characters" hidden>
            <p class="sv-accordion-intro">Create or select the main characters and mascots. Approved references can be reused across scenes to help maintain visual continuity.</p>
            <div class="sv-asset-placeholder"><strong>Character library · planned</strong><br>Reusable character references, identity notes and approved looks will live here.</div>
            <div class="sv-accordion-foot"><span class="sv-setup-note">Character assets will be connected in a later phase.</span><div class="sv-workflow-actions"><button class="sv-btn primary" type="button" data-section-review="characters">Approve &amp; continue →</button></div></div>
          </div>
        </section>
        <section class="sv-card sv-accordion" data-accordion="environment">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="environment" aria-expanded="false"><span class="sv-accordion-number">04</span><span class="sv-accordion-title"><strong>Environments</strong><small>Locations, backgrounds, lighting and atmosphere</small></span><span class="sv-accordion-state" data-accordion-state="environment">Not started</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="environment" hidden>
            <p class="sv-accordion-intro">Define the places and settings where your story takes place. Reuse approved environment references across scenes.</p>
            <div class="sv-asset-placeholder"><strong>Environment library · planned</strong><br>Locations, background references and lighting setups will live here.</div>
            <div class="sv-accordion-foot"><span class="sv-setup-note">Environment assets will be connected in a later phase.</span><div class="sv-workflow-actions"><button class="sv-btn primary" type="button" data-section-review="environment">Approve &amp; continue →</button></div></div>
          </div>
        </section>
        <section class="sv-card sv-accordion" data-accordion="style">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="style" aria-expanded="false"><span class="sv-accordion-number">05</span><span class="sv-accordion-title"><strong>Visual Style</strong><small>Look, palette, mood and cinematic direction</small></span><span class="sv-accordion-state" data-accordion-state="style">Not started</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="style" hidden>
            <div class="sv-setup-grid">
              <label class="sv-field"><span>Visual direction</span><select data-project-field="visualStyle"><option value="">Choose a visual style</option><option>Cinematic realism</option><option>3D animation</option><option>Stylised illustration</option><option>Anime</option><option>Mixed media</option></select></label>
              <label class="sv-field"><span>Colour palette</span><input data-project-field="palette" placeholder="e.g. midnight blue, violet, warm gold"></label>
              <label class="sv-field sv-field-wide"><span>Visual notes</span><textarea data-project-field="visualNotes" rows="2" placeholder="Lighting, camera language, texture and mood..."></textarea></label>
            </div>
            <div class="sv-accordion-foot"><span class="sv-setup-note">You can change the visual direction later.</span><div class="sv-workflow-actions"><button class="sv-btn primary" type="button" data-section-review="style">Approve &amp; continue →</button></div></div>
          </div>
        </section>
        <section class="sv-card sv-accordion" data-accordion="storyboard">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="storyboard" aria-expanded="false"><span class="sv-accordion-number">06</span><span class="sv-accordion-title"><strong>Storyboard &amp; Concept Reel</strong><small>Your scenes, shots and camera direction</small></span><span class="sv-accordion-state" data-accordion-state="storyboard">0 scenes</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="storyboard" hidden>
            <span class="sv-hidden" data-count>(0)</span>
            <div class="sv-scenes" data-scenes style="padding:10px"></div>
            <div style="padding:0 10px 10px"><button class="sv-add" data-action="add">＋ Add New Scene</button></div>
          </div>
        </section>
        <section class="sv-card sv-accordion" data-accordion="production">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="production" aria-expanded="false"><span class="sv-accordion-number">07</span><span class="sv-accordion-title"><strong>Generate &amp; Assemble</strong><small>Generate, review, edit and export</small></span><span class="sv-accordion-state">Planned</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="production" hidden>
            <p class="sv-accordion-intro">Once your scenes are ready, generate clips, review results, and assemble the finished production with dialogue, music, sound effects and transitions.</p>
            <div class="sv-asset-row"><div class="sv-asset-icon">▣</div><div class="sv-asset-copy"><strong>Video scenes</strong><small>Scene clips, approvals and transitions · planned</small></div><span class="sv-chip">Future phase</span></div>
            <div class="sv-asset-row"><div class="sv-asset-icon">♫</div><div class="sv-asset-copy"><strong>Voice, music &amp; sound</strong><small>Audio lanes, sync controls and export · planned</small></div><span class="sv-chip">Future phase</span></div>
            <div class="sv-accordion-foot"><span class="sv-setup-note">Production tools will become available as the generation pipeline is implemented.</span><button class="sv-btn primary" type="button" data-section-review="production">Mark stage reviewed</button></div>
          </div>
        </section>
        <div class="sv-hidden" aria-hidden="true"><div class="sv-right"><section class="sv-card sv-preview"><div class="sv-preview-head"><strong>Scene Preview</strong><span class="sv-chip" data-preview-state>Baseline needed</span></div><div class="sv-preview-stage" data-preview><div class="sv-preview-placeholder"><b>▶</b><span>Add a scene to see its preview here.</span></div></div><div class="sv-status" style="margin-top:10px" data-global-status role="status">UI foundation ready. Generation remains scene-by-scene.</div></section><section class="sv-card"><div class="sv-tabs" role="tablist"><button class="active" data-tab="settings">Scene Settings</button><button data-tab="assets">Assets</button><button data-tab="prompt">Prompt</button><button data-tab="advanced">Advanced</button></div><div class="sv-settings" data-settings></div></section></div></div>
      </div>`;
    const scenesNode=root.querySelector('[data-scenes]');
    const settingsNode=root.querySelector('[data-settings]');
    const preview=root.querySelector('[data-preview]');
    const globalStatus=root.querySelector('[data-global-status]');
    const previewState=root.querySelector('[data-preview-state]');
    let scenes=seedScenes(), selectedId=null, tab='settings', mode='director', reorder=false, modal=null;
    let discoveryConcept=null;
    const discoveryHistory=[];
    let refinementBusy=false;
    const projectReviewed={story:false,characters:false,branding:false,environment:false,style:false};
    const brandFiles={logo:null,reference:null};
    const selected=()=>scenes.find(s=>s.id===selectedId)||null;
    const setStatus=(message,type='')=>{globalStatus.textContent=message;globalStatus.className='sv-status'+(type?' '+type:'');};
    const renderScenes=()=>{
      root.querySelector('[data-count]').textContent='('+scenes.length+')';
      const storyboardState=root.querySelector('[data-accordion-state="storyboard"]');if(storyboardState)storyboardState.textContent=scenes.length+' scene'+(scenes.length===1?'':'s');
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
    const renderDiscoveryConcept=(c,result)=>{
      // Replace the prior refinement section before rebuilding the concept; never accumulate C sections.
      const existingRefineHost=root.querySelector('[data-refine-section-host]');
      if(existingRefineHost)existingRefineHost.querySelectorAll('[data-work-section="refine"]').forEach(section=>section.remove());
      const iconPaths={
        format:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6"/>',
        time:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        audience:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/>',
        goal:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
        visual:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
        camera:'<rect x="3" y="7" width="12" height="10" rx="2"/><path d="m15 10 6-3v10l-6-3z"/><path d="M6 4h6"/>',
        voice:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8"/>',
        question:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.8c-1.2 1.1-1.9 1.4-1.9 3M12 17h.01"/>',
        idea:'<path d="M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1 .8-1.5 1.7-1.5 2h-5c0-.3-.5-1.2-1.5-2z"/>'
      };
      const ico=(name)=>'<svg class="sv-concept-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(iconPaths[name]||iconPaths.idea)+'</svg>';
      const list=items=>items.map(item=>'<li>'+esc(item)+'</li>').join('');
      const scenesMarkup=c.sceneOutline.map((scene,index)=>'<button type="button" class="sv-canvas-thumb '+(index===0?'active':'')+'" data-concept-scene-select="'+index+'" aria-label="Show scene '+(index+1)+': '+esc(scene.title)+'" aria-pressed="'+(index===0?'true':'false')+'"><b>'+String(index+1).padStart(2,'0')+'</b><i aria-hidden="true"></i></button>').join('');
      const sceneDetail=(scene,index)=>'<div class="sv-canvas-detail-head"><div><small>SCENE '+String(index+1).padStart(2,'0')+'</small><h4>'+esc(scene.title)+'</h4></div><span>'+esc(scene.durationSeconds)+' sec</span></div>'+(scene.purpose?'<p class="sv-canvas-purpose">'+esc(scene.purpose)+'</p>':'')+'<div class="sv-canvas-production-panel"><div class="sv-canvas-production-icon">'+ico('camera')+'</div><div class="sv-canvas-production-copy"><section><small>CAMERA</small><p>'+esc(scene.cameraDirection)+'</p></section><section><small>NARRATION</small><p class="'+(scene.narration?'':'sv-canvas-narration-empty')+'">'+esc(scene.narration||'No narration for this scene')+'</p></section></div></div>';
      result.classList.add('sv-creative-canvas');
      const discoverSection=root.querySelector('[data-work-section="discover"]'),conceptSection=root.querySelector('[data-work-section="concept"]'),storyBody=root.querySelector('[data-accordion-body="story"]');
      result.innerHTML='<div class="sv-canvas-top"><div class="sv-canvas-title"><div class="sv-concept-kicker">SVARAFLOW™ <span>·</span> YOUR VIDEO IDEA</div><h3>'+esc(c.title)+'</h3><p class="sv-concept-logline">'+esc(c.logline)+'</p></div><div class="sv-canvas-meta"><span>'+ico('time')+esc(c.durationSeconds)+' sec</span><span>'+ico('format')+esc(c.recommendedFormat)+'</span><span>'+ico('audience')+esc(c.audience)+'</span></div></div><div class="sv-canvas-style"><p>'+esc(c.creativeDirection)+'</p><span>'+esc(c.visualStyle)+'</span><span>'+esc(c.tone)+'</span></div><div class="sv-canvas-layout"><section class="sv-canvas-preview" aria-label="Selected scene visual preview"><div class="sv-canvas-preview-top"><span data-canvas-scene-index>SCENE 01</span><span data-canvas-duration>'+esc(c.sceneOutline[0]?.durationSeconds||0)+' sec</span></div><div class="sv-canvas-preview-art"><div class="sv-canvas-orbit" aria-hidden="true"></div><div><div class="sv-canvas-art-symbol" aria-hidden="true">✧</div><div class="sv-canvas-art-copy"><small>Visual preview</small><span data-canvas-visual>'+esc(c.sceneOutline[0]?.visualDescription||'Your scene preview will appear here.')+'</span></div></div></div><div class="sv-canvas-preview-bottom"><span>Concept frame · not generated</span><span>'+esc(c.recommendedFormat)+'</span></div></section><section class="sv-canvas-side"><div class="sv-canvas-rail" role="group" aria-label="Choose a scene">'+scenesMarkup+'</div><div class="sv-canvas-detail" data-canvas-detail>'+sceneDetail(c.sceneOutline[0],0)+'</div></section></div><div class="sv-canvas-footer"><p class="sv-canvas-takeaway"><strong>THE IDEA</strong>'+esc(c.keyMessage)+'</p><p class="sv-canvas-cta">'+esc(c.callToAction)+'</p></div><details class="sv-concept-more sv-canvas-more"><summary>'+ico('question')+' Questions &amp; assumptions</summary><div><strong>Worth deciding</strong><ul>'+list(c.openQuestions)+'</ul><strong>Assumptions made</strong><ul>'+list(c.assumptions)+'</ul></div></details><div class="sv-draft-note">Concept for your review. Reference files and URLs have not been analysed; scene imagery is illustrative UI only. No images or video have been generated.</div><details class="sv-work-section sv-work-refine" data-work-section="refine" hidden><summary><span class="sv-work-index">C</span><span><strong>Refine with SvaraFlow</strong><small>Fine-tune the concept before approval.</small></span><span class="sv-work-chevron">⌄</span></summary><div class="sv-work-section-content"><section class="sv-refine-panel"><label>What would you like to refine?</label><select data-refine-scope><option value="whole">Overall concept</option><option value="scene">One specific scene</option><option value="visuals">Visual style &amp; camera direction</option><option value="narration">Narration &amp; messaging</option></select><label class="sv-refine-scene-wrap" data-refine-scene-wrap hidden>Scene to refine<select data-refine-scene>'+c.sceneOutline.map((scene,index)=>'<option value="'+index+'">Scene '+(index+1)+' — '+esc(scene.title)+'</option>').join('')+'</select></label><textarea data-refine-request rows="2" maxlength="1200" placeholder="e.g. Keep the story, but make the ending more emotional…"></textarea><div class="sv-refine-actions"><span data-refine-status aria-live="polite"></span><button class="sv-btn primary" type="button" data-refine-submit>Refine concept →</button></div>'+(discoveryHistory.length?'<button class="sv-refine-undo" type="button" data-refine-undo>↶ Undo last refinement</button>':'')+'</section></div></details>';
      // Run this only after result.innerHTML exists: C is created by that markup.
      const refineSection=result.querySelector('[data-work-section="refine"]');
      if(refineSection&&storyBody){
        let host=storyBody.querySelector('[data-refine-section-host]');
        if(!host){host=document.createElement('div');host.dataset.refineSectionHost='1';storyBody.appendChild(host);}
        host.appendChild(refineSection);
        refineSection.hidden=false;
        refineSection.open=false;
        host.hidden=false;
      }
      if(discoverSection)discoverSection.open=false;
      if(conceptSection){conceptSection.hidden=false;conceptSection.open=true;}
      result.querySelectorAll('[data-concept-scene-select]').forEach(button=>button.addEventListener('click',()=>{
        const index=Number(button.dataset.conceptSceneSelect);const scene=c.sceneOutline[index];if(!scene)return;
        result.querySelectorAll('[data-concept-scene-select]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
        const number=result.querySelector('[data-canvas-scene-index]');if(number)number.textContent='SCENE '+String(index+1).padStart(2,'0');
        const duration=result.querySelector('[data-canvas-duration]');if(duration)duration.textContent=scene.durationSeconds+' sec';
        const visual=result.querySelector('[data-canvas-visual]');if(visual)visual.textContent=scene.visualDescription;
        const detail=result.querySelector('[data-canvas-detail]');if(detail)detail.innerHTML=sceneDetail(scene,index);
      }));
      const actions=root.querySelector('[data-discovery-actions]');if(actions)actions.hidden=false;
      const note=root.querySelector('[data-discovery-result-note]');if(note)note.textContent='Review the concept. Approving it creates editable storyboard scene cards. No media generated yet.';
      const state=root.querySelector('[data-accordion-state="story"]');if(state){state.textContent='Concept ready for review';state.classList.remove('complete');}
    };
    const workflowStages=[{id:'story',label:'Story & Concept',heading:'Creative Discovery'},{id:'branding',label:'Branding',heading:'Branding'},{id:'characters',label:'Characters',heading:'Characters & Mascots'},{id:'environment',label:'Environments',heading:'Environments'},{id:'style',label:'Visual Style',heading:'Visual Style'},{id:'storyboard',label:'Storyboard',heading:'Storyboard & Concept Reel'},{id:'production',label:'Production',heading:'Generate & Assemble'}];
    const workflowQuotes=['','Give your story an identity that people will remember.','Every memorable story begins with someone worth following.','Build a world your audience wants to step into.','The way a story looks shapes how it feels.','Every great film begins one scene at a time.','Bring every element together. Let your vision come alive.'];
    let workflowCurrent=0,workflowApproved=[],projectId=crypto.randomUUID(),projectSaveTimer=null,projectSaveBusy=false,projectSaveQueued=false,projectLoading=false;
    let discoveryReferences=[];
    const projectControlKey=el=>el.dataset.persistKey||el.id||el.name||'';
    const collectProjectData=()=>{
      const fields={};
      root.querySelectorAll('[data-accordion] input:not([type=file]),[data-accordion] textarea,[data-accordion] select').forEach(el=>{const key=projectControlKey(el);if(!key)return;fields[key]={value:el.value,checked:el.type==='checkbox'||el.type==='radio'?el.checked:undefined};});
      const safeScenes=scenes.map(scene=>({...scene,imageFile:undefined,image:typeof scene.image==='string'&&scene.image.startsWith('blob:')?'':scene.image,video:typeof scene.video==='string'&&scene.video.startsWith('blob:')?'':scene.video}));
      const discoveryFields={};
      ['idea','url','audience','goal'].forEach(key=>{discoveryFields[key]=root.querySelector('[data-discovery-field="'+key+'"]')?.value||'';});
      discoveryFields.mode=root.querySelector('[data-discovery-mode].active')?.dataset.discoveryMode||'discover';
      return {version:2,discoveryFields,discoveryReferences,discoveryConcept,discoveryHistory,fields,scenes:safeScenes,selectedId,tab,mode,projectReviewed,brandFileNames:Object.fromEntries(['logo','reference'].map(kind=>[kind,root.querySelector('[data-brand-file="'+kind+'"]')?.textContent||'']))};
    };
    const persistVideoProject=async({currentStage=workflowCurrent,approvedStages=workflowApproved,concept=discoveryConcept,sceneList=scenes}={})=>{
      if(projectLoading)return false;
      if(projectSaveBusy){projectSaveQueued=true;for(let attempt=0;attempt<40&&projectSaveBusy;attempt++)await new Promise(resolve=>setTimeout(resolve,100));if(projectSaveBusy)return false;return persistVideoProject({currentStage,approvedStages,concept,sceneList});}
      projectSaveBusy=true;
      try{
        const data=collectProjectData();data.discoveryConcept=concept;data.scenes=sceneList.map(scene=>({...scene,imageFile:undefined,image:typeof scene.image==='string'&&scene.image.startsWith('blob:')?'':scene.image,video:typeof scene.video==='string'&&scene.video.startsWith('blob:')?'':scene.video}));
        const response=await fetch('/api/video/projects/current',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({id:projectId,title:concept?.title||'Untitled video project',currentStage,approvedStages,data})});
        const result=await response.json().catch(()=>({}));
        if(!response.ok||!result.ok)throw new Error(result.error||'Project save failed.');
        projectId=result.id||projectId;
        const savedAt=result.updatedAt?new Date(result.updatedAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'';
        setStatus('Project saved to your library'+(savedAt?' at '+savedAt:'')+'.','success');
        return true;
      }catch(error){setStatus('Could not save this project. Your work remains open; retry before moving on. '+String(error?.message||''),'error');return false;}
      finally{projectSaveBusy=false;if(projectSaveQueued){projectSaveQueued=false;scheduleProjectSave();}}
    };
    const scheduleProjectSave=()=>{
      if(projectLoading)return;
      clearTimeout(projectSaveTimer);
      projectSaveTimer=setTimeout(()=>{if(!projectSaveBusy)persistVideoProject();else projectSaveQueued=true;},800);
    };
    const restoreProjectData=project=>{
      if(!project?.data)return;
      projectLoading=true;
      try{
        projectId=project.id||projectId;
        const data=project.data;
        if(data.fields&&typeof data.fields==='object'){
          root.querySelectorAll('[data-accordion] input:not([type=file]),[data-accordion] textarea,[data-accordion] select').forEach(el=>{const key=projectControlKey(el),saved=data.fields[key];if(!key||!saved)return;el.value=saved.value??'';if(typeof saved.checked==='boolean')el.checked=saved.checked;});
        }
        const savedDiscovery=data.discoveryFields&&typeof data.discoveryFields==='object'?data.discoveryFields:{};
        ['idea','url','audience','goal'].forEach(key=>{const field=root.querySelector('[data-discovery-field="'+key+'"]');if(field&&typeof savedDiscovery[key]==='string')field.value=savedDiscovery[key];});
        const savedMode=savedDiscovery.mode==='brief'?'brief':'discover';
        root.querySelectorAll('[data-discovery-mode]').forEach(button=>{const active=button.dataset.discoveryMode===savedMode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
        const submitButton=root.querySelector('[data-discovery-submit]');if(submitButton)submitButton.innerHTML=savedMode==='brief'?'Review my brief →':'Shape my idea →';
        discoveryReferences=Array.isArray(data.discoveryReferences)?data.discoveryReferences.filter(item=>item&&item.id&&item.name):[];
        const fileLabel=root.querySelector('[data-discovery-file-names]');if(fileLabel)fileLabel.textContent=discoveryReferences.length?discoveryReferences.map(item=>item.name).join(', '):'No files selected';
        let savedReferencesLabel=root.querySelector('[data-discovery-saved-files]');
        if(!savedReferencesLabel){savedReferencesLabel=document.createElement('div');savedReferencesLabel.dataset.discoverySavedFiles='1';savedReferencesLabel.className='sv-saved-reference-list';root.querySelector('[data-discovery-files]')?.closest('.sv-discovery-upload-field')?.appendChild(savedReferencesLabel);}
        renderSavedDiscoveryReferences();
        discoveryConcept=data.discoveryConcept&&Array.isArray(data.discoveryConcept.sceneOutline)?data.discoveryConcept:null;
        discoveryHistory.splice(0,discoveryHistory.length,...(Array.isArray(data.discoveryHistory)?data.discoveryHistory.slice(-10):[]));
        scenes=Array.isArray(data.scenes)?data.scenes.map(scene=>({...scene,imageFile:null,image:typeof scene.image==='string'&&scene.image.startsWith('blob:')?'':scene.image,video:typeof scene.video==='string'&&scene.video.startsWith('blob:')?'':scene.video})):seedScenes();
        selectedId=data.selectedId&&scenes.some(scene=>scene.id===data.selectedId)?data.selectedId:scenes[0]?.id||null;
        tab=data.tab||'settings';mode=data.mode||'director';
        Object.assign(projectReviewed,data.projectReviewed||{});
        workflowApproved=Array.isArray(project.approvedStages)?project.approvedStages.map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6):[];
        workflowCurrent=Number.isInteger(project.currentStage)?Math.max(0,Math.min(6,project.currentStage)):0;
        if(discoveryConcept){const result=root.querySelector('[data-discovery-result]');if(result){result.hidden=false;renderDiscoveryConcept(discoveryConcept,result);}const actions=root.querySelector('[data-discovery-actions]');if(actions)actions.hidden=false;}
        renderScenes();renderSettings();renderPreview();renderWorkflow();
        workflowStages.forEach((stage,index)=>{const state=root.querySelector('[data-accordion-state="'+stage.id+'"]');if(state&&workflowApproved.includes(index)){state.textContent=index===0?'Concept approved':index===5?'Storyboard approved':'Approved';state.classList.add('complete');}});
        goWorkflowStage(workflowCurrent,false);
        setStatus('Saved Video project restored from the database.','success');
      }finally{projectLoading=false;}
    };
    const renderSavedDiscoveryReferences=()=>{
      const host=root.querySelector('[data-discovery-saved-files]');if(!host)return;
      host.innerHTML=discoveryReferences.length?'<small>Saved references</small>'+discoveryReferences.map(item=>'<div class="sv-saved-reference"><span>'+esc(item.name)+'</span><a class="sv-btn" href="/api/video/projects/'+encodeURIComponent(projectId)+'/references/'+encodeURIComponent(item.id)+'" target="_blank" rel="noopener">Download</a><button class="sv-btn" type="button" data-reference-remove="'+esc(item.id)+'">Remove</button></div>').join(''):'';
    };
    const uploadDiscoveryReferences=async files=>{
      const valid=files.filter(file=>file.size>0&&file.size<=10*1024*1024);
      if(valid.length!==files.length)setStatus('Each reference file must be 10 MB or smaller.','error');
      if(!valid.length)return;
      if(!await persistVideoProject()){setStatus('Save the project before uploading reference files.','error');return;}
      for(const file of valid){
        try{
          const form=new FormData();form.append('file',file,file.name);
          const response=await fetch('/api/video/projects/'+encodeURIComponent(projectId)+'/references',{method:'POST',credentials:'same-origin',body:form});
          const result=await response.json().catch(()=>({}));
          if(!response.ok||!result.reference)throw new Error(result.error||('Upload failed for '+file.name));
          discoveryReferences=discoveryReferences.filter(item=>item.name!==result.reference.name);
          discoveryReferences.push(result.reference);
        }catch(error){setStatus(error.message||('Could not save reference '+file.name),'error');}
      }
      const input=root.querySelector('[data-discovery-files]');if(input)input.value='';
      const label=root.querySelector('[data-discovery-file-names]');if(label)label.textContent=discoveryReferences.length?discoveryReferences.map(item=>item.name).join(', '):'No files saved';
      await persistVideoProject();renderSavedDiscoveryReferences();await refreshVideoProjects();
      setStatus('Reference files saved with this project.','success');
    };
    const removeDiscoveryReference=async id=>{
      const item=discoveryReferences.find(ref=>ref.id===id);if(!item)return;
      if(!await confirmVideoProjectDelete('reference file "'+item.name+'"'))return;
      try{
        const response=await fetch('/api/video/projects/'+encodeURIComponent(projectId)+'/references/'+encodeURIComponent(id),{method:'DELETE',credentials:'same-origin'});
        const result=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(result.error||'Reference file could not be removed.');
        discoveryReferences=discoveryReferences.filter(ref=>ref.id!==id);
        await persistVideoProject();renderSavedDiscoveryReferences();
        const label=root.querySelector('[data-discovery-file-names]');if(label)label.textContent=discoveryReferences.length?discoveryReferences.map(ref=>ref.name).join(', '):'No files selected';
      }catch(error){setStatus(error.message||'Reference file could not be removed.','error');}
    };
    const projectStatusLabel=project=>{
      const approved=Array.isArray(project.approvedStages)?project.approvedStages:[];
      if(approved.includes(5)||Number(project.currentStage)>=6)return 'Storyboard approved';
      if(approved.includes(0))return 'Concept approved';
      return 'Draft';
    };
    const refreshVideoProjects=async()=>{
      const list=root.querySelector('[data-projects-list]');if(!list)return;
      list.innerHTML='<div class="sv-status">Loading your saved projects…</div>';
      try{
        const response=await fetch('/api/video/projects',{credentials:'same-origin'}),data=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(data.error||'Projects could not be loaded.');
        const projects=Array.isArray(data.projects)?data.projects:[];
        if(!projects.length){list.innerHTML='<div class="sv-project-empty">No saved projects yet. Start with Creative Discovery below; your work will appear here after it is saved.</div>';return;}
        list.innerHTML=projects.map(project=>{
          const updated=project.updatedAt?new Date(project.updatedAt).toLocaleString([], {dateStyle:'medium',timeStyle:'short'}):'';
          return '<article class="sv-project-row" data-project-row="'+esc(project.id)+'"><div class="sv-project-icon" aria-hidden="true">▣</div><div class="sv-project-copy"><strong>'+esc(project.title||'Untitled video project')+'</strong><small>'+esc(projectStatusLabel(project))+' · Updated '+esc(updated)+' · Stage '+(Number(project.currentStage)+1)+'</small></div><div class="sv-project-actions"><button class="sv-btn primary" type="button" data-project-open="'+esc(project.id)+'">Open</button><button class="sv-btn danger" type="button" data-project-delete="'+esc(project.id)+'">Delete</button></div></article>';
        }).join('');
      }catch(error){list.innerHTML='<div class="sv-status error">'+esc(error.message||'Projects could not be loaded.')+'</div>';}
    };
    const openVideoProject=async id=>{
      setStatus('Opening saved project…');
      try{const response=await fetch('/api/video/projects/'+encodeURIComponent(id),{credentials:'same-origin'}),data=await response.json().catch(()=>({}));if(!response.ok||!data.project)throw new Error(data.error||'Project could not be opened.');restoreProjectData(data.project);setStatus('Saved project opened.','success');root.querySelector('[data-accordion="story"]')?.scrollIntoView({block:'start',behavior:'smooth'});}
      catch(error){setStatus(error.message||'Project could not be opened.','error');}
    };
    const confirmVideoProjectDelete=title=>new Promise(resolve=>{
      const backdrop=document.createElement('div');
      backdrop.className='sv-modal-backdrop';
      backdrop.innerHTML='<section class="sv-modal sv-delete-project-modal" role="alertdialog" aria-modal="true" aria-labelledby="sv-delete-project-title" aria-describedby="sv-delete-project-description"><div class="sv-delete-project-mark" aria-hidden="true">!</div><h3 id="sv-delete-project-title">Delete video project?</h3><p id="sv-delete-project-description">You are about to permanently delete <strong class="sv-delete-project-name"></strong> and its saved storyboard. This action cannot be undone.</p><div class="sv-modal-foot"><button class="sv-btn" type="button" data-delete-cancel>Cancel</button><button class="sv-btn sv-btn-danger" type="button" data-delete-confirm>Delete project</button></div></section>';
      backdrop.querySelector('.sv-delete-project-name').textContent=title;
      let settled=false;
      const onKey=event=>{if(event.key==='Escape')finish(false);};
      const finish=value=>{if(settled)return;settled=true;document.removeEventListener('keydown',onKey);backdrop.remove();resolve(value);};
      backdrop.addEventListener('click',event=>{if(event.target===backdrop||event.target.closest('[data-delete-cancel]'))finish(false);else if(event.target.closest('[data-delete-confirm]'))finish(true);});
      document.addEventListener('keydown',onKey);
      root.appendChild(backdrop);
      backdrop.querySelector('[data-delete-cancel]').focus();
    });
    const deleteVideoProject=async id=>{
      const row=Array.from(root.querySelectorAll('[data-project-row]')).find(el=>el.dataset.projectRow===id);
      const title=row?.querySelector('.sv-project-copy strong')?.textContent||'this project';
      if(!await confirmVideoProjectDelete(title))return;
      try{
        const response=await fetch('/api/video/projects/'+encodeURIComponent(id),{method:'DELETE',credentials:'same-origin'}),data=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(data.error||'Project could not be deleted.');
        if(projectId===id){projectId=crypto.randomUUID();discoveryConcept=null;discoveryHistory.length=0;scenes=seedScenes();selectedId=null;workflowCurrent=0;workflowApproved=[];renderScenes();renderSettings();renderPreview();renderWorkflow();const result=root.querySelector('[data-discovery-result]');if(result){result.innerHTML='';result.hidden=true;}const actions=root.querySelector('[data-discovery-actions]');if(actions)actions.hidden=true;setStatus('Saved project deleted. The workspace is ready for a new idea.','success');}
        await refreshVideoProjects();
      }catch(error){setStatus(error.message||'Project could not be deleted.','error');}
    };
    const loadSavedProject=async()=>{
      projectLoading=true;
      try{const response=await fetch('/api/video/projects/current',{credentials:'same-origin'}),data=await response.json().catch(()=>({}));if(response.ok&&data.project)restoreProjectData(data.project);else if(!response.ok&&response.status!==404)setStatus(data.error||'Saved project could not be loaded.','error');}
      catch(error){setStatus('Saved project could not be loaded. You can continue, but save before leaving.','error');}
      finally{projectLoading=false;}
    };
    const saveWorkflow=()=>{};
    const renderWorkflow=()=>{
      const status=root.querySelector('[data-workflow-status]');
      workflowStages.forEach((stage,index)=>{
        const panel=root.querySelector('[data-accordion="'+stage.id+'"]'),button=root.querySelector('[data-workflow-step="'+index+'"]'),available=index===0||workflowApproved.includes(index-1)||workflowCurrent>=index,done=workflowApproved.includes(index);
        if(panel){panel.classList.toggle('workflow-locked',!available);panel.classList.toggle('workflow-current',index===workflowCurrent);if(!available){const body=panel.querySelector('[data-accordion-body]');if(body)body.hidden=true;const head=panel.querySelector('[data-accordion-toggle]');if(head)head.setAttribute('aria-expanded','false');}}
        if(button){button.disabled=!available;button.classList.toggle('active',index===workflowCurrent);button.classList.toggle('done',done);button.removeAttribute('aria-current');if(index===workflowCurrent)button.setAttribute('aria-current','step');const dot=button.querySelector('.sv-workflow-dot');if(dot)dot.textContent=done?'✓':String(index+1);}
      });
      if(status){const stage=workflowStages[workflowCurrent],done=workflowApproved.includes(workflowCurrent);status.innerHTML='<strong>Step '+(workflowCurrent+1)+' of 7 · '+esc(stage.label)+'</strong> · '+(done?'Approved. You can revisit this stage from the timeline.':workflowCurrent===0?'Develop and approve your creative direction to continue.':workflowCurrent===5?'Review your scenes and approve the storyboard to continue.':workflowCurrent===6?'Review this stage. Production tools will be enabled as they are implemented.':'Complete this stage, then approve to unlock the next step.');}
      const state=root.querySelector('[data-accordion-state="'+workflowStages[workflowCurrent].id+'"]');if(state&&!workflowApproved.includes(workflowCurrent)&&workflowCurrent!==0&&state.textContent==='Not started')state.textContent='In progress';
      saveWorkflow();
    };
    const goWorkflowStage=(index,scroll=true)=>{
      if(index<0||index>6)return;
      if(index>workflowCurrent&&!workflowApproved.includes(index-1))return;
      workflowCurrent=index;renderWorkflow();
      const stage=workflowStages[index],panel=root.querySelector('[data-accordion="'+stage.id+'"]'),body=root.querySelector('[data-accordion-body="'+stage.id+'"]'),head=root.querySelector('[data-accordion-toggle="'+stage.id+'"]');
      if(index===5){const state=root.querySelector('[data-accordion-state="storyboard"]');if(state)state.textContent=scenes.length+' scenes'+(workflowApproved.includes(5)?' · approved':'');}
      if(body){body.hidden=false;if(head){head.setAttribute('aria-expanded','true');const chev=head.querySelector('.sv-accordion-chevron');if(chev)chev.textContent='⌃';}}
      if(scroll)panel?.scrollIntoView({block:'start',behavior:'smooth'});
    };
    const approveWorkflowStage=async(id,skipped=false)=>{
      const index=workflowStages.findIndex(stage=>stage.id===id);if(index<0)return;
      if(id==='story'&&!discoveryConcept){setStatus('Develop and review a concept before approving this stage.','error');return;}
      if(id==='storyboard'&&!scenes.length){setStatus('Create or approve your concept before approving the storyboard.','error');return;}
      const nextApproved=[...new Set([...workflowApproved,index])].sort((a,b)=>a-b),nextStage=index<6?index+1:index;
      const state=root.querySelector('[data-accordion-state="'+id+'"]');
      const saveOk=await persistVideoProject({currentStage:nextStage,approvedStages:nextApproved});
      if(!saveOk)return;
      workflowApproved=nextApproved;
      if(state){state.textContent=skipped?'Skipped':id==='story'?'Concept approved':id==='storyboard'?'Storyboard approved':'Approved';state.classList.add('complete');}
      if(index<6){goWorkflowStage(index+1);setStatus((skipped?'Branding skipped':workflowStages[index].heading+' approved')+'. Saved. '+workflowStages[index+1].heading+' is now available.','success');}
      else{renderWorkflow();setStatus('Workflow review complete. Project saved. Production capabilities will be enabled as they are implemented.','success');}
    };
    root.addEventListener('click',async event=>{
      const removeReferenceButton=event.target.closest('[data-reference-remove]');if(removeReferenceButton){removeDiscoveryReference(removeReferenceButton.dataset.referenceRemove);return;}
      if(event.target.closest('[data-projects-refresh]')){refreshVideoProjects();return;}
      const openProjectButton=event.target.closest('[data-project-open]');if(openProjectButton){openVideoProject(openProjectButton.dataset.projectOpen);return;}
      const deleteProjectButton=event.target.closest('[data-project-delete]');if(deleteProjectButton){deleteVideoProject(deleteProjectButton.dataset.projectDelete);return;}
      const workflowStep=event.target.closest('[data-workflow-step]');if(workflowStep){const index=Number(workflowStep.dataset.workflowStep);if(!workflowStep.disabled)goWorkflowStage(index);return;}
      const workflowSkip=event.target.closest('[data-workflow-skip]');if(workflowSkip){approveWorkflowStage('branding',true);return;}
      const sectionReview=event.target.closest('[data-section-review]');if(sectionReview){approveWorkflowStage(sectionReview.dataset.sectionReview);return;}
      const accordionToggle=event.target.closest('[data-accordion-toggle]');
      if(accordionToggle){const id=accordionToggle.dataset.accordionToggle;const body=root.querySelector('[data-accordion-body="'+id+'"]');if(body){const open=body.hidden;body.hidden=!open;accordionToggle.setAttribute('aria-expanded',String(open));const chevron=accordionToggle.querySelector('.sv-accordion-chevron');if(chevron)chevron.textContent=open?'⌃':'⌄';}return;}
      const brandInput=event.target.closest('[data-brand-upload]');
      if(brandInput){const kind=brandInput.dataset.brandUpload;const file=brandInput.files&&brandInput.files[0];if(file){brandFiles[kind]=file;const label=root.querySelector('[data-brand-file="'+kind+'"]');if(label)label.textContent=file.name;const state=root.querySelector('[data-accordion-state="branding"]');if(state){state.textContent='Assets added';state.classList.add('complete');}if(kind==='logo'&&file.type.startsWith('image/')){const preview=root.querySelector('[data-brand-preview]');const img=root.querySelector('[data-brand-logo-preview]');if(img){if(img.dataset.objectUrl)URL.revokeObjectURL(img.dataset.objectUrl);img.dataset.objectUrl=URL.createObjectURL(file);img.src=img.dataset.objectUrl;}if(preview)preview.hidden=false;}}return;}
      const discoveryMode=event.target.closest('[data-discovery-mode]');
      if(discoveryMode){root.querySelectorAll('[data-discovery-mode]').forEach(button=>{const active=button===discoveryMode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});const submit=root.querySelector('[data-discovery-submit]');if(submit)submit.textContent=discoveryMode.dataset.discoveryMode==='brief'?'Review my brief →':'Shape my idea →';const intro=root.querySelector('.sv-discovery .sv-accordion-intro');if(intro)intro.innerHTML=discoveryMode.dataset.discoveryMode==='brief'?'Add the material you already have. SvaraFlow<sup>™</sup> can organise your brief, identify gaps and help turn it into a clear creative direction.':'You don\'t need a finished script or a detailed brief. Tell SvaraFlow<sup>™</sup> what you\'re trying to achieve, and we\'ll help you discover the story, format and visual direction.';scheduleProjectSave();return;}
      const refineScope=event.target.closest('[data-refine-scope]');if(refineScope){const wrap=root.querySelector('[data-refine-scene-wrap]');if(wrap)wrap.hidden=refineScope.value!=='scene';return;}
      if(event.target.closest('[data-refine-undo]')){if(!discoveryHistory.length||!discoveryConcept)return;discoveryConcept=discoveryHistory.pop();const result=root.querySelector('[data-discovery-result]');if(result)renderDiscoveryConcept(discoveryConcept,result);setStatus('Last refinement undone. Your previous concept has been restored.','success');return;}
      if(event.target.closest('[data-refine-submit]')){
        const button=event.target.closest('[data-refine-submit]'),request=(root.querySelector('[data-refine-request]')?.value||'').trim(),scope=root.querySelector('[data-refine-scope]')?.value||'whole',sceneIndex=Number(root.querySelector('[data-refine-scene]')?.value||0),result=root.querySelector('[data-discovery-result]'),status=root.querySelector('[data-refine-status]');
        if(!discoveryConcept){setStatus('Develop a concept before refining it.','error');return;}
        if(!request){const field=root.querySelector('[data-refine-request]');if(field){field.focus();field.setCustomValidity('Tell SvaraFlow what you would like to change.');field.reportValidity();field.addEventListener('input',()=>field.setCustomValidity(''),{once:true});}return;}
        if(refinementBusy)return;refinementBusy=true;button.disabled=true;button.textContent='Refining…';if(status)status.textContent='SvaraFlow is refining your concept…';setStatus('Refining the creative direction. No media is being generated.');
        try{const response=await fetch('/api/video/refine',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({request,scope,sceneIndex,concept:discoveryConcept})}),data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||('Creative refinement failed ('+response.status+')'));if(!data.concept||!Array.isArray(data.concept.sceneOutline))throw new Error('SvaraFlow returned an incomplete revision. Please try again.');discoveryHistory.push(JSON.parse(JSON.stringify(discoveryConcept)));if(discoveryHistory.length>10)discoveryHistory.shift();discoveryConcept=data.concept;
          if(workflowApproved.length){workflowApproved=[];workflowCurrent=0;for(const stage of workflowStages){const state=root.querySelector('[data-accordion-state="'+stage.id+'"]');if(state){state.classList.remove('complete');state.textContent=stage.id==='story'?'Concept ready for review':'Not started';}}renderWorkflow();}
          if(result){renderDiscoveryConcept(discoveryConcept,result);scheduleProjectSave();const field=root.querySelector('[data-refine-request]');if(field)field.value='';}setStatus('Revision ready. Review it, refine again, undo, or approve when satisfied. No media credits were used.','success');}
        catch(error){if(status)status.textContent='Your current concept is unchanged. You can try again.';setStatus(String(error?.message||error),'error');}
        finally{refinementBusy=false;const current=root.querySelector('[data-refine-submit]');if(current){current.disabled=false;current.textContent='Refine concept →';}}
        return;
      }
      if(event.target.closest('[data-discovery-edit-preserve]')){
        const discoverSection=root.querySelector('[data-work-section="discover"]'),conceptSection=root.querySelector('[data-work-section="concept"]'),refineHost=root.querySelector('[data-refine-section-host]'),refineSection=refineHost?.querySelector('[data-work-section="refine"]');
        if(discoverSection){discoverSection.hidden=false;discoverSection.open=true;}
        if(conceptSection){conceptSection.open=false;conceptSection.hidden=false;}
        if(refineSection){refineSection.open=false;refineSection.hidden=false;}
        root.querySelector('[data-discovery-submit]')?.scrollIntoView({block:'nearest',behavior:'smooth'});
        return;
      }
      if(event.target.closest('[data-discovery-edit]')){
        if(root.querySelector('[data-edit-concept-confirm]'))return;
        const wrap=document.createElement('div');
        wrap.className='sv-modal-backdrop';
        wrap.innerHTML='<section class="sv-modal" role="dialog" aria-modal="true" aria-labelledby="sv-edit-confirm-title"><h3 id="sv-edit-confirm-title">Start over with your creative direction?</h3><p style="font-size:11px;line-height:1.6;color:#aebbd0">Your current creative concept, refinements and approval will be cleared. Your answers in Discover your idea will be kept so you can edit them. Do you want to continue?</p><div class="sv-modal-foot"><button class="sv-btn" type="button" data-edit-concept-cancel>Cancel</button><button class="sv-btn primary" type="button" data-edit-concept-confirm>Generate new idea</button></div></section>';
        root.appendChild(wrap);
        wrap.addEventListener('click',e=>{
          if(e.target===wrap||e.target.closest('[data-edit-concept-cancel]')){wrap.remove();return;}
          if(!e.target.closest('[data-edit-concept-confirm]'))return;
          discoveryConcept=null;
          discoveryHistory.length=0;
          workflowApproved=[];workflowCurrent=0;
          for(const stage of workflowStages){const stageState=root.querySelector('[data-accordion-state="'+stage.id+'"]');if(stageState){stageState.classList.remove('complete');stageState.textContent=stage.id==='story'?'Ready to explore':'Not started';}}
          const discoverSection=root.querySelector('[data-work-section="discover"]'),conceptSection=root.querySelector('[data-work-section="concept"]'),refineHost=root.querySelector('[data-refine-section-host]'),result=root.querySelector('[data-discovery-result]'),actions=root.querySelector('[data-discovery-actions]');
          if(discoverSection){discoverSection.hidden=false;discoverSection.open=true;}
          if(conceptSection){conceptSection.open=false;conceptSection.hidden=true;}
          if(refineHost){refineHost.querySelectorAll('[data-work-section="refine"]').forEach(section=>section.remove());refineHost.hidden=true;}
          if(result){result.hidden=true;result.innerHTML='';}
          if(actions)actions.hidden=true;
          const state=root.querySelector('[data-accordion-state="story"]');if(state)state.textContent='Ready to explore';
          wrap.remove();
          const discoverSummary=discoverSection?.querySelector('summary');
          if(discoverSummary)discoverSummary.scrollIntoView({block:'start',behavior:'smooth'});
          renderWorkflow();scheduleProjectSave();
          setStatus('Creative direction cleared. Your discovery answers are ready to edit.');
        });
        return;
      }
      if(event.target.closest('[data-discovery-submit]')){
        const button=event.target.closest('[data-discovery-submit]');
        const idea=(root.querySelector('[data-discovery-field="idea"]')?.value||'').trim();
        const url=(root.querySelector('[data-discovery-field="url"]')?.value||'').trim();
        const audience=root.querySelector('[data-discovery-field="audience"]')?.value||'';
        const goal=root.querySelector('[data-discovery-field="goal"]')?.value||'';
        const files=root.querySelector('[data-discovery-files]')?.files||[];
        const mode=root.querySelector('[data-discovery-mode].active')?.dataset.discoveryMode||'discover';
        if(!idea&&!url&&!files.length){const field=root.querySelector('[data-discovery-field="idea"]');if(field){field.focus();field.setCustomValidity('Tell us a little about the video you want to make, or add a link or reference file.');field.reportValidity();field.addEventListener('input',()=>field.setCustomValidity(''),{once:true});}return;}
        if(!idea&&!url){setStatus('Reference files are selected, but file analysis is not connected yet. Add a short description to start discovery.','error');return;}
        const result=root.querySelector('[data-discovery-result]');const actions=root.querySelector('[data-discovery-actions]');
        if(discoveryConcept){discoveryConcept=null;}
        if(result){result.hidden=false;result.innerHTML='<h3>Developing your concept…</h3><p>SvaraFlow is analysing your idea and building a structured creative direction and scene outline. This can take a few moments.</p>';}
        if(actions)actions.hidden=true;
        if(button){button.disabled=true;button.textContent='Developing concept…';}
        setStatus('SvaraFlow is developing your concept with OpenAI…');
        try{
          const response=await fetch('/api/video/discovery',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({idea,url,audience,goal,mode})});
          const data=await response.json().catch(()=>({}));
          if(!response.ok)throw new Error(data.error||('Creative Discovery failed ('+response.status+')'));
          if(!data.concept||!Array.isArray(data.concept.sceneOutline))throw new Error('The discovery service returned an incomplete concept. Please try again.');
          discoveryConcept=data.concept;
          const c=discoveryConcept;
          renderDiscoveryConcept(c,result);
          scheduleProjectSave();
          result.scrollIntoView({block:'nearest',behavior:'smooth'});
          setStatus('Concept ready for your review. Nothing advances until you approve it.','success');
        }catch(error){
          if(result){result.hidden=false;result.innerHTML='<h3>Discovery could not be completed</h3><p>'+esc(String(error?.message||error))+'</p><p>You can edit your answers and try again.</p>';}
          setStatus(String(error?.message||error),'error');
        }finally{
          if(button){button.disabled=false;button.innerHTML=(mode==='brief'?'Review my brief':'Shape my idea')+' <span aria-hidden="true">→</span>';}
        }
        return;
      }
      if(event.target.closest('[data-discovery-approve]')){
        if(!discoveryConcept){setStatus('Develop a concept before approving it.','error');return;}
        const c=discoveryConcept;
        scenes=c.sceneOutline.map((scene,index)=>({
          id:'scene-'+Date.now()+'-'+index,
          title:'Scene '+(index+1)+' — '+String(scene.title||'Untitled scene'),
          description:String(scene.purpose||scene.visualDescription||''),
          duration:Math.min(30,Math.max(2,Number(scene.durationSeconds)||5)),
          ratio:'1280:720',
          status:'Baseline needed',
          image:'',
          video:'',
          imageFile:null,
          prompt:[scene.visualDescription,scene.cameraDirection,scene.narration?'Narration: '+scene.narration:'', 'Visual style: '+c.visualStyle, 'Tone: '+c.tone].filter(Boolean).join('\n')
        }));
        selectedId=scenes[0]?.id||null;
        const storyboard=root.querySelector('[data-accordion-body="storyboard"]');
        const storyboardHead=root.querySelector('[data-accordion-toggle="storyboard"]');
        if(storyboard){storyboard.hidden=true;if(storyboardHead)storyboardHead.setAttribute('aria-expanded','false');const chev=storyboardHead?.querySelector('.sv-accordion-chevron');if(chev)chev.textContent='⌄';}
        const state=root.querySelector('[data-accordion-state="storyboard"]');if(state)state.textContent=scenes.length+' scenes · concept approved';
        renderScenes();renderSettings();renderPreview();
        await approveWorkflowStage('story');
        if(workflowApproved.includes(0))setStatus('Concept saved and approved. '+scenes.length+' editable storyboard scenes created. No media generated.','success');
        return;
      }
      const fileInput=event.target.closest('[data-discovery-files]');
      if(fileInput){const label=root.querySelector('[data-discovery-file-names]');if(label)label.textContent=fileInput.files.length?Array.from(fileInput.files).map(file=>file.name).join(', '):'No files selected';return;}
      const reviewButton=event.target.closest('[data-section-review]');
      if(reviewButton){const id=reviewButton.dataset.sectionReview;projectReviewed[id]=!projectReviewed[id];const state=root.querySelector('[data-accordion-state="'+id+'"]');if(state){state.textContent=projectReviewed[id]?'Reviewed':'In progress';state.classList.toggle('complete',projectReviewed[id]);}reviewButton.textContent=projectReviewed[id]?'Mark incomplete':'Mark reviewed';return;}
      const modeButton=event.target.closest('[data-mode]');if(modeButton){mode=modeButton.dataset.mode;root.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b===modeButton));setStatus(mode==='director'?'Director mode: approve each scene before generation.':mode==='hybrid'?'Hybrid mode: review key decisions and let SvaraFlow assist.':'Automatic mode selected. Automated orchestration is a planned feature.');return;}
      const tabButton=event.target.closest('[data-tab]');if(tabButton){tab=tabButton.dataset.tab;renderTabs();renderSettings();return;}
      const sceneAction=event.target.closest('[data-scene-action]');if(sceneAction){event.stopPropagation();const s=scenes.find(x=>x.id===sceneAction.dataset.id);if(!s)return;const action=sceneAction.dataset.sceneAction;if(action==='generate'){selectScene(s.id);generate(s);}else if(action==='preview'){selectScene(s.id);renderPreview();if(s.video){preview.innerHTML='<video controls autoplay playsinline src="'+esc(s.video)+'"></video>';}}else if(action==='edit'){selectScene(s.id);tab='settings';renderTabs();renderSettings();}else if(action==='image'){selectScene(s.id);chooseImage();}else if(action==='motion'){selectScene(s.id);tab='prompt';renderTabs();renderSettings();}else if(action==='voice'||action==='music'||action==='sound'){selectScene(s.id);showPlaceholder(action);}else if(action==='duplicate'){const copy={...s,id:'scene-'+Date.now(),title:s.title+' (Copy)',image:s.image,video:'',status:s.imageFile?'Ready to generate':'Baseline needed'};scenes.splice(scenes.indexOf(s)+1,0,copy);selectScene(copy.id);scheduleProjectSave();setStatus('Scene duplicated. Review its prompt and image before generating.');}else if(action==='delete'){scenes=scenes.filter(x=>x.id!==s.id);selectedId=scenes[0]?.id||null;renderScenes();renderSettings();renderPreview();scheduleProjectSave();setStatus('Scene removed from this saved storyboard.');}return;}
      const settingsAction=event.target.closest('[data-settings-action]');if(settingsAction){if(settingsAction.dataset.settingsAction==='image')chooseImage();else showPlaceholder(settingsAction.dataset.settingsAction);return;}
      const action=event.target.closest('[data-action]')?.dataset.action;if(action==='add'){addScene();scheduleProjectSave();return;}if(action==='reorder'){reorder=!reorder;setStatus(reorder?'Reorder mode: use the scene cards’ move controls in the next phase.':'Reorder mode closed.');return;}if(action==='save'){setStatus('Save Project is a placeholder in this UI milestone. Persistent project storage is planned.');return;}if(action==='project-menu'){openProjectMenu();return;}if(action==='generate-all'){setStatus('Generate All is reserved for a later phase. Generate scenes individually for now; each request can consume Runway credits.');return;}
      const card=event.target.closest('[data-scene]');if(card)selectScene(card.dataset.scene);
    });
    root.addEventListener('change',event=>{
      if(event.target.matches('[data-discovery-files]')){const label=root.querySelector('[data-discovery-file-names]');if(label)label.textContent=event.target.files.length?Array.from(event.target.files).map(file=>file.name).join(', '):'No new files selected';if(event.target.files.length)uploadDiscoveryReferences(Array.from(event.target.files));return;}
      const bind=event.target.dataset.bind;if(bind){const s=selected();s[bind]=bind==='duration'?Number(event.target.value):event.target.value;if(bind==='status')renderScenes();if(bind==='title'||bind==='description'||bind==='duration'||bind==='ratio')renderScenes();renderPreview();scheduleProjectSave();return;}
      if(event.target.matches('[data-image-input]')){const file=event.target.files&&event.target.files[0];if(file){const s=selected();s.imageFile=file;s.image=URL.createObjectURL(file);s.status='Ready to generate';renderScenes();renderSettings();renderPreview();}}
    });
    root.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-scene]')){event.preventDefault();selectScene(event.target.dataset.scene);}});
    workflowStages.forEach((stage,index)=>{const panel=root.querySelector('[data-accordion="'+stage.id+'"]'),head=panel?.querySelector('[data-accordion-toggle]');if(!panel||!head||!workflowQuotes[index])return;const quote=document.createElement('p');quote.className='sv-workflow-quote';quote.textContent='“'+workflowQuotes[index]+'”';head.insertAdjacentElement('afterend',quote);});
    if(!document.querySelector('#svVideoPersistenceStyles')){const persistenceStyle=document.createElement('style');persistenceStyle.id='svVideoPersistenceStyles';persistenceStyle.textContent='.sv-workflow-quote{margin:0;padding:0 18px 13px 62px;color:#8ea9cb;font-size:11px;font-style:italic;line-height:1.5;letter-spacing:.01em}.sv-workflow-quote[hidden]{display:none}@media(max-width:600px){.sv-workflow-quote{padding-left:18px}}';document.head.appendChild(persistenceStyle);}
    root.addEventListener('input',event=>{if(projectLoading||event.target.matches('input[type=file]'))return;if(event.target.closest('[data-accordion]')||event.target.matches('[data-discovery-field]'))scheduleProjectSave();});
    root.addEventListener('change',event=>{if(projectLoading||event.target.matches('input[type=file]'))return;if(event.target.closest('[data-accordion]')||event.target.matches('[data-discovery-field]'))scheduleProjectSave();});
    renderScenes();renderSettings();renderPreview();renderWorkflow();
    const currentPanel=root.querySelector('[data-accordion="'+workflowStages[workflowCurrent].id+'"]'),currentBody=currentPanel?.querySelector('[data-accordion-body]'),currentHead=currentPanel?.querySelector('[data-accordion-toggle]');if(currentBody){currentBody.hidden=false;if(currentHead){currentHead.setAttribute('aria-expanded','true');const chev=currentHead.querySelector('.sv-accordion-chevron');if(chev)chev.textContent='⌃';}}
    root.dataset.videoWorkspaceInitialized='1';
    loadSavedProject();
    refreshVideoProjects();
  }
  window.SvaraVideoWorkspace={render};
})();