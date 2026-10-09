(()=>{
  const workspace=document.querySelector('.workspace');
  const voiceView=document.getElementById('voiceWorkspace');
  const libraryView=document.getElementById('myLibraryView');
  const voiceLink=document.querySelector('aside a[href="#voice"]');
  const soundLink=document.querySelector('aside a[href="#sound"]');
  const videoLink=document.querySelector('aside a[href="#video"]');
  const composeLink=document.querySelector('aside a[href="#compose"]');
  const libraryLink=document.querySelector('aside a[href="#library"]');
  const homeLink=document.querySelector('aside .home-link');
  const svaraFlowToggle=document.getElementById('svaraFlowToggle');
  if(!workspace||!voiceView||!libraryView||!voiceLink||!libraryLink||!homeLink)return;

  const assets={
    voice:'/api/branding/studio-voice-card.png',
    sound:'/api/branding/studio-sound-card.png',
    video:'/api/branding/studio-video-card.png',
    compose:'/api/branding/studio-compose-card.png'
  };

  const icons={
    voice:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 3v18M23 10v4"/></svg>',
    sound:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h4l5 4V5.5l-5 4z"/><path d="M17 9.2a4.2 4.2 0 0 1 0 5.6M19.5 6.8a7.5 7.5 0 0 1 0 10.4"/></svg>',
    video:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="12" height="12" rx="2"/><path d="m15 10 6-3v10l-6-3z"/></svg>',
    compose:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7z"/><path d="m19 3 .7 2.3L22 6l-2.3.7L19 9l-.7-2.3L16 6l2.3-.7z"/></svg>'
  };

  const soundStyle=document.createElement('style');
  soundStyle.textContent=`
    .sound-workspace{grid-column:1/-1;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(380px,.92fr);gap:18px;align-items:start;min-height:calc(100vh - 124px)}
    .sound-panel{border:1px solid #ffffff10;background:linear-gradient(180deg,#0a1020,#080d19);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px #0004}
    .sound-panel-head{padding:22px 22px 17px;border-bottom:1px solid #ffffff0b;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
    .sound-panel-head small{color:#a66cff;font-size:9px;letter-spacing:.2em;font-weight:800}.sound-panel-head h2{margin:6px 0 0;font-size:23px;letter-spacing:-.04em}.sound-panel-head p{margin:7px 0 0;color:#8091a8;font-size:11px;line-height:1.5}
    .sound-flow{display:flex;align-items:center;gap:9px;white-space:nowrap;padding:7px 10px;border:1px solid #a85cff45;border-radius:999px;background:#26143a;color:#d7b9ff;font-size:10px;font-weight:750}.sound-flow-dot{width:8px;height:8px;border-radius:50%;background:#c06cff;box-shadow:0 0 12px #c06cff99}.sound-flow.off{background:#101625;border-color:#ffffff14;color:#75879b}.sound-flow.off .sound-flow-dot{background:#66788c;box-shadow:none}
    .sound-prompt{margin:18px 20px 0}.sound-prompt textarea{width:100%;min-height:145px;resize:vertical;border:1px solid #ffffff12;border-radius:14px;background:#050a14;color:#edf4ff;padding:16px;font:13px/1.65 Inter,system-ui,sans-serif;outline:none}.sound-prompt textarea:focus{border-color:#a75cff77;box-shadow:0 0 0 3px #a75cff12}.sound-prompt-foot{display:flex;justify-content:space-between;gap:10px;margin-top:7px;color:#60738a;font-size:9px}.sound-inspire{border:0;background:transparent;color:#b878ff;font:700 10px Inter;cursor:pointer;padding:0}
    .sound-section{padding:18px 20px 0}.sound-label{display:block;margin-bottom:9px;color:#73879e;font-size:9px;letter-spacing:.14em;font-weight:800}.sound-type-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:7px}.sound-choice{min-height:58px;border:1px solid #ffffff0d;border-radius:11px;background:#09111e;color:#8fa1b5;cursor:pointer;padding:8px 5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;transition:.16s ease;font:600 9px Inter}.sound-choice svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.sound-choice:hover{background:#101525;color:#d8e1ec;border-color:#ffffff1b}.sound-choice.active{background:linear-gradient(145deg,#24153b,#101d35);color:#d7a8ff;border-color:#a85cff77;box-shadow:inset 0 0 18px #a85cff10}
    .sound-moods{display:flex;flex-wrap:wrap;gap:7px}.sound-mood{border:1px solid #ffffff0d;border-radius:999px;background:#09111e;color:#8295aa;padding:8px 11px;font:600 9px Inter;cursor:pointer}.sound-mood:hover{color:#dce6f2;background:#101525}.sound-mood.active{color:#e0bdff;background:#2a1640;border-color:#a85cff66}
    .sound-control-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.sound-control{border:1px solid #ffffff0d;border-radius:12px;background:#09111e;padding:11px 12px}.sound-control-top{display:flex;justify-content:space-between;gap:8px;margin-bottom:9px;color:#91a3b7;font-size:9px}.sound-control-top strong{color:#e1ebf5;font-size:10px}.sound-control select{width:100%;border:1px solid #ffffff0d;background:#0b1524;color:#dbe7f3;border-radius:8px;padding:8px;font:600 10px Inter;outline:none}.sound-range{width:100%;height:5px;appearance:none;-webkit-appearance:none;background:#30394a;border-radius:999px;outline:none}.sound-range::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:17px;height:17px;border:0;border-radius:50%;background:#b568ff;box-shadow:0 0 0 3px #b568ff14;cursor:pointer}.sound-range::-moz-range-thumb{width:17px;height:17px;border:0;border-radius:50%;background:#b568ff;cursor:pointer}
    .sound-advanced{margin:14px 20px 0;border-top:1px solid #ffffff0b;padding-top:13px}.sound-advanced-toggle{display:flex;align-items:center;justify-content:space-between;color:#8799ad;font-size:10px;font-weight:700;cursor:pointer}.sound-advanced-toggle span:last-child{color:#b568ff;font-size:9px}.sound-advanced-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:11px}.sound-advanced-body[hidden]{display:none}.sound-advanced-item{padding:10px 11px;border:1px solid #ffffff0b;border-radius:10px;background:#08101c}.sound-advanced-item label{display:flex;justify-content:space-between;color:#8193a7;font-size:9px}.sound-advanced-item input,.sound-advanced-item select{width:100%;margin-top:8px}
    .sound-generate{width:calc(100% - 40px);margin:18px 20px 7px;border:0;border-radius:12px;padding:14px 16px;background:linear-gradient(105deg,#5c73ff,#8c4cf3 55%,#c15cff);color:#fff;font:800 11px Inter;cursor:pointer;box-shadow:0 10px 30px #7a4cf32a;transition:.18s ease}.sound-generate:hover{transform:translateY(-1px);filter:brightness(1.06)}.sound-generate:disabled{opacity:.72;cursor:wait;transform:none}.sound-generation-note{text-align:center;color:#586c82;font-size:9px;padding:0 20px 17px}
    .sound-output{min-height:610px}.sound-output-body{padding:20px}.sound-empty{min-height:480px;display:grid;place-items:center;align-content:center;text-align:center;padding:25px}.sound-empty-wave{height:88px;display:flex;align-items:center;gap:4px;margin-bottom:22px}.sound-empty-wave i{width:3px;border-radius:99px;background:linear-gradient(180deg,#a75cff,#3d7bff);height:var(--h);opacity:.32}.sound-empty h3{margin:0;color:#a8b7c8;font-size:14px}.sound-empty p{max-width:310px;margin:8px auto 0;color:#5f7289;font-size:10px;line-height:1.6}.sound-result{display:none}.sound-result.show{display:block}.sound-main-card{border:1px solid #a85cff33;border-radius:15px;background:linear-gradient(145deg,#111326,#0b1120);overflow:hidden;box-shadow:inset 0 0 30px #9c5cff08}.sound-result-top{padding:15px 16px;border-bottom:1px solid #ffffff0a;display:flex;align-items:center;justify-content:space-between;gap:12px}.sound-result-top strong{font-size:12px}.sound-result-top span{color:#8f6bb5;font-size:9px}.sound-wave{height:115px;margin:17px;border-radius:12px;border:1px solid #ffffff0a;background:#060a14;display:flex;align-items:center;justify-content:center;gap:3px;padding:10px;overflow:hidden}.sound-wave i{width:3px;min-height:5px;height:var(--h);border-radius:99px;background:linear-gradient(180deg,#d36cff,#5377ff);opacity:.78;transform-origin:center}.sound-wave.playing i{animation:soundPulse .72s ease-in-out infinite alternate}.sound-wave.playing i:nth-child(2n){animation-delay:-.2s}.sound-wave.playing i:nth-child(3n){animation-delay:-.4s}@keyframes soundPulse{from{transform:scaleY(.55);opacity:.45}to{transform:scaleY(1.08);opacity:.95}}
    .sound-player-row{display:flex;align-items:center;gap:12px;padding:0 17px 17px}.sound-play{width:43px;height:43px;flex:none;border:0;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#6975ff,#bd59ff);cursor:pointer;box-shadow:0 0 22px #a85cff28}.sound-play span{width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;border-left:9px solid #fff;margin-left:2px}.sound-time{display:flex;justify-content:space-between;color:#71839a;font-size:9px;flex:1}.sound-time strong{color:#c4d1de;font-size:10px}
    .sound-actions{display:flex;gap:8px;padding:0 17px 17px}.sound-action{flex:1;border:1px solid #ffffff12;border-radius:10px;background:#0b1523;color:#aab9c8;padding:10px;font:700 9px Inter;cursor:pointer}.sound-action.primary{background:linear-gradient(105deg,#263b72,#7439a4);border-color:#a85cff55;color:#fff}
    .sound-variations{margin-top:16px}.sound-subhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.sound-subhead small{color:#75889f;font-size:9px;letter-spacing:.14em;font-weight:800}.sound-subhead span{color:#5e7289;font-size:8px}.sound-variation{display:flex;align-items:center;gap:10px;padding:11px;border:1px solid #ffffff0b;border-radius:11px;background:#09111e;margin-bottom:7px}.sound-mini-play{width:28px;height:28px;border-radius:50%;border:1px solid #a85cff44;background:#18122a;color:#ca82ff;display:grid;place-items:center;cursor:pointer;font-size:9px}.sound-variation-copy{min-width:0;flex:1}.sound-variation-copy strong{display:block;color:#cdd9e5;font-size:10px}.sound-variation-copy small{display:block;margin-top:3px;color:#61758c;font-size:8px}.sound-variation-wave{height:26px;width:100px;display:flex;align-items:center;gap:2px}.sound-variation-wave i{width:2px;height:var(--h);background:#7253a8;border-radius:99px;opacity:.7}.sound-mock-note{margin-top:14px;padding:10px 11px;border:1px solid #a85cff22;border-radius:10px;background:#120e1d;color:#786b8a;font-size:8px;line-height:1.5}.sound-mock-note strong{color:#a97dca}
    .sound-history-workspace{grid-column:1/-1;border:1px solid #ffffff10;background:linear-gradient(180deg,#0a1020,#080d19);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px #0004}
    .sound-history-head{padding:22px;border-bottom:1px solid #ffffff0b;display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
    .sound-history-head small{color:#a66cff;font-size:9px;letter-spacing:.2em;font-weight:800}.sound-history-head h2{margin:6px 0 0;font-size:22px;letter-spacing:-.04em}.sound-history-head p{margin:7px 0 0;color:#8091a8;font-size:11px;line-height:1.5}
    .sound-history-refresh{border:1px solid #ffffff12;border-radius:9px;background:#0b1523;color:#aebdcb;padding:9px 12px;font:700 9px Inter;cursor:pointer}.sound-history-refresh:hover{background:#111e2e;color:#fff}
    .sound-history-list{padding:14px 20px 20px;display:grid;gap:8px}
    .sound-history-table-head{display:grid;grid-template-columns:minmax(0,2.5fr) 70px 70px 90px minmax(90px,1fr) 90px 135px 140px;gap:12px;padding:10px 34px;color:#62768b;font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid #ffffff0b}.sound-history-item{display:grid;grid-template-columns:minmax(0,2.5fr) 70px 70px 90px minmax(90px,1fr) 90px 135px 140px;gap:12px;align-items:center;padding:13px 14px;border:1px solid #ffffff0b;border-radius:11px;background:#09111e}.sound-history-actions{display:flex;align-items:center;justify-content:flex-start;gap:8px;min-width:112px;overflow:visible}.sound-history-actions .sound-history-play,.sound-history-actions .sound-history-download,.sound-history-actions .sound-history-move{margin:0;position:static;z-index:auto}.sound-history-main{min-width:0}
    .sound-history-item:hover{border-color:#a85cff24;background:#0b1523}
    .sound-history-move{border:1px solid #ffffff10;border-radius:50%;background:#0b1523;color:#cdb0ff;padding:0;width:30px;height:30px;font:700 11px Inter;cursor:pointer;display:flex;align-items:center;justify-content:center}.sound-history-move:hover{background:#151f30;color:#fff;border-color:#a85cff44}
    .sound-history-download{border:1px solid #ffffff10;border-radius:50%;background:#0b1523;color:#cdb0ff;padding:0;width:30px;height:30px;font:700 12px Inter;cursor:pointer;display:flex;align-items:center;justify-content:center}.sound-history-download:hover:not(:disabled){background:#151f30;color:#fff;border-color:#a85cff44}.sound-history-download:disabled{opacity:.28;cursor:default}
    .sound-history-play{width:30px;height:30px;border:1px solid #ffffff10;border-radius:50%;background:#0b1523;color:#cdb0ff;font:700 11px Inter;cursor:pointer;display:flex;align-items:center;justify-content:center}.sound-history-play:hover:not(:disabled){background:#151f30;color:#fff;border-color:#a85cff44}.sound-history-play:disabled{opacity:.28;cursor:default}
    .sound-history-main{min-width:0}.sound-history-main strong{display:block;color:#dce8f3;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sound-history-main small{display:block;margin-top:4px;color:#667b91;font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .sound-history-meta{color:#91a3b7;font-size:9px;white-space:nowrap}.sound-history-status{font-size:8px;text-transform:uppercase;letter-spacing:.08em;font-weight:800}.sound-history-status.ready{color:#31e3c8}.sound-history-status.processing{color:#d7a8ff}.sound-history-status.failed,.sound-history-status.storage_failed{color:#ef7777}
    .sound-history-state{padding:45px 20px;text-align:center;color:#71869d}.sound-history-state strong{display:block;color:#b7c7d7;font-size:12px}.sound-history-state span{display:block;margin-top:6px;font-size:10px}
    @media(max-width:900px){.sound-history-table-head{display:none}.sound-history-item{grid-template-columns:minmax(180px,1fr) 90px 90px}.sound-history-item .sound-history-meta:nth-child(n+4){display:none}.sound-history-actions{grid-column:1/-1}}
    @media(max-width:560px){.sound-history-head{padding:16px}.sound-history-list{padding:12px}.sound-history-item{grid-template-columns:1fr 80px}.sound-history-item .sound-history-meta:nth-child(n+3){display:none}}
    .sound-history-toolbar{display:flex;gap:8px;align-items:center;padding:12px 20px;border-bottom:1px solid #ffffff0b;flex-wrap:wrap}
    .sound-history-toolbar input,.sound-history-toolbar select{border:1px solid #ffffff10;border-radius:9px;background:#091522;color:#b9c8d6;padding:9px 10px;font:600 9px Inter;outline:none}
    .sound-history-toolbar input{flex:1 1 220px;min-width:180px}.sound-history-toolbar select{min-width:105px}
    .sound-history-toolbar input:focus,.sound-history-toolbar select:focus{border-color:#a85cff55;box-shadow:0 0 0 3px #a85cff10}
    .sound-history-pagination{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px 16px;border-top:1px solid #ffffff0b;color:#65798e;font-size:9px}
    .sound-history-page-button{border:1px solid #ffffff10;border-radius:8px;background:#091522;color:#aebdcb;padding:8px 10px;font:700 9px Inter;cursor:pointer}.sound-history-page-button:hover:not(:disabled){background:#111e2e;color:#fff}.sound-history-page-button:disabled{opacity:.35;cursor:default}
    @media(max-width:560px){.sound-history-toolbar{padding:10px 12px}.sound-history-toolbar input,.sound-history-toolbar select{flex:1 1 140px}.sound-history-pagination{padding-left:12px;padding-right:12px}}
    @media(max-width:1050px){.sound-workspace{grid-template-columns:1fr}.sound-output{min-height:0}.sound-empty{min-height:280px}.sound-type-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    @media(max-width:560px){.sound-workspace{display:block}.sound-workspace>*{margin-bottom:12px}.sound-panel-head{padding:18px 15px}.sound-flow{display:none}.sound-prompt,.sound-section{margin-left:14px;margin-right:14px}.sound-control-grid{grid-template-columns:1fr}.sound-advanced{margin-left:14px;margin-right:14px}.sound-generate{width:calc(100% - 28px);margin-left:14px;margin-right:14px}.sound-type-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.sound-output-body{padding:12px}.sound-wave{margin:12px}.sound-actions{padding-left:12px;padding-right:12px}.sound-player-row{padding-left:12px;padding-right:12px}.sound-variation-wave{width:70px}}
  `;
  document.head.appendChild(soundStyle);

  const composeStyle=document.createElement('style');
  composeStyle.textContent=`
    aside a.active[href="#compose"]{background:linear-gradient(100deg,#162d66,#12234e);color:#5f8cff;box-shadow:inset 0 0 0 1px #4f7cff66}
    aside a.active[href="#compose"]:hover{background:linear-gradient(100deg,#1a3678,#152a5d);color:#75a0ff}
    .compose-workspace{grid-column:1/-1;min-height:calc(100vh - 124px);display:flex;flex-direction:column;gap:18px}
    .compose-head{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:24px 24px 20px;border:1px solid #4f7cff22;border-radius:18px;background:linear-gradient(180deg,#0a1020,#080d19);box-shadow:0 20px 60px #0004}.compose-head-copy{min-width:0}.compose-head-actions{display:flex;align-items:center;justify-content:flex-end;flex:0 0 auto}.compose-export-trigger{min-height:40px;padding:0 17px;border:1px solid #4f7cff77;border-radius:10px;background:linear-gradient(105deg,#233f87,#173166);color:#dce7ff;font:800 10px Inter;letter-spacing:.05em;cursor:pointer;box-shadow:0 9px 24px #0004}.compose-export-trigger:hover:not(:disabled){background:linear-gradient(105deg,#3155ad,#204184);border-color:#7da3ff}.compose-export-trigger:disabled{opacity:.42;cursor:not-allowed}
    .compose-head small{color:#5f8cff;font-size:9px;letter-spacing:.2em;font-weight:800}
    .compose-head h2{margin:7px 0 0;font-size:24px;letter-spacing:-.04em}
    .compose-head p{margin:7px 0 0;color:#8091a8;font-size:11px;line-height:1.55}
    .compose-canvas{flex:1;min-height:480px;border:1px solid #4f7cff22;border-radius:18px;background:linear-gradient(180deg,#09121f,#070d18);box-shadow:0 20px 60px #0004;display:grid;place-items:center;padding:30px}
    .compose-empty{text-align:center;max-width:430px}
    .compose-empty p{margin:8px 0 20px;color:#71869d;font-size:10px;line-height:1.6}
    .compose-add-track{border:1px solid #4f7cff66;border-radius:11px;background:linear-gradient(105deg,#12265a,#12213d);color:#5f8cff;padding:12px 18px;font:800 10px Inter;cursor:pointer;box-shadow:0 10px 28px #0003}
    .compose-add-track:hover{background:linear-gradient(105deg,#193274,#172a4e);color:#fff}
    .compose-track-modal{position:fixed;inset:0;z-index:1300;display:flex;align-items:center;justify-content:center;padding:24px}
    .compose-track-backdrop{position:absolute;inset:0;background:#020611cc;backdrop-filter:blur(6px)}
    .compose-track-dialog{position:relative;width:min(560px,calc(100vw - 32px));padding:24px;border:1px solid #4f7cff44;border-radius:18px;background:linear-gradient(180deg,#0b1426,#080f1c);box-shadow:0 28px 90px #000b;color:#dbe7f5}
    .compose-track-subtitle{max-width:390px}
    .compose-timeline{width:min(1120px,100%);margin:0 auto;overflow-x:auto;overflow-y:hidden;scrollbar-color:#4f7cff #07101d;scrollbar-width:auto;overscroll-behavior-x:contain}
    .compose-timeline::-webkit-scrollbar{height:10px}
    .compose-timeline::-webkit-scrollbar-track{background:#07101d;border-radius:999px}
    .compose-timeline::-webkit-scrollbar-thumb{background:linear-gradient(90deg,#365bd0,#5f8cff);border:2px solid #07101d;border-radius:999px}
    .compose-timeline::-webkit-scrollbar-thumb:hover{background:linear-gradient(90deg,#4b72e8,#7da3ff)}
    .compose-transport-button{height:32px;padding:0 14px;border:1px solid #4f7cff66;border-radius:9px;background:linear-gradient(105deg,#12265a,#12213d);color:#7ea5ff;font:800 10px Inter;cursor:pointer;box-shadow:0 8px 20px #0003}
    .compose-transport-button:hover{background:linear-gradient(105deg,#193274,#172a4e);color:#fff}
    .compose-transport-button.active{border-color:#31e3c855;background:#0d2930;color:#31e3c8}
    .compose-timeline-ruler{display:grid;grid-template-columns:180px minmax(720px,1fr);align-items:stretch;margin-bottom:8px;min-width:900px}
    .compose-timeline-label{position:sticky;left:0;z-index:13;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:7px;min-height:58px;padding:8px 12px;color:#5f7390;font-size:8px;font-weight:800;letter-spacing:.16em;background:#09121f;box-shadow:8px 0 18px #0005}
    .compose-timeline-label .compose-transport-button{flex:0 0 auto}
    .compose-timeline-label>span{display:block}
    .compose-timeline-scale{position:relative;height:28px;padding:0;border-left:1px solid #ffffff08;border-bottom:1px solid #ffffff12;flex:0 0 auto;pointer-events:auto;cursor:ew-resize;touch-action:none}
    .compose-timeline-scale:before{content:"";position:absolute;left:0;right:0;bottom:0;height:9px;background:repeating-linear-gradient(to right,#ffffff20 0,#ffffff20 1px,transparent 1px,var(--compose-second-pitch,24px) var(--compose-second-pitch,24px))}
    .compose-timeline-scale .compose-timeline-ruler-mark{position:absolute;bottom:10px;transform:translateX(-50%);color:#7186a0;font-size:8px;font-variant-numeric:tabular-nums;white-space:nowrap}
    .compose-timeline-scale .compose-timeline-ruler-mark:first-child{transform:none}
    .compose-timeline-scale .compose-timeline-playhead{transform:translateX(-1px)}
    .compose-timeline-playhead{position:absolute;top:0;bottom:0;left:var(--timeline-playhead,0%);z-index:6;width:2px;background:#d7e2ff;box-shadow:0 0 10px #5f8cffaa;transform:translateX(-1px);pointer-events:none;opacity:.95}
    .compose-timeline-playhead:before{content:"";position:absolute;top:-1px;left:50%;width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 9px #5f8cffcc;transform:translateX(-50%)}
    .compose-timeline-list{display:flex;flex-direction:column;gap:7px;min-width:900px;width:max-content}
    .compose-add-track-inline{display:block;margin:14px auto 0}
    .compose-track-editor{display:grid;grid-template-columns:180px var(--compose-timeline-width,720px);grid-template-rows:auto;gap:0;border:1px solid #ffffff0d;border-radius:11px;background:#07121d;overflow:visible}
    .compose-track-editor.selected{border-color:#4f7cff66;box-shadow:inset 0 0 0 1px #4f7cff22}
    .compose-track-identity{grid-column:1;grid-row:1;position:sticky;left:0;z-index:12;display:flex;flex-direction:column;align-items:stretch;gap:8px;min-width:0;min-height:100%;padding:12px;border-right:1px solid #ffffff0b;background:#091522;box-shadow:8px 0 18px #0005;cursor:pointer}
    .compose-track-identity .compose-track-row-main{min-width:0;display:flex;flex-direction:column;gap:4px;padding:0;margin:2px 0 4px}
    .compose-track-identity-actions{display:flex;align-items:center;gap:8px;min-height:30px}
    .compose-track-move{width:34px;height:30px;border:1px solid #4f7cff44;border-radius:8px;background:#0d1c31;color:#6f91d9;display:grid;place-items:center;font-size:15px;line-height:1;cursor:grab;padding:0;letter-spacing:-3px}
    .compose-track-move:hover{background:#12264a;color:#a9c2ff;border-color:#5f8cff77}
    .compose-track-move:active{cursor:grabbing;background:#162e5a;color:#d7e2ff}
    .compose-track-delete-icon{width:34px;height:30px;border:1px solid #7a3d3d55;border-radius:8px;background:#0d1c31;color:#b98a8a;display:grid;place-items:center;cursor:pointer;padding:0}
    .compose-track-delete-icon svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .compose-track-delete-icon:hover{background:#3a1717;color:#f0b0b0;border-color:#a85b5b88}
    .compose-track-lane{position:relative;grid-column:2;grid-row:1;display:flex;align-items:center;min-height:92px;width:var(--compose-timeline-width,720px);padding:10px 0;background-color:#060d17;background-image:repeating-linear-gradient(to right,#ffffff18 0 1px,transparent 1px var(--compose-five-second-pitch,120px));overflow:hidden}
    .compose-track-region{position:relative;z-index:2;display:flex;align-items:center;width:120px;min-width:120px;flex:0 0 auto;cursor:grab;transition:margin-left .08s ease}
    .compose-track-region:hover{filter:brightness(1.05)}
    .compose-track-region:active{cursor:grabbing}
    .compose-track-editor.dragging .compose-track-region{cursor:grabbing;transition:none;filter:brightness(1.08)}
    .compose-track-editor.dragging .compose-track-wave{filter:drop-shadow(0 0 7px #4f7cff66)}
    .compose-track-time-guide{position:absolute;top:2px;left:0;z-index:4;padding:3px 6px;border:1px solid #4f7cff66;border-radius:5px;background:#071426ee;color:#a9c2ff;font:700 8px Inter;opacity:0;pointer-events:none;white-space:nowrap;transform:translateY(-100%)}
    .compose-track-editor.dragging .compose-track-time-guide{opacity:1}
    .compose-track-wave{position:relative;z-index:1;height:68px;display:flex;align-items:center;gap:2px;width:100%;flex:0 0 auto;overflow:hidden;padding:0 8px;border:1px solid #4f7cff33;border-radius:8px;background:#0b1a2b}
    .compose-track-wave:before,.compose-track-wave:after{content:"";position:absolute;top:0;bottom:0;z-index:2;background:#06101dcc;pointer-events:none}
    .compose-track-wave:before{left:0;width:var(--trim-left,0%);border-right:1px solid #4f7cff55}
    .compose-track-wave:after{right:0;width:var(--trim-right,0%);border-left:1px solid #4f7cff55}
    .compose-track-trim-handle{position:absolute;top:4px;bottom:4px;z-index:4;width:8px;border:1px solid #9ab8ff;border-radius:4px;background:#5f8cff;box-shadow:0 0 12px #4f7cff66;cursor:ew-resize;opacity:.9}
    .compose-track-trim-handle:hover,.compose-track-editor.trimming .compose-track-trim-handle{background:#8eb0ff;opacity:1;box-shadow:0 0 15px #4f7cff99}
    .compose-track-trim-handle.left{left:var(--trim-left,0%);transform:translateX(-50%)}
    .compose-track-trim-handle.right{left:calc(100% - var(--trim-right,0%));transform:translateX(-50%)}
    .compose-track-trim-handle:after{content:"";position:absolute;left:2px;top:50%;width:2px;height:18px;border-radius:2px;background:#fff;transform:translateY(-50%);opacity:.9}
    .compose-track-fade-indicator{position:absolute;top:0;bottom:0;z-index:3;pointer-events:none;border-radius:7px;overflow:hidden}
    .compose-track-fade-indicator.in{left:var(--fade-in-left,0%);width:var(--fade-in-width,0%)}
    .compose-track-fade-indicator.out{right:var(--fade-out-right,0%);width:var(--fade-out-width,0%)}
    .compose-track-fade-indicator.in:before,.compose-track-fade-indicator.out:before{content:"";position:absolute;inset:0;background:#071426aa}
    .compose-track-fade-indicator.in:before{clip-path:polygon(0 0,100% 0,0 100%)}
    .compose-track-fade-indicator.out:before{clip-path:polygon(0 0,100% 0,100% 100%)}
    .compose-track-fade-indicator.in:after,.compose-track-fade-indicator.out:after{display:none}
    .compose-track-trim-readout{position:absolute;left:50%;top:-8px;z-index:6;transform:translate(-50%,-100%);padding:4px 7px;border:1px solid #4f7cff66;border-radius:5px;background:#071426ee;color:#b9ccff;font:700 8px Inter;white-space:nowrap;opacity:0;pointer-events:none}
    .compose-track-editor.trimming .compose-track-trim-readout{opacity:1}
    .compose-track-wave-bars{display:flex;align-items:center;gap:2px;width:100%;height:100%;flex:0 0 auto;overflow:hidden;pointer-events:none}.compose-track-wave i{width:3px;flex:0 0 3px;min-width:3px;height:var(--h);min-height:4px;border-radius:99px;background:#7da3ff;opacity:.86;transform-origin:center}
    .compose-track-playhead{position:absolute;top:0;bottom:0;left:var(--playhead,0%);z-index:5;width:2px;background:#b8caff;box-shadow:0 0 9px #5f8cff99;transform:translateX(-1px);pointer-events:none;opacity:.95}
    .compose-track-playhead:before{content:"";position:absolute;top:-1px;left:50%;width:7px;height:7px;border-radius:50%;background:#d7e2ff;box-shadow:0 0 8px #5f8cffaa;transform:translateX(-50%)}
    .compose-track-wave.scrubbing{cursor:ew-resize}
    .compose-track-play{width:30px;height:30px;border:1px solid #4f7cff55;border-radius:8px;background:#102554;color:#8eb0ff;display:grid;place-items:center;font-size:11px;cursor:pointer;padding:0}
    .compose-track-play:disabled{opacity:.45;cursor:not-allowed}
    .compose-track-controls{display:flex;flex-direction:column;align-items:stretch;gap:8px;margin-top:auto;padding-top:8px;border-top:1px solid #ffffff08;flex-wrap:nowrap}
    .compose-track-volume,.compose-track-fade{display:grid;grid-template-columns:48px minmax(0,1fr) 32px;align-items:center;gap:7px;min-width:0;color:#6f849b;font-size:9px}
    .compose-track-volume input,.compose-track-fade input{width:100%;min-width:0;accent-color:#5f8cff}
    .compose-track-control{height:30px;padding:0 12px;border:1px solid #4f7cff44;border-radius:8px;background:#0d1c31;color:#91a9d6;font:700 9px Inter;cursor:pointer;transition:.15s ease}
    .compose-track-control:hover{background:#12264a;color:#cbd9f4;border-color:#5f8cff66}
    .compose-track-control.active{background:#162e5a;border-color:#5f8cff88;color:#cbd9ff;box-shadow:inset 0 0 14px #4f7cff18}
    .compose-track-delete{color:#b98a8a;border-color:#7a3d3d55}
    .compose-track-delete:hover{background:#3a1717;color:#f0b0b0;border-color:#a85b5b88}
    .compose-track-toggle-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .compose-track-editor.muted .compose-track-volume{color:#4f6279}
    .compose-track-editor.muted .compose-track-volume input{opacity:.42;filter:grayscale(.45)}
    .compose-track-editor.muted .compose-track-volume span{color:#61758d}
    .compose-track-editor.solo-muted .compose-track-volume{opacity:.55}
    .compose-track-editor.solo-muted .compose-track-volume span{color:#4f6279}

    .compose-track-fade-value{min-width:32px;color:#9ab8ff;font-size:8px;text-align:right;font-variant-numeric:tabular-nums}
    .compose-track-fade input{accent-color:#7da3ff}
    .compose-track-row{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #4f7cff22;border-radius:11px;background:#091522}
    .compose-track-row-icon{width:32px;height:32px;display:grid;place-items:center;border-radius:8px;background:#102554;color:#5f8cff;font-size:12px;flex:0 0 32px}
    .compose-track-row-main{min-width:0;display:flex;flex-direction:column;gap:4px;flex:1}
    .compose-track-row-main strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#dbe7f5;font-size:11px}
    .compose-track-row-main span{color:#647b94;font-size:9px;text-transform:capitalize}
    .compose-track-row-status{color:#5f8cff;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .compose-finder-toolbar{display:flex;align-items:center;gap:14px;margin-bottom:14px}
    .compose-finder-back{border:0;background:transparent;color:#7890ad;font:700 10px Inter;cursor:pointer;padding:4px 0}
    .compose-finder-back:hover{color:#9ebcff}
    .compose-finder-title{display:flex;flex-direction:column;gap:3px}
    .compose-finder-title strong{color:#e4ecf7;font-size:13px}
    .compose-finder-title span{color:#667b91;font-size:9px}
    .compose-finder-controls{display:grid;grid-template-columns:minmax(0,1fr) 180px 180px;gap:9px;margin-bottom:12px}
    .compose-finder-type{width:100%;padding:10px 11px;border:1px solid #ffffff12;border-radius:9px;background:#07121d;color:#a9b9ca;font:inherit;font-size:10px;outline:0}
    .compose-finder-search{display:flex;align-items:center;gap:8px;padding:0 11px;border:1px solid #ffffff12;border-radius:9px;background:#07121d;color:#71869d}
    .compose-finder-search:focus-within{border-color:#4f7cff66}
    .compose-finder-search span{font-size:17px}
    .compose-finder-search input{width:100%;padding:10px 0;border:0;outline:0;background:transparent;color:#dbe7f5;font:inherit;font-size:11px}
    .compose-finder-folder{width:100%;padding:10px 11px;border:1px solid #ffffff12;border-radius:9px;background:#07121d;color:#a9b9ca;font:inherit;font-size:10px;outline:0}
    .compose-finder-list{height:260px;overflow:auto;border:1px solid #ffffff0d;border-radius:11px;background:#07111c;padding:5px}
    .compose-finder-state{min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;color:#647a91;font-size:10px;padding:20px}
    .compose-finder-state strong{color:#a9bad0;font-size:11px}
    .compose-finder-state span{max-width:330px;line-height:1.5}
    .compose-finder-item{width:100%;display:flex;align-items:center;gap:10px;padding:10px;border:1px solid transparent;border-radius:8px;background:transparent;color:#a9b9ca;text-align:left;cursor:pointer}
    .compose-finder-item:hover{background:#0b1b2d;border-color:#ffffff0b}
    .compose-finder-item.active{background:#102554;border-color:#4f7cff66;color:#e1ebff}
    .compose-finder-icon{width:26px;height:26px;display:grid;place-items:center;border-radius:7px;background:#0d1c2d;color:#5f8cff;font-size:12px;flex:0 0 26px}
    .compose-finder-main{min-width:0;display:flex;flex-direction:column;gap:3px;flex:1}
    .compose-finder-main strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px}
    .compose-finder-main small{color:#61768d;font-size:8px;text-transform:capitalize}
    .compose-finder-date{color:#61768d;font-size:8px;white-space:nowrap}
    .compose-track-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:20px}
    .compose-track-eyebrow{margin:0;color:#5f8cff;font-size:9px;letter-spacing:.2em;font-weight:800}
    .compose-track-head h3{margin:7px 0 0;font-size:20px;letter-spacing:-.035em}
    .compose-track-head p{margin:6px 0 0;color:#71869d;font-size:10px;line-height:1.5}
    .compose-track-close{width:32px;height:32px;border:1px solid #ffffff12;border-radius:9px;background:#0c1728;color:#91a5bb;font-size:20px;line-height:1;cursor:pointer}
    .compose-track-close:hover{color:#fff;border-color:#4f7cff55}
    .compose-track-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}
    .compose-track-option{min-height:72px;border:1px solid #ffffff10;border-radius:12px;background:#091522;color:#8fa2b7;padding:11px 8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;font:700 9px Inter;cursor:pointer;transition:.16s ease}
    .compose-track-option:hover{background:#0d1c31;color:#dbe7f5;border-color:#ffffff22}
    .compose-track-option.active{background:linear-gradient(145deg,#132b60,#0e1c38);color:#75a0ff;border-color:#4f7cff88;box-shadow:inset 0 0 22px #4f7cff12}
    .compose-track-option svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
    .compose-track-footer{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:20px;padding-top:16px;border-top:1px solid #ffffff0b}
    .compose-track-selection{color:#667b91;font-size:9px}
    .compose-track-selection strong{color:#a9c0e0}
    .compose-import-track{border:1px solid #4f7cff66;border-radius:10px;background:linear-gradient(105deg,#24458f,#17336e);color:#fff;padding:11px 17px;font:800 10px Inter;cursor:pointer;box-shadow:0 8px 24px #193f8a33}
    .compose-import-track:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}
    .compose-import-track:disabled{opacity:.4;cursor:default}
    .compose-export-dialog{width:min(480px,calc(100vw - 32px))}.compose-export-form{display:grid;gap:14px;margin-top:18px}.compose-export-field{display:grid;gap:7px;color:#71869d;font-size:10px}.compose-export-field input,.compose-export-field select{width:100%;min-width:0;height:39px;padding:0 11px;border:1px solid #ffffff16;border-radius:9px;background:#07101d;color:#dbe7f5;font:11px Inter;outline:none}.compose-export-field input:focus{border-color:#5f8cff88;box-shadow:0 0 0 3px #4f7cff18}.compose-export-field select:disabled{opacity:.75}.compose-export-status{margin:0;color:#7288a1;font-size:10px;line-height:1.5;overflow-wrap:anywhere}.compose-export-status.error{color:#f0a4a4}.compose-export-actions{display:flex;justify-content:flex-end;gap:9px;padding-top:14px;border-top:1px solid #ffffff0b}.compose-export-submit,.compose-export-download{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 15px;border:1px solid #4f7cff66;border-radius:9px;background:linear-gradient(105deg,#24458f,#17336e);color:#fff;font:800 10px Inter;text-decoration:none;cursor:pointer}.compose-export-submit:disabled{opacity:.45;cursor:wait}.compose-export-cancel{min-height:36px;padding:0 13px;border:1px solid #ffffff14;border-radius:9px;background:#0c1728;color:#9bacbf;font:700 10px Inter;cursor:pointer}.compose-export-success{display:grid;gap:12px;padding-top:18px}.compose-export-success>strong{color:#8fdcc4;font-size:14px}.compose-export-success>p{margin:0;color:#9aacc0;font-size:10px;overflow-wrap:anywhere}.compose-export-preview{width:100%;height:40px}.compose-export-success .compose-export-download{justify-self:start}.compose-export-modal .compose-track-close:disabled{opacity:.4;cursor:wait}
    @media(max-width:560px){.compose-head{align-items:stretch;flex-direction:column;padding:18px 15px}.compose-head-actions{justify-content:flex-start}.compose-export-trigger{width:100%}.compose-canvas{min-height:400px;padding:20px}.compose-track-dialog{padding:18px}.compose-track-options{grid-template-columns:repeat(2,minmax(0,1fr))}.compose-track-footer{align-items:stretch;flex-direction:column}.compose-import-track{width:100%}.compose-finder-controls{grid-template-columns:1fr}.compose-finder-list{height:230px}.compose-finder-date{display:none}.compose-timeline-ruler{grid-template-columns:140px minmax(720px,1fr)}.compose-track-editor{grid-template-columns:140px minmax(720px,1fr)}.compose-track-identity{padding:10px 8px}.compose-track-select{display:none}}
  `;
  document.head.appendChild(composeStyle);

  const landing=document.createElement('section');
  landing.id='studioLanding';
  landing.className='studio-landing';
  landing.innerHTML=`
    <div class="studio-landing-hero">
      <p class="studio-landing-eyebrow">WELCOME TO SVARAONE STUDIO</p>
      <h1>What do you <span>want to create?</span></h1>
      <p class="studio-landing-lede">Create with voice, sound and video — or let SvaraFlow orchestrate your idea into one complete composition.</p>
    </div>
    <div class="studio-landing-grid">
      <a href="#voice" class="studio-domain-card" data-domain="voice" aria-label="Open Voice workspace">
        <img src="${assets.voice}" alt="" loading="eager" decoding="async">
        <span class="studio-card-top">${icons.voice}</span>
        <div class="studio-card-copy"><p class="studio-card-kicker">VOICE</p><h2>Create voices that connect.</h2><p class="studio-card-description">Natural, expressive voice creation for real creative work.</p><span class="studio-card-cta">Explore Voice <span aria-hidden="true">→</span></span></div>
      </a>
      <a href="#sound" class="studio-domain-card" data-domain="sound" aria-label="Open Sound workspace">
        <img src="${assets.sound}" alt="" loading="lazy" decoding="async">
        <span class="studio-card-top">${icons.sound}</span>
        <div class="studio-card-copy"><p class="studio-card-kicker">SOUND</p><h2>Create sound that moves.</h2><p class="studio-card-description">Music, SFX and sonic worlds built for your projects.</p><span class="studio-card-cta">Explore Sound <span aria-hidden="true">→</span></span></div>
      </a>
      <a href="#video" class="studio-domain-card" data-domain="video" aria-label="Open Video workspace">
        <img src="${assets.video}" alt="" loading="lazy" decoding="async">
        <span class="studio-card-top">${icons.video}</span>
        <div class="studio-card-copy"><p class="studio-card-kicker">VIDEO</p><h2>Create videos that inspire.</h2><p class="studio-card-description">Bring ideas to life through cinematic visual creation.</p><span class="studio-card-cta">Explore Video <span aria-hidden="true">→</span></span></div>
      </a>
    </div>
    <a href="#compose" class="studio-compose-card" aria-label="Compose with SvaraFlow">
      <img src="${assets.compose}" alt="" loading="lazy" decoding="async">
      <div class="studio-compose-copy"><p class="studio-compose-kicker">HAVE AN IDEA?</p><h2>Compose with <span>SvaraFlow</span></h2><p>Describe what you want to create and SvaraFlow understands your intent, orchestrates the right creative capabilities, and brings voice, sound and video into a single creative composition.</p><span class="studio-compose-cta">Start creating with SvaraFlow <span aria-hidden="true">→</span></span></div>
    </a>
    <div class="studio-landing-footer"><strong>ONE</strong> Intelligent Orchestration . <strong>THREE</strong> Creative Domains . <strong>ONE</strong> Studio</div>`;
  workspace.prepend(landing);

  const soundView=document.createElement('section');
  soundView.id='soundWorkspace';
  soundView.className='sound-workspace';
  soundView.hidden=true;
  soundView.innerHTML=`
    <section class="sound-panel">
      <div class="sound-panel-head">
        <div><small>SOUND STUDIO</small><h2>Create sound that moves.</h2><p>Shape music, sound effects, ambience and sonic worlds for your creative work.</p></div>
        <div id="soundFlowBadge" class="sound-flow"><span class="sound-flow-dot"></span>SvaraFlow ON</div>
      </div>
      <div class="sound-prompt">
        <textarea id="soundPrompt" maxlength="2000" placeholder="Describe the sound you want to create…">Cinematic emotional soundscape for a premium coffee advert — warm strings, subtle percussion, intimate atmosphere, gentle build.</textarea>
        <div class="sound-prompt-foot"><span id="soundPromptCount">0 / 2,000</span><button id="soundInspire" class="sound-inspire" type="button">✦ Inspire me</button></div>
      </div>
      <div class="sound-section"><span class="sound-label">TYPE</span>
        <div class="sound-type-grid">
          <button class="sound-choice active" type="button" data-sound-type="music"><svg viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>Music</button>
          <button class="sound-choice" type="button" data-sound-type="sfx"><svg viewBox="0 0 24 24"><path d="M4 9v6h4l6 4V5l-6 4z"/><path d="M18 9a4 4 0 0 1 0 6M20 6a8 8 0 0 1 0 12"/></svg>SFX</button>
          <button class="sound-choice" type="button" data-sound-type="ambience"><svg viewBox="0 0 24 24"><path d="M4 16c3-4 6-4 8 0s5 4 8 0"/><path d="M4 11c3-4 6-4 8 0s5 4 8 0"/></svg>Ambience</button>
          <button class="sound-choice" type="button" data-sound-type="loop"><svg viewBox="0 0 24 24"><path d="M4 8V5h3M20 16v3h-3"/><path d="M6 6a8 8 0 0 1 12 2M18 18a8 8 0 0 1-12-2"/></svg>Loop</button>
          <button class="sound-choice" type="button" data-sound-type="jingle"><svg viewBox="0 0 24 24"><path d="M8 18V6l10-2v12"/><circle cx="5" cy="18" r="3"/><circle cx="15" cy="16" r="3"/></svg>Jingle</button>
          <button class="sound-choice" type="button" data-sound-type="transition"><svg viewBox="0 0 24 24"><path d="M4 12h16M13 5l7 7-7 7"/></svg>Transition</button>
        </div>
      </div>
      <div class="sound-section"><span class="sound-label">MOOD</span>
        <div class="sound-moods"><button class="sound-mood" type="button">Cinematic</button><button class="sound-mood active" type="button">Emotional</button><button class="sound-mood" type="button">Dark</button><button class="sound-mood" type="button">Uplifting</button><button class="sound-mood" type="button">Peaceful</button><button class="sound-mood" type="button">Energetic</button><button class="sound-mood" type="button">Playful</button></div>
      </div>
      <div class="sound-section"><span class="sound-label">SHAPE</span>
        <div class="sound-control-grid">
          <div class="sound-control"><div class="sound-control-top"><span>Duration</span><strong>01:30</strong></div><select><option>00:30</option><option>01:00</option><option selected>01:30</option><option>02:00</option><option>03:00</option></select></div>
          <div class="sound-control"><div class="sound-control-top"><span>Tempo</span><strong id="soundTempoValue">100 BPM</strong></div><input id="soundTempo" class="sound-range" type="range" min="60" max="160" value="100"></div>
          <div class="sound-control"><div class="sound-control-top"><span>Intensity</span><strong id="soundIntensityValue">Medium</strong></div><input id="soundIntensity" class="sound-range" type="range" min="0" max="100" value="55"></div>
        </div>
      </div>
      <div class="sound-advanced">
        <div id="soundAdvancedToggle" class="sound-advanced-toggle" role="button" tabindex="0" aria-expanded="false"><span>Advanced sound controls</span><span>SHOW +</span></div>
        <div id="soundAdvancedBody" class="sound-advanced-body" hidden>
          <div class="sound-advanced-item"><label><span>Complexity</span><b id="soundComplexityValue">Balanced</b></label><input id="soundComplexity" class="sound-range" type="range" min="0" max="100" value="50"></div>
          <div class="sound-advanced-item"><label><span>Texture</span><b>Organic</b></label><select><option>Organic</option><option>Electronic</option><option>Hybrid</option><option>Minimal</option></select></div>
          <div class="sound-advanced-item"><label><span>Instrumental</span><b>ON</b></label><input type="checkbox" checked style="accent-color:#b568ff"></div>
          <div class="sound-advanced-item"><label><span>Exclude vocals</span><b>ON</b></label><input type="checkbox" checked style="accent-color:#b568ff"></div>
        </div>
      </div>
      <button id="soundGenerate" class="sound-generate" type="button">Generate Sound</button>
      <div class="sound-generation-note">Mockup only — generation is not connected to a provider yet.</div>
    </section>
    <section class="sound-panel sound-output">
      <div class="sound-panel-head"><div><small>OUTPUT</small><h2>Sound preview</h2><p>Preview the result and explore variations.</p></div></div>
      <div class="sound-output-body">
        <div id="soundEmpty" class="sound-empty">
          <div><div class="sound-empty-wave">${Array.from({length:38},(_,i)=>`<i style="--h:${18+(i*17)%61}px"></i>`).join('')}</div><h3>Your sound will appear here</h3><p>Describe an idea, shape its character and generate a sound asset.</p></div>
        </div>
        <div id="soundResult" class="sound-result">
          <div class="sound-main-card">
            <div class="sound-result-top"><strong>Cinematic Emotional Pad</strong><span>Music · 01:30</span></div>
            <div id="soundWave" class="sound-wave">${Array.from({length:74},(_,i)=>`<i style="--h:${12+(i*31)%78}px"></i>`).join('')}</div>
            <div class="sound-player-row"><button id="soundPlay" class="sound-play" type="button" aria-label="Play sound"><span></span></button><div class="sound-time"><strong id="soundCurrentTime">0:00</strong><span>01:30</span></div></div>
            <div class="sound-actions"><button class="sound-action primary" type="button">Download</button><button class="sound-action" type="button">Add to Library</button></div>
          </div>
          <div class="sound-variations"><div class="sound-subhead"><small>VARIATIONS</small><span>3 generated options</span></div>
            <div class="sound-variation"><button class="sound-mini-play" type="button">▶</button><div class="sound-variation-copy"><strong>Emotional Pad 01</strong><small>01:30 · Balanced</small></div><div class="sound-variation-wave">${Array.from({length:20},(_,i)=>`<i style="--h:${5+(i*11)%20}px"></i>`).join('')}</div></div>
            <div class="sound-variation"><button class="sound-mini-play" type="button">▶</button><div class="sound-variation-copy"><strong>Emotional Pad 02</strong><small>01:30 · Warmer</small></div><div class="sound-variation-wave">${Array.from({length:20},(_,i)=>`<i style="--h:${5+(i*7)%20}px"></i>`).join('')}</div></div>
            <div class="sound-variation"><button class="sound-mini-play" type="button">▶</button><div class="sound-variation-copy"><strong>Emotional Pad 03</strong><small>01:30 · More cinematic</small></div><div class="sound-variation-wave">${Array.from({length:20},(_,i)=>`<i style="--h:${5+(i*13)%20}px"></i>`).join('')}</div></div>
          </div>
          <div class="sound-mock-note"><strong>UI prototype.</strong> These controls establish the Sound Studio experience before we connect SvaraFlow, provider adapters, Cloudflare configuration, D1 and R2.</div>
        </div>
      </div>
    </section>`;
  workspace.appendChild(soundView);

  const soundHistory=document.createElement('section');
  soundHistory.id='soundHistoryWorkspace';
  soundHistory.className='sound-history-workspace';
  soundHistory.hidden=true;
  soundHistory.innerHTML=`
    <div class="sound-history-head">
      <div><small>SOUND HISTORY</small><h2>Your Sound generations</h2><p>Previously generated Sound assets from your SvaraONE account.</p></div>
      <button id="soundHistoryRefresh" class="sound-history-refresh" type="button">Refresh</button>
    </div>
    <div class="sound-history-toolbar">
      <input id="soundHistorySearch" type="search" placeholder="Search generations…" aria-label="Search Sound history">
      <select id="soundHistoryType" aria-label="Filter by Sound type"><option value="">All types</option></select>
      <select id="soundHistoryFormat" aria-label="Filter by output format"><option value="">All formats</option></select>
      <select id="soundHistorySource" aria-label="Filter by source"><option value="">All sources</option><option value="text">Text</option><option value="voice">Existing Voice</option></select>
      <select id="soundHistoryStatus" aria-label="Filter by status"><option value="">All statuses</option><option value="ready">Ready</option><option value="processing">Processing</option><option value="failed">Failed</option><option value="storage_failed">Storage failed</option></select>
      <select id="soundHistoryDate" aria-label="Filter by date"><option value="">All dates</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select><select id="soundHistoryFolder" aria-label="Filter by folder"><option value="">All folders</option><option value="__unfiled__">Unfiled</option></select>
    </div>
    <div class="sound-history-table-head"><span>Sound</span><span>Duration</span><span>Format</span><span>Source</span><span>Folder</span><span>Status</span><span>Date</span><span>Actions</span></div>
    <div id="soundHistoryList" class="sound-history-list"><div class="sound-history-state"><strong>Loading Sound history…</strong><span>Retrieving your saved generations.</span></div></div>
    <div class="sound-history-pagination"><span id="soundHistoryPageInfo">Page 1</span><div><button id="soundHistoryPrev" class="sound-history-page-button" type="button">Previous</button><button id="soundHistoryNext" class="sound-history-page-button" type="button">Next</button></div></div>`;
  workspace.appendChild(soundHistory);


  const placeholder=document.createElement('section');
  placeholder.id='studioPlaceholder';
  placeholder.className='studio-domain-placeholder';
  placeholder.hidden=true;
  workspace.appendChild(placeholder);

  // Compose is a session workspace: keep its DOM/model alive while the user visits other workspaces.
  const composeWorkspace=document.createElement('section');
  composeWorkspace.id='studioComposeWorkspace';
  composeWorkspace.className='compose-workspace';
  composeWorkspace.hidden=true;
  composeWorkspace.dataset.initialized='0';
  workspace.appendChild(composeWorkspace);

  function closeComposeTrackModal(){
    const modal=document.getElementById('composeTrackModal');
    if(modal)modal.remove();
  }

  function openComposeTrackModal(){
    closeComposeTrackModal();
    let selectedType='';
    let selectedSoundType='';
    let selectedAsset=null;
    let generations=[];
    let folders=[];
    const modal=document.createElement('div');
    modal.id='composeTrackModal';
    modal.className='compose-track-modal';
    modal.innerHTML=`
      <div class="compose-track-backdrop"></div>
      <section class="compose-track-dialog compose-track-wizard" role="dialog" aria-modal="true" aria-labelledby="composeTrackTitle">
        <div class="compose-track-head">
          <div><p class="compose-track-eyebrow">COMPOSE</p><h3 id="composeTrackTitle">Add a track</h3><p class="compose-track-subtitle">Choose the kind of existing audio asset you want to import.</p></div>
          <button class="compose-track-close" type="button" aria-label="Close">×</button>
        </div>
        <div class="compose-track-step" data-compose-step="type">
          <div class="compose-track-options">
            <button class="compose-track-option" type="button" data-compose-track-type="voice"><svg viewBox="0 0 24 24"><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 3v18M23 10v4"/></svg><span>Voice</span></button>
            <button class="compose-track-option" type="button" data-compose-track-type="sound"><svg viewBox="0 0 24 24"><path d="M4 9.5v5h4l5 4V5.5l-5 4z"/><path d="M17 9.2a4.2 4.2 0 0 1 0 5.6M19.5 6.8a7.5 7.5 0 0 1 0 10.4"/></svg><span>Sound</span></button>
            <button class="compose-track-option" type="button" data-compose-track-type="composition"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h10M7 13h6"/></svg><span>Composition</span></button>
          </div>
        </div>
        <div class="compose-track-step" data-compose-step="finder" hidden>
          <div class="compose-finder-toolbar">
            <button class="compose-finder-back" type="button">← Back</button>
            <div class="compose-finder-title"><strong></strong><span>Choose an existing asset</span></div>
          </div>
          <div class="compose-finder-controls">
            <label class="compose-finder-search"><span>⌕</span><input type="search" placeholder="Search assets…" aria-label="Search assets"></label>
            <select class="compose-finder-type" aria-label="Filter by Sound type" hidden></select>
            <select class="compose-finder-folder" aria-label="Filter by folder"><option value="__all__">All folders</option><option value="__unfiled__">Unfiled</option></select>
          </div>
          <div class="compose-finder-list"><div class="compose-finder-state">Loading your assets…</div></div>
        </div>
        <div class="compose-track-footer">
          <span class="compose-track-selection">Choose a track type to continue.</span>
          <button class="compose-import-track" type="button" disabled>Import Track</button>
        </div>
      </section>`;
    document.body.appendChild(modal);

    const typeStep=modal.querySelector('[data-compose-step="type"]');
    const finderStep=modal.querySelector('[data-compose-step="finder"]');
    const options=[...modal.querySelectorAll('[data-compose-track-type]')];
    const selection=modal.querySelector('.compose-track-selection');
    const importButton=modal.querySelector('.compose-import-track');
    const finderTitle=modal.querySelector('.compose-finder-title strong');
    const finderSearch=modal.querySelector('.compose-finder-search input');
    const finderType=modal.querySelector('.compose-finder-type');
    const finderFolder=modal.querySelector('.compose-finder-folder');
    const finderList=modal.querySelector('.compose-finder-list');
    const close=()=>closeComposeTrackModal();
    const labelForType=type=>({voice:'Voice',sound:'Sound',composition:'Composition'})[type]||type;
    const labelForSoundType=type=>String(type||'Sound').replace(/[_-]+/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase());
    const normalized=asset=>{
      const id=String(asset?.id||'');
      const assetType=String(asset?.assetType||'').toLowerCase();
      const existingUrl=String(asset?.assetUrl||asset?.audioUrl||asset?.playbackUrl||asset?.fileUrl||asset?.downloadUrl||asset?.outputUrl||asset?.url||asset?.r2Url||asset?.storageUrl||'');
      const assetUrl=existingUrl
        ||(assetType==='sound'&&id?'/api/sound/assets/'+encodeURIComponent(id):'')
        ||(assetType==='voice'&&asset?.filename?'/api/generations/media?filename='+encodeURIComponent(String(asset.filename)):'');
      return {
        ...asset,
        id,
        assetType,
        soundType:String(asset?.soundType||asset?.type||'').toLowerCase(),
        filename:String(asset?.filename||asset?.name||'Untitled asset'),
        folderId:asset?.folderId?String(asset.folderId):'__unfiled__',
        format:String(asset?.format||'').toUpperCase(),
        status:String(asset?.status||'ready').toLowerCase(),
        assetUrl
      };
    };
    const typeMatches=asset=>{
      if(selectedType==='voice')return asset.assetType==='voice';
      if(selectedType==='sound')return asset.assetType==='sound';
      if(selectedType==='composition')return asset.assetType==='composition';
      return false;
    };
    const filtered=()=>{
      const query=String(finderSearch?.value||'').trim().toLowerCase();
      const folder=finderFolder?.value||'__all__';
      return generations.filter(asset=>{
        const haystack=`${asset.filename} ${asset.voiceName||''} ${asset.soundType||''} ${asset.format||''} ${asset.status||''}`.toLowerCase();
        const queryOk=!query||haystack.includes(query);
        const folderOk=folder==='__all__'||(folder==='__unfiled__'?asset.folderId==='__unfiled__':asset.folderId===folder);
        const soundTypeOk=selectedType!=='sound'||!selectedSoundType||asset.soundType===selectedSoundType;
        return typeMatches(asset)&&queryOk&&folderOk&&soundTypeOk&&asset.status==='ready';
      });
    };
    const renderSoundTypes=()=>{
      if(!finderType)return;
      if(selectedType!=='sound'){finderType.hidden=true;finderType.innerHTML='';return;}
      const types=[...new Set(generations.filter(asset=>asset.assetType==='sound'&&asset.soundType).map(asset=>asset.soundType))].sort();
      finderType.hidden=false;
      finderType.innerHTML='<option value="">All Sound</option>'+types.map(type=>`<option value="${escapeHistory(type)}">${escapeHistory(labelForSoundType(type))}</option>`).join('');
      finderType.value=selectedSoundType;
    };
    const renderList=()=>{
      if(!finderList)return;
      const items=filtered();
      const noun=selectedType==='sound'?'Sound':labelForType(selectedType);
      if(!items.length){
        finderList.innerHTML=`<div class="compose-finder-state"><strong>No ${selectedSoundType?escapeHistory(labelForSoundType(selectedSoundType))+' ':''}${escapeHistory(noun)} assets found</strong><span>Generate or save an asset first, then return here to import it.</span></div>`;
        return;
      }
      finderList.innerHTML=items.map(asset=>`<button type="button" class="compose-finder-item${selectedAsset?.id===asset.id?' active':''}" data-compose-asset-id="${escapeHistory(asset.id)}"><span class="compose-finder-icon">◈</span><span class="compose-finder-main"><strong>${escapeHistory(asset.filename)}</strong><small>${escapeHistory(asset.soundType||labelForType(asset.assetType))}${asset.format?' · '+escapeHistory(asset.format):''}</small></span><span class="compose-finder-date">${formatHistoryDate(asset.createdAt)}</span></button>`).join('');
      finderList.querySelectorAll('[data-compose-asset-id]').forEach(button=>button.addEventListener('click',()=>{
        selectedAsset=items.find(asset=>asset.id===button.dataset.composeAssetId)||null;
        finderList.querySelectorAll('.compose-finder-item').forEach(item=>item.classList.toggle('active',item===button));
        selection.innerHTML=selectedAsset?`Selected: <strong>${escapeHistory(selectedAsset.filename)}</strong>`:'Choose an asset to continue.';
        importButton.disabled=!selectedAsset;
      }));
    };
    const loadFolders=async()=>{
      try{
        const response=await fetch('/api/generations/folders',{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
        const data=await response.json().catch(()=>({}));
        if(response.ok){
          folders=Array.isArray(data.folders)?data.folders:[];
          finderFolder.innerHTML='<option value="__all__">All folders</option><option value="__unfiled__">Unfiled</option>'+folders.map(folder=>`<option value="${escapeHistory(folder.id)}">${escapeHistory(folder.name)}</option>`).join('');
        }
      }catch(error){console.warn('compose_track_folder_load_error',error);}
    };
    const loadAssets=async()=>{
      finderList.innerHTML='<div class="compose-finder-state">Loading your assets…</div>';
      try{
        const response=await fetch('/api/generations?limit=500',{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
        const data=await response.json().catch(()=>({}));
        if(response.status===401){window.location.replace('/login.html?next=/studio');return;}
        if(!response.ok)throw new Error(data.error||`Generation service unavailable (${response.status})`);
        generations=(Array.isArray(data.generations)?data.generations:[]).map(normalized);
        renderSoundTypes();
        renderList();
      }catch(error){
        finderList.innerHTML=`<div class="compose-finder-state"><strong>Could not load assets</strong><span>${escapeHistory(error?.message||'Please try again.')}</span></div>`;
      }
    };
    const showFinder=async type=>{
      selectedType=type;
      selectedSoundType='';
      selectedAsset=null;
      typeStep.hidden=true;
      finderStep.hidden=false;
      finderTitle.textContent=labelForType(type);
      finderSearch.value='';
      finderType.value='';
      finderFolder.value='__all__';
      finderType.hidden=type!=='sound';
      selection.textContent=`Choose a ${labelForType(type)} asset to continue.`;
      importButton.disabled=true;
      await Promise.all([loadFolders(),loadAssets()]);
      finderSearch.focus();
    };

    options.forEach(option=>option.addEventListener('click',()=>showFinder(option.dataset.composeTrackType||'')));
    finderSearch.addEventListener('input',renderList);
    finderType.addEventListener('change',()=>{selectedSoundType=finderType.value||'';selectedAsset=null;importButton.disabled=true;selection.textContent='Choose a Sound asset to continue.';renderList();});
    finderFolder.addEventListener('change',renderList);
    modal.querySelector('.compose-finder-back').addEventListener('click',()=>{
      finderStep.hidden=true;typeStep.hidden=false;selectedAsset=null;selectedSoundType='';finderType.hidden=true;selection.textContent='Choose a track type to continue.';importButton.disabled=true;
    });
    importButton.addEventListener('click',()=>{
      if(!selectedAsset)return;
      addComposeTrack(selectedType,selectedAsset);
      close();
    });
    modal.querySelector('.compose-track-close').addEventListener('click',close);
    modal.querySelector('.compose-track-backdrop').addEventListener('click',close);
    document.addEventListener('keydown',function onKeydown(event){
      if(!document.getElementById('composeTrackModal')){document.removeEventListener('keydown',onKeydown);return;}
      if(event.key==='Escape'){close();document.removeEventListener('keydown',onKeydown);}
    });
    options[0]?.focus();
  }



  function syncComposeExportButton(){
    const button=composeWorkspace.querySelector('[data-compose-export]');
    if(!button)return;
    const rows=[...composeWorkspace.querySelectorAll('.compose-track-editor')];
    button.disabled=!rows.length||rows.some(row=>!row.querySelector('.compose-track-audio')?.src);
  }

  function defaultComposeExportFilename(){
    const date=new Date();
    const pad=value=>String(value).padStart(2,'0');
    return 'svaraone-composition-'+date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())+'-'+pad(date.getHours())+'-'+pad(date.getMinutes())+'.wav';
  }

  function compositionMasterGain(audioBuffer){
    const left=audioBuffer.getChannelData(0);
    const right=audioBuffer.numberOfChannels>1?audioBuffer.getChannelData(1):left;
    let peak=0;
    for(let i=0;i<audioBuffer.length;i++)peak=Math.max(peak,Math.abs(left[i]||0),Math.abs(right[i]||0));
    return peak>0.98?0.98/peak:1;
  }

  function encodeCompositionWav(audioBuffer){
    const channels=2;
    const sampleRate=Number(audioBuffer.sampleRate)||44100;
    const frames=audioBuffer.length;
    const dataBytes=frames*channels*2;
    if(!frames||dataBytes+44>80000000)throw new Error('This export is too large for the current WAV export limit.');
    const left=audioBuffer.getChannelData(0);
    const right=audioBuffer.numberOfChannels>1?audioBuffer.getChannelData(1):left;
    const masterGain=compositionMasterGain(audioBuffer);
    const output=new ArrayBuffer(44+dataBytes);
    const view=new DataView(output);
    const writeString=(offset,value)=>{
      for(let i=0;i<value.length;i++)view.setUint8(offset+i,value.charCodeAt(i));
    };
    writeString(0,'RIFF');
    view.setUint32(4,36+dataBytes,true);
    writeString(8,'WAVE');
    writeString(12,'fmt ');
    view.setUint32(16,16,true);
    view.setUint16(20,1,true);
    view.setUint16(22,channels,true);
    view.setUint32(24,sampleRate,true);
    view.setUint32(28,sampleRate*channels*2,true);
    view.setUint16(32,channels*2,true);
    view.setUint16(34,16,true);
    writeString(36,'data');
    view.setUint32(40,dataBytes,true);
    let offset=44;
    for(let i=0;i<frames;i++){
      const l=Math.max(-1,Math.min(1,(left[i]||0)*masterGain));
      const r=Math.max(-1,Math.min(1,(right[i]||0)*masterGain));
      view.setInt16(offset,l<0?l*32768:l*32767,true);offset+=2;
      view.setInt16(offset,r<0?r*32768:r*32767,true);offset+=2;
    }
    return new Blob([output],{type:'audio/wav'});
  }

  function encodeCompositionPcm(audioBuffer){
    if(Number(audioBuffer.sampleRate)!==24000)throw new Error('PCM export must be rendered at 24 kHz.');
    const frames=audioBuffer.length;
    const byteLength=frames*4;
    if(!frames||byteLength>80000000)throw new Error('This PCM export is too large.');
    const left=audioBuffer.getChannelData(0);
    const right=audioBuffer.numberOfChannels>1?audioBuffer.getChannelData(1):left;
    const masterGain=compositionMasterGain(audioBuffer);
    const output=new ArrayBuffer(byteLength);
    const view=new DataView(output);
    let offset=0;
    for(let i=0;i<frames;i++){
      const l=Math.max(-1,Math.min(1,(left[i]||0)*masterGain));
      const r=Math.max(-1,Math.min(1,(right[i]||0)*masterGain));
      view.setInt16(offset,l<0?l*32768:l*32767,false);offset+=2;
      view.setInt16(offset,r<0?r*32768:r*32767,false);offset+=2;
    }
    return new Blob([output],{type:'audio/l16;rate=24000;channels=2'});
  }

  function encodeCompositionMp3(audioBuffer,onStatus){
    const Mp3Encoder=window.lamejs?.Mp3Encoder;
    if(typeof Mp3Encoder!=='function')throw new Error('MP3 encoder failed to load. Refresh Studio and try again.');
    const sampleRate=Number(audioBuffer.sampleRate)||44100;
    const channels=2;
    const encoder=new Mp3Encoder(channels,sampleRate,192);
    const left=audioBuffer.getChannelData(0);
    const right=audioBuffer.numberOfChannels>1?audioBuffer.getChannelData(1):left;
    const masterGain=compositionMasterGain(audioBuffer);
    const chunks=[];
    const frameSize=1152;
    for(let offset=0;offset<audioBuffer.length;offset+=frameSize){
      const length=Math.min(frameSize,audioBuffer.length-offset);
      const leftPcm=new Int16Array(length);
      const rightPcm=new Int16Array(length);
      for(let i=0;i<length;i++){
        const l=Math.max(-1,Math.min(1,(left[offset+i]||0)*masterGain));
        const r=Math.max(-1,Math.min(1,(right[offset+i]||0)*masterGain));
        leftPcm[i]=l<0?l*32768:l*32767;
        rightPcm[i]=r<0?r*32768:r*32767;
      }
      const encoded=encoder.encodeBuffer(leftPcm,rightPcm);
      if(encoded?.length)chunks.push(new Uint8Array(encoded));
      if(offset%(frameSize*100)===0)onStatus('Encoding MP3… '+Math.min(100,Math.round((offset/audioBuffer.length)*100))+'%');
    }
    const tail=encoder.flush();
    if(tail?.length)chunks.push(new Uint8Array(tail));
    const blob=new Blob(chunks,{type:'audio/mpeg'});
    if(!blob.size)throw new Error('MP3 encoding produced an empty file.');
    if(blob.size>80000000)throw new Error('This MP3 export is too large for the current 80 MB limit.');
    return blob;
  }

  async function renderCompositionAudio(rows,onStatus,sampleRate=44100){
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    const OfflineContextClass=window.OfflineAudioContext||window.webkitOfflineAudioContext;
    if(!AudioContextClass||!OfflineContextClass)throw new Error('Your browser does not support offline audio rendering.');
    const states=rows.map(row=>{
      const audio=row.querySelector('.compose-track-audio');
      const muteButton=row.querySelector('[data-compose-mute]');
      const soloButton=row.querySelector('[data-compose-solo]');
      const volume=row.querySelector('.compose-track-volume input');
      const duration=Number(Number.isFinite(audio?.duration)&&audio.duration>0?audio.duration:(row.dataset.sourceDuration||row.dataset.assetDuration||0));
      return {
        row,
        audio,
        url:String(audio?.currentSrc||audio?.src||''),
        start:Math.max(0,Number(row.dataset.startSeconds||0)||0),
        trimIn:Math.max(0,Math.min(.98,Number(row.dataset.trimIn||0)||0)),
        trimOut:Math.max(0,Math.min(.98,Number(row.dataset.trimOut||0)||0)),
        fadeIn:Math.max(0,Math.min(10,Number(row.dataset.fadeIn||0)||0)),
        fadeOut:Math.max(0,Math.min(10,Number(row.dataset.fadeOut||0)||0)),
        volume:Math.max(0,Math.min(1,Number(volume?.value||100)/100)),
        muted:!!audio?.muted||!!muteButton?.classList.contains('active'),
        solo:!!soloButton?.classList.contains('active'),
        declaredDuration:duration
      };
    });
    const soloActive=states.some(state=>state.solo);
    const activeStates=states.filter(state=>soloActive?state.solo:!state.muted);
    if(!activeStates.length)throw new Error('No audible tracks. Unmute a track or turn off Solo before exporting.');
    if(activeStates.some(state=>!state.url))throw new Error('One or more selected tracks have no playable source asset.');
    const context=new AudioContextClass();
    const decoded=[];
    try{
      for(let index=0;index<activeStates.length;index++){
        const state=activeStates[index];
        onStatus('Loading audio '+(index+1)+' of '+activeStates.length+'…');
        const assetUrl=new URL(state.url,window.location.href);
        if(assetUrl.origin!==window.location.origin)throw new Error('Export currently supports audio assets stored in this SvaraONE account.');
        const response=await fetch(assetUrl.href,{credentials:'same-origin',cache:'no-store'});
        if(!response.ok)throw new Error('Could not load track '+(index+1)+' ('+response.status+').');
        const bytes=await response.arrayBuffer();
        const buffer=await context.decodeAudioData(bytes.slice(0));
        if(!buffer||!buffer.length||!Number.isFinite(buffer.duration)||buffer.duration<=0)throw new Error('Track '+(index+1)+' could not be decoded.');
        const trimStart=state.trimIn*buffer.duration;
        const trimEnd=Math.max(trimStart+.01,(1-state.trimOut)*buffer.duration);
        const effectiveDuration=Math.max(.01,Math.min(buffer.duration-trimStart,trimEnd-trimStart));
        decoded.push({...state,buffer,trimStart,effectiveDuration,end:state.start+effectiveDuration});
      }
    }finally{
      await context.close().catch(()=>{});
    }
    const timelineEnd=Math.max(0,...states.map(track=>track.start+Math.max(.01,track.declaredDuration*(1-track.trimIn-track.trimOut))));
    const renderDuration=Math.max(timelineEnd,...decoded.map(track=>track.end));
    if(!Number.isFinite(renderDuration)||renderDuration<=0)throw new Error('The composition has no renderable duration.');
    if(renderDuration>420)throw new Error('This export supports compositions up to 7 minutes. Shorten the composition and try again.');
    const frameCount=Math.max(1,Math.ceil(renderDuration*sampleRate));
    const maxOutputBytes=sampleRate===24000?80000000:80000000;
    if(frameCount*4+44>maxOutputBytes)throw new Error('This export is too large for the current 80 MB limit.');
    onStatus('Mixing '+decoded.length+' track'+(decoded.length===1?'':'s')+'…');
    const offline=new OfflineContextClass(2,frameCount,sampleRate);
    decoded.forEach(track=>{
      if(track.volume<=0)return;
      const source=offline.createBufferSource();
      const gain=offline.createGain();
      source.buffer=track.buffer;
      const start=Math.min(renderDuration,track.start);
      const effectiveDuration=Math.min(track.effectiveDuration,Math.max(.001,renderDuration-start));
      const curveLength=129;
      const curve=new Float32Array(curveLength);
      const fadeInDuration=Math.min(track.fadeIn,effectiveDuration);
      const fadeOutDuration=Math.min(track.fadeOut,effectiveDuration);
      for(let i=0;i<curveLength;i++){
        const elapsed=(i/(curveLength-1))*effectiveDuration;
        const fadeInGain=fadeInDuration>0?Math.min(1,elapsed/fadeInDuration):1;
        const fadeOutGain=fadeOutDuration>0?Math.min(1,Math.max(0,(effectiveDuration-elapsed)/fadeOutDuration)):1;
        curve[i]=track.volume*Math.min(fadeInGain,fadeOutGain);
      }
      gain.gain.setValueCurveAtTime(curve,start,effectiveDuration);
      source.connect(gain);
      gain.connect(offline.destination);
      source.start(start,track.trimStart,effectiveDuration);
    });
    onStatus('Rendering final mix…');
    const audioBuffer=await offline.startRendering();
    return {audioBuffer,durationSeconds:audioBuffer.duration,trackCount:decoded.length};
  }

  function openComposeExportModal(){
    const existing=document.getElementById('composeExportModal');
    if(existing)existing.remove();
    const rows=[...composeWorkspace.querySelectorAll('.compose-timeline .compose-track-editor')];
    if(!rows.length)return;
    const modal=document.createElement('div');
    modal.id='composeExportModal';
    modal.className='compose-track-modal compose-export-modal';
    modal.innerHTML='<div class="compose-track-backdrop"></div>'+
      '<section class="compose-track-dialog compose-export-dialog" role="dialog" aria-modal="true" aria-labelledby="composeExportTitle">'+
        '<div class="compose-track-head"><div><p class="compose-track-eyebrow">COMPOSITION EXPORT</p><h3 id="composeExportTitle">Compose &amp; Export</h3><p class="compose-track-subtitle">Render the timeline into one WAV asset and save it to your library storage.</p></div><button class="compose-track-close" type="button" aria-label="Close">×</button></div>'+
        '<form class="compose-export-form">'+
          '<label class="compose-export-field"><span>Filename</span><input type="text" name="filename" maxlength="124" autocomplete="off" required></label>'+
          '<label class="compose-export-field"><span>Format</span><select disabled aria-label="Export format"><option>WAV · 16-bit PCM · Stereo · 44.1 kHz</option></select></label>'+
          '<p class="compose-export-status" data-export-status role="status">The original track assets will remain unchanged.</p>'+
          '<div class="compose-export-actions"><button class="compose-export-cancel" type="button" data-export-cancel>Cancel</button><button class="compose-export-submit" type="submit" data-export-submit>Export WAV</button></div>'+
        '</form>'+
      '</section>';
    composeWorkspace.appendChild(modal);
    const form=modal.querySelector('.compose-export-form');
    const filenameInput=form.querySelector('[name="filename"]');
    const status=form.querySelector('[data-export-status]');
    const submit=form.querySelector('[data-export-submit]');
    const cancel=form.querySelector('[data-export-cancel]');
    const closeButton=modal.querySelector('.compose-track-close');
    filenameInput.value=defaultComposeExportFilename();
    const close=()=>modal.remove();
    closeButton.addEventListener('click',close);
    cancel.addEventListener('click',close);
    modal.querySelector('.compose-track-backdrop').addEventListener('click',close);
    document.addEventListener('keydown',function onKeydown(event){
      if(!document.getElementById('composeExportModal')){document.removeEventListener('keydown',onKeydown);return;}
      if(event.key==='Escape'&&!submit.disabled){close();document.removeEventListener('keydown',onKeydown);}
    });
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(submit.disabled)return;
      const currentRows=[...composeWorkspace.querySelectorAll('.compose-timeline .compose-track-editor')];
      if(!currentRows.length){status.textContent='Add at least one audio track before exporting.';return;}
      let filename=filenameInput.value.trim();
      if(!/\.wav$/i.test(filename))filename+='.wav';
      if(!/^[a-z0-9][a-z0-9 _().-]{0,119}\.wav$/i.test(filename)){
        status.textContent='Use letters, numbers, spaces, hyphens, underscores, brackets or dots in a filename (up to 120 characters before .wav).';
        filenameInput.focus();
        return;
      }
      filenameInput.value=filename;
      submit.disabled=true;
      cancel.disabled=true;
      closeButton.disabled=true;
      filenameInput.disabled=true;
      try{
        const result=await renderCompositionWav(currentRows,message=>{status.textContent=message;});
        status.textContent='Saving WAV to R2…';
        const response=await fetch('/api/compositions/export',{
          method:'POST',
          credentials:'same-origin',
          cache:'no-store',
          headers:{
            'content-type':'audio/wav',
            'x-svara-composition-filename':filename,
            'x-svara-composition-duration':String(result.durationSeconds),
            'x-svara-composition-track-count':String(result.trackCount),
            'x-svara-composition-size':String(result.wav.size)
          },
          body:result.wav
        });
        const data=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(data.error||'Composition export failed ('+response.status+').');
        const assetUrl='/api/compositions/assets/'+encodeURIComponent(String(data.id||''));
        if(!data.id)throw new Error('The WAV was uploaded but the server did not return an asset ID.');
        form.replaceChildren();
        const success=document.createElement('div');
        success.className='compose-export-success';
        const heading=document.createElement('strong');
        heading.textContent='Composition saved';
        const detail=document.createElement('p');
        detail.textContent=(data.filename||filename)+' · '+Math.floor(Number(data.durationSeconds||result.durationSeconds))+' seconds · '+Math.round(Number(data.sizeBytes||result.wav.size)/1024)+' KB';
        const preview=document.createElement('audio');
        preview.controls=true;
        preview.preload='none';
        preview.src=assetUrl;
        preview.className='compose-export-preview';
        const download=document.createElement('a');
        download.className='compose-export-download';
        download.href=assetUrl+'?download=1';
        download.download=String(data.filename||filename);
        download.textContent='Download WAV';
        success.append(heading,detail,preview,download);
        form.appendChild(success);
        const doneButton=document.createElement('button');
        doneButton.type='button';
        doneButton.className='compose-export-cancel';
        doneButton.textContent='Close';
        doneButton.addEventListener('click',close);
        form.appendChild(doneButton);
        closeButton.disabled=false;
      }catch(error){
        status.textContent=error?.message||'Export failed. No saved asset was confirmed.';
        status.classList.add('error');
        submit.disabled=false;
        cancel.disabled=false;
        closeButton.disabled=false;
        filenameInput.disabled=false;
      }
    });
    filenameInput.focus();
  }

  function addComposeTrack(type,asset){
    const canvas=composeWorkspace.querySelector('.compose-canvas');
    if(!canvas||!asset)return;
    const empty=canvas.querySelector('.compose-empty');
    if(empty)empty.remove();

    let timeline=canvas.querySelector('.compose-timeline');
    if(!timeline){
      timeline=document.createElement('div');
      timeline.className='compose-timeline';
      timeline.innerHTML=`
        <div class="compose-timeline-ruler">
          <div class="compose-timeline-label">
            <button type="button" class="compose-transport-button" data-compose-play-all aria-label="Play all tracks" title="Play all tracks">▶ Play All</button>
            <span>TRACKS</span>
          </div>
          <div class="compose-timeline-scale"><span class="compose-timeline-playhead" aria-hidden="true"></span></div>
        </div>
        <div class="compose-timeline-list"></div>
      `;
      canvas.appendChild(timeline);
      const playAllButton=timeline.querySelector('[data-compose-play-all]');
      const timelineScale=timeline.querySelector('.compose-timeline-scale');
      const composeModel={
        duration:30,
        currentTime:0,
        pixelsPerSecond:24,
        minDuration:30,
        tracks:new Map(),
        nextTrackId:1
      };
      const trackSourceDuration=row=>{
        const audio=row?.querySelector('.compose-track-audio');
        const value=Number(row?.dataset.sourceDuration||0);
        const assetValue=Number(row?.dataset.assetDuration||0);
        return Math.max(0.01,
          Number.isFinite(audio?.duration)&&audio.duration>0?audio.duration:
          value>0?value:
          assetValue>0?assetValue:30
        );
      };
      const trackEffectiveDuration=row=>{
        const duration=trackSourceDuration(row);
        const trimIn=Math.max(0,Math.min(.98,Number(row?.dataset.trimIn||0)||0));
        const trimOut=Math.max(0,Math.min(.98,Number(row?.dataset.trimOut||0)||0));
        return Math.max(.01,duration*(1-trimIn-trimOut));
      };
      const renderTimelineRuler=()=>{
        if(!timelineScale)return;
        const duration=Math.max(composeModel.minDuration,composeModel.duration);
        const width=Math.max(720,duration*composeModel.pixelsPerSecond);
        const step=duration<=60?5:duration<=180?10:duration<=600?30:60;
        const marks=[];
        for(let seconds=0;seconds<=duration+.001;seconds+=step){
          const clamped=Math.min(duration,seconds);
          marks.push(`<span class="compose-timeline-ruler-mark" style="left:${(clamped/duration)*100}%">${formatComposeTime(clamped).replace('.00','')}</span>`);
        }
        timelineScale.innerHTML=marks.join('')+`<span class="compose-timeline-playhead" aria-hidden="true"></span>`;
        timelineScale.style.width=`${width}px`;
        timelineScale.style.setProperty('--compose-second-pitch',`${composeModel.pixelsPerSecond}px`);
        timelineScale.style.setProperty('--timeline-duration',String(duration));
        timelineScale.closest('.compose-timeline-ruler')?.style.setProperty('grid-template-columns',`180px ${width}px`);
        timeline.querySelector('.compose-timeline-list')?.style.setProperty('width',`${width+180}px`);
        timeline.querySelector('.compose-timeline-transport')?.style.setProperty('width',`${width+180}px`);
      };
      const updateCompositionGeometry=()=>{
        const rows=[...timeline.querySelectorAll('.compose-track-editor')];
        let duration=composeModel.minDuration;
        rows.forEach(row=>{
          const start=Math.max(0,Number(row.dataset.startSeconds||0)||0);
          duration=Math.max(duration,start+trackEffectiveDuration(row));
        });
        composeModel.duration=Math.max(composeModel.minDuration,duration);
        const width=Math.max(720,composeModel.duration*composeModel.pixelsPerSecond);
        renderTimelineRuler();
        rows.forEach(row=>{
          row.style.gridTemplateColumns=`180px ${width}px`;
          const region=row.querySelector('.compose-track-region');
          if(region){
            const start=Math.max(0,Number(row.dataset.startSeconds||0)||0);
            const trackWidth=Math.max(24,trackSourceDuration(row)*composeModel.pixelsPerSecond);
            region.style.marginLeft=`${start*composeModel.pixelsPerSecond}px`;
            region.style.width=`${trackWidth}px`;
            region.style.maxWidth='none';
          }
        });
        timeline.style.setProperty('--compose-timeline-width',`${width}px`);
        timeline.style.setProperty('--compose-pixels-per-second',String(composeModel.pixelsPerSecond));
        timeline.style.setProperty('--compose-five-second-pitch',`${5*composeModel.pixelsPerSecond}px`);
      };
      timeline._composeModel=composeModel;
      timeline._updateCompositionGeometry=updateCompositionGeometry;
      let playAllRunId=0;
      let playAllRunning=false;
      let playAllStartedAt=0;
      let playAllFrame=0;
      let masterScrubbing=false;
      let masterScrubWasPlaying=false;
      let seekPlayAllTo=null;
      const setMasterTimeFromPointer=event=>{
        const rect=timelineScale?.getBoundingClientRect();
        if(!rect||!rect.width)return;
        const duration=Math.max(composeModel.minDuration,composeModel.duration);
        const ratio=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
        const seconds=ratio*duration;
        if(playAllRunning&&seekPlayAllTo){
          seekPlayAllTo(seconds);
          return;
        }
        renderTimelinePlayhead(seconds);
        renderAllTrackPlayheads(seconds);
      };
      timelineScale?.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;
        event.preventDefault();
        masterScrubbing=true;
        masterScrubWasPlaying=playAllRunning;
        if(masterScrubWasPlaying){
          playAllRunId+=1;
          clearPlayAllTimeouts();
          playAllPending=0;
          playAllActive.clear();
          stopTimelinePlayhead();
          timeline.querySelectorAll('.compose-track-audio').forEach(audio=>{
            audio.pause();
            audio.closest('.compose-track-editor')?.querySelector('.compose-track-wave')?.classList.remove('playing');
          });
        }
        timelineScale.classList.add('scrubbing');
        timelineScale.setPointerCapture?.(event.pointerId);
        setMasterTimeFromPointer(event);
      });
      timelineScale?.addEventListener('pointermove',event=>{
        if(masterScrubbing)setMasterTimeFromPointer(event);
      });
      timelineScale?.addEventListener('pointerup',event=>{
        if(!masterScrubbing)return;
        const wasPlaying=masterScrubWasPlaying;
        const target=composeModel.currentTime;
        masterScrubbing=false;
        masterScrubWasPlaying=false;
        timelineScale.classList.remove('scrubbing');
        try{timelineScale.releasePointerCapture?.(event.pointerId);}catch{}
        if(wasPlaying){
          playAllRunning=false;
          playAll(target,false);
        }
      });
      timelineScale?.addEventListener('pointercancel',()=>{
        const wasPlaying=masterScrubWasPlaying;
        masterScrubbing=false;
        masterScrubWasPlaying=false;
        timelineScale.classList.remove('scrubbing');
        if(wasPlaying){
          playAllRunning=false;
          playAll(composeModel.currentTime,false);
        }
      });
      timelineScale?.addEventListener('click',event=>{
        if(masterScrubbing)return;
        setMasterTimeFromPointer(event);
      });
      const renderTimelinePlayhead=seconds=>{
        const duration=Math.max(composeModel.minDuration,composeModel.duration);
        const value=Math.max(0,Math.min(duration,Number(seconds)||0));
        composeModel.currentTime=value;
        timelineScale?.style.setProperty('--timeline-playhead',String((value/duration)*100)+'%');
      };
      const stopTimelinePlayhead=()=>{
        if(playAllFrame)cancelAnimationFrame(playAllFrame);
        playAllFrame=0;
      };
      const renderAllTrackPlayheads=seconds=>{
        const masterTime=Math.max(0,Number(seconds)||0);
        timeline.querySelectorAll('.compose-track-editor').forEach(row=>{
          const playhead=row.querySelector('.compose-track-playhead');
          if(!playhead)return;
          const audio=row.querySelector('.compose-track-audio');
          const duration=Number.isFinite(audio?.duration)&&audio.duration>0
            ?audio.duration
            :Math.max(0.01,Number(row.dataset.sourceDuration||30)||30);
          const trimIn=Math.max(0,Math.min(.98,Number(row.dataset.trimIn||0)||0));
          const trimOut=Math.max(0,Math.min(.98,Number(row.dataset.trimOut||0)||0));
          const trimStart=trimIn*duration;
          const effectiveDuration=Math.max(.01,duration*(1-trimIn-trimOut));
          const startSeconds=Math.max(0,Number(row.dataset.startSeconds||0)||0);
          const endSeconds=startSeconds+effectiveDuration;
          if(masterTime<startSeconds){
            playhead.style.visibility='hidden';
            return;
          }
          playhead.style.visibility='visible';
          const localPosition=Math.max(0,Math.min(effectiveDuration,masterTime-startSeconds));
          const ratio=Math.max(0,Math.min(1,(trimStart+localPosition)/duration));
          playhead.style.setProperty('--playhead',String(ratio*100)+'%');
          if(masterTime>=endSeconds)playhead.style.setProperty('--playhead',String(((trimStart+effectiveDuration)/duration)*100)+'%');
        });
      };
      const animateTimelinePlayhead=()=>{
        if(!playAllRunning)return;
        const elapsed=Math.max(0,(performance.now()-playAllStartedAt)/1000);
        renderTimelinePlayhead(elapsed);
        renderAllTrackPlayheads(elapsed);
        playAllFrame=requestAnimationFrame(animateTimelinePlayhead);
      };
      let playAllPending=0;
      const playAllActive=new Set();
      const playAllTimeouts=new Set();
      const clearPlayAllTimeouts=()=>{
        playAllTimeouts.forEach(timer=>clearTimeout(timer));
        playAllTimeouts.clear();
      };
      const finishPlayAllIfIdle=()=>{
        if(playAllRunning&&playAllPending===0&&playAllActive.size===0){
          playAllRunning=false;
          stopTimelinePlayhead();
          syncPlayAllButton();
        }
      };
      const syncPlayAllButton=()=>{
        const audios=[...timeline.querySelectorAll('.compose-track-audio')];
        const playing=playAllRunning||audios.some(item=>!item.paused);
        if(playAllButton){
          playAllButton.textContent=playing?'■ Stop All':'▶ Play All';
          playAllButton.setAttribute('aria-label',playing?'Stop all tracks':'Play all tracks');
          playAllButton.setAttribute('title',playing?'Stop all tracks':'Play all tracks');
          playAllButton.classList.toggle('active',playing);
        }
        timeline.querySelectorAll('.compose-track-play').forEach(button=>{
          button.disabled=playAllRunning;
          button.title=playAllRunning?'Individual playback is controlled by Stop All':'Play/Pause track';
        });
      };
      const stopAll=()=>{
        playAllRunId+=1;
        playAllRunning=false;
        playAllPending=0;
        stopTimelinePlayhead();
        renderTimelinePlayhead(0);
        renderAllTrackPlayheads(0);
        playAllActive.clear();
        clearPlayAllTimeouts();
        const audios=[...timeline.querySelectorAll('.compose-track-audio')];
        audios.forEach(item=>{
          item.pause();
          try{item.currentTime=0;}catch(error){console.warn('compose_stop_all_reset_error',error);}
          const row=item.closest('.compose-track-editor');
          const wave=row?.querySelector('.compose-track-wave');
          wave?.classList.remove('playing');
          item.dispatchEvent(new Event('timeupdate'));
        });
        syncPlayAllButton();
      };
      const waitForMetadata=audio=>{
        if(Number.isFinite(audio.duration)&&audio.duration>0)return Promise.resolve(audio.duration);
        return new Promise(resolve=>{
          const onMetadata=()=>{
            audio.removeEventListener('loadedmetadata',onMetadata);
            resolve(Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:30);
          };
          audio.addEventListener('loadedmetadata',onMetadata,{once:true});
          if(audio.readyState===0)audio.load();
        });
      };
      const playAll=async(startAt=0,resetBeforeStart=true)=>{
        const rows=[...timeline.querySelectorAll('.compose-track-editor')];
        if(!rows.length)return;
        if(playAllRunning||rows.some(row=>{const audio=row.querySelector('.compose-track-audio');return audio&&!audio.paused;})){
          stopAll();
          return;
        }

        if(resetBeforeStart)stopAll();
        const duration=Math.max(composeModel.minDuration,composeModel.duration);
        const startTime=Math.max(0,Math.min(duration,Number(startAt)||0));
        const runId=++playAllRunId;
        playAllRunning=true;
        playAllPending=rows.filter(row=>row.querySelector('.compose-track-audio')).length;
        playAllStartedAt=performance.now()-startTime*1000;
        renderTimelinePlayhead(startTime);
        renderAllTrackPlayheads(startTime);
        animateTimelinePlayhead();
        syncPlayAllButton();

        rows.forEach(row=>{
          const audio=row.querySelector('.compose-track-audio');
          if(!audio){
            playAllPending=Math.max(0,playAllPending-1);
            return;
          }
          const startSeconds=Math.max(0,Number(row.dataset.startSeconds||0)||0);
          const timer=setTimeout(async()=>{
            playAllTimeouts.delete(timer);
            if(runId!==playAllRunId)return;
            playAllPending=Math.max(0,playAllPending-1);
            try{
              if(audio.readyState===0)audio.load();
              const duration=await waitForMetadata(audio);
              if(runId!==playAllRunId)return;
              const trimIn=Math.max(0,Math.min(.98,Number(row.dataset.trimIn||0)||0));
              const trimOut=Math.max(0,Math.min(.98,Number(row.dataset.trimOut||0)||0));
              const trimStart=trimIn*duration;
              const trimEnd=Math.max(trimStart+0.01,(1-trimOut)*duration);
              const localOffset=Math.max(0,startTime-startSeconds);
              if(startTime>=startSeconds){
                if(localOffset>=trimEnd-trimStart){
                  try{audio.currentTime=trimEnd;}catch{}
                  audio.dispatchEvent(new Event('timeupdate'));
                  finishPlayAllIfIdle();
                  return;
                }
                audio.currentTime=Math.min(trimEnd-.001,trimStart+localOffset);
              }else{
                audio.currentTime=trimStart;
              }
              await audio.play();
              if(runId!==playAllRunId){
                audio.pause();
                return;
              }
              playAllActive.add(audio);
              const wave=row.querySelector('.compose-track-wave');
              wave?.classList.add('playing');
              syncPlayAllButton();

              const remainingMs=Math.max(0,(trimEnd-audio.currentTime)*1000);
              const endTimer=setTimeout(()=>{
                playAllTimeouts.delete(endTimer);
                if(runId!==playAllRunId)return;
                audio.pause();
                try{audio.currentTime=trimStart;}catch{}
                playAllActive.delete(audio);
                wave?.classList.remove('playing');
                audio.dispatchEvent(new Event('timeupdate'));
                finishPlayAllIfIdle();
              },remainingMs);
              playAllTimeouts.add(endTimer);
            }catch(error){
              if(runId!==playAllRunId)return;
              console.warn('compose_play_all_error',error);
              playAllActive.delete(audio);
              row.querySelector('.compose-track-wave')?.classList.remove('playing');
              finishPlayAllIfIdle();
            }
          },Math.max(0,(startSeconds-startTime)*1000));
          playAllTimeouts.add(timer);
        });
        finishPlayAllIfIdle();
      };
      const seekTrackAudioToCompositionTime=(row,audio,target)=>{
        if(!audio)return;
        const applySeek=()=>{
          const duration=Number.isFinite(audio.duration)&&audio.duration>0
            ?audio.duration
            :Math.max(0.01,Number(row.dataset.sourceDuration||30)||30);
          const trimIn=Math.max(0,Math.min(.98,Number(row.dataset.trimIn||0)||0));
          const trimOut=Math.max(0,Math.min(.98,Number(row.dataset.trimOut||0)||0));
          const trimStart=trimIn*duration;
          const trimEnd=Math.max(trimStart+0.01,(1-trimOut)*duration);
          const startSeconds=Math.max(0,Number(row.dataset.startSeconds||0)||0);
          const localOffset=target-startSeconds;
          const targetTime=localOffset<=0
            ?trimStart
            :localOffset>=trimEnd-trimStart
              ?trimEnd
              :Math.min(trimEnd-.001,trimStart+localOffset);
          try{
            audio.currentTime=targetTime;
          }catch(error){
            console.warn('compose_track_seek_error',error);
          }
          audio.dispatchEvent(new Event('timeupdate'));
        };
        if(Number.isFinite(audio.duration)&&audio.duration>0){
          applySeek();
          return;
        }
        row._composePendingSeek=target;
        if(row._composeSeekWaiting)return;
        row._composeSeekWaiting=true;
        const onMetadata=()=>{
          row._composeSeekWaiting=false;
          audio.removeEventListener('loadedmetadata',onMetadata);
          const pending=Number(row._composePendingSeek);
          row._composePendingSeek=null;
          applySeek(Number.isFinite(pending)?pending:target);
        };
        audio.addEventListener('loadedmetadata',onMetadata,{once:true});
        if(audio.readyState===0)audio.load();
      };
      seekPlayAllTo=seconds=>{
        if(!playAllRunning)return;
        const target=Math.max(0,Math.min(Math.max(composeModel.minDuration,composeModel.duration),Number(seconds)||0));
        renderTimelinePlayhead(target);
        renderAllTrackPlayheads(target);
        timeline.querySelectorAll('.compose-track-editor').forEach(row=>{
          seekTrackAudioToCompositionTime(row,row.querySelector('.compose-track-audio'),target);
        });
      };
      playAllButton?.addEventListener('click',playAll);
      timeline._syncPlayAllButton=syncPlayAllButton;
      timeline._isPlayAllRunning=()=>playAllRunning;
      timeline._stopAll=stopAll;
    }
    const list=timeline.querySelector('.compose-timeline-list');
    const row=document.createElement('article');
    row.className='compose-track-editor';
    row.dataset.startSeconds='0';
    row.dataset.assetDuration=String(Number(asset.durationSeconds||asset.duration||30)||30);
    const trackId=timeline._composeModel?`track-${timeline._composeModel.nextTrackId++}`:`track-${Date.now()}`;
    row.dataset.trackId=trackId;
    const waveformForPeaks=(peaks,duration)=>{
      const pixelsPerSecond=Math.max(1,Number(timeline?._composeModel?.pixelsPerSecond)||24);
      const barWidth=3;
      const barGap=2;
      const pitch=barWidth+barGap;
      const count=Math.max(32,Math.min(10000,Math.ceil(Math.max(0.01,Number(duration)||30)*pixelsPerSecond/pitch)));
      if(!Array.isArray(peaks)||!peaks.length)return '';
      const bars=Array.from({length:count},(_,i)=>{
        const position=(i/(count-1||1))*(peaks.length-1);
        const left=Math.floor(position);
        const right=Math.min(peaks.length-1,left+1);
        const mix=position-left;
        const amplitude=(Number(peaks[left])||0)*(1-mix)+(Number(peaks[right])||0)*mix;
        return Math.max(8,Math.round(amplitude*92));
      });
      return bars.map(height=>`<i style="--h:${height}%"></i>`).join('');
    };
    const waveform='';
    const assetUrl=String(asset.assetUrl||asset.audioUrl||asset.playbackUrl||asset.fileUrl||asset.downloadUrl||asset.outputUrl||asset.url||asset.r2Url||asset.storageUrl||'');
    const capabilityList=Array.isArray(asset.capabilities)?asset.capabilities:Array.isArray(asset.tools)?asset.tools:[];
    const capabilities=capabilityList.map(value=>String(value||'').trim()).filter(Boolean);
    const dynamicTools=capabilities.length?capabilities.map(value=>`<span class="compose-track-tool dynamic">${escapeHistory(value)}</span>`).join(''):'';
    row.innerHTML=`
      <div class="compose-track-identity">
        <div class="compose-track-identity-actions">
          <button class="compose-track-play" type="button" aria-label="Play track" title="Play track">▶</button>
          <button class="compose-track-move" type="button" aria-label="Move track" title="Drag to position track">⠿</button>
          <button class="compose-track-delete-icon" type="button" data-compose-delete aria-label="Delete track" title="Delete track">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M10 11v6M14 11v6M6 7l1 13h10l1-13"/></svg>
          </button>
        </div>
        <div class="compose-track-row-main"><strong>${escapeHistory(asset.filename||'Untitled asset')}</strong><span>${escapeHistory(labelForComposeType(type))}${asset.soundType?' · '+escapeHistory(asset.soundType):''}${asset.format?' · '+escapeHistory(asset.format):''}</span></div>
        <div class="compose-track-controls">
          <label class="compose-track-volume"><span>Volume</span><input type="range" min="0" max="100" value="100" aria-label="Track volume"></label>
          <label class="compose-track-fade"><span>Fade in</span><input type="range" min="0" max="10" step="0.1" value="0" data-compose-fade="in" aria-label="Fade in duration"><strong class="compose-track-fade-value" data-compose-fade-value="in">0.0s</strong></label>
          <label class="compose-track-fade"><span>Fade out</span><input type="range" min="0" max="10" step="0.1" value="0" data-compose-fade="out" aria-label="Fade out duration"><strong class="compose-track-fade-value" data-compose-fade-value="out">0.0s</strong></label>
          <div class="compose-track-toggle-row">
            <button type="button" class="compose-track-control" data-compose-mute>Mute</button>
            <button type="button" class="compose-track-control" data-compose-solo>Solo</button>
            ${dynamicTools}
          </div>
        </div>
      </div>
      <div class="compose-track-lane">
        <div class="compose-track-region" title="Drag to position track">
          <span class="compose-track-time-guide">Start 0:00</span>
          <div class="compose-track-wave" aria-label="Track waveform">
            <span class="compose-track-wave-bars">${waveform}</span>
            <span class="compose-track-playhead" aria-hidden="true"></span>
            <span class="compose-track-fade-indicator in" aria-hidden="true"></span>
            <span class="compose-track-fade-indicator out" aria-hidden="true"></span>
            <span class="compose-track-trim-handle left" data-compose-trim="in" title="Trim start"></span>
            <span class="compose-track-trim-handle right" data-compose-trim="out" title="Trim end"></span>
            <span class="compose-track-trim-readout">Trim 0:00.00 – 0:00.00</span>
          </div>
        </div>
      </div>
      ${assetUrl?`<audio class="compose-track-audio" preload="metadata" src="${escapeHistory(assetUrl)}"></audio>`:''}
    `;
    list.appendChild(row);
    syncComposeExportButton();

    const loadRealWaveform=async()=>{
      const waveformBars=row.querySelector('.compose-track-wave-bars');
      if(!waveformBars||!assetUrl)return;
      try{
        waveformBars.innerHTML='<span class="compose-track-wave-loading">Loading waveform…</span>';
        const response=await fetch(assetUrl,{credentials:'same-origin',cache:'force-cache'});
        if(!response.ok)throw new Error(`waveform fetch failed (${response.status})`);
        const bytes=await response.arrayBuffer();
        const AudioContextClass=window.AudioContext||window.webkitAudioContext;
        if(!AudioContextClass)throw new Error('Web Audio unavailable');
        const context=new AudioContextClass();
        try{
          const buffer=await context.decodeAudioData(bytes.slice(0));
          const samples=Math.max(1024,Math.min(8192,Math.ceil(buffer.duration*48)));
          const peaks=new Float32Array(samples);
          for(let i=0;i<samples;i++){
            const start=Math.floor(i*buffer.length/samples);
            const end=Math.max(start+1,Math.floor((i+1)*buffer.length/samples));
            let peak=0;
            for(let channel=0;channel<buffer.numberOfChannels;channel++){
              const data=buffer.getChannelData(channel);
              for(let j=start;j<end;j++)peak=Math.max(peak,Math.abs(data[j]||0));
            }
            peaks[i]=peak;
          }
          row._composeWaveformPeaks=Array.from(peaks);
          waveformBars.innerHTML=waveformForPeaks(row._composeWaveformPeaks,buffer.duration);
          row.dataset.sourceDuration=String(buffer.duration);
          const composeTimeline=row.closest('.compose-timeline');
          const trackModel=composeTimeline?._composeModel?.tracks.get(row.dataset.trackId);
          if(trackModel)trackModel.sourceDuration=buffer.duration;
          composeTimeline?._updateCompositionGeometry?.();
        }finally{
          await context.close().catch(()=>{});
        }
      }catch(error){
        waveformBars.innerHTML='';
        console.warn('compose_real_waveform_error',error);
      }
    };
    loadRealWaveform();

    const composeTimeline=row.closest('.compose-timeline');
    composeTimeline?._composeModel?.tracks.set(row.dataset.trackId,{
      id:row.dataset.trackId,
      type,
      assetId:asset.id||null,
      startSeconds:0,
      sourceDuration:Number(row.dataset.assetDuration||30)||30,
      trimIn:0,
      trimOut:0,
      row
    });
    composeTimeline?._updateCompositionGeometry?.();

    let addButton=canvas.querySelector('.compose-add-track-inline');
    if(!addButton){
      addButton=document.createElement('button');
      addButton.type='button';
      addButton.className='compose-add-track compose-add-track-inline';
      addButton.textContent='+ Add Track';
      addButton.addEventListener('click',openComposeTrackModal);
      canvas.appendChild(addButton);
    }

    const audio=row.querySelector('.compose-track-audio');
    const play=row.querySelector('.compose-track-play');
    const wave=row.querySelector('.compose-track-wave');
    const playhead=row.querySelector('.compose-track-playhead');
    const region=row.querySelector('.compose-track-region');
    const moveHandle=row.querySelector('.compose-track-move');
    const trimInHandle=row.querySelector('[data-compose-trim="in"]');
    const trimOutHandle=row.querySelector('[data-compose-trim="out"]');
    const trimReadout=row.querySelector('.compose-track-trim-readout');
    const fadeInIndicator=row.querySelector('.compose-track-fade-indicator.in');
    const fadeOutIndicator=row.querySelector('.compose-track-fade-indicator.out');
    const volume=row.querySelector('.compose-track-volume input');
    const fadeIn=row.querySelector('[data-compose-fade="in"]');
    const fadeOut=row.querySelector('[data-compose-fade="out"]');
    const fadeInValue=row.querySelector('[data-compose-fade-value="in"]');
    const fadeOutValue=row.querySelector('[data-compose-fade-value="out"]');
    const mute=row.querySelector('[data-compose-mute]');
    const solo=row.querySelector('[data-compose-solo]');
    const deleteTrackButton=row.querySelector('[data-compose-delete]');
    const selectTrack=()=>{
      list.querySelectorAll('.compose-track-editor').forEach(item=>item.classList.toggle('selected',item===row));
    };
    row.querySelector('.compose-track-identity')?.addEventListener('click',event=>{
      if(event.target.closest('.compose-track-play'))return;
      selectTrack();
    });
    row.dataset.fadeIn='0';
    row.dataset.fadeOut='0';
    const baseVolume=()=>Math.max(0,Math.min(1,Number(volume?.value||100)/100));
    const renderFadeValues=()=>{
      const fadeInSeconds=Math.min(10,Math.max(0,Number(row.dataset.fadeIn||0)));
      const fadeOutSeconds=Math.min(10,Math.max(0,Number(row.dataset.fadeOut||0)));
      if(fadeInValue)fadeInValue.textContent=fadeInSeconds.toFixed(1)+'s';
      if(fadeOutValue)fadeOutValue.textContent=fadeOutSeconds.toFixed(1)+'s';
    };
    const applyPlaybackGain=()=>{
      if(!audio)return;
      const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:sourceDuration();
      const trimInSeconds=Number(row.dataset.trimIn||0)*duration;
      const trimOutSeconds=Number(row.dataset.trimOut||0)*duration;
      const effectiveDuration=Math.max(0.01,duration-trimInSeconds-trimOutSeconds);
      const position=Math.max(0,audio.currentTime-trimInSeconds);
      const inSeconds=Math.min(Number(row.dataset.fadeIn||0),effectiveDuration);
      const outSeconds=Math.min(Number(row.dataset.fadeOut||0),effectiveDuration);
      let gain=1;
      if(inSeconds>0&&position<inSeconds)gain=Math.min(gain,position/inSeconds);
      if(outSeconds>0&&position>effectiveDuration-outSeconds)gain=Math.min(gain,Math.max(0,(effectiveDuration-position)/outSeconds));
      audio.volume=baseVolume()*gain;
    };
    volume?.addEventListener('input',()=>applyPlaybackGain());
    fadeIn?.addEventListener('input',()=>{row.dataset.fadeIn=String(Number(fadeIn.value)||0);renderFadeValues();renderTrim();applyPlaybackGain();});
    fadeOut?.addEventListener('input',()=>{row.dataset.fadeOut=String(Number(fadeOut.value)||0);renderFadeValues();renderTrim();applyPlaybackGain();});
    const renderPlayhead=()=>{
      if(!playhead)return;
      const duration=Number.isFinite(audio?.duration)&&audio.duration>0?audio.duration:sourceDuration();
      const trimIn=Number(row.dataset.trimIn||0);
      const trimOut=Number(row.dataset.trimOut||0);
      const effectiveDuration=Math.max(0.01,duration*(1-trimIn-trimOut));
      const position=Math.max(0,Math.min(effectiveDuration,(Number(audio?.currentTime||0)-trimIn*duration)));
      const ratio=Math.max(0,Math.min(1,(trimIn*duration+position)/duration));
      playhead.style.setProperty('--playhead',String(ratio*100)+'%');
    };
    audio?.addEventListener('timeupdate',()=>{
      applyPlaybackGain();
      const composeTimeline=row.closest('.compose-timeline');
      if(!composeTimeline?._isPlayAllRunning?.())renderPlayhead();
    });
    const seekFromPointer=event=>{
      const composeTimeline=row.closest('.compose-timeline');
      if(composeTimeline?._isPlayAllRunning?.())return;
      if(!audio||event.target.closest('.compose-track-trim-handle'))return;
      const rect=wave.getBoundingClientRect();
      if(!rect.width)return;
      const ratio=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
      const duration=Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:sourceDuration();
      const trimIn=Number(row.dataset.trimIn||0);
      const trimOut=Number(row.dataset.trimOut||0);
      const start=trimIn*duration;
      const end=Math.max(start+0.01,(1-trimOut)*duration);
      audio.currentTime=start+(end-start)*ratio;
      renderPlayhead();
      applyPlaybackGain();
    };
    let scrubbing=false;
    wave?.addEventListener('pointerdown',event=>{
      const composeTimeline=row.closest('.compose-timeline');
      if(composeTimeline?._isPlayAllRunning?.())return;
      if(event.target.closest('.compose-track-trim-handle'))return;
      scrubbing=true;
      wave.classList.add('scrubbing');
      wave.setPointerCapture?.(event.pointerId);
      seekFromPointer(event);
    });
    wave?.addEventListener('pointermove',event=>{if(scrubbing)seekFromPointer(event);});
    wave?.addEventListener('pointerup',event=>{
      if(!scrubbing)return;
      scrubbing=false;
      wave.classList.remove('scrubbing');
      try{wave.releasePointerCapture?.(event.pointerId);}catch{}
    });
    wave?.addEventListener('pointercancel',()=>{scrubbing=false;wave.classList.remove('scrubbing');});
    mute?.addEventListener('click',()=>{
      if(!audio)return;
      audio.muted=!audio.muted;
      row.classList.toggle('muted',audio.muted);
      mute.classList.toggle('active',audio.muted);
      mute.textContent=audio.muted?'Muted':'Mute';
      mute.setAttribute('aria-pressed',String(audio.muted));
      mute.setAttribute('title',audio.muted?'Unmute track':'Mute track');
      applyPlaybackGain();
    });
    const syncSoloState=()=>{
      const soloRows=[...list.querySelectorAll('.compose-track-editor')].filter(item=>item.querySelector('[data-compose-solo]')?.classList.contains('active'));
      const soloRow=soloRows[0]||null;
      list.querySelectorAll('.compose-track-editor').forEach(item=>{
        const itemSolo=item.querySelector('[data-compose-solo]');
        const itemAudio=item.querySelector('.compose-track-audio');
        if(!itemSolo)return;
        const isSolo=item===soloRow;
        itemSolo.setAttribute('aria-pressed',String(isSolo));
        itemSolo.title=isSolo?'Disable solo':'Solo track';
        if(soloRow){
          if(isSolo){
            item.classList.remove('solo-muted');
            if(itemAudio)itemAudio.muted=false;
          }else{
            item.classList.add('solo-muted');
            if(itemAudio)itemAudio.muted=true;
          }
        }else{
          item.classList.remove('solo-muted');
          if(itemAudio){
            const muteButton=item.querySelector('[data-compose-mute]');
            itemAudio.muted=!!muteButton?.classList.contains('active');
          }
        }
      });
    };
    deleteTrackButton?.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      const composeTimeline=row.closest('.compose-timeline');
      composeTimeline?._stopAll?.();
      audio?.pause();
      try{if(audio)audio.currentTime=0;}catch(error){console.warn('compose_delete_reset_error',error);}
      composeTimeline?._composeModel?.tracks.delete(row.dataset.trackId);
      row.remove();
      syncComposeExportButton();
      composeTimeline?._updateCompositionGeometry?.();
      composeTimeline?._syncPlayAllButton?.();
    });
    solo?.addEventListener('click',()=>{
      const wasActive=solo.classList.contains('active');
      list.querySelectorAll('[data-compose-solo]').forEach(other=>other.classList.remove('active'));
      solo.classList.toggle('active',!wasActive);
      syncSoloState();
    });
    const syncPlayButton=()=>{
      if(!play)return;
      const active=!!audio&&!audio.paused;
      play.classList.toggle('active',active);
      play.textContent=active?'❚❚':'▶';
      play.setAttribute('aria-label',active?'Pause track':'Play track');
      play.setAttribute('title',active?'Pause track':'Play track');
      play.disabled=false;
    };
    const togglePlayback=async()=>{
      const composeTimeline=row.closest('.compose-timeline');
      if(composeTimeline?._isPlayAllRunning?.())return;
      if(!audio){
        console.warn('compose_track_no_audio_url',asset);
        return;
      }
      if(audio.paused){
        try{
          if(audio.readyState===0)audio.load();
          await audio.play();
          wave.classList.add('playing');
          syncPlayButton();
        }catch(error){
          console.warn('compose_track_play_error',error);
          syncPlayButton();
        }
      }else{
        audio.pause();
        wave.classList.remove('playing');
        syncPlayButton();
      }
    };
    syncPlayButton();
    play?.addEventListener('click',event=>{event.stopPropagation();togglePlayback();});
    audio?.addEventListener('play',()=>{syncPlayButton();row.closest('.compose-timeline')?._syncPlayAllButton?.();});
    audio?.addEventListener('pause',()=>{wave.classList.remove('playing');syncPlayButton();row.closest('.compose-timeline')?._syncPlayAllButton?.();});
    audio?.addEventListener('error',()=>{syncPlayButton();row.closest('.compose-timeline')?._syncPlayAllButton?.();console.warn('compose_track_audio_error',audio.currentSrc||assetUrl);});
    row.querySelector('.compose-track-identity')?.addEventListener('dblclick',event=>{if(!event.target.closest('button'))togglePlayback();});
    audio?.addEventListener('loadedmetadata',()=>{
      if(Number.isFinite(audio.duration)&&audio.duration>0){
        row.dataset.sourceDuration=String(audio.duration);
        const waveformBars=row.querySelector('.compose-track-wave-bars');
        const composeTimeline=row.closest('.compose-timeline');
        const trackModel=composeTimeline?._composeModel?.tracks.get(row.dataset.trackId);
        if(trackModel)trackModel.sourceDuration=audio.duration;
        composeTimeline?._updateCompositionGeometry?.();
      }
      renderTrim();
      const composeTimeline=row.closest('.compose-timeline');
      if(!composeTimeline?._isPlayAllRunning?.())renderPlayhead();
    });
    audio?.addEventListener('ended',()=>{
      wave.classList.remove('playing');
      const composeTimeline=row.closest('.compose-timeline');
      if(!composeTimeline?._isPlayAllRunning?.())renderPlayhead();
      composeTimeline?._syncPlayAllButton?.();
    });

    row.dataset.trimIn='0';
    row.dataset.trimOut='0';
    const formatTrimTime=seconds=>formatComposeTime(seconds);
    const sourceDuration=()=>Math.max(0.01,Number(row.dataset.sourceDuration||asset.durationSeconds||asset.duration||30)||30);
    const renderTrim=()=>{
      const trimIn=Math.max(0,Math.min(.98,Number(row.dataset.trimIn||0)));
      const trimOut=Math.max(0,Math.min(.98,Number(row.dataset.trimOut||0)));
      wave?.style.setProperty('--trim-left',String(trimIn*100)+'%');
      wave?.style.setProperty('--trim-right',String(trimOut*100)+'%');
      const duration=sourceDuration();
      const visibleRatio=Math.max(.02,1-trimIn-trimOut);
      const fadeInSeconds=Math.min(Number(row.dataset.fadeIn||0),duration*visibleRatio);
      const fadeOutSeconds=Math.min(Number(row.dataset.fadeOut||0),duration*visibleRatio);
      const fadeInRatio=Math.min(visibleRatio,fadeInSeconds/duration);
      const fadeOutRatio=Math.min(visibleRatio,fadeOutSeconds/duration);
      const fadeInLeft=trimIn*100;
      const fadeOutRight=trimOut*100;
      wave?.style.setProperty('--fade-in-left',String(fadeInLeft)+'%');
      wave?.style.setProperty('--fade-in-width',String(fadeInRatio*100)+'%');
      wave?.style.setProperty('--fade-out-right',String(fadeOutRight)+'%');
      wave?.style.setProperty('--fade-out-width',String(fadeOutRatio*100)+'%');
      if(trimReadout)trimReadout.textContent='Trim '+formatTrimTime(trimIn*duration)+' – '+formatTrimTime((1-trimOut)*duration);
      if(trimInHandle)trimInHandle.title='Trim start: '+formatTrimTime(trimIn*duration);
      if(trimOutHandle)trimOutHandle.title='Trim end: '+formatTrimTime((1-trimOut)*duration);
    };
    const beginTrim=(side,event)=>{
      const composeTimeline=row.closest('.compose-timeline');
      if(composeTimeline?._isPlayAllRunning?.())return;
      if(event.button!==0)return;
      event.preventDefault();
      event.stopPropagation();
      const rect=wave.getBoundingClientRect();
      const startIn=Number(row.dataset.trimIn||0);
      const startOut=Number(row.dataset.trimOut||0);
      const minGap=.02;
      row.classList.add('trimming');
      const moveTrim=moveEvent=>{
        const width=Math.max(1,rect.width);
        const ratio=Math.max(0,Math.min(1,(moveEvent.clientX-rect.left)/width));
        if(side==='in'){
          const next=Math.min(1-startOut-minGap,ratio);
          const value=Math.max(0,next);
          row.dataset.trimIn=String(value);
          const composeTimeline=row.closest('.compose-timeline');
          const trackModel=composeTimeline?._composeModel?.tracks.get(row.dataset.trackId);
          if(trackModel)trackModel.trimIn=value;
        }else{
          const next=Math.min(1-startIn-minGap,1-ratio);
          const value=Math.max(0,next);
          row.dataset.trimOut=String(value);
          const composeTimeline=row.closest('.compose-timeline');
          const trackModel=composeTimeline?._composeModel?.tracks.get(row.dataset.trackId);
          if(trackModel)trackModel.trimOut=value;
        }
        renderTrim();
        row.closest('.compose-timeline')?._updateCompositionGeometry?.();
      };
      const endTrim=()=>{
        row.classList.remove('trimming');
        window.removeEventListener('mousemove',moveTrim);
        window.removeEventListener('mouseup',endTrim);
      };
      window.addEventListener('mousemove',moveTrim);
      window.addEventListener('mouseup',endTrim);
    };
    trimInHandle?.addEventListener('mousedown',event=>beginTrim('in',event));
    trimOutHandle?.addEventListener('mousedown',event=>beginTrim('out',event));
    const timelineGeometry=()=>{
      const composeTimeline=row.closest('.compose-timeline');
      const model=composeTimeline?._composeModel;
      const scale=composeTimeline?.querySelector('.compose-timeline-scale');
      const pixelsPerSecond=Math.max(1,Number(model?.pixelsPerSecond)||24);
      const maxSeconds=Math.max(Number(model?.duration)||30,Number(model?.minDuration)||30);
      const width=Math.max(720,maxSeconds*pixelsPerSecond);
      const rect=scale?.getBoundingClientRect();
      return {left:rect?.left||0,width,maxSeconds,pixelsPerSecond};
    };
    const applyStart=seconds=>{
      const composeTimeline=row.closest('.compose-timeline');
      if(composeTimeline?._isPlayAllRunning?.())return;
      const model=composeTimeline?._composeModel;
      const grid=0.25;
      const requested=Math.max(0,Number(seconds)||0);
      const snapped=Math.round(requested/grid)*grid;
      row.dataset.startSeconds=String(snapped);
      const geometry=timelineGeometry();
      const trackWidth=Math.max(24,sourceDuration()*geometry.pixelsPerSecond);
      region.style.marginLeft=`${snapped*geometry.pixelsPerSecond}px`;
      region.style.width=`${trackWidth}px`;
      region.style.maxWidth='none';
      const guide=row.querySelector('.compose-track-time-guide');
      if(guide)guide.textContent=`Start ${formatComposeTime(snapped)}`;
      const trackModel=model?.tracks.get(row.dataset.trackId);
      if(trackModel)trackModel.startSeconds=snapped;
      composeTimeline?._updateCompositionGeometry?.();
    };
    let dragStartX=0;
    let dragStartSeconds=0;
    let dragging=false;
    const beginDrag=event=>{
      if(event.button!==0)return;
      dragging=true;
      dragStartX=event.clientX;
      dragStartSeconds=Number(row.dataset.startSeconds||0);
      row.classList.add('dragging');
      event.preventDefault();
    };
    const moveDrag=event=>{
      if(!dragging)return;
      const geometry=timelineGeometry();
      const dx=event.clientX-dragStartX;
      const targetSeconds=dragStartSeconds+(dx/geometry.pixelsPerSecond);
      applyStart(targetSeconds);
    };
    const endDrag=()=>{
      if(!dragging)return;
      dragging=false;
      row.classList.remove('dragging');
    };
    moveHandle?.addEventListener('mousedown',event=>{event.stopPropagation();beginDrag(event);});
    window.addEventListener('mousemove',moveDrag);
    window.addEventListener('mouseup',endDrag);
    region?.addEventListener('click',()=>selectTrack());

    applyStart(Number(row.dataset.startSeconds||0));
    renderTrim();
    renderFadeValues();
    applyPlaybackGain();
  }

  function formatComposeTime(seconds){
    const value=Math.max(0,Number(seconds)||0);
    const minutes=Math.floor(value/60);
    const secs=(value%60).toFixed(2).padStart(5,'0');
    return `${minutes}:${secs}`;
  }

  function labelForComposeType(type){
    return ({voice:'Voice',sound:'Sound',sfx:'SFX',ambience:'Ambience',music:'Music',composition:'Composition'})[type]||type;
  }

  function setActive(active){
    [homeLink,voiceLink,soundLink,videoLink,composeLink,libraryLink].filter(Boolean).forEach(link=>link.classList.remove('active'));
    const link=({studio:homeLink,voice:voiceLink,sound:soundLink,video:videoLink,compose:composeLink,library:libraryLink})[active];
    if(link)link.classList.add('active');
  }

  let activeWorkspaceView='studio';

  function show(view,updateHash=true){
    if(activeWorkspaceView==='compose')composeWorkspace.querySelector('.compose-timeline')?._stopAll?.();
    activeWorkspaceView=view;
    if(updateHash)history.replaceState(null,'',view==='studio'?'#studio':`#${view}`);
    landing.hidden=view!=='studio';
    voiceView.hidden=view!=='voice';
    soundView.hidden=view!=='sound';
    soundHistory.hidden=view!=='sound';
    libraryView.hidden=view!=='library';

    // Compose is mounted once and then only hidden/shown. Its tracks, audio elements,
    // composition model, scroll position and editing state therefore survive workspace navigation.
    composeWorkspace.hidden=view!=='compose';
    placeholder.hidden=view!=='video';

    if(view==='compose'&&composeWorkspace.dataset.initialized!=='1'){
      composeWorkspace.innerHTML=`<div class="compose-head"><div class="compose-head-copy"><small>COMPOSE</small><h2>Create your composition</h2><p>Combine Voice, Sound, SFX, Ambience and more into one composition.</p></div><div class="compose-head-actions"><button class="compose-export-trigger" type="button" data-compose-export disabled>COMPOSE &amp; EXPORT</button></div></div><div class="compose-canvas"><div class="compose-empty"><p>Import audio assets into your composition one track at a time.</p><button class="compose-add-track" type="button">+ Add Track</button></div></div>`;
      composeWorkspace.querySelector('.compose-add-track')?.addEventListener('click',openComposeTrackModal);
      composeWorkspace.querySelector('[data-compose-export]')?.addEventListener('click',openComposeExportModal);
      syncComposeExportButton();
      composeWorkspace.dataset.initialized='1';
    }else if(view==='video'){
      placeholder.className='studio-domain-placeholder';
      placeholder.innerHTML=`<div class="placeholder-panel"><small>VIDEO</small><h2>Video workspace</h2><p>This workspace is being built as an independent SvaraONE domain. The Studio landing page is ready for it.</p></div>`;
    }
    setActive(view);
    if(view==='library')window.SvaraLibrary?.refresh?.();
    if(view==='sound')loadSoundHistory();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  const soundHistoryList=document.getElementById('soundHistoryList');
  const soundHistoryRefresh=document.getElementById('soundHistoryRefresh');
  const soundHistorySearch=document.getElementById('soundHistorySearch');
  const soundHistoryType=document.getElementById('soundHistoryType');
  const soundHistoryFormat=document.getElementById('soundHistoryFormat');
  const soundHistorySource=document.getElementById('soundHistorySource');
  const soundHistoryStatus=document.getElementById('soundHistoryStatus');
  const soundHistoryDate=document.getElementById('soundHistoryDate');
  const soundHistoryFolder=document.getElementById('soundHistoryFolder');
  const soundHistoryPrev=document.getElementById('soundHistoryPrev');
  const soundHistoryNext=document.getElementById('soundHistoryNext');
  const soundHistoryPageInfo=document.getElementById('soundHistoryPageInfo');
  let soundHistoryPage=1;
  let soundHistoryLoading=false;

  const escapeHistory=value=>String(value??'').replace(/[&<>\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const formatHistoryDate=value=>{if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat(undefined,{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(d);};
  const formatHistoryDuration=value=>{const s=Math.max(0,Math.round(Number(value)||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
  const setHistoryOptions=(select,values,labels={})=>{if(!select)return;const current=select.value;const label=select===soundHistoryType?'types':'formats';select.innerHTML=`<option value="">All ${label}</option>`;values.forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=labels[value]||String(value).toUpperCase();select.appendChild(option);});if(values.includes(current))select.value=current;};
  const loadSoundHistoryFolders=async()=>{try{const response=await fetch("/api/generations/folders",{credentials:"same-origin",cache:"no-store",headers:{accept:"application/json"}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"folders unavailable");const current=soundHistoryFolder?.value||"";if(soundHistoryFolder){soundHistoryFolder.innerHTML="<option value=\"\">All folders</option><option value=\"__unfiled__\">Unfiled</option>"+(Array.isArray(data.folders)?data.folders.map(folder=>"<option value=\""+escapeHistory(folder.id)+"\">"+escapeHistory(folder.name)+"</option>").join(""):"");if(current)soundHistoryFolder.value=current;}}catch(error){if(soundHistoryFolder)soundHistoryFolder.innerHTML="<option value=\"\">All folders</option><option value=\"__unfiled__\">Unfiled</option>";}};
  const loadSoundCapabilities=async()=>{try{const response=await fetch('/api/sound/capabilities',{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});if(!response.ok)throw new Error('capabilities unavailable');const data=await response.json();const capabilities=data?.capabilities||{};setHistoryOptions(soundHistoryType,Array.isArray(capabilities.types)?capabilities.types:[],{soundtrack:'Soundtrack'});setHistoryOptions(soundHistoryFormat,Array.isArray(capabilities.outputFormats)?capabilities.outputFormats:[]);}catch(error){setHistoryOptions(soundHistoryType,[]);setHistoryOptions(soundHistoryFormat,[]);}};
  const loadSoundHistory=async()=>{
    if(!soundHistoryList||soundHistoryLoading)return;
    soundHistoryLoading=true;
    soundHistoryList.innerHTML='<div class="sound-history-state"><strong>Loading Sound history…</strong><span>Retrieving your saved generations.</span></div>';
    const params=new URLSearchParams({limit:'20',page:String(soundHistoryPage)});
    [[soundHistorySearch,'search'],[soundHistoryType,'type'],[soundHistoryFormat,'format'],[soundHistorySource,'sourceType'],[soundHistoryStatus,'status'],[soundHistoryDate,'date'],[soundHistoryFolder,'folderId']].forEach(([control,key])=>{const value=String(control?.value||'').trim();if(value)params.set(key,value);});
    try{
      const response=await fetch(`/api/sound/generations?${params.toString()}`,{credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
      const data=await response.json().catch(()=>({}));
      if(response.status===401){window.location.replace('/login.html?next=/studio');return;}
      if(!response.ok)throw new Error(data.error||`Sound history unavailable (${response.status})`);
      const items=Array.isArray(data.generations)?data.generations:[];
      const pageCount=Number(data.pageCount||0);
      if(soundHistoryPageInfo)soundHistoryPageInfo.textContent=pageCount?`Page ${data.page} of ${pageCount} · ${data.total} total`:'No results';
      if(soundHistoryPrev)soundHistoryPrev.disabled=!data.hasPrevious;
      if(soundHistoryNext)soundHistoryNext.disabled=!data.hasNext;
      if(!items.length){soundHistoryList.innerHTML='<div class="sound-history-state"><strong>No matching Sound generations</strong><span>Try changing your search or filters.</span></div>';return;}
      soundHistoryList.innerHTML=items.map(item=>{const prompt=item.prompt?escapeHistory(item.prompt):'No prompt recorded';const source=item.sourceType==='voice'?'Existing Voice':item.sourceType?escapeHistory(item.sourceType):'Direct';return `<article class="sound-history-item"><div class="sound-history-main"><strong>${escapeHistory(item.type||'Sound generation')}</strong><small title="${prompt}">${prompt}</small></div><span class="sound-history-meta">${formatHistoryDuration(item.durationSeconds)}</span><span class="sound-history-meta">${escapeHistory(String(item.format||'').toUpperCase())}</span><span class="sound-history-meta">${escapeHistory(source)}</span><span class="sound-history-meta">${escapeHistory(item.folderName||"Unfiled")}</span><span class="sound-history-status ${escapeHistory(item.status)}">${escapeHistory(item.status)}</span><span class="sound-history-meta">${formatHistoryDate(item.createdAt)}</span><div class="sound-history-actions"><button class="sound-history-play" type="button" data-sound-history-play="${escapeHistory(item.id)}" data-sound-history-url="${escapeHistory(item.assetUrl||"")}" ${item.status!=="ready"||!item.assetUrl?"disabled":""} aria-label="Play Sound">${item.status==="ready"&&item.assetUrl?"▶":"—"}</button><button class="sound-history-download" type="button" data-sound-history-download="${escapeHistory(item.id)}" data-sound-history-url="${escapeHistory(item.assetUrl||"")}" data-sound-history-format="${escapeHistory(item.format||"mp3")}" data-sound-history-created-at="${escapeHistory(item.createdAt||"")}" ${item.status!=="ready"||!item.assetUrl?"disabled":""} aria-label="Download Sound">↓</button><button class="sound-history-move" type="button" data-sound-history-move="${escapeHistory(item.id)}" data-sound-history-folder-id="${escapeHistory(item.folderId||"")}" aria-label="Move Sound">↗</button></div></article>`;}).join('');
      bindSoundHistoryPlayback();bindSoundHistoryDownloads();bindSoundHistoryMoves();
    }catch(error){soundHistoryList.innerHTML=`<div class="sound-history-state"><strong>Could not load Sound history</strong><span>${escapeHistory(error?.message||'Please try again.')}</span></div>`;}
    finally{soundHistoryLoading=false;}
  };
  let soundHistoryAudio=null;
  let soundHistoryPlayingButton=null;
  const stopSoundHistoryAudio=()=>{
    if(soundHistoryAudio){soundHistoryAudio.pause();soundHistoryAudio.removeAttribute("src");soundHistoryAudio.load();soundHistoryAudio.remove();soundHistoryAudio=null;}
    if(soundHistoryPlayingButton){soundHistoryPlayingButton.textContent="▶";soundHistoryPlayingButton=null;}
  };
  const ensureSoundMoveStyles=()=>{if(document.getElementById("sound-history-move-styles"))return;const style=document.createElement("style");style.id="sound-history-move-styles";style.textContent=`.sound-move-modal{position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;padding:24px}.sound-move-backdrop{position:absolute;inset:0;background:#0009;backdrop-filter:blur(4px)}.sound-move-dialog{position:relative;width:min(430px,calc(100vw - 32px));padding:20px;background:#081522;border:1px solid #ffffff16;border-radius:14px;box-shadow:0 24px 70px #000b;color:#b9c8d6}.sound-move-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.sound-move-eyebrow{margin:0;color:#31e3c8;font-size:9px;letter-spacing:.14em}.sound-move-head h3{margin:5px 0 0;color:#e7eef5;font-size:17px}.sound-move-close{width:30px;height:30px;border:1px solid #ffffff10;border-radius:8px;background:#0b1b29;color:#91a5b7;font-size:20px;line-height:1;cursor:pointer}.sound-move-body{margin:18px 0}.sound-move-label{display:block;margin-bottom:7px;color:#9fb2c5;font-size:11px}.sound-move-select{box-sizing:border-box;width:100%;padding:11px 12px;border:1px solid #ffffff14;border-radius:9px;background:#07121d;color:#dbe6ef;outline:none;font:inherit;font-size:12px}.sound-move-create{margin-top:10px;width:100%;padding:10px 12px;border:1px solid #31e3c855;border-radius:9px;background:#0d2930;color:#31e3c8;font:inherit;font-size:11px;cursor:pointer}.sound-move-create:hover{background:#10363e}.sound-move-help{margin:9px 0 0;color:#71879a;font-size:11px;line-height:1.5}.sound-move-error{margin-top:9px;color:#ff8d8d;font-size:11px}.sound-move-actions{display:flex;justify-content:flex-end;gap:9px}.sound-move-button{padding:9px 14px;border:1px solid #ffffff12;border-radius:8px;background:#0b1b29;color:#9fb2c5;font:inherit;font-size:11px;cursor:pointer}.sound-move-button.primary{background:#0d2930;border-color:#31e3c855;color:#31e3c8}.sound-move-button:disabled{opacity:.55;cursor:default}`;document.head.appendChild(style);};
  const openSoundMoveModal=async (generationId,currentFolderId="")=>{ensureSoundMoveStyles();const folderResponse=await fetch("/api/generations/folders",{credentials:"same-origin",cache:"no-store",headers:{accept:"application/json"}});const folderData=await folderResponse.json().catch(()=>({}));if(!folderResponse.ok)throw new Error(folderData.error||"Could not load folders.");let folders=Array.isArray(folderData.folders)?folderData.folders:[];folders=folders.filter(folder=>String(folder.id)!==String(currentFolderId||""));let selectedFolderId=null;let modal=null;const close=()=>{modal?.remove();modal=null;};const render=()=>{modal?.querySelector(".sound-move-body")?.replaceChildren();const body=modal.querySelector(".sound-move-body");const label=document.createElement("label");label.className="sound-move-label";label.textContent="Move to existing folder";label.htmlFor="soundMoveFolder";const select=document.createElement("select");select.id="soundMoveFolder";select.className="sound-move-select";select.innerHTML='<option value="">Unfiled</option>'+folders.map(folder=>`<option value="${escapeHistory(folder.id)}">${escapeHistory(folder.name)}</option>`).join("");if(selectedFolderId)select.value=selectedFolderId;const create=document.createElement("button");create.type="button";create.className="sound-move-create";create.textContent="+ Create New Folder";create.addEventListener("click",()=>showCreate());const help=document.createElement("p");help.className="sound-move-help";help.textContent="Choose an existing My Library folder, or create a new folder and move this Sound into it.";body.append(label,select,create,help);};const showCreate=()=>{const body=modal.querySelector(".sound-move-body");body.innerHTML='<label class="sound-move-label" for="soundMoveNewFolder">New folder name</label><input id="soundMoveNewFolder" class="sound-move-select" type="text" maxlength="80" autocomplete="off" placeholder="e.g. Client projects"><p class="sound-move-help">Create the folder first. It will then be selected as the destination for this Sound.</p>';const input=body.querySelector("input");const createButton=document.createElement("button");createButton.type="button";createButton.className="sound-move-create";createButton.dataset.soundMoveCreateConfirm="true";createButton.textContent="Create folder";createButton.addEventListener("click",createFolder);const back=document.createElement("button");back.type="button";back.className="sound-move-create";back.textContent="← Back to folders";back.addEventListener("click",render);body.append(createButton,back);input.focus();};const createFolder=async()=>{const input=modal.querySelector("#soundMoveNewFolder");const name=input?.value?.trim()||"";if(!name){input?.focus();return;}const button=modal.querySelector("[data-sound-move-create-confirm]");button.disabled=true;try{const response=await fetch("/api/generations/folders",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json",accept:"application/json"},body:JSON.stringify({name})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Could not create folder.");folders.push({id:data.folder.id,name:data.folder.name});selectedFolderId=data.folder.id;render();}catch(error){const old=modal.querySelector(".sound-move-error");if(old)old.remove();modal.querySelector(".sound-move-body")?.insertAdjacentHTML("beforeend",`<div class="sound-move-error">${escapeHistory(error?.message||"Could not create folder.")}</div>`);button.disabled=false;}};const confirm=async()=>{const select=modal.querySelector("#soundMoveFolder");const folderId=select?.value||null;const button=modal.querySelector("[data-sound-move-confirm]");button.disabled=true;try{const response=await fetch("/api/sound/generations/move",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json",accept:"application/json"},body:JSON.stringify({generationId,folderId})});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"Could not move Sound.");close();loadSoundHistory();}catch(error){button.disabled=false;const old=modal.querySelector(".sound-move-error");if(old)old.remove();modal.querySelector(".sound-move-body")?.insertAdjacentHTML("beforeend",`<div class="sound-move-error">${escapeHistory(error?.message||"Could not move Sound.")}</div>`);}};modal=document.createElement("div");modal.className="sound-move-modal";modal.innerHTML='<div class="sound-move-backdrop"></div><section class="sound-move-dialog" role="dialog" aria-modal="true"><div class="sound-move-head"><div><p class="sound-move-eyebrow">MY LIBRARY</p><h3>Move Sound</h3></div><button type="button" class="sound-move-close" aria-label="Close">×</button></div><div class="sound-move-body"></div><div class="sound-move-actions"><button type="button" class="sound-move-button" data-sound-move-cancel>Cancel</button><button type="button" class="sound-move-button primary" data-sound-move-confirm>Move</button></div></section>';document.body.appendChild(modal);modal.querySelector(".sound-move-close").addEventListener("click",close);modal.querySelector(".sound-move-backdrop").addEventListener("click",close);modal.querySelector("[data-sound-move-cancel]").addEventListener("click",close);modal.querySelector("[data-sound-move-confirm]").addEventListener("click",confirm);render();};
  const bindSoundHistoryDownloads=()=>{soundHistoryList?.querySelectorAll("[data-sound-history-download]").forEach(button=>button.addEventListener("click",()=>{const url=button.dataset.soundHistoryUrl;if(!url)return;const extension=String(button.dataset.soundHistoryFormat||"mp3").toLowerCase().replace(/[^a-z0-9]/g,"")||"mp3";const link=document.createElement("a");link.href=url;const createdAt=button.dataset.soundHistoryCreatedAt?new Date(button.dataset.soundHistoryCreatedAt):new Date();const stamp=Number.isNaN(createdAt.getTime())?new Date():createdAt;const pad=value=>String(value).padStart(2,"0");const date=`${stamp.getFullYear()}-${pad(stamp.getMonth()+1)}-${pad(stamp.getDate())}`;const time=`${pad(stamp.getHours())}-${pad(stamp.getMinutes())}`;link.download=`svaraone-sound-${date}-${time}.${extension}`;link.rel="noopener";document.body.appendChild(link);link.click();link.remove();}));};
  const bindSoundHistoryMoves=()=>{soundHistoryList?.querySelectorAll("[data-sound-history-move]").forEach(button=>button.addEventListener("click",()=>openSoundMoveModal(button.dataset.soundHistoryMove,button.dataset.soundHistoryFolderId||"").catch(error=>console.error("Sound move dialog failed",error))));};
  const bindSoundHistoryPlayback=()=>{
    soundHistoryList?.querySelectorAll("[data-sound-history-play]").forEach(button=>button.addEventListener("click",()=>{
      const url=button.dataset.soundHistoryUrl;
      if(!url)return;
      if(soundHistoryPlayingButton===button){stopSoundHistoryAudio();return;}
      stopSoundHistoryAudio();
      const audio=document.createElement("audio");
      audio.preload="auto";
      audio.setAttribute("playsinline","");
      audio.src=url;
      document.body.appendChild(audio);
      soundHistoryAudio=audio;
      soundHistoryPlayingButton=button;
      button.textContent="❚❚";
      const fail=()=>{console.error("Sound history playback failed",audio.error?.code,audio.error?.message);stopSoundHistoryAudio();};
      audio.addEventListener("ended",stopSoundHistoryAudio,{once:true});
      audio.addEventListener("error",fail,{once:true});
      const playPromise=audio.play();
      if(playPromise?.catch)playPromise.catch(fail);
    }));
  };
  const resetSoundHistory=()=>{soundHistoryPage=1;loadSoundHistory();};
  soundHistoryRefresh?.addEventListener('click',()=>{soundHistoryPage=1;loadSoundHistory();loadSoundCapabilities();});
  soundHistoryPrev?.addEventListener('click',()=>{if(soundHistoryPage>1){soundHistoryPage-=1;loadSoundHistory();}});
  soundHistoryNext?.addEventListener('click',()=>{soundHistoryPage+=1;loadSoundHistory();});
  [soundHistoryType,soundHistoryFormat,soundHistorySource,soundHistoryStatus,soundHistoryDate,soundHistoryFolder].forEach(control=>control?.addEventListener('change',resetSoundHistory));
  soundHistorySearch?.addEventListener('input',()=>{clearTimeout(soundHistorySearch._timer);soundHistorySearch._timer=setTimeout(resetSoundHistory,250);});
  loadSoundCapabilities();
  loadSoundHistoryFolders();
  const soundPrompt=document.getElementById('soundPrompt');
  const soundPromptCount=document.getElementById('soundPromptCount');
  const soundInspire=document.getElementById('soundInspire');
  const soundGenerate=document.getElementById('soundGenerate');
  const soundResult=document.getElementById('soundResult');
  const soundEmpty=document.getElementById('soundEmpty');
  const soundWave=document.getElementById('soundWave');
  const soundPlay=document.getElementById('soundPlay');
  const soundFlowBadge=document.getElementById('soundFlowBadge');
  const soundAdvancedToggle=document.getElementById('soundAdvancedToggle');
  const soundAdvancedBody=document.getElementById('soundAdvancedBody');
  const soundTempo=document.getElementById('soundTempo');
  const soundTempoValue=document.getElementById('soundTempoValue');
  const soundIntensity=document.getElementById('soundIntensity');
  const soundIntensityValue=document.getElementById('soundIntensityValue');
  const soundComplexity=document.getElementById('soundComplexity');
  const soundComplexityValue=document.getElementById('soundComplexityValue');

  const updatePromptCount=()=>{if(soundPrompt&&soundPromptCount)soundPromptCount.textContent=`${soundPrompt.value.length.toLocaleString()} / 2,000`;};
  soundPrompt?.addEventListener('input',updatePromptCount);updatePromptCount();
  soundInspire?.addEventListener('click',()=>{if(soundPrompt){soundPrompt.value='A warm cinematic soundscape for a premium South African coffee advert — intimate café ambience, soft strings, subtle percussion and a confident emotional build.';updatePromptCount();soundPrompt.focus();}});
  soundView.querySelectorAll('[data-sound-type]').forEach(button=>button.addEventListener('click',()=>{soundView.querySelectorAll('[data-sound-type]').forEach(b=>b.classList.remove('active'));button.classList.add('active');}));
  soundView.querySelectorAll('.sound-mood').forEach(button=>button.addEventListener('click',()=>{soundView.querySelectorAll('.sound-mood').forEach(b=>b.classList.remove('active'));button.classList.add('active');}));
  soundTempo?.addEventListener('input',()=>{soundTempoValue.textContent=`${soundTempo.value} BPM`;});
  soundIntensity?.addEventListener('input',()=>{const v=Number(soundIntensity.value);soundIntensityValue.textContent=v<34?'Low':v<67?'Medium':'High';});
  soundComplexity?.addEventListener('input',()=>{const v=Number(soundComplexity.value);soundComplexityValue.textContent=v<34?'Simple':v<67?'Balanced':'Dense';});
  const toggleAdvanced=()=>{const open=soundAdvancedBody.hidden;soundAdvancedBody.hidden=!open;soundAdvancedToggle.setAttribute('aria-expanded',String(open));soundAdvancedToggle.lastElementChild.textContent=open?'HIDE −':'SHOW +';};
  soundAdvancedToggle?.addEventListener('click',toggleAdvanced);soundAdvancedToggle?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleAdvanced();}});
  soundGenerate?.addEventListener('click',()=>{soundGenerate.disabled=true;soundGenerate.textContent='Generating preview…';setTimeout(()=>{soundEmpty.style.display='none';soundResult.classList.add('show');soundGenerate.disabled=false;soundGenerate.textContent='Generate Sound';},850);});
  soundPlay?.addEventListener('click',()=>{soundWave.classList.toggle('playing');soundPlay.setAttribute('aria-label',soundWave.classList.contains('playing')?'Pause sound':'Play sound');});
  soundView.querySelectorAll('.sound-mini-play').forEach(button=>button.addEventListener('click',()=>{button.textContent=button.textContent==='▶'?'Ⅱ':'▶';}));

  homeLink.addEventListener('click',e=>{e.preventDefault();show('studio');});
  voiceLink.addEventListener('click',e=>{e.preventDefault();show('voice');});
  soundLink?.addEventListener('click',e=>{e.preventDefault();show('sound');});
  videoLink?.addEventListener('click',e=>{e.preventDefault();show('video');});
  composeLink?.addEventListener('click',e=>{e.preventDefault();show('compose');});
  libraryLink.addEventListener('click',e=>{e.preventDefault();show('library');});
  landing.addEventListener('click',e=>{const card=e.target.closest('a[data-domain]');if(card){e.preventDefault();show(card.dataset.domain);return;}if(e.target.closest('.studio-compose-card')){e.preventDefault();show('compose');}});

  if(svaraFlowToggle){
    svaraFlowToggle.checked=true;
    svaraFlowToggle.dispatchEvent(new Event('change'));
    svaraFlowToggle.addEventListener('change',()=>{if(soundFlowBadge){soundFlowBadge.classList.toggle('off',!svaraFlowToggle.checked);soundFlowBadge.innerHTML=`<span class="sound-flow-dot"></span>SvaraFlow ${svaraFlowToggle.checked?'ON':'OFF'}`;}});
  }

  const initial=location.hash.replace(/^#/,'');
  show(['voice','sound','video','compose','library'].includes(initial)?initial:'studio',false);
})();