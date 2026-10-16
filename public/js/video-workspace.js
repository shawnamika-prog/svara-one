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
    .sv-discovery-result{text-align:left!important}.sv-discovery-result *{text-align:left}.sv-concept-kicker{font-size:9px;font-weight:800;letter-spacing:.15em;color:#a5a6ff;margin-bottom:8px}.sv-concept-kicker span{opacity:.5}.sv-discovery-result h3{font-size:20px;line-height:1.3;margin:5px 0 7px;color:#f2f5ff}.sv-discovery-result h4{font-size:12px;margin:0;color:#e0e7ff}.sv-discovery-result p,.sv-discovery-result li{font-size:11px;line-height:1.55;color:#aebbd0}.sv-concept-logline{font-size:13px!important;line-height:1.6!important;color:#e0e7ff!important;max-width:850px;margin:0 0 15px!important}.sv-concept-icon{width:15px;height:15px;flex:0 0 15px;color:#a5b4fc}.sv-concept-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:14px 0 18px}.sv-concept-meta>div{display:flex;align-items:flex-start;gap:9px;padding:10px;border:1px solid #ffffff12;border-radius:8px;background:#0b1422;min-width:0}.sv-concept-meta span{font-size:10px;line-height:1.5;color:#d7e1f1}.sv-concept-direction{padding:14px;border:1px solid #ffffff12;border-radius:10px;background:#11172a;margin:0 0 17px}.sv-concept-section-title{display:flex;align-items:center;gap:8px;margin-bottom:9px}.sv-concept-section-title>span{margin-left:auto;font-size:9px;color:#a5b4fc}.sv-concept-direction>p{margin:0 0 10px}.sv-concept-tags{display:flex;gap:6px;flex-wrap:wrap}.sv-concept-tags span{font-size:9px;color:#c7d2fe;border:1px solid #6366f144;background:#27254a;padding:4px 7px;border-radius:5px}.sv-concept-story{margin-top:2px}.sv-concept-scenes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.sv-concept-scene{padding:11px;border:1px solid #ffffff12;background:#0a1321;border-radius:9px;min-width:0}.sv-concept-scene-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.sv-concept-scene-title{display:flex;align-items:center;gap:7px;min-width:0}.sv-concept-scene-title strong{font-size:11px;line-height:1.4;color:#e2e8f0}.sv-concept-scene-number{font-size:9px;color:#a5b4fc;font-variant-numeric:tabular-nums}.sv-concept-duration{display:flex;align-items:center;gap:4px;white-space:nowrap;color:#a5b4fc;font-size:9px}.sv-concept-duration .sv-concept-icon{width:12px;height:12px;flex-basis:12px}.sv-concept-purpose{margin:8px 0!important;color:#d7e1f1!important}.sv-concept-detail{display:flex;align-items:flex-start;gap:8px;margin-top:8px;padding-top:8px;border-top:1px solid #ffffff0c}.sv-concept-detail .sv-concept-icon{margin-top:1px}.sv-concept-detail p{margin:0!important;flex:1}.sv-concept-narration{background:#12192a;border-radius:6px;padding:8px;margin-top:9px}.sv-concept-bottom{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.sv-concept-bottom>div{padding:10px;border:1px solid #ffffff12;border-radius:8px}.sv-concept-bottom small{font-size:8px;letter-spacing:.1em;color:#8795bd}.sv-concept-bottom p{margin:5px 0 0!important;color:#d7e1f1!important}.sv-concept-more{margin-top:12px;border-top:1px solid #ffffff12;padding-top:10px}.sv-concept-more summary{display:flex;align-items:center;gap:8px;cursor:pointer;color:#aebbd0;font-size:10px;list-style:none}.sv-concept-more summary::-webkit-details-marker{display:none}.sv-concept-more>div{padding:8px 0}.sv-concept-more strong{font-size:10px;color:#d7e1f1}.sv-concept-more ul{margin:5px 0 10px;padding-left:17px}.sv-concept-more li{margin:3px 0}.sv-discovery-result .sv-draft-note{padding:8px 10px;border-radius:7px;background:#241f12;border:1px solid #8a6d2d55;color:#e9d5a2;font-size:9px;line-height:1.5;margin-top:12px}.sv-discovery-result-actions{justify-content:space-between}.sv-discovery-result h3{font-size:20px!important;line-height:1.3!important;margin:5px 0 7px!important}.sv-discovery-result .sv-concept-logline{font-size:13px!important;line-height:1.6!important;margin:0 0 15px!important}.sv-discovery-result .sv-concept-direction>p{margin:0 0 10px!important}.sv-discovery-result .sv-concept-bottom p{margin:5px 0 0!important}
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
.sv-canvas-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:12px;padding-top:11px;border-top:1px solid #ffffff12}.sv-canvas-takeaway{font-size:10px!important;line-height:1.5!important;color:#cbd5e1!important;margin:0!important;flex:1;min-width:180px}.sv-canvas-takeaway strong{color:#a5b4fc;margin-right:6px}.sv-canvas-cta{font-size:10px!important;color:#c7d2fe!important;margin:0!important}.sv-canvas-more{margin-top:10px}@media(max-width:900px){.sv-canvas-layout{grid-template-columns:1fr}.sv-canvas-preview{min-height:250px}.sv-canvas-side{grid-template-rows:auto auto}}@media(max-width:600px){.sv-discovery-result.sv-creative-canvas{padding:11px!important}.sv-canvas-meta{justify-content:flex-start}.sv-canvas-meta span{padding:6px}.sv-canvas-style p{min-width:100%}.sv-canvas-preview{min-height:220px;padding:10px}.sv-canvas-rail{gap:4px}.sv-canvas-thumb b{left:3px;top:3px;width:17px;height:17px}.sv-canvas-detail{padding:10px}}
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
    .sv-accordion-chevron{font-size:17px;color:#A5B4FC;width:18px;text-align:center}
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
    main.workspace:has(.sv-video){display:block;grid-template-columns:minmax(0,1fr);max-width:none;width:100%;margin:0;padding:26px 38px}
    .studio-domain-placeholder:has(.sv-video){display:block;width:100%;max-width:none;margin:0;padding:0;justify-self:stretch}
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
        <section class="sv-card">
          <div class="sv-vhead"><div><div class="sv-eyebrow">VIDEO</div><h2>Bring your story to life</h2><p>Plan, create and direct every scene. You direct &amp; SvaraFlow coordinates the work.</p></div>
            
          </div>
        </section>
        <section class="sv-card sv-accordion sv-discovery" data-accordion="story">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="story" aria-expanded="false"><span class="sv-accordion-number">01</span><span class="sv-accordion-title"><strong>Creative Discovery</strong><small>Start with an idea. SvaraFlow<sup>™</sup> helps shape the video.</small></span><span class="sv-accordion-state" data-accordion-state="story">Ready to explore</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="story" hidden>
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
            <div class="sv-accordion-foot"><span class="sv-setup-note"></span><button class="sv-btn primary" type="button" data-discovery-submit>Shape my idea <span aria-hidden="true">→</span></button></div>
            <div class="sv-discovery-result" data-discovery-result hidden aria-live="polite"></div>
            <div class="sv-accordion-foot sv-discovery-result-actions" data-discovery-actions hidden><span class="sv-setup-note" data-discovery-result-note>AI concept draft · references are not yet analysed.</span><button class="sv-btn" type="button" data-discovery-edit>Edit my answers</button><button class="sv-btn primary" type="button" data-discovery-approve>Approve concept &amp; create storyboard →</button></div>
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
            <div class="sv-accordion-foot"><span class="sv-setup-note">Brand assets can later be reused across scenes and exports.</span><button class="sv-btn" type="button" data-section-review="branding">Mark reviewed</button></div>
          </div>
        </section>
        <section class="sv-card sv-accordion" data-accordion="characters">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="characters" aria-expanded="false"><span class="sv-accordion-number">03</span><span class="sv-accordion-title"><strong>Characters &amp; Mascots</strong><small>Reusable character identity and references</small></span><span class="sv-accordion-state" data-accordion-state="characters">Not started</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="characters" hidden>
            <p class="sv-accordion-intro">Create or select the main characters and mascots. Approved references can be reused across scenes to help maintain visual continuity.</p>
            <div class="sv-asset-placeholder"><strong>Character library · planned</strong><br>Reusable character references, identity notes and approved looks will live here.</div>
            <div class="sv-accordion-foot"><span class="sv-setup-note">Character assets will be connected in a later phase.</span><button class="sv-btn" type="button" data-section-review="characters">Mark reviewed</button></div>
          </div>
        </section>
        <section class="sv-card sv-accordion" data-accordion="environment">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="environment" aria-expanded="false"><span class="sv-accordion-number">03</span><span class="sv-accordion-title"><strong>Environments</strong><small>Locations, backgrounds, lighting and atmosphere</small></span><span class="sv-accordion-state" data-accordion-state="environment">Not started</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="environment" hidden>
            <p class="sv-accordion-intro">Define the places and settings where your story takes place. Reuse approved environment references across scenes.</p>
            <div class="sv-asset-placeholder"><strong>Environment library · planned</strong><br>Locations, background references and lighting setups will live here.</div>
            <div class="sv-accordion-foot"><span class="sv-setup-note">Environment assets will be connected in a later phase.</span><button class="sv-btn" type="button" data-section-review="environment">Mark reviewed</button></div>
          </div>
        </section>
        <section class="sv-card sv-accordion" data-accordion="style">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="style" aria-expanded="false"><span class="sv-accordion-number">04</span><span class="sv-accordion-title"><strong>Visual Style</strong><small>Look, palette, mood and cinematic direction</small></span><span class="sv-accordion-state" data-accordion-state="style">Not started</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="style" hidden>
            <div class="sv-setup-grid">
              <label class="sv-field"><span>Visual direction</span><select data-project-field="visualStyle"><option value="">Choose a visual style</option><option>Cinematic realism</option><option>3D animation</option><option>Stylised illustration</option><option>Anime</option><option>Mixed media</option></select></label>
              <label class="sv-field"><span>Colour palette</span><input data-project-field="palette" placeholder="e.g. midnight blue, violet, warm gold"></label>
              <label class="sv-field sv-field-wide"><span>Visual notes</span><textarea data-project-field="visualNotes" rows="2" placeholder="Lighting, camera language, texture and mood..."></textarea></label>
            </div>
            <div class="sv-accordion-foot"><span class="sv-setup-note">You can change the visual direction later.</span><button class="sv-btn" type="button" data-section-review="style">Mark reviewed</button></div>
          </div>
        </section>
        <section class="sv-card sv-accordion" data-accordion="storyboard">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="storyboard" aria-expanded="false"><span class="sv-accordion-number">05</span><span class="sv-accordion-title"><strong>Storyboard</strong><small>Your scenes, shots and camera direction</small></span><span class="sv-accordion-state" data-accordion-state="storyboard">0 scenes</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="storyboard" hidden>
            <span class="sv-hidden" data-count>(0)</span>
            <div class="sv-scenes" data-scenes style="padding:10px"></div>
            <div style="padding:0 10px 10px"><button class="sv-add" data-action="add">＋ Add New Scene</button></div>
          </div>
        </section>
        <section class="sv-card sv-accordion" data-accordion="production">
          <button class="sv-accordion-head" type="button" data-accordion-toggle="production" aria-expanded="false"><span class="sv-accordion-number">06</span><span class="sv-accordion-title"><strong>Generate &amp; Assemble</strong><small>Generate, review, edit and export</small></span><span class="sv-accordion-state">Planned</span><span class="sv-accordion-chevron">⌄</span></button>
          <div class="sv-accordion-body" data-accordion-body="production" hidden>
            <p class="sv-accordion-intro">Once your scenes are ready, generate clips, review results, and assemble the finished production with dialogue, music, sound effects and transitions.</p>
            <div class="sv-asset-row"><div class="sv-asset-icon">▣</div><div class="sv-asset-copy"><strong>Video scenes</strong><small>Scene clips, approvals and transitions · planned</small></div><span class="sv-chip">Future phase</span></div>
            <div class="sv-asset-row"><div class="sv-asset-icon">♫</div><div class="sv-asset-copy"><strong>Voice, music &amp; sound</strong><small>Audio lanes, sync controls and export · planned</small></div><span class="sv-chip">Future phase</span></div>
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
    root.addEventListener('click',async event=>{
      const accordionToggle=event.target.closest('[data-accordion-toggle]');
      if(accordionToggle){const id=accordionToggle.dataset.accordionToggle;const body=root.querySelector('[data-accordion-body="'+id+'"]');if(body){const open=body.hidden;body.hidden=!open;accordionToggle.setAttribute('aria-expanded',String(open));const chevron=accordionToggle.querySelector('.sv-accordion-chevron');if(chevron)chevron.textContent=open?'⌃':'⌄';}return;}
      const brandInput=event.target.closest('[data-brand-upload]');
      if(brandInput){const kind=brandInput.dataset.brandUpload;const file=brandInput.files&&brandInput.files[0];if(file){brandFiles[kind]=file;const label=root.querySelector('[data-brand-file="'+kind+'"]');if(label)label.textContent=file.name;const state=root.querySelector('[data-accordion-state="branding"]');if(state){state.textContent='Assets added';state.classList.add('complete');}if(kind==='logo'&&file.type.startsWith('image/')){const preview=root.querySelector('[data-brand-preview]');const img=root.querySelector('[data-brand-logo-preview]');if(img){if(img.dataset.objectUrl)URL.revokeObjectURL(img.dataset.objectUrl);img.dataset.objectUrl=URL.createObjectURL(file);img.src=img.dataset.objectUrl;}if(preview)preview.hidden=false;}}return;}
      const discoveryMode=event.target.closest('[data-discovery-mode]');
      if(discoveryMode){root.querySelectorAll('[data-discovery-mode]').forEach(button=>{const active=button===discoveryMode;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});const submit=root.querySelector('[data-discovery-submit]');if(submit)submit.textContent=discoveryMode.dataset.discoveryMode==='brief'?'Review my brief →':'Shape my idea →';const intro=root.querySelector('.sv-discovery .sv-accordion-intro');if(intro)intro.innerHTML=discoveryMode.dataset.discoveryMode==='brief'?'Add the material you already have. SvaraFlow<sup>™</sup> can organise your brief, identify gaps and help turn it into a clear creative direction.':'You don\'t need a finished script or a detailed brief. Tell SvaraFlow<sup>™</sup> what you\'re trying to achieve, and we\'ll help you discover the story, format and visual direction.';return;}
      if(event.target.closest('[data-discovery-edit]')){const result=root.querySelector('[data-discovery-result]');const actions=root.querySelector('[data-discovery-actions]');if(result)result.hidden=true;if(actions)actions.hidden=true;root.querySelector('[data-discovery-submit]')?.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
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
          result.innerHTML='<div class="sv-canvas-top"><div class="sv-canvas-title"><div class="sv-concept-kicker">SVARAFLOW™ <span>·</span> YOUR VIDEO IDEA</div><h3>'+esc(c.title)+'</h3><p class="sv-concept-logline">'+esc(c.logline)+'</p></div><div class="sv-canvas-meta"><span>'+ico('time')+esc(c.durationSeconds)+' sec</span><span>'+ico('format')+esc(c.recommendedFormat)+'</span><span>'+ico('audience')+esc(c.audience)+'</span></div></div><div class="sv-canvas-style"><p>'+esc(c.creativeDirection)+'</p><span>'+esc(c.visualStyle)+'</span><span>'+esc(c.tone)+'</span></div><div class="sv-canvas-layout"><section class="sv-canvas-preview" aria-label="Selected scene visual preview"><div class="sv-canvas-preview-top"><span data-canvas-scene-index>SCENE 01</span><span data-canvas-duration>'+esc(c.sceneOutline[0]?.durationSeconds||0)+' sec</span></div><div class="sv-canvas-preview-art"><div class="sv-canvas-orbit" aria-hidden="true"></div><div><div class="sv-canvas-art-symbol" aria-hidden="true">✧</div><div class="sv-canvas-art-copy"><small>Visual preview</small><span data-canvas-visual>'+esc(c.sceneOutline[0]?.visualDescription||'Your scene preview will appear here.')+'</span></div></div></div><div class="sv-canvas-preview-bottom"><span>Concept frame · not generated</span><span>'+esc(c.recommendedFormat)+'</span></div></section><section class="sv-canvas-side"><div class="sv-canvas-rail" role="group" aria-label="Choose a scene">'+scenesMarkup+'</div><div class="sv-canvas-detail" data-canvas-detail>'+sceneDetail(c.sceneOutline[0],0)+'</div></section></div><div class="sv-canvas-footer"><p class="sv-canvas-takeaway"><strong>THE IDEA</strong>'+esc(c.keyMessage)+'</p><p class="sv-canvas-cta">'+esc(c.callToAction)+'</p></div><details class="sv-concept-more sv-canvas-more"><summary>'+ico('question')+' Questions &amp; assumptions</summary><div><strong>Worth deciding</strong><ul>'+list(c.openQuestions)+'</ul><strong>Assumptions made</strong><ul>'+list(c.assumptions)+'</ul></div></details><div class="sv-draft-note">Concept for your review. Reference files and URLs have not been analysed; scene imagery is illustrative UI only. No images or video have been generated.</div>';
          result.querySelectorAll('[data-concept-scene-select]').forEach(button=>button.addEventListener('click',()=>{
            const index=Number(button.dataset.conceptSceneSelect);const scene=c.sceneOutline[index];if(!scene)return;
            result.querySelectorAll('[data-concept-scene-select]').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
            const number=result.querySelector('[data-canvas-scene-index]');if(number)number.textContent='SCENE '+String(index+1).padStart(2,'0');
            const duration=result.querySelector('[data-canvas-duration]');if(duration)duration.textContent=scene.durationSeconds+' sec';
            const visual=result.querySelector('[data-canvas-visual]');if(visual)visual.textContent=scene.visualDescription;
            const detail=result.querySelector('[data-canvas-detail]');if(detail)detail.innerHTML=sceneDetail(scene,index);
          }));
          if(actions)actions.hidden=false;
          const note=root.querySelector('[data-discovery-result-note]');if(note)note.textContent='Review the concept. Approving it creates editable storyboard scene cards; it does not generate media.';
          result.scrollIntoView({block:'nearest',behavior:'smooth'});
          const state=root.querySelector('[data-accordion-state="story"]');if(state){state.textContent='Concept ready for review';state.classList.remove('complete');}
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
        if(storyboard){storyboard.hidden=false;if(storyboardHead)storyboardHead.setAttribute('aria-expanded','true');const chev=storyboardHead?.querySelector('.sv-accordion-chevron');if(chev)chev.textContent='⌃';}
        const state=root.querySelector('[data-accordion-state="storyboard"]');if(state)state.textContent=scenes.length+' scenes · concept approved';
        renderScenes();renderSettings();renderPreview();
        setStatus('Concept approved. '+scenes.length+' editable storyboard scenes created. Add or generate reference images in the next step.','success');
        storyboard?.scrollIntoView({block:'nearest',behavior:'smooth'});
        return;
      }
      const fileInput=event.target.closest('[data-discovery-files]');
      if(fileInput){const label=root.querySelector('[data-discovery-file-names]');if(label)label.textContent=fileInput.files.length?Array.from(fileInput.files).map(file=>file.name).join(', '):'No files selected';return;}
      const reviewButton=event.target.closest('[data-section-review]');
      if(reviewButton){const id=reviewButton.dataset.sectionReview;projectReviewed[id]=!projectReviewed[id];const state=root.querySelector('[data-accordion-state="'+id+'"]');if(state){state.textContent=projectReviewed[id]?'Reviewed':'In progress';state.classList.toggle('complete',projectReviewed[id]);}reviewButton.textContent=projectReviewed[id]?'Mark incomplete':'Mark reviewed';return;}
      const modeButton=event.target.closest('[data-mode]');if(modeButton){mode=modeButton.dataset.mode;root.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b===modeButton));setStatus(mode==='director'?'Director mode: approve each scene before generation.':mode==='hybrid'?'Hybrid mode: review key decisions and let SvaraFlow assist.':'Automatic mode selected. Automated orchestration is a planned feature.');return;}
      const tabButton=event.target.closest('[data-tab]');if(tabButton){tab=tabButton.dataset.tab;renderTabs();renderSettings();return;}
      const sceneAction=event.target.closest('[data-scene-action]');if(sceneAction){event.stopPropagation();const s=scenes.find(x=>x.id===sceneAction.dataset.id);if(!s)return;const action=sceneAction.dataset.sceneAction;if(action==='generate'){selectScene(s.id);generate(s);}else if(action==='preview'){selectScene(s.id);renderPreview();if(s.video){preview.innerHTML='<video controls autoplay playsinline src="'+esc(s.video)+'"></video>';}}else if(action==='edit'){selectScene(s.id);tab='settings';renderTabs();renderSettings();}else if(action==='image'){selectScene(s.id);chooseImage();}else if(action==='motion'){selectScene(s.id);tab='prompt';renderTabs();renderSettings();}else if(action==='voice'||action==='music'||action==='sound'){selectScene(s.id);showPlaceholder(action);}else if(action==='duplicate'){const copy={...s,id:'scene-'+Date.now(),title:s.title+' (Copy)',image:s.image,video:'',status:s.imageFile?'Ready to generate':'Baseline needed'};scenes.splice(scenes.indexOf(s)+1,0,copy);selectScene(copy.id);setStatus('Scene duplicated. Review its prompt and image before generating.');}else if(action==='delete'){scenes=scenes.filter(x=>x.id!==s.id);selectedId=scenes[0]?.id||null;renderScenes();renderSettings();renderPreview();setStatus('Scene removed from this unsaved storyboard.');}return;}
      const settingsAction=event.target.closest('[data-settings-action]');if(settingsAction){if(settingsAction.dataset.settingsAction==='image')chooseImage();else showPlaceholder(settingsAction.dataset.settingsAction);return;}
      const action=event.target.closest('[data-action]')?.dataset.action;if(action==='add'){addScene();return;}if(action==='reorder'){reorder=!reorder;setStatus(reorder?'Reorder mode: use the scene cards’ move controls in the next phase.':'Reorder mode closed.');return;}if(action==='save'){setStatus('Save Project is a placeholder in this UI milestone. Persistent project storage is planned.');return;}if(action==='project-menu'){openProjectMenu();return;}if(action==='generate-all'){setStatus('Generate All is reserved for a later phase. Generate scenes individually for now; each request can consume Runway credits.');return;}
      const card=event.target.closest('[data-scene]');if(card)selectScene(card.dataset.scene);
    });
    root.addEventListener('change',event=>{
      if(event.target.matches('[data-discovery-files]')){const label=root.querySelector('[data-discovery-file-names]');if(label)label.textContent=event.target.files.length?Array.from(event.target.files).map(file=>file.name).join(', '):'No files selected';return;}
      const bind=event.target.dataset.bind;if(bind){const s=selected();s[bind]=bind==='duration'?Number(event.target.value):event.target.value;if(bind==='status')renderScenes();if(bind==='title'||bind==='description'||bind==='duration'||bind==='ratio')renderScenes();renderPreview();return;}
      if(event.target.matches('[data-image-input]')){const file=event.target.files&&event.target.files[0];if(file){const s=selected();s.imageFile=file;s.image=URL.createObjectURL(file);s.status='Ready to generate';renderScenes();renderSettings();renderPreview();}}
    });
    root.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-scene]')){event.preventDefault();selectScene(event.target.dataset.scene);}});
    renderScenes();renderSettings();renderPreview();
    root.dataset.videoWorkspaceInitialized='1';
  }
  window.SvaraVideoWorkspace={render};
})();